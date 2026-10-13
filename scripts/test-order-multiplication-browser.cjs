const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');
const multiplication = require('../order-multiplication.js');
const plans = Object.fromEntries(multiplication.challenge.missions.flatMap(m => m.questions).map(q => [q.id,multiplication.plan(q)]));
const fieldSelector = task => `[data-order-${task.kind}="${task.kind === 'answer' ? task.place : task.index}"]`;

async function main() {
  const browser = await chromium.launch({headless:true,channel:process.env.ORBITA_BROWSER_CHANNEL || 'chrome'});
  try {
    const page = await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'}),errors = [];
    page.setDefaultTimeout(10000); page.on('pageerror',error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('orbita-sound-enabled','false'));
    await page.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    const missions = await page.evaluate(() => thirdGradeMissions.map((m,index) => ({...m,index})).filter(m => m.challengeId === 'desafio-16'));
    const total = await page.evaluate(() => thirdGradeMissions.length);
    assert.equal(missions.length,3); assert.ok(total >= 48);
    assert.deepEqual(missions.map(m => m.questions),multiplication.challenge.missions.map(m => m.questions));
    await page.evaluate(index => localStorage.setItem('orbita-teacher-data:teste-ordens',JSON.stringify({
      classes:[{id:1,name:'Turma de teste',grade:3,code:'ORDENS-TESTE'}],
      students:[{id:1,name:'Teste Ordens',classId:1,track:3,coins:0,stars:0,correctAnswers:0,challengesAttempted:0,
        errors:[],journal:[],progress:94,additionPuzzleVersion:1,completedQuestionIds:[],
        completedMissionIds:thirdGradeMissions.slice(0,index).map(m => m.missionId),
        completedChallengeIds:thirdGradeChallenges.slice(0,15).map(c => c.id),lastDailyReward:localDateKey()}]
    })),missions[0].index);
    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Ordens');
      await page.locator('#auth-form [name="code"]').fill('ORDENS-TESTE');
      await page.locator('#auth-form button[type="submit"]').click();
      await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
    }
    await login();
    const check = page.locator('[data-check-challenge]'),next = page.locator('[data-next-challenge]'),feedback = page.locator('[data-feedback-copy]');
    const profile = () => page.evaluate(() => ({...currentStudent}));
    async function startQuestion(mission=missions[0],index=0) {
      await page.evaluate(({missionIndex,index}) => {
        abandonMissionSession(); beginMissionSession(missionIndex); challengeStage = 'questions';
        currentChallengeIndex = index; setStudentView('challenge'); window.scrollTo(0,0);
      },{missionIndex:mission.index,index});
    }
    async function fill(question,{wrongAnswer=false,wrongCarry=false}={}) {
      const work = plans[question.id];
      assert.equal(await page.locator('[data-order-carry]').count(),work.records.length);
      for (const [index,task] of work.tasks.entries()) {
        const field = page.locator(fieldSelector(task));
        assert.equal(await field.isEnabled(),true);
        assert.equal(await page.locator('[data-order-multiplier].is-highlighted').count(),1);
        assert.equal(await page.locator('[data-order-top].is-highlighted').count(),1);
        assert.equal(await page.locator(`[data-order-top="${task.source}"]`).getAttribute('class'),'order-multiplication-digit is-highlighted');
        assert.equal(await field.getAttribute('class'),'is-current');
        for (const later of work.tasks.slice(index + 1)) assert.equal(await page.locator(fieldSelector(later)).isDisabled(),true);
        if (task.kind === 'answer' && work.columns[task.place].carry) assert.equal(await page.locator('.order-multiplication-records .is-incoming').count(),1);
        let value = task.expected;
        if ((wrongAnswer && task.kind === 'answer' && task.place === 2) || (wrongCarry && task.kind === 'carry' && task.index === 0)) value = String((Number(value) + 1) % 10);
        await field.fill(value);
      }
      assert.equal(await check.isEnabled(),true);
      assert.equal(await next.isVisible(),false);
      assert.equal(await page.locator('[data-order-top].is-highlighted').count(),0);
    }

    await page.locator('[data-student-view="path"]').click();
    const group = page.locator('.challenge-path-group').filter({has:page.locator('header span',{hasText:'DESAFIO 16'})});
    assert.equal(await group.locator('.mission-node').count(),3);
    assert.equal(await group.locator('.mission-node button').nth(0).isEnabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(1).isDisabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(2).isDisabled(),true);
    await group.locator('.mission-node button').nth(0).click();
    for (const [missionIndex,mission] of missions.entries()) {
      assert.match(await page.locator('[data-mission-brief]').textContent(),/10 multiplicações.*duas tentativas/);
      assert.match(await page.locator('[data-mission-example]').textContent(),new RegExp(`${mission.questions[0].top} × ${mission.questions[0].multiplier}`));
      await page.locator('[data-begin-questions]').click();
      for (const [questionIndex,question] of mission.questions.entries()) {
        assert.equal(await page.locator('[data-challenge-counter]').textContent(),`QUESTÃO ${questionIndex + 1} DE 10`);
        assert.equal(await check.isDisabled(),true);
        assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
        if (questionIndex === 0) {
          assert.equal(await page.evaluate(() => missionSession.attempts),0);
          const spoken = await page.evaluate(() => {
            const original = speakText; let text = '';
            try { speakText = copy => { text = copy; }; document.querySelector('[data-speak-question]').click(); }
            finally { speakText = original; }
            return text;
          });
          assert.ok(spoken.startsWith(question.spokenText)); assert.match(spoken,/Etapa 1 de 3/);
        }
        if (questionIndex === 0 && missionIndex < 2) {
          await fill(question,{wrongAnswer:missionIndex === 0,wrongCarry:missionIndex === 1}); await check.click();
          assert.equal(await next.isVisible(),false);
          assert.match(await feedback.textContent(),missionIndex === 0 ? /centenas/ : /reagrupamento/);
          if (missionIndex === 0) {
            await page.locator('[data-order-reset]').click();
            assert.equal(await page.evaluate(() => currentQuestionAttempt),1);
            assert.equal(await check.isDisabled(),true);
          } else {
            await check.click();
            assert.equal(await feedback.textContent(),`As duas tentativas terminaram. ${multiplication.resolution(question)}`);
            assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
          }
        }
        if (!(missionIndex === 1 && questionIndex === 0)) {
          await fill(question);
          if (questionIndex % 2) await page.locator('[data-order-answer="2"]').press('Enter'); else await check.click();
          assert.equal(await feedback.textContent(),question.correct);
        }
        for (const field of await page.locator('.order-multiplication-activity input, .order-multiplication-activity button').all()) assert.equal(await field.isDisabled(),true);
        assert.equal(await next.isVisible(),true); await next.click();
      }
      const student = await profile();
      assert.ok(student.completedMissionIds.includes(mission.missionId));
      assert.equal(student.coins,[575,1125,1975][missionIndex]);
      assert.equal(student.correctAnswers,[10,19,29][missionIndex]);
      assert.equal(student.challengesAttempted,[11,22,32][missionIndex]);
      assert.equal(student.progress,Math.round((mission.index + 1) / total * 100));
      if (missionIndex < 2) await page.locator('[data-result-next-mission]').click();
    }
    const saved = await profile();
    assert.equal(saved.stars,3); assert.equal(saved.errors.length,3);
    assert.equal(saved.progress,Math.round((missions.at(-1).index + 1) / total * 100));
    assert.ok(saved.completedChallengeIds.includes('desafio-16'));
    await startQuestion();
    for (const question of missions[0].questions) { await fill(question); await check.click(); await next.click(); }
    assert.equal((await profile()).coins,saved.coins); assert.equal((await profile()).stars,saved.stars);
    await page.reload(); await login(); assert.equal((await profile()).coins,saved.coins);
    assert.ok((await profile()).completedChallengeIds.includes('desafio-16'));
    console.log('30 operações, destaques em todas as etapas, registros, leitura, correção e progressão conferidos.');

    await startQuestion(missions[2]);
    const answer = place => page.locator(`[data-order-answer="${place}"]`),carry = index => page.locator(`[data-order-carry="${index}"]`);
    await answer(0).fill('abc'); assert.equal(await answer(0).inputValue(),''); assert.equal(await carry(0).isDisabled(),true);
    await answer(0).press('Enter'); assert.equal(await answer(0).evaluate(e => e === document.activeElement),true);
    await answer(0).fill('0'); assert.equal(await carry(0).evaluate(e => e === document.activeElement),true);
    await carry(0).press('Backspace'); assert.equal(await answer(0).evaluate(e => e === document.activeElement),true);
    await answer(0).fill('0'); await carry(0).fill('1'); await answer(1).fill('3'); await carry(1).fill('1'); await answer(2).fill('3');
    await answer(0).focus(); assert.equal(await page.locator('[data-order-top="0"].is-highlighted').count(),1);
    await answer(0).fill('');
    for (const input of await page.locator('[data-order-task]').all()) if (await input.getAttribute('data-order-task') !== '0') {
      assert.equal(await input.inputValue(),''); assert.equal(await input.isDisabled(),true);
    }
    assert.equal(await check.isDisabled(),true);
    await answer(0).fill('0'); await carry(0).fill('1');
    assert.equal(await page.locator('[data-order-top="1"].is-highlighted').count(),1);
    await carry(0).focus(); assert.equal(await page.locator('[data-order-top="0"].is-highlighted').count(),1);
    await carry(0).fill('2');
    assert.equal(await page.locator('[data-order-top="1"].is-highlighted').count(),1);
    assert.equal(await answer(1).inputValue(),''); assert.equal(await carry(1).isDisabled(),true);
    await page.locator('[data-student-view="home"]').click();
    assert.equal(await page.evaluate(() => orderMultiplication.submit()),null);

    let layouts = 0;
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      for (const mission of missions) for (const [index,question] of mission.questions.entries()) {
        for (const stage of ['initial','carry','error','final-error','success']) {
          if (stage === 'carry' && !question.regroupCount) continue;
          await startQuestion(mission,index);
          const bounds = await page.evaluate(({work,stage}) => {
            const field = task => document.querySelector(`[data-order-${task.kind}="${task.kind === 'answer' ? task.place : task.index}"]`);
            if (stage !== 'initial') {
              for (const task of work.tasks) {
                if (stage === 'carry' && task.kind === 'carry') break;
                const input = field(task),wrong = ['error','final-error'].includes(stage) && task.kind === 'answer' && task.place === 2;
                input.value = wrong ? String((Number(task.expected) + 1) % 10) : task.expected;
                input.dispatchEvent(new Event('input',{bubbles:true}));
              }
              if (['error','final-error','success'].includes(stage)) document.querySelector('[data-check-challenge]').click();
              if (stage === 'final-error') document.querySelector('[data-check-challenge]').click();
            }
            window.scrollTo(0,0);
            const card = document.querySelector('.challenge-card').getBoundingClientRect();
            const controls = [...document.querySelectorAll('[data-order-task],[data-order-reset],[data-check-challenge],[data-next-challenge]')].filter(el => !el.hidden && el.getClientRects().length).map(el => el.getBoundingClientRect());
            return {overflow:document.documentElement.scrollWidth > innerWidth,bottom:card.bottom,documentHeight:document.scrollingElement.scrollHeight,
              outside:controls.some(rect => rect.left < card.left || rect.right > card.right || rect.left < 0 || rect.right > innerWidth),
              answerWidth:document.querySelector('[data-order-answer]').getBoundingClientRect().width};
          },{work:plans[question.id],stage});
          assert.equal(bounds.overflow,false,`${viewport.width}: ${question.id} ${stage} sem rolagem horizontal`);
          assert.equal(bounds.outside,false,`${viewport.width}: ${question.id} ${stage} controles dentro do cartão`);
          assert.ok(bounds.answerWidth >= 44,'quadrados legíveis e adequados ao toque');
          if (viewport.width > 950) {
            assert.ok(bounds.bottom <= viewport.height - 6,`${question.id} ${stage} em ${viewport.width} × ${viewport.height}: cartão até ${bounds.bottom}`);
            assert.ok(bounds.documentHeight <= viewport.height + 1,`${question.id} ${stage}: sem rolagem no computador`);
          }
          if (process.env.ORBITA_SCREENSHOTS && index === 0 && ['initial','carry'].includes(stage)) {
            fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
            await page.locator('[data-student-section="challenge"]').screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`ordens-${mission.missionNumber}-${viewport.width}-${stage}.png`)});
          }
          layouts++;
        }
      }
    }
    console.log(`${layouts} estados de tela conferidos em quatro tamanhos de computador e celular.`);

    const touch = await browser.newContext({viewport:{width:375,height:812},hasTouch:true,isMobile:true}),touchPage = await touch.newPage();
    touchPage.on('pageerror',error => errors.push(error.message));
    await touchPage.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    await touchPage.evaluate(index => {
      currentStudent = {name:'Teste toque',track:3,completedMissionIds:[],completedQuestionIds:[]};
      showScreen('student'); beginMissionSession(index); challengeStage = 'questions'; setStudentView('challenge');
    },missions[2].index);
    for (const task of plans[missions[2].questions[0].id].tasks) {
      const input = touchPage.locator(fieldSelector(task)); await input.tap(); await touchPage.keyboard.type(task.expected);
      assert.equal(await input.inputValue(),task.expected);
    }
    await touchPage.locator('[data-check-challenge]').tap();
    assert.equal(await touchPage.locator('[data-feedback-copy]').textContent(),missions[2].questions[0].correct);
    await touch.close(); assert.deepEqual(errors,[]);
    console.log('Teclado, edição de etapas anteriores, limpeza de etapas dependentes e digitação por toque conferidos.');
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
