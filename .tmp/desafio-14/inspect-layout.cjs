const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE);
(async () => {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  const page = await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});
  await page.goto('http://localhost:8080');
  await page.evaluate(() => {
    localStorage.setItem('orbita-teacher-data:jar-layout',JSON.stringify({classes:[{id:1,name:'Teste',grade:3,code:'LAYOUT'}],students:[{id:1,name:'Teste',classId:1,track:3,coins:0,stars:0,correctAnswers:0,challengesAttempted:0,errors:[],journal:[],progress:90,additionPuzzleVersion:1,completedMissionIds:thirdGradeMissions.slice(0,39).map(m=>m.missionId),completedChallengeIds:[],completedQuestionIds:[],lastDailyReward:localDateKey()}]}));
    localStorage.setItem('orbita-sound-enabled','false');
  });
  await page.locator('[data-go="profiles"][data-intent="login"]').click();
  await page.locator('[data-role="student"]').click();
  await page.locator('#auth-form [name="name"]').fill('Teste');
  await page.locator('#auth-form [name="code"]').fill('LAYOUT');
  await page.locator('#auth-form button[type="submit"]').click();
  await page.evaluate(() => {
    beginMissionSession(thirdGradeMissions.findIndex(m=>m.missionId==='desafio-14-missao-1'));
    challengeStage='questions'; setStudentView('challenge');
  });
  await page.locator('[data-jar="0"]').click();
  await page.locator('[data-jar-zone="fill"]').click();
  await page.locator('[data-jar="0"]').click();
  await page.locator('[data-jar="1"]').click();
  await page.locator('[data-jar="0"]').click();
  await page.locator('[data-jar="2"]').click();
  await page.locator('[data-check-challenge]').click();
  const images = await page.evaluate(async () => {
    const paths = [...new Set([...document.querySelectorAll('.jar-zone img,.jar-generated-art')].map(el => el.getAttribute('src') || el.getAttribute('href')))];
    return Promise.all(paths.map(async path => {
      const img = new Image(); img.src = path; await img.decode();
      return {path,width:img.naturalWidth,height:img.naturalHeight};
    }));
  });
  console.log(JSON.stringify({images,jars:await page.locator('[data-jar]').evaluateAll(jars => jars.map(jar => jar.getAttribute('aria-label'))),feedback:await page.locator('[data-feedback-copy]').textContent()}));
  await page.locator('[data-student-section="challenge"]').screenshot({path:__dirname+'/arte-3d/previa-missao.png'});
  await browser.close();
})();
