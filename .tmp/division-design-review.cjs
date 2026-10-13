const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE);
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  try {
    const page = await browser.newPage({reducedMotion:'reduce'});
    await page.goto(process.env.ORBITA_TEST_URL || 'http://localhost:8091');
    await page.evaluate(() => {
      setSoundEnabled(false);
      currentStudent = {id:1,name:'Revisão de design',track:3,coins:0,stars:0,correctAnswers:0,challengesAttempted:0,errors:[],journal:[],progress:0,additionPuzzleVersion:1,completedQuestionIds:[],completedChallengeIds:[],completedMissionIds:thirdGradeMissions.map(m => m.missionId)};
      dailyRewardPending = false; showScreen('student');
    });
    fs.mkdirSync('.tmp/division-design',{recursive:true});
    for (const viewport of [{width:1366,height:768},{width:1024,height:600},{width:375,height:812},{width:320,height:740}].filter(v => !process.env.ORBITA_REVIEW_WIDTH || v.width === Number(process.env.ORBITA_REVIEW_WIDTH))) {
      await page.setViewportSize(viewport);
      for (let mission=1;mission<=3;mission++) for (let index=0;index<10;index++) {
        if(process.env.ORBITA_REVIEW_MISSION && mission !== Number(process.env.ORBITA_REVIEW_MISSION))continue;
        await page.evaluate(({mission,index}) => {
          abandonMissionSession(); beginMissionSession(thirdGradeMissions.findIndex(m => m.missionId === `desafio-17-missao-${mission}`));
          challengeStage='questions';currentChallengeIndex=index;setStudentView('challenge');window.scrollTo(0,0);
        },{mission,index});
        await page.locator('.division-concept-illustration img,.division-activity img,.calculation-activity img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
        const initial = await page.evaluate(() => ({bottom:document.querySelector('.challenge-card').getBoundingClientRect().bottom,overflow:document.documentElement.scrollWidth>innerWidth}));
        await page.evaluate(() => {
          const q=activeQuestionSet()[currentChallengeIndex];
          if(q.type==='division-sharing') {
            for(let i=0;i<q.total;i++) {document.querySelector(`[data-division-piece="${i}"]`).click();document.querySelector(`[data-division-destination="${Math.floor(i/(q.groupSize||q.answer))}"]`).click();}
          } else if(q.type==='division-calculation') {
            const area=document.querySelector('[data-calculation-board]'),place=document.querySelector('[data-calculation-place]');
            const divisor=q.divisor|| (q.id.endsWith('q9')?2:3),perPart=q.total/divisor || (divisor===2?8:9);
            const columns=Math.min(divisor,innerWidth<=600?2:5),rows=Math.ceil(divisor/columns);
            function drop(x,y) {const r=area.getBoundingClientRect();place.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1,clientX:r.left+x,clientY:r.top+y}));}
            document.querySelector('[data-calculation-tool="frame"]').click();
            for(let i=0;i<divisor;i++){const r=area.getBoundingClientRect();drop(r.width*(i%columns+.5)/columns,r.height*(Math.floor(i/columns)+.5)/rows);}
            document.querySelector('[data-calculation-tool="cap"]').click();
            const size=innerWidth<=600?23:innerHeight<=650?20:28;
            for(const frame of document.querySelectorAll('.calculation-copy--frame')) {
              const r=frame.getBoundingClientRect(),a=area.getBoundingClientRect(),cols=Math.max(1,Math.min(perPart,Math.floor(r.width*.6/size))),rows=Math.ceil(perPart/cols);
              for(let i=0;i<perPart;i++)drop(r.left-a.left+r.width*(cols===1?.5:.2+i%cols*.6/(cols-1)),r.top-a.top+r.height*(rows===1?.5:.2+Math.floor(i/cols)*.6/(rows-1)));
            }
          }
        });
        if(process.env.ORBITA_REVIEW_ANSWER)await page.evaluate(() => {
          const q=activeQuestionSet()[currentChallengeIndex];
          if(q.type==='division-sharing'&&q.options)document.querySelector(`[data-division-choice="${q.choiceAnswer}"]`).click();
          else if(q.type==='division-calculation'&&q.options)document.querySelector(`[data-calculation-choice="${q.answer}"]`).click();
          else if(q.type==='quiz')document.querySelectorAll('[data-challenge-answer]')[q.options.indexOf(q.answer)].click();
        });
        await page.evaluate(() => document.activeElement?.blur());
        const final=await page.evaluate(() => ({bottom:document.querySelector('.challenge-card').getBoundingClientRect().bottom,overflow:document.documentElement.scrollWidth>innerWidth,clipped:[...document.querySelectorAll('.division-target-items')].filter(a=>a.scrollWidth>a.clientWidth+1||a.scrollHeight>a.clientHeight+1).map(a=>a.dataset.divisionItems)}));
        if(initial.overflow||final.overflow||final.clipped.length||(viewport.width>=951&&(initial.bottom>viewport.height||final.bottom>viewport.height)))console.log(JSON.stringify({mission,q:index+1,width:viewport.width,initial,final}));
        await page.locator('[data-student-section="challenge"]').screenshot({path:`.tmp/division-design/m${mission}-q${index+1}-${viewport.width}.png`});
      }
    }
    console.log('120 cenas revisadas.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
