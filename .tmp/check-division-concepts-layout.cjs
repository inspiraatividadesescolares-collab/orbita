const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  try {
    const page = await browser.newPage({reducedMotion:'reduce'});
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      setSoundEnabled(false);
      currentStudent = {id:1,name:'Teste de layout',track:3,coins:0,stars:0,correctAnswers:0,challengesAttempted:0,
        errors:[],journal:[],progress:0,additionPuzzleVersion:1,completedQuestionIds:[],completedChallengeIds:[],
        completedMissionIds:thirdGradeMissions.slice(0,-1).map(m => m.missionId)};
      dailyRewardPending = false; showScreen('student');
    });
    fs.mkdirSync('.tmp/desafio-17-missao-2',{recursive:true});
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      for (let index = 0;index < 10;index++) {
        await page.evaluate(index => {
          abandonMissionSession(); beginMissionSession(thirdGradeMissions.findIndex(m => m.missionId === 'desafio-17-missao-2'));
          challengeStage = 'questions'; currentChallengeIndex = index; setStudentView('challenge'); window.scrollTo(0,0);
        },index);
        await page.locator('.division-concept-illustration img,.division-activity img,.calculation-activity img').evaluateAll(images => Promise.all(images.map(i => i.decode())));
        const initial = await page.evaluate(() => document.querySelector('.challenge-card').getBoundingClientRect().bottom);
        await page.evaluate(() => {
          const q = activeQuestionSet()[currentChallengeIndex];
          if (q.type === 'division-sharing') {
            for (let i = 0;i < q.total;i++) {
              document.querySelector(`[data-division-piece="${i}"]`).click();
              document.querySelector(`[data-division-destination="${Math.floor(i / (q.groupSize || q.answer))}"]`).click();
            }
            document.querySelector(`[data-division-choice="${q.choiceAnswer}"]`).click();
          } else if (q.type === 'division-calculation') {
            document.querySelector('[data-calculation-tool="frame"]').click();
            document.querySelector('[data-calculation-place]').click();
            document.querySelector('[data-calculation-tool="cap"]').click();
            for (let i = 0;i < 12;i++) document.querySelector('[data-calculation-place]').click();
            document.querySelector(`[data-calculation-choice="${q.answer}"]`).click();
          } else if (q.type === 'input') {
            document.querySelector('[data-challenge-input]').value = q.answer;
            document.querySelector('[data-check-challenge]').click();
          } else document.querySelectorAll('[data-challenge-answer]')[q.options.indexOf(q.answer)].click();
        });
        const final = await page.evaluate(() => ({
          bottom:document.querySelector('.challenge-card').getBoundingClientRect().bottom,
          overflow:document.documentElement.scrollWidth > innerWidth,
          clipped:[...document.querySelectorAll('.division-target-items')].filter(a => a.scrollWidth > a.clientWidth + 1 || a.scrollHeight > a.clientHeight + 1).map(a => ({size:[a.clientWidth,a.clientHeight,a.scrollWidth,a.scrollHeight],pieces:[...a.children].map(p => {const r = p.getBoundingClientRect();return [r.width,r.height];})})),
          rects:innerWidth === 1024 && currentChallengeIndex === 7 ? ['.challenge-card','.division-game','.division-toolbar','.division-bank','.division-targets','.division-choices-help','.division-choices','.challenge-actions'].map(s => {
            const e = document.querySelector(s),r = e.getBoundingClientRect(); return {s,top:r.top,height:r.height};
          }) : undefined
        }));
        console.log(JSON.stringify({q:index + 1,width:viewport.width,initial,final}));
        await page.locator('[data-student-section="challenge"]').screenshot({path:`.tmp/desafio-17-missao-2/d17m2q${index + 1}-${viewport.width}.png`});
      }
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
