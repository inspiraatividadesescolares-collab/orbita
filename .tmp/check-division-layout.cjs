const {chromium} = require('C:/Users/ednei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
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
    fs.mkdirSync('.tmp/desafio-17',{recursive:true});
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      for (let index = 0;index < 10;index++) {
        const initial = await page.evaluate(index => {
          abandonMissionSession(); beginMissionSession(thirdGradeMissions.findIndex(m => m.missionId === 'desafio-17-missao-1'));
          challengeStage = 'questions'; currentChallengeIndex = index; setStudentView('challenge'); window.scrollTo(0,0);
          return {bottom:document.querySelector('.challenge-card').getBoundingClientRect().bottom,
            ...(innerWidth === 1024 && index === 0 ? {rects:['.challenge-top','.challenge-card','.division-game','.division-toolbar','.division-instructions','.division-bank','.division-bank-items','.division-targets','.division-surface','.division-answer','.challenge-check'].map(s => {
              const e = document.querySelector(s),r = e.getBoundingClientRect(),c = getComputedStyle(e); return {s,top:r.top,height:r.height,width:r.width,margin:c.margin,padding:c.padding};
            })} : {})};
        },index);
        await page.evaluate(() => {
          const q = activeQuestionSet()[currentChallengeIndex];
          for (let i = 0;i < q.total;i++) {
            document.querySelector(`[data-division-piece="${i}"]`).click();
            document.querySelector(`[data-division-destination="${Math.floor(i / (q.groupSize || q.answer))}"]`).click();
          }
          const input = document.querySelector('[data-division-answer]'); input.value = String(q.answer); input.dispatchEvent(new Event('input',{bubbles:true}));
        });
        await page.locator('.division-activity img').evaluateAll(images => Promise.all(images.map(i => i.decode())));
        const ready = await page.evaluate(() => ({
          bottom:document.querySelector('.challenge-card').getBoundingClientRect().bottom,
          overflow:document.documentElement.scrollWidth > innerWidth,
          clipped:[...document.querySelectorAll('.division-target-items')].map(a => [a.clientWidth,a.clientHeight,a.scrollWidth,a.scrollHeight]).filter(a => a[2] > a[0] + 1 || a[3] > a[1] + 1)
        }));
        await page.locator('[data-check-challenge]').click();
        const final = await page.evaluate(() => document.querySelector('.challenge-card').getBoundingClientRect().bottom);
        console.log(JSON.stringify({q:index + 1,width:viewport.width,initial,ready,final}));
        if ([0,4,6,7,8].includes(index)) await page.screenshot({path:`.tmp/desafio-17/layout-q${index + 1}-${viewport.width}.png`,fullPage:true});
      }
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
