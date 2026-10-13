const {chromium}=require(process.env.ORBITA_PLAYWRIGHT_MODULE);
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.ORBITA_TEST_URL||'http://localhost:8092');
  await page.evaluate(()=>{setSoundEnabled(false);teacherData=defaultTeacherData();state.teacherEmail='ana.martins@escola.com';currentStudent={id:1,name:'Alice Fernandes',track:3,coins:480,stars:12,correctAnswers:37,challengesAttempted:40,errors:[],journal:['terra','marte'],progress:30,additionPuzzleVersion:1,completedQuestionIds:[],completedChallengeIds:['desafio-1','desafio-2'],completedMissionIds:thirdGradeMissions.slice(0,8).map(m=>m.missionId)};dailyRewardPending=false;});
  const inventory=await page.evaluate(()=>({screens:[...document.querySelectorAll('[data-screen]')].map(e=>e.dataset.screen),student:[...document.querySelectorAll('[data-student-section]')].map(e=>e.dataset.studentSection),teacher:[...document.querySelectorAll('[data-teacher-section]')].map(e=>e.dataset.teacherSection),admin:[...document.querySelectorAll('.admin-view')].map(e=>e.dataset.view),types:[...new Set(thirdGradeMissions.flatMap(m=>m.questions.map(q=>q.type)))],missions:thirdGradeMissions.length}));
  console.log(JSON.stringify(inventory));
  const out=process.env.ORBITA_AUDIT_OUT||'.tmp/platform-before';fs.mkdirSync(out,{recursive:true});
  const checks=[];
  async function snap(label){await page.evaluate(()=>window.scrollTo(0,0));await page.locator('.screen--active img').evaluateAll(imgs=>Promise.all(imgs.filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));
   const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.querySelectorAll('.screen--active img')].filter(i=>i.getClientRects().length&&!i.naturalWidth).map(i=>decodeURIComponent(i.src)),small:[...document.querySelectorAll('.screen--active button,.screen--active a')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')).filter(e=>{const r=e.getBoundingClientRect();return r.width<32||r.height<32;}).map(e=>(e.getAttribute('aria-label')||e.textContent).trim()).slice(0,10)}));
   checks.push({label,width:page.viewportSize().width,...result});await page.screenshot({path:`${out}/${label}-${page.viewportSize().width}.png`});}
  for(const v of [{width:1366,height:768},{width:375,height:812},{width:320,height:740}]){
   await page.setViewportSize(v);
   await page.evaluate(()=>showScreen('home'));await snap('home');
   await page.evaluate(()=>{state.intent='login';showScreen('profiles');});await snap('profiles');
   await page.evaluate(()=>{state.role='student';showScreen('form');});await snap('student-login');
   await page.evaluate(()=>{state.role='teacher';state.intent='register';showScreen('form');});await snap('teacher-register');
   await page.evaluate(()=>showScreen('student'));
   for(const view of ['home','path','logbook','avatar','progress']){await page.evaluate(view=>setStudentView(view),view);await snap(`student-${view}`);}
   await page.evaluate(()=>showScreen('teacher'));
   for(const view of inventory.teacher){await page.evaluate(view=>setTeacherView(view),view);await snap(`teacher-${view}`);}
   await page.evaluate(()=>showScreen('admin'));
   for(const view of inventory.admin){await page.evaluate(view=>setAdminView(view),view);await snap(`admin-${view}`);}
  }
  fs.writeFileSync(`${out}/audit.json`,JSON.stringify({inventory,checks,errors},null,2));
  console.log(JSON.stringify({views:checks.length,overflow:checks.filter(c=>c.overflow),broken:checks.filter(c=>c.broken.length),errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
