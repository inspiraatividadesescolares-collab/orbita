const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');
const cross = require('../cross-operations.js');
const answers = Object.fromEntries(cross.challenge.missions.flatMap(m => m.questions).map(question => {
  const correct = cross.solutions(question)[0],wrong = correct.slice();
  const different = wrong.findIndex(id => question.numbers[id] !== question.numbers[wrong[0]]);
  [wrong[0],wrong[different]] = [wrong[different],wrong[0]];
  return [question.id,{correct,wrong}];
}));

async function main() {
  const browser = await chromium.launch({headless:true,channel:process.env.ORBITA_BROWSER_CHANNEL || 'chrome'});
  try {
    const page = await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'}),errors = [];
    page.setDefaultTimeout(10000); page.on('pageerror',error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('orbita-sound-enabled','false'));
    await page.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    const missions = await page.evaluate(() => thirdGradeMissions.map((m,index) => ({...m,index})).filter(m => m.challengeId === 'desafio-15'));
    const total = await page.evaluate(() => thirdGradeMissions.length);
    assert.equal(missions.length,3); assert.ok(total >= 45);
    assert.deepEqual(missions.map(m => m.questions),cross.challenge.missions.map(m => m.questions));
    assert.equal(await page.evaluate(() => {
      const ids = thirdGradeMissions.flatMap(m => m.questions.map(q => q.id));
      return new Set(ids).size === ids.length;
    }),true);
    await page.evaluate(index => localStorage.setItem('orbita-teacher-data:teste-cruzadas',JSON.stringify({
      classes:[{id:1,name:'Turma de teste',grade:3,code:'CRUZA-TESTE'}],
      students:[{id:1,name:'Teste Cruzadas',classId:1,track:3,coins:0,stars:0,correctAnswers:0,challengesAttempted:0,
        errors:[],journal:[],progress:93,additionPuzzleVersion:1,completedQuestionIds:[],
        completedMissionIds:thirdGradeMissions.slice(0,index).map(m => m.missionId),
        completedChallengeIds:thirdGradeChallenges.slice(0,14).map(c => c.id),lastDailyReward:localDateKey()}]
    })),missions[0].index);
    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Cruzadas');
      await page.locator('#auth-form [name="code"]').fill('CRUZA-TESTE');
      await page.locator('#auth-form button[type="submit"]').click();
      await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
    }
    await login();
    const check = page.locator('[data-check-challenge]'),next = page.locator('[data-next-challenge]'),feedback = page.locator('[data-feedback-copy]');
    const token = id => page.locator(`[data-cross-token="${id}"]`),slot = id => page.locator(`[data-cross-slot="${id}"]`);
    const profile = () => page.evaluate(() => ({...currentStudent}));
    async function fill(question,{wrong=false,keyboard=false,numberFirst=false}={}) {
      const order = answers[question.id][wrong ? 'wrong' : 'correct'];
      for (const [position,id] of order.entries()) {
        const buttons = numberFirst ? [token(id),slot(position)] : [slot(position),token(id)];
        for (const button of buttons) {
          if (keyboard) { await button.focus(); await page.keyboard.press('Enter'); }
          else await button.click();
        }
        assert.equal(await slot(position).getAttribute('data-cross-placed'),String(id));
      }
      assert.equal(await check.isEnabled(),true);
    }
    async function startQuestion(mission=missions[0],index=0) {
      await page.evaluate(({missionIndex,index}) => {
        abandonMissionSession(); beginMissionSession(missionIndex); challengeStage = 'questions';
        currentChallengeIndex = index; setStudentView('challenge'); window.scrollTo(0,0);
      },{missionIndex:mission.index,index});
    }

    await page.locator('[data-student-view="path"]').click();
    const group = page.locator('.challenge-path-group').filter({has:page.locator('header span',{hasText:'DESAFIO 15'})});
    assert.equal(await group.locator('.mission-node').count(),3);
    assert.equal(await group.locator('.mission-node button').nth(0).isEnabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(1).isDisabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(2).isDisabled(),true);
    await group.locator('.mission-node button').nth(0).click();
    for (const [missionIndex,mission] of missions.entries()) {
      assert.match(await page.locator('[data-mission-brief]').textContent(),/10 cruzadinhas.*duas tentativas/);
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
          assert.equal(spoken,question.spokenText);
        }
        if (questionIndex === 0 && missionIndex < 2) {
          await fill(question,{wrong:true}); await check.click();
          assert.match(await feedback.textContent(),/horizontal|vertical/);
          assert.equal(await next.isVisible(),false);
          assert.equal(await slot(0).isEnabled(),true);
          if (missionIndex === 0) {
            await page.locator('[data-cross-reset]').click();
            assert.equal(await page.evaluate(() => currentQuestionAttempt),1);
            assert.equal(await check.isDisabled(),true);
          } else {
            await check.click();
            assert.equal(await feedback.textContent(),`As duas tentativas terminaram. Confira uma solução: ${cross.resolution(question)}`);
            assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
          }
        }
        if (!(missionIndex === 1 && questionIndex === 0)) {
          await fill(question,{keyboard:questionIndex === 2,numberFirst:questionIndex % 2 === 1});
          await check.click(); assert.equal(await feedback.textContent(),question.correct);
        }
        for (const button of await page.locator('.cross-activity button').all()) assert.equal(await button.isDisabled(),true);
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
    assert.ok(saved.completedChallengeIds.includes('desafio-15'));
    assert.equal(saved.progress,Math.round((missions.at(-1).index + 1) / total * 100));
    await startQuestion();
    for (const question of missions[0].questions) { await fill(question); await check.click(); await next.click(); }
    assert.equal((await profile()).coins,saved.coins); assert.equal((await profile()).stars,saved.stars);
    await page.reload(); await login();
    assert.equal((await profile()).coins,saved.coins);
    assert.ok((await profile()).completedChallengeIds.includes('desafio-15'));
    console.log('30 questões, leitura, duas tentativas, teclado, desbloqueio, persistência e recompensas conferidos.');

    // Peças continuam únicas ao trocar, devolver e arrastar, mesmo com valores repetidos.
    await startQuestion();
    await slot(0).click(); await token(0).click();
    await slot(0).click(); await token(1).click();
    assert.equal(await token(0).isVisible(),true); assert.equal(await slot(0).getAttribute('data-cross-placed'),'1');
    await token(0).click(); await slot(1).click();
    await slot(0).click(); await slot(1).click();
    assert.equal(await slot(0).getAttribute('data-cross-placed'),'0'); assert.equal(await slot(1).getAttribute('data-cross-placed'),'1');
    await slot(1).click(); await page.locator('[data-cross-return]').click();
    assert.equal(await slot(1).getAttribute('data-cross-placed'),''); assert.equal(await token(1).isVisible(),true);
    await page.locator('[data-cross-reset]').click();
    async function dragTo(source,target) {
      const a = await source.boundingBox(),b = await target.boundingBox();
      await page.mouse.move(a.x + a.width / 2,a.y + a.height / 2); await page.mouse.down();
      await page.mouse.move(b.x + b.width / 2,b.y + b.height / 2,{steps:10}); await page.mouse.up();
    }
    await dragTo(token(0),slot(0)); assert.equal(await slot(0).getAttribute('data-cross-placed'),'0');
    await dragTo(slot(0),slot(1)); assert.equal(await slot(1).getAttribute('data-cross-placed'),'0');
    await dragTo(slot(1),page.locator('[data-cross-bank] > span')); assert.equal(await token(0).isVisible(),true);
    const point = await token(0).boundingBox();
    await page.mouse.move(point.x + point.width / 2,point.y + point.height / 2); await page.mouse.down();
    await page.mouse.move(point.x + point.width / 2 + 20,point.y + point.height / 2,{steps:4});
    assert.equal(await page.locator('.cross-drag-ghost').count(),1);
    await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1,bubbles:true})));
    await page.mouse.up(); assert.equal(await page.locator('.cross-drag-ghost').count(),0);
    await slot(0).focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Escape');
    assert.equal(await slot(0).getAttribute('aria-pressed'),'false');
    await page.locator('[data-student-view="home"]').click();
    assert.equal(await page.evaluate(() => crossOperations.submit()),null);

    let layouts = 0;
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      for (const mission of missions) for (const [index,question] of mission.questions.entries()) {
        for (const stage of ['initial','error','final-error','success']) {
          await startQuestion(mission,index);
          const bounds = await page.evaluate(({order,stage}) => {
            const click = selector => document.querySelector(selector).click();
            if (stage !== 'initial') {
              order.forEach((id,slot) => { click(`[data-cross-slot="${slot}"]`); click(`[data-cross-token="${id}"]`); });
              click('[data-check-challenge]');
              if (stage === 'final-error') click('[data-check-challenge]');
            }
            window.scrollTo(0,0);
            const card = document.querySelector('.challenge-card').getBoundingClientRect();
            const controls = [...document.querySelectorAll('[data-cross-slot],[data-cross-token],[data-check-challenge],[data-next-challenge]')].filter(el => !el.hidden && el.getClientRects().length).map(el => el.getBoundingClientRect());
            return {overflow:document.documentElement.scrollWidth > innerWidth,bottom:card.bottom,
              documentHeight:document.scrollingElement.scrollHeight,
              outside:controls.some(rect => rect.left < card.left || rect.right > card.right || rect.left < 0 || rect.right > innerWidth),
              slotWidth:document.querySelector('[data-cross-slot]').getBoundingClientRect().width};
          },{order:answers[question.id][stage === 'success' ? 'correct' : 'wrong'],stage});
          assert.equal(bounds.overflow,false,`${viewport.width}: ${question.id} ${stage} sem rolagem horizontal`);
          assert.equal(bounds.outside,false,`${viewport.width}: ${question.id} ${stage} todos os controles dentro do cartão`);
          if (viewport.width > 950) {
            assert.ok(bounds.bottom <= viewport.height - 6,`${question.id} ${stage} em ${viewport.width} × ${viewport.height}: cartão até ${bounds.bottom}`);
            assert.ok(bounds.documentHeight <= viewport.height + 1,`${question.id} ${stage}: sem rolagem no computador`);
          }
          if (process.env.ORBITA_SCREENSHOTS && index === 0 && stage === 'initial') {
            fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
            await page.locator('[data-student-section="challenge"]').screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`cruza-${mission.missionNumber}-${viewport.width}.png`)});
          }
          layouts++;
        }
      }
    }
    console.log(`${layouts} estados de tela conferidos no computador e no celular.`);

    const touch = await browser.newContext({viewport:{width:375,height:812},hasTouch:true,isMobile:true}),touchPage = await touch.newPage();
    touchPage.on('pageerror',error => errors.push(error.message));
    await touchPage.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    await touchPage.evaluate(index => {
      currentStudent = {track:3,completedMissionIds:[],completedQuestionIds:[]};
      beginMissionSession(index); challengeStage = 'questions'; setStudentView('challenge');
      document.querySelector('[data-screen="student"]').hidden = false; document.querySelector('[data-screen="student"]').classList.add('screen--active');
      document.querySelector('[data-screen="home"]').hidden = true;
    },missions[0].index);
    await touchPage.locator('[data-cross-slot="0"]').tap(); await touchPage.locator('[data-cross-token="0"]').tap();
    assert.equal(await touchPage.locator('[data-cross-slot="0"]').getAttribute('data-cross-placed'),'0');
    const cdp = await touch.newCDPSession(touchPage);
    await touchPage.locator('[data-cross-token="1"]').scrollIntoViewIfNeeded();
    const a = await touchPage.locator('[data-cross-token="1"]').boundingBox(),b = await touchPage.locator('[data-cross-slot="1"]').boundingBox();
    const start = {x:a.x + a.width / 2,y:a.y + a.height / 2},end = {x:b.x + b.width / 2,y:b.y + b.height / 2};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
    for (let step = 1; step <= 10; step++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x + (end.x - start.x) * step / 10,y:start.y + (end.y - start.y) * step / 10}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await touchPage.locator('[data-cross-slot="1"]').getAttribute('data-cross-placed'),'1');
    await touchPage.locator('[data-cross-slot="2"]').tap(); await touchPage.locator('[data-cross-token="2"]').tap();
    assert.equal(await touchPage.locator('[data-cross-slot="2"]').getAttribute('data-cross-placed'),'2');
    assert.equal(await touchPage.locator('.cross-drag-ghost').count(),0);
    await touch.close(); assert.deepEqual(errors,[]);
    console.log('Arraste com mouse e toque, troca de peças, devolução, cancelamento e limpeza conferidos.');
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
