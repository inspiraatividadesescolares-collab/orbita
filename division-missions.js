const divisionMissions = (() => {
  const imageRoot = 'assets/imagens/questoes/3-ano/desafio-17/missão-1';
  const levels = [
    {text:'Lia vai repartir 6 maçãs igualmente em 2 pratos. Quantas maçãs ficarão em cada prato?',total:6,groups:2,item:'maçã',plural:'maçãs',target:'Prato',answerLabel:'Maçãs em cada prato',itemAsset:'b',targetAsset:'a',area:[16,34,68,33]},
    {text:'Divida 8 balas igualmente entre 4 crianças. Quantas balas cada criança receberá?',total:8,groups:4,item:'bala',plural:'balas',target:'Criança',answerLabel:'Balas para cada criança',area:[27,38,46,31]},
    {text:'Organize 10 flores em 2 vasos, com a mesma quantidade em cada vaso. Quantas flores ficarão em cada um?',total:10,groups:2,item:'flor',plural:'flores',target:'Vaso',answerLabel:'Flores em cada vaso',area:[22,24,56,62]},
    {text:'Reparta 8 morangos igualmente em 2 potes. Quantos morangos ficarão em cada pote?',total:8,groups:2,item:'morango',plural:'morangos',target:'Pote',answerLabel:'Morangos em cada pote',area:[25,36,50,43]},
    {text:'Coloque 15 botões em 3 caixas, com quantidades iguais. Quantos botões ficarão em cada caixa?',total:15,groups:3,item:'botão',plural:'botões',target:'Caixa',answerLabel:'Botões em cada caixa',area:[24,28,52,44]},
    {text:'Distribua 16 bolinhas igualmente em 4 sacos. Quantas bolinhas ficarão em cada saco?',total:16,groups:4,item:'bolinha',plural:'bolinhas',target:'Saco',answerLabel:'Bolinhas em cada saco',area:[24,39,52,43]},
    {text:'Divida 20 estrelas de papel igualmente entre 5 cadernos. Quantas estrelas cada caderno receberá?',total:20,groups:5,item:'estrela de papel',plural:'estrelas',target:'Caderno',answerLabel:'Estrelas em cada caderno',area:[28,28,44,45]},
    {text:'Faça duplas com as 6 bolinhas. Quantas duplas você conseguirá formar?',total:6,groupSize:2,item:'bolinha',plural:'bolinhas',target:'Dupla',answerLabel:'Quantidade de duplas',area:[17,37,66,28]},
    {text:'Junte as 10 flores em grupos de 5. Quantos grupos serão formados?',total:10,groupSize:5,item:'flor',plural:'flores',target:'Grupo',answerLabel:'Quantidade de grupos',area:[25,17,50,66]},
    {text:'Distribua as 9 balas entre as 3 caixas. Quantas balas ficarão em cada caixa?',total:9,groups:3,item:'bala',plural:'balas',target:'Caixa',answerLabel:'Balas em cada caixa',area:[16,48,68,38]}
  ];
  // Coordinates follow the artwork, rather than a grid laid over every object.
  const scenes = [
    {crop:[6,31,92,37],size:15,slots:[[34,49,-8],[51,47,5],[68,50,-3]]},
    {crop:[10,23,67,75],size:20,slots:[[43,57,-22],[57,45,18]]},
    {crop:[15,9,66,84],size:18,slots:[[37,19,-20],[54,17,7],[67,24,20],[44,32,-9],[59,34,12]]},
    {crop:[13,6,75,87],size:18,slots:[[40,43,-9],[58,44,12],[43,63,7],[60,63,-10]]},
    {crop:[0,4,100,96],size:18,slots:[[50,50,-8],[36,37,-10],[64,37,6],[36,63,14],[64,63,-6]]},
    {crop:[15,5,72,90],size:20,slots:[[38,52,-5],[57,53,9],[40,70,10],[60,72,-9]]},
    {crop:[10,3,80,91],size:17,slots:[[36,31,-10],[57,28,-8],[40,53,-7],[62,51,-12]]},
    {crop:[7,27,86,46],size:22,slots:[[36,51,0],[65,51,0]]},
    {crop:[17,4,66,91],size:17,slots:[[37,27,-6],[58,27,8],[47,47,-4],[36,68,7],[58,68,-6]]},
    {crop:[0,10,100,86],size:22,slots:[[32,59,-25],[60,59,10],[47,76,-12]]}
  ];
  const itemCrops = [[15,9,70,82],[16,9,68,82],[9,12,82,77],[28,9,51,74],[10,9,80,82],[10,10,80,80],[22,24,55,53],[10,9,80,82],[25,14,48,76],[9,19,82,63]];
  const mission = {
    title:'A ideia da divisão',
    intro:'Dividir é repartir em quantidades iguais ou formar grupos do mesmo tamanho. Arraste cada figura até seu destino. Você também pode selecionar uma figura e tocar no destino, usando o mouse, o toque ou o teclado. Ao completar uma dupla ou um grupo de 5, outra moldura aparece se ainda houver figuras para agrupar. Depois de distribuir todas as figuras, digite sua resposta e confira. São 10 questões, com duas tentativas por questão. Recomeçar não recupera tentativas usadas.',
    questions:levels.map((level,index) => {
      const grouping = Boolean(level.groupSize),divisor = grouping ? level.groupSize : level.groups;
      const answer = level.total / divisor;
      return {id:`d17m1q${index + 1}`,type:'division-sharing',...level,placement:scenes[index],itemCrop:itemCrops[index],mode:grouping ? 'grouping' : 'sharing',divisor,answer,
        itemImage:`${imageRoot}/d17-m1-q${index + 1}-${level.itemAsset || 'a'}.png`,
        targetImage:`${imageRoot}/d17-m1-q${index + 1}-${level.targetAsset || 'b'}.png`,
        spokenText:`${level.text} ${grouping ? `Forme grupos de ${level.groupSize}. Ao completar uma moldura, outra aparece se ainda houver figuras para agrupar.` : `Distribua as figuras igualmente entre os ${level.groups} destinos.`} Arraste as figuras ou selecione uma figura e depois o destino. Ao terminar, digite sua resposta e confira.`,
        correct:`MUITO BEM! ${level.total} ÷ ${divisor} = ${answer}. ${grouping ? `Você formou ${answer} ${level.target === 'Dupla' ? 'duplas' : 'grupos'}.` : `Cada destino ficou com ${answer} ${level.plural}.`}`,
        incorrect:grouping ? `Forme grupos com ${level.groupSize} ${level.plural} e conte quantos grupos ficaram completos.` : 'Confira se todos os destinos ficaram com a mesma quantidade e conte as figuras de um deles.'};
    })
  };
  const challenge = {title:'Desafio 17 — Introdução à divisão',missions:[mission]};
  const isType = question => question?.type === 'division-sharing';
  const parseAnswer = answer => /^\d+$/.test(String(answer ?? '').trim()) && Number.isSafeInteger(Number(answer)) ? Number(answer) : null;

  function distribution(question,locations,groupCount = question.groups || 1) {
    if (!Number.isInteger(groupCount) || groupCount < 1 || groupCount > question.total ||
        (question.mode === 'sharing' && groupCount !== question.groups) ||
        !Array.isArray(locations) || locations.length !== question.total ||
        locations.some(place => !Number.isInteger(place) || place < -1 || place >= groupCount)) return null;
    const counts = Array(groupCount).fill(0);
    locations.forEach(place => { if (place >= 0) counts[place]++; });
    const remaining = locations.filter(place => place === -1).length;
    const occupied = counts.filter(count => count > 0);
    const arranged = remaining === 0 && (question.mode === 'sharing'
      ? counts.every(count => count === question.answer)
      : occupied.length === question.answer && occupied.every(count => count === question.groupSize));
    return {counts,remaining,arranged};
  }

  function evaluate(question,locations,answer,groupCount = question.groups || 1) {
    const current = distribution(question,locations,groupCount);
    if (!current || current.remaining) return {complete:false,correct:false,message:'Distribua todas as figuras antes de responder.'};
    if (question.requireEqual && !current.arranged) return {complete:false,correct:false,message:'Reparta as figuras em partes iguais antes de escolher a resposta.'};
    const choices = Array.isArray(question.options),value = choices ? answer : parseAnswer(answer);
    if (choices ? !question.options.includes(value) : value === null) return {complete:false,correct:false,message:choices ? 'Escolha uma alternativa para responder.' : 'Digite um número inteiro para responder.'};
    const correct = current.arranged && (choices ? value === question.choiceAnswer : value === question.answer);
    return {complete:true,correct,...current,message:correct ? question.correct : `TENTE NOVAMENTE! ${question.incorrect} Você tem mais uma tentativa.`};
  }

  let state = null,drag = null;
  const destinationName = (question,index) => question.targets?.[index]?.label || `${question.target} ${index + 1}`;
  const placeName = place => place < 0 ? 'banco de figuras' : destinationName(state.question,place);
  const announce = text => { if (state) state.root.querySelector('[data-division-status]').textContent = text; };

  function figureMarkup(question) {
    const [x,y,width,height] = question.itemCrop || [0,0,100,100],size = Math.max(width,height);
    return `<span class="division-piece-art" style="width:${width / size * 100}%;height:${height / size * 100}%"><img src="${question.itemImage}" alt="" draggable="false" style="left:${-x / width * 100}%;top:${-y / height * 100}%;width:${10000 / width}%;height:${10000 / height}%"></span>`;
  }

  function render(question,container,callbacks={}) {
    clear();
    state = {question,root:container,callbacks,locations:Array(question.total).fill(-1),groupCount:question.groups || 1,selected:null,locked:false,feedback:'',lastResult:null,suppressClick:false,choice:null};
    const itemAspect = question.itemCrop ? question.itemCrop[2] / question.itemCrop[3] : 1;
    container.classList.add('division-activity');
    container.innerHTML = `<div class="division-game ${question.options ? 'division-game--choices' : ''} ${question.targets ? 'division-game--destinations' : ''} ${question.targetLayout === 'shelf' ? 'division-game--shelf' : ''}" style="--figure-aspect:${itemAspect}">
      <div class="division-toolbar"><p class="division-instructions" data-division-help>Arraste uma figura ou selecione e toque no destino. Para devolver, selecione a figura e toque em “Devolver ao banco”.</p><button type="button" data-division-reset>↻ Recomeçar</button></div>
      <div class="division-bank" data-division-drop="-1"><div class="division-bank-heading"><span>FIGURAS PARA DISTRIBUIR <strong data-division-remaining>${question.total}</strong></span><button type="button" data-division-return>Devolver ao banco</button></div><div class="division-bank-items" data-division-items="-1">${Array.from({length:question.total},(_,index) => `<button type="button" class="division-piece" data-division-piece="${index}" aria-label="${question.item} ${index + 1}. Selecionar" aria-pressed="false">${figureMarkup(question)}</button>`).join('')}</div></div>
      <div class="division-targets ${question.targetLayout === 'shelf' ? 'division-targets--shelf' : ''}" data-division-targets></div>
      ${question.options ? `<p class="division-choices-help" data-division-answer-help>Distribua todas as figuras e escolha a resposta.</p><div class="division-choices" role="group" aria-label="${question.answerLabel}">${question.options.map((option,index) => `<button type="button" data-division-choice="${option}" disabled><b>${String.fromCharCode(65 + index)})</b> ${option}</button>`).join('')}</div>` : `<div class="division-answer"><label for="division-answer-input">${question.answerLabel}</label><input id="division-answer-input" data-division-answer type="text" inputmode="numeric" enterkeyhint="done" autocomplete="off" maxlength="3" aria-describedby="division-answer-help" disabled><p id="division-answer-help" data-division-answer-help>Distribua todas as figuras para responder.</p></div>`}
      <span class="division-status" data-division-status role="status" aria-live="polite"></span>
    </div>`;
    buildTargets();
    container.addEventListener('click',handleClick);
    container.addEventListener('keydown',handleKeydown);
    container.addEventListener('input',handleInput);
    container.addEventListener('pointerdown',startDrag);
    refresh();
  }

  function targetMarkup(question,index) {
    const target = question.targets?.[index],name = destinationName(question,index);
    const [left,top,width,height] = target?.area || question.area;
    if (question.targetLayout === 'shelf') return `<div class="division-shelf-destination" data-division-drop="${index}" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%"><button type="button" class="division-destination" data-division-destination="${index}" aria-label="Colocar livro em ${name}"></button><div class="division-target-items" data-division-items="${index}" style="--destination-columns:5"></div><small data-division-count="${index}">0 livros</small></div>`;
    const [x,y,w,h] = (target?.placement || question.placement)?.crop || [0,0,100,100];
    return `<div class="division-station ${target?.outside ? 'division-station--outside' : ''}" data-division-drop="${index}"><span class="division-target-name">${name}</span><div class="division-surface" style="--surface-ratio:${w / h}"><button type="button" class="division-destination" data-division-destination="${index}" aria-label="Colocar figura em ${name}"><span class="division-destination-art"><img src="${target?.image || question.targetImage}" alt="" draggable="false" style="left:${-x / w * 100}%;top:${-y / h * 100}%;width:${10000 / w}%;height:${10000 / h}%"></span></button><div class="division-target-items" data-division-items="${index}" style="--destination-columns:${target?.columns || 3}"></div></div><small data-division-count="${index}">0 ${question.plural}</small></div>`;
  }

  function arrangeFigures(index,count) {
    const {root,question} = state,target = question.targets?.[index];
    const area = root.querySelector(`[data-division-items="${index}"]`),pieces = [...area.children];
    const placement = target?.placement || question.placement;
    const [cx,cy,cw,ch] = placement?.crop || [0,0,100,100];
    const positioned = placement?.slots && count <= placement.slots.length;
    const region = positioned || question.targetLayout === 'shelf' ? [cx,cy,cw,ch] : target?.area || question.area || [0,0,100,100];
    const [x,y,width,height] = region;
    Object.assign(area.style,{left:`${(x - cx) / cw * 100}%`,top:`${(y - cy) / ch * 100}%`,width:`${width / cw * 100}%`,height:`${height / ch * 100}%`});
    area.classList.toggle('division-target-items--placed',Boolean(positioned));
    area.classList.toggle('division-target-items--books',question.targetLayout === 'shelf');
    const columns = target?.columns || Math.min(count || 1,3);
    area.style.setProperty('--destination-columns',columns);
    area.style.setProperty('--destination-rows',Math.max(1,Math.ceil(count / columns)));
    pieces.forEach((piece,i) => {
      if (!positioned) { piece.removeAttribute('style'); return; }
      const [sx,sy,rotation=0] = placement.slots[i];
      Object.assign(piece.style,{left:`${(sx - cx) / cw * 100}%`,top:`${(sy - cy) / ch * 100}%`,width:`${placement.size / cw * 100}%`,height:'auto'});
      piece.style.setProperty('--figure-turn',`${rotation}deg`);
    });
  }

  function buildTargets() {
    const {root,question,locations} = state;
    // Reuse the same figure buttons, so a figure is never duplicated or lost.
    root.querySelectorAll('[data-division-piece]').forEach(piece => root.querySelector('[data-division-items="-1"]').appendChild(piece));
    root.querySelector('[data-division-targets]').style.setProperty('--division-columns',Math.min(state.groupCount,5));
    root.querySelector('[data-division-targets]').innerHTML = `${question.targetLayout === 'shelf' ? `<img class="division-shelf-backdrop" src="${question.targetImage}" alt="Estante com quatro prateleiras: contos de fadas, animais, terror e heróis." draggable="false">` : ''}${Array.from({length:state.groupCount},(_,index) => targetMarkup(question,index)).join('')}`;
    root.querySelectorAll('[data-division-piece]').forEach(piece => root.querySelector(`[data-division-items="${locations[Number(piece.dataset.divisionPiece)]}"]`).appendChild(piece));
  }

  function addNextGroup() {
    const {question,root,locations,groupCount} = state;
    if (question.mode !== 'grouping' || groupCount >= question.answer) return false;
    const current = distribution(question,locations,groupCount);
    if (!current.remaining || !current.counts.every(count => count === question.groupSize)) return false;
    // Append the next frame without moving existing figures or interrupting keyboard focus.
    root.querySelector('[data-division-targets]').insertAdjacentHTML('beforeend',targetMarkup(question,groupCount));
    state.groupCount++;
    root.querySelector('[data-division-targets]').style.setProperty('--division-columns',Math.min(state.groupCount,5));
    return true;
  }

  function refresh() {
    if (!state) return;
    const {root,question,locked,locations,selected} = state,current = distribution(question,locations,state.groupCount);
    root.querySelector('[data-division-remaining]').textContent = current.remaining;
    current.counts.forEach((count,index) => {
      root.querySelector(`[data-division-count="${index}"]`).textContent = `${count} ${count === 1 ? question.item : question.plural}`;
      root.querySelector(`[data-division-destination="${index}"]`).setAttribute('aria-label',`${destinationName(question,index)}, ${count} ${question.plural}. Colocar figura selecionada.`);
      arrangeFigures(index,count);
    });
    root.querySelectorAll('[data-division-piece]').forEach(piece => {
      const index = Number(piece.dataset.divisionPiece),chosen = selected === index;
      piece.disabled = locked; piece.classList.toggle('is-selected',chosen); piece.setAttribute('aria-pressed',String(chosen));
      if (locations[index] === -1) piece.removeAttribute('style');
      piece.setAttribute('aria-label',`${question.item} ${index + 1} em ${placeName(locations[index])}. ${chosen ? 'Selecionada' : 'Selecionar'}`);
    });
    root.querySelectorAll('[data-division-destination],[data-division-reset]').forEach(button => { button.disabled = locked; });
    root.querySelector('[data-division-return]').disabled = locked || selected === null || locations[selected] === -1;
    root.querySelectorAll('[data-division-drop]').forEach(zone => {
      const place = Number(zone.dataset.divisionDrop);
      const hasRoom = place === -1 || question.mode !== 'grouping' || current.counts[place] < question.groupSize;
      zone.classList.toggle('is-ready',!locked && selected !== null && locations[selected] !== place && hasRoom);
    });
    const input = root.querySelector('[data-division-answer]');
    if (input) input.disabled = locked || current.remaining > 0;
    const ready = current.remaining === 0 && (!question.requireEqual || current.arranged);
    root.querySelectorAll('[data-division-choice]').forEach(button => {
      const previousWrong = state.lastResult?.complete && !state.lastResult.correct && state.choice === button.dataset.divisionChoice;
      button.disabled = locked || !ready || previousWrong;
      button.classList.toggle('is-wrong',Boolean(previousWrong));
      button.classList.toggle('is-correct',Boolean(state.lastResult?.correct && state.choice === button.dataset.divisionChoice));
    });
    root.querySelector('[data-division-answer-help]').textContent = current.remaining ? 'Distribua todas as figuras para responder.' : !ready ? 'Reparta as figuras em partes iguais para liberar as alternativas.' : question.options ? question.answerLabel : 'Conte as figuras ou os grupos e digite sua resposta.';
    state.callbacks.onReady?.(!locked && ready && (question.options ? question.options.includes(state.choice) : parseAnswer(input.value) !== null));
  }

  function resetFeedback() {
    state.feedback = ''; state.lastResult = null;
    state.root.querySelector('.division-game').classList.remove('is-correct','is-wrong');
    state.callbacks.onChange?.();
  }

  function move(index,place) {
    if (!state || state.locked || !Number.isInteger(index) || index < 0 || index >= state.locations.length ||
        !Number.isInteger(place) || place < -1 || place >= state.groupCount || state.locations[index] === place) return false;
    if (state.question.mode === 'grouping' && place >= 0 && state.locations.filter(location => location === place).length >= state.question.groupSize) {
      announce(`Esta moldura já tem ${state.question.groupSize} ${state.question.plural}. Escolha outra moldura ou devolva a figura ao banco.`);
      return false;
    }
    state.locations[index] = place; state.selected = null;
    const piece = state.root.querySelector(`[data-division-piece="${index}"]`);
    state.root.querySelector(`[data-division-items="${place}"]`).appendChild(piece);
    const input = state.root.querySelector('[data-division-answer]');
    if (input) input.value = '';
    state.choice = null;
    const added = addNextGroup();
    resetFeedback(); refresh(); announce(`${state.question.item} ${index + 1} colocada em ${placeName(place)}.${added ? ' Uma nova moldura apareceu para continuar agrupando.' : ''}`);
    return true;
  }

  function handleClick(event) {
    if (!state || !state.root.contains(event.target)) return;
    if (state.suppressClick) { state.suppressClick = false; if (event.detail > 0) return; }
    if (state.locked) return;
    const choice = event.target.closest('[data-division-choice]');
    if (choice) {
      if (choice.disabled) return;
      resetFeedback(); state.choice = choice.dataset.divisionChoice; state.callbacks.onSubmit?.(); return;
    }
    const piece = event.target.closest('[data-division-piece]');
    if (piece) {
      const index = Number(piece.dataset.divisionPiece);
      if (state.question.targets && state.selected !== null && state.selected !== index && state.locations[index] >= 0) {
        move(state.selected,state.locations[index]); return;
      }
      state.selected = state.selected === index ? null : index;
      refresh(); announce(state.selected === null ? 'Seleção desfeita.' : `${state.question.item} ${index + 1} selecionada. Escolha o destino.`); return;
    }
    if (event.target.closest('[data-division-reset]')) {
      cancelDrag(); state.locations.fill(-1); state.selected = null; state.groupCount = state.question.groups || 1;
      const input = state.root.querySelector('[data-division-answer]');
      if (input) input.value = '';
      state.choice = null;
      resetFeedback(); buildTargets(); refresh(); announce('Figuras devolvidas ao banco. As tentativas já usadas continuam contando.'); return;
    }
    if (state.selected !== null) {
      const zone = event.target.closest('[data-division-drop]');
      if (zone) {
        const index = state.selected;
        if (move(index,Number(zone.dataset.divisionDrop)) && event.detail === 0) state.root.querySelector(`[data-division-piece="${index}"]`).focus();
      }
    }
  }

  function handleInput(event) {
    if (!state || state.locked || !event.target.matches('[data-division-answer]')) return;
    resetFeedback(); refresh();
  }

  function handleKeydown(event) {
    if (!state || !['Enter',' ','Escape'].includes(event.key)) return;
    event.stopPropagation();
    if (event.key === 'Escape') { cancelDrag(); state.selected = null; refresh(); announce('Seleção desfeita.'); return; }
    if (event.target.matches('[data-division-answer]') && event.key === 'Enter') {
      event.preventDefault(); if (!state.locked && !event.repeat) state.callbacks.onSubmit?.();
    }
  }

  function markTarget(x,y) {
    if (!state) return null;
    let target = null;
    state.root.querySelectorAll('[data-division-drop]').forEach(zone => {
      const rect = zone.getBoundingClientRect(),inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      zone.classList.toggle('is-drop-target',inside);
      if (inside) target = Number(zone.dataset.divisionDrop);
    });
    return target;
  }

  function startDrag(event) {
    if (state && !drag) state.suppressClick = false;
    const element = event.target.closest('[data-division-piece]');
    if (!state || state.locked || !element || element.disabled || event.button !== 0 || drag) return;
    const rect = element.getBoundingClientRect();
    drag = {element,index:Number(element.dataset.divisionPiece),pointerId:event.pointerId,x:event.clientX,y:event.clientY,width:rect.width,height:rect.height,moved:false};
    element.setPointerCapture(event.pointerId);
    document.addEventListener('pointermove',moveDrag);
    document.addEventListener('pointerup',endDrag);
    document.addEventListener('pointercancel',endDrag);
  }

  function moveDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x,event.clientY - drag.y) < 7) return;
    if (!drag.moved) {
      drag.moved = true; drag.ghost = drag.element.cloneNode(true);
      drag.ghost.className = 'division-drag-ghost'; drag.ghost.removeAttribute('data-division-piece');
      drag.ghost.setAttribute('aria-hidden','true'); drag.ghost.tabIndex = -1;
      Object.assign(drag.ghost.style,{width:`${drag.width}px`,height:`${drag.height}px`});
      document.body.appendChild(drag.ghost); drag.element.classList.add('is-dragging');
    }
    event.preventDefault();
    drag.ghost.style.left = `${event.clientX - drag.width / 2}px`; drag.ghost.style.top = `${event.clientY - drag.height / 2}px`;
    markTarget(event.clientX,event.clientY);
  }

  function endDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = drag,target = current.moved && event.type === 'pointerup' ? markTarget(event.clientX,event.clientY) : null;
    cancelDrag();
    if (!current.moved || !state) return;
    const session = state; session.suppressClick = true;
    setTimeout(() => { session.suppressClick = false; },0);
    if (event.type === 'pointercancel') return;
    if (target !== null) move(current.index,target);
    else announce('Leve a figura até um destino ou de volta ao banco.');
  }

  function cancelDrag() {
    document.removeEventListener('pointermove',moveDrag);
    document.removeEventListener('pointerup',endDrag);
    document.removeEventListener('pointercancel',endDrag);
    if (drag) {
      const current = drag; drag = null;
      current.ghost?.remove(); current.element.classList.remove('is-dragging');
      if (current.element.hasPointerCapture?.(current.pointerId)) current.element.releasePointerCapture(current.pointerId);
    }
    state?.root.querySelectorAll('.is-drop-target').forEach(zone => zone.classList.remove('is-drop-target'));
  }

  function submit() {
    if (!state || state.locked || drag?.moved) return null;
    const result = evaluate(state.question,state.locations,state.question.options ? state.choice : state.root.querySelector('[data-division-answer]').value,state.groupCount);
    if (!result.complete) { announce(result.message); return result; }
    state.lastResult = result; state.feedback = result.message;
    state.root.querySelector('.division-game').classList.toggle('is-correct',result.correct);
    state.root.querySelector('.division-game').classList.toggle('is-wrong',!result.correct);
    refresh();
    return result;
  }

  function lock() {
    if (!state) return;
    cancelDrag(); state.locked = true; state.selected = null;
    if (state.lastResult && !state.lastResult.correct) state.feedback = `As duas tentativas terminaram. ${state.question.correct.replace('MUITO BEM! ','')}`;
    refresh();
  }

  function clear() {
    cancelDrag();
    if (state) {
      state.root.removeEventListener('click',handleClick);
      state.root.removeEventListener('keydown',handleKeydown);
      state.root.removeEventListener('input',handleInput);
      state.root.removeEventListener('pointerdown',startDrag);
    }
    state = null;
  }

  return {challenge,mission,isType,parseAnswer,distribution,evaluate,render,submit,lock,clear,
    get feedback() { return state?.feedback || ''; }};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = divisionMissions;
