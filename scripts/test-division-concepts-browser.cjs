const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');
const {mission:source,images} = require('../division-concepts.js');

async function main() {
  const browser = await chromium.launch({headless:true,channel:process.env.ORBITA_BROWSER_CHANNEL || 'chrome'});
  try {
    const context = await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});
    const page = await context.newPage(),errors = [];
    page.setDefaultTimeout(8000); page.on('pageerror',error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('orbita-sound-enabled','false'));
    await page.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    const mission = await page.evaluate(() => {
      const index = thirdGradeMissions.findIndex(m => m.missionId === 'desafio-17-missao-2');
      return {...thirdGradeMissions[index],index};
    });
    assert.deepEqual(mission.questions,source.questions);
    await page.evaluate(index => localStorage.setItem('orbita-teacher-data:teste-partes',JSON.stringify({
      classes:[{id:1,name:'Turma de teste',grade:3,code:'PARTES-TESTE'}],
      students:[{id:1,name:'Teste Partes',classId:1,track:3,coins:0,stars:0,correctAnswers:0,challengesAttempted:0,
        errors:[],journal:[],progress:90,additionPuzzleVersion:1,completedQuestionIds:[],
        completedMissionIds:thirdGradeMissions.slice(0,index).map(m => m.missionId),
        completedChallengeIds:thirdGradeChallenges.slice(0,16).map(c => c.id),lastDailyReward:localDateKey()}]
    })),mission.index);
    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Partes');
      await page.locator('#auth-form [name="code"]').fill('PARTES-TESTE');
      await page.locator('#auth-form button[type="submit"]').click();
      await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
    }
    await login();
    const check = page.locator('[data-check-challenge]'),next = page.locator('[data-next-challenge]');
    const feedback = page.locator('[data-feedback-copy]');
    const profile = () => page.evaluate(() => ({...currentStudent}));
    const choices = page.locator('[data-division-choice]');
    async function startQuestion(index) {
      await page.evaluate(({missionIndex,index}) => {
        abandonMissionSession(); beginMissionSession(missionIndex); challengeStage = 'questions';
        currentChallengeIndex = index; setStudentView('challenge'); window.scrollTo(0,0);
      },{missionIndex:mission.index,index});
    }
    async function put(index,group,keyboard=false) {
      const piece = page.locator(`[data-division-piece="${index}"]`),target = page.locator(`[data-division-destination="${group}"]`);
      if (keyboard) { await piece.focus(); await page.keyboard.press('Enter'); await target.focus(); await page.keyboard.press('Enter'); }
      else { await piece.click(); await page.locator(`[data-division-drop="${group}"]`).click({position:{x:5,y:5}}); }
    }
    async function groupLeaves(keyboard=false) {
      for (let i = 0;i < 20;i++) {
        await put(i,Math.floor(i / 5),keyboard);
        assert.equal(await page.locator('[data-division-destination]').count(),Math.min(4,Math.floor((i + 1) / 5) + 1));
      }
      assert.equal(await choices.nth(2).isEnabled(),true);
    }
    async function arrange(q,keyboard=false) {
      if (q.mode === 'grouping') return groupLeaves(keyboard);
      for (let i = 0;i < q.total;i++) await put(i,Math.floor(i / q.answer),keyboard);
      assert.equal(await choices.filter({hasText:q.choiceAnswer}).isEnabled(),true);
    }
    async function solve(q) {
      if (q.type === 'division-sharing') { await arrange(q); await page.locator(`[data-division-choice="${q.choiceAnswer}"]`).click(); }
      else if (q.type === 'division-calculation') await page.locator(`[data-calculation-choice="${q.answer}"]`).click();
      else await page.locator('[data-challenge-answer]').nth(q.options.indexOf(q.answer)).click();
    }
    async function calculationFigures(q) {
      const board = page.locator('[data-calculation-board]'),parts = q.id === 'd17m2q9' ? 2 : 3,total = q.id === 'd17m2q9' ? 16 : 27;
      const rect = await board.boundingBox();
      await page.locator('[data-calculation-tool="frame"]').click();
      for (let i = 0;i < parts;i++) await board.click({position:{x:rect.width * (2 * i + 1) / (2 * parts),y:rect.height / 2}});
      await page.locator('[data-calculation-tool="cap"]').click();
      const columns = rect.width < 400 ? 2 : parts === 2 ? 4 : 3,perPart = total / parts,rows = Math.ceil(perPart / columns);
      for (let group = 0;group < parts;group++) {
        for (let i = 0;i < perPart;i++) {
          const frame = await page.locator('.calculation-copy--frame').nth(group).boundingBox(),area = await board.boundingBox();
          await board.click({position:{
            x:frame.x - area.x + frame.width * (.22 + (i % columns) / (columns - 1) * .56),
            y:frame.y - area.y + frame.height * (.22 + Math.floor(i / columns) / (rows - 1) * .56)
          }});
        }
      }
      assert.equal(await page.locator('.calculation-copy--cap').count(),total);
      assert.equal(await page.locator('.calculation-copy--frame').count(),parts);
      assert.equal(await page.locator('[data-calculation-tool]').count(),2);
    }
    async function dragLeaf(index) {
      const piece = page.locator(`[data-division-piece="${index}"]`);
      const target = page.locator('[data-division-destination="0"]');
      const a = await piece.boundingBox(),b = await target.boundingBox();
      await page.mouse.move(a.x + a.width / 2,a.y + a.height / 2); await page.mouse.down();
      await page.mouse.move(b.x + b.width / 2,b.y + b.height / 2,{steps:8}); await page.mouse.up();
      assert.equal(await page.locator('[data-division-items="0"] [data-division-piece]').count(),index + 1);
    }
    async function inspectImages(question) {
      const locator = page.locator('.division-concept-illustration img,.division-activity img,.calculation-activity img');
      await locator.evaluateAll(images => Promise.all(images.map(img => img.decode())));
      const rendered = await locator.evaluateAll(images => [...new Set(images.map(img => decodeURIComponent(new URL(img.src).pathname).slice(1)))]);
      assert.deepEqual(rendered.sort(),images(question).sort(),question.id);
      if (question.type === 'division-sharing') assert.equal(await page.locator('[data-division-piece]').count(),question.total);
    }
    await page.locator('[data-student-view="path"]').click();
    const group = page.locator('.challenge-path-group').filter({has:page.locator('header span',{hasText:'DESAFIO 17'})});
    assert.equal(await group.locator('.mission-node button').count(),3);
    assert.equal(await group.locator('.mission-node button').nth(1).isEnabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.pop(); renderMissionPath(); });
    assert.equal(await group.locator('.mission-node button').nth(1).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.push('desafio-17-missao-1'); renderMissionPath(); });
    await group.locator('.mission-node button').nth(1).click();
    assert.match(await page.locator('[data-mission-brief]').textContent(),/Metade, terça parte e quarta parte/);
    await page.locator('[data-begin-questions]').click();
    for (const [index,q] of mission.questions.entries()) {
      assert.equal(await page.locator('[data-challenge-counter]').textContent(),`QUESTÃO ${index + 1} DE 10`);
      assert.equal(await page.locator('[data-challenge-question]').textContent(),q.text);
      await inspectImages(q);
      if (q.type === 'division-sharing' && q.mode === 'grouping') {
        assert.equal(await choices.count(),4);
        assert.equal(await choices.nth(2).isDisabled(),true);
        assert.equal(await check.isVisible(),false);
        assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
        for (let i = 0;i < 5;i++) await dragLeaf(i);
        assert.equal(await page.locator('[data-division-destination]').count(),2);
        await page.locator('[data-division-reset]').click();
        await groupLeaves(true);
        await choices.nth(0).click(); assert.equal(await next.isVisible(),false);
        assert.equal(await choices.nth(0).isDisabled(),true);
        await page.locator('[data-division-reset]').click();
        assert.equal(await page.evaluate(() => currentQuestionAttempt),1);
        assert.equal(await page.locator('[data-division-destination]').count(),1);
        await groupLeaves(); await choices.nth(2).click();
        assert.equal(await feedback.textContent(),q.correct);
        assert.equal(await page.locator('[data-division-destination]').count(),4);
        assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
      } else if (q.type === 'division-sharing') {
        assert.equal(await check.isVisible(),false);
        assert.equal(await choices.nth(0).isDisabled(),true);
        assert.equal(await page.locator('[data-division-items="-1"] [data-division-piece]').count(),q.total);
        assert.deepEqual(await page.locator('[data-division-count]').allTextContents(),Array(q.groups).fill(`0 ${q.plural}`));
        assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
        if (index === 1) {
          await dragLeaf(0);
          for (let i = 1;i < q.total;i++) await put(i,0);
          assert.equal(await choices.nth(3).isDisabled(),true);
          assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
          assert.equal(await page.evaluate(() => currentQuestionAttempt),0);
          for (let i = 4;i < 8;i++) await put(i,1);
        } else await arrange(q,true);
        if (index === 6) { await choices.nth(0).click(); assert.equal(await next.isVisible(),false); await choices.nth(1).click(); }
        else { await page.locator(`[data-division-choice="${q.choiceAnswer}"]`).click(); assert.equal(await feedback.textContent(),q.correct); }
      } else if (q.type === 'division-calculation') {
        assert.equal(await page.locator('[data-calculation-tool="cap"]').count(),1);
        assert.equal(await page.locator('[data-calculation-tool="frame"]').count(),1);
        assert.equal(await page.locator('[data-calculation-copy]').count(),0);
        await calculationFigures(q); await solve(q); assert.equal(await feedback.textContent(),q.correct);
      } else {
        assert.deepEqual(await page.locator('[data-challenge-answer]').evaluateAll(buttons => buttons.map(b => b.dataset.challengeAnswer)),q.options);
        await page.locator('[data-challenge-answer]').nth(q.options.indexOf(q.answer)).click();
        assert.equal(await feedback.textContent(),q.correct);
      }
      assert.equal(await next.isVisible(),true); await next.click();
    }
    const saved = await profile();
    assert.ok(saved.completedMissionIds.includes(mission.missionId));
    assert.equal(saved.completedChallengeIds.includes('desafio-17'),false);
    assert.equal(saved.coins,525); assert.equal(saved.stars,0);
    assert.equal(saved.completedQuestionIds.length,9); assert.equal(saved.correctAnswers,9);
    const expectedProgress = await page.evaluate(index => Math.round((index + 1) / thirdGradeMissions.length * 100),mission.index);
    assert.equal(saved.challengesAttempted,12); assert.equal(saved.progress,expectedProgress);
    // A replay with the same errors grants no duplicate reward.
    await startQuestion(0);
    for (const [index,q] of mission.questions.entries()) {
      if (index === 6) { await arrange(q); await choices.nth(0).click(); await choices.nth(1).click(); }
      else await solve(q);
      await next.click();
    }
    assert.equal((await profile()).coins,saved.coins); assert.equal((await profile()).stars,saved.stars);
    await page.reload(); await login();
    assert.equal((await profile()).coins,saved.coins); assert.equal((await profile()).progress,expectedProgress);
    await startQuestion(7); await groupLeaves();
    await choices.nth(0).click(); await choices.nth(1).click();
    assert.equal(await next.isVisible(),true);
    for (const button of await page.locator('.division-activity button').all()) assert.equal(await button.isDisabled(),true);

    // The calculation tools remain in the palette, while each drag creates an independent copy.
    await startQuestion(8);
    const board = page.locator('[data-calculation-board]');
    async function dragTool(kind,x,y) {
      const source = await page.locator(`[data-calculation-tool="${kind}"]`).boundingBox(),area = await board.boundingBox();
      await page.mouse.move(source.x + source.width / 2,source.y + source.height / 2); await page.mouse.down();
      await page.mouse.move(area.x + area.width * x,area.y + area.height * y,{steps:8}); await page.mouse.up();
    }
    await dragTool('frame',.25,.5); await dragTool('frame',.75,.5);
    await dragTool('cap',.25,.5); await dragTool('cap',.25,.5);
    assert.equal(await page.locator('.calculation-copy--frame').count(),2);
    assert.equal(await page.locator('.calculation-copy--cap').count(),2);
    assert.equal(await page.locator('[data-calculation-tool]').count(),2);
    const capBefore = await page.locator('.calculation-copy--cap').first().boundingBox(),frameBefore = await page.locator('.calculation-copy--frame').first().boundingBox();
    await page.mouse.move(frameBefore.x + 5,frameBefore.y + 5); await page.mouse.down();
    await page.mouse.move(frameBefore.x + 25,frameBefore.y + 15,{steps:8}); await page.mouse.up();
    const capAfter = await page.locator('.calculation-copy--cap').first().boundingBox();
    assert.ok(Math.abs(capAfter.x - capBefore.x - 20) < 1);
    assert.ok(Math.abs(capAfter.y - capBefore.y - 10) < 1,'Mover o quadro leva suas tampinhas junto.');
    await page.locator('[data-calculation-tool="cap"]').focus(); await page.keyboard.press('Enter');
    for (let i = 0;i < 30;i++) { await page.locator('[data-calculation-place]').focus(); await page.keyboard.press('Enter'); }
    assert.equal(await page.locator('.calculation-copy--cap').count(),32);
    const last = page.locator('.calculation-copy--cap').last(),before = await last.boundingBox();
    await last.press('ArrowRight'); assert.ok((await last.boundingBox()).x > before.x);
    await last.press('Delete'); assert.equal(await page.locator('.calculation-copy--cap').count(),31);
    await page.locator('[data-calculation-choice="11"]').click();
    await page.locator('[data-calculation-reset]').click();
    assert.equal(await page.evaluate(() => currentQuestionAttempt),1);
    assert.equal(await page.locator('[data-calculation-copy]').count(),0);
    await page.locator('[data-calculation-choice="6"]').click();
    assert.equal(await next.isVisible(),true);
    for (const button of await page.locator('.calculation-activity button').all()) assert.equal(await button.isDisabled(),true);
    await startQuestion(9); const dragSource = await page.locator('[data-calculation-tool="cap"]').boundingBox();
    await page.mouse.move(dragSource.x + 5,dragSource.y + 5); await page.mouse.down(); await page.mouse.move(dragSource.x + 20,dragSource.y + 20);
    assert.equal(await page.locator('.calculation-ghost').count(),1);
    await page.evaluate(() => abandonMissionSession()); await page.mouse.up();
    assert.equal(await page.locator('.calculation-ghost').count(),0);

    let layouts = 0;
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      for (const [index,q] of mission.questions.entries()) {
        await startQuestion(index); await inspectImages(q);
        if (viewport.width >= 951) assert.ok(await page.locator('.challenge-card').evaluate(card => card.getBoundingClientRect().bottom <= innerHeight),`${q.id} inicial em ${viewport.width}`);
        if (q.type === 'division-calculation') await calculationFigures(q);
        await solve(q);
        const bounds = await page.evaluate(() => ({
          overflow:document.documentElement.scrollWidth > innerWidth,
          bottom:document.querySelector('.challenge-card').getBoundingClientRect().bottom,
          clipped:[...document.querySelectorAll('.division-target-items')].some(a => a.scrollWidth > a.clientWidth + 1 || a.scrollHeight > a.clientHeight + 1)
        }));
        assert.equal(bounds.overflow,false,`${q.id} overflow ${viewport.width}`);
        assert.equal(bounds.clipped,false,`${q.id} clipped ${viewport.width}`);
        if (viewport.width >= 951) assert.ok(bounds.bottom <= viewport.height,`${q.id} card bottom ${bounds.bottom} at ${viewport.width}`);
        if (process.env.ORBITA_SCREENSHOTS) {
          fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
          await page.locator('[data-student-section="challenge"]').screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`${q.id}-${viewport.width}.png`)});
        }
        layouts++;
      }
    }
    await page.setViewportSize({width:375,height:812}); await startQuestion(7);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
    await page.evaluate(() => window.scrollBy(0,document.querySelector('[data-division-destination="0"]').getBoundingClientRect().bottom - innerHeight + 20));
    for (let i = 0;i < 5;i++) {
      const piece = page.locator(`[data-division-piece="${i}"]`),target = page.locator('[data-division-destination="0"]');
      const s = await piece.boundingBox(),t = await target.boundingBox();
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:s.x + s.width / 2,y:s.y + s.height / 2}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:t.x + t.width / 2,y:t.y + t.height / 2}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
    assert.equal(await page.locator('[data-division-items="0"] [data-division-piece]').count(),5);
    assert.equal(await page.locator('[data-division-destination]').count(),2);
    await startQuestion(8); await board.scrollIntoViewIfNeeded();
    for (let i = 0;i < 2;i++) {
      const s = await page.locator('[data-calculation-tool="cap"]').boundingBox(),t = await board.boundingBox();
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:s.x + s.width / 2,y:s.y + s.height / 2}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:t.x + t.width * (.4 + i * .2),y:t.y + t.height / 2}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
    assert.equal(await page.locator('.calculation-copy--cap').count(),2);
    assert.equal(await page.locator('[data-calculation-tool="cap"]').count(),1);
    assert.deepEqual(errors,[]);
    console.log(`Missão 2: 10 questões, ${layouts} layouts, repartições antes das alternativas, ferramentas reutilizáveis, mouse, toque, teclado, agrupamento automático, tentativas, persistência e recompensas conferidos.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
