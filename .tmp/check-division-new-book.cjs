const assert=require('node:assert/strict');
const {chromium}=require(process.env.ORBITA_PLAYWRIGHT_MODULE);
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});
  await page.goto('http://localhost:8093');
  await page.evaluate(()=>{
   setSoundEnabled(false);currentStudent={id:1,name:'Alice Fernandes',track:3,coins:480,stars:12,additionPuzzleVersion:1,completedMissionIds:thirdGradeMissions.map(m=>m.missionId),completedQuestionIds:[],completedChallengeIds:[],journal:[]};
   dailyRewardPending=false;showScreen('student');beginMissionSession(thirdGradeMissions.findIndex(m=>m.missionId==='desafio-17-missao-2'));challengeStage='questions';currentChallengeIndex=5;setStudentView('challenge');
  });
  await page.locator('[data-division-piece] img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
  assert.ok((await page.locator('[data-division-piece] img').first().getAttribute('src')).endsWith('/d17-m2-q6-b.png'));
  await page.screenshot({path:'.tmp/d17m2q6-livro-banco.png'});
  for(let i=0;i<20;i++){await page.locator(`[data-division-piece="${i}"]`).click();await page.locator(`[data-division-destination="${Math.floor(i/5)}"]`).click({position:{x:2,y:2}});}
  for(const viewport of [{width:1366,height:768},{width:375,height:812}]){
   await page.setViewportSize(viewport);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.equal(await page.locator('[data-division-piece] img').evaluateAll(images=>images.every(image=>image.naturalWidth>0)),true);
   if(viewport.width===1366)await page.screenshot({path:'.tmp/d17m2q6-livro-novo.png'});
  }
  await page.locator('[data-division-choice="5"]').click();
  assert.equal(await page.locator('[data-next-challenge]').isVisible(),true);
  console.log('Livro azul inteiro, 20 figuras, estante com quatro grupos de cinco, resposta e layout no celular conferidos.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
