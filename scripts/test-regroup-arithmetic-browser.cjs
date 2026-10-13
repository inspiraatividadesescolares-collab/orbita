const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const arithmetic = require('../regroup-arithmetic.js');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');

async function main() {
  const browser = await chromium.launch({headless:true,channel:process.env.ORBITA_BROWSER_CHANNEL || 'chrome'});
  try {
    const context = await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror',error => { errors.push(error.message); console.error(error.stack); });
    await page.addInitScript(() => localStorage.setItem('orbita-sound-enabled','false'));
    await page.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    const missions = await page.evaluate(() => thirdGradeMissions.map((mission,index) => ({
      index,id:mission.missionId,title:mission.title,questions:mission.questions
    })).filter(mission => mission.id.startsWith('desafio-7-')));
    const missionTotal = await page.evaluate(() => thirdGradeMissions.length);
    assert.equal(missions.length,3);
    await page.evaluate(() => localStorage.setItem('orbita-teacher-data:teste-reagrupamento',JSON.stringify({
      classes:[{id:1,name:'Turma de teste',grade:3,code:'REG-TESTE'}],
      students:[{id:1,name:'Teste Reagrupamento',classId:1,track:3,coins:0,stars:0,correctAnswers:0,
        challengesAttempted:0,errors:[],journal:[],progress:86,additionPuzzleVersion:1,
        completedMissionIds:thirdGradeMissions.slice(0,18).map(mission => mission.missionId),
        completedChallengeIds:thirdGradeChallenges.slice(0,6).map(challenge => challenge.id),
        completedQuestionIds:[],lastDailyReward:localDateKey()}]
    })));
    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Reagrupamento');
      await page.locator('#auth-form [name="code"]').fill('REG-TESTE');
      await page.locator('#auth-form button[type="submit"]').click();
      await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
    }
    const check = page.locator('[data-check-challenge]');
    const next = page.locator('[data-next-challenge]');
    const reset = page.locator('[data-reset-regroup]');
    const answers = [0,1,2].map(place => page.locator(`[data-regroup-answer="${place}"]`));
    const records = [0,1,2].map(place => page.locator(`[data-regroup-record="${place}"]`));
    const profile = () => page.evaluate(() => ({...currentStudent}));
    async function fillTasks(question,wrongRecord=false) {
      const work = arithmetic.plan(question);
      let firstRecord = true;
      for (const task of work.tasks) {
        const input = task.kind === 'answer' ? answers[task.place] : records[task.place];
        assert.equal(await input.isEnabled(),true,`${question.id}: ${task.kind} ${task.place} liberado`);
        assert.equal(await input.evaluate(element => element.readOnly),false);
        const active = await page.evaluate(() => Number(document.activeElement.dataset.regroupTask));
        assert.equal(active,work.tasks.indexOf(task),`${question.id}: foco segue a ordem da conta`);
        const value = wrongRecord && task.kind === 'record' && firstRecord ? String((Number(task.expected) + 1) % 10) : task.expected;
        await input.fill(value);
        if (task.kind === 'record') firstRecord = false;
      }
    }
    await login();
    assert.equal(await page.locator('[data-student-mission-total]').textContent(),`de ${missionTotal} missões`);
    assert.equal(await page.locator('[data-student-progress-home]').textContent(),`${Math.round(18 / missionTotal * 100)}%`);
    await page.locator('[data-student-view="path"]').click();
    const group = page.locator('.challenge-path-group').filter({has:page.locator('header span',{hasText:'DESAFIO 7'})});
    assert.match(await group.locator('header').textContent(),/DESAFIO 7.*Adição e subtração com reagrupamento/);
    assert.equal(await group.locator('.mission-node button').nth(0).isEnabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(1).isDisabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(2).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.pop(); renderMissionPath(); });
    assert.equal(await group.locator('.mission-node button').nth(0).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.push('desafio-6-missao-3'); renderMissionPath(); });
    await page.locator(`[data-student-mission="${missions[0].index}"]`).click();

    for (const [missionIndex,mission] of missions.entries()) {
      assert.equal(await page.locator('[data-mission-brief] h3').textContent(),mission.title);
      assert.equal(await page.locator('[data-lesson-video]').isVisible(),false);
      await page.locator('[data-begin-questions]').click();
      for (const [questionIndex,question] of mission.questions.entries()) {
        assert.equal(await page.locator('[data-challenge-counter]').textContent(),`QUESTÃO ${questionIndex + 1} DE 10`);
        assert.equal(await page.locator('[data-regroup-answer]').count(),3);
        assert.equal(await page.locator('[data-regroup-record]').count(),question.sign === '+' ? 2 : 3);
        assert.equal(await check.isDisabled(),true);
        const attempts = await page.evaluate(() => missionSession.attempts);
        assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
        assert.equal(await page.evaluate(() => missionSession.attempts),attempts);
        if (missionIndex === 0 && questionIndex === 0) {
          await answers[0].fill('x');
          assert.equal(await answers[0].inputValue(),'');
          await answers[0].fill('2');
          assert.equal(await records[1].inputValue(),'','a reserva não é preenchida pelo sistema');
          assert.equal(await answers[1].isDisabled(),true);
          await records[1].fill('1');
          assert.equal(await answers[1].isEnabled(),true);
          await answers[1].press('Backspace');
          assert.equal(await page.evaluate(() => document.activeElement.dataset.regroupRecord),'1');
          await reset.click();
        }
        if (missionIndex === 1 && questionIndex === 0) {
          assert.equal(await answers[0].isDisabled(),true);
          await records[1].fill('2');
          assert.equal(await records[0].inputValue(),'11');
          assert.equal(await records[0].evaluate(input => input.readOnly),true);
          assert.equal(await page.locator('[data-regroup-top="1"]').evaluate(element => element.classList.contains('is-regrouped')),true);
          assert.equal(await page.locator('[data-regroup-top="0"]').evaluate(element => element.classList.contains('is-regrouped')),true);
          assert.equal(await page.locator('[data-regroup-top="2"]').evaluate(element => element.classList.contains('is-regrouped')),false);
          await reset.click();
          assert.equal(await page.locator('.is-regrouped').count(),0);
          assert.equal(await records[0].inputValue(),'');
        }
        if (questionIndex === 0) {
          await fillTasks(question,true);
          await check.click();
          assert.equal(await next.isVisible(),false,'registro errado impede o acerto mesmo com resultado certo');
          assert.match(await page.locator('[data-feedback-copy]').textContent(),/Confira os registros/);
          assert.equal(await page.locator('.regroup-record-row .is-wrong').count(),1);
          await reset.click();
          assert.equal(await page.locator('[data-challenge-feedback]').isVisible(),false);
          assert.equal(await page.evaluate(() => currentQuestionAttempt),1,'recomeçar não devolve a primeira tentativa');
        }
        await fillTasks(question);
        assert.equal(await check.isDisabled(),false);
        const result = await answers[0].inputValue() + await answers[1].inputValue() + await answers[2].inputValue();
        assert.equal(result,String(question.result).split('').reverse().join(''));
        await answers[2].press('Enter');
        assert.equal(await page.locator('[data-feedback-copy]').textContent(),question.correct);
        assert.equal(await next.isVisible(),true);
        for (const input of await page.locator('.regroup-arithmetic input').all()) assert.equal(await input.isDisabled(),true);
        assert.equal(await reset.isDisabled(),true);
        assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
        await next.click();
      }
      const student = await profile();
      assert.ok(student.completedMissionIds.includes(mission.id));
      assert.equal(student.completedQuestionIds.length,(missionIndex + 1) * 10);
      assert.equal(student.correctAnswers,(missionIndex + 1) * 10);
      assert.equal(student.challengesAttempted,(missionIndex + 1) * 11);
      assert.equal(student.coins,(missionIndex + 1) * 575 + (missionIndex === 2 ? 250 : 0));
      assert.equal(student.stars,missionIndex === 2 ? 3 : 0);
      assert.equal(student.progress,Math.round((19 + missionIndex) / missionTotal * 100));
      if (missionIndex < 2) await page.locator('[data-result-next-mission]').click();
    }
    assert.ok((await profile()).completedChallengeIds.includes('desafio-7'));
    const saved = await profile();
    console.log('30 contas: reservas manuais, empréstimos, registros obrigatórios, ordem de preenchimento e recompensas conferidos.');

    await page.locator('[data-student-view="path"]').click();
    await page.locator(`[data-student-mission="${missions[1].index}"]`).click();
    await page.locator('[data-begin-questions]').click();
    await fillTasks(missions[1].questions[0],true);
    await check.click(); await check.click();
    assert.equal(await next.isVisible(),true);
    assert.match(await page.locator('[data-feedback-copy]').textContent(),/731 − 326 = 405.*dezenas: 3 → 2; unidades: 1 → 11/);
    await next.click();
    for (const question of missions[1].questions.slice(1)) { await fillTasks(question); await check.click(); await next.click(); }
    assert.equal((await profile()).coins,saved.coins);
    assert.equal((await profile()).stars,saved.stars);
    await page.reload(); await login();
    assert.equal((await profile()).progress,Math.round(21 / missionTotal * 100));
    assert.equal((await profile()).coins,saved.coins);
    assert.ok((await profile()).completedChallengeIds.includes('desafio-7'));

    let checks = 0;
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      for (const [missionIndex,mission] of missions.entries()) for (const [questionIndex,question] of mission.questions.entries()) {
        for (const stage of ['initial','regrouping','ready','first-error','final-error','success']) {
          const layout = await page.evaluate(({missionIndex,questionIndex,stage}) => {
            beginMissionSession(missionIndex); challengeStage = 'questions'; currentChallengeIndex = questionIndex; setStudentView('challenge');
            const question = activeQuestionSet()[questionIndex],work = regroupArithmetic.plan(question);
            let firstRecord = true;
            if (stage !== 'initial') for (const task of work.tasks) {
              const input = document.querySelector(task.kind === 'answer' ? `[data-regroup-answer="${task.place}"]` : `[data-regroup-record="${task.place}"]`);
              input.value = stage.includes('error') && task.kind === 'record' && firstRecord ? String((Number(task.expected) + 1) % 10) : task.expected;
              input.dispatchEvent(new Event('input',{bubbles:true}));
              if (task.kind === 'record') { firstRecord = false; if (stage === 'regrouping') break; }
            }
            if (stage.includes('error') || stage === 'success') submitCurrentChallengeAnswer();
            if (stage === 'final-error') submitCurrentChallengeAnswer();
            window.scrollTo(0,0);
            const board = document.querySelector('.column-arithmetic-board').getBoundingClientRect();
            const answerRects = [...document.querySelectorAll('[data-regroup-answer]')].map(input => input.getBoundingClientRect());
            const topRects = [...document.querySelectorAll('[data-regroup-top]')].map(element => element.getBoundingClientRect()).reverse();
            const fieldRects = [...document.querySelectorAll('.regroup-arithmetic input')].map(input => input.getBoundingClientRect());
            const buttons = [...document.querySelectorAll('[data-check-challenge],[data-next-challenge]')].filter(button => !button.hidden).map(button => button.getBoundingClientRect());
            return {overflow:document.documentElement.scrollWidth > innerWidth,
              outside:fieldRects.some(rect => rect.left < board.left - 1 || rect.right > board.right + 1),
              aligned:topRects.every((rect,index) => Math.abs((rect.left + rect.right) / 2 - (answerRects[index].left + answerRects[index].right) / 2) < 1),
              fieldsLarge:fieldRects.every(rect => rect.width >= 44 && rect.height >= 44),
              cardBottom:document.querySelector('.challenge-card').getBoundingClientRect().bottom,
              buttonsVisible:buttons.every(rect => rect.bottom <= innerHeight - 2)};
          },{missionIndex:mission.index,questionIndex,stage});
          const name = `${question.id}, ${stage}, ${viewport.width}px`;
          assert.equal(layout.overflow,false,name); assert.equal(layout.outside,false,name);
          assert.equal(layout.aligned,true,name); assert.equal(layout.fieldsLarge,true,name);
          if (viewport.width >= 951) { assert.ok(layout.cardBottom <= viewport.height - 2,`${name}: cartão em ${layout.cardBottom}`); assert.equal(layout.buttonsVisible,true,name); }
          if (process.env.ORBITA_SCREENSHOTS && [0,4,5].includes(questionIndex) && ['initial','regrouping','final-error'].includes(stage) && [1366,375].includes(viewport.width)) {
            fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
            await page.screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`${question.id}-${stage}-${viewport.width}.png`),fullPage:true});
          }
          checks++;
        }
      }
    }
    assert.deepEqual(errors,[]);
    console.log(`${checks} estados verificados em computador e celular; progresso persistido e nenhuma recompensa duplicada.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
