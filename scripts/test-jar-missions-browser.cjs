const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');
const {challenge,solve} = require('../jar-missions.js');
const questions = challenge.missions[0].questions;

async function main() {
  const browser = await chromium.launch({headless:true,channel:process.env.ORBITA_BROWSER_CHANNEL || 'chrome'});
  try {
    const context = await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});
    const page = await context.newPage(),errors = [];
    page.setDefaultTimeout(8000);
    page.on('pageerror',error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('orbita-sound-enabled','false'));
    await page.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    const mission = await page.evaluate(() => {
      const index = thirdGradeMissions.findIndex(m => m.missionId === 'desafio-14-missao-1');
      return {index,...thirdGradeMissions[index],total:thirdGradeMissions.length};
    });
    assert.equal(mission.questions.length,10);
    assert.ok(mission.index > 0);
    assert.deepEqual(mission.questions.map(q => [q.capacities,q.target]),questions.map(q => [q.capacities,q.target]));
    assert.equal(await page.evaluate(() => {
      const ids = thirdGradeMissions.flatMap(m => m.questions.map(q => q.id));
      return new Set(ids).size === ids.length;
    }),true);
    await page.evaluate(index => {
      localStorage.setItem('orbita-teacher-data:teste-jarras',JSON.stringify({
        classes:[{id:1,name:'Turma de teste',grade:3,code:'JARRA-TESTE'}],
        students:[{id:1,name:'Teste Jarras',classId:1,track:3,coins:0,stars:0,correctAnswers:0,
          challengesAttempted:0,errors:[],journal:[],progress:90,additionPuzzleVersion:1,
          completedMissionIds:thirdGradeMissions.slice(0,index).map(m => m.missionId),
          completedChallengeIds:thirdGradeChallenges.slice(0,13).map(c => c.id),
          completedQuestionIds:[],lastDailyReward:localDateKey()}]
      }));
    },mission.index);
    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Jarras');
      await page.locator('#auth-form [name="code"]').fill('JARRA-TESTE');
      await page.locator('#auth-form button[type="submit"]').click();
      await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
    }
    await login();
    const profile = () => page.evaluate(() => ({...currentStudent}));
    const check = page.locator('[data-check-challenge]'),next = page.locator('[data-next-challenge]');
    const jars = page.locator('[data-jar]'),moves = page.locator('[data-jar-moves]');
    const jarVolume = async index => Number((await jars.nth(index).getAttribute('aria-label')).match(/com (\d+) mL/)[1]);
    const feedback = page.locator('[data-feedback-copy]');
    async function startQuestion(index=0) {
      await page.evaluate(({missionIndex,index}) => {
        abandonMissionSession(); beginMissionSession(missionIndex); challengeStage = 'questions';
        currentChallengeIndex = index; setStudentView('challenge');
      },{missionIndex:mission.index,index});
    }
    async function selectJar(index,keyboard=false) {
      // Explicitly start from no selection for helpers that represent a whole action.
      if (keyboard) { await jars.nth(index).focus(); await page.keyboard.press('Enter'); }
      else await jars.nth(index).click();
    }
    async function action(action,keyboard=false) {
      await selectJar(action.from,keyboard);
      const target = action.kind === 'pour' ? jars.nth(action.to) : page.locator(`[data-jar-zone="${action.kind}"]`);
      if (keyboard) { await target.focus(); await page.keyboard.press('Enter'); }
      else await target.click();
    }
    async function solveQuestion(question,keyboard=false) {
      for (const step of solve(question)) await action(step,keyboard);
      assert.equal(await jarVolume(2),question.target);
    }
    async function dragTo(from,target) {
      const source = await jars.nth(from).boundingBox(),destination = await target.boundingBox();
      await page.mouse.move(source.x + source.width / 2,source.y + source.height / 2);
      await page.mouse.down();
      await page.mouse.move(destination.x + destination.width / 2,destination.y + destination.height / 2,{steps:10});
      await page.mouse.up();
    }
    await page.locator('[data-student-view="path"]').click();
    const group = page.locator('.challenge-path-group').filter({has:page.locator('header span',{hasText:'DESAFIO 14'})});
    assert.equal(await group.locator('.mission-node button').count(),3);
    assert.equal(await group.locator('.mission-node button').nth(0).isEnabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(1).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.pop(); renderMissionPath(); });
    assert.equal(await group.locator('.mission-node button').nth(0).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.push('desafio-13-missao-3'); renderMissionPath(); });
    await group.locator('.mission-node button').nth(0).click();
    assert.match(await page.locator('[data-mission-brief]').textContent(),/10 questões.*duas tentativas/);
    assert.equal(await page.locator('[data-lesson-video]').isVisible(),false);
    await page.locator('[data-begin-questions]').click();
    assert.equal(await check.isDisabled(),true);
    const spoken = await page.evaluate(() => {
      const original = speakText;
      let text = '';
      try { speakText = copy => { text = copy; }; document.querySelector('[data-speak-question]').click(); }
      finally { speakText = original; }
      return text;
    });
    assert.equal(spoken,questions[0].spokenText);

    // Todas as questões pela interface: erro inicial, acerto de segunda, dois erros e acertos de primeira.
    for (const [index,question] of questions.entries()) {
      assert.equal(await page.locator('[data-challenge-counter]').textContent(),`QUESTÃO ${index + 1} DE 10`);
      assert.equal(await moves.textContent(),'0');
      if (index < 2) {
        await action({kind:'fill',from:2}); await check.click();
        assert.equal(await next.isVisible(),false);
        assert.match(await feedback.textContent(),/mais uma tentativa/);
        assert.equal(await page.evaluate(() => currentQuestionAttempt),1);
        await page.locator('[data-jar-reset]').click();
        assert.equal(await page.evaluate(() => currentQuestionAttempt),1);
        assert.equal(await check.isDisabled(),true);
      }
      if (index === 1) {
        await action({kind:'fill',from:2}); await check.click();
        assert.match(await feedback.textContent(),/duas tentativas terminaram/);
        assert.equal(await page.locator('[data-jar-solution]').isVisible(),true);
        assert.equal(await page.locator('[data-jar-solution] li').count(),solve(question).length);
        for (const button of await page.locator('.jar-activity button').all()) assert.equal(await button.isDisabled(),true);
        assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
      } else {
        await solveQuestion(question,index === 2);
        await check.click();
        assert.equal(await feedback.textContent(),question.correct);
        for (const button of await page.locator('.jar-activity button').all()) assert.equal(await button.isDisabled(),true);
      }
      assert.equal(await next.isVisible(),true);
      await next.click();
    }
    const saved = await profile();
    assert.equal(saved.coins,525); // 8 × 50 + 25 + 100 pela missão; o desafio exige as três missões.
    assert.equal(saved.stars,0);
    assert.equal(saved.correctAnswers,9);
    assert.equal(saved.challengesAttempted,12);
    assert.equal(saved.errors.length,3);
    assert.equal(saved.completedQuestionIds.length,9);
    assert.ok(saved.completedMissionIds.includes(mission.missionId));
    assert.equal(saved.completedChallengeIds.includes('desafio-14'),false);
    assert.equal(saved.progress,Math.round((mission.index + 1) / mission.total * 100));
    console.log('Dez questões, duas tentativas, reset sem recuperar tentativa, bloqueio e recompensas conferidos.');

    // Repetir acertos já registrados e abandonar a missão não adiciona moedas/progresso.
    await startQuestion();
    await solveQuestion(questions[0]); await check.click();
    assert.equal(await page.evaluate(() => missionSession.coins),0);
    await page.locator('[data-student-view="home"]').click();
    assert.equal((await profile()).coins,saved.coins);
    await page.reload(); await login();
    assert.equal((await profile()).coins,saved.coins);
    assert.ok((await profile()).completedMissionIds.includes(mission.missionId));

    // Drag: torneira, jarra, vaso, cancelamento e limpeza ao abandonar.
    await startQuestion();
    await dragTo(0,page.locator('[data-jar-zone="fill"]'));
    assert.equal(await moves.textContent(),'1');
    assert.equal(await jarVolume(0),500);
    await dragTo(0,page.locator('[data-jar-station="1"]'));
    assert.equal(await jarVolume(0),200);
    await dragTo(1,page.locator('[data-jar-zone="empty"]'));
    assert.equal(await jarVolume(1),0);
    assert.equal(await moves.textContent(),'3');
    assert.equal(await page.locator('.jar-drag-ghost').count(),0);
    const box = await jars.nth(0).boundingBox();
    await page.mouse.move(box.x + box.width / 2,box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 20,box.y + box.height / 2,{steps:4});
    assert.equal(await page.locator('.jar-drag-ghost').count(),1);
    await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1,bubbles:true})));
    await page.mouse.up();
    assert.equal(await page.locator('.jar-drag-ghost').count(),0);
    assert.equal(await moves.textContent(),'3');
    await page.locator('[data-student-view="home"]').click();
    await startQuestion();
    assert.equal(await moves.textContent(),'0');
    const again = await jars.nth(0).boundingBox();
    await page.mouse.move(again.x + again.width / 2,again.y + again.height / 2); await page.mouse.down();
    await page.mouse.move(again.x + again.width / 2 + 20,again.y + again.height / 2,{steps:4});
    assert.equal(await page.locator('.jar-drag-ghost').count(),1);
    await page.evaluate(() => setStudentView('home'));
    await page.mouse.up();
    assert.equal(await page.locator('.jar-drag-ghost').count(),0);
    assert.equal(await page.evaluate(() => missionSession),null);
    console.log('Arraste, teclado, cancelamento e persistência conferidos.');

    let layouts = 0;
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740},{width:812,height:375}]) {
      await page.setViewportSize(viewport);
      for (const index of [0,4,9]) {
        await startQuestion(index);
        await page.waitForFunction(() => document.querySelector('.jar-faucet img')?.complete);
        assert.equal(await page.locator('.jar-faucet img').evaluate(img => img.naturalWidth > 0),true);
        await action({kind:'fill',from:2}); await check.click();
        if (viewport.width >= 951) assert.ok(await page.locator('.challenge-card').evaluate(card => card.getBoundingClientRect().bottom <= innerHeight),`${viewport.width}px: feedback da primeira tentativa cabe na tela`);
        await check.click();
        const bounds = await page.evaluate(() => ({
          overflow:document.documentElement.scrollWidth > innerWidth,
          card:document.querySelector('.challenge-card').getBoundingClientRect().bottom,
          next:document.querySelector('[data-next-challenge]').getBoundingClientRect().bottom,
          outside:[...document.querySelectorAll('.jar-activity button')].some(button => {
            const rect = button.getBoundingClientRect(),card = document.querySelector('.challenge-card').getBoundingClientRect();
            return rect.left < card.left || rect.right > card.right;
          })
        }));
        assert.equal(bounds.overflow,false,`${viewport.width}px: sem rolagem horizontal`);
        assert.equal(bounds.outside,false,`${viewport.width}px: controles dentro do cartão`);
        if (viewport.width >= 951) {
          assert.ok(bounds.card <= viewport.height,`${viewport.width}px: cartão cabe na tela (${bounds.card})`);
          assert.ok(bounds.next <= viewport.height,`${viewport.width}px: avanço visível`);
        }
        await page.locator('[data-jar-solution] summary').click();
        assert.equal(await page.locator('[data-jar-solution] ol').isVisible(),true);
        if (process.env.ORBITA_SCREENSHOTS && index === 4) {
          fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
          await page.locator('[data-jar-solution] summary').click();
          await page.locator('[data-student-section="challenge"]').screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`jarras-${viewport.width}.png`)});
        }
        layouts++;
      }
    }
    // Toque em tela pequena, sem depender do arraste.
    const touch = await browser.newContext({viewport:{width:375,height:812},hasTouch:true,isMobile:true});
    const touchPage = await touch.newPage();
    await touchPage.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    await touchPage.evaluate(index => {
      currentStudent = {track:3,completedMissionIds:[],completedQuestionIds:[]};
      beginMissionSession(index); challengeStage = 'questions'; setStudentView('challenge');
      document.querySelector('[data-screen="student"]').hidden = false;
      document.querySelector('[data-screen="student"]').classList.add('screen--active');
      document.querySelector('[data-screen="home"]').hidden = true;
    },mission.index);
    await touchPage.locator('[data-jar="0"]').tap();
    await touchPage.locator('[data-jar-zone="fill"]').tap();
    assert.match(await touchPage.locator('[data-jar="0"]').getAttribute('aria-label'),/com 500 mL/);
    await touchPage.close(); await touch.close();
    assert.deepEqual(errors,[]);
    console.log(`${layouts} layouts, solução após dois erros e toque no celular conferidos; sem erros de JavaScript.`);
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
