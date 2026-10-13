const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');

// Gabaritos conferidos com as imagens e com as correções pedagógicas aprovadas.
const answerIndices = [
  [0,3,2,2,2,1,0,3,3,1],
  [2,2,3,0,1,3,2,0,1,1],
  [0,3,1,2,0,3,1,3,0,2]
];

async function main() {
  const browser = await chromium.launch({headless:true,channel:process.env.ORBITA_BROWSER_CHANNEL || 'chrome'});
  try {
    const context = await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror',error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('orbita-sound-enabled','false'));
    await page.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    const missions = await page.evaluate(() => thirdGradeMissions.map((mission,index) => ({
      index,id:mission.missionId,title:mission.title,video:mission.video,
      questions:mission.questions.map(question => ({...question}))
    })).filter(mission => mission.id.startsWith('desafio-5-')));
    assert.equal(missions.length,3);
    const missionTotal = await page.evaluate(() => thirdGradeMissions.length);
    const ids = new Set();
    for (const [missionIndex,mission] of missions.entries()) {
      assert.equal(mission.questions.length,10);
      assert.ok(fs.existsSync(path.join(__dirname,'..',mission.video)),mission.video);
      for (const [questionIndex,question] of mission.questions.entries()) {
        assert.equal(question.type,'quiz');
        assert.equal(question.variant,'qt1');
        assert.equal(question.options.length,4);
        assert.equal(question.answer,question.options[answerIndices[missionIndex][questionIndex]],question.id);
        assert.ok(question.correct && question.incorrect && question.imageAlt,question.id);
        assert.ok(fs.existsSync(path.join(__dirname,'..',question.image)),question.image);
        ids.add(question.id);
      }
    }
    assert.equal(ids.size,30);
    assert.equal(new Date(Date.UTC(2026,6,15)).getUTCDay(),3);
    assert.equal(new Date(Date.UTC(2026,9,12)).getUTCDay(),1);
    assert.equal(Array.from({length:31},(_,i) => new Date(Date.UTC(2026,7,i + 1)))
      .filter(date => date.getUTCDay() === 6).length,5);
    assert.equal(new Date(Date.UTC(2026,8,1)).getUTCDay(),2);

    await page.evaluate(() => {
      localStorage.setItem('orbita-teacher-data:teste-espaco-tempo',JSON.stringify({
        classes:[{id:1,name:'Turma de teste',grade:3,code:'TEMPO-TESTE'}],
        students:[{id:1,name:'Teste Espaço Tempo',classId:1,track:3,coins:0,stars:0,
          correctAnswers:0,challengesAttempted:0,errors:[],journal:[],progress:80,additionPuzzleVersion:1,
          completedMissionIds:thirdGradeMissions.slice(0,12).map(mission => mission.missionId),
          completedChallengeIds:['desafio-1','desafio-2','desafio-3','desafio-4'],
          completedQuestionIds:[],lastDailyReward:localDateKey()}]
      }));
    });
    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Espaço Tempo');
      await page.locator('#auth-form [name="code"]').fill('TEMPO-TESTE');
      await page.locator('#auth-form button[type="submit"]').click();
      await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
    }
    const profile = () => page.evaluate(() => ({...currentStudent}));
    const options = page.locator('[data-challenge-answer]');
    const next = page.locator('[data-next-challenge]');
    const feedback = page.locator('[data-feedback-copy]');
    await login();
    assert.equal(await page.locator('[data-student-mission-total]').textContent(),`de ${missionTotal} missões`);
    await page.locator('[data-student-view="path"]').click();
    const group = page.locator('.challenge-path-group').filter({has:page.locator('header span',{hasText:'DESAFIO 5'})});
    assert.match(await group.locator('header').textContent(),/DESAFIO 5.*O espaço e o tempo/);
    assert.equal(await group.locator('.mission-node button').nth(0).isEnabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(1).isDisabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(2).isDisabled(),true);
    await page.evaluate(() => {
      currentStudent.completedMissionIds.pop();
      renderMissionPath();
    });
    assert.equal(await group.locator('.mission-node button').nth(0).isDisabled(),true);
    await page.evaluate(() => {
      currentStudent.completedMissionIds.push('desafio-4-missao-3');
      renderMissionPath();
    });
    await page.locator(`[data-student-mission="${missions[0].index}"]`).click();

    async function inspectImage(question) {
      const img = page.locator('[data-question-media] img');
      await img.evaluate(element => element.decode());
      assert.equal(await img.getAttribute('src'),question.image);
      assert.equal(await img.getAttribute('alt'),question.imageAlt);
      const bounds = await img.evaluate(element => ({
        width:element.getBoundingClientRect().width,height:element.getBoundingClientRect().height,
        naturalWidth:element.naturalWidth,naturalHeight:element.naturalHeight
      }));
      assert.ok(bounds.width > 150 && bounds.height > 180,`${question.id}: imagem legível`);
      assert.equal(await page.locator('.question-image-zoom').getAttribute('href'),question.image);
      assert.equal(await page.locator('.question-image-zoom').getAttribute('target'),'_blank');
      assert.ok(Math.abs(bounds.width / bounds.height - bounds.naturalWidth / bounds.naturalHeight) < .02,
        `${question.id}: proporção preservada`);
    }

    for (const [missionIndex,mission] of missions.entries()) {
      assert.equal(await page.locator('[data-lesson-video-player]').getAttribute('src'),mission.video);
      assert.equal(await page.locator('[data-mission-brief]').isVisible(),true);
      const videoStatus = await page.evaluate(() => document.querySelector('[data-lesson-video-player]').readyState);
      if (!videoStatus) await page.locator('[data-lesson-video-player]').evaluate(video => new Promise((resolve,reject) => {
        if (video.readyState) return resolve();
        video.addEventListener('loadedmetadata',resolve,{once:true});
        video.addEventListener('error',() => reject(new Error('Vídeo não carregou')),{once:true});
      }));
      await page.locator('[data-begin-questions]').click();
      for (const [questionIndex,question] of mission.questions.entries()) {
        const correct = answerIndices[missionIndex][questionIndex];
        assert.equal(await options.count(),4);
        assert.equal(await page.locator('[data-challenge-question]').textContent(),question.text);
        assert.equal(await page.locator('[data-challenge-counter]').textContent(),`QUESTÃO ${questionIndex + 1} DE 10`);
        await inspectImage(question);
        if (questionIndex === 0) {
          await options.nth((correct + 1) % 4).click();
          assert.equal(await feedback.textContent(),question.incorrect);
          assert.equal(await next.isVisible(),false);
          assert.equal(await options.nth((correct + 1) % 4).isDisabled(),true);
        }
        await options.nth(correct).click();
        assert.equal(await feedback.textContent(),question.correct);
        assert.equal(await next.isVisible(),true);
        for (const button of await options.all()) assert.equal(await button.isDisabled(),true);
        await next.click();
      }
      const student = await profile();
      assert.ok(student.completedMissionIds.includes(mission.id));
      assert.equal(student.completedQuestionIds.length,(missionIndex + 1) * 10);
      assert.equal(student.correctAnswers,(missionIndex + 1) * 10);
      assert.equal(student.challengesAttempted,(missionIndex + 1) * 11);
      assert.equal(student.coins,(missionIndex + 1) * 575 + (missionIndex === 2 ? 250 : 0));
      assert.equal(student.stars,missionIndex === 2 ? 3 : 0);
      assert.equal(student.progress,Math.round((13 + missionIndex) / missionTotal * 100));
      if (missionIndex < 2) await page.locator('[data-result-next-mission]').click();
    }
    assert.ok((await profile()).completedChallengeIds.includes('desafio-5'));
    const saved = await profile();
    console.log('30 questões, imagens, vídeos, gabaritos, desbloqueio, tentativas e recompensas conferidos.');

    // Dois erros encerram a questão; rejogar não concede recompensas duplicadas.
    await page.locator('[data-student-view="path"]').click();
    await page.locator(`[data-student-mission="${missions[0].index}"]`).click();
    await page.locator('[data-begin-questions]').click();
    await options.nth(1).click();
    await options.nth(2).click();
    assert.equal(await next.isVisible(),true);
    assert.equal(await feedback.textContent(),missions[0].questions[0].incorrect);
    await next.click();
    for (let questionIndex = 1; questionIndex < 10; questionIndex++) {
      await options.nth(answerIndices[0][questionIndex]).click();
      await next.click();
    }
    assert.equal((await profile()).coins,saved.coins);
    assert.equal((await profile()).stars,saved.stars);
    await page.reload();
    await login();
    assert.equal((await profile()).progress,Math.round(15 / missionTotal * 100));
    assert.equal((await profile()).coins,saved.coins);
    assert.ok((await profile()).completedChallengeIds.includes('desafio-5'));

    // Todas as imagens e alternativas são conferidas em telas grandes e pequenas.
    let layoutChecks = 0;
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      for (const [missionIndex,mission] of missions.entries()) {
        for (const [questionIndex,question] of mission.questions.entries()) {
          await page.evaluate(({index,questionIndex}) => {
            beginMissionSession(index);
            challengeStage = 'questions';
            currentChallengeIndex = questionIndex;
            setStudentView('challenge');
          },{index:mission.index,questionIndex});
          await inspectImage(question);
          await options.nth(answerIndices[missionIndex][questionIndex]).click();
          const layout = await page.evaluate(() => {
            const card = document.querySelector('.challenge-card').getBoundingClientRect();
            const next = document.querySelector('[data-next-challenge]').getBoundingClientRect();
            return {overflow:document.documentElement.scrollWidth > innerWidth,
              cardBottom:card.bottom,nextBottom:next.bottom,
              outside:[...document.querySelectorAll('[data-challenge-answer]')].some(button => {
                const rect = button.getBoundingClientRect();
                return rect.left < card.left || rect.right > card.right;
              })};
          });
          assert.equal(layout.overflow,false,`${question.id}: rolagem horizontal em ${viewport.width}px`);
          assert.equal(layout.outside,false,`${question.id}: alternativas dentro do cartão`);
          if (viewport.width >= 951) {
            assert.ok(layout.cardBottom <= viewport.height,`${question.id}: cartão em ${viewport.width}px (${layout.cardBottom})`);
            assert.ok(layout.nextBottom <= viewport.height,`${question.id}: botão de avanço visível`);
          }
          if (process.env.ORBITA_SCREENSHOTS && [0,2,8,9].includes(questionIndex) && viewport.width !== 320) {
            fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
            await page.locator('[data-student-section="challenge"]').screenshot({
              path:path.join(process.env.ORBITA_SCREENSHOTS,`${question.id}-${viewport.width}.png`)
            });
          }
          layoutChecks++;
        }
      }
    }
    assert.deepEqual(errors,[]);
    console.log(`${layoutChecks} layouts conferidos; progresso persistido e nenhuma recompensa duplicada ou erro de JavaScript.`);
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
