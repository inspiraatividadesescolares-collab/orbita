const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');

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
      index,id:mission.missionId,title:mission.title,questions:mission.questions
    })).filter(mission => mission.id.startsWith('desafio-6-')));
    assert.equal(missions.length,3);
    const missionTotal = await page.evaluate(() => thirdGradeMissions.length);
    await page.evaluate(() => localStorage.setItem('orbita-teacher-data:teste-contas',JSON.stringify({
      classes:[{id:1,name:'Turma de teste',grade:3,code:'CONTAS-TESTE'}],
      students:[{id:1,name:'Teste Contas',classId:1,track:3,coins:0,stars:0,correctAnswers:0,
        challengesAttempted:0,errors:[],journal:[],progress:83,additionPuzzleVersion:1,
        completedMissionIds:thirdGradeMissions.slice(0,15).map(mission => mission.missionId),
        completedChallengeIds:['desafio-1','desafio-2','desafio-3','desafio-4','desafio-5'],
        completedQuestionIds:[],lastDailyReward:localDateKey()}]
    })));
    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Contas');
      await page.locator('#auth-form [name="code"]').fill('CONTAS-TESTE');
      await page.locator('#auth-form button[type="submit"]').click();
      await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
    }
    const check = page.locator('[data-check-challenge]');
    const next = page.locator('[data-next-challenge]');
    const fields = [0,1,2].map(place => page.locator(`[data-column-digit="${place}"]`));
    const profile = () => page.evaluate(() => ({...currentStudent}));
    const focus = () => page.evaluate(() => document.activeElement.dataset.columnDigit);
    async function typeAnswer(question,wrong=false) {
      const digits = String(question.result).split('').reverse();
      if (wrong) digits[0] = String((Number(digits[0]) + 1) % 10);
      for (let place = 0; place < 3; place++) await fields[place].fill(digits[place]);
    }
    await login();
    assert.equal(await page.locator('[data-student-mission-total]').textContent(),`de ${missionTotal} missões`);
    assert.equal(await page.locator('[data-student-progress-home]').textContent(),`${Math.round(15 / missionTotal * 100)}%`);
    await page.locator('[data-student-view="path"]').click();
    const group = page.locator('.challenge-path-group').filter({has:page.locator('header span',{hasText:'DESAFIO 6'})});
    assert.match(await group.locator('header').textContent(),/DESAFIO 6.*Adição e subtração sem reagrupamento/);
    assert.equal(await group.locator('.mission-node button').nth(0).isEnabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(1).isDisabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(2).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.pop(); renderMissionPath(); });
    assert.equal(await group.locator('.mission-node button').nth(0).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.push('desafio-5-missao-3'); renderMissionPath(); });
    await page.locator(`[data-student-mission="${missions[0].index}"]`).click();

    for (const [missionIndex,mission] of missions.entries()) {
      assert.equal(await page.locator('[data-mission-brief] h3').textContent(),mission.title);
      assert.equal(await page.locator('[data-lesson-video]').isVisible(),false);
      await page.locator('[data-begin-questions]').click();
      for (const [questionIndex,question] of mission.questions.entries()) {
        assert.equal(await page.locator('[data-challenge-counter]').textContent(),`QUESTÃO ${questionIndex + 1} DE 10`);
        assert.equal(await page.locator('[data-column-digit]').count(),3);
        assert.equal(await focus(),'0');
        assert.equal(await fields[0].isEnabled(),true);
        assert.equal(await fields[1].isDisabled(),true);
        assert.equal(await fields[2].isDisabled(),true);
        assert.equal(await check.isDisabled(),true);
        assert.equal(await page.locator('.column-arithmetic-sign').last().textContent(),question.sign);
        assert.ok((await page.evaluate(() => columnArithmetic.spokenQuestion)).includes(`${question.top} ${question.sign === '+' ? 'mais' : 'menos'} ${question.bottom}`));
        if (missionIndex === 0 && questionIndex === 0) {
          await fields[0].fill('x');
          assert.equal(await fields[0].inputValue(),'');
          assert.equal(await fields[1].isDisabled(),true);
          assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
          assert.equal(await page.evaluate(() => missionSession.attempts),0);
          await fields[0].fill('0');
          assert.equal(await focus(),'1');
          await fields[1].press('Backspace');
          assert.equal(await focus(),'0');
          await typeAnswer(question);
          await fields[0].fill('');
          assert.equal(await fields[1].inputValue(),'');
          assert.equal(await fields[2].inputValue(),'');
          assert.equal(await fields[1].isDisabled(),true);
          assert.equal(await fields[2].isDisabled(),true);
          assert.equal(await check.isDisabled(),true);
        }
        if (questionIndex === 0) {
          await typeAnswer(question,true);
          await check.click();
          assert.equal(await next.isVisible(),false);
          assert.match(await page.locator('[data-feedback-copy]').textContent(),/Observe o sinal/);
          assert.equal(await fields[0].isEnabled(),true);
          assert.equal(await fields[0].getAttribute('aria-invalid'),'true');
          await fields[0].fill(String(question.result).slice(-1));
          assert.equal(await page.locator('[data-challenge-feedback]').isVisible(),false);
        } else await typeAnswer(question);
        assert.equal(await check.isDisabled(),false);
        await fields[2].press('Enter');
        assert.equal(await next.isVisible(),true);
        assert.equal(await page.locator('[data-feedback-copy]').textContent(),question.correct);
        for (const input of fields) assert.equal(await input.isDisabled(),true);
        assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false,'não registra a mesma resposta duas vezes');
        await next.click();
      }
      const student = await profile();
      assert.ok(student.completedMissionIds.includes(mission.id));
      assert.equal(student.completedQuestionIds.length,(missionIndex + 1) * 10);
      assert.equal(student.challengesAttempted,(missionIndex + 1) * 11);
      assert.equal(student.correctAnswers,(missionIndex + 1) * 10);
      assert.equal(student.coins,(missionIndex + 1) * 575 + (missionIndex === 2 ? 250 : 0));
      assert.equal(student.stars,missionIndex === 2 ? 3 : 0);
      assert.equal(student.progress,Math.round((16 + missionIndex) / missionTotal * 100));
      if (missionIndex < 2) await page.locator('[data-result-next-mission]').click();
    }
    assert.ok((await profile()).completedChallengeIds.includes('desafio-6'));
    const saved = await profile();
    console.log('30 contas: digitação direta, ordem U → D → C, correção, desbloqueio, moedas e estrelas conferidos.');

    await page.locator('[data-student-view="path"]').click();
    await page.locator(`[data-student-mission="${missions[0].index}"]`).click();
    await page.locator('[data-begin-questions]').click();
    await typeAnswer(missions[0].questions[0],true);
    await check.click();
    await check.click();
    assert.equal(await next.isVisible(),true);
    assert.match(await page.locator('[data-feedback-copy]').textContent(),/132 \+ 323 = 455.*unidades: 2 \+ 3 = 5/);
    for (const input of fields) assert.equal(await input.isDisabled(),true);
    await next.click();
    for (const question of missions[0].questions.slice(1)) { await typeAnswer(question); await check.click(); await next.click(); }
    assert.equal((await profile()).coins,saved.coins);
    assert.equal((await profile()).stars,saved.stars);
    await page.reload();
    await login();
    assert.equal((await profile()).progress,Math.round(18 / missionTotal * 100));
    assert.equal((await profile()).coins,saved.coins);
    assert.ok((await profile()).completedChallengeIds.includes('desafio-6'));

    let checks = 0;
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      for (const [missionIndex,mission] of missions.entries()) for (const [questionIndex,question] of mission.questions.entries()) {
        for (const stage of ['initial','ready','first-error','final-error','success']) {
          const layout = await page.evaluate(({missionIndex,questionIndex,stage}) => {
            beginMissionSession(missionIndex);
            challengeStage = 'questions'; currentChallengeIndex = questionIndex; setStudentView('challenge');
            const question = activeQuestionSet()[questionIndex];
            const values = String(question.result).split('').reverse();
            if (stage.includes('error')) values[0] = String((Number(values[0]) + 1) % 10);
            const inputs = [...document.querySelectorAll('[data-column-digit]')];
            if (stage !== 'initial') inputs.forEach((input,index) => { input.value = values[index]; input.dispatchEvent(new Event('input',{bubbles:true})); });
            if (stage.includes('error') || stage === 'success') submitCurrentChallengeAnswer();
            if (stage === 'final-error') submitCurrentChallengeAnswer();
            window.scrollTo(0,0);
            const board = document.querySelector('.column-arithmetic-board').getBoundingClientRect();
            const inputRects = inputs.map(input => input.getBoundingClientRect());
            const operands = [...document.querySelectorAll('.column-arithmetic-row:not(.column-arithmetic-answer)')].map(row => [...row.querySelectorAll('span')].slice(1).map(cell => cell.getBoundingClientRect()));
            const buttons = [...document.querySelectorAll('[data-check-challenge],[data-next-challenge]')].filter(button => !button.hidden).map(button => button.getBoundingClientRect());
            return {overflow:document.documentElement.scrollWidth > innerWidth,
              outside:inputRects.some(rect => rect.left < board.left - 1 || rect.right > board.right + 1),
              rightToLeft:inputRects[0].left > inputRects[1].left && inputRects[1].left > inputRects[2].left,
              aligned:operands.every(row => row.every((rect,index) => Math.abs((rect.left + rect.right) / 2 - (inputRects[2 - index].left + inputRects[2 - index].right) / 2) < 1)),
              cardBottom:document.querySelector('.challenge-card').getBoundingClientRect().bottom,
              buttonsVisible:buttons.every(rect => rect.bottom <= innerHeight - 2),
              inputsLarge:inputRects.every(rect => rect.width >= 44 && rect.height >= 44)};
          },{missionIndex:mission.index,questionIndex,stage});
          const name = `${question.id} ${stage} em ${viewport.width}px`;
          assert.equal(layout.overflow,false,name);
          assert.equal(layout.outside,false,name);
          assert.equal(layout.rightToLeft,true,name);
          assert.equal(layout.aligned,true,name);
          assert.equal(layout.inputsLarge,true,name);
          if (viewport.width >= 951) {
            assert.ok(layout.cardBottom <= viewport.height - 2,`${name}: cartão termina em ${layout.cardBottom}`);
            assert.equal(layout.buttonsVisible,true,name);
          }
          if (process.env.ORBITA_SCREENSHOTS && questionIndex === 0 && ['initial','final-error'].includes(stage) && [1366,375].includes(viewport.width)) {
            fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
            await page.screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`d6m${missionIndex + 1}-${stage}-${viewport.width}.png`),fullPage:true});
          }
          checks++;
        }
      }
    }
    assert.deepEqual(errors,[]);
    console.log(`${checks} estados conferidos em computador e celular, sem rolagem horizontal ou erros de JavaScript.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
