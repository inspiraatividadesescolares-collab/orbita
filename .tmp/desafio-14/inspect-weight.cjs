const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE);
(async () => {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  try {
    const page = await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      state.screen = 'student'; currentStudent = {track:3,completedMissionIds:[],completedQuestionIds:[]};
      beginMissionSession(thirdGradeMissions.findIndex(m => m.missionId === 'desafio-14-missao-3'));
      challengeStage = 'questions'; setStudentView('challenge');
      document.querySelector('[data-screen="student"]').hidden = false; document.querySelector('[data-screen="student"]').classList.add('screen--active');
      document.querySelector('[data-screen="home"]').hidden = true;
    });
    await page.locator('[data-mass-weight="1"]').click();
    console.log(await page.evaluate(() => [...document.querySelectorAll('[data-mass-zone]')].map(el => {
      const r = el.getBoundingClientRect(),x = r.x + r.width / 2,y = r.y + r.height / 2;
      return {zone:el.dataset.massZone,x,y,hit:document.elementFromPoint(x,y)?.outerHTML.slice(0,250)};
    })));
    await page.locator('[data-student-section="challenge"]').screenshot({path:'.tmp/desafio-14/missao-3/initial.png'});
    await page.locator('[data-mass-zone="right"]').click();
    console.log('place',await page.locator('[data-mass-weight="1"]').getAttribute('data-mass-place'));
  } finally { await browser.close(); }
})().catch(e => {console.error(e);process.exitCode=1;});
