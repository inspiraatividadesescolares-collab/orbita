const assert=require('node:assert/strict');
const {chromium}=require(process.env.ORBITA_PLAYWRIGHT_MODULE);
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});
  await page.goto('http://localhost:8093');
  await page.evaluate(()=>{
   setSoundEnabled(false);currentStudent={id:1,name:'Alice Fernandes',track:3,coins:480,stars:12,additionPuzzleVersion:1,completedMissionIds:thirdGradeMissions.map(m=>m.missionId),completedQuestionIds:[],completedChallengeIds:[],journal:[]};
   dailyRewardPending=false;showScreen('student');beginMissionSession(thirdGradeMissions.findIndex(m=>m.missionId==='desafio-17-missao-1'));challengeStage='questions';currentChallengeIndex=4;setStudentView('challenge');
  });
  for(let i=0;i<15;i++){await page.locator(`[data-division-piece="${i}"]`).click();await page.locator(`[data-division-destination="${Math.floor(i/5)}"]`).click({position:{x:2,y:2}});}
  for(const viewport of [{width:1366,height:768},{width:375,height:812},{width:320,height:740}]){
   await page.setViewportSize(viewport);
   const bounds=await page.locator('.division-station').evaluateAll(stations=>stations.map(station=>{
    const surface=station.querySelector('.division-surface').getBoundingClientRect();
    return [...station.querySelectorAll('[data-division-piece]')].map(piece=>{const box=piece.getBoundingClientRect();return {x:(box.x+box.width/2-surface.x)/surface.width,y:(box.y+box.height/2-surface.y)/surface.height};});
   }));
   bounds.forEach(pieces=>{assert.equal(pieces.length,5);assert.ok(Math.abs(pieces.reduce((n,p)=>n+p.x,0)/5-.5)<.02);assert.ok(Math.abs(pieces.reduce((n,p)=>n+p.y,0)/5-.479)<.02);});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(viewport.width===1366)await page.screenshot({path:'.tmp/d17m1q5-caixas-centro.png'});
  }
  await page.locator('[data-division-answer]').fill('5');await page.locator('[data-check-challenge]').click();
  assert.equal(await page.locator('[data-next-challenge]').isVisible(),true);
  console.log('Cinco botões centralizados em cada caixa: computador, celular e resposta conferidos.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
