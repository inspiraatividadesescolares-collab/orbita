const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');
const letters = ['ACBDBADCAB','CDABDCBACD','CADBACBDAC'];

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
    const missions = await page.evaluate(() => thirdGradeMissions.map((mission,index) => ({...mission,index}))
      .filter(mission => mission.challengeNumber === 11));
    assert.equal(missions.length,3);
    const missionTotal = await page.evaluate(() => thirdGradeMissions.length);
    const earlierCount = await page.evaluate(() => thirdGradeMissions.filter(mission => mission.challengeNumber < 11).length);
    await page.evaluate(() => localStorage.setItem('orbita-teacher-data:teste-calculo-mental',JSON.stringify({
      classes:[{id:1,name:'Turma de teste',grade:3,code:'MENTAL-TESTE'}],
      students:[{id:1,name:'Teste Cálculo Mental',classId:1,track:3,coins:0,stars:0,
        correctAnswers:0,challengesAttempted:0,errors:[],journal:[],additionPuzzleVersion:1,
        completedMissionIds:thirdGradeMissions.filter(mission => mission.challengeNumber < 11).map(mission => mission.missionId),
        completedChallengeIds:thirdGradeChallenges.filter(challenge => challenge.number < 11).map(challenge => challenge.id),
        completedQuestionIds:[],lastDailyReward:localDateKey()}]
    })));
    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Cálculo Mental');
      await page.locator('#auth-form [name="code"]').fill('MENTAL-TESTE');
      await page.locator('#auth-form button[type="submit"]').click();
      await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
    }
    async function screenshot(name) {
      if (!process.env.ORBITA_SCREENSHOTS) return;
      fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
      await page.locator('[data-student-section="challenge"]').screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`${name}.png`)});
    }
    async function inspectExample(mission) {
      assert.equal(await page.locator('[data-mission-brief]').isVisible(),true);
      assert.equal(await page.locator('[data-mission-brief] > span').textContent(),mission.kicker);
      assert.equal(await page.locator('[data-mission-brief] > p').textContent(),mission.intro);
      assert.equal(await page.locator('[data-mission-example] h4').textContent(),`Exemplo: ${mission.example.operation}`);
      assert.deepEqual(await page.locator('[data-mission-example] p').allTextContents(),mission.example.steps);
      assert.equal(await page.locator('[data-lesson-video]').isVisible(),false);
    }
    const options = page.locator('[data-challenge-answer]');
    const next = page.locator('[data-next-challenge]');
    const feedback = page.locator('[data-feedback-copy]');
    const profile = () => page.evaluate(() => ({...currentStudent}));
    await login();
    assert.equal(await page.locator('[data-student-mission-total]').textContent(),`de ${missionTotal} missões`);
    await page.locator('[data-student-view="path"]').click();
    const group = page.locator('.challenge-path-group').filter({has:page.locator('header span',{hasText:'DESAFIO 11'})});
    assert.match(await group.locator('header').textContent(),/Cálculos mentais/);
    assert.equal(await group.locator('.mission-node button').nth(0).isEnabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(1).isDisabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(2).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.pop(); renderMissionPath(); });
    assert.equal(await group.locator('.mission-node button').nth(0).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.push('desafio-10-missao-3'); renderMissionPath(); });
    await page.locator(`[data-student-mission="${missions[0].index}"]`).click();

    for (const [missionIndex,mission] of missions.entries()) {
      await inspectExample(mission);
      await screenshot(`d11m${missionIndex + 1}-intro-1366`);
      await page.locator('[data-begin-questions]').click();
      assert.equal(await page.locator('[data-mission-example]').isVisible(),false);
      for (const [questionIndex,question] of mission.questions.entries()) {
        const correct = letters[missionIndex].charCodeAt(questionIndex) - 65;
        assert.equal(await page.locator('[data-challenge-counter]').textContent(),`QUESTÃO ${questionIndex + 1} DE 10`);
        assert.equal(await page.locator('[data-challenge-question]').textContent(),question.text);
        assert.equal(await page.locator('[data-question-media]').isVisible(),false);
        assert.deepEqual(await options.evaluateAll(buttons => buttons.map(button => button.dataset.challengeAnswer)),question.options);
        if (questionIndex === 0) {
          await options.nth((correct + 1) % 4).click();
          assert.equal(await feedback.textContent(),question.incorrect);
          assert.equal(await next.isVisible(),false);
          assert.equal(await options.nth((correct + 1) % 4).isDisabled(),true);
        }
        await options.nth(correct).click();
        assert.equal(await feedback.textContent(),question.correct);
        assert.equal(await next.isVisible(),true);
        for (const button of await options.all()) assert.equal(await button.isDisabled(),true);
        if (questionIndex === 0) await screenshot(`d11m${missionIndex + 1}-resposta-1366`);
        await next.click();
      }
      const student = await profile();
      assert.ok(student.completedMissionIds.includes(mission.missionId));
      assert.equal(student.completedQuestionIds.length,(missionIndex + 1) * 10);
      assert.equal(student.correctAnswers,(missionIndex + 1) * 10);
      assert.equal(student.challengesAttempted,(missionIndex + 1) * 11);
      assert.equal(student.coins,(missionIndex + 1) * 575 + (missionIndex === 2 ? 250 : 0));
      assert.equal(student.stars,missionIndex === 2 ? 3 : 0);
      assert.equal(student.progress,Math.round((earlierCount + missionIndex + 1) / missionTotal * 100));
      if (missionIndex < 2) await page.locator('[data-result-next-mission]').click();
    }
    const saved = await profile();
    assert.ok(saved.completedChallengeIds.includes('desafio-11'));
    await page.locator('[data-student-view="path"]').click();
    await page.locator(`[data-student-mission="${missions[0].index}"]`).click();
    await page.locator('[data-begin-questions]').click();
    await options.nth(1).click();
    await options.nth(2).click();
    assert.equal(await feedback.textContent(),missions[0].questions[0].incorrect);
    assert.equal(await next.isVisible(),true);
    await next.click();
    for (let index = 1; index < 10; index++) {
      await options.nth(letters[0].charCodeAt(index) - 65).click();
      await next.click();
    }
    assert.equal((await profile()).coins,saved.coins);
    assert.equal((await profile()).stars,saved.stars);
    await page.reload();
    await login();
    assert.equal((await profile()).progress,saved.progress);
    assert.equal((await profile()).coins,saved.coins);
    assert.ok((await profile()).completedChallengeIds.includes('desafio-11'));
    console.log('30 questões: exemplos, numeração 1 a 10, alternativas, tentativas, desbloqueio, recompensas e persistência conferidos.');

    let layouts = 0;
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      for (const [missionIndex,mission] of missions.entries()) {
        await page.evaluate(index => { beginMissionSession(index); setStudentView('challenge'); },mission.index);
        await inspectExample(mission);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);
        if (viewport.width === 375) await screenshot(`d11m${missionIndex + 1}-intro-375`);
        for (const [questionIndex,question] of mission.questions.entries()) {
          const correct = letters[missionIndex].charCodeAt(questionIndex) - 65;
          for (const stage of ['initial','error','success','final-error']) {
            await page.evaluate(({index,questionIndex}) => {
              beginMissionSession(index);
              challengeStage = 'questions';
              currentChallengeIndex = questionIndex;
              setStudentView('challenge');
            },{index:mission.index,questionIndex});
            if (stage === 'error' || stage === 'success') await options.nth(stage === 'success' ? correct : (correct + 1) % 4).click();
            if (stage === 'final-error') { await options.nth((correct + 1) % 4).click(); await options.nth((correct + 2) % 4).click(); }
            const layout = await page.evaluate(() => {
              const card = document.querySelector('.challenge-card').getBoundingClientRect();
              return {overflow:document.documentElement.scrollWidth > innerWidth,bottom:card.bottom,
                outside:[...document.querySelectorAll('[data-challenge-answer]')].some(button => {
                  const rect = button.getBoundingClientRect(); return rect.left < card.left || rect.right > card.right;
                })};
            });
            assert.equal(layout.overflow,false,`${question.id}: ${stage} em ${viewport.width}px`);
            assert.equal(layout.outside,false,question.id);
            if (viewport.width >= 951) assert.ok(layout.bottom <= viewport.height,`${question.id}: ${stage} (${layout.bottom})`);
            if (viewport.width === 375 && questionIndex === 0 && stage === 'success') await screenshot(`d11m${missionIndex + 1}-resposta-375`);
            layouts++;
          }
        }
      }
    }
    // Trocar para uma missão anterior remove o exemplo e restaura o título da introdução.
    await page.evaluate(() => { beginMissionSession(thirdGradeMissions.findIndex(mission => mission.challengeNumber === 10)); setStudentView('challenge'); });
    assert.equal(await page.locator('[data-mission-example]').isVisible(),false);
    assert.equal(await page.locator('[data-mission-brief] > span').textContent(),'COMO JOGAR');
    assert.deepEqual(errors,[]);
    console.log(`${layouts} estados conferidos em computador e celular, sem rolagem horizontal ou erros de JavaScript.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
