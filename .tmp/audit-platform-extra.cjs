const assert = require('node:assert/strict');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE);
const fs = require('node:fs');
(async () => {
 const browser = await chromium.launch({headless:true,channel:'chrome'});
 try {
  const page = await browser.newPage({reducedMotion:'reduce'}), errors = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8092');
  await page.evaluate(() => {
   setSoundEnabled(false);
   currentStudent = {id:1,name:'Alice Fernandes',track:3,coins:480,stars:12,correctAnswers:37,challengesAttempted:40,journal:['terra'],completedQuestionIds:[],completedChallengeIds:[],completedMissionIds:thirdGradeMissions.map(m => m.missionId),additionPuzzleVersion:1};
   dailyRewardPending = false; showScreen('student');
  });
  const out = '.tmp/platform-after'; fs.mkdirSync(out,{recursive:true});
  async function check(label, screenshot=true) {
   await page.evaluate(() => scrollTo(0,0));
   await page.locator('.screen--active img').evaluateAll(images => Promise.all(images.filter(i => i.getClientRects().length).map(i => i.decode().catch(() => {}))));
   const result = await page.evaluate(() => ({overflow:document.documentElement.scrollWidth > innerWidth,broken:[...document.querySelectorAll('.screen--active img')].filter(i => i.getClientRects().length && !i.naturalWidth).map(i => i.src)}));
   checks.push({label,width:page.viewportSize().width,...result});
   assert.equal(result.overflow,false,label); assert.deepEqual(result.broken,[],label);
   if (screenshot) await page.screenshot({path:`${out}/${label}-${page.viewportSize().width}.png`});
  }
  const bonuses = [['bonus','memory-bonus'],['roulette','planet-roulette'],['constellation','constellation-bonus'],['meteor','meteor-bonus'],['puzzle','solar-puzzle'],['rocky-memory','rocky-memory-bonus']];
  for (const viewport of [{width:1366,height:768},{width:375,height:812},{width:320,height:740}]) {
   await page.setViewportSize(viewport);
   for (const [view,attribute] of bonuses) {
    await page.evaluate(() => {showScreen('student');setStudentView('home');});
    await page.locator(`[data-open-${attribute}]`).click();
    assert.equal(await page.locator(`[data-student-section="${view}"]`).isVisible(),true);
    assert.equal(await page.locator('.student-bottom-nav').isVisible(),false);
    await check(`student-${view}`);
    await page.locator(`[data-student-section="${view}"] [data-close-${attribute}]`).first().click();
    assert.equal(await page.locator('[data-student-section="home"]').isVisible(),true);
   }
   await page.evaluate(() => {missionResultState={missionIndex:0,coins:30,stars:3};renderJourneyResult();setStudentView('result');});
   await check('student-result');
   await page.evaluate(() => showScreen('success')); await check('registration-success');
  }
  const missions = await page.evaluate(() => thirdGradeMissions.map((mission,index) => ({index,count:mission.questions.length})));
  for (const viewport of [{width:1366,height:768},{width:375,height:812}]) {
   await page.setViewportSize(viewport);
   for (const mission of missions) {
    await page.evaluate(index => {showScreen('student');abandonMissionSession();beginMissionSession(index);setStudentView('challenge');},mission.index);
    await check(`mission-${mission.index}-intro`,false);
    try { await page.locator('[data-begin-questions]').click({timeout:8000}); }
    catch (error) {await page.screenshot({path:`${out}/intro-failure-${mission.index}-${viewport.width}.png`,fullPage:true});console.log(JSON.stringify({mission,width:viewport.width,bounds:await page.locator('[data-begin-questions]').boundingBox()}));throw error;}
    await check(`mission-${mission.index}-question`,false);
   }
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(`${out}/extra-audit.json`, JSON.stringify({checks,errors},null,2));
  console.log(`${checks.length} verificações: bônus, conclusão, cadastro e 51 missões no computador e no celular, sem erros ou imagens quebradas.`);
 } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
