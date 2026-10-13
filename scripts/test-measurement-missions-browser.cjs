const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');

// Gabaritos conferidos com as figuras; divergências do roteiro corrigidas.
const answerIndices = [
  [2,1,3,2,0,2,0,2,3,1],
  [2,1,0,3,2,1,2,1,0,3],
  [3,2,1,2,0,2,2,1,3,2]
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
    })).filter(mission => mission.id.startsWith('desafio-13-')));
    assert.equal(missions.length,3);
    const missionTotal = await page.evaluate(() => thirdGradeMissions.length);
    const ids = new Set();
    for (const [missionIndex,mission] of missions.entries()) {
      assert.equal(mission.questions.length,10);

      for (const [questionIndex,question] of mission.questions.entries()) {
        assert.equal(question.type,'quiz');
        assert.equal(question.variant,'qt1');
        assert.equal(question.options.length,4);
        assert.equal(question.answer,question.options[answerIndices[missionIndex][questionIndex]],question.id);
        assert.ok(question.correct && question.imageAlt,question.id);
        assert.equal(Object.keys(question.feedbackByAnswer).length,4);
        if (question.image) assert.ok(fs.existsSync(path.join(__dirname,'..',question.image)),question.image);
        ids.add(question.id);
      }
    }
    assert.equal(ids.size,30);
    const allQuestionIds = await page.evaluate(() => thirdGradeMissions.flatMap(mission => mission.questions.map(question => question.id)));
    assert.equal(new Set(allQuestionIds).size,allQuestionIds.length,'IDs distintos em toda a trilha');
    await page.evaluate(() => {
      localStorage.setItem('orbita-teacher-data:teste-medidas',JSON.stringify({
        classes:[{id:1,name:'Turma de teste',grade:3,code:'MEDIDA-TESTE'}],
        students:[{id:1,name:'Teste Medidas',classId:1,track:3,coins:0,stars:0,
          correctAnswers:0,challengesAttempted:0,errors:[],journal:[],progress:90,additionPuzzleVersion:1,
          completedMissionIds:thirdGradeMissions.slice(0,36).map(mission => mission.missionId),
          completedChallengeIds:thirdGradeChallenges.slice(0,12).map(challenge => challenge.id),
          completedQuestionIds:[],lastDailyReward:localDateKey()}]
      }));
    });
    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Medidas');
      await page.locator('#auth-form [name="code"]').fill('MEDIDA-TESTE');
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
    const group = page.locator('.challenge-path-group').filter({has:page.locator('header span',{hasText:'DESAFIO 13'})});
    assert.match(await group.locator('header').textContent(),/DESAFIO 13.*Sistemas de medidas/);
    assert.equal(await group.locator('.mission-node button').nth(0).isEnabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(1).isDisabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(2).isDisabled(),true);
    await page.evaluate(() => {
      currentStudent.completedMissionIds.pop();
      renderMissionPath();
    });
    assert.equal(await group.locator('.mission-node button').nth(0).isDisabled(),true);
    await page.evaluate(() => {
      currentStudent.completedMissionIds.push('desafio-12-missao-3');
      renderMissionPath();
    });
    await page.locator(`[data-student-mission="${missions[0].index}"]`).click();

    async function inspectImage(question) {
      if (!question.image) {
        assert.equal(await page.locator('[data-question-media]').isVisible(),false);
        assert.equal(await page.locator('[data-question-media] img,.question-image-zoom').count(),0);
        return;
      }
      const img = page.locator('[data-question-media] img');
      await page.waitForFunction(() => {
        const image = document.querySelector('[data-question-media] img');
        return image?.complete && image.naturalWidth > 0;
      });
      await img.evaluate(element => element.decode());
      assert.equal(await img.getAttribute('src'),question.image);
      assert.equal(await img.getAttribute('alt'),question.imageAlt);
      const bounds = await img.evaluate(element => ({
        width:element.getBoundingClientRect().width,height:element.getBoundingClientRect().height,
        naturalWidth:element.naturalWidth,naturalHeight:element.naturalHeight
      }));
      if (question.imageLayout === 'ruler') {
        assert.ok(bounds.width > (page.viewportSize().width >= 951 ? 600 : 200) && bounds.height > 120,`${question.id}: régua legível`);
        assert.equal(await img.evaluate(element => getComputedStyle(element).objectFit),'cover');
      } else {
        assert.ok(bounds.width > 150 && bounds.height > 180,`${question.id}: imagem legível`);
      }
      assert.equal(await page.locator('.question-image-zoom').getAttribute('href'),question.image);
      assert.equal(await page.locator('.question-image-zoom').getAttribute('target'),'_blank');
      if (question.imageLayout !== 'ruler') assert.ok(Math.abs(bounds.width / bounds.height - bounds.naturalWidth / bounds.naturalHeight) < .02,
        `${question.id}: proporção preservada`);
    }

    for (const [missionIndex,mission] of missions.entries()) {
      assert.equal(await page.locator('[data-mission-brief]').isVisible(),true);
      assert.equal(await page.locator('[data-lesson-video]').isVisible(),false);
      await page.locator('[data-begin-questions]').click();
      for (const [questionIndex,question] of mission.questions.entries()) {
        const correct = answerIndices[missionIndex][questionIndex];
        assert.equal(await options.count(),4);
        assert.equal(await page.locator('[data-challenge-question]').textContent(),question.text);
        assert.equal(await page.locator('[data-challenge-counter]').textContent(),`QUESTÃO ${questionIndex + 1} DE 10`);
        await inspectImage(question);
        if (question.spokenText) {
          const spoken = await page.evaluate(() => {
            const original = speakText;
            let spoken = '';
            try {
              speakText = text => { spoken = text; };
              document.querySelector('[data-speak-question]').click();
            } finally { speakText = original; }
            return spoken;
          });
          assert.equal(spoken,question.spokenText);
        }
        if (questionIndex === 0) {
          await options.nth((correct + 1) % 4).click();
          assert.equal(await feedback.textContent(),question.feedbackByAnswer[question.options[(correct + 1) % 4]]);
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
      assert.equal(student.progress,Math.round((37 + missionIndex) / missionTotal * 100));
      if (missionIndex < 2) await page.locator('[data-result-next-mission]').click();
    }
    assert.ok((await profile()).completedChallengeIds.includes('desafio-13'));
    const saved = await profile();
    console.log('30 questões, imagens, gabaritos, desbloqueio, tentativas e recompensas conferidos.');

    // Dois erros encerram a questão; rejogar não concede recompensas duplicadas.
    await page.locator('[data-student-view="path"]').click();
    await page.locator(`[data-student-mission="${missions[0].index}"]`).click();
    await page.locator('[data-begin-questions]').click();
    await options.nth(1).click();
    await options.nth(0).click();
    assert.equal(await next.isVisible(),true);
    assert.equal(await feedback.textContent(),missions[0].questions[0].feedbackByAnswer[missions[0].questions[0].options[0]]);
    await next.click();
    for (let questionIndex = 1; questionIndex < 10; questionIndex++) {
      await options.nth(answerIndices[0][questionIndex]).click();
      await next.click();
    }
    assert.equal((await profile()).coins,saved.coins);
    assert.equal((await profile()).stars,saved.stars);
    await page.reload();
    await login();
    assert.equal((await profile()).progress,Math.round(39 / missionTotal * 100));
    assert.equal((await profile()).coins,saved.coins);
    assert.ok((await profile()).completedChallengeIds.includes('desafio-13'));

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
          if (process.env.ORBITA_SCREENSHOTS && ((missionIndex === 0 && [5,6,8].includes(questionIndex)) || (missionIndex === 1 && questionIndex === 5) || (missionIndex === 2 && [4,5,9].includes(questionIndex))) && [1366,1024,375].includes(viewport.width)) {
            fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
            await page.locator('[data-student-section="challenge"]').screenshot({
              path:path.join(process.env.ORBITA_SCREENSHOTS,`${question.id}-${viewport.width}.png`)
            });
          }
          layoutChecks++;
        }
      }
    }
    // Cada alternativa deve exibir o próprio feedback, inclusive após uma segunda resposta errada.
    await page.setViewportSize({width:1024,height:600});
    let feedbackChecks = 0;
    for (const mission of missions) for (const questionIndex of mission.questions.keys()) {
      const question = mission.questions[questionIndex];
      const wrong = question.options.map((_,index) => index).filter(index => index !== answerIndices[missions.indexOf(mission)][questionIndex]);
      for (const optionIndex of question.options.keys()) {
        await page.evaluate(({index,questionIndex}) => {
          beginMissionSession(index);
          challengeStage = 'questions';
          currentChallengeIndex = questionIndex;
          setStudentView('challenge');
        },{index:mission.index,questionIndex});
        await options.nth(optionIndex).click();
        assert.equal(await feedback.textContent(),question.feedbackByAnswer[question.options[optionIndex]],question.id);
        if (wrong.includes(optionIndex)) {
          const second = wrong.find(index => index !== optionIndex);
          assert.equal(await next.isVisible(),false);
          await options.nth(second).click();
          assert.equal(await feedback.textContent(),question.feedbackByAnswer[question.options[second]],question.id);
        }
        assert.equal(await next.isVisible(),true);
        const bottom = await page.locator('.challenge-card').evaluate(element => element.getBoundingClientRect().bottom);
        assert.ok(bottom <= 600,`${question.id}: feedback da alternativa ${optionIndex} cabe na tela (${bottom})`);
        feedbackChecks++;
      }
    }
    console.log(feedbackChecks + ' feedbacks por alternativa conferidos, incluindo a segunda tentativa.');
    assert.deepEqual(errors,[]);
    console.log(`${layoutChecks} layouts conferidos; progresso persistido e nenhuma recompensa duplicada ou erro de JavaScript.`);
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
