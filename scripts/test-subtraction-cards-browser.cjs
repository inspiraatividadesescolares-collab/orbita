const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');

async function main() {
  const browser = await chromium.launch({headless:true,channel:process.env.ORBITA_BROWSER_CHANNEL || 'chrome'});
  try {
    const context = await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror',error => errors.push(error.message));
    await page.addInitScript(() => { localStorage.setItem('orbita-sound-enabled','false'); });
    await page.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    await page.evaluate(() => {
      const completedMissionIds = thirdGradeMissions.slice(0,9).map(mission => mission.missionId);
      localStorage.setItem('orbita-teacher-data:teste-cartas',JSON.stringify({
        classes:[{id:1,name:'Turma de teste',grade:3,code:'CARTAS-TESTE'}],
        students:[{id:1,name:'Teste Cartas',classId:1,track:3,coins:0,stars:0,correctAnswers:0,
          challengesAttempted:0,errors:[],journal:[],progress:75,additionPuzzleVersion:1,
          completedMissionIds,completedChallengeIds:['desafio-1','desafio-2','desafio-3'],
          completedQuestionIds:[],lastDailyReward:localDateKey()}]
      }));
    });
    const profile = () => page.evaluate(() => ({...currentStudent}));
    const completedProgress = await page.evaluate(() => Math.round(12 / thirdGradeMissions.length * 100));
    const check = page.locator('[data-check-challenge]');
    const next = page.locator('[data-next-challenge]');
    const deck = page.locator('[data-subtraction-card]');

    async function login() {
      await page.locator('[data-go="profiles"][data-intent="login"]').click();
      await page.locator('[data-role="student"]').click();
      await page.locator('#auth-form [name="name"]').fill('Teste Cartas');
      await page.locator('#auth-form [name="code"]').fill('CARTAS-TESTE');
      await page.locator('#auth-form button[type="submit"]').click();
      await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
    }

    async function inspectLayout(name) {
      for (const viewport of [{width:1280,height:900},{width:375,height:812},{width:320,height:740}]) {
        await page.setViewportSize(viewport);
        const overflow = await page.evaluate(() => {
          const bounds = document.querySelector('.subtraction-game').getBoundingClientRect();
          const tooWide = [...document.querySelectorAll('.subtraction-game button,.subtraction-game input')]
            .filter(element => element.getClientRects().length && !element.closest('[hidden]'))
            .filter(element => {
              const rect = element.getBoundingClientRect();
              return rect.left < bounds.left - 1 || rect.right > bounds.right + 1;
            }).map(element => element.outerHTML.slice(0,130));
          return {page:document.documentElement.scrollWidth > window.innerWidth,tooWide};
        });
        assert.equal(overflow.page,false,`${name}: página em ${viewport.width}px`);
        assert.deepEqual(overflow.tooWide,[],`${name}: controles em ${viewport.width}px`);
        if (process.env.ORBITA_SCREENSHOTS && viewport.width !== 320) {
          fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
          await page.locator('[data-student-section="challenge"]').screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`${name}-${viewport.width}.png`)});
        }
      }
      await page.setViewportSize({width:1280,height:900});
    }

    async function startQuestions() {
      await page.locator('[data-mission-brief]').waitFor({state:'visible'});
      await page.locator('[data-begin-questions]').click();
      assert.equal(await deck.count(),6);
    }

    async function pairAnswer(round,retry=false) {
      assert.equal(await check.isDisabled(),true);
      assert.equal(await deck.locator('[data-card-value]').allTextContents().then(values => values.every(value => !value)),true);
      await deck.nth(0).click();
      await deck.nth(4).click();
      const values = await deck.locator('[data-card-value]').allTextContents();
      const first = Number(values[0]);
      const second = Number(values[4]);
      assert.equal(await check.isDisabled(),true);
      assert.equal(await deck.nth(2).isDisabled(),true);
      const greaterCard = deck.nth(first > second ? 0 : 4);
      const smallerCard = deck.nth(first > second ? 4 : 0);
      const input = page.locator('[data-subtraction-input]');
      const difference = Math.abs(first - second);
      if (retry) {
        const attempts = await page.evaluate(() => missionSession.attempts);
        await smallerCard.click();
        assert.match(await page.locator('[data-subtraction-message]').textContent(),/número menor.*maior número/);
        assert.equal(await page.locator('[data-subtraction-answer]').isVisible(),false);
        assert.equal(await page.locator('[data-subtraction-operation]').textContent(),'');
        assert.equal(await check.isDisabled(),true);
        assert.equal(await next.isVisible(),false);
        assert.equal(await page.evaluate(() => missionSession.attempts),attempts);
        await inspectLayout('missao-1-aviso-menor');
      }
      await greaterCard.click();
      assert.equal(await page.locator('[data-subtraction-answer]').isVisible(),true);
      assert.equal(await page.locator('[data-subtraction-message]').textContent(),'');
      assert.equal(await check.isDisabled(),false);
      assert.equal(await page.locator('[data-subtraction-operation]').textContent(),`${Math.max(first,second)} − ${Math.min(first,second)} =`);
      if (retry) {
        await input.fill(String(difference + 1));
        await check.click();
        assert.match(await page.locator('[data-feedback-copy]').textContent(),/Comece pelo maior/);
        assert.equal(await next.isVisible(),false);
      }
      await input.fill(String(difference));
      if (round === 0) await inspectLayout('missao-1');
      await input.press('Enter');
      assert.equal(await next.isVisible(),true);
      assert.equal(await greaterCard.isDisabled(),true);
      assert.match(await page.locator('[data-subtraction-resolution]').textContent(),new RegExp(`= ${difference}$`));
      await next.click();
    }

    await login();
    await page.locator('[data-student-view="path"]').click();
    assert.equal(await page.locator('[data-student-mission="9"]').count(),1);
    assert.equal(await page.locator('[data-student-mission="10"]').count(),0);
    await page.locator('[data-student-mission="9"]').click();
    await startQuestions();
    for (let round = 0; round < 10; round++) await pairAnswer(round,round === 0);
    let student = await profile();
    assert.ok(student.completedMissionIds.includes('desafio-4-missao-1'));
    assert.equal(student.coins,575);
    assert.equal(student.challengesAttempted,11);
    console.log('Missão 1: dez rodadas, escolha do maior, nova tentativa e conclusão verificadas.');

    await page.locator('[data-result-next-mission]').click();
    await startQuestions();
    for (let round = 0; round < 10; round++) {
      const target = round < 2 ? 10 : round < 5 ? 15 : 20;
      assert.match(await page.locator('.subtraction-goal strong').textContent(),new RegExp(`${target}$`));
      await deck.nth(3).click();
      const number = Number(await deck.nth(3).locator('[data-card-value]').textContent());
      assert.equal(await deck.nth(0).isDisabled(),true);
      const input = page.locator('[data-subtraction-input]');
      assert.equal(await page.locator('[data-subtraction-prompt]').textContent(),'Quanto falta?');
      assert.equal(await page.locator('[data-subtraction-operation],[data-subtraction-resolution]').count(),0);
      assert.doesNotMatch(await page.locator('.subtraction-game').textContent(),/\d+\s*[−-]\s*\d+\s*=/);
      if (round === 0) {
        const attempts = await page.evaluate(() => missionSession.attempts);
        for (const value of ['', 'abc', '2.']) {
          await input.fill(value); await check.click();
          assert.equal(await page.evaluate(() => missionSession.attempts),attempts);
          assert.equal(await next.isVisible(),false);
        }
        await inspectLayout('missao-2');
      }
      await input.fill(String(target - number));
      await check.click();
      assert.equal(await page.locator('[data-subtraction-operation],[data-subtraction-resolution]').count(),0);
      assert.doesNotMatch(await page.locator('.subtraction-game').textContent(),/\d+\s*[−-]\s*\d+\s*=/);
      await next.click();
    }
    student = await profile();
    assert.equal(student.coins,1175);
    assert.ok(student.completedMissionIds.includes('desafio-4-missao-2'));
    console.log('Missão 2: alvos 10/15/20, validação da resposta e bloqueio de novas cartas verificados.');

    await page.locator('[data-result-next-mission]').click();
    await startQuestions();
    for (let round = 0; round < 10; round++) {
      assert.equal(await check.isVisible(),false);
      assert.equal(await next.isVisible(),false);
      assert.equal(await page.locator('[data-subtraction-card].is-face-up').count(),0);
      assert.deepEqual(await deck.locator('[data-card-value]').allTextContents(),Array(6).fill(''));
      assert.equal(await page.locator('[data-subtraction-review-panel]').isVisible(),false);
      const cardIndex = [5,1,2,4,0,1,2,5,3,4][round];
      await deck.nth(cardIndex).click();
      assert.equal(await page.locator('[data-subtraction-card].is-face-up').count(),1);
      assert.equal(await page.locator('[data-subtraction-review-panel]').isVisible(),true);
      assert.equal(await next.isVisible(),false);
      assert.equal(await page.locator('[data-subtraction-card]:disabled').count(),6);
      await deck.nth((cardIndex + 1) % 6).evaluate(button => button.click());
      assert.equal(await page.locator('[data-subtraction-card].is-face-up').count(),1);
      const text = await page.locator('[data-review-operation]').textContent();
      const [greater,smaller,result] = text.match(/\d+/g).map(Number);
      const expected = greater - smaller === result;
      await page.locator(`[data-subtraction-verdict="${round === 0 ? !expected : expected}"]`).click();
      assert.equal(await next.isVisible(),true);
      assert.equal(await page.locator('[data-subtraction-verdict]:disabled').count(),2);
      assert.equal(await page.locator('[data-review-feedback]').isVisible(),true);
      assert.equal(await page.locator('[data-challenge-feedback]').isVisible(),false);
      assert.equal(await page.locator('[data-subtraction-next-card]').count(),0);
      assert.equal(await page.locator('[data-subtraction-progress]').textContent(),'1 de 1 carta escolhida');
      assert.equal(await page.locator('[data-subtraction-card].is-selected [data-card-caption]').textContent(),expected ? 'Resultado certo' : 'Resultado errado');
      assert.match(await page.locator('[data-review-resolution]').textContent(),new RegExp(`= ${greater - smaller}\\.`));
      if (round === 0) {
        assert.match(await page.locator('[data-review-feedback-title]').textContent(),/OBSERVE NOVAMENTE/);
        await inspectLayout('missao-3');
      }
      assert.match(await next.textContent(),round === 9 ? /Concluir missão/ : /Próxima questão/);
      await next.click();
    }
    student = await profile();
    assert.equal(student.completedMissionIds.length,12);
    assert.ok(student.completedChallengeIds.includes('desafio-4'));
    assert.equal(student.completedQuestionIds.length,29);
    assert.equal(student.coins,1975);
    assert.equal(student.stars,3);
    assert.equal(student.correctAnswers,29);
    assert.equal(student.challengesAttempted,31);
    assert.equal(student.errors.length,2);
    assert.equal(student.progress,completedProgress);
    console.log('Missão 3: uma carta por questão, avanço após acerto ou erro, resolução e recompensas verificados.');

    await page.locator('[data-result-next-mission]').click();
    await page.locator('[data-student-view="path"]').click();
    await page.locator('[data-student-mission="9"]').click();
    await startQuestions();
    for (let round = 0; round < 10; round++) await pairAnswer(round);
    assert.equal((await profile()).coins,1975);
    assert.equal((await profile()).stars,3);
    console.log('Rejogar: nenhuma recompensa duplicada. Layout verificado em 1280, 375 e 320 px.');

    await page.reload();
    await login();
    assert.equal((await profile()).progress,completedProgress);
    assert.ok((await profile()).completedChallengeIds.includes('desafio-4'));
    assert.deepEqual(errors,[]);
    console.log('Progresso preservado ao entrar novamente; nenhum erro de JavaScript.');
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
