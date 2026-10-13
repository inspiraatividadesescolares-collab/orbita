const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.ORBITA_TEST_URL || 'http://localhost:8080';

async function login(page) {
  await page.locator('[data-go="profiles"][data-intent="login"]').click();
  await page.locator('[data-role="student"]').click();
  await page.locator('#auth-form [name="name"]').fill('Teste Sorte');
  await page.locator('#auth-form [name="code"]').fill('SORTE-TESTE');
  await page.locator('#auth-form button[type="submit"]').click();
  await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
}

async function finishMission(page, missionIndex) {
  return page.evaluate(index => {
    beginMissionSession(index);
    setStudentView('challenge');
    // Exercise the real mission completion path without retesting every question type.
    missionSession.questionIds = new Set(activeQuestionSet().map(question => question.id));
    currentChallengeIndex = activeQuestionSet().length - 1;
    advanceCurrentChallenge();
    return {result:missionResultState,rounds:currentStudent.luckRounds.length,stars:currentStudent.stars};
  }, missionIndex);
}

async function playMemory(page, rocky, win) {
  const attribute = rocky ? 'data-rocky-memory-card' : 'data-memory-card';
  const pairs = await page.evaluate(rocky => {
    const game = rocky ? rockyMemoryBonusState : memoryBonusState;
    const groups = {};
    game.cards.forEach((card,index) => (groups[card.pair] ??= []).push(index));
    return Object.values(groups);
  }, rocky);
  assert.ok(pairs.every(pair => pair.length === 2), 'Each memory image must have a matching name');
  const selections = win ? pairs : Array(3).fill([pairs[0][0],pairs[1][0]]);
  for (const [first,second] of selections) {
    await page.locator(`[${attribute}="${first}"]`).click();
    await page.locator(`[${attribute}="${second}"]`).click();
    await page.waitForFunction(rocky => {
      const game = rocky ? rockyMemoryBonusState : memoryBonusState;
      return game.finished || !game.locked;
    }, rocky);
  }
  return win ? 6 : -3;
}

async function playRound(page, type, win) {
  let score;
  if (type === 'memory' || type === 'rocky-memory') score = await playMemory(page,type === 'rocky-memory',win);
  else if (type === 'roulette') {
    const index = win ? 5 : 1;
    await page.evaluate(index => {window.testRandom = Math.random;Math.random = () => (index + .1) / 6;},index);
    await page.locator('[data-spin-planet-roulette]').click();
    await page.evaluate(() => {Math.random = window.testRandom;delete window.testRandom;});
    score = win ? 5 : -1;
  } else if (type === 'constellation') {
    await page.locator('[data-constellation-card]:enabled').first().waitFor();
    const choice = await page.evaluate(win => constellationBonusState.cards.findIndex(card => win ? card.stars === 5 : card.stars === -2),win);
    await page.locator(`[data-constellation-card="${choice}"]`).click();
    score = win ? 5 : -2;
  } else if (type === 'meteor') {
    await page.locator('[data-meteor-cup]:enabled').first().waitFor();
    const target = await page.evaluate(() => meteorBonusState.meteorCupId);
    if (win) await page.locator(`[data-meteor-cup="${target}"]`).click();
    else {
      for (const wrong of [0,1,2].filter(id => id !== target)) await page.locator(`[data-meteor-cup="${wrong}"]:enabled`).click();
    }
    score = win ? 6 : -3;
  } else if (type === 'puzzle') {
    for (let attempt = 0; attempt < (win ? 1 : 2); attempt++) {
      for (let slot = 0; slot < 6; slot++) {
        const piece = win ? slot : (slot + 1) % 6;
        await page.locator(`[data-solar-puzzle-tray] [data-puzzle-piece="${piece}"]`).click();
        await page.locator(`[data-puzzle-slot="${slot}"]`).click();
      }
      await page.locator('[data-check-solar-puzzle]').click();
    }
    score = win ? 6 : -3;
  } else throw new Error(`Unexpected game: ${type}`);
  await page.locator('[data-student-section="result"]').waitFor({state:'visible'});
  return score;
}

async function checkResult(page, score) {
  const title = await page.locator('[data-journey-result-title]').textContent();
  assert.match(title,new RegExp(`${score > 0 ? 'ganhou' : 'perdeu'} ${Math.abs(score)} estrela`));
  assert.equal(await page.locator('[data-journey-result-stars-value]').textContent(),score > 0 ? `+${score}` : `−${Math.abs(score)}`);
  assert.deepEqual(await page.locator('.journey-result-actions button:visible').allTextContents(),['Continuar na trilha','Explorar novos mundos']);
  assert.equal(await page.locator('[data-journey-result-coins]').isVisible(),false);
  assert.equal(await page.locator('.journey-result-card').evaluate(card => card.classList.contains('is-negative')),score < 0);
}

async function main() {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  try {
    const context = await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});
    const page = await context.newPage(), errors = [];
    page.setDefaultTimeout(15000);
    page.on('pageerror',error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('orbita-sound-enabled','false'));
    await page.goto(url);
    await page.evaluate(() => localStorage.setItem('orbita-teacher-data:teste-sorte',JSON.stringify({
      classes:[{id:1,name:'Turma de teste',grade:3,code:'SORTE-TESTE'}],
      students:[{id:1,name:'Teste Sorte',classId:1,track:3,coins:0,stars:50,progress:0,additionPuzzleVersion:1,
        completedMissionIds:[],completedQuestionIds:[],completedChallengeIds:[],lastDailyReward:localDateKey(),
        // All games were already played under the old once-per-game rules.
        bonusMemoryPlayed:true,bonusMemoryPair:'todos os pares',planetRoulettePlayed:true,constellationBonusPlayed:true,
        meteorBonusPlayed:true,solarPuzzlePlayed:true,rockyMemoryPlayed:true}]
    })));
    await login(page);
    const missions = await page.evaluate(() => thirdGradeMissions.map((mission,index) => ({index,challenge:mission.challengeNumber,number:mission.missionNumber})));
    const challenges = [...new Set(missions.map(mission => mission.challenge))];
    const types = ['memory','roulette','constellation','meteor','puzzle','rocky-memory'];
    let roundCount = 0;
    for (const challenge of challenges) {
      const group = missions.filter(mission => mission.challenge === challenge);
      for (const [position,mission] of group.entries()) {
        const completed = await finishMission(page,mission.index);
        const last = position === group.length - 1;
        assert.equal(completed.result.challengeCompleted,last,`Challenge ${challenge}, mission ${mission.number}`);
        assert.equal(completed.rounds,roundCount + Number(last),'Exactly one round per complete challenge');
        assert.equal(await page.locator('[data-start-result-bonus]').isVisible(),last);
        if (!last) assert.equal(await page.locator('[data-result-next-mission]').isVisible(),true);
      }
      roundCount++;
      const type = types[(challenge - 1) % types.length];
      assert.equal(await page.evaluate(() => missionResultState.bonusType),type);
      assert.equal(await page.locator('.journey-result-actions button:visible').count(),1,'Complete the round before the next result choices');
      if (challenge === 8) {
        // Pending round survives closing/reopening the page, and can be resumed.
        await page.reload();
        await login(page);
        assert.equal(await page.locator('[data-luck-round-card]').isVisible(),true);
        await page.locator('[data-resume-luck-round]').click();
      } else await page.locator('[data-start-result-bonus]').click();
      assert.equal(await page.locator('[data-student-title]').textContent(),'Sorte ou Revés');
      const before = await page.evaluate(() => currentStudent.stars);
      const win = Math.floor((challenge - 1) / 6) % 2 === 0;
      const score = await playRound(page,type,win);
      await checkResult(page,score);
      const after = await page.evaluate(() => ({stars:currentStudent.stars,round:currentStudent.luckRounds.at(-1)}));
      assert.equal(after.stars,before + score,'New challenges award/lose stars even when the same game was played before');
      assert.equal(after.round.completed,true);
      assert.equal(after.round.stars,score);
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem(state.studentStorageKey)).students[0]);
      assert.equal(saved.stars,after.stars);
      assert.equal(saved.luckRounds.length,roundCount);
      const destination = challenge % 2 ? 'explore' : 'path';
      if (challenge === 1) {
        for (const viewport of [{width:1366,height:768},{width:375,height:812},{width:320,height:740}]) {
          await page.setViewportSize(viewport);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,'Result must fit desktop and mobile widths');
          for (const selector of ['[data-result-path]','[data-result-explore]']) {
            const bounds = await page.locator(selector).boundingBox();
            assert.ok(bounds.width >= 44 && bounds.height >= 44);
          }
          if (process.env.ORBITA_SCREENSHOTS) {
            fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
            await page.screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`sorte-resultado-${viewport.width}.png`),fullPage:true});
          }
        }
        await page.setViewportSize({width:1366,height:768});
      }
      await page.locator(destination === 'explore' ? '[data-result-explore]' : '[data-result-path]').click();
      assert.equal(await page.locator(`[data-student-section="${destination}"]`).isVisible(),true);
      assert.equal(await page.locator(`[data-student-view="${destination}"]`).getAttribute('aria-current'),'page');
      if (destination === 'explore') assert.equal(await page.locator('[data-explore-scene] [data-explore-body]').count(),10);
      const replay = await finishMission(page,group.at(-1).index);
      assert.equal(replay.rounds,roundCount,'Replaying a challenge must not create another scored round');
      assert.equal(replay.result.bonusType,'');
      assert.equal(replay.stars,after.stars,'Replaying cannot duplicate challenge star rewards');
      console.log(`Desafio ${challenge}: ${type}, ${score > 0 ? '+' : ''}${score} estrelas, destino ${destination}; sem pontuação duplicada.`);
    }
    assert.equal(await page.evaluate(() => nextAvailableMissionIndex()),-1);
    await page.evaluate(() => {renderStudentDashboard();setStudentView('home');});
    assert.equal(await page.locator('[data-luck-round-card]').isVisible(),false);
    const practiceBefore = await page.evaluate(() => currentStudent.stars);
    await page.locator('[data-open-memory-bonus]').click();
    await playMemory(page,false,true);
    assert.equal(await page.evaluate(() => currentStudent.stars),practiceBefore,'Practice games do not award duplicate stars');
    assert.match(await page.locator('[data-journey-result-title]').textContent(),/saldo de estrelas não mudou/);
    assert.deepEqual(await page.locator('.journey-result-actions button:visible').allTextContents(),['Continuar na trilha','Explorar novos mundos']);
    assert.equal(await page.evaluate(() => /atividade bônus/i.test(document.querySelector('.student-screen').textContent)),false);
    assert.deepEqual(errors,[]);
    console.log(`${missions.length} missões, ${roundCount} desafios, seis jogos, ganhos/perdas, persistência, prática e navegação: aprovados.`);
  } finally {await browser.close();}
}

main().catch(error => {console.error(error);process.exitCode = 1;});
