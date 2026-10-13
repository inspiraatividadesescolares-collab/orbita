const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE);
(async () => {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  try {
    const page = await browser.newPage({viewport:{width:1024,height:600},reducedMotion:'reduce'});
    await page.goto('http://localhost:8094');
    await page.evaluate(() => {
      setSoundEnabled(false); currentStudent = {...defaultTeacherData().students[0],track:3,
        completedMissionIds:thirdGradeMissions.map(m => m.missionId),completedQuestionIds:[],completedChallengeIds:[],journal:[]};
      dailyRewardPending = false; showScreen('student');
    });
    const index = await page.evaluate(() => thirdGradeMissions.findIndex(m => m.missionId === 'desafio-12-missao-1'));
    for (let questionIndex = 0; questionIndex < 10; questionIndex++) {
      for (const stage of ['initial','error','success','final-error']) {
        const bounds = await page.evaluate(({index,questionIndex,stage}) => {
          abandonMissionSession(); beginMissionSession(index); challengeStage = 'questions'; currentChallengeIndex = questionIndex; setStudentView('challenge');
          const q = activeQuestionSet()[questionIndex];
          if (stage !== 'initial') {
            document.querySelector('[data-multiplication-source]').click();
            for (let group = 0; group < q.groups; group++) for (let item = 0; item < q.perGroup; item++) document.querySelector(`[data-multiplication-destination="${group}"]`).click();
            const input = document.querySelector('[data-multiplication-answer]');
            input.value = String(q.answer + Number(stage !== 'success')); input.dispatchEvent(new Event('input',{bubbles:true})); submitCurrentChallengeAnswer();
            if (stage === 'final-error') { input.value = String(q.answer + 2); input.dispatchEvent(new Event('input',{bubbles:true})); submitCurrentChallengeAnswer(); }
          }
          return {id:q.id,stage,bottom:document.querySelector('.challenge-card').getBoundingClientRect().bottom,overflow:document.documentElement.scrollWidth > innerWidth};
        },{index,questionIndex,stage});
        console.log(JSON.stringify(bounds));
      }
    }
    await page.setViewportSize({width:1366,height:768});
    await page.evaluate(index => { abandonMissionSession(); beginMissionSession(index); challengeStage = 'questions'; setStudentView('challenge'); },index);
    await page.locator('[data-student-section="challenge"]').screenshot({path:__dirname + '/grupos/d12m1q1-vazia-1366.png'});
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
