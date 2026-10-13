/* Aura Rubre: add an image and a name to any pending destination below. */
(() => {
  'use strict';

  const section = document.querySelector('[data-student-section="explore"]');
  if (!section) return;
  const screen = section.closest('[data-screen]');
  const scene = section.querySelector('[data-explore-scene]');
  const bodies = section.querySelector('[data-explore-bodies]');
  const destinations = section.querySelector('[data-explore-destinations]');
  const motionButton = section.querySelector('[data-explore-motion]');
  const dialog = section.querySelector('[data-explore-dialog]');
  const pageDialog = document.querySelector('[data-world-page-dialog]');
  const logbook = document.querySelector('[data-student-section="logbook"]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const assetRoot = 'assets/imagens/mundos/aura-rubre/';
  const star = systemStar;

  // Sizes follow the reference: star > outer giants > 42 > Aerívia/Mecano > Lamalume > inner planet.
  // Each planet has its own ellipse, initial position and loop duration in seconds.
  const planets = [
    {id: 'planeta-1', name: 'Planeta 1', image: null, size: 1.9, phase: 15, duration: 65, color: 'ember'},
    {id: 'lamalume', name: 'Lamalume', image: 'lamalume.png', size: 2.7, phase: -26, duration: 78},
    {id: 'planeta-42', name: '42', image: 'planeta-42.png', size: 5.5, phase: -162, duration: 92},
    {id: 'planeta-4', name: 'Planeta 4', image: null, size: 5.8, phase: 150, duration: 108, color: 'ice'},
    {id: 'planeta-5', name: 'Planeta 5', image: null, size: 4.7, phase: 22, duration: 124, color: 'forest'},
    {id: 'planeta-6', name: 'Planeta 6', image: null, size: 4.5, phase: -34, duration: 140, color: 'coral'},
    {id: 'planeta-7', name: 'Planeta 7', image: null, size: 6.4, phase: -162, duration: 158, color: 'violet'},
    {id: 'mecano', name: 'Mecano', image: 'mecano.png', size: 4.2, phase: 18, duration: 176},
    {id: 'aerivia', name: 'Aerívia', image: 'aerivia.png', size: 4, phase: 156, duration: 196}
  ];
  const systemBodies = [star, ...planets];

  let paused = reducedMotion.matches;
  let hovered = false;
  let focused = false;
  let frame = null;
  let previousTime = null;
  let elapsed = 0;
  let sceneWidth = 0;
  let sceneHeight = 0;
  let returnFocus = null;
  let activeWorld = null;
  let pageItemId = '';
  let pageSource = 'map';
  let pageReturnFocus = null;
  let journalWorldId = '';
  let journalStudent = null;
  const lockArtwork = '<svg viewBox="0 0 48 58" aria-hidden="true"><path d="M12 26V17a12 12 0 0 1 24 0v9" fill="none" stroke="#6a3b0b" stroke-width="10"/><path d="M12 26V17a12 12 0 0 1 24 0v9" fill="none" stroke="#ffde68" stroke-width="6"/><rect x="5" y="24" width="38" height="30" rx="6" fill="#ffc43c" stroke="#7c470b" stroke-width="2"/><rect x="8" y="27" width="32" height="24" rx="4" fill="#ffda65" stroke="#fff3bb" stroke-width="2"/><path d="M24 33a4 4 0 0 0-2 7l-1 6h6l-1-6a4 4 0 0 0-2-7" fill="#704108"/></svg>';
  pageDialog.querySelector('[data-world-page-lock]').innerHTML = lockArtwork;

  const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');
  const zoomPreview = document.createElement('div');
  zoomPreview.className = 'world-image-zoom';
  zoomPreview.setAttribute('popover','manual');
  zoomPreview.setAttribute('aria-hidden','true');
  zoomPreview.hidden = true;
  zoomPreview.innerHTML = `<img alt="" draggable="false" /><span class="world-image-zoom__lock">${lockArtwork}</span>`;
  dialog.append(zoomPreview);
  const zoomImage = zoomPreview.querySelector('img');
  let zoomSource = null;

  function hideWorldZoom() {
    if (zoomPreview.matches(':popover-open')) zoomPreview.hidePopover();
    zoomPreview.hidden = true;
    zoomSource = null;
  }

  function showWorldZoom(event) {
    if (event.pointerType !== 'mouse' || !hoverPointer.matches || pageDialog.open) return;
    const art = event.target.closest('.world-card__art');
    if (!art) { hideWorldZoom(); return; }
    if (art.closest('.world-card--planet')) { hideWorldZoom(); return; }
    const image = art.querySelector('img');
    const bounds = image.getBoundingClientRect();
    if (!bounds.width || !bounds.height || !image.complete) return;
    const width = bounds.width * 2.5, height = bounds.height * 2.5;
    const frameWidth = Math.min(width,innerWidth - 28), frameHeight = Math.min(height,innerHeight - 28);
    const clamp = (value,min,max) => Math.min(max,Math.max(min,value));
    const left = clamp(bounds.left + bounds.width / 2 - frameWidth / 2 - 2,12,innerWidth - frameWidth - 16);
    const top = clamp(bounds.top + bounds.height / 2 - frameHeight / 2 - 2,12,innerHeight - frameHeight - 16);
    // Large images retain the same 2.5× scale; the mouse pans their visible area.
    const x = clamp((event.clientX - bounds.left) / bounds.width,0,1);
    const y = clamp((event.clientY - bounds.top) / bounds.height,0,1);
    Object.assign(zoomPreview.style,{left:`${left}px`,top:`${top}px`,width:`${frameWidth + 4}px`,height:`${frameHeight + 4}px`});
    Object.assign(zoomImage.style,{width:`${width}px`,height:`${height}px`,left:`${(frameWidth - width) * x}px`,top:`${(frameHeight - height) * y}px`});
    if (zoomSource !== art) {
      zoomSource = art;
      zoomImage.src = image.src;
      zoomPreview.classList.toggle('is-locked',art.closest('.world-card').classList.contains('is-locked'));
    }
    zoomPreview.hidden = false;
    if (!zoomPreview.matches(':popover-open')) zoomPreview.showPopover();
  }

  const worldGrid = section.querySelector('[data-world-map-grid]');
  worldGrid.addEventListener('pointerover',showWorldZoom);
  worldGrid.addEventListener('pointermove',showWorldZoom);
  worldGrid.addEventListener('pointerout',event => {
    if (zoomSource && !zoomSource.contains(event.relatedTarget)) hideWorldZoom();
  });
  worldGrid.addEventListener('pointerleave',hideWorldZoom);
  worldGrid.addEventListener('pointerdown',hideWorldZoom);
  window.addEventListener('resize',hideWorldZoom);
  window.addEventListener('resize',fitWorldCaptions);
  window.addEventListener('blur',hideWorldZoom);
  document.fonts.ready.then(fitWorldCaptions);

  function owns(item) {
    return Boolean(currentStudent?.journal.includes(item.id));
  }

  function renderWorldMap() {
    if (!activeWorld || !currentStudent) return;
    hideWorldZoom();
    const items = worldJournalItems.filter(item => item.worldId === activeWorld.id);
    const unlockedCount = items.filter(owns).length;
    const unlocked = isWorldUnlocked(activeWorld);
    const isStar = activeWorld.id === star.id;
    const showAtlas = !isStar || !unlocked;
    dialog.classList.toggle('explore-dialog--world',showAtlas);
    section.querySelector('[data-world-infographic]').hidden = !showAtlas;
    section.querySelector('[data-explore-detail-art]').hidden = showAtlas;
    section.querySelector('.explore-dialog__copy').hidden = showAtlas;
    dialog.setAttribute('aria-labelledby',showAtlas ? 'world-map-title' : 'explore-detail-title');
    dialog.setAttribute('aria-describedby',showAtlas ? 'world-map-instructions' : 'explore-detail-copy');
    dialog.dataset.worldId = activeWorld.id;
    dialog.classList.toggle('world-atlas--long-captions',!isStar && activeWorld.id !== 'aerivia');
    if (!showAtlas) {
      worldGrid.innerHTML = '';
      return;
    }
    section.querySelector('[data-world-map-kicker]').textContent = isStar ? 'AURA RUBRE · ESTRELA CENTRAL' : `${activeWorld.system.toUpperCase()} · PLANETA ${String(activeWorld.planetNumber).padStart(2,'0')}`;
    section.querySelector('[data-world-map-title]').textContent = activeWorld.name;
    section.querySelector('[data-world-map-coins]').textContent = currentStudent.coins;
    section.querySelector('[data-world-map-progress]').textContent = `${unlockedCount} de ${items.length} descobertas`;
    section.querySelector('.world-map-wallet').hidden = isStar;
    section.querySelector('[data-world-entry]').hidden = unlocked;
    worldGrid.hidden = !unlocked;
    section.querySelector('[data-world-map-footer-note]').textContent = isStar ? 'O acesso à estrela fica guardado no seu diário de bordo.' : 'Complete as 12 descobertas deste planeta para ganhar 1 XP no diário.';
    if (!unlocked) {
      worldGrid.innerHTML = '';
      const body = systemBodies.find(body => body.id === activeWorld.id);
      const missing = Math.max(0,activeWorld.unlockStars - currentStudent.stars);
      section.querySelector('#world-map-instructions').textContent = `Desbloqueie ${activeWorld.name} por ${activeWorld.unlockStars} estrelas.`;
      section.querySelector('[data-world-entry-image]').src = `${assetRoot}${body.image}`;
      section.querySelector('[data-world-entry-title]').textContent = isStar ? 'Uma estrela para descobrir' : 'Um novo mundo para descobrir';
      section.querySelector('[data-world-entry-copy]').textContent = isStar ? 'Desbloqueie Aura Rubre uma única vez com estrelas para conhecê-la e guardar seu acesso no diário de bordo.' : 'Desbloqueie este planeta uma única vez com estrelas. Depois, colecione suas 12 figurinhas com moedas.';
      section.querySelector('[data-world-entry-balance]').textContent = `Você tem ${currentStudent.stars} estrelas.`;
      const button = section.querySelector('[data-world-entry-unlock]');
      button.textContent = `★ Desbloquear por ${activeWorld.unlockStars} estrelas`;
      button.disabled = missing > 0;
      section.querySelector('[data-world-entry-message]').textContent = missing ? `Faltam ${missing} estrela${missing === 1 ? '' : 's'}. Continue os desafios para ganhar mais.` : isStar ? 'O acesso à estrela será seu para sempre.' : 'O acesso será seu para sempre. As figurinhas são compradas separadamente com moedas.';
      return;
    }
    section.querySelector('#world-map-instructions').textContent = unlockedCount === items.length
      ? 'Toque em uma imagem para abrir sua página no diário de bordo.'
      : 'Desbloqueie as figurinhas com moedas e leia suas histórias no diário de bordo.';
    section.querySelector('[data-world-map-grid]').innerHTML = items.map((item,index) => {
      const unlocked = owns(item);
      const number = index + 1;
      const label = unlocked ? `Ler ${item.title} no diário de bordo` : `Desbloquear ${item.title} por ${item.price} moedas`;
      return `<button type="button" class="world-card world-card--${item.slot} ${unlocked ? 'is-unlocked' : 'is-locked'}" style="--world-card-area:${item.slot}" data-world-discovery="${item.id}" aria-haspopup="dialog" aria-label="${escapeHTML(`Figurinha ${number} de ${items.length}: ${label}`)}"><span class="world-card__art"><span class="world-card__number" aria-hidden="true">${number}</span><img src="${item.mapImage || item.image}" alt="" draggable="false" />${unlocked ? '' : `<span class="world-card__lock">${lockArtwork}</span>`}</span><span class="world-card__caption"><strong>${escapeHTML(item.mapTitle || item.title)}</strong>${unlocked ? '' : `<span><img src="assets/imagens/design/moeda.png" alt="" /> ${item.price} moedas</span>`}</span></button>`;
    }).join('');
    fitWorldCaptions();
  }

  function fitWorldCaptions() {
    if (!dialog.open || !dialog.classList.contains('world-atlas--long-captions') || worldGrid.hidden) return;
    worldGrid.querySelectorAll('.world-card:not(.world-card--planet)').forEach(card => {
      card.style.setProperty('--caption-room',`${Math.ceil(card.querySelector('.world-card__caption').getBoundingClientRect().height)}px`);
    });
  }

  function renderWorldJournal() {
    if (journalStudent !== currentStudent || logbook.hidden || screen.hidden) journalWorldId = '';
    journalStudent = currentStudent;
    const gallery = logbook.querySelector('[data-world-journal-gallery]');
    const journalBodies = currentStudent ? systemBodies : [];
    const discoveryCount = currentStudent ? worldJournalItems.filter(owns).length : 0;
    const journalProgress = getJournalProgress();
    logbook.querySelector('[data-world-journal-level]').textContent = `NÍVEL ${journalProgress.level}`;
    logbook.querySelector('[data-world-journal-rank]').textContent = journalProgress.title;
    logbook.querySelector('[data-world-journal-xp]').textContent = journalProgress.xp;
    logbook.querySelector('[data-journal-count]').textContent = discoveryCount;
    logbook.querySelector('.collection-count > span').textContent = discoveryCount === 1 ? 'descoberta' : 'descobertas';
    gallery.hidden = !journalBodies.length;
    logbook.querySelector('[data-world-journal-empty]').hidden = Boolean(journalBodies.length);
    gallery.innerHTML = journalBodies.map((body,index) => {
      const isStar = body.id === star.id;
      const items = worldJournalItems.filter(item => item.worldId === body.id);
      const world = worldAccessDestinations.find(entry => entry.id === body.id);
      const count = items.filter(owns).length;
      const completed = journalProgress.completedWorldIds.includes(body.id);
      const unlocked = count > 0 || Boolean(world && isWorldUnlocked(world));
      const available = isStar || items.length > 0;
      const status = !unlocked && world?.unlockStars ? `${isStar ? 'Estrela bloqueada' : 'Planeta bloqueado'} · ${world.unlockStars} estrelas` : isStar ? 'A estrela central dos nove planetas' : items.length ? count === items.length ? 'Diário completo · +1 XP' : `${count} de ${items.length} curiosidades desbloqueadas` : 'Planeta bloqueado · Em breve';
      return `<button class="world-journal-card ${unlocked ? 'is-unlocked' : 'is-locked'}" type="button" data-open-journal-world="${body.id}" ${available ? '' : 'disabled'} aria-label="${escapeHTML(`${body.name}: ${completed ? 'Mundo conquistado. ' : ''}${unlocked ? '' : isStar ? 'bloqueada. ' : 'bloqueado. '}${status}`)}"><span class="world-journal-card__planet">${artwork(body)}${completed ? '<span class="world-journal-card__seal" aria-hidden="true"><img src="assets/imagens/mundos/selo-mundo-conquistado.png" alt="" /></span>' : ''}${unlocked ? '' : `<span class="world-journal-card__lock" aria-hidden="true">${lockArtwork}</span>`}</span><span class="world-journal-card__copy"><small>AURA RUBRE · ${isStar ? 'ESTRELA CENTRAL' : `PLANETA ${String(index).padStart(2,'0')}`}</small><strong>${escapeHTML(body.name)}</strong><span>${escapeHTML(status)}</span>${items.length ? `<progress value="${count}" max="${items.length}" aria-label="Descobertas de ${escapeHTML(body.name)}"></progress>` : ''}<b>${available ? !unlocked && world?.unlockStars ? isStar ? 'Desbloquear estrela' : 'Desbloquear planeta' : isStar ? 'Conhecer estrela' : 'Abrir planeta' : 'Em breve'} ${available ? '<span aria-hidden="true">→</span>' : ''}</b></span></button>`;
    }).join('');
    const body = journalBodies.find(entry => entry.id === journalWorldId);
    const world = worldDiscoveries.find(entry => entry.id === journalWorldId);
    const isStar = body?.id === star.id;
    const hasDetail = Boolean(body && (isStar || world));
    logbook.querySelector('[data-world-journal-overview]').hidden = hasDetail;
    logbook.querySelector('[data-world-journal-detail]').hidden = !hasDetail;
    logbook.querySelector('[data-world-journal-star]').hidden = !isStar;
    logbook.querySelector('[data-world-journal-discoveries]').hidden = isStar;
    if (!hasDetail) {
      logbook.querySelector('[data-world-journal-discoveries]').innerHTML = '';
      return;
    }
    const items = worldJournalItems.filter(item => item.worldId === body.id);
    logbook.querySelector('[data-world-journal-planet-image]').src = `${assetRoot}${body.image}`;
    logbook.querySelector('[data-world-journal-location]').textContent = isStar ? 'AURA RUBRE · ESTRELA CENTRAL' : `${world.system.toUpperCase()} · PLANETA ${String(world.planetNumber).padStart(2,'0')}`;
    logbook.querySelector('[data-world-journal-detail-title]').textContent = body.name;
    logbook.querySelector('[data-world-journal-intro]').textContent = isStar ? 'A estrela que ilumina os mundos da sua jornada.' : 'Abra uma descoberta para ampliar a imagem e ler sua página do diário.';
    logbook.querySelector('[data-world-journal-progress]').textContent = isStar ? `${planets.length} planetas neste sistema` : journalProgress.completedWorldIds.includes(body.id) ? '12 de 12 curiosidades desbloqueadas · Diário completo · +1 XP' : `${items.filter(owns).length} de ${items.length} curiosidades desbloqueadas`;
    logbook.querySelector('[data-world-journal-star-copy]').textContent = star.description;
    logbook.querySelector('[data-world-journal-discoveries]').innerHTML = items.map((item,index) => {
      const unlocked = owns(item);
      return `<article class="world-journal-discovery ${unlocked ? 'is-unlocked' : 'is-locked'}" data-world-journal-discovery="${item.id}" aria-labelledby="journal-${item.id}"><div class="world-journal-discovery__image"><img src="${item.image}" alt="${unlocked ? escapeHTML(item.title) : 'Figurinha bloqueada'}" loading="lazy" /><span class="world-journal-discovery__number" aria-label="Descoberta ${index + 1}">${index + 1}</span>${unlocked ? '' : `<span class="world-journal-discovery__lock" aria-hidden="true">${lockArtwork}</span>`}</div><div class="world-journal-discovery__copy"><small>${unlocked ? 'NO SEU DIÁRIO' : 'CURIOSIDADE BLOQUEADA'}</small><h3 id="journal-${item.id}">${escapeHTML(item.title)}</h3><p>${unlocked ? escapeHTML(item.curiosity) : 'Desbloqueie esta figurinha para conhecer sua história e guardá-la no seu diário.'}</p><button type="button" data-open-world-page="${item.id}" aria-haspopup="dialog">${unlocked ? 'Ampliar imagem e ler' : `Desbloquear por ${item.price} moedas`} <span aria-hidden="true">→</span></button></div></article>`;
    }).join('');
  }

  function openJournalWorld(id) {
    if (!currentStudent || (id !== star.id && !worldDiscoveries.some(world => world.id === id))) return;
    const world = worldAccessDestinations.find(entry => entry.id === id);
    if (world && !isWorldUnlocked(world)) {
      setStudentView('explore');
      openDestination(id,destinations.querySelector(`[data-explore-body="${id}"]`));
      return;
    }
    journalWorldId = id;
    renderWorldJournal();
    logbook.querySelector('[data-world-journal-detail-title]').focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
  }

  function closeJournalWorld() {
    const id = journalWorldId;
    journalWorldId = '';
    renderWorldJournal();
    logbook.querySelector(`[data-open-journal-world="${id}"]`)?.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
  }

  function syncModalScroll() {
    document.body.classList.toggle('world-modal-open',dialog.open || pageDialog.open);
  }

  function renderWorldPage() {
    const item = worldJournalItems.find(entry => entry.id === pageItemId);
    if (!item || !currentStudent) return;
    const unlocked = owns(item);
    const items = worldJournalItems.filter(entry => entry.worldId === item.worldId);
    const missing = Math.max(0,item.price - currentStudent.coins);
    const image = pageDialog.querySelector('[data-world-page-image]');
    image.src = item.image;
    image.alt = unlocked ? item.title : 'Figurinha bloqueada';
    pageDialog.classList.toggle('is-locked',!unlocked);
    pageDialog.querySelector('[data-world-page-location]').textContent = `${item.system} · ${item.worldName} · Planeta ${String(item.planetNumber).padStart(2,'0')}`;
    pageDialog.querySelector('[data-world-page-title]').textContent = item.title;
    pageDialog.querySelector('[data-world-page-status]').textContent = unlocked ? '✦ DESCOBERTA GUARDADA NO SEU DIÁRIO' : 'UMA NOVA HISTÓRIA PARA DESCOBRIR';
    pageDialog.querySelector('[data-world-page-copy]').textContent = unlocked ? item.curiosity : 'Desbloqueie esta figurinha para ver a imagem ampliada e conhecer sua história. Ela ficará guardada no seu diário de bordo.';
    pageDialog.querySelector('[data-world-page-lock]').hidden = unlocked;
    pageDialog.querySelector('[data-world-page-purchase]').hidden = unlocked;
    pageDialog.querySelector('[data-world-page-price]').textContent = item.price;
    pageDialog.querySelector('[data-world-page-balance]').textContent = `Sua carteira: ${currentStudent.coins} moedas`;
    pageDialog.querySelector('[data-world-page-message]').textContent = missing ? `Faltam ${missing} moedas. Continue os desafios da trilha para ganhar mais moedas.` : 'Uma única compra. Você poderá reler esta descoberta sempre que quiser.';
    const unlock = pageDialog.querySelector('[data-world-page-unlock]');
    unlock.disabled = Boolean(missing) || unlocked;
    unlock.textContent = `Desbloquear por ${item.price} moedas`;
    pageDialog.querySelector('[data-world-page-number]').textContent = `Descoberta ${String(items.indexOf(item) + 1).padStart(2,'0')} de ${items.length}`;
    pageDialog.querySelector('[data-world-page-return]').textContent = pageSource === 'journal' ? `Voltar às descobertas de ${item.worldName}` : 'Voltar ao infográfico';
    pageDialog.scrollTop = 0;
  }

  function openWorldPage(id, trigger, source='map') {
    const item = worldJournalItems.find(entry => entry.id === id);
    if (!currentStudent || !item) return;
    if (!isWorldUnlocked(worldDiscoveries.find(world => world.id === item.worldId))) return;
    hideWorldZoom();
    pageItemId = id;
    pageSource = source;
    pageReturnFocus = trigger;
    renderWorldPage();
    if (!pageDialog.open) pageDialog.showModal();
    syncModalScroll();
    syncAnimation();
  }

  window.worldExplorer = {
    refresh() {
      renderWorldJournal();
      if (activeWorld && dialog.open) renderWorldMap();
    }
  };

  function artwork(body) {
    if (body.image) return `<img src="${assetRoot}${body.image}" alt="" draggable="false" />`;
    return `<span class="explore-placeholder explore-placeholder--${body.color}" aria-hidden="true"></span>`;
  }

  function bodyButton(body, isStar, orbitIndex) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `explore-body${isStar ? ' explore-body--star' : ''}${body.image ? '' : ' explore-body--pending'}`;
    button.dataset.exploreBody = body.id;
    button.setAttribute('aria-label', `Explorar ${body.name}${body.image ? '' : ' — em descoberta'}`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.style.setProperty('--body-size', `${isStar ? 14.5 : body.size}%`);
    button.innerHTML = `<span class="explore-body__art">${artwork(body)}</span><span class="explore-body__label">${body.name}</span>`;
    if (!isStar) button.dataset.orbit = orbitIndex + 1;
    bodies.append(button);
    return button;
  }

  bodyButton(star, true);
  const planetButtons = planets.map((planet, index) => {
    const orbit = document.createElement('span');
    orbit.className = 'explore-orbit';
    orbit.style.width = `${(0.092 + index * 0.046) * 200}%`;
    orbit.style.height = `${(0.082 + index * 0.041) * 200}%`;
    section.querySelector('[data-explore-orbits]').append(orbit);
    return bodyButton(planet, false, index);
  });

  systemBodies.forEach(body => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `explore-destination${body.image ? '' : ' explore-destination--pending'}`;
    button.dataset.exploreBody = body.id;
    button.setAttribute('aria-haspopup', 'dialog');
    button.innerHTML = `<span class="explore-destination__art" aria-hidden="true">${artwork(body)}</span><span>${body.name}${body.image ? '' : '<small>Em descoberta</small>'}</span>`;
    destinations.append(button);
  });

  function renderPositions() {
    if (!sceneWidth || !sceneHeight) return;
    planets.forEach((planet, index) => {
      const angle = planet.phase * Math.PI / 180 + (elapsed % planet.duration) / planet.duration * Math.PI * 2;
      const x = Math.cos(angle) * (0.092 + index * 0.046) * sceneWidth;
      const y = Math.sin(angle) * (0.082 + index * 0.041) * sceneHeight;
      planetButtons[index].style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      planetButtons[index].style.zIndex = y >= 0 ? 4 : 2;
    });
  }

  function isVisible() {
    return !section.hidden && !screen.hidden && !document.hidden;
  }

  function shouldAnimate() {
    return isVisible() && !paused && !hovered && !focused && !dialog.open && !pageDialog.open;
  }

  function animate(time) {
    frame = null;
    if (!shouldAnimate()) { previousTime = null; return; }
    if (previousTime !== null) elapsed += Math.min((time - previousTime) / 1000, 0.1);
    previousTime = time;
    renderPositions();
    frame = requestAnimationFrame(animate);
  }

  function syncAnimation() {
    if (pageDialog.open && (screen.hidden || (pageSource === 'map' ? section.hidden : logbook.hidden))) pageDialog.close();
    if ((section.hidden || screen.hidden) && dialog.open) dialog.close();
    if (shouldAnimate()) {
      if (frame === null) frame = requestAnimationFrame(animate);
    } else {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      previousTime = null;
    }
  }

  function updateMotionButton() {
    motionButton.setAttribute('aria-pressed', String(paused));
    section.querySelector('[data-explore-motion-icon]').textContent = paused ? '▷' : 'Ⅱ';
    section.querySelector('[data-explore-motion-label]').textContent = paused ? 'Retomar órbitas' : 'Pausar órbitas';
    syncAnimation();
  }

  function openDestination(id, trigger) {
    const body = [star, ...planets].find(item => item.id === id);
    if (!body) return;
    const orbit = planets.indexOf(body) + 1;
    returnFocus = trigger;
    activeWorld = worldAccessDestinations.find(world => world.id === id) || null;
    dialog.classList.toggle('explore-dialog--world',Boolean(activeWorld));
    section.querySelector('[data-world-infographic]').hidden = !activeWorld;
    section.querySelector('[data-explore-detail-art]').hidden = Boolean(activeWorld);
    section.querySelector('.explore-dialog__copy').hidden = Boolean(activeWorld);
    dialog.setAttribute('aria-labelledby',activeWorld ? 'world-map-title' : 'explore-detail-title');
    dialog.setAttribute('aria-describedby',activeWorld ? 'world-map-instructions' : 'explore-detail-copy');
    if (activeWorld) renderWorldMap();
    section.querySelector('[data-explore-detail-art]').innerHTML = artwork(body);
    section.querySelector('[data-explore-detail-title]').textContent = body.name;
    section.querySelector('[data-explore-detail-kicker]').textContent = orbit ? `ÓRBITA ${orbit} DE 9` : 'ESTRELA CENTRAL';
    section.querySelector('[data-explore-detail-copy]').textContent = !orbit
      ? star.description
      : body.image
        ? `Você chegou à órbita ${orbit} do sistema Aura Rubre. Conheça ${body.name} de perto e continue sua viagem pelos outros planetas.`
        : 'Este planeta ainda está sendo preparado. Em breve, uma nova descoberta estará aqui.';
    if (!dialog.open) dialog.showModal();
    fitWorldCaptions();
    dialog.scrollTop = 0;
    syncModalScroll();
    syncAnimation();
  }

  section.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.dataset.exploreBody) openDestination(target.dataset.exploreBody, target);
    else if (target.dataset.worldDiscovery) openWorldPage(target.dataset.worldDiscovery,target);
    else if (target.hasAttribute('data-world-entry-unlock')) {
      const result = unlockWorld(activeWorld.id);
      if (result.status === 'purchased' || result.status === 'owned') {
        const heading = section.querySelector(activeWorld.id === star.id ? '[data-explore-detail-title]' : '[data-world-map-title]');
        heading.tabIndex = -1;
        heading.focus({preventScroll:true});
      }
    }
    else if (target.hasAttribute('data-explore-close')) dialog.close();
    else if (target === motionButton) { paused = !paused; updateMotionButton(); }
  });
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    hideWorldZoom();
    if (isVisible() && returnFocus?.isConnected) returnFocus.focus({preventScroll: true});
    syncModalScroll();
    syncAnimation();
  });
  logbook.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (target?.dataset.openJournalWorld) openJournalWorld(target.dataset.openJournalWorld);
    else if (target?.hasAttribute('data-world-journal-back')) closeJournalWorld();
    else if (target?.dataset.openWorldPage) openWorldPage(target.dataset.openWorldPage,target,'journal');
  });
  pageDialog.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (target?.hasAttribute('data-world-page-close')) pageDialog.close();
    else if (target?.hasAttribute('data-world-page-unlock')) {
      const result = purchaseWorldDiscovery(pageItemId);
      renderWorldPage();
      if (result.status === 'purchased' || result.status === 'owned') {
        const title = pageDialog.querySelector('[data-world-page-title]');
        title.tabIndex = -1;
        title.focus({preventScroll:true});
      }
    } else if (event.target === pageDialog) {
      const bounds = pageDialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) pageDialog.close();
    }
  });
  pageDialog.addEventListener('close', () => {
    const updatedTrigger = pageSource === 'map'
      ? section.querySelector(`[data-world-discovery="${pageItemId}"]`)
      : logbook.querySelector(`[data-open-world-page="${pageItemId}"]`);
    if (!screen.hidden) (updatedTrigger || pageReturnFocus)?.focus({preventScroll:true});
    syncModalScroll();
    syncAnimation();
  });
  scene.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; syncAnimation(); } });
  scene.addEventListener('pointerleave', () => { hovered = false; syncAnimation(); });
  // Freeze moving targets while navigating the system with a keyboard.
  scene.addEventListener('focusin', () => { focused = true; syncAnimation(); });
  scene.addEventListener('focusout', event => { focused = scene.contains(event.relatedTarget); syncAnimation(); });
  document.addEventListener('visibilitychange', syncAnimation);
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; updateMotionButton(); });
  const visibilityObserver = new MutationObserver(syncAnimation);
  visibilityObserver.observe(section, {attributes: true, attributeFilter: ['hidden']});
  visibilityObserver.observe(screen, {attributes: true, attributeFilter: ['hidden']});
  visibilityObserver.observe(logbook, {attributes: true, attributeFilter: ['hidden']});
  new MutationObserver(() => {
    if (logbook.hidden || screen.hidden) journalWorldId = '';
    renderWorldJournal();
  }).observe(logbook, {attributes:true, attributeFilter:['hidden']});
  new ResizeObserver(() => {
    sceneWidth = scene.clientWidth;
    sceneHeight = scene.clientHeight;
    renderPositions();
  }).observe(scene);
  updateMotionButton();
})();
