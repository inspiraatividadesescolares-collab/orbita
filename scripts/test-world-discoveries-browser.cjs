const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.ORBITA_PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.ORBITA_TEST_URL || 'http://localhost:8080';
const expectedPrices = {'planeta-aerivia':650,'rios-suspensos':350,aeriviano:450,'aeriviano-alegre':450,'aeriviano-com-medo':600,'aeriviano-zangado':500,'casa-em-aerivia':550,'correio-em-aerivia':400,'viagem-com-guarda-chuvas':400,'viagem-com-pipas':400,'aeriviana-correndo-atras-da-panela':350,'o-peso-da-vida':500};

async function login(page,name='Teste Aerívia') {
  await page.locator('[data-go="profiles"][data-intent="login"]').click();
  await page.locator('[data-role="student"]').click();
  await page.locator('#auth-form [name="name"]').fill(name);
  await page.locator('#auth-form [name="code"]').fill('AER-TESTE');
  await page.locator('#auth-form button[type="submit"]').click();
  await page.locator('[data-student-section="home"]').waitFor({state:'visible'});
}

async function openWorld(page,fromOrbit=false) {
  await page.evaluate(() => setStudentView('explore'));
  await page.locator(`${fromOrbit ? '[data-explore-scene]' : '[data-explore-destinations]'} [data-explore-body="aerivia"]`).click();
  assert.equal(await page.locator('[data-explore-dialog]').evaluate(dialog => dialog.open),true);
  assert.equal(await page.locator('[data-world-map-title]').textContent(),'Aerívia');
}

async function imageReady(page,selector) {
  await page.locator(selector).evaluateAll(images => Promise.all(images.map(image => image.decode())));
}

async function snapshot(page,name,fullPage=false) {
  if (!process.env.ORBITA_SCREENSHOTS) return;
  fs.mkdirSync(process.env.ORBITA_SCREENSHOTS,{recursive:true});
  await page.screenshot({path:path.join(process.env.ORBITA_SCREENSHOTS,`${name}.png`),fullPage});
}

async function verifyJournalSystem(page,unlockedPlanets) {
  const carouselOrder = await page.locator('[data-explore-destinations] [data-explore-body]').evaluateAll(buttons => buttons.map(button => button.dataset.exploreBody));
  const cards = await page.locator('[data-open-journal-world]').evaluateAll(buttons => buttons.map(button => ({
    id:button.dataset.openJournalWorld,
    unlocked:button.classList.contains('is-unlocked'),
    filter:getComputedStyle(button.querySelector('.world-journal-card__planet > img, .world-journal-card__planet > .explore-placeholder')).filter,
    disabled:button.disabled
  })));
  assert.equal(cards.length,10,'The journal contains the central star and the nine planets');
  assert.equal(cards[0].id,'aura-rubre','Aura Rubre appears first');
  assert.deepEqual(cards.map(card => card.id),carouselOrder,'Journal order matches the Explore carousel');
  for (const card of cards) {
    const unlocked = unlockedPlanets.includes(card.id);
    assert.equal(card.unlocked,unlocked,`${card.id}: unlock status belongs to the current student`);
    if (unlocked) assert.equal(card.filter,'none',`${card.id}: an unlocked world is in full color`);
    else assert.match(card.filter,/brightness/,`${card.id}: locked planets are shadowed`);
    assert.equal(card.disabled,!['aura-rubre','lamalume','planeta-42','mecano','aerivia'].includes(card.id),'Only destinations with available diary content can be opened');
  }
  assert.equal(await page.locator('[data-space-shop], [data-buy-space], .space-card').count(),0,'The old space-shop cards were removed');
}

async function closePage(page) {
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('[data-world-page-dialog]').evaluate(dialog => dialog.open),false);
}

async function verifyAccessGate(page,id,cost) {
  const before = await page.evaluate(() => ({stars:currentStudent.stars,coins:currentStudent.coins,xp:getJournalProgress().xp}));
  assert.equal(await page.evaluate(id => worldAccessDestinations.find(world => world.id === id).unlockStars,id),cost);
  assert.equal(await page.locator('[data-world-entry]').isVisible(),true);
  assert.equal(await page.locator('[data-world-map-grid]').isVisible(),false);
  assert.match(await page.locator('[data-world-entry-unlock]').textContent(),new RegExp(`${cost} estrelas`));
  await page.evaluate(stars => {currentStudent.stars=stars;renderStudentDashboard();},cost-1);
  assert.equal(await page.locator('[data-world-entry-unlock]').isDisabled(),true);
  assert.match(await page.locator('[data-world-entry-message]').textContent(),/Faltam 1 estrela/);
  assert.equal(await page.evaluate(id => unlockWorld(id).status,id),'insufficient');
  assert.equal(await page.evaluate(() => currentStudent.stars),cost-1,'An insufficient balance is not charged');
  if (id === 'aerivia') assert.equal(await page.evaluate(() => purchaseWorldDiscovery('aerivia-rios-suspensos').status),'world-locked','Aerivia discoveries require the star unlock first');
  await page.evaluate(stars => {currentStudent.stars=stars;renderStudentDashboard();},before.stars);
  for (const viewport of [{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
    await page.setViewportSize(viewport);
    await imageReady(page,'[data-world-entry-image]');
    const gate = await page.locator('[data-explore-dialog]').evaluate(dialog => ({overflow:dialog.scrollWidth>dialog.clientWidth+1,scrolls:dialog.scrollHeight>dialog.clientHeight+1,buttonHeight:dialog.querySelector('[data-world-entry-unlock]').getBoundingClientRect().height}));
    assert.equal(gate.overflow,false);
    assert.ok(gate.buttonHeight>=44);
    if (viewport.width>1000) assert.equal(gate.scrolls,false,'The unlock screen fits the laptop height');
    await snapshot(page,`${id}-acesso-${viewport.width}x${viewport.height}`);
  }
  await page.setViewportSize({width:1366,height:900});
  await page.locator('[data-world-entry-unlock]').evaluate(button => {button.click();button.click();});
  assert.equal(await page.evaluate(() => currentStudent.stars),before.stars-cost,'Duplicate clicks charge the access once');
  assert.equal(await page.evaluate(() => currentStudent.coins),before.coins,'Access does not spend coins');
  assert.equal(await page.evaluate(() => getJournalProgress().xp),before.xp,'Access alone does not complete a collection');
  assert.equal(await page.evaluate(id => unlockWorld(id).status,id),'owned');
  assert.equal(await page.evaluate(() => currentStudent.stars),before.stars-cost);
}

async function verifyIllustrations(page,viewport) {
  const panels = await page.locator('.world-card').evaluateAll(cards => cards.map(card => {
    const image=card.querySelector('.world-card__art > img'),caption=card.querySelector('.world-card__caption'),number=card.querySelector('.world-card__number');
    const bounds=image.getBoundingClientRect(),label=caption.getBoundingClientRect(),cardBounds=card.getBoundingClientRect(),numberBounds=number?.getBoundingClientRect(),artBounds=image.parentElement.getBoundingClientRect();
    return {id:card.dataset.worldDiscovery,width:bounds.width,height:bounds.height,
      number:number?.textContent,numberWidth:number?.getBoundingClientRect().width,top:cardBounds.top,left:cardBounds.left,
      numberInsideFrame:numberBounds && numberBounds.bottom <= artBounds.bottom + 1 && numberBounds.right <= artBounds.right + 1,
      originalRatio:image.naturalWidth / image.naturalHeight,fit:getComputedStyle(image).objectFit,
      labelVisible:getComputedStyle(caption).display !== 'none',labelTop:label.top,imageBottom:bounds.bottom};
  }));
  for (const panel of panels) {
    assert.equal(panel.number,String(Object.keys(expectedPrices).indexOf(panel.id.replace('aerivia-','')) + 1),`${panel.id}: number matches the supplied table`);
    assert.ok(panel.numberWidth > 0,`${panel.id}: numbering is visible`);
    assert.ok(panel.numberInsideFrame,`${panel.id}: the full number fits inside the frame`);
    assert.ok(Math.abs(panel.width / panel.height - panel.originalRatio) < .01,`${viewport.width}px: ${panel.id} keeps its complete composition`);
    assert.equal(panel.fit,'contain');
    if (panel.labelVisible) assert.ok(panel.labelTop >= panel.imageBottom - 1,`${panel.id}: caption does not cover the illustration`);
  }
  const readingOrder=panels.filter(panel => viewport.width <= 1000 || panel.id !== 'aerivia-planeta-aerivia').sort((a,b) => Math.abs(a.top - b.top) < 2 ? a.left - b.left : a.top - b.top);
  const expectedOrder=Object.keys(expectedPrices).filter(slug => viewport.width <= 1000 || slug !== 'planeta-aerivia');
  assert.deepEqual(readingOrder.map(panel => panel.id),expectedOrder.map(slug => `aerivia-${slug}`),'Numbered images read from the upper left in the supplied order');
  if (viewport.width > 1000) {
    const planet=panels.find(panel => panel.id === 'aerivia-planeta-aerivia');
    const resident=panels.find(panel => panel.id === 'aerivia-aeriviano');
    assert.ok(planet.width > resident.width * 1.8,'The planet is the large centerpiece');
    const layout=await page.locator('[data-explore-dialog]').evaluate(dialog => ({height:dialog.scrollHeight,visibleHeight:dialog.clientHeight,ratio:dialog.clientWidth / dialog.clientHeight}));
    assert.ok(layout.height <= layout.visibleHeight + 1,`${viewport.width}×${viewport.height}: the complete atlas fits without scrolling`);
    assert.ok(layout.ratio < 1.5,'The atlas has a more square silhouette');
    assert.ok(await page.locator('.world-card--planet .world-card__caption').evaluate(caption => caption.clientWidth) <= 300,'The central caption is compact');
  }
  assert.ok(panels.every(panel => panel.labelVisible),'The planet has the same visible caption as every other image');
  return panels;
}

async function verifyZoom(page,locked) {
  await page.setViewportSize({width:1366,height:768});
  await page.locator('.world-card--planet .world-card__art > img').hover();
  assert.equal(await page.locator('.world-image-zoom:popover-open').count(),0,'The central planet does not zoom');
  const cards=await page.locator('.world-card:not(.world-card--planet)').all();
  for (const card of cards) {
    const image=card.locator('.world-card__art > img');
    const original=await image.boundingBox();
    await image.hover();
    const zoom=page.locator('.world-image-zoom:popover-open');
    await zoom.waitFor({state:'visible'});
    const enlarged=await zoom.locator('img').boundingBox(),frame=await zoom.boundingBox();
    assert.ok(Math.abs(enlarged.width / original.width - 2.5) < .01,'Hover enlarges the complete image at exactly 2.5×');
    assert.ok(Math.abs(enlarged.height / original.height - 2.5) < .01);
    assert.ok(frame.x >= 0 && frame.y >= 0 && frame.x + frame.width <= 1366 && frame.y + frame.height <= 768,'Zoom stays inside the laptop screen');
    assert.equal(await zoom.evaluate(element => element.classList.contains('is-locked')),locked,'Zoom respects ownership');
    if (locked) assert.match(await zoom.locator('img').evaluate(image => getComputedStyle(image).filter),/blur/);
    if (!locked && await card.getAttribute('data-world-discovery') === 'aerivia-rios-suspensos') await snapshot(page,'aerivia-zoom-2');
    await page.mouse.move(0,0);
    assert.equal(await zoom.count(),0,'Leaving the image closes the preview');
  }
  await page.locator('.world-card__art').first().dispatchEvent('pointerover',{pointerType:'touch'});
  assert.equal(await page.locator('.world-image-zoom:popover-open').count(),0,'Touch does not trigger hover zoom');
}

async function verifyNewWorlds(page) {
  const costs = {lamalume:{stars:10,coins:[650,350,450,600,500,400,400,400,400,350,500,600]},'planeta-42':{stars:6,coins:[650,350,450,600,500,550,400,400,400,350,500,300]},mecano:{stars:6,coins:[650,350,450,600,500,550,400,400,400,350,500,300]}};
  const worlds = await page.evaluate(() => worldDiscoveries.filter(world => world.id !== 'aerivia').map(world => ({...world,items:worldJournalItems.filter(item => item.worldId === world.id)})));
  assert.equal(worlds.length,3);
  assert.equal(await page.evaluate(() => worldJournalItems.length),48);
  assert.match(worlds[0].items[3].curiosity,/Aura Rubre/);
  assert.doesNotMatch(worlds[0].items[3].curiosity,/três.*sóis/);
  assert.doesNotMatch(worlds[0].items[9].curiosity,/três.*sóis/);
  assert.equal(await page.evaluate(id => purchaseWorldDiscovery(id).status,worlds[0].items[0].id),'world-locked','Stars unlock the planet before any coin purchase');
  await page.evaluate(() => {currentStudent.coins=16500;currentStudent.stars=22;saveStudentWorkspace();renderStudentDashboard();});
  let xp=1;
  const opened=['aerivia'];
  for (const world of worlds) {
    assert.equal(world.unlockStars,costs[world.id].stars);
    assert.deepEqual(world.items.map(item => item.price),costs[world.id].coins,'Figurines use the supplied coin table');
    await page.evaluate(() => setStudentView('logbook'));
    await verifyJournalSystem(page,opened);
    await page.locator(`[data-open-journal-world="${world.id}"]`).click();
    assert.equal(await page.locator('[data-student-section="explore"]').isVisible(),true,'A locked diary planet opens its star unlock screen');
    assert.equal(await page.locator('[data-world-entry]').isVisible(),true);
    assert.equal(await page.locator('[data-world-map-grid]').isVisible(),false,'Figurines stay inaccessible until the planet is unlocked');
    for (const viewport of [{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      await imageReady(page,'[data-world-entry-image]');
      const gate=await page.locator('[data-explore-dialog]').evaluate(dialog => ({overflow:dialog.scrollWidth>dialog.clientWidth+1,scrolls:dialog.scrollHeight>dialog.clientHeight+1,buttonHeight:dialog.querySelector('[data-world-entry-unlock]').getBoundingClientRect().height}));
      assert.equal(gate.overflow,false,`${world.id}: star unlock fits at ${viewport.width}px`);
      assert.ok(gate.buttonHeight>=44);
      if (viewport.width>1000) assert.equal(gate.scrolls,false,'The star unlock fits the laptop height');
      await snapshot(page,`${world.id}-estrelas-${viewport.width}x${viewport.height}`);
    }
    await page.setViewportSize({width:1366,height:768});
    const stars=await page.evaluate(() => currentStudent.stars),coins=await page.evaluate(() => currentStudent.coins);
    await page.locator('[data-world-entry-unlock]').click();
    assert.equal(await page.evaluate(() => currentStudent.stars),stars-world.unlockStars);
    assert.equal(await page.evaluate(() => currentStudent.coins),coins,'Planet access spends stars, not coins');
    assert.equal(await page.evaluate(id => unlockWorld(id).status,world.id),'owned');
    assert.equal(await page.evaluate(() => currentStudent.stars),stars-world.unlockStars,'Planet access is charged only once');
    opened.push(world.id);
    await verifyJournalSystem(page,opened);
    assert.equal(await page.locator('.world-card').count(),12);
    await imageReady(page,'.world-card__art > img');
    assert.equal(await page.locator('.world-card--planet .world-card__art > img').getAttribute('src'),world.items[0].mapImage);
    assert.deepEqual(await page.locator('.world-card__caption strong').allTextContents(),world.items.map(item => item.title));
    for (const viewport of [{width:1366,height:768},{width:1280,height:720},{width:1024,height:600},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const layout=await page.locator('[data-explore-dialog]').evaluate(dialog => ({
        overflow:dialog.scrollWidth > dialog.clientWidth+1,scrolls:dialog.scrollHeight > dialog.clientHeight+1,
        cards:[...dialog.querySelectorAll('.world-card')].map(card => {
          const image=card.querySelector('.world-card__art > img'),label=card.querySelector('.world-card__caption'),badge=card.querySelector('.world-card__number');
          const art=image.parentElement.getBoundingClientRect(),bounds=image.getBoundingClientRect(),caption=label.getBoundingClientRect(),number=badge.getBoundingClientRect(),box=card.getBoundingClientRect();
          return {id:card.dataset.worldDiscovery,fit:getComputedStyle(image).objectFit,ratio:bounds.width/bounds.height,naturalRatio:image.naturalWidth/image.naturalHeight,
            badgeFits:number.right<=art.right+1 && number.bottom<=art.bottom+1,captionBelow:caption.top>=bounds.bottom-1,inside:art.top>=box.top-1 && caption.bottom<=box.bottom+1};
        })
      }));
      assert.equal(layout.overflow,false,`${world.id} at ${viewport.width}px: no horizontal overflow`);
      if (viewport.width>1000) assert.equal(layout.scrolls,false,`${world.id}: atlas fits the laptop height`);
      for (const card of layout.cards) {
        assert.equal(card.fit,'contain');
        assert.ok(Math.abs(card.ratio-card.naturalRatio)<.01,`${card.id}: the image keeps its full composition`);
        assert.ok(card.badgeFits,`${card.id}: the whole number fits`);
        assert.ok(card.captionBelow,`${card.id}: caption stays below the image`);
        if (viewport.width>1000) assert.ok(card.inside,`${card.id} at ${viewport.width}×${viewport.height}: art and long caption fit the card`);
      }
      assert.deepEqual(await page.locator('.world-card__number').allTextContents(),world.items.map((item,index) => String(index+1)));
      await snapshot(page,`${world.id}-bloqueado-${viewport.width}x${viewport.height}`);
    }
    await verifyZoom(page,true);
    for (const [index,item] of world.items.entries()) {
      const before=await page.evaluate(() => currentStudent.coins);
      await page.locator(`[data-world-discovery="${item.id}"]`).click();
      await page.locator('[data-world-page-unlock]').click();
      assert.equal(await page.evaluate(() => currentStudent.coins),before-item.price);
      assert.equal(await page.locator('[data-world-page-title]').textContent(),item.title);
      assert.equal(await page.locator('[data-world-page-copy]').textContent(),item.curiosity);
      assert.equal(await page.locator('[data-world-page-image]').getAttribute('src'),item.image);
      await imageReady(page,'[data-world-page-image]');
      assert.equal(await page.evaluate(id => purchaseWorldDiscovery(id).status,item.id),'owned');
      assert.equal(await page.evaluate(() => currentStudent.coins),before-item.price);
      assert.equal(await page.evaluate(() => getJournalProgress().xp),index===11 ? xp+1 : xp,'XP is awarded only for a complete planet diary');
      await closePage(page);
    }
    xp++;
    assert.equal(await page.evaluate(() => getJournalProgress().level),xp+1);
    await snapshot(page,`${world.id}-desbloqueado-desktop`);
    await page.keyboard.press('Escape');
    await page.evaluate(() => setStudentView('logbook'));
    await page.locator(`[data-open-journal-world="${world.id}"]`).click();
    assert.equal(await page.locator('[data-world-journal-detail-title]').textContent(),world.name);
    assert.equal(await page.locator('.world-journal-discovery.is-unlocked').count(),12);
    assert.deepEqual(await page.locator('.world-journal-discovery p').allTextContents(),world.items.map(item => item.curiosity));
    await page.locator('[data-world-journal-discovery]').evaluateAll(cards => cards.forEach(card => card.querySelector('img').loading='eager'));
    await imageReady(page,'.world-journal-discovery__image > img');
    await snapshot(page,`${world.id}-diario-desktop`,true);
    await page.setViewportSize({width:320,height:740});
    assert.equal(await page.locator('[data-world-journal-detail]').evaluate(detail => detail.scrollWidth>detail.clientWidth+1),false,'Long curiosities fit the mobile diary');
    assert.deepEqual(await page.locator('.world-journal-discovery__number').allTextContents(),world.items.map((item,index) => String(index+1)));
    await snapshot(page,`${world.id}-diario-celular`);
    await page.setViewportSize({width:1366,height:768});
    await page.locator('[data-world-journal-back]').click();
    assert.equal(await page.locator('[data-world-journal-xp]').textContent(),String(xp));
    await page.evaluate(() => setStudentView('explore'));
  }
  assert.equal(await page.evaluate(() => currentStudent.coins),0);
  assert.equal(await page.evaluate(() => currentStudent.stars),0);
  assert.equal(await page.evaluate(() => getJournalProgress().title),'Explorador de Planetas');
  await page.reload();
  await login(page,'Outro Explorador');
  assert.equal(await page.evaluate(() => getJournalProgress().xp),4,'XP survives reload and does not duplicate');
  await page.evaluate(() => setStudentView('explore'));
  await page.locator('[data-explore-destinations] [data-explore-body="mecano"]').click();
  assert.equal(await page.locator('[data-world-entry]').isVisible(),false,'Unlocked planet access survives reload with zero stars');
  assert.equal(await page.locator('.world-card.is-unlocked').count(),12);
  await page.keyboard.press('Escape');
  await page.evaluate(() => setStudentView('home'));
  await page.locator('[data-student-logout]').click();
  await login(page);
  await page.evaluate(() => setStudentView('logbook'));
  await verifyJournalSystem(page,['aerivia','aura-rubre']);
  assert.equal(await page.evaluate(() => getJournalProgress().xp),0,'Star unlocks and XP are isolated by student');
}

async function main() {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  try {
    const context = await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'});
    const page = await context.newPage(),errors=[];
    page.setDefaultTimeout(10000);
    page.on('pageerror',error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('orbita-sound-enabled','false'));
    await page.goto(url);
    await page.evaluate(() => localStorage.setItem('orbita-teacher-data:teste-aerivia',JSON.stringify({
      classes:[{id:1,name:'Turma de teste',grade:3,code:'AER-TESTE'}],
      students:[{id:1,name:'Teste Aerívia',classId:1,track:3,coins:350,stars:23,progress:0,journal:['terra'],additionPuzzleVersion:1,lastDailyReward:localDateKey()},
        {id:2,name:'Outro Explorador',classId:1,track:3,coins:5600,stars:13,progress:0,journal:[],additionPuzzleVersion:1,lastDailyReward:localDateKey()}]
    })));
    await login(page);
    const items = await page.evaluate(() => worldJournalItems.filter(item => item.worldId === 'aerivia').map(item => ({id:item.id,slug:item.slug,price:item.price,curiosity:item.curiosity})));
    assert.equal(items.length,12);
    assert.deepEqual(Object.fromEntries(items.map(item => [item.slug,item.price])),expectedPrices,'Use the supplied prices, including the clarified resident price');
    assert.equal(await page.locator('[data-explore-scene] [data-explore-body="aerivia"]').getAttribute('data-orbit'),'9');
    await openWorld(page,true);
    await verifyAccessGate(page,'aerivia',8);
    assert.equal(await page.locator('.world-card.is-locked').count(),12);
    await imageReady(page,'.world-card__art > img');
    assert.equal(await page.locator('.world-card--planet .world-card__art > img').getAttribute('src'),'assets/imagens/mundos/aura-rubre/aerivia.png');
    assert.equal(await page.locator('.world-card--chase .world-card__caption strong').textContent(),'Aeriviana fazendo o jantar');
    await page.evaluate(() => document.fonts.ready);
    for (const viewport of [{width:1366,height:900},{width:1366,height:768},{width:1366,height:650},{width:1280,height:720},{width:1024,height:600},{width:768,height:1024},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      const layout = await page.locator('[data-explore-dialog]').evaluate(dialog => ({horizontalOverflow:dialog.scrollWidth > dialog.clientWidth + 1,
        smallButtons:[...dialog.querySelectorAll('button')].filter(button => !button.closest('[hidden]')).filter(button => {const rect=button.getBoundingClientRect();return rect.width < 44 || rect.height < 44;}).length,
        broken:[...dialog.querySelectorAll('.world-card img')].some(image => !image.naturalWidth),
        blurred:[...dialog.querySelectorAll('.world-card.is-locked .world-card__art > img')].every(image => getComputedStyle(image).filter.includes('blur'))}));
      assert.equal(layout.horizontalOverflow,false,`${viewport.width}px: infographic fits`);
      assert.equal(layout.smallButtons,0,`${viewport.width}px: controls are usable with touch`);
      assert.equal(layout.broken,false);
      assert.equal(layout.blurred,true);
      await verifyIllustrations(page,viewport);
      await page.locator('[data-explore-dialog]').evaluate(dialog => dialog.scrollTop=0);
      await snapshot(page,`aerivia-bloqueada-${viewport.width}x${viewport.height}`);
    }
    await verifyZoom(page,true);
    assert.equal(await page.evaluate(() => currentStudent.coins),350,'Hover does not charge for a discovery');
    await page.setViewportSize({width:1366,height:900});
    await page.locator('[data-world-discovery="aerivia-planeta-aerivia"]').click();
    assert.equal(await page.locator('[data-world-page-unlock]').isDisabled(),true);
    assert.match(await page.locator('[data-world-page-message]').textContent(),/Faltam 300 moedas/);
    assert.equal(await page.evaluate(() => purchaseWorldDiscovery('aerivia-planeta-aerivia').status),'insufficient');
    assert.equal(await page.evaluate(() => currentStudent.coins),350);
    assert.equal(await page.locator('[data-world-page-copy]').textContent().then(text => text.includes('nenhum elemento sólido')),false,'Curiosity is revealed after unlocking');
    await closePage(page);
    assert.equal(await page.locator('[data-world-discovery="aerivia-planeta-aerivia"]').evaluate(button => document.activeElement === button),true);

    await page.locator('[data-world-discovery="aerivia-rios-suspensos"]').click();
    // Simulate rapid duplicate submissions: only one purchase may be charged.
    await page.locator('[data-world-page-unlock]').evaluate(button => {button.click();button.click();});
    assert.equal(await page.evaluate(() => currentStudent.coins),0);
    assert.equal(await page.evaluate(() => currentStudent.journal.filter(id => id === 'aerivia-rios-suspensos').length),1);
    assert.equal(await page.locator('[data-world-page-copy]').textContent(),items.find(item => item.slug === 'rios-suspensos').curiosity);
    assert.equal(await page.locator('[data-world-page-purchase]').isVisible(),false);
    assert.equal(await page.locator('[data-world-page-image]').evaluate(image => getComputedStyle(image).filter),'none');
    await imageReady(page,'[data-world-page-image]');
    await snapshot(page,'diario-rios-suspensos-desktop');
    await page.setViewportSize({width:375,height:812});
    assert.equal(await page.locator('[data-world-page-dialog]').evaluate(dialog => dialog.scrollWidth > dialog.clientWidth + 1),false);
    const positions = await page.evaluate(() => ({image:document.querySelector('[data-world-page-image]').getBoundingClientRect().bottom,copy:document.querySelector('[data-world-page-copy]').getBoundingClientRect().top}));
    assert.ok(positions.copy >= positions.image,'Curiosity appears below the enlarged image');
    await snapshot(page,'diario-rios-suspensos-celular');
    await closePage(page);
    assert.equal(await page.locator('.world-card.is-unlocked').count(),1);
    await page.locator('[data-world-discovery="aerivia-rios-suspensos"]').click();
    assert.equal(await page.evaluate(() => currentStudent.coins),0,'Reopening is free');
    await closePage(page);
    await page.keyboard.press('Escape');
    await page.evaluate(() => setStudentView('logbook'));
    assert.equal(await page.locator('[data-world-journal-empty]').isVisible(),false);
    assert.equal(await page.locator('[data-journal-count]').textContent(),'1','The journal counts the discoveries in the displayed worlds');
    assert.ok(await page.evaluate(() => currentStudent.journal.includes('terra')),'Removing the old cards preserves past purchases');
    await verifyJournalSystem(page,['aerivia']);
    assert.equal(await page.locator('[data-world-journal-overview] [data-open-world-page]').count(),0,'The overview contains planets, not individual figurines');
    assert.match(await page.locator('[data-open-journal-world="aerivia"]').textContent(),/1 de 12 curiosidades desbloqueadas/);
    for (const viewport of [{width:1366,height:900},{width:768,height:1024},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      await imageReady(page,'.world-journal-card__planet img');
      const bounds = await page.locator('[data-world-journal-gallery]').evaluate(gallery => ({
        overflow:gallery.scrollWidth > gallery.clientWidth + 1,
        order:[...gallery.querySelectorAll('[data-open-journal-world]')].map(button => ({id:button.dataset.openJournalWorld,rect:button.getBoundingClientRect()})).sort((a,b) => Math.abs(a.rect.top - b.rect.top) < 2 ? a.rect.left - b.rect.left : a.rect.top - b.rect.top).map(card => card.id)
      }));
      assert.equal(bounds.overflow,false,`${viewport.width}px: system cards fit horizontally`);
      assert.deepEqual(bounds.order,await page.locator('[data-explore-destinations] [data-explore-body]').evaluateAll(buttons => buttons.map(button => button.dataset.exploreBody)),'Visual order follows the carousel on laptop and mobile');
      await snapshot(page,`diario-sistema-${viewport.width}x${viewport.height}`,viewport.width > 1000);
    }
    await page.setViewportSize({width:1366,height:900});
    await page.locator('[data-open-journal-world="aura-rubre"]').click();
    assert.equal(await page.locator('[data-student-section="explore"]').isVisible(),true,'A locked diary star opens its unlock screen');
    await verifyAccessGate(page,'aura-rubre',15);
    assert.equal(await page.locator('[data-explore-detail-title]').isVisible(),true,'The star description appears after its unlock');
    assert.equal(await page.locator('[data-explore-detail-title]').textContent(),'Aura Rubre');
    assert.match(await page.locator('[data-explore-detail-copy]').textContent(),/Nove planetas/);
    await page.keyboard.press('Escape');
    await page.evaluate(() => setStudentView('logbook'));
    await verifyJournalSystem(page,['aerivia','aura-rubre']);
    await page.locator('[data-open-journal-world="aura-rubre"]').click();
    assert.equal(await page.locator('[data-world-journal-detail-title]').textContent(),'Aura Rubre');
    assert.equal(await page.locator('[data-world-journal-star]').isVisible(),true);
    assert.equal(await page.locator('[data-world-journal-discoveries]').isVisible(),false);
    assert.match(await page.locator('[data-world-journal-star-copy]').textContent(),/Nove planetas/);
    await page.locator('[data-world-journal-back]').click();
    assert.equal(await page.locator('[data-open-journal-world="aura-rubre"]').evaluate(button => document.activeElement === button),true);
    await page.locator('[data-open-journal-world="aerivia"]').click();
    assert.equal(await page.locator('[data-world-journal-overview]').isVisible(),false);
    assert.equal(await page.locator('[data-world-journal-detail-title]').textContent(),'Aerívia');
    assert.ok(await page.locator('[data-world-journal-back]').evaluate(button => button.getBoundingClientRect().top >= document.querySelector('.student-header').getBoundingClientRect().bottom),'The back button stays below the fixed student header');
    assert.equal(await page.locator('[data-world-journal-discovery]').count(),12,'Opening a planet shows all twelve discovery cards');
    assert.equal(await page.locator('.world-journal-discovery.is-unlocked').count(),1);
    assert.equal(await page.locator('.world-journal-discovery.is-locked').count(),11);
    assert.deepEqual(await page.locator('[data-world-journal-discovery]').evaluateAll(cards => cards.map(card => card.dataset.worldJournalDiscovery)),items.map(item => item.id));
    assert.deepEqual(await page.locator('.world-journal-discovery__number').allTextContents(),items.map((item,index) => String(index+1)));
    assert.equal(await page.locator('[data-world-journal-discovery="aerivia-rios-suspensos"] p').textContent(),items.find(item => item.slug === 'rios-suspensos').curiosity);
    assert.equal(await page.locator('[data-world-journal-discovery="aerivia-planeta-aerivia"] p').textContent().then(text => text.includes('nenhum elemento sólido')),false,'The journal does not reveal a locked curiosity');
    for (const viewport of [{width:1366,height:900},{width:768,height:1024},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      await page.locator('[data-world-journal-discovery]').evaluateAll(cards => cards.forEach(card => card.querySelector('img').loading = 'eager'));
      await imageReady(page,'.world-journal-discovery__image > img');
      const layout = await page.locator('[data-world-journal-detail]').evaluate(detail => ({
        overflow:detail.scrollWidth > detail.clientWidth + 1,
        columns:getComputedStyle(detail.querySelector('[data-world-journal-discoveries]')).gridTemplateColumns.split(' ').length,
        cards:[...detail.querySelectorAll('[data-world-journal-discovery]')].map(card => ({
          fit:getComputedStyle(card.querySelector('img')).objectFit,
          blurred:getComputedStyle(card.querySelector('img')).filter.includes('blur'),
          locked:card.classList.contains('is-locked'),
          buttonHeight:card.querySelector('button').getBoundingClientRect().height
        }))
      }));
      assert.equal(layout.overflow,false,`${viewport.width}px: planet details fit horizontally`);
      assert.equal(layout.columns,viewport.width <= 650 ? 1 : viewport.width <= 1000 ? 2 : 3);
      assert.ok(layout.cards.every(card => card.fit === 'contain' && card.blurred === card.locked && card.buttonHeight >= 44));
      await snapshot(page,`diario-aerivia-${viewport.width}x${viewport.height}`);
    }
    await page.locator('[data-open-world-page="aerivia-planeta-aerivia"]').click();
    assert.equal(await page.locator('[data-world-page-unlock]').isDisabled(),true,'Locked discoveries retain the wallet requirement in the journal');
    await closePage(page);
    await page.waitForFunction(() => document.activeElement?.dataset.openWorldPage === 'aerivia-planeta-aerivia');
    await page.locator('[data-open-world-page="aerivia-rios-suspensos"]').click();
    assert.equal(await page.locator('[data-world-page-dialog]').evaluate(dialog => dialog.open),true);
    assert.equal(await page.locator('[data-world-page-return]').textContent(),'Voltar às descobertas de Aerívia');
    assert.equal(await page.evaluate(() => currentStudent.coins),0,'Reading an owned journal card is free');
    await closePage(page);
    await page.waitForFunction(() => document.activeElement?.dataset.openWorldPage === 'aerivia-rios-suspensos');
    await page.locator('[data-world-journal-back]').click();
    assert.equal(await page.locator('[data-world-journal-detail]').isVisible(),false);
    assert.equal(await page.locator('[data-world-journal-overview]').isVisible(),true);
    assert.equal(await page.locator('[data-open-journal-world="aerivia"]').evaluate(button => document.activeElement === button),true,'Back restores focus to the planet');
    await page.locator('[data-open-journal-world="aerivia"]').click();
    await page.evaluate(() => setStudentView('home'));
    await page.evaluate(() => setStudentView('logbook'));
    assert.equal(await page.locator('[data-world-journal-overview]').isVisible(),true,'Returning to the journal opens the planet list');

    await page.reload();
    await login(page);
    assert.equal(await page.evaluate(() => currentStudent.coins),0);
    assert.equal(await page.evaluate(() => currentStudent.stars),0);
    assert.ok(await page.evaluate(() => isWorldUnlocked(systemStar)),'Star access persists after reload');
    assert.equal(await page.evaluate(() => unlockWorld('aura-rubre').status),'owned');
    assert.ok(await page.evaluate(() => currentStudent.journal.includes('aerivia-rios-suspensos')),'Ownership survives reload and login');
    await openWorld(page);
    assert.equal(await page.locator('.world-card.is-unlocked').count(),1);
    await page.keyboard.press('Escape');
    await page.evaluate(() => setStudentView('home'));
    await page.setViewportSize({width:1366,height:900});
    await page.locator('[data-student-logout]').click();
    await login(page,'Outro Explorador');
    assert.equal(await page.locator('[data-world-journal-empty]').isVisible(),false,'Logbook is hidden on home');
    await page.evaluate(() => setStudentView('logbook'));
    await verifyJournalSystem(page,[]);
    await snapshot(page,'diario-sistema-bloqueado-desktop',true);
    await page.locator('[data-open-journal-world="aerivia"]').click();
    await verifyAccessGate(page,'aerivia',8);
    await page.keyboard.press('Escape');
    await page.evaluate(() => setStudentView('logbook'));
    await page.locator('[data-open-journal-world="aerivia"]').click();
    assert.equal(await page.locator('.world-journal-discovery.is-locked').count(),12,'Purchases belong only to the student who paid');
    for (const item of items) {
      const before = await page.evaluate(() => currentStudent.coins);
      await page.locator(`[data-open-world-page="${item.id}"]`).click();
      await page.locator('[data-world-page-unlock]').click();
      assert.equal(await page.evaluate(() => currentStudent.coins),before - item.price);
      assert.equal(await page.locator('[data-world-page-copy]').textContent(),item.curiosity);
      assert.equal(await page.locator('[data-world-page-unlock]').isVisible(),false);
      assert.equal(await page.locator(`[data-world-journal-discovery="${item.id}"] p`).textContent(),item.curiosity,'Buying a discovery updates its card immediately');
      await verifyJournalSystem(page,['aerivia']);
      await imageReady(page,'[data-world-page-image]');
      await closePage(page);
    }
    assert.equal(await page.evaluate(() => currentStudent.coins),0);
    assert.equal(await page.locator('.world-journal-discovery.is-unlocked').count(),12);
    assert.match(await page.locator('[data-world-journal-progress]').textContent(),/^12 de 12 curiosidades desbloqueadas.*\+1 XP/);
    assert.deepEqual(await page.evaluate(() => getJournalProgress()),{xp:1,level:2,title:'Aprendiz Espacial',completedWorldIds:['aerivia']});
    await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
    await page.locator('[data-world-journal-discovery]').evaluateAll(cards => cards.forEach(card => card.querySelector('img').loading = 'eager'));
    await imageReady(page,'.world-journal-discovery__image > img');
    await snapshot(page,'diario-aerivia-completo-desktop');
    await openWorld(page);
    assert.equal(await page.locator('.world-card.is-unlocked').count(),12);
    assert.equal(await page.locator('[data-world-map-progress]').textContent(),'12 de 12 descobertas');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem(state.studentStorageKey)).students);
    assert.equal(saved[0].journal.length,2);
    assert.equal(saved[1].journal.length,12);
    for (const viewport of [{width:1600,height:1600},{width:1366,height:768},{width:1366,height:650},{width:1280,height:720},{width:1024,height:600},{width:768,height:1024},{width:375,height:812},{width:320,height:740}]) {
      await page.setViewportSize(viewport);
      await imageReady(page,'.world-card__art > img');
      await verifyIllustrations(page,viewport);
      assert.equal(await page.locator('[data-explore-dialog]').evaluate(dialog => dialog.scrollWidth > dialog.clientWidth + 1),false);
      await page.locator('[data-explore-dialog]').evaluate(dialog => dialog.scrollTop=0);
      await snapshot(page,`aerivia-desbloqueada-${viewport.width}x${viewport.height}`);
    }
    await verifyZoom(page,false);
    await page.setViewportSize({width:1366,height:900});
    await page.keyboard.press('Escape');
    await page.locator('[data-explore-destinations] [data-explore-body="mecano"]').click();
    assert.equal(await page.locator('[data-world-infographic]').isVisible(),true);
    assert.equal(await page.locator('[data-world-map-title]').textContent(),'Mecano');
    assert.equal(await page.locator('[data-world-entry]').isVisible(),true);
    assert.equal(await page.locator('[data-world-entry-unlock]').isDisabled(),true);
    assert.match(await page.locator('[data-world-entry-message]').textContent(),/Faltam 1 estrela/);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.body.classList.contains('world-modal-open'));
    await verifyNewWorlds(page);
    assert.deepEqual(errors,[]);
    console.log('Aura Rubre (15 estrelas), Aerívia (8 estrelas), quatro planetas e 48 figurinhas: saldo insuficiente, cobrança única, imagens, infográficos no laptop/celular, moedas, XP, persistência e isolamento por estudante aprovados.');
  } finally {await browser.close();}
}
main().catch(error => {console.error(error);process.exitCode=1;});
