const weightMissions = (() => {
  // Frutas, massas e pesos disponíveis das dez atividades de Quanto pesa?.
  const levels = [
    {fruit:'melancia',asset:'melancia',mass:8,weights:[2,5,11]},
    {fruit:'abacaxi',asset:'abacaxi',mass:3,weights:[2,4,5]},
    {fruit:'jaca',asset:'jaca',mass:10,weights:[3,5,12]},
    {fruit:'laranja',asset:'laranja',mass:1,weights:[3,5,6]},
    {fruit:'melão',asset:'melao',mass:7,weights:[3,6,10]},
    {fruit:'mamão',asset:'mamao',mass:4,weights:[2,5,7]},
    {fruit:'abóbora',asset:'abobora',mass:9,weights:[3,5,12]},
    {fruit:'manga',asset:'manga',mass:2,weights:[3,5,6]},
    {fruit:'coco',asset:'coco',mass:6,weights:[3,4,5]},
    {fruit:'abacate',asset:'abacate',mass:5,weights:[2,4,7]}
  ];
  const feminine = new Set(['melancia','jaca','laranja','abóbora','manga']);
  const places = ['bank','left','right'];
  const placeName = place => ({bank:'banco de pesos',left:'prato esquerdo',right:'prato direito'})[place];
  const mission = {
    title:'Quanto pesa?',
    intro:'Descubra a massa de cada fruta com uma balança. Arraste os pesos para os pratos ou selecione um peso e toque no prato desejado. Você pode colocar pesos junto da fruta, no outro prato ou devolvê-los ao banco. Quando os pratos se equilibrarem, subtraia os pesos junto da fruta dos pesos do outro prato e escreva a resposta em quilogramas (kg). São 10 questões, com duas tentativas de confirmação em cada uma. Mover os pesos ou recomeçar não recupera uma tentativa usada.',
    questions:levels.map((level,index) => ({
      id:`d14m3q${index + 1}`,type:'weight-balance',...level,article:feminine.has(level.fruit) ? 'a' : 'o',
      fruitImage:`assets/imagens/questoes/3-ano/desafio-14/missao-3/${level.asset}.svg`,
      text:`Quanto pesa ${feminine.has(level.fruit) ? 'a' : 'o'} ${level.fruit}? Equilibre a balança e descubra a massa da fruta.`,
      spokenText:`Quanto pesa ${feminine.has(level.fruit) ? 'a' : 'o'} ${level.fruit}? A fruta está no prato esquerdo. Os pesos disponíveis são ${level.weights.join(', ')} quilogramas. Arraste os pesos ou selecione um peso e depois um prato. O prato mais pesado fica mais baixo. Quando a balança estiver equilibrada, descubra a massa da fruta e confirme a resposta em quilogramas. Cada peso só pode estar em um lugar de cada vez.`,
      correct:`MUITO BEM! ${feminine.has(level.fruit) ? 'A' : 'O'} ${level.fruit} pesa ${level.mass} kg.`,
      incorrect:'Compare os pesos nos dois pratos para descobrir a massa da fruta.'
    }))
  };
  const isType = question => question?.type === 'weight-balance';

  function balance(question,locations) {
    if (!Array.isArray(locations) || locations.length !== question.weights.length || locations.some(place => !places.includes(place))) return null;
    const left = question.weights.reduce((sum,mass,index) => sum + (locations[index] === 'left' ? mass : 0),0);
    const right = question.weights.reduce((sum,mass,index) => sum + (locations[index] === 'right' ? mass : 0),0);
    const difference = question.mass + left - right;
    return {left,right,difference,balanced:difference === 0,tilt:Math.max(-9,Math.min(9,-difference * 2.2))};
  }

  function solutions(question) {
    const matches = [];
    for (let code = 0; code < 3 ** question.weights.length; code++) {
      const locations = question.weights.map((_,index) => places[Math.floor(code / 3 ** index) % 3]);
      if (balance(question,locations).balanced) matches.push(locations);
    }
    return matches;
  }

  function parseAnswer(answer) {
    const text = String(answer ?? '').trim();
    if (!/^\d+(?:[.,]\d+)?$/.test(text)) return null;
    const value = Number(text.replace(',','.'));
    return Number.isFinite(value) ? value : null;
  }

  function evaluate(question,locations,answer) {
    const current = balance(question,locations);
    if (!current?.balanced) return {complete:false,correct:false,message:'Equilibre a balança antes de confirmar.'};
    const value = parseAnswer(answer);
    if (value === null) return {complete:false,correct:false,message:'Escreva a massa da fruta em quilogramas.'};
    const correct = value === question.mass;
    return {complete:true,correct,...current,message:correct ? question.correct : `Ainda não. Com a balança equilibrada, a fruta completa a diferença entre ${current.right} kg e ${current.left} kg. Subtraia os pesos junto da fruta dos pesos do outro prato. Você tem mais uma tentativa.`};
  }

  function resolution(question,locations) {
    let current = balance(question,locations);
    if (!current?.balanced) current = balance(question,solutions(question)[0]);
    return `${current.right} kg − ${current.left} kg = ${question.mass} kg.`;
  }

  let state = null,drag = null;
  const weightButton = (mass,index,place) => `<button type="button" class="mass-weight" data-mass-weight="${index}" data-mass-place="${place}" aria-label="Peso de ${mass} quilogramas no ${placeName(place)}. Selecionar" aria-pressed="false"><img src="assets/imagens/questoes/3-ano/desafio-14/missao-3/peso-3d.png" alt="" draggable="false"><span class="mass-weight-label"><strong>${mass}</strong><small>kg</small></span></button>`;
  const fruit = question => `<span class="mass-fruit"><img src="${question.fruitImage}" alt="${question.fruit}" draggable="false"><small aria-label="Massa desconhecida">?</small></span>`;

  function render(question,container,callbacks={}) {
    clear();
    state = {question,root:container,callbacks,locations:question.weights.map(() => 'bank'),selected:null,locked:false,feedback:'',lastResult:null,suppressClick:false};
    container.classList.add('weight-activity');
    container.innerHTML = `<div class="mass-game">
      <div class="mass-observation"><span class="mass-balance-status" data-mass-status role="status" aria-live="polite"></span>
        <div class="mass-stage" role="group" aria-label="Balança interativa">
          <div class="mass-scale"><div class="mass-beam" data-mass-beam>
            <div class="mass-pan mass-pan-left" data-mass-zone="left" role="button" tabindex="0" aria-label="Colocar peso selecionado no prato esquerdo"><div class="mass-pan-items" data-mass-items="left"></div><div class="mass-pan-rim"></div><div class="mass-pan-bowl"></div></div>
            <div class="mass-pan mass-pan-right" data-mass-zone="right" role="button" tabindex="0" aria-label="Colocar peso selecionado no prato direito"><div class="mass-pan-items" data-mass-items="right"></div><div class="mass-pan-rim"></div><div class="mass-pan-bowl"></div></div>
          </div><div class="mass-pivot"></div><div class="mass-post"></div><div class="mass-foot"></div></div>
        </div>
        <div class="mass-totals" aria-label="Pesos nos pratos"><div><small>PRATO ESQUERDO</small><strong><img src="${question.fruitImage}" alt="${question.fruit}"> + <span data-mass-left>0 kg</span></strong></div><b data-mass-comparison aria-hidden="true">&gt;</b><div><small>PRATO DIREITO</small><strong data-mass-right>0 kg</strong></div></div>
      </div>
      <div class="mass-controls"><div class="mass-bank" data-mass-zone="bank" role="button" tabindex="0" aria-label="Devolver peso selecionado ao banco"><div class="mass-bank-heading"><span>PESOS DISPONÍVEIS</span><button type="button" data-mass-reset>↻ Recomeçar</button></div><p data-mass-help>Selecione um peso e depois um prato.</p><div class="mass-bank-weights" data-mass-items="bank"></div></div>
        <div class="mass-answer" data-mass-answer-panel><label for="mass-answer-input">A massa da fruta é:</label><div><input id="mass-answer-input" data-mass-answer type="text" inputmode="decimal" autocomplete="off" maxlength="8" aria-label="Massa da fruta em quilogramas" disabled><strong>kg</strong></div><p data-mass-answer-help>Equilibre a balança para responder.</p></div>
      </div><span class="mass-announcement" data-mass-announcement role="status" aria-live="polite"></span>
    </div>`;
    container.addEventListener('click',handleClick);
    container.addEventListener('keydown',handleKeydown);
    container.addEventListener('input',handleInput);
    container.addEventListener('pointerdown',startDrag);
    refresh(true);
  }

  function refresh(rebuild=false) {
    if (!state) return;
    const {question,root,locations,locked,selected} = state,current = balance(question,locations);
    if (rebuild) {
      places.forEach(place => { root.querySelector(`[data-mass-items="${place}"]`).innerHTML = (place === 'left' ? fruit(question) : '') + question.weights.map((mass,index) => locations[index] === place ? weightButton(mass,index,place) : '').join(''); });
      if (!locations.includes('bank')) root.querySelector('[data-mass-items="bank"]').innerHTML = '<span class="mass-empty-bank">Todos os pesos estão nos pratos.</span>';
    }
    root.querySelector('[data-mass-beam]').style.setProperty('--mass-tilt',`${current.tilt}deg`);
    root.querySelector('[data-mass-left]').textContent = `${current.left} kg`;
    root.querySelector('[data-mass-right]').textContent = `${current.right} kg`;
    root.querySelector('[data-mass-comparison]').textContent = current.balanced ? '=' : current.difference > 0 ? '>' : '<';
    const status = root.querySelector('[data-mass-status]');
    status.dataset.state = current.balanced ? 'balanced' : current.difference > 0 ? 'left' : 'right';
    status.textContent = current.balanced ? '✓ Balança equilibrada!' : current.difference > 0 ? '↓ O lado da fruta está mais pesado' : '↓ O prato direito está mais pesado';
    root.querySelectorAll('[data-mass-weight]').forEach(button => {
      const index = Number(button.dataset.massWeight),chosen = selected === index;
      button.disabled = locked; button.classList.toggle('is-selected',chosen); button.setAttribute('aria-pressed',String(chosen));
      button.setAttribute('aria-label',`Peso de ${question.weights[index]} quilogramas no ${placeName(locations[index])}. ${chosen ? 'Selecionado' : 'Selecionar'}`);
    });
    root.querySelectorAll('[data-mass-zone]').forEach(zone => {
      zone.setAttribute('aria-disabled',String(locked)); zone.tabIndex = locked ? -1 : 0;
      zone.classList.toggle('is-ready',selected !== null && !locked && locations[selected] !== zone.dataset.massZone);
    });
    root.querySelector('[data-mass-reset]').disabled = locked || locations.every(place => place === 'bank');
    root.querySelector('[data-mass-help]').textContent = selected === null ? 'Selecione um peso e depois um prato.' : `Peso de ${question.weights[selected]} kg selecionado. Escolha um prato ou o banco.`;
    const input = root.querySelector('[data-mass-answer]');
    input.disabled = locked || !current.balanced;
    root.querySelector('[data-mass-answer-panel]').classList.toggle('is-ready',current.balanced);
    root.querySelector('[data-mass-answer-help]').textContent = current.balanced ? 'Compare os pesos nos dois pratos.' : 'Equilibre a balança para responder.';
    state.callbacks.onReady?.(!locked && current.balanced && parseAnswer(input.value) !== null);
  }

  function resetFeedback() {
    state.feedback = ''; state.lastResult = null;
    state.root.querySelector('.mass-game').classList.remove('is-correct','is-wrong');
    state.callbacks.onChange?.();
  }

  function move(index,place) {
    if (!state || state.locked || !Number.isInteger(index) || index < 0 || index >= state.locations.length || !places.includes(place) || state.locations[index] === place) return false;
    state.locations[index] = place; state.selected = null;
    state.root.querySelector('[data-mass-answer]').value = '';
    resetFeedback(); refresh(true);
    state.root.querySelector('[data-mass-announcement]').textContent = `Peso de ${state.question.weights[index]} kg colocado no ${placeName(place)}.`;
    return true;
  }

  function handleClick(event) {
    if (!state || !state.root.contains(event.target)) return;
    if (state.suppressClick) { state.suppressClick = false; if (event.detail > 0) return; }
    if (state.locked) return;
    const weight = event.target.closest('[data-mass-weight]');
    if (weight) { const index = Number(weight.dataset.massWeight); state.selected = state.selected === index ? null : index; refresh(); return; }
    if (event.target.closest('[data-mass-reset]')) {
      cancelDrag(); state.locations.fill('bank'); state.selected = null;
      state.root.querySelector('[data-mass-answer]').value = '';
      resetFeedback(); refresh(true);
      state.root.querySelector('[data-mass-announcement]').textContent = 'Pesos devolvidos ao banco. As tentativas já usadas continuam contando.';
      return;
    }
    const zone = event.target.closest('[data-mass-zone]');
    if (zone && state.selected !== null) move(state.selected,zone.dataset.massZone);
  }

  function handleInput(event) {
    if (!state || state.locked || !event.target.matches('[data-mass-answer]')) return;
    resetFeedback(); refresh();
  }

  function handleKeydown(event) {
    if (!state || !state.root.contains(event.target) || !['Enter',' ','Escape'].includes(event.key)) return;
    event.stopPropagation();
    if (event.key === 'Escape') { cancelDrag(); state.selected = null; refresh(); return; }
    if (event.repeat || state.locked) return;
    if (event.target.matches('[data-mass-answer]')) {
      if (event.key === 'Enter') { event.preventDefault(); state.callbacks.onSubmit?.(); }
      return;
    }
    if (event.target.matches('[data-mass-zone]')) {
      event.preventDefault();
      const selected = state.selected;
      if (selected !== null && move(selected,event.target.dataset.massZone)) state.root.querySelector(`[data-mass-weight="${selected}"]`)?.focus();
    }
  }

  function startDrag(event) {
    if (state && !drag) state.suppressClick = false;
    const element = event.target.closest('[data-mass-weight]');
    if (!state || state.locked || !element || element.disabled || event.button !== 0 || drag) return;
    const rect = element.getBoundingClientRect();
    drag = {element,index:Number(element.dataset.massWeight),pointerId:event.pointerId,x:event.clientX,y:event.clientY,width:rect.width,height:rect.height,offsetX:event.clientX - rect.left,offsetY:event.clientY - rect.top,moved:false};
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
      drag.ghost.classList.add('mass-drag-ghost'); drag.ghost.removeAttribute('data-mass-weight');
      drag.ghost.setAttribute('aria-hidden','true'); drag.ghost.tabIndex = -1;
      Object.assign(drag.ghost.style,{width:`${drag.width}px`,height:`${drag.height}px`});
      document.body.appendChild(drag.ghost); drag.element.classList.add('is-dragging');
    }
    event.preventDefault();
    drag.ghost.style.left = `${event.clientX - drag.offsetX}px`; drag.ghost.style.top = `${event.clientY - drag.offsetY}px`;
    const target = document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-mass-zone]');
    state.root.querySelectorAll('[data-mass-zone]').forEach(zone => zone.classList.toggle('is-drop-target',zone === target));
  }

  function endDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = drag,target = event.type === 'pointerup' ? document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-mass-zone]') : null;
    cancelDrag();
    if (!current.moved || !state) return;
    state.suppressClick = true;
    if (target && state.root.contains(target)) move(current.index,target.dataset.massZone);
  }

  function cancelDrag() {
    document.removeEventListener('pointermove',moveDrag);
    document.removeEventListener('pointerup',endDrag);
    document.removeEventListener('pointercancel',endDrag);
    if (drag) {
      drag.ghost?.remove(); drag.element.classList.remove('is-dragging');
      if (drag.element.hasPointerCapture?.(drag.pointerId)) drag.element.releasePointerCapture(drag.pointerId);
      drag = null;
    }
    state?.root.querySelectorAll('.is-drop-target').forEach(element => element.classList.remove('is-drop-target'));
  }

  function submit() {
    if (!state || state.locked || drag?.moved) return null;
    cancelDrag();
    const result = evaluate(state.question,state.locations,state.root.querySelector('[data-mass-answer]').value);
    state.lastResult = result; state.feedback = result.message;
    if (result.complete) {
      state.root.querySelector('.mass-game').classList.toggle('is-correct',result.correct);
      state.root.querySelector('.mass-game').classList.toggle('is-wrong',!result.correct);
    }
    return result;
  }

  function lock() {
    if (!state) return;
    cancelDrag(); state.locked = true; state.selected = null;
    if (state.lastResult && !state.lastResult.correct) state.feedback = `As duas tentativas terminaram. ${state.question.article === 'a' ? 'A' : 'O'} ${state.question.fruit} pesa ${state.question.mass} kg: ${resolution(state.question,state.locations)}`;
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

  return {mission,isType,balance,solutions,parseAnswer,evaluate,resolution,render,submit,lock,clear,
    get feedback() { return state?.feedback || ''; }};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = weightMissions;
