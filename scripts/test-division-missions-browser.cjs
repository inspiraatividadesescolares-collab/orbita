const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');
const {mission:source} = require('../division-missions.js');

async function main() {
  const browser = await chromium.launch({headless:true,channel:process.env.ORBITA_BROWSER_CHANNEL || 'chrome'});
  try {
    const context = await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});
    const page = await context.newPage(),errors = [];
    page.setDefaultTimeout(8000); page.on('pageerror',error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('orbita-sound-enabled','false'));
    await page.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    const mission = await page.evaluate(() => {
      const index = thirdGradeMissions.findIndex(m => m.missionId === 'desafio-17-missao-1');
      return {...thirdGradeMissions[index],index};
    });
    assert.ok(mission.index > 0);
    const missionTotal = await page.evaluate(() => thirdGradeMissions.length);
    assert.deepEqual(mission.questions,source.questions);
    assert.equal(await page.evaluate(() => {
      const ids = thirdGradeMissions.flatMap(m => m.questions.map(q => q.id));
      return new Set(ids).size === ids.length;
    }),true);
    await page.evaluate(index => localStorage.setItem('orbita-teacher-data:teste-divisao',JSON.stringify({
      classes:[{id:1,name:'Turma de teste',grade:3,code:'DIV-TESTE'}],
      students:[{id:1,name:'Teste Divisão',classId:1,track:3,coins:0,stars:0,correctAnswers:0,challengesAttempted:0,
        errors:[],journal:[],progress:90,additionPuzzleVersion:1,completedQuestionIds:[],
        completedMissionIds:thirdGradeMissions.slice(0,index).map(m => m.missionId),
        completedChallengeIds:thirdGradeChallenges.slice(0,16).map(c => c.id),lastDailyReward:localDateKey()}]
    })),mission.index);
    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Divisão');
      await page.locator('#auth-form [name="code"]').fill('DIV-TESTE');
      await page.locator('#auth-form button[type="submit"]').click();
      await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
    }
    await login();
    const check = page.locator('[data-check-challenge]'),next = page.locator('[data-next-challenge]');
    const input = page.locator('[data-division-answer]'),feedback = page.locator('[data-feedback-copy]');
    const piece = i => page.locator(`[data-division-piece="${i}"]`);
    const destination = i => page.locator(`[data-division-destination="${i}"]`);
    const profile = () => page.evaluate(() => ({...currentStudent}));
    async function startQuestion(index=0) {
      await page.evaluate(({missionIndex,index}) => {
        abandonMissionSession(); beginMissionSession(missionIndex); challengeStage = 'questions';
        currentChallengeIndex = index; setStudentView('challenge'); window.scrollTo(0,0);
      },{missionIndex:mission.index,index});
    }
    async function put(index,group,keyboard=false) {
      if (keyboard) {
        await piece(index).focus(); await page.keyboard.press('Enter');
        await destination(group).focus(); await page.keyboard.press('Enter');
      } else {
        await piece(index).click(); await destination(group).click({position:{x:5,y:5}});
      }
    }
    async function solve(question,keyboard=false) {
      if (question.mode === 'grouping') assert.equal(await destination(0).count(),1);
      for (let i = 0;i < question.total;i++) {
        await put(i,Math.floor(i / (question.groupSize || question.answer)),keyboard);
        if (question.mode === 'grouping') assert.equal(await page.locator('[data-division-destination]').count(),Math.min(question.answer,Math.floor((i + 1) / question.groupSize) + 1),'uma nova moldura só aparece ao completar o grupo');
      }
      assert.equal(await input.isEnabled(),true);
      await input.fill(String(question.answer));
      assert.equal(await check.isEnabled(),true);
    }
    async function dragTo(index,target,outside=false) {
      const a = await piece(index).boundingBox(),b = outside ? {x:0,y:0,width:1,height:1} : await target.boundingBox();
      await page.mouse.move(a.x + a.width / 2,a.y + a.height / 2); await page.mouse.down();
      await page.mouse.move(b.x + b.width / 2,b.y + b.height / 2,{steps:8}); await page.mouse.up();
    }
    await page.locator('[data-student-view="path"]').click();
    const group = page.locator('.challenge-path-group').filter({has:page.locator('header span',{hasText:'DESAFIO 17'})});
    assert.equal(await group.locator('.mission-node button').count(),3);
    assert.equal(await group.locator('.mission-node button').nth(0).isEnabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(1).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.pop(); renderMissionPath(); });
    assert.equal(await group.locator('.mission-node button').nth(0).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.push('desafio-16-missao-3'); renderMissionPath(); });
    await group.locator('.mission-node button').nth(0).click();
    assert.match(await page.locator('[data-mission-brief]').textContent(),/10 questões.*duas tentativas/);
    assert.equal(await page.locator('[data-lesson-video]').isVisible(),false);
    await page.locator('[data-begin-questions]').click();
    assert.equal(await check.isDisabled(),true); assert.equal(await input.isDisabled(),true);
    assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
    assert.equal(await page.evaluate(() => missionSession.attempts),0);
    assert.equal(await page.evaluate(() => {
      const original = speakText; let copy = '';
      try { speakText = text => { copy = text; }; document.querySelector('[data-speak-question]').click(); }
      finally { speakText = original; }
      return copy;
    }),source.questions[0].spokenText);
    for (const [index,question] of mission.questions.entries()) {
      assert.equal(await page.locator('[data-challenge-counter]').textContent(),`QUESTÃO ${index + 1} DE 10`);
      assert.equal(await page.locator('[data-challenge-question]').textContent(),question.text);
      assert.equal(await page.locator('[data-division-piece]').count(),question.total);
      if (index === 0) {
        for (let i = 0;i < question.total;i++) await put(i,0);
        await input.fill(String(question.answer)); await check.click();
        assert.match(await feedback.textContent(),/mesma quantidade/);
        assert.equal(await next.isVisible(),false);
        await page.locator('[data-division-reset]').click();
        assert.equal(await page.evaluate(() => currentQuestionAttempt),1);
        assert.equal(await check.isDisabled(),true);
      }
      await solve(question,index === 2);
      if (index === 1) {
        await input.fill('7'); await input.press('Enter');
        assert.equal(await next.isVisible(),false);
        assert.equal(await page.evaluate(() => currentQuestionAttempt),1);
        await input.fill('8'); await check.click();
        assert.match(await feedback.textContent(),/duas tentativas terminaram.*8 ÷ 4 = 2/);
      } else {
        await check.click(); assert.equal(await feedback.textContent(),question.correct);
      }
      assert.equal(await next.isVisible(),true);
      for (const button of await page.locator('.division-activity button').all()) assert.equal(await button.isDisabled(),true);
      assert.equal(await input.isDisabled(),true);
      assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
      await next.click();
    }
    const saved = await profile();
    assert.ok(saved.completedMissionIds.includes(mission.missionId));
    assert.equal(saved.completedChallengeIds.includes('desafio-17'),false);
    assert.equal(saved.correctAnswers,9); assert.equal(saved.challengesAttempted,12);
    assert.equal(saved.completedQuestionIds.length,9); assert.equal(saved.coins,525); assert.equal(saved.stars,0);
    assert.equal(saved.progress,Math.round((mission.index + 1) / missionTotal * 100));
    // Replaying the same outcomes cannot grant the same rewards again.
    await startQuestion();
    for (const [index,question] of mission.questions.entries()) {
      await solve(question);
      if (index === 1) { await input.fill('7'); await check.click(); await input.fill('8'); }
      await check.click(); await next.click();
    }
    assert.equal((await profile()).coins,saved.coins);
    assert.equal((await profile()).stars,saved.stars);
    await page.reload(); await login();
    assert.equal((await profile()).coins,saved.coins); assert.equal((await profile()).progress,saved.progress);

    // Mouse dragging, transfers, return to bank, canceled/outside drops, and cleanup.
    await startQuestion();
    await dragTo(0,destination(0));
    assert.equal(await page.locator('[data-division-items="0"] [data-division-piece]').count(),1);
    await dragTo(0,destination(1));
    assert.equal(await page.locator('[data-division-items="1"] [data-division-piece]').count(),1);
    await dragTo(0,page.locator('.division-bank'));
    assert.equal(await page.locator('[data-division-items="-1"] [data-division-piece]').count(),6);
    await dragTo(0,null,true);
    assert.equal(await page.locator('[data-division-items="-1"] [data-division-piece]').count(),6);
    await put(0,0); await piece(0).click(); await page.locator('[data-division-return]').click();
    assert.equal(await page.locator('[data-division-items="-1"] [data-division-piece]').count(),6);
    const a = await piece(0).boundingBox();
    await page.mouse.move(a.x + 5,a.y + 5); await page.mouse.down(); await page.mouse.move(a.x + 25,a.y + 25);
    assert.equal(await page.locator('.division-drag-ghost').count(),1);
    await page.evaluate(() => abandonMissionSession()); await page.mouse.up();
    assert.equal(await page.locator('.division-drag-ghost').count(),0);

    // Automatic frames: complete a group, reject overflow, return and replace a figure, reset.
    for (const index of [7,8]) {
      const question = mission.questions[index];
      await startQuestion(index);
      assert.equal(await page.locator('[data-division-destination]').count(),1);
      assert.equal(await page.locator('[data-division-add]').count(),0);
      for (let i = 0;i < question.groupSize;i++) {
        if (index === 7) await dragTo(i,destination(0));
        else await put(i,0,true);
        assert.equal(await page.locator('[data-division-destination]').count(),i + 1 === question.groupSize ? 2 : 1);
      }
      await put(question.groupSize,0);
      assert.equal(await page.locator('[data-division-items="0"] [data-division-piece]').count(),question.groupSize);
      assert.equal(await page.locator('[data-division-items="-1"] [data-division-piece]').count(),question.total - question.groupSize);
      assert.match(await page.locator('[data-division-status]').textContent(),/já tem/);
      assert.equal(await page.evaluate(() => missionSession.attempts),0);
      await piece(0).click(); await page.locator('[data-division-return]').click();
      await put(0,0);
      assert.equal(await page.locator('[data-division-destination]').count(),2,'refazer um grupo não duplica molduras');
      for (let i = question.groupSize;i < question.total;i++) await put(i,Math.floor(i / question.groupSize));
      assert.equal(await page.locator('[data-division-destination]').count(),question.answer,'nenhuma moldura extra ao acabar as figuras');
      assert.equal(await input.isEnabled(),true);
      await page.locator('[data-division-reset]').click();
      assert.equal(await page.locator('[data-division-destination]').count(),1);
      assert.equal(await page.locator('[data-division-items="-1"] [data-division-piece]').count(),question.total);
      assert.equal(await input.isDisabled(),true);
    }

    let layouts = 0;
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      for (const [index,question] of mission.questions.entries()) {
        await startQuestion(index);
        assert.equal(await page.locator('.division-instructions').textContent(),'Arraste uma figura ou selecione e toque no destino. Para devolver, selecione a figura e toque em “Devolver ao banco”.');
        assert.equal(await page.locator('.division-instructions').isVisible(),true);
        assert.ok(await page.locator('.division-instructions').evaluate(p => parseFloat(getComputedStyle(p).fontSize) >= 16));
        await solve(question);
        await page.locator('.division-activity img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
        const layout = await page.evaluate(() => {
          const card = document.querySelector('.challenge-card').getBoundingClientRect();
          return {overflow:document.documentElement.scrollWidth > innerWidth,cardBottom:card.bottom,
            broken:[...document.querySelectorAll('.division-activity img')].some(img => !img.naturalWidth),
            clipped:[...document.querySelectorAll('.division-target-items')].some(area => area.scrollHeight > area.clientHeight + 1 || area.scrollWidth > area.clientWidth + 1)};
        });
        assert.equal(layout.overflow,false,`${question.id} overflow ${viewport.width}`);
        assert.equal(layout.broken,false,`${question.id} images`);
        assert.equal(layout.clipped,false,`${question.id} figures clipped ${viewport.width}`);
        if (viewport.width >= 951) assert.ok(layout.cardBottom <= viewport.height,`${question.id} card bottom ${layout.cardBottom} at ${viewport.width}`);
        await check.click();
        if (viewport.width >= 951) assert.ok((await next.boundingBox()).y + (await next.boundingBox()).height <= viewport.height,`${question.id} next visible`);
        if (process.env.ORBITA_SCREENSHOTS && [0,4,6,7,8].includes(index)) {
          fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
          await page.locator('[data-student-section="challenge"]').screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`${question.id}-${viewport.width}.png`)});
        }
        layouts++;
      }
    }
    // Touch uses the same Pointer Events path on a mobile context.
    await page.setViewportSize({width:375,height:812}); await startQuestion();
    const cdp = await context.newCDPSession(page),s = await piece(0).boundingBox(),t = await destination(0).boundingBox();
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:s.x + s.width / 2,y:s.y + s.height / 2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:t.x + t.width / 2,y:t.y + t.height / 2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await page.locator('[data-division-items="0"] [data-division-piece]').count(),1);
    assert.deepEqual(errors,[]);
    console.log(`10 questões, 20 imagens, ${layouts} layouts, mouse, toque, teclado, tentativas, progressão, persistência e recompensas conferidos.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
