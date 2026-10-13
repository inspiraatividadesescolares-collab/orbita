const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');

// Gabaritos conferidos com as figuras; divergências do roteiro corrigidas.
const answerIndices = [
  [3,0,2,1,2,3,2,2,1,0],
  [2,3,3,0,2,3,2,0,3,2],
  [3,2,2,3,1,2,3,0,3,2]
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
    })).filter(mission => mission.id.startsWith('desafio-12-')));
    assert.equal(missions.length,3);
    const missionTotal = await page.evaluate(() => thirdGradeMissions.length);
    const ids = new Set();
    for (const [missionIndex,mission] of missions.entries()) {
      assert.equal(mission.questions.length,10);
      assert.ok(fs.existsSync(path.join(__dirname,'..',mission.video)),mission.video);
      for (const [questionIndex,question] of mission.questions.entries()) {
        if (missionIndex === 0) {
          assert.equal(question.type,'multiplication-groups');
          assert.equal(question.answer,question.groups * question.perGroup);
          ids.add(question.id);
          continue;
        }
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
      localStorage.setItem('orbita-teacher-data:teste-multiplicacao',JSON.stringify({
        classes:[{id:1,name:'Turma de teste',grade:3,code:'MULT-TESTE'}],
        students:[{id:1,name:'Teste Multiplicação',classId:1,track:3,coins:0,stars:0,
          correctAnswers:0,challengesAttempted:0,errors:[],journal:[],progress:90,additionPuzzleVersion:1,
          completedMissionIds:thirdGradeMissions.slice(0,33).map(mission => mission.missionId),
          completedChallengeIds:thirdGradeChallenges.slice(0,11).map(challenge => challenge.id),
          completedQuestionIds:[],lastDailyReward:localDateKey()}]
      }));
    });
    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Multiplicação');
      await page.locator('#auth-form [name="code"]').fill('MULT-TESTE');
      await page.locator('#auth-form button[type="submit"]').click();
      await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
    }
    const profile = () => page.evaluate(() => ({...currentStudent}));
    const options = page.locator('[data-challenge-answer]');
    const next = page.locator('[data-next-challenge]');
    const feedback = page.locator('[data-feedback-copy]');
    const source = page.locator('[data-multiplication-source]');
    const total = page.locator('[data-multiplication-answer]');
    const check = page.locator('[data-check-challenge]');
    async function fillGroups(question,keyboard=false) {
      if (await source.getAttribute('aria-pressed') !== 'true') {
        if (keyboard) { await source.focus(); await page.keyboard.press('Enter'); }
        else await source.click();
      }
      if (!keyboard) {
        await page.evaluate(question => {
          for (let group = 0; group < question.groups; group++) for (let item = 0; item < question.perGroup; item++) {
            document.querySelector(`[data-multiplication-destination="${group}"]`).click();
          }
        },question);
        return;
      }
      for (let group = 0; group < question.groups; group++) for (let item = 0; item < question.perGroup; item++) {
        const target = page.locator(`[data-multiplication-destination="${group}"]`);
        if (keyboard) { await target.focus(); await page.keyboard.press('Enter'); }
        else await page.locator(`[data-multiplication-drop="${group}"] h4`).click();
      }
    }
    async function dragObjectTo(group) {
      const from = await source.boundingBox(),to = await page.locator(`[data-multiplication-drop="${group}"]`).boundingBox();
      await page.mouse.move(from.x + from.width / 2,from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(to.x + to.width / 2,to.y + to.height / 2,{steps:8});
      await page.mouse.up();
    }
    await login();
    assert.equal(await page.locator('[data-student-mission-total]').textContent(),`de ${missionTotal} missões`);
    await page.locator('[data-student-view="path"]').click();
    const group = page.locator('.challenge-path-group').filter({has:page.locator('header span',{hasText:'DESAFIO 12'})});
    assert.match(await group.locator('header').textContent(),/DESAFIO 12.*Multiplicação/);
    assert.equal(await group.locator('.mission-node button').nth(0).isEnabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(1).isDisabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(2).isDisabled(),true);
    await page.evaluate(() => {
      currentStudent.completedMissionIds.pop();
      renderMissionPath();
    });
    assert.equal(await group.locator('.mission-node button').nth(0).isDisabled(),true);
    await page.evaluate(() => {
      currentStudent.completedMissionIds.push('desafio-11-missao-3');
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
        if (missionIndex === 0) {
          assert.equal(await options.count(),0);
          assert.equal(await page.locator('[data-multiplication-drop]').count(),question.groups);
          assert.equal(await page.locator('[data-multiplication-remove]').count(),0);
          assert.equal(await page.locator('[data-challenge-question]').textContent(),question.text);
          assert.equal(await page.locator('[data-challenge-counter]').textContent(),`QUESTÃO ${questionIndex + 1} DE 10`);
          assert.equal(await check.isDisabled(),true);
          await inspectImage(question);
          assert.equal(await page.locator('.multiplication-container-art').count(),question.groups);
          await page.locator('.multiplication-group-game img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
          assert.equal(await page.locator('.multiplication-group-game img').evaluateAll(images => images.every(image => image.naturalWidth > 0 && image.getAttribute('draggable') === 'false')),true);
          if (questionIndex === 0) {
            assert.deepEqual(await page.locator('[data-multiplication-count]').allTextContents(),['0 maçãs','0 maçãs','0 maçãs']);
            await total.fill('9');
            assert.equal(await check.isDisabled(),true,'o total sozinho não completa a questão');
            for (let group = 0; group < 3; group++) for (let item = 0; item < 3; item++) await dragObjectTo(group);
            assert.equal(await source.count(),1,'a mesma maçã continua disponível');
            assert.equal(await page.locator('[data-multiplication-remove]').count(),9);
            assert.deepEqual(await page.locator('[data-multiplication-count]').allTextContents(),['3 maçãs','3 maçãs','3 maçãs']);
            await total.fill('8'); await check.click();
            assert.equal(await next.isVisible(),false);
            assert.match(await feedback.textContent(),/todos os 3 grupos/);
            assert.equal(await total.inputValue(),'');
            assert.equal(await check.isDisabled(),true);
          } else await fillGroups(question,questionIndex === 1);
          await total.fill(String(question.answer));
          await total.press('Enter');
          assert.equal(await feedback.textContent(),question.correct);
          assert.equal(await next.isVisible(),true);
          assert.equal(await total.isDisabled(),true);
          assert.equal(await source.isDisabled(),true);
          await next.click();
          continue;
        }
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
      assert.equal(student.progress,Math.round((34 + missionIndex) / missionTotal * 100));
      if (missionIndex < 2) await page.locator('[data-result-next-mission]').click();
    }
    assert.ok((await profile()).completedChallengeIds.includes('desafio-12'));
    const saved = await profile();
    console.log('30 questões, imagens, vídeos, gabaritos, desbloqueio, tentativas e recompensas conferidos.');

    // Dois erros encerram a questão; rejogar não concede recompensas duplicadas.
    await page.locator('[data-student-view="path"]').click();
    await page.locator(`[data-student-mission="${missions[0].index}"]`).click();
    await page.locator('[data-begin-questions]').click();
    await fillGroups(missions[0].questions[0]);
    await total.fill('8'); await check.click();
    await total.fill('7'); await check.click();
    assert.equal(await next.isVisible(),true);
    assert.match(await feedback.textContent(),/3 × 3 = 9/);
    await next.click();
    for (let questionIndex = 1; questionIndex < 10; questionIndex++) {
      await fillGroups(missions[0].questions[questionIndex]);
      await total.fill(String(missions[0].questions[questionIndex].answer)); await check.click();
      await next.click();
    }
    assert.equal((await profile()).coins,saved.coins);
    assert.equal((await profile()).stars,saved.stars);
    await page.reload();
    await login();
    assert.equal((await profile()).progress,Math.round(36 / missionTotal * 100));
    assert.equal((await profile()).coins,saved.coins);
    assert.ok((await profile()).completedChallengeIds.includes('desafio-12'));

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
          if (missionIndex === 0) {
            await fillGroups(question); await total.fill(String(question.answer)); await check.click();
          } else await options.nth(answerIndices[missionIndex][questionIndex]).click();
          const layout = await page.evaluate(() => {
            const card = document.querySelector('.challenge-card').getBoundingClientRect();
            const next = document.querySelector('[data-next-challenge]').getBoundingClientRect();
            return {overflow:document.documentElement.scrollWidth > innerWidth,
              cardBottom:card.bottom,nextBottom:next.bottom,
              outside:[...document.querySelectorAll('[data-challenge-answer],.multiplication-group-activity button,.multiplication-group-activity input')].some(button => {
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
          if (process.env.ORBITA_SCREENSHOTS && ((missionIndex === 0 && [0,4,9].includes(questionIndex)) || (missionIndex === 1 && questionIndex === 3) || (missionIndex === 2 && questionIndex === 7)) && [1366,1024,375].includes(viewport.width)) {
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
      if (question.type === 'multiplication-groups') continue;
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

    // Uma soma correta não compensa uma montagem com grupos desiguais.
    await page.evaluate(index => {
      abandonMissionSession(); beginMissionSession(index); challengeStage = 'questions'; setStudentView('challenge');
    },missions[0].index);
    await source.click();
    for (const [group,count] of [2,3,4].entries()) for (let item = 0; item < count; item++) await page.locator(`[data-multiplication-drop="${group}"] h4`).click();
    await total.fill('9'); await check.click();
    assert.match(await feedback.textContent(),/3 maçãs em cada cesta/);
    assert.equal(await next.isVisible(),false);
    await page.locator('[data-multiplication-remove="2"]').last().click();
    await page.locator('[data-multiplication-drop="0"] h4').click();
    await total.fill('9'); await check.click();
    assert.equal(await next.isVisible(),true);
    assert.equal(await feedback.textContent(),missions[0].questions[0].correct);

    // Recomeçar não devolve tentativas e remove objetos e seleção.
    await page.evaluate(index => {
      abandonMissionSession(); beginMissionSession(index); challengeStage = 'questions'; setStudentView('challenge');
    },missions[0].index);
    await fillGroups(missions[0].questions[0]); await total.fill('8'); await check.click();
    await page.locator('[data-multiplication-reset]').click();
    assert.equal(await page.locator('[data-multiplication-remove]').count(),0);
    assert.equal(await total.inputValue(),'');
    assert.equal(await page.evaluate(() => currentQuestionAttempt),1);
    assert.equal(await source.getAttribute('aria-pressed'),'false');
    await fillGroups(missions[0].questions[0]); await total.fill('7'); await check.click();
    assert.equal(await next.isVisible(),true);

    // Eventos de toque usam o mesmo arrasto sem perder nem duplicar objetos.
    await page.setViewportSize({width:375,height:812});
    await page.evaluate(index => {
      abandonMissionSession(); beginMissionSession(index); challengeStage = 'questions'; setStudentView('challenge');
    },missions[0].index);
    const touch = await page.context().newCDPSession(page);
    await page.evaluate(() => document.querySelector('[data-multiplication-source]').scrollIntoView({block:'center'}));
    const from = await source.boundingBox(),to = await page.locator('[data-multiplication-drop="0"]').boundingBox();
    const point = (box,id=1) => ({x:box.x + box.width / 2,y:box.y + box.height / 2,id});
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(from)]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(to)]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await page.locator('[data-multiplication-remove]').count(),1);
    assert.equal(await source.count(),1);
    await touch.detach();
    assert.deepEqual(errors,[]);
    console.log(`${layoutChecks} layouts conferidos; progresso persistido e nenhuma recompensa duplicada ou erro de JavaScript.`);
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
