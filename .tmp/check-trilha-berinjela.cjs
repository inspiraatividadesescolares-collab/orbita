const assert = require('node:assert/strict');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE);
(async () => {
 const browser = await chromium.launch({headless:true,channel:'chrome'});
 try {
  const page = await browser.newPage({reducedMotion:'reduce'});
  await page.goto('http://localhost:8093');
  await page.evaluate(() => {
   setSoundEnabled(false);
   currentStudent={id:1,name:'Alice Fernandes',track:3,coins:480,stars:12,progress:0,additionPuzzleVersion:1,completedMissionIds:['desafio-1-missao-1'],completedQuestionIds:[],completedChallengeIds:[],journal:[]};
   dailyRewardPending=false;showScreen('student');setStudentView('path');
  });
  const enabled=page.locator('.mission-node button:not(:disabled)').first();
  assert.deepEqual(await enabled.evaluate(button => ({background:getComputedStyle(button).backgroundColor,color:getComputedStyle(button).color})),{background:'rgb(160, 0, 109)',color:'rgb(255, 255, 255)'});
  await enabled.hover();
  assert.equal(await enabled.evaluate(button=>getComputedStyle(button).backgroundColor),'rgb(125, 0, 85)');
  assert.equal(await page.locator('.mission-node.is-locked button').first().isDisabled(),true);
  for (const viewport of [{width:1366,height:768},{width:375,height:812},{width:320,height:740}]) {
   await page.setViewportSize(viewport);await page.mouse.move(0,0);
   if(viewport.width<650) await page.locator('[data-path-filter]').selectOption('available');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:`.tmp/trilha-berinjela-${viewport.width}.png`,fullPage:viewport.width<650});
  }
  console.log('Botões berinjela, texto branco, hover, bloqueios e telas de 1366, 375 e 320 px conferidos.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
