const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const money = require('../money-missions.js');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.ORBITA_TEST_URL || 'http://localhost:8080';

async function prepare(page) {
  page.setDefaultTimeout(8000);
  await page.addInitScript(() => localStorage.setItem('orbita-sound-enabled','false'));
  await page.goto(url);
  await page.evaluate(() => localStorage.setItem('orbita-teacher-data:teste-dinheiro',JSON.stringify({
    classes:[{id:1,name:'Turma de teste',grade:3,code:'DIN-TESTE'}],
    students:[{id:1,name:'Teste Dinheiro',classId:1,track:3,coins:0,stars:0,correctAnswers:0,
      challengesAttempted:0,errors:[],journal:[],progress:88,additionPuzzleVersion:1,
      completedMissionIds:thirdGradeMissions.slice(0,21).map(mission => mission.missionId),
      completedChallengeIds:thirdGradeChallenges.slice(0,7).map(challenge => challenge.id),
      completedQuestionIds:[],lastDailyReward:localDateKey()}]
  })));
  await login(page);
}
async function login(page) {
  await page.locator('[data-go="profiles"][data-intent="login"]').click();
  await page.locator('[data-role="student"]').click();
  await page.locator('#auth-form [name="name"]').fill('Teste Dinheiro');
  await page.locator('#auth-form [name="code"]').fill('DIN-TESTE');
  await page.locator('#auth-form button[type="submit"]').click();
  await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
}
async function openQuestion(page,missionIndex,questionIndex=0) {
  await page.evaluate(({missionIndex,questionIndex}) => {
    beginMissionSession(missionIndex); challengeStage = 'questions'; currentChallengeIndex = questionIndex; setStudentView('challenge'); window.scrollTo(0,0);
  },{missionIndex,questionIndex});
}
async function fillPayment(page,question,coins=false) {
  if (question.operation) await page.locator(`[data-money-operation="${question.operation}"]`).click();
  let remaining = money.expectedAmount(question) / 100;
  for (const value of coins ? [1] : money.denominations) {
    const count = Math.floor(remaining / value); remaining %= value;
    await page.locator(`[data-money-piece="${value}"][data-money-source="wallet"]`).evaluate((button,count) => {
      for (let index = 0; index < count; index++) button.click();
    },count);
  }
}
const counterPieces = (page,value) => page.locator(`[data-money-source="counter"]${value ? `[data-money-piece="${value}"]` : ''}`);
async function useKeyboard(page,value,source='wallet') {
  const piece = page.locator(`[data-money-piece="${value}"][data-money-source="${source}"]`).first();
  await piece.focus(); await piece.press('Enter');
}
async function dragPiece(page,source,destination) {
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox(),to = await destination.boundingBox();
  await page.mouse.move(from.x + from.width / 2,from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2,to.y + to.height / 2,{steps:12});
  await page.mouse.up();
  assert.equal(await page.locator('.money-drag-ghost').count(),0);
}
async function main() {
  const browser = await chromium.launch({headless:true,channel:process.env.ORBITA_BROWSER_CHANNEL || 'chrome'});
  try {
    const context = await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});
    const page = await context.newPage(),errors = [];
    page.on('pageerror',error => { errors.push(error.message); console.error(error.stack); });
    await prepare(page);
    const missions = await page.evaluate(() => thirdGradeMissions.map((mission,index) => ({index,id:mission.missionId,title:mission.title,questions:mission.questions})).filter(mission => mission.id.startsWith('desafio-8-')));
    const missionTotal = await page.evaluate(() => thirdGradeMissions.length);
    assert.equal(missionTotal,51); assert.equal(missions.length,3);
    assert.equal(await page.locator('[data-student-mission-total]').textContent(),'de 51 missões');
    assert.equal(await page.locator('[data-student-progress-home]').textContent(),`${Math.round(21 / missionTotal * 100)}%`);
    await page.locator('[data-student-view="path"]').click();
    const group = page.locator('.challenge-path-group').filter({has:page.locator('header span',{hasText:'DESAFIO 8'})});
    assert.equal(await group.locator('.mission-node button').nth(0).isEnabled(),true);
    for (const index of [1,2]) assert.equal(await group.locator('.mission-node button').nth(index).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.pop(); renderMissionPath(); });
    assert.equal(await group.locator('.mission-node button').nth(0).isDisabled(),true);
    await page.evaluate(() => { currentStudent.completedMissionIds.push('desafio-7-missao-3'); renderMissionPath(); });
    await page.locator(`[data-student-mission="${missions[0].index}"]`).click();
    const check = page.locator('[data-check-challenge]'),next = page.locator('[data-next-challenge]');
    const input = page.locator('[data-money-amount]');
    const profile = () => page.evaluate(() => ({...currentStudent}));
    for (const [missionIndex,mission] of missions.entries()) {
      assert.equal(await page.locator('[data-mission-brief] h3').textContent(),mission.title);
      assert.equal(await page.locator('[data-lesson-video]').isVisible(),false);
      await page.locator('[data-begin-questions]').click();
      for (const [questionIndex,question] of mission.questions.entries()) {
        assert.equal(await page.locator('[data-challenge-counter]').textContent(),`QUESTÃO ${questionIndex + 1} DE 10`);
        await page.waitForFunction(() => [...document.querySelectorAll('.money-game img')].every(img => img.complete && img.naturalWidth > 0));
        assert.equal(await page.locator('.money-collection figcaption').count(),0,'cédulas e moedas sem valores abaixo das imagens');
        assert.equal(await check.isDisabled(),true);
        const attempts = await page.evaluate(() => missionSession.attempts);
        assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
        assert.equal(await page.evaluate(() => missionSession.attempts),attempts);
        if (question.type === 'money-count') {
          if (!questionIndex) { await input.fill('31'); await check.click(); assert.equal(await next.isVisible(),false); }
          const value = String(money.expectedAmount(question) / 100);
          await input.fill([value,`${value},00`,`R$ ${value}`,`R$ ${value},00`][questionIndex]);
          await input.blur();
          assert.equal(await input.inputValue(),money.formatMoney(money.expectedAmount(question)));
        } else if (question.people) {
          if (question.type === 'money-difference') {
            await input.fill(String(money.expectedAmount(question) / 100));
            assert.equal(await check.isDisabled(),true,'diferença precisa também da pessoa escolhida');
          }
          await page.locator(`[data-money-person="${money.comparison(question).winner}"]`).click();
        } else {
          if (question.operation) {
            assert.equal(await page.locator('[data-money-piece="1"][data-money-source="wallet"]').isDisabled(),true);
            await page.locator(`[data-money-operation="${question.operation}"]`).click();
          }
          if (!missionIndex || missionIndex === 1 && !questionIndex) {
            // Gestos reais de mouse: adicionar/devolver uma peça por arraste e toque duplo.
            const wallet5 = page.locator('[data-money-piece="5"][data-money-source="wallet"]');
            await dragPiece(page,wallet5,page.locator('[data-money-counter]'));
            assert.match(await page.locator('[data-money-total]').textContent(),/R\$ 5,00/);
            await dragPiece(page,page.locator('[data-money-piece="5"][data-money-source="counter"]'),page.locator('[data-money-wallet]'));
            assert.match(await page.locator('[data-money-total]').textContent(),/R\$ 0,00/);
            await wallet5.dblclick();
            assert.equal(await counterPieces(page,5).count(),1);
            await page.locator('[data-money-piece="5"][data-money-source="counter"]').dblclick();
            assert.equal(await counterPieces(page,5).count(),0);
            await wallet5.focus(); await wallet5.press('Enter');
            assert.equal(await counterPieces(page,5).count(),1);
            await page.locator('[data-money-clear]').click();
            assert.equal(await check.isDisabled(),true);
          }
          if (question.type === 'money-change') {
            assert.equal(await page.locator('[data-money-help-panel]').isVisible(),false);
            assert.ok(!(await page.locator('[data-question-screen]').innerText()).includes('VALOR PAGO − PREÇO = TROCO'));
            if (!questionIndex) {
              await page.locator('[data-money-help]').click();
              assert.equal(await page.locator('[data-money-help-panel]').isVisible(),true);
              assert.equal(await page.locator('[data-money-help]').getAttribute('aria-expanded'),'true');
              await page.locator('[data-money-help]').click();
            }
          }
          await fillPayment(page,question,questionIndex % 3 === 0);
          if (!questionIndex) {
            await useKeyboard(page,1); await check.click();
            assert.equal(await next.isVisible(),false);
            await useKeyboard(page,1,'counter');
            assert.equal(await page.locator('[data-challenge-feedback]').isVisible(),false);
            assert.equal(await page.evaluate(() => currentQuestionAttempt),1);
          }
          assert.equal(await page.locator('[data-money-total]').textContent(),`Total no balcão: ${money.formatMoney(money.expectedAmount(question))}`);
          const pieces = await counterPieces(page).evaluateAll(buttons => buttons.map(button => Number(button.dataset.moneyPiece)));
          assert.equal(pieces.reduce((total,value) => total + value * 100,0),money.expectedAmount(question));
          if (questionIndex % 3 === 0) assert.equal(pieces.length,money.expectedAmount(question) / 100,'cada moeda aparece individualmente');
          assert.equal(await page.locator('.money-piece-controls,[data-money-add],[data-money-remove]').count(),0);
          assert.equal(await page.locator('.money-piece').evaluateAll(buttons => buttons.every(button => button.textContent.trim() === '')),true,'dinheiro sem legendas ou símbolos abaixo');
        }
        assert.equal(await check.isEnabled(),true);
        if (questionIndex === 0 && missionIndex === 0) await input.press('Enter'); else await check.click();
        assert.equal(await page.locator('[data-feedback-copy]').textContent(),question.correct);
        assert.equal(await next.isVisible(),true);
        assert.equal(await page.evaluate(() => submitCurrentChallengeAnswer()),false);
        for (const control of await page.locator('.money-game button:not([data-money-help]),.money-game input').all()) assert.equal(await control.isDisabled(),true);
        await next.click();
      }
      const student = await profile();
      assert.ok(student.completedMissionIds.includes(mission.id));
      assert.equal(student.completedQuestionIds.length,(missionIndex + 1) * 10);
      assert.equal(student.correctAnswers,(missionIndex + 1) * 10);
      assert.equal(student.challengesAttempted,(missionIndex + 1) * 11);
      assert.equal(student.coins,(missionIndex + 1) * 575 + (missionIndex === 2 ? 250 : 0));
      assert.equal(student.stars,missionIndex === 2 ? 3 : 0);
      assert.equal(student.progress,Math.round((22 + missionIndex) / missionTotal * 100));
      if (missionIndex < 2) await page.locator('[data-result-next-mission]').click();
    }
    assert.ok((await profile()).completedChallengeIds.includes('desafio-8'));
    const saved = await profile();
    console.log('30 questões concluídas: formatos de dinheiro, comparação, pagamentos equivalentes, trocos e recompensas conferidos.');

    // Operação errada não acerta só por pagar o total; corrigir preserva a composição.
    await openQuestion(page,missions[1].index,5);
    await page.locator('[data-money-operation="×"]').click();
    await fillPayment(page,{...missions[1].questions[5],operation:null});
    await check.click(); assert.equal(await next.isVisible(),false);
    assert.match(await page.locator('[data-feedback-copy]').textContent(),/Confira a operação/);
    await page.locator('[data-money-operation="+"]').click();
    assert.match(await page.locator('[data-money-total]').textContent(),/R\$ 19,00/);
    await check.click(); assert.equal(await next.isVisible(),true);
    await openQuestion(page,missions[2].index,0);
    await useKeyboard(page,100); await check.click(); await check.click();
    assert.match(await page.locator('[data-feedback-copy]').textContent(),/Vamos conferir.*troco é R\$ 3,00/);
    assert.ok(!(await page.locator('[data-question-screen]').innerText()).includes('VALOR PAGO − PREÇO = TROCO'));
    await page.locator('[data-money-help]').click(); assert.equal(await page.locator('[data-money-help-panel]').isVisible(),true);

    // Repetir a missão não duplica moedas ou estrelas.
    await page.locator('[data-student-view="path"]').click();
    await page.locator(`[data-student-mission="${missions[1].index}"]`).click(); await page.locator('[data-begin-questions]').click();
    for (const question of missions[1].questions) { await fillPayment(page,question); await check.click(); await next.click(); }
    assert.equal((await profile()).coins,saved.coins); assert.equal((await profile()).stars,saved.stars);
    await page.reload(); await login(page);
    assert.equal((await profile()).progress,Math.round(24 / missionTotal * 100)); assert.equal((await profile()).coins,saved.coins);

    for (const mission of missions.slice(1)) {
      await openQuestion(page,mission.index);
      for (const value of [10,10,5,2]) await page.locator(`[data-money-piece="${value}"][data-money-source="wallet"]`).dblclick();
      assert.equal(await counterPieces(page,10).count(),2,'duas cédulas de 10 aparecem separadamente');
      assert.equal(await counterPieces(page).count(),4,'R$ 27 representados por quatro cédulas');
      assert.match(await page.locator('[data-money-total]').textContent(),/R\$ 27,00/);
      assert.equal(await page.locator('[data-money-counter-pieces]').innerText(),'','sem valor ou multiplicador abaixo das peças');
      await dragPiece(page,counterPieces(page,10).first(),page.locator('[data-money-wallet]'));
      assert.equal(await counterPieces(page,10).count(),1,'arrastar devolve apenas uma das duas cédulas iguais');
      assert.match(await page.locator('[data-money-total]').textContent(),/R\$ 17,00/);
      await counterPieces(page,10).dblclick();
      assert.equal(await counterPieces(page,10).count(),0);
      assert.match(await page.locator('[data-money-total]').textContent(),/R\$ 7,00/);
      await page.locator('[data-money-clear]').click();
      assert.equal(await counterPieces(page).count(),0);
    }

    let checks = 0;
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:812,height:900},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      for (const mission of missions) for (const [questionIndex,question] of mission.questions.entries()) {
        const stages = ['initial','ready','first-error','final-error','success',...(question.products ? ['many-pieces'] : []),...(question.paidPieces ? ['help'] : [])];
        for (const stage of stages) {
          const layout = await page.evaluate(({missionIndex,questionIndex,stage}) => {
            beginMissionSession(missionIndex); challengeStage = 'questions'; currentChallengeIndex = questionIndex; setStudentView('challenge');
            const question = activeQuestionSet()[questionIndex],amount = question.type === 'money-compare' ? 0 : moneyMissions.expectedAmount(question),wrong = stage.includes('error');
            if (stage !== 'initial') {
              const input = document.querySelector('[data-money-amount]');
              if (input) { input.value = String(amount / 100 + (wrong && !question.people ? 1 : 0)); input.dispatchEvent(new Event('input',{bubbles:true})); }
              if (question.people) {
                const winner = moneyMissions.comparison(question).winner;
                document.querySelector(`[data-money-person="${wrong ? (winner === '0' ? '1' : '0') : winner}"]`).click();
              }
              if (question.products) {
                if (question.operation) document.querySelector(`[data-money-operation="${question.operation}"]`).click();
                let remaining = amount / 100 + (wrong ? 1 : 0);
                for (const value of moneyMissions.denominations) {
                  const count = stage === 'many-pieces' ? 1 : Math.floor(remaining / value); remaining %= value;
                  for (let n = 0; n < count; n++) document.querySelector(`[data-money-piece="${value}"][data-money-source="wallet"]`).click();
                }
              }
              if (wrong || stage === 'success') submitCurrentChallengeAnswer();
              if (stage === 'final-error') submitCurrentChallengeAnswer();
              if (stage === 'help') document.querySelector('[data-money-help]').click();
            }
            window.scrollTo(0,0);
            const buttons = [...document.querySelectorAll('[data-check-challenge],[data-next-challenge]')].filter(button => !button.hidden).map(button => button.getBoundingClientRect());
            const controls = [...document.querySelectorAll('.money-game button,.money-game input')].filter(element => element.getClientRects().length).map(element => ({rect:element.getBoundingClientRect(),html:element.outerHTML.slice(0,120)}));
            const panels = [...document.querySelectorAll('.money-shop>section')].map(element => element.getBoundingClientRect());
            const products = [...document.querySelectorAll('.money-product-image')].map(element => element.getBoundingClientRect());
            return {overflow:document.documentElement.scrollWidth > innerWidth,cardBottom:document.querySelector('.challenge-card').getBoundingClientRect().bottom,
              buttonsVisible:buttons.every(rect => rect.bottom <= innerHeight - 2),smallControls:controls.filter(({rect}) => rect.width < 43.9 || rect.height < 43.9).map(({html}) => html),
              formulaVisible:document.querySelector('[data-money-help-panel]')?.getClientRects().length > 0,
              columns:!panels.length || (panels.length === 3 && panels.every((rect,index) => Math.abs(rect.top - panels[0].top) < 1 && (!index || rect.left > panels[index - 1].right))),
              productSize:products.every(rect => rect.width >= 80 && rect.height >= 89),labels:document.querySelectorAll('.money-collection figcaption').length};
          },{missionIndex:mission.index,questionIndex,stage});
          const name = `${question.id}, ${stage}, ${viewport.width}px`;
          if (viewport.width >= 951 && layout.cardBottom > viewport.height - 2 && process.env.ORBITA_SCREENSHOTS) {
            await page.screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,'layout-failure.png'),fullPage:true});
          }
          assert.equal(layout.overflow,false,`${name}: largura`);
          if (viewport.width >= 951) { assert.ok(layout.cardBottom <= viewport.height - 2,`${name}: cartão em ${layout.cardBottom}`); assert.equal(layout.buttonsVisible,true,name); }
          else assert.deepEqual(layout.smallControls,[],`${name}: tamanho dos controles`);
          assert.equal(layout.formulaVisible,stage === 'help',`${name}: fórmula somente na ajuda`);
          if (question.products) {
            assert.equal(layout.columns,viewport.width >= 760,`${name}: três colunas com objetos, balcão e carteira`);
            assert.equal(layout.productSize,true,`${name}: objetos ampliados`);
          }
          assert.equal(layout.labels,0,`${name}: sem valores abaixo das cédulas`);
          if (process.env.ORBITA_SCREENSHOTS && [1366,1024,375].includes(viewport.width) && (['d8m1q4','d8m1q7','d8m1q10','d8m2q1','d8m2q6','d8m2q9'].includes(question.id) && stage === 'ready' || question.id === 'd8m3q9' && stage === 'help')) {
            fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
            await page.screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`${question.id}-${stage}-${viewport.width}.png`),fullPage:true});
          }
          checks++;
        }
      }
    }
    await page.waitForFunction(() => [...document.querySelectorAll('.money-game img')].every(img => img.complete && img.naturalWidth > 0));
    assert.deepEqual(errors,[]);
    console.log(`${checks} estados conferidos em cinco tamanhos de tela; três colunas, ilustrações ampliadas e cédulas sem legendas.`);

    const touchContext = await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const touchPage = await touchContext.newPage();
    touchPage.on('pageerror',error => errors.push(error.message));
    await prepare(touchPage); await openQuestion(touchPage,missions[1].index);
    const wallet2 = touchPage.locator('[data-money-piece="2"][data-money-source="wallet"]');
    await wallet2.scrollIntoViewIfNeeded();
    await wallet2.tap(); await wallet2.tap();
    assert.equal(await counterPieces(touchPage,2).count(),1,'toque duplo adiciona exatamente uma peça');
    await wallet2.tap(); await wallet2.tap();
    assert.equal(await counterPieces(touchPage,2).count(),2,'cédulas iguais têm imagens separadas');
    await counterPieces(touchPage,2).first().tap(); await counterPieces(touchPage,2).first().tap();
    assert.equal(await counterPieces(touchPage,2).count(),1,'toque duplo devolve apenas uma peça');
    await counterPieces(touchPage,2).tap(); await counterPieces(touchPage,2).tap();
    assert.equal(await counterPieces(touchPage,2).count(),0);
    const wallet1 = touchPage.locator('[data-money-piece="1"][data-money-source="wallet"]');
    await wallet1.tap(); await wallet1.tap();
    assert.match(await touchPage.locator('[data-money-wallet-total]').textContent(),/R\$ 1,00/);
    await touchPage.locator('[data-money-clear]').tap();
    // Arraste real por eventos de toque do Chrome, sem depender do mouse.
    const touch100 = touchPage.locator('[data-money-piece="100"][data-money-source="wallet"]');
    await touch100.scrollIntoViewIfNeeded();
    // Com os objetos maiores, posicione a primeira cédula perto da base da tela
    // para mostrar também o balcão durante este gesto, sem rolagem automática.
    await touch100.evaluate(button => window.scrollBy(0,button.getBoundingClientRect().bottom - (innerHeight - 60)));
    const from = await touch100.boundingBox(),to = await touchPage.locator('[data-money-counter]').boundingBox();
    assert.ok(to.y >= 0 && to.y + to.height / 2 <= 812,'balcão visível para o gesto');
    const cdp = await touchContext.newCDPSession(touchPage);
    const touchPoint = {x:from.x + from.width / 2,y:from.y + from.height / 2};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touchPoint]});
    for (let n = 1; n <= 10; n++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touchPoint.x + (to.x + to.width / 2 - touchPoint.x) * n / 10,y:touchPoint.y + (to.y + to.height / 2 - touchPoint.y) * n / 10}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.match(await touchPage.locator('[data-money-total]').textContent(),/R\$ 100,00/);
    assert.equal(await touchPage.locator('.money-drag-ghost').count(),0);
    await touchPage.locator('[data-money-clear]').tap();
    await touchPage.setViewportSize({width:375,height:500});
    const lowerCoin = touchPage.locator('[data-money-piece="1"][data-money-source="wallet"]');
    await lowerCoin.scrollIntoViewIfNeeded();
    const coinRect = await lowerCoin.boundingBox();
    assert.ok((await touchPage.locator('[data-money-counter]').boundingBox()).y < 0,'a moeda está abaixo do balcão');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:coinRect.x + coinRect.width / 2,y:coinRect.y + coinRect.height / 2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:coinRect.x + coinRect.width / 2,y:82}]});
    await touchPage.waitForFunction(() => document.querySelector('[data-money-counter]').getBoundingClientRect().top >= 90);
    const scrolledCounter = await touchPage.locator('[data-money-counter]').boundingBox();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:scrolledCounter.x + scrolledCounter.width / 2,y:scrolledCounter.y + scrolledCounter.height / 2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await counterPieces(touchPage,1).count(),1,'a rolagem automática permite arrastar a moeda da última linha');
    const counterCoin = await touchPage.locator('[data-money-piece="1"][data-money-source="counter"]').boundingBox();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:counterCoin.x + counterCoin.width / 2,y:counterCoin.y + counterCoin.height / 2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:counterCoin.x + 20,y:counterCoin.y + 30}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    assert.equal(await touchPage.locator('.money-drag-ghost').count(),0);
    assert.equal(await counterPieces(touchPage,1).count(),1,'cancelar o gesto não altera o dinheiro');
    assert.deepEqual(errors,[]);
    console.log('Peças individuais: exemplo de R$ 27, devolução de uma cédula repetida, toque duplo, arraste e rolagem automática conferidos.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
