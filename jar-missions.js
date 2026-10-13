const jarMissions = (() => {
  const capacityLabel = value => value === 1000 ? '1 L' : `${value} mL`;
  // As dez fases do jogo Desafio da Jarra, na mesma ordem e com a maior jarra por último.
  const levels = [
    {capacities:[500,300,1000],target:200},
    {capacities:[500,300,1000],target:800},
    {capacities:[500,300,1000],target:700},
    {capacities:[500,300,1000],target:400},
    {capacities:[700,200,900],target:600},
    {capacities:[600,200,900],target:500},
    {capacities:[900,200,1000],target:500},
    {capacities:[900,200,1000],target:300},
    {capacities:[800,700,1000],target:400},
    {capacities:[800,500,1000],target:400}
  ];
  const instructions = 'Encha uma jarra por completo na torneira, transfira água entre as jarras ou esvazie uma jarra no vaso. A transferência só termina quando a origem esvazia ou o destino fica cheio. Arraste a jarra ou selecione-a e depois toque no destino. 1 litro equivale a 1.000 mililitros. Os movimentos são livres. Confirme quando atingir a meta: você tem duas tentativas por questão. Recomeçar as jarras não recupera uma tentativa usada.';
  const challenge = {
    title:'Desafio 14 — Desafio da jarra',
    missions:[{
      title:'Desafio da jarra',intro:`Resolva as 10 questões de medição. ${instructions}`,
      questions:levels.map((level,index) => ({
        id:`d14m1q${index + 1}`,type:'jar-transfer',...level,
        text:`Coloque exatamente ${level.target} mL na jarra de ${capacityLabel(level.capacities[2])}.`,
        spokenText:`Coloque exatamente ${level.target} mililitros na maior jarra, de ${level.capacities[2]} mililitros. Você tem três jarras, de ${level.capacities.join(', ')} mililitros. ${instructions}`,
        correct:`MUITO BEM! Você colocou exatamente ${level.target} mL na jarra de ${capacityLabel(level.capacities[2])}.`,
        incorrect:'Confira a quantidade na maior jarra e tente outra sequência de transferências.'
      }))
    }]
  };
  const isType = question => question?.type === 'jar-transfer';

  function validVolumes(question,volumes) {
    return Array.isArray(volumes) && volumes.length === question.capacities.length &&
      volumes.every((volume,index) => Number.isInteger(volume) && volume >= 0 && volume <= question.capacities[index]);
  }

  // Todas as ações trabalham em mL inteiros; nunca há enchimento ou transferência parcial livre.
  function applyAction(question,volumes,action) {
    if (!validVolumes(question,volumes)) return {changed:false,message:'Quantidade de água inválida.'};
    const {kind,from,to} = action || {};
    if (!Number.isInteger(from) || from < 0 || from >= volumes.length) return {changed:false,message:'Selecione uma jarra primeiro.'};
    const next = [...volumes];
    if (kind === 'fill') {
      if (next[from] === question.capacities[from]) return {changed:false,message:'Essa jarra já está cheia.'};
      next[from] = question.capacities[from];
    } else if (kind === 'empty') {
      if (next[from] === 0) return {changed:false,message:'Essa jarra já está vazia.'};
      next[from] = 0;
    } else if (kind === 'pour') {
      if (!Number.isInteger(to) || to < 0 || to >= volumes.length || to === from) return {changed:false,message:'Escolha outra jarra para receber a água.'};
      if (next[from] === 0) return {changed:false,message:'A jarra de origem está vazia.'};
      const room = question.capacities[to] - next[to];
      if (room === 0) return {changed:false,message:'A jarra de destino já está cheia.'};
      const transferred = Math.min(next[from],room);
      next[from] -= transferred; next[to] += transferred;
    } else return {changed:false,message:'Ação inválida.'};
    return {changed:true,volumes:next};
  }

  function evaluate(question,volumes) {
    if (!validVolumes(question,volumes)) return {complete:false,correct:false,message:'Confira as quantidades de água.'};
    const correct = volumes[2] === question.target;
    return {complete:true,correct,message:correct ? question.correct :
      `Há ${volumes[2]} mL na jarra de ${capacityLabel(question.capacities[2])}; a meta é ${question.target} mL. Você tem mais uma tentativa. Use a diferença entre as capacidades das jarras.`};
  }

  // Busca em largura: uma solução a partir das três jarras vazias, apresentada após o segundo erro.
  function solve(question) {
    const actions = question.capacities.flatMap((_,from) => [
      {kind:'fill',from},{kind:'empty',from},
      ...question.capacities.flatMap((_,to) => from === to ? [] : [{kind:'pour',from,to}])
    ]);
    const queue = [{volumes:[0,0,0],previous:null,action:null}],seen = new Set(['0,0,0']);
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const node = queue[cursor];
      if (node.volumes[2] === question.target) {
        const solution = [];
        for (let current = node; current.action; current = current.previous) solution.unshift(current.action);
        return solution;
      }
      for (const action of actions) {
        const result = applyAction(question,node.volumes,action);
        if (!result.changed || seen.has(result.volumes.join(','))) continue;
        seen.add(result.volumes.join(','));
        queue.push({volumes:result.volumes,previous:node,action});
      }
    }
    return null;
  }

  function describeAction(question,action) {
    const source = capacityLabel(question.capacities[action.from]);
    if (action.kind === 'fill') return `Encha a jarra de ${source} na torneira.`;
    if (action.kind === 'empty') return `Esvazie a jarra de ${source} no vaso.`;
    return `Transfira da jarra de ${source} para a de ${capacityLabel(question.capacities[action.to])}.`;
  }

  let state = null,drag = null;
  const artRoot = 'assets/imagens/questoes/3-ano/desafio-14/missao-1';
  const waterBottom = 1300,waterHeight = 1000;

  function jarMarkup(question,index) {
    const capacity = question.capacities[index],key = `${question.id}-${index}`;
    return `<article class="jar-station ${index === 2 ? 'jar-station--goal' : ''}" data-jar-station="${index}" style="--jar-ratio:${.65 + .35 * capacity / question.capacities[2]}">
      <button class="jar-piece" type="button" data-jar="${index}" aria-pressed="false" aria-describedby="jar-selection-help">
        <svg class="jar-art" viewBox="0 0 1024 1536" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="jar-water-${key}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7ce5ff"/><stop offset=".45" stop-color="#2cc3ef"/><stop offset="1" stop-color="#078ac8"/></linearGradient>
            <clipPath id="jar-clip-${key}"><path d="M190 285 L670 285 C640 400 652 555 677 725 L728 1165 Q733 1248 690 1285 Q443 1335 180 1290 Q130 1260 134 1190 C134 1000 142 800 170 665 C217 500 220 400 190 285Z"/></clipPath>
          </defs>
          <g clip-path="url(#jar-clip-${key})">
            <rect data-jar-water x="100" y="${waterBottom}" width="650" height="0" fill="url(#jar-water-${key})"/>
            <ellipse data-jar-surface cx="430" cy="${waterBottom}" rx="320" ry="23" fill="#a4efff" fill-opacity=".8" opacity="0"/>
          </g>
          <image class="jar-generated-art" href="${artRoot}/jarra-3d.png" width="1024" height="1536"/>
          ${index === 2 ? `<path data-jar-target d="M145 ${waterBottom - waterHeight * question.target / capacity} H720" clip-path="url(#jar-clip-${key})" stroke="#a0006d" stroke-width="12" stroke-dasharray="28 20"/>` : ''}
          <rect x="225" y="700" width="430" height="150" rx="38" fill="#fff" fill-opacity=".95" stroke="#c3d9f5" stroke-width="9"/>
          <text x="440" y="803" text-anchor="middle" fill="#071c63" font-size="92" font-weight="700">${capacityLabel(capacity)}</text>
        </svg>
      </button>
    </article>`;
  }

  function render(question,container,callbacks={}) {
    clear();
    state = {question,root:container,callbacks,volumes:[0,0,0],moves:0,selected:null,locked:false,feedback:'',lastResult:null,suppressClick:false};
    container.classList.add('jar-activity');
    container.innerHTML = `<div class="jar-game">
      <div class="jar-toolbar"><span class="jar-moves">Movimentos: <b data-jar-moves>0</b></span><button type="button" data-jar-reset>↻ Recomeçar jarras</button></div>
      <p class="jar-instructions">Arraste uma jarra até o destino ou selecione a jarra e depois toque no destino.</p>
      <div class="jar-workbench">
        <button type="button" class="jar-zone jar-faucet" data-jar-zone="fill" aria-label="Torneira: encher completamente a jarra selecionada"><span>TORNEIRA</span><img src="${artRoot}/torneira-3d.png" alt="" draggable="false"><small>Encher por completo</small></button>
        <div class="jar-row">${question.capacities.map((_,index) => jarMarkup(question,index)).join('')}</div>
        <button type="button" class="jar-zone jar-flowers" data-jar-zone="empty" aria-label="Vaso de flores: esvaziar a jarra selecionada"><span>VASO</span><img src="${artRoot}/vaso-3d.png" alt="" draggable="false"><small>Esvaziar a jarra</small></button>
      </div>
      <span class="jar-status" id="jar-selection-help" data-jar-message role="status" aria-live="polite"></span>
      <details class="jar-solution" data-jar-solution hidden><summary>Como resolver esta questão</summary><p>Comece com as três jarras vazias.</p><ol></ol></details>
    </div>`;
    container.addEventListener('click',handleClick);
    container.addEventListener('keydown',handleKeydown);
    container.addEventListener('pointerdown',startDrag);
    refresh();
  }

  function message(copy) { if (state) state.root.querySelector('[data-jar-message]').textContent = copy; }

  function refresh() {
    if (!state) return;
    const {question,root,volumes,selected,locked} = state;
    root.querySelectorAll('[data-jar-station]').forEach(station => {
      const index = Number(station.dataset.jarStation),button = station.querySelector('[data-jar]');
      button.disabled = locked;
      button.setAttribute('aria-label',`Jarra de ${capacityLabel(question.capacities[index])}, com ${volumes[index]} mL${index === 2 ? `, alvo de ${question.target} mL` : ''}`);
      button.setAttribute('aria-pressed',String(selected === index));
      station.classList.toggle('is-selected',selected === index);
      const water = station.querySelector('[data-jar-water]'),surface = station.querySelector('[data-jar-surface]');
      const height = waterHeight * volumes[index] / question.capacities[index];
      water.setAttribute('y',waterBottom - height); water.setAttribute('height',height);
      surface.setAttribute('cy',waterBottom - height); surface.setAttribute('opacity',volumes[index] ? '1' : '0');
    });
    root.querySelector('[data-jar-moves]').textContent = state.moves;
    root.querySelectorAll('[data-jar-zone],[data-jar-reset]').forEach(button => { button.disabled = locked; });
    state.callbacks.onReady?.(!locked && state.moves > 0);
  }

  function act(action) {
    if (!state || state.locked) return false;
    const result = applyAction(state.question,state.volumes,action);
    if (!result.changed) { message(result.message); return false; }
    state.volumes = result.volumes; state.moves++; state.selected = null;
    state.feedback = ''; state.lastResult = null;
    state.root.querySelector('.jar-game').classList.remove('is-correct','is-wrong');
    state.callbacks.onChange?.();
    message(`Água nas jarras: ${state.volumes.map(volume => `${volume} mL`).join(', ')}.`);
    refresh(); return true;
  }

  function handleClick(event) {
    if (!state || !state.root.contains(event.target)) return;
    if (state.suppressClick) { state.suppressClick = false; return; }
    if (state.locked) return;
    if (event.target.closest('[data-jar-reset]')) {
      cancelDrag(); state.volumes = [0,0,0]; state.moves = 0; state.selected = null;
      state.feedback = ''; state.lastResult = null;
      state.root.querySelector('.jar-game').classList.remove('is-correct','is-wrong');
      state.callbacks.onChange?.(); message('Jarras vazias. As tentativas de confirmação já usadas continuam contando.'); refresh(); return;
    }
    const jar = event.target.closest('[data-jar]');
    if (jar) {
      const index = Number(jar.dataset.jar);
      if (state.selected === null) {
        state.selected = index;
        message(`Jarra de ${capacityLabel(state.question.capacities[index])} selecionada. Escolha a torneira, outra jarra ou o vaso.`);
      } else if (state.selected === index) { state.selected = null; message('Seleção desfeita.'); }
      else act({kind:'pour',from:state.selected,to:index});
      refresh(); return;
    }
    const zone = event.target.closest('[data-jar-zone]');
    if (zone) act({kind:zone.dataset.jarZone,from:state.selected});
  }

  function handleKeydown(event) {
    // Preserve a ativação nativa por Enter/espaço sem acionar o atalho global de próxima questão.
    if (!state || !state.root.contains(event.target)) return;
    if (event.key === 'Escape') { cancelDrag(); state.selected = null; message('Seleção desfeita.'); refresh(); }
    if (['Enter',' ','Escape'].includes(event.key)) event.stopPropagation();
  }

  function markTarget(x,y) {
    if (!state) return null;
    let target = null;
    state.root.querySelectorAll('[data-jar-zone],[data-jar-station]').forEach(element => {
      const rect = element.getBoundingClientRect();
      const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom && element.dataset.jarStation !== String(drag?.from);
      element.classList.toggle('is-drop-target',inside);
      if (inside) target = element;
    });
    return target;
  }

  function startDrag(event) {
    const element = event.target.closest('[data-jar]');
    if (!state || state.locked || !element || event.button !== 0 || drag) return;
    const rect = element.getBoundingClientRect();
    drag = {element,from:Number(element.dataset.jar),pointerId:event.pointerId,x:event.clientX,y:event.clientY,offsetX:event.clientX - rect.left,offsetY:event.clientY - rect.top,width:rect.width,height:rect.height,moved:false};
    element.setPointerCapture(event.pointerId);
    document.addEventListener('pointermove',moveDrag);
    document.addEventListener('pointerup',endDrag);
    document.addEventListener('pointercancel',endDrag);
  }

  function moveDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x,event.clientY - drag.y) < 7) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.ghost = drag.element.cloneNode(true);
      drag.ghost.classList.add('jar-drag-ghost'); drag.ghost.removeAttribute('data-jar');
      drag.ghost.setAttribute('aria-hidden','true'); drag.ghost.tabIndex = -1;
      // IDs de SVG únicos, inclusive na cópia que acompanha o ponteiro.
      drag.ghost.innerHTML = drag.ghost.innerHTML.replaceAll(state.question.id,`${state.question.id}-ghost`);
      Object.assign(drag.ghost.style,{width:`${drag.width}px`,height:`${drag.height}px`});
      document.body.appendChild(drag.ghost); drag.element.classList.add('is-dragging');
    }
    event.preventDefault();
    drag.ghost.style.left = `${event.clientX - drag.offsetX}px`; drag.ghost.style.top = `${event.clientY - drag.offsetY}px`;
    markTarget(event.clientX,event.clientY);
  }

  function endDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = drag,target = current.moved && event.type === 'pointerup' ? markTarget(event.clientX,event.clientY) : null;
    cancelDrag();
    if (!current.moved || !state) return;
    state.suppressClick = true;
    // O clique sintético termina no mesmo ciclo; um clique posterior deve funcionar normalmente.
    setTimeout(() => { if (state) state.suppressClick = false; },0);
    if (event.type === 'pointercancel') return;
    if (target?.dataset.jarZone) act({kind:target.dataset.jarZone,from:current.from});
    else if (target?.dataset.jarStation) act({kind:'pour',from:current.from,to:Number(target.dataset.jarStation)});
    else message('Leve a jarra até a torneira, outra jarra ou o vaso.');
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
    if (!state || state.locked || drag?.moved || state.moves === 0) return null;
    cancelDrag();
    const result = evaluate(state.question,state.volumes);
    state.lastResult = result; state.feedback = result.message;
    state.root.querySelector('.jar-game').classList.toggle('is-correct',result.correct);
    state.root.querySelector('.jar-game').classList.toggle('is-wrong',!result.correct);
    return result;
  }

  function lock() {
    if (!state) return;
    cancelDrag(); state.locked = true; state.selected = null;
    if (state.lastResult && !state.lastResult.correct) {
      const {question} = state,solution = state.root.querySelector('[data-jar-solution]');
      solution.hidden = false;
      solution.querySelector('ol').innerHTML = (solve(question) || []).map(action => `<li>${describeAction(question,action)}</li>`).join('');
      state.feedback = `As duas tentativas terminaram. Há ${state.volumes[2]} mL na jarra de ${capacityLabel(question.capacities[2])}; a meta era ${question.target} mL. Veja “Como resolver esta questão”.`;
    }
    refresh();
  }

  function clear() {
    cancelDrag();
    if (state) {
      state.root.removeEventListener('click',handleClick);
      state.root.removeEventListener('keydown',handleKeydown);
      state.root.removeEventListener('pointerdown',startDrag);
    }
    state = null;
  }

  return {challenge,isType,capacityLabel,applyAction,evaluate,solve,describeAction,render,submit,lock,clear,
    get feedback() { return state?.feedback || ''; }};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = jarMissions;
