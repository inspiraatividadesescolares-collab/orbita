const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');
const {mission:source} = require('../division-problems.js');

async function main() {
  const browser = await chromium.launch({headless:true,channel:process.env.ORBITA_BROWSER_CHANNEL || 'chrome'});
  try {
    const context = await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});
    const page = await context.newPage(),errors = [];
    page.setDefaultTimeout(8000); page.on('pageerror',error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('orbita-sound-enabled','false'));
    await page.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    const mission = await page.evaluate(() => {
      const index = thirdGradeMissions.findIndex(m => m.missionId === 'desafio-17-missao-3');
      return {...thirdGradeMissions[index],index};
    });
    assert.deepEqual(mission.questions,source.questions);
    await page.evaluate(index => localStorage.setItem('orbita-teacher-data:teste-problemas',JSON.stringify({
      classes:[{id:1,name:'Turma de teste',grade:3,code:'PROBLEMAS17'}],
      students:[{id:1,name:'Teste Problemas',classId:1,track:3,coins:0,stars:0,correctAnswers:0,challengesAttempted:0,
        errors:[],journal:[],progress:90,additionPuzzleVersion:1,completedQuestionIds:[],
        completedMissionIds:thirdGradeMissions.slice(0,index).map(m => m.missionId),
        completedChallengeIds:thirdGradeChallenges.slice(0,16).map(c => c.id),lastDailyReward:localDateKey()}]
    })),mission.index);
    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Problemas');
      await page.locator('#auth-form [name="code"]').fill('PROBLEMAS17');
      await page.locator('#auth-form button[type="submit"]').click();
      await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
    }
    await login();
    const input = page.locator('[data-calculation-answer]'),check = page.locator('[data-check-challenge]'),next = page.locator('[data-next-challenge]');
    const board = page.locator('[data-calculation-board]'),feedback = page.locator('[data-feedback-copy]');
    const profile = () => page.evaluate(() => ({...currentStudent}));
    async function startQuestion(index) {
      await page.evaluate(({missionIndex,index}) => {
        abandonMissionSession(); beginMissionSession(missionIndex); challengeStage = 'questions';
        currentChallengeIndex = index; setStudentView('challenge'); window.scrollTo(0,0);
      },{missionIndex:mission.index,index});
    }
    async function build(q,native=false) {
      assert.equal(await page.locator('[data-calculation-copy]').count(),0);
      if (!native) {
        await page.evaluate(() => {
          const q = activeQuestionSet()[currentChallengeIndex],area = document.querySelector('[data-calculation-board]'),place = document.querySelector('[data-calculation-place]');
          const columns = Math.min(q.divisor,innerWidth <= 600 ? 2 : 5),rows = Math.ceil(q.divisor / columns);
          function drop(x,y) { const r = area.getBoundingClientRect(); place.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1,clientX:r.left + x,clientY:r.top + y})); }
          document.querySelector('[data-calculation-tool="frame"]').click();
          for (let i = 0;i < q.divisor;i++) { const r = area.getBoundingClientRect(); drop(r.width * (i % columns + .5) / columns,r.height * (Math.floor(i / columns) + .5) / rows); }
          document.querySelector('[data-calculation-tool="cap"]').click();
          const perPart = Number(q.answer),size = innerWidth <= 600 ? 23 : innerHeight <= 650 ? 20 : 28;
          for (const frame of document.querySelectorAll('.calculation-copy--frame')) {
            const r = frame.getBoundingClientRect(),a = area.getBoundingClientRect();
            const cols = Math.max(1,Math.min(perPart,Math.floor(r.width * .6 / size))),rows = Math.ceil(perPart / cols);
            for (let i = 0;i < perPart;i++) drop(r.left - a.left + r.width * (cols === 1 ? .5 : .2 + (i % cols) * .6 / (cols - 1)),r.top - a.top + r.height * (rows === 1 ? .5 : .2 + Math.floor(i / cols) * .6 / (rows - 1)));
          }
        });
      } else {
        const viewport = page.viewportSize(),columns = Math.min(q.divisor,viewport.width <= 600 ? 2 : 5),rows = Math.ceil(q.divisor / columns);
        async function drag(kind,x,y) {
          const s = await page.locator(`[data-calculation-tool="${kind}"]`).boundingBox(),a = await board.boundingBox();
          await page.mouse.move(s.x + s.width / 2,s.y + s.height / 2); await page.mouse.down();
          await page.mouse.move(a.x + x,a.y + y,{steps:4}); await page.mouse.up();
        }
        for (let i = 0;i < q.divisor;i++) { const a = await board.boundingBox(); await drag('frame',a.width * (i % columns + .5) / columns,a.height * (Math.floor(i / columns) + .5) / rows); }
        const perPart = Number(q.answer),size = viewport.height <= 650 ? 20 : 28;
        for (let group = 0;group < q.divisor;group++) {
          const r = await page.locator('.calculation-copy--frame').nth(group).boundingBox(),a = await board.boundingBox();
          const cols = Math.max(1,Math.min(perPart,Math.floor(r.width * .6 / size))),rows = Math.ceil(perPart / cols);
          for (let i = 0;i < perPart;i++) await drag('cap',r.x - a.x + r.width * (cols === 1 ? .5 : .2 + (i % cols) * .6 / (cols - 1)),r.y - a.y + r.height * (rows === 1 ? .5 : .2 + Math.floor(i / cols) * .6 / (rows - 1)));
        }
      }
      assert.equal(await page.locator('[data-calculation-tool="cap"]').count(),1);
      assert.equal(await page.locator('[data-calculation-tool="frame"]').count(),1);
      assert.equal(await page.locator('.calculation-copy--cap').count(),q.total);
      assert.equal(await page.locator('.calculation-copy--frame').count(),q.divisor);
      assert.equal(await input.isEnabled(),true,`${q.id}: ${await page.locator('[data-calculation-answer-help]').textContent()}`);
    }
    await page.locator('[data-student-view="path"]').click();
    const group = page.locator('.challenge-path-group').filter({has:page.locator('header span',{hasText:'DESAFIO 17'})});
    assert.equal(await group.locator('.mission-node button').count(),3);
    await page.evaluate(() => { currentStudent.completedMissionIds.pop(); renderMissionPath(); });
    assert.equal(await group.locator('.mission-node button').nth(2).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.push('desafio-17-missao-2'); renderMissionPath(); });
    await group.locator('.mission-node button').nth(2).click();
    assert.match(await page.locator('[data-mission-brief]').textContent(),/Problemas envolvendo divisão/);
    await page.locator('[data-begin-questions]').click();
    for (const [index,q] of mission.questions.entries()) {
      assert.equal(await page.locator('[data-challenge-counter]').textContent(),`QUESTÃO ${index + 1} DE 10`);
      assert.equal(await page.locator('[data-challenge-question]').textContent(),q.text);
      assert.equal(await page.locator('[data-calculation-tool]').count(),2);
      assert.equal(await input.isDisabled(),true); assert.equal(await check.isDisabled(),true);
      assert.equal(await page.locator('[data-calculation-choice]').count(),0);
      assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
      await build(q,index === 0 || index === 5);
      if (index === 0) {
        await input.fill('abc'); assert.equal(await check.isDisabled(),true);
        assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
        assert.equal(await page.evaluate(() => currentQuestionAttempt),0);
        await input.fill('4'); await check.click(); assert.equal(await next.isVisible(),false);
        await page.locator('[data-calculation-reset]').click();
        assert.equal(await page.evaluate(() => currentQuestionAttempt),1); assert.equal(await input.isDisabled(),true);
        await build(q); await input.fill(q.answer); await input.press('Enter');
      } else if (index === 5) {
        await input.fill('1'); await check.click(); await input.fill('2'); await check.click();
        assert.match(await feedback.textContent(),/As duas tentativas terminaram/);
      } else { await input.fill(q.answer); await check.click(); }
      if (index !== 5) assert.equal(await feedback.textContent(),q.correct);
      assert.equal(await next.isVisible(),true);
      assert.equal(await input.isDisabled(),true);
      assert.equal(await page.locator('[data-calculation-tool="cap"]').isDisabled(),true);
      assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
      await next.click();
    }
    const saved = await profile();
    assert.ok(saved.completedMissionIds.includes(mission.missionId)); assert.ok(saved.completedChallengeIds.includes('desafio-17'));
    assert.equal(saved.coins,775); assert.equal(saved.stars,3); assert.equal(saved.progress,100);
    assert.equal(saved.completedQuestionIds.length,9); assert.equal(saved.correctAnswers,9); assert.equal(saved.challengesAttempted,12);
    await startQuestion(0);
    for (const [index,q] of mission.questions.entries()) {
      await build(q);
      if (index === 5) { await input.fill('1'); await check.click(); await input.fill('2'); await check.click(); }
      else { await input.fill(q.answer); await check.click(); }
      await next.click();
    }
    assert.equal((await profile()).coins,saved.coins); assert.equal((await profile()).stars,saved.stars);
    await page.reload(); await login(); assert.equal((await profile()).coins,saved.coins);
    let layouts = 0;
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      for (const [index,q] of mission.questions.entries()) {
        await startQuestion(index);
        await page.locator('.calculation-activity img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
        await build(q); await input.fill(q.answer); await check.click();
        const bounds = await page.evaluate(() => {
          const board = document.querySelector('[data-calculation-board]').getBoundingClientRect();
          return {overflow:document.documentElement.scrollWidth > innerWidth,bottom:document.querySelector('.challenge-card').getBoundingClientRect().bottom,
            clipped:[...document.querySelectorAll('[data-calculation-copy],[data-calculation-copy] img')].some(copy => {const r = copy.getBoundingClientRect();return r.left < board.left - 1 || r.right > board.right + 1 || r.top < board.top - 1 || r.bottom > board.bottom + 1;})};
        });
        assert.equal(bounds.overflow,false,`${q.id} overflow ${viewport.width}`); assert.equal(bounds.clipped,false,`${q.id} clipped ${viewport.width}`);
        if (viewport.width >= 951) assert.ok(bounds.bottom <= viewport.height,`${q.id} bottom ${bounds.bottom} at ${viewport.width}`);
        if (process.env.ORBITA_SCREENSHOTS) {fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true}); await page.locator('[data-student-section="challenge"]').screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`${q.id}-${viewport.width}.png`)});}
        layouts++;
      }
    }
    await page.setViewportSize({width:375,height:812}); await startQuestion(0); await board.scrollIntoViewIfNeeded();
    const cdp = await context.newCDPSession(page); await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
    async function touch(kind,x,y) {
      const s = await page.locator(`[data-calculation-tool="${kind}"]`).boundingBox(),a = await board.boundingBox();
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:s.x + s.width / 2,y:s.y + s.height / 2}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x + a.width * x,y:a.y + a.height * y}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
    await touch('frame',.25,.5); await touch('frame',.75,.5);
    for (const x of [.25,.75]) for (let i = 0;i < 5;i++) await touch('cap',x,.3 + i * .1);
    assert.equal(await input.isEnabled(),true); await input.fill('5'); await check.click();
    assert.deepEqual(errors,[]);
    console.log(`Missão 3: 10 problemas, seis divisores, ${layouts} layouts, molduras e tampinhas reutilizáveis, respostas digitadas, mouse, toque, tentativas, desbloqueio, persistência e recompensas conferidos.`);
  } finally { await browser.close(); }
}
main().catch(error => {console.error(error); process.exitCode = 1;});
