const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE);
(async () => {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  try {
    const page = await browser.newPage({reducedMotion:'reduce'}),errors = [];
    page.on('pageerror',error => errors.push(error.message));
    page.on('response',response => { if (response.status() >= 400 && response.url().includes('ilustracoes-geradas')) errors.push(response.url()); });
    await page.goto('http://localhost:8094');
    await page.evaluate(() => {
      setSoundEnabled(false); currentStudent = {...defaultTeacherData().students[0],track:3,
        completedMissionIds:thirdGradeMissions.map(m => m.missionId),completedQuestionIds:[],completedChallengeIds:[],journal:[]};
      dailyRewardPending = false; showScreen('student');
    });
    const index = await page.evaluate(() => thirdGradeMissions.findIndex(m => m.missionId === 'desafio-12-missao-1'));
    const output = path.join(__dirname,'grupos-gerados'); fs.mkdirSync(output,{recursive:true});
    let checks = 0;
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      for (let questionIndex = 0; questionIndex < 10; questionIndex++) {
        for (const filled of [false,true]) {
          await page.evaluate(({index,questionIndex,filled}) => {
            abandonMissionSession(); beginMissionSession(index); challengeStage = 'questions'; currentChallengeIndex = questionIndex; setStudentView('challenge');
            const q = activeQuestionSet()[questionIndex];
            if (filled) {
              document.querySelector('[data-multiplication-source]').click();
              for (let group = 0; group < q.groups; group++) for (let item = 0; item < q.perGroup; item++) document.querySelector(`[data-multiplication-destination="${group}"]`).click();
            }
            document.activeElement?.blur();
          },{index,questionIndex,filled});
          await page.locator('.multiplication-group-game img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
          const bounds = await page.evaluate(() => ({bottom:document.querySelector('.challenge-card').getBoundingClientRect().bottom,overflow:document.documentElement.scrollWidth > innerWidth,
            broken:[...document.querySelectorAll('.multiplication-group-game img')].filter(image => !image.complete || !image.naturalWidth).length}));
          assert.equal(bounds.broken,0); assert.equal(bounds.overflow,false);
          if (viewport.width >= 951) assert.ok(bounds.bottom <= viewport.height,`q${questionIndex + 1} at ${viewport.width}: ${bounds.bottom}`);
          if (viewport.width !== 320 && [0,1,2,4,8].includes(questionIndex)) await page.locator('[data-student-section="challenge"]').screenshot({path:path.join(output,`q${questionIndex + 1}-${filled ? 'montada' : 'vazia'}-${viewport.width}.png`)});
          checks++;
        }
      }
    }
    assert.deepEqual(errors,[]); console.log(`${checks} estados visuais: imagens carregadas, montagem preservada e nenhum transbordamento.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
