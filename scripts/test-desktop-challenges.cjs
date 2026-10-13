const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');
const puzzles = require('../addition-puzzles.js');

function permutations(values) {
  return values.length ? values.flatMap((value,index) => permutations(values.filter((_,i) => i !== index)).map(rest => [value,...rest])) : [[]];
}
const triangleOrders = permutations([0,1,2,3,4,5]);
const squareSolutions = [];
const rows = [];
for (let a = 0; a <= 9; a++) for (let b = 0; b <= 9; b++) {
  const c = 10 - a - b;
  if (c >= 0 && c <= 9 && new Set([a,b,c]).size === 3) rows.push([a,b,c]);
}
for (const first of rows) for (const second of rows) {
  const third = first.map((number,column) => 10 - number - second[column]);
  const values = [...first,...second,...third];
  if (puzzles.evaluateSquare({givens:Array(9).fill(null),target:10},values).correct) squareSolutions.push(values);
}
const answers = Object.fromEntries(puzzles.challenge.missions.flatMap(mission => mission.questions).map(question => {
  let correct,wrong;
  if (question.type === 'sum-triangle') {
    correct = triangleOrders.find(order => puzzles.evaluateTriangle(question,order).correct);
    wrong = triangleOrders.find(order => !puzzles.evaluateTriangle(question,order).correct);
  } else if (question.type === 'sum-square') {
    correct = squareSolutions.find(values => question.givens.every((value,index) => value === null || values[index] === value));
    wrong = question.givens.map(value => value ?? 0);
  } else {
    for (let i = 0; i < 23; i++) for (let j = i + 1; j < 24; j++) for (let k = j + 1; k < 25; k++) {
      const selected = [i,j,k];
      if (puzzles.evaluateThreeNumbers(question,selected).correct) correct = selected;
      else if (!wrong) wrong = selected;
    }
  }
  assert.ok(correct && wrong,question.id);
  return [question.id,{correct,wrong}];
}));

async function main() {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  try {
    const context = await browser.newContext({reducedMotion:'reduce'});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror',error => errors.push(error.message));
    await page.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8080');
    await page.evaluate(() => {
      setSoundEnabled(false);
      currentStudent = {id:1,name:'Teste de tela',track:3,coins:0,stars:0,additionPuzzleVersion:1,
        completedMissionIds:thirdGradeMissions.map(mission => mission.missionId),completedQuestionIds:[],completedChallengeIds:[]};
      dailyRewardPending = false;
      showScreen('student');
    });
    const missions = await page.evaluate(() => thirdGradeMissions.map((mission,index) => ({index,challenge:mission.challengeNumber,count:mission.questions.length})).filter(mission => [3,4].includes(mission.challenge)));
    const failures = [];
    let checks = 0;
    for (const viewport of [{width:1366,height:768},{width:1280,height:720},{width:1024,height:600},{width:1920,height:1080}]) {
      await page.setViewportSize(viewport);
      for (const mission of missions) for (let questionIndex = 0; questionIndex < mission.count; questionIndex++) {
        for (const stage of ['initial','ready','error','final-error','success']) {
          const bounds = await page.evaluate(({missionIndex,questionIndex,stage,answers}) => {
            beginMissionSession(missionIndex);
            setStudentView('challenge');
            challengeStage = 'questions';
            currentChallengeIndex = questionIndex;
            renderChallenge();
            const question = activeQuestionSet()[questionIndex];
            const incorrect = stage === 'error' || stage === 'final-error';
            const values = answers[question.id]?.[incorrect ? 'wrong' : 'correct'];
            const press = selector => document.querySelector(selector).click();
            const write = (input,value) => { input.value = String(value); input.dispatchEvent(new Event('input',{bubbles:true})); };
            if (stage !== 'initial') {
              if (question.type === 'sum-triangle') {
                values.forEach((token,index) => { press(`[data-triangle-token="${token}"]`); press(`[data-triangle-slot="${index}"]`); });
              } else if (question.type === 'sum-square') {
                document.querySelectorAll('[data-sum-square-cell]').forEach(input => write(input,values[Number(input.dataset.sumSquareCell)]));
              } else if (question.type === 'sum-three') {
                values.forEach(index => press(`[data-sum-three-cell="${index}"]`));
              } else {
                press('[data-subtraction-card="0"]');
                if (question.type === 'subtract-pair') {
                  press('[data-subtraction-card="1"]');
                  const values = [0,1].map(index => Number(document.querySelector(`[data-subtraction-card="${index}"] [data-card-value]`).textContent));
                  press(`[data-subtraction-card="${values[0] > values[1] ? 0 : 1}"]`);
                  write(document.querySelector('[data-subtraction-input]'),Math.abs(values[0] - values[1]) + Number(incorrect));
                } else if (question.type === 'subtract-target') {
                  const number = Number(document.querySelector('[data-subtraction-card="0"] [data-card-value]').textContent);
                  write(document.querySelector('[data-subtraction-input]'),question.target - number + Number(incorrect));
                }
              }
            }
            if (['error','final-error','success'].includes(stage)) {
              if (question.type === 'subtract-review') {
                const operation = question.operations[0];
                const verdict = operation.greater - operation.smaller === operation.result;
                press(`[data-subtraction-verdict="${stage === 'success' ? verdict : !verdict}"]`);
              } else {
                press('[data-check-challenge]');
                if (stage === 'final-error') press('[data-check-challenge]');
              }
            }
            window.scrollTo(0,0);
            const visible = element => element && element.getClientRects().length && !element.closest('[hidden]');
            const card = document.querySelector('.challenge-card').getBoundingClientRect();
            const buttons = [...document.querySelectorAll('[data-check-challenge],[data-next-challenge]')].filter(visible).map(button => {
              const rect = button.getBoundingClientRect();
              return {text:button.textContent,top:Math.round(rect.top),bottom:Math.round(rect.bottom)};
            });
            return {id:question.id,type:question.type,stage,cardBottom:Math.round(card.bottom),cardHeight:Math.round(card.height),
              docHeight:document.scrollingElement.scrollHeight,viewportHeight:innerHeight,buttons,
              gameHeight:Math.round(document.querySelector('.sum-puzzle,.subtraction-game').getBoundingClientRect().height),
              boardHeight:Math.round(document.querySelector('.sum-triangle,.sum-square-grid,.sum-click-grid,.subtraction-deck').getBoundingClientRect().height),
              feedbackHeight:Math.round(document.querySelector('[data-challenge-feedback]').getBoundingClientRect().height)};
          },{missionIndex:mission.index,questionIndex,stage,answers});
          checks++;
          if (bounds.cardBottom > viewport.height - 7 || bounds.docHeight > viewport.height + 1 || bounds.buttons.some(button => button.bottom > viewport.height - 7 || button.top < 58)) {
            failures.push({viewport,...bounds});
          }
          if (process.env.ORBITA_SCREENSHOTS && questionIndex === 0 && stage === 'success' && viewport.width === 1366) {
            fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
            await page.screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`compacto-missao-${mission.index + 1}.png`)});
          }
        }
      }
      console.log(`Layout em ${viewport.width} × ${viewport.height}: conferência concluída.`);
    }
    assert.deepEqual(errors,[]);
    if (failures.length) console.error(JSON.stringify({failures:failures.length,groups:failures.reduce((counts,failure) => { const key = `${failure.viewport.width}x${failure.viewport.height}:${failure.type}`; counts[key] = (counts[key] || 0) + 1; return counts; },{}),worst:failures.sort((a,b) => (b.cardBottom - b.viewportHeight) - (a.cardBottom - a.viewportHeight)).slice(0,4)},null,2));
    assert.equal(failures.length,0,'Questões e botões devem caber na janela sem rolagem.');
    console.log(`${checks} estados conferidos nos seis tipos de atividade, sem rolagem para os botões.`);
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
