const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');
const enigmas = require('../arithmetic-enigmas.js');

async function main() {
  const browser = await chromium.launch({headless:true,channel:process.env.ORBITA_BROWSER_CHANNEL || 'chrome'});
  try {
    const context = await browser.newContext({viewport:{width:1366,height:768}});
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror',error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('orbita-sound-enabled','false'));
    await page.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    const missions = await page.evaluate(() => thirdGradeMissions.map((mission,index) => ({...mission,index})).filter(mission => mission.challengeNumber === 9));
    assert.equal(missions.length,3);
    const missionTotal = await page.evaluate(() => thirdGradeMissions.length);
    await page.evaluate(() => localStorage.setItem('orbita-teacher-data:teste-enigmas',JSON.stringify({
      classes:[{id:1,name:'Turma de teste',grade:3,code:'ENIG-TESTE'}],
      students:[{id:1,name:'Teste Enigmas',classId:1,track:3,coins:0,stars:0,correctAnswers:0,challengesAttempted:0,
        errors:[],journal:[],progress:89,additionPuzzleVersion:1,
        completedMissionIds:thirdGradeMissions.filter(mission => mission.challengeNumber < 9).map(mission => mission.missionId),
        completedChallengeIds:thirdGradeChallenges.filter(challenge => challenge.number < 9).map(challenge => challenge.id),
        completedQuestionIds:[],lastDailyReward:localDateKey()}]
    })));
    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Enigmas');
      await page.locator('#auth-form [name="code"]').fill('ENIG-TESTE');
      await page.locator('#auth-form button[type="submit"]').click();
      await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
    }
    const check = page.locator('[data-check-challenge]');
    const next = page.locator('[data-next-challenge]');
    const input = page.locator('[data-enigma-input]');
    const profile = () => page.evaluate(() => ({...currentStudent}));
    async function typeDigits(values) {
      assert.equal(await input.count(),values.length);
      for (const [index,value] of values.entries()) await input.nth(index).fill(String(value));
    }
    await login();
    assert.equal(await page.locator('[data-student-mission-total]').textContent(),`de ${missionTotal} missões`);
    await page.locator('[data-student-view="path"]').click();
    const group = page.locator('.challenge-path-group').filter({has:page.locator('header span',{hasText:'DESAFIO 9'})});
    assert.equal(await group.locator('.mission-node button').nth(0).isEnabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(1).isDisabled(),true);
    assert.equal(await group.locator('.mission-node button').nth(2).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.pop(); renderMissionPath(); });
    assert.equal(await group.locator('.mission-node button').nth(0).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.push('desafio-8-missao-3'); renderMissionPath(); });
    await page.locator(`[data-student-mission="${missions[0].index}"]`).click();
    for (const [missionIndex,mission] of missions.entries()) {
      assert.equal(await page.locator('[data-lesson-video]').isVisible(),true);
      assert.equal(await page.locator('[data-lesson-video-player]').getAttribute('src'),mission.video);
      const video = await context.request.get(new URL(mission.video,page.url()).href,{headers:{Range:'bytes=0-15'}});
      assert.equal(video.status(),206);
      await page.locator('[data-begin-questions]').click();
      for (const [questionIndex,question] of mission.questions.entries()) {
        assert.equal(await page.locator('[data-challenge-counter]').textContent(),`QUESTÃO ${questionIndex + 1} DE 10`);
        assert.ok((await page.evaluate(() => arithmeticEnigmas.spokenQuestion)).includes(String(question.target)));
        assert.equal(await page.locator('[data-enigma-option],.enigma-options').count(),0);
        assert.equal(await check.isVisible(),true);
        assert.equal(await check.isDisabled(),true);
        assert.equal(await input.count(),missionIndex === 2 ? 2 : 1);
        if (questionIndex === 0) {
          await input.first().fill('x');
          assert.equal(await input.first().inputValue(),'');
          assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
          assert.equal(await page.evaluate(() => missionSession.attempts),0);
          if (missionIndex === 2) {
            await input.first().fill('6');
            assert.equal(await check.isDisabled(),true,'só uma das duas respostas foi digitada');
            assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
            assert.equal(await page.evaluate(() => missionSession.attempts),0);
          }
          const wrong = missionIndex === 0 ? [9] : missionIndex === 1 ? [8] : [7,6];
          await typeDigits(wrong); await check.click();
          assert.ok((await page.locator('[data-feedback-copy]').textContent()).includes(enigmas.evaluate(question,wrong).equation));
          if (missionIndex === 1) {
            assert.equal(await page.locator('[data-enigma-digit="top-1"].is-regrouped').count(),1);
            assert.equal(await page.locator('[data-enigma-transfer="1"]').textContent(),'6');
            assert.equal(await page.locator('[data-enigma-transfer="0"]').textContent(),'17');
          }
          assert.equal(await next.isVisible(),false);
          assert.equal(await input.first().isEnabled(),true);
        }
        await typeDigits(question.answers);
        assert.equal(await page.locator('[data-challenge-feedback]').isVisible(),false);
        assert.equal(await page.locator('.is-regrouped').count(),0,'digitar de novo limpa o corte anterior');
        await input.last().press('Enter');
        const result = enigmas.evaluate(question,question.answers);
        if (question.sign === '+') {
          const carryCount = enigmas.calculationSteps(result.top,result.bottom,'+').filter(step => step.transfer).length;
          assert.equal(await page.locator('[data-enigma-transfer].is-active').count(),carryCount);
        } else {
          const regroup = enigmas.subtractionRegrouping(result.top,result.bottom);
          assert.equal(await page.locator('.enigma-top .is-regrouped').count(),regroup.changed.filter(Boolean).length);
          for (const [place,value] of regroup.values.entries()) if (regroup.changed[place]) {
            assert.equal(await page.locator(`[data-enigma-transfer="${place}"]`).textContent(),String(value));
            assert.ok((await page.locator(`[data-enigma-digit="top-${place}"]`).evaluate(element => getComputedStyle(element).textDecorationLine)).includes('line-through'));
          }
        }
        assert.equal(await page.locator('[data-enigma-input]:enabled').count(),0);
        assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
        assert.equal(await next.isVisible(),true);
        assert.equal(await page.locator('[data-feedback-copy]').textContent(),question.correct);
        await next.click();
      }
      const student = await profile();
      assert.ok(student.completedMissionIds.includes(mission.missionId));
      assert.equal(student.completedQuestionIds.length,(missionIndex + 1) * 10);
      assert.equal(student.challengesAttempted,(missionIndex + 1) * 11);
      assert.equal(student.correctAnswers,(missionIndex + 1) * 10);
      assert.equal(student.coins,(missionIndex + 1) * 575 + (missionIndex === 2 ? 250 : 0));
      assert.equal(student.stars,missionIndex === 2 ? 3 : 0);
      assert.equal(student.progress,Math.round((25 + missionIndex) / missionTotal * 100));
      if (missionIndex < 2) await page.locator('[data-result-next-mission]').click();
    }
    const saved = await profile();
    assert.ok(saved.completedChallengeIds.includes('desafio-9'));
    await page.reload();
    await login();
    assert.equal((await profile()).coins,saved.coins);
    assert.equal((await profile()).progress,Math.round(27 / missionTotal * 100));
    assert.ok((await profile()).completedChallengeIds.includes('desafio-9'));
    console.log('30 questões: vídeos, trilha, duas tentativas, resultados reais, moedas, estrelas e persistência conferidos.');

    await page.evaluate(missionIndex => { beginMissionSession(missionIndex); challengeStage = 'questions'; setStudentView('challenge'); },missions[0].index);
    await input.fill('9'); await check.click(); await check.click();
    assert.match(await page.locator('[data-feedback-copy]').textContent(),/132 \+ 329 = 461.*Confira a solução: 3\. 132 \+ 323 = 455/);
    await next.click();
    for (const question of missions[0].questions.slice(1)) { await input.fill(question.answer); await check.click(); await next.click(); }
    assert.equal((await profile()).coins,saved.coins,'repetir a missão não duplica moedas');
    assert.equal((await profile()).stars,saved.stars,'repetir a missão não duplica estrelas');

    // As condições extras devem rejeitar somas certas que não atendem ao pedido.
    for (const [questionIndex,wrongDigits,expected] of [[0,[5,7],/mesmo número/],[6,[7,7],/PARES/],[7,[6,2],/ÍMPARES/],[8,[6,2],/iguais/],[9,[5,5],/próximas/]]) {
      await page.evaluate(({missionIndex,questionIndex}) => {
        beginMissionSession(missionIndex); challengeStage = 'questions'; currentChallengeIndex = questionIndex; setStudentView('challenge');
      },{missionIndex:missions[2].index,questionIndex});
      await typeDigits(wrongDigits); await check.click();
      assert.match(await page.locator('[data-feedback-copy]').textContent(),expected);
      assert.equal(await next.isVisible(),false);
    }

    for (const [questionIndex,values,equation] of [[5,[6,5],'36 + 35 = 71'],[6,[6,8],'66 + 28 = 94'],[7,[1,7],'41 + 47 = 88']]) {
      await page.evaluate(({missionIndex,questionIndex}) => {
        beginMissionSession(missionIndex); challengeStage = 'questions'; currentChallengeIndex = questionIndex; setStudentView('challenge');
      },{missionIndex:missions[2].index,questionIndex});
      await typeDigits(values); await check.click();
      assert.equal(await next.isVisible(),true);
      assert.ok((await page.locator('[data-feedback-copy]').textContent()).includes(equation),'o feedback usa a combinação que foi digitada');
    }

    let checks = 0;
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      for (const mission of missions) for (const [questionIndex,question] of mission.questions.entries()) {
        for (const stage of ['initial','ready','first-error','final-error','success']) {
          const layout = await page.evaluate(({missionIndex,questionIndex,stage}) => {
            beginMissionSession(missionIndex); challengeStage = 'questions'; currentChallengeIndex = questionIndex; setStudentView('challenge');
            const question = activeQuestionSet()[questionIndex];
            const inputs = [...document.querySelectorAll('[data-enigma-input]')];
            const incorrect = stage.includes('error');
            if (stage !== 'initial') {
              const values = question.answers.slice();
              if (incorrect) values[0] = (values[0] + 1) % 10;
              inputs.forEach((input,index) => {
                input.value = String(values[index]); input.dispatchEvent(new Event('input',{bubbles:true}));
              });
              if (stage !== 'ready') submitCurrentChallengeAnswer();
              if (stage === 'final-error') submitCurrentChallengeAnswer();
            }
            window.scrollTo(0,0);
            const board = document.querySelector('.enigma-operation').getBoundingClientRect();
            const controls = inputs.map(element => element.getBoundingClientRect());
            const buttons = [...document.querySelectorAll('[data-check-challenge],[data-next-challenge]')].filter(button => !button.hidden).map(button => button.getBoundingClientRect());
            const transfer = document.querySelector('[data-enigma-transfer].is-active');
            return {overflow:document.documentElement.scrollWidth > innerWidth,
              boardInside:board.left >= 0 && board.right <= innerWidth,
              controlsLarge:controls.every(rect => rect.width >= 44 && rect.height >= 44),
              cardBottom:document.querySelector('.challenge-card').getBoundingClientRect().bottom,
              buttonsVisible:buttons.every(rect => rect.bottom <= innerHeight - 2),
              animation:transfer ? getComputedStyle(transfer).animationName : null,
              finalFeedback:document.querySelector('[data-feedback-copy]').textContent,
              next:!document.querySelector('[data-next-challenge]').hidden};
          },{missionIndex:mission.index,questionIndex,stage});
          const name = `${question.id} ${stage} em ${viewport.width}px`;
          assert.equal(layout.overflow,false,name);
          assert.equal(layout.boardInside,true,name);
          assert.equal(layout.controlsLarge,true,name);
          if (viewport.width >= 951) {
            assert.ok(layout.cardBottom <= viewport.height - 2,`${name}: cartão termina em ${layout.cardBottom}`);
            assert.equal(layout.buttonsVisible,true,name);
          }
          if (layout.animation) assert.equal(layout.animation,'enigmaTransfer',name);
          if (stage === 'final-error') { assert.match(layout.finalFeedback,/Confira a solução/,name); assert.equal(layout.next,true,name); }
          checks++;
        }
      }
    }
    console.log(`${checks} estados conferidos em computador e celular, sem overflow e com animação de reagrupamento.`);
    await page.setViewportSize({width:1366,height:768});
    await page.evaluate(missionIndex => {
      beginMissionSession(missionIndex); challengeStage = 'questions'; currentChallengeIndex = 7; setStudentView('challenge');
      const input = document.querySelector('[data-enigma-input]'); input.value = '2'; input.dispatchEvent(new Event('input',{bubbles:true})); submitCurrentChallengeAnswer();
    },missions[0].index);
    if (process.env.ORBITA_SCREENSHOTS) {
      fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
      await page.waitForFunction(() => document.querySelector('[data-enigma-transfer].is-active').getAnimations().every(animation => animation.playState === 'finished'));
      await page.screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,'desafio-9-adicao.png')});
      await page.evaluate(missionIndex => {
        beginMissionSession(missionIndex); challengeStage = 'questions'; currentChallengeIndex = 5; setStudentView('challenge');
        const input = document.querySelector('[data-enigma-input]'); input.value = '7'; input.dispatchEvent(new Event('input',{bubbles:true})); submitCurrentChallengeAnswer();
      },missions[1].index);
      await page.screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,'desafio-9-subtracao-reagrupada.png')});
      await page.setViewportSize({width:375,height:812});
      await page.evaluate(missionIndex => {
        beginMissionSession(missionIndex); challengeStage = 'questions'; currentChallengeIndex = 6; setStudentView('challenge');
      },missions[2].index);
      await page.screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,'desafio-9-pares-celular.png'),fullPage:true});
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.evaluate(missionIndex => {
      beginMissionSession(missionIndex); challengeStage = 'questions'; currentChallengeIndex = 4; setStudentView('challenge');
      const input = document.querySelector('[data-enigma-input]'); input.value = '6'; input.dispatchEvent(new Event('input',{bubbles:true})); submitCurrentChallengeAnswer();
    },missions[0].index);
    assert.equal(await page.locator('[data-enigma-transfer].is-active').count(),2,'tentativa 64 + 36 reagrupa duas ordens');
    assert.equal(await page.locator('[data-enigma-transfer].is-active').first().evaluate(element => getComputedStyle(element).animationName),'none');
    const touchContext = await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
    const touchPage = await touchContext.newPage();
    await touchPage.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    await touchPage.evaluate(() => {
      setSoundEnabled(false);
      currentStudent = {id:2,name:'Teste de toque',track:3,coins:0,stars:0,completedMissionIds:[],completedQuestionIds:[],completedChallengeIds:[]};
      showScreen('student');
      beginMissionSession(thirdGradeMissions.findIndex(mission => mission.missionId === 'desafio-9-missao-3'));
      challengeStage = 'questions'; setStudentView('challenge');
    });
    await touchPage.locator('[data-enigma-input="top"]').tap();
    await touchPage.locator('[data-enigma-input="top"]').fill('6');
    await touchPage.locator('[data-enigma-input="bottom"]').tap();
    await touchPage.locator('[data-enigma-input="bottom"]').fill('6');
    await touchPage.locator('[data-check-challenge]').tap();
    assert.equal(await touchPage.locator('[data-next-challenge]').isVisible(),true);
    assert.match(await touchPage.locator('[data-feedback-copy]').textContent(),/36 \+ 36 = 72/);
    await touchContext.close();
    assert.deepEqual(errors,[]);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
