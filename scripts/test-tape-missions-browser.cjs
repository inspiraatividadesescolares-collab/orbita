const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');
const {mission:sourceMission,solutions} = require('../tape-missions.js');
const questions = sourceMission.questions;

async function main() {
  const browser = await chromium.launch({headless:true,channel:process.env.ORBITA_BROWSER_CHANNEL || 'chrome'});
  try {
    const page = await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'}),errors = [];
    page.setDefaultTimeout(8000); page.on('pageerror',error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('orbita-sound-enabled','false'));
    await page.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    const mission = await page.evaluate(() => {
      const index = thirdGradeMissions.findIndex(m => m.missionId === 'desafio-14-missao-2');
      return {index,...thirdGradeMissions[index],total:thirdGradeMissions.length};
    });
    assert.ok(mission.index > 0);
    assert.equal(mission.title,'Quanto mede?'); assert.equal(mission.questions.length,10);
    assert.deepEqual(mission.questions.map(q => q.ribbons),questions.map(q => q.ribbons));
    assert.equal(await page.evaluate(() => {
      const ids = thirdGradeMissions.flatMap(m => m.questions.map(q => q.id));
      return new Set(ids).size === ids.length;
    }),true);
    await page.evaluate(index => localStorage.setItem('orbita-teacher-data:teste-fitas',JSON.stringify({
      classes:[{id:1,name:'Turma de teste',grade:3,code:'FITAS-TESTE'}],
      students:[{id:1,name:'Teste Fitas',classId:1,track:3,coins:0,stars:0,correctAnswers:0,
        challengesAttempted:0,errors:[],journal:[],progress:90,additionPuzzleVersion:1,
        completedMissionIds:thirdGradeMissions.slice(0,index).map(m => m.missionId),
        completedChallengeIds:thirdGradeChallenges.slice(0,13).map(c => c.id),
        completedQuestionIds:[],lastDailyReward:localDateKey()}]
    })),mission.index);
    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Fitas');
      await page.locator('#auth-form [name="code"]').fill('FITAS-TESTE');
      await page.locator('#auth-form button[type="submit"]').click();
      await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
    }
    await login();
    const profile = () => page.evaluate(() => ({...currentStudent}));
    const check = page.locator('[data-check-challenge]'),next = page.locator('[data-next-challenge]');
    const feedback = page.locator('[data-feedback-copy]'),total = page.locator('[data-tape-total]');
    const piece = id => page.locator(`[data-tape-piece="${id}"]`);
    const placed = id => page.locator(`[data-tape-placed="${id}"]`);
    async function add(id,keyboard=false) {
      if (keyboard) { await piece(id).focus(); await page.keyboard.press('Enter'); }
      else await piece(id).click();
    }
    async function solveQuestion(question,keyboard=false) {
      const solution = solutions(question).at(-1);
      for (const id of solution) await add(id,keyboard);
      assert.equal(await total.textContent(),'100 cm');
    }
    async function startQuestion(index=0) {
      await page.evaluate(({missionIndex,index}) => {
        abandonMissionSession(); beginMissionSession(missionIndex); challengeStage = 'questions';
        currentChallengeIndex = index; setStudentView('challenge');
      },{missionIndex:mission.index,index});
    }
    await page.locator('[data-student-view="path"]').click();
    const group = page.locator('.challenge-path-group').filter({has:page.locator('header span',{hasText:'DESAFIO 14'})});
    assert.equal(await group.locator('.mission-node button').count(),3);
    assert.equal(await group.locator('.mission-node button').nth(1).isEnabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.pop(); renderMissionPath(); });
    assert.equal(await group.locator('.mission-node button').nth(1).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.push('desafio-14-missao-1'); renderMissionPath(); });
    await group.locator('.mission-node button').nth(1).click();
    assert.match(await page.locator('[data-mission-brief]').textContent(),/100 centímetros.*10 questões.*duas tentativas/);
    assert.equal(await page.locator('[data-lesson-video]').isVisible(),false);
    await page.locator('[data-begin-questions]').click();
    assert.equal(await check.isDisabled(),true);
    assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
    assert.equal(await page.evaluate(() => missionSession.attempts),0);
    const spoken = await page.evaluate(() => {
      const original = speakText; let text = '';
      try { speakText = copy => { text = copy; }; document.querySelector('[data-speak-question]').click(); }
      finally { speakText = original; }
      return text;
    });
    assert.equal(spoken,questions[0].spokenText);

    for (const [index,question] of questions.entries()) {
      assert.equal(await page.locator('[data-challenge-counter]').textContent(),`QUESTÃO ${index + 1} DE 10`);
      assert.equal(await total.textContent(),'0 cm');
      if (index < 2) {
        await add(question.ribbons[0].id); await check.click();
        assert.match(await feedback.textContent(),/Faltam.*mais uma tentativa/);
        assert.equal(await next.isVisible(),false);
        await page.locator('[data-tape-reset]').click();
        assert.equal(await page.evaluate(() => currentQuestionAttempt),1);
        assert.equal(await check.isDisabled(),true);
      }
      if (index === 1) {
        for (const ribbon of question.ribbons) await add(ribbon.id);
        await check.click();
        assert.match(await feedback.textContent(),/duas tentativas terminaram.*100 cm = 1 metro/);
        assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
      } else {
        await solveQuestion(question,index === 2);
        assert.equal(await next.isVisible(),false,'atingir 100 cm exige confirmação');
        await check.click();
        assert.equal(await feedback.textContent(),question.correct);
      }
      for (const button of await page.locator('.tape-activity button').all()) assert.equal(await button.isDisabled(),true);
      assert.equal(await next.isVisible(),true); await next.click();
    }
    const saved = await profile();
    assert.equal(saved.coins,525); assert.equal(saved.stars,0);
    assert.equal(saved.correctAnswers,9); assert.equal(saved.challengesAttempted,12);
    assert.equal(saved.errors.length,3); assert.equal(saved.completedQuestionIds.length,9);
    assert.ok(saved.completedMissionIds.includes(mission.missionId));
    assert.ok(!saved.completedChallengeIds.includes('desafio-14'));
    assert.equal(saved.progress,Math.round((mission.index + 1) / mission.total * 100));
    console.log('Dez questões, combinação alternativa, confirmação, tentativas, desbloqueio e recompensas conferidos.');

    await startQuestion();
    for (const [index,question] of questions.entries()) {
      if (index === 1) { await add(question.ribbons[0].id); await check.click(); await check.click(); }
      else { await solveQuestion(question); await check.click(); }
      await next.click();
    }
    assert.equal((await profile()).coins,saved.coins); assert.equal((await profile()).stars,saved.stars);
    await page.reload(); await login();
    assert.equal((await profile()).coins,saved.coins);
    assert.ok((await profile()).completedMissionIds.includes(mission.missionId));

    // Retirar peças, não repetir peças, arrastar para montar e desfazer, cancelar e abandonar.
    await startQuestion();
    const id = questions[0].ribbons[0].id;
    await add(id); assert.equal(await piece(id).isDisabled(),true);
    await placed(id).click(); assert.equal(await total.textContent(),'0 cm');
    assert.equal(await piece(id).isEnabled(),true);
    async function dragTo(source,target) {
      const a = await source.boundingBox(),b = await target.boundingBox();
      await page.mouse.move(a.x + a.width / 2,a.y + a.height / 2); await page.mouse.down();
      await page.mouse.move(b.x + b.width / 2,b.y + b.height / 2,{steps:10}); await page.mouse.up();
    }
    await dragTo(piece(id),page.locator('[data-tape-assembly]'));
    assert.equal(await total.textContent(),'20 cm');
    await dragTo(placed(id),page.locator('[data-tape-tray]'));
    assert.equal(await total.textContent(),'0 cm');
    const a = await piece(id).boundingBox();
    await page.mouse.move(a.x + a.width / 2,a.y + a.height / 2); await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2 + 20,a.y + a.height / 2,{steps:4});
    assert.equal(await page.locator('.tape-drag-ghost').count(),1);
    await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1,bubbles:true})));
    await page.mouse.up(); assert.equal(await total.textContent(),'0 cm');
    assert.equal(await page.locator('.tape-drag-ghost').count(),0);
    await add(id); await page.locator('[data-student-view="home"]').click();
    assert.equal(await page.evaluate(() => missionSession),null);
    assert.equal((await profile()).coins,saved.coins);
    console.log('Persistência, repetição sem moedas duplicadas, arraste, retirada e cancelamento conferidos.');

    let layouts = 0;
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740},{width:812,height:375}]) {
      await page.setViewportSize(viewport);
      for (const index of [0,2,5,9]) {
        await startQuestion(index);
        for (const ribbon of questions[index].ribbons) await add(ribbon.id);
        assert.ok(parseInt(await total.textContent(),10) > 100);
        await check.click(); await check.click();
        const bounds = await page.evaluate(() => {
          const card = document.querySelector('.challenge-card').getBoundingClientRect();
          return {overflow:document.documentElement.scrollWidth > innerWidth,bottom:card.bottom,
            next:document.querySelector('[data-next-challenge]').getBoundingClientRect().bottom,
            outside:[...document.querySelectorAll('[data-tape-piece]')].some(button => {
              const rect = button.getBoundingClientRect(); return rect.left < card.left || rect.right > card.right;
            }),scroll:document.querySelector('.tape-viewport').scrollWidth > document.querySelector('.tape-viewport').clientWidth};
        });
        assert.equal(bounds.overflow,false,`${viewport.width}px: sem rolagem horizontal na página`);
        assert.equal(bounds.outside,false,`${viewport.width}px: peças no cartão`);
        assert.equal(bounds.scroll,true,'montagens maiores que 1 m continuam disponíveis por rolagem interna');
        if (viewport.width >= 951) { assert.ok(bounds.bottom <= viewport.height,`cartão cabe em ${viewport.width}px (${bounds.bottom})`); assert.ok(bounds.next <= viewport.height); }
        if (process.env.ORBITA_SCREENSHOTS && index === 2) {
          await startQuestion(index); await solveQuestion(questions[index]); await check.click();
          fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
          await page.locator('[data-student-section="challenge"]').screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`quanto-mede-${viewport.width}.png`)});
        }
        layouts++;
      }
    }
    const touch = await browser.newContext({viewport:{width:375,height:812},hasTouch:true,isMobile:true}),touchPage = await touch.newPage();
    await touchPage.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    await touchPage.evaluate(index => {
      currentStudent = {track:3,completedMissionIds:[],completedQuestionIds:[]};
      beginMissionSession(index); challengeStage = 'questions'; setStudentView('challenge');
      document.querySelector('[data-screen="student"]').hidden = false; document.querySelector('[data-screen="student"]').classList.add('screen--active');
      document.querySelector('[data-screen="home"]').hidden = true;
    },mission.index);
    await touchPage.locator(`[data-tape-piece="${id}"]`).tap();
    assert.equal(await touchPage.locator('[data-tape-total]').textContent(),'20 cm');
    await touchPage.locator(`[data-tape-placed="${id}"]`).tap();
    assert.equal(await touchPage.locator('[data-tape-total]').textContent(),'0 cm');
    await touchPage.close(); await touch.close();
    assert.deepEqual(errors,[]);
    console.log(`${layouts} layouts, régua, medidas proporcionais e toque no celular conferidos; sem erros de JavaScript.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
