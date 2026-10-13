const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');
const {mission:sourceMission,solutions,balance} = require('../weight-missions.js');
const questions = sourceMission.questions;

async function main() {
  const browser = await chromium.launch({headless:true,channel:process.env.ORBITA_BROWSER_CHANNEL || 'chrome'});
  try {
    const page = await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'}),errors = [];
    page.setDefaultTimeout(10000); page.on('pageerror',error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('orbita-sound-enabled','false'));
    await page.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    const mission = await page.evaluate(() => {
      const index = thirdGradeMissions.findIndex(m => m.missionId === 'desafio-14-missao-3');
      return {index,...thirdGradeMissions[index],total:thirdGradeMissions.length};
    });
    assert.ok(mission.index > 0); assert.equal(mission.title,'Quanto pesa?');
    assert.deepEqual(mission.questions.map(q => [q.fruit,q.mass,q.weights]),questions.map(q => [q.fruit,q.mass,q.weights]));
    assert.equal(await page.evaluate(() => {
      const ids = thirdGradeMissions.flatMap(m => m.questions.map(q => q.id));
      return new Set(ids).size === ids.length;
    }),true);
    await page.evaluate(index => localStorage.setItem('orbita-teacher-data:teste-massas',JSON.stringify({
      classes:[{id:1,name:'Turma de teste',grade:3,code:'MASSAS-TESTE'}],
      students:[{id:1,name:'Teste Massas',classId:1,track:3,coins:0,stars:0,correctAnswers:0,challengesAttempted:0,
        errors:[],journal:[],progress:90,additionPuzzleVersion:1,
        completedMissionIds:thirdGradeMissions.slice(0,index).map(m => m.missionId),
        completedChallengeIds:thirdGradeChallenges.slice(0,13).map(c => c.id),
        completedQuestionIds:[],lastDailyReward:localDateKey()}]
    })),mission.index);
    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Massas');
      await page.locator('#auth-form [name="code"]').fill('MASSAS-TESTE');
      await page.locator('#auth-form button[type="submit"]').click();
      await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
    }
    await login();
    const profile = () => page.evaluate(() => ({...currentStudent}));
    const check = page.locator('[data-check-challenge]'),next = page.locator('[data-next-challenge]');
    const input = page.locator('[data-mass-answer]'),feedback = page.locator('[data-feedback-copy]');
    const weight = index => page.locator(`[data-mass-weight="${index}"]`);
    const zone = place => page.locator(`[data-mass-zone="${place}"]`);
    async function move(index,place,keyboard=false) {
      if (keyboard) {
        await weight(index).focus(); await page.keyboard.press('Enter');
        await zone(place).focus(); await page.keyboard.press(' ');
      } else {
        await weight(index).click();
        await zone(place).locator(place === 'bank' ? '.mass-bank-heading > span' : '.mass-pan-bowl').click();
      }
      assert.equal(await weight(index).getAttribute('data-mass-place'),place);
      assert.equal(await page.locator('[data-mass-weight]').count(),3,'cada peso fica em um único lugar');
    }
    async function solveQuestion(question,keyboard=false,solutionIndex=-1) {
      const solution = solutions(question).at(solutionIndex);
      for (const [index,place] of solution.entries()) if (place !== 'bank') await move(index,place,keyboard);
      assert.equal(await input.isEnabled(),true);
      assert.match(await page.locator('[data-mass-status]').textContent(),/equilibrada/);
      const totals = balance(question,solution);
      assert.equal(await page.locator('[data-mass-left]').textContent(),`${totals.left} kg`);
      assert.equal(await page.locator('[data-mass-right]').textContent(),`${totals.right} kg`);
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
    await page.evaluate(() => { currentStudent.completedMissionIds.pop(); renderMissionPath(); });
    assert.equal(await group.locator('.mission-node button').nth(2).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.push('desafio-14-missao-2'); renderMissionPath(); });
    await group.locator('.mission-node button').nth(2).click();
    assert.match(await page.locator('[data-mission-brief]').textContent(),/10 questões.*duas tentativas/);
    await page.locator('[data-begin-questions]').click();
    assert.equal(await check.isDisabled(),true); assert.equal(await input.isDisabled(),true);
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
      assert.equal(await input.isDisabled(),true); assert.equal(await input.inputValue(),'');
      await solveQuestion(question,index === 2);
      assert.equal(await check.isDisabled(),true);
      await input.fill('abc'); assert.equal(await check.isDisabled(),true);
      assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
      assert.equal(await next.isVisible(),false);
      if (index < 2) {
        await input.fill(String(question.mass + 1)); await check.click();
        assert.match(await feedback.textContent(),/diferença.*mais uma tentativa/);
        assert.equal(await next.isVisible(),false);
        await page.locator('[data-mass-reset]').click();
        assert.equal(await page.evaluate(() => currentQuestionAttempt),1);
        assert.equal(await check.isDisabled(),true); assert.equal(await input.isDisabled(),true);
        await solveQuestion(question);
      }
      if (index === 1) {
        await input.fill('0'); await input.press('Enter');
        assert.match(await feedback.textContent(),/duas tentativas terminaram.*3 kg/);
        assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
      } else {
        await input.fill(`${question.mass},0`);
        assert.equal(await next.isVisible(),false,'equilíbrio e resposta exigem confirmação');
        await input.press('Enter'); assert.equal(await feedback.textContent(),question.correct);
      }
      assert.equal(await input.isDisabled(),true);
      for (const button of await page.locator('.weight-activity button').all()) assert.equal(await button.isDisabled(),true);
      for (const area of await page.locator('[data-mass-zone]').all()) assert.equal(await area.getAttribute('aria-disabled'),'true');
      assert.equal(await next.isVisible(),true); await next.click();
    }
    const saved = await profile();
    assert.equal(saved.coins,775); assert.equal(saved.stars,3);
    assert.equal(saved.correctAnswers,9); assert.equal(saved.challengesAttempted,12);
    assert.equal(saved.errors.length,3); assert.equal(saved.completedQuestionIds.length,9);
    assert.ok(saved.completedMissionIds.includes(mission.missionId));
    assert.ok(saved.completedChallengeIds.includes('desafio-14')); assert.equal(saved.progress,Math.round((mission.index + 1) / mission.total * 100));
    console.log('Dez frutas, equilíbrio, cálculo, teclado, tentativas persistentes, desbloqueio e recompensas conferidos.');

    await startQuestion();
    for (const [index,question] of questions.entries()) {
      await solveQuestion(question);
      if (index === 1) { await input.fill('0'); await check.click(); await check.click(); }
      else { await input.fill(String(question.mass)); await check.click(); }
      await next.click();
    }
    assert.equal((await profile()).coins,saved.coins); assert.equal((await profile()).stars,saved.stars);
    await page.reload(); await login(); assert.equal((await profile()).coins,saved.coins);
    assert.ok((await profile()).completedMissionIds.includes(mission.missionId));

    await startQuestion();
    async function dragTo(source,target) {
      const a = await source.boundingBox(),b = await target.boundingBox();
      await page.mouse.move(a.x + a.width / 2,a.y + a.height / 2); await page.mouse.down();
      await page.mouse.move(b.x + b.width / 2,b.y + b.height / 2,{steps:10}); await page.mouse.up();
    }
    await dragTo(weight(0),zone('right')); assert.equal(await weight(0).getAttribute('data-mass-place'),'right');
    await dragTo(weight(0),zone('left')); assert.equal(await weight(0).getAttribute('data-mass-place'),'left');
    await dragTo(weight(0),zone('bank')); assert.equal(await weight(0).getAttribute('data-mass-place'),'bank');
    const a = await weight(0).boundingBox();
    await page.mouse.move(a.x + a.width / 2,a.y + a.height / 2); await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2 + 20,a.y + a.height / 2,{steps:4});
    assert.equal(await page.locator('.mass-drag-ghost').count(),1);
    await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1,bubbles:true})));
    await page.mouse.up(); assert.equal(await page.locator('.mass-drag-ghost').count(),0);
    assert.equal(await weight(0).getAttribute('data-mass-place'),'bank');
    await solveQuestion(questions[0]); await input.fill('8');
    await move(0,'bank'); assert.equal(await input.isDisabled(),true); assert.equal(await input.inputValue(),'');
    await page.locator('[data-student-view="home"]').click();
    assert.equal(await page.evaluate(() => missionSession),null); assert.equal((await profile()).coins,saved.coins);
    console.log('Arraste entre os três locais, cancelamento, abandono e repetição sem recompensa duplicada conferidos.');

    let layouts = 0;
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740},{width:812,height:375}]) {
      await page.setViewportSize(viewport);
      for (const index of [0,2,5,9]) {
        await startQuestion(index);
        // Pior ocupação: a fruta e os três pesos no mesmo prato.
        for (let i = 0; i < 3; i++) await move(i,'left');
        let bounds = await page.evaluate(() => {
          const card = document.querySelector('.challenge-card').getBoundingClientRect();
          return {overflow:document.documentElement.scrollWidth > innerWidth,
            outside:[...document.querySelectorAll('[data-mass-weight],.mass-pan,.mass-fruit')].some(element => {
              const r = element.getBoundingClientRect(); return r.left < card.left || r.right > card.right;
            })};
        });
        assert.equal(bounds.overflow,false,`${viewport.width}px: sem rolagem horizontal`);
        assert.equal(bounds.outside,false,`${viewport.width}px: objetos cabem no cartão`);
        await page.locator('[data-mass-reset]').click(); await solveQuestion(questions[index]);
        await input.fill('0'); await check.click(); await check.click();
        bounds = await page.evaluate(() => ({overflow:document.documentElement.scrollWidth > innerWidth,
          bottom:document.querySelector('.challenge-card').getBoundingClientRect().bottom,
          images:[...document.querySelectorAll('.weight-activity img')].every(img => img.complete && img.naturalWidth > 0)}));
        assert.equal(bounds.overflow,false); assert.equal(bounds.images,true,'ilustrações carregadas');
        if (viewport.width >= 951) assert.ok(bounds.bottom <= viewport.height,`cartão cabe em ${viewport.width}px (${bounds.bottom})`);
        if (process.env.ORBITA_SCREENSHOTS && index === 0) {
          fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
          await page.locator('[data-student-section="challenge"]').screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`quanto-pesa-${viewport.width}.png`)});
        }
        layouts++;
      }
    }
    // Todas as distribuições válidas, incluindo as alternativas, funcionam na tela.
    await page.setViewportSize({width:1366,height:768});
    for (const [index,question] of questions.entries()) for (const solutionIndex of solutions(question).keys()) {
      await startQuestion(index); await solveQuestion(question,false,solutionIndex);
      await input.fill(String(question.mass)); await check.click(); assert.equal(await feedback.textContent(),question.correct);
    }
    const touch = await browser.newContext({viewport:{width:375,height:812},hasTouch:true,isMobile:true}),touchPage = await touch.newPage();
    await touchPage.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    await touchPage.evaluate(index => {
      currentStudent = {track:3,completedMissionIds:[],completedQuestionIds:[]};
      beginMissionSession(index); challengeStage = 'questions'; setStudentView('challenge');
      document.querySelector('[data-screen="student"]').hidden = false; document.querySelector('[data-screen="student"]').classList.add('screen--active');
      document.querySelector('[data-screen="home"]').hidden = true;
    },mission.index);
    await touchPage.locator('[data-mass-weight="0"]').tap(); await touchPage.locator('[data-mass-zone="right"]').tap();
    assert.equal(await touchPage.locator('[data-mass-weight="0"]').getAttribute('data-mass-place'),'right');
    await touchPage.locator('[data-mass-weight="0"]').tap(); await touchPage.locator('[data-mass-zone="bank"] .mass-bank-heading > span').tap();
    assert.equal(await touchPage.locator('[data-mass-weight="0"]').getAttribute('data-mass-place'),'bank');
    await touchPage.close(); await touch.close(); assert.deepEqual(errors,[]);
    console.log(`${layouts} layouts, todas as soluções, frutas e toque no celular conferidos; sem erros de JavaScript.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
