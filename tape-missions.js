const tapeMissions = (() => {
  const ribbon = (id,value,color,edge) => ({id,value,color,edge});
  // Peças, personagens e ordem das dez atividades de Quanto mede?.
  const levels = [
    {character:'Aninha',item:'fita',ribbons:[ribbon('rose-20',20,'#bc0b65','#ee8cbd'),ribbon('blue-50',50,'#4d8ede','#9bc5fb'),ribbon('red-30',30,'#ff353b','#ff999c'),ribbon('yellow-40',40,'#ffc95e','#ffe49a')]},
    {character:'Caio',item:'barbante',ribbons:[ribbon('teal-15',15,'#18a9a4','#92e1dd'),ribbon('purple-25',25,'#7455c7','#c0aff1'),ribbon('orange-60',60,'#f57b35','#ffc49f'),ribbon('green-35',35,'#47a85d','#a8dcb4'),ribbon('pink-45',45,'#e94c8b','#f7afd0')]},
    {character:'Bia',item:'cordão',ribbons:[ribbon('navy-25',25,'#3c6fba','#a5c5f3'),ribbon('coral-35',35,'#ee6552','#ffc0b7'),ribbon('sun-40',40,'#e6a420','#f8db80'),ribbon('mint-45',45,'#2fa97a','#9be0c5'),ribbon('plum-55',55,'#9a469f','#d6a5d9')]},
    {character:'Davi',item:'corda',ribbons:[ribbon('aqua-15',15,'#169ca1','#8edcdf'),ribbon('tangerine-30',30,'#ec6f32','#ffb58e'),ribbon('indigo-55',55,'#5364c7','#adb7f1'),ribbon('lime-40',40,'#72ad39','#c4e59e')]},
    {character:'Luiza',item:'fita decorativa',ribbons:[ribbon('berry-20',20,'#b62d6f','#ee9fc6'),ribbon('ocean-35',35,'#287db4','#94c8e9'),ribbon('apricot-45',45,'#ef8b3c','#ffd0a2'),ribbon('violet-60',60,'#7254b5','#bfaee8'),ribbon('leaf-25',25,'#3b9a62','#9fd2b4')]},
    {character:'Miguel',item:'faixa',ribbons:[ribbon('gold-10',10,'#d59b1c','#f6d87b'),ribbon('cobalt-25',25,'#336fc2','#9abcee'),ribbon('magenta-65',65,'#bd327f','#eda7ce'),ribbon('forest-45',45,'#34855b','#9ac7ad')]},
    {character:'Helena',item:'barbante',ribbons:[ribbon('brick-30',30,'#d14a3b','#f1a79f'),ribbon('sky-45',45,'#4b91d1','#acd2f1'),ribbon('mustard-25',25,'#d4a21e','#f2d47d'),ribbon('lavender-50',50,'#8268ba','#cbbce7'),ribbon('emerald-15',15,'#27956d','#92d6bc')]},
    {character:'Pedro',item:'fita de cetim',ribbons:[ribbon('purple-20',20,'#8b4cad','#d0a9e2'),ribbon('blue-30',30,'#397fc9','#9ec6ef'),ribbon('coral-55',55,'#df5f50','#f7b3aa'),ribbon('yellow-15',15,'#dba624','#f5da82'),ribbon('green-40',40,'#459654','#a8d3ae')]},
    {character:'Sofia',item:'cordão',ribbons:[ribbon('pink-25',25,'#d6488b','#f2abd0'),ribbon('teal-40',40,'#208c92','#91ced1'),ribbon('orange-35',35,'#e77631','#f6b58d'),ribbon('navy-50',50,'#405eaa','#a9b9e3')]},
    {character:'Theo',item:'fita para sua pipa',ribbons:[ribbon('mint-15',15,'#2b9f79','#9edac4'),ribbon('red-20',20,'#dc4747','#f4a5a5'),ribbon('blue-30-final',30,'#3c7fc8','#a3c9ef'),ribbon('amber-45',45,'#df9524','#f4cf87'),ribbon('plum-65',65,'#8c438e','#cfa5d0')]}
  ];
  const mission = {
    title:'Quanto mede?',
    intro:'Junte peças para completar exatamente 1 metro, que equivale a 100 centímetros. Arraste as peças para a área de montagem ou toque nelas para adicionar. Toque numa peça montada para retirá-la. Cada peça só pode ser usada uma vez por questão. Há 10 questões e duas tentativas de confirmação em cada uma. Recomeçar a montagem não recupera uma tentativa usada.',
    questions:levels.map((level,index) => ({
      id:`d14m2q${index + 1}`,type:'tape-assembly',...level,target:100,
      text:`${level.character} precisa de 1 metro de ${level.item}. Junte as peças até completar essa medida.`,
      spokenText:`${level.character} precisa de 1 metro de ${level.item}. Um metro equivale a 100 centímetros. As peças disponíveis medem ${level.ribbons.map(piece => piece.value).join(', ')} centímetros. Cada peça só pode ser usada uma vez. Arraste ou toque nas peças para montar a medida e depois confirme.`,
      correct:'MUITO BEM! Você completou exatamente 1 metro, que equivale a 100 cm.',
      incorrect:'Some as medidas das peças e complete exatamente 100 cm.'
    }))
  };
  const isType = question => question?.type === 'tape-assembly';

  function evaluate(question,ids) {
    if (!Array.isArray(ids) || ids.length === 0) return {complete:false,correct:false,message:'Adicione pelo menos uma peça antes de confirmar.'};
    const pieces = ids.map(id => question.ribbons.find(piece => piece.id === id));
    if (new Set(ids).size !== ids.length || pieces.some(piece => !piece)) return {complete:false,correct:false,message:'Use apenas as peças disponíveis, uma vez cada.'};
    const total = pieces.reduce((sum,piece) => sum + piece.value,0),correct = total === question.target;
    const difference = Math.abs(total - question.target);
    return {complete:true,correct,total,message:correct ? question.correct : total < question.target
      ? `Você montou ${total} cm. Faltam ${difference} cm para completar 1 metro. Você tem mais uma tentativa.`
      : `Você montou ${total} cm. Passou ${difference} cm de 1 metro. Retire ou troque peças. Você tem mais uma tentativa.`};
  }

  function solutions(question) {
    const matches = [];
    for (let mask = 1; mask < 2 ** question.ribbons.length; mask++) {
      const pieces = question.ribbons.filter((_,index) => mask & (1 << index));
      if (pieces.reduce((sum,piece) => sum + piece.value,0) === question.target) matches.push(pieces.map(piece => piece.id));
    }
    return matches;
  }

  function resolution(question) {
    const ids = solutions(question)[0];
    return ids ? `${ids.map(id => question.ribbons.find(piece => piece.id === id).value).join(' + ')} = ${question.target} cm = 1 metro.` : '';
  }

  let state = null,drag = null;
  const pieceStyle = piece => `--tape-color:${piece.color};--tape-edge:${piece.edge};--tape-size:${62 + piece.value * 1.5}px`;
  const pieceLabel = piece => `<span>${piece.value}<small>cm</small></span>`;

  function render(question,container,callbacks={}) {
    clear();
    state = {question,root:container,callbacks,assembled:[],locked:false,feedback:'',lastResult:null,suppressClick:false};
    container.classList.add('tape-activity');
    container.innerHTML = `<div class="tape-game">
      <div class="tape-toolbar"><span>Medida montada: <strong data-tape-total>0 cm</strong></span><button type="button" data-tape-reset>↻ Recomeçar</button></div>
      <div class="tape-board" data-tape-assembly role="group" aria-label="Área de montagem">
        <div class="tape-viewport"><div class="tape-canvas" data-tape-canvas>
          <div class="tape-track" data-tape-track></div><div class="tape-scale" data-tape-scale aria-hidden="true"></div>
        </div></div>
      </div>
      <div class="tape-tray-heading"><span>PEÇAS DISPONÍVEIS</span><small>Toque ou arraste para adicionar. Toque na peça montada para retirar.</small></div>
      <div class="tape-tray" data-tape-tray role="group" aria-label="Peças disponíveis">${question.ribbons.map(piece => `<button class="tape-piece" type="button" data-tape-piece="${piece.id}" style="${pieceStyle(piece)}" aria-label="Adicionar peça de ${piece.value} centímetros">${pieceLabel(piece)}</button>`).join('')}</div>
      <span class="tape-status" data-tape-status role="status" aria-live="polite"></span>
    </div>`;
    container.addEventListener('click',handleClick);
    container.addEventListener('keydown',handleKeydown);
    container.addEventListener('pointerdown',startDrag);
    refresh();
  }

  function refresh() {
    if (!state) return;
    const {question,root,assembled,locked} = state;
    const pieces = assembled.map(id => question.ribbons.find(piece => piece.id === id));
    const total = pieces.reduce((sum,piece) => sum + piece.value,0),extent = Math.max(question.target,total);
    root.querySelector('[data-tape-total]').textContent = `${total} cm`;
    root.querySelector('[data-tape-assembly]').setAttribute('aria-label',`Área de montagem com ${total} centímetros`);
    root.querySelector('[data-tape-canvas]').style.width = `${extent}%`;
    root.querySelector('[data-tape-track]').innerHTML = pieces.length ? pieces.map(piece => `<button class="tape-piece tape-placed" type="button" data-tape-placed="${piece.id}" style="${pieceStyle(piece)};width:${piece.value / extent * 100}%" aria-label="Retirar peça de ${piece.value} centímetros" ${locked ? 'disabled' : ''}>${pieceLabel(piece)}</button>`).join('') : '<span class="tape-empty">↓ Arraste as peças para cá</span>';
    root.querySelector('[data-tape-scale]').innerHTML = Array.from({length:Math.floor(extent / 5) + 1},(_,index) => {
      const value = index * 5,position = value / extent * 100;
      return `<i class="${value % 25 === 0 ? 'tape-tick-major' : ''}" style="left:${position}%">${value % 25 === 0 ? `<span>${value}${value === 100 ? ' cm' : ''}</span>` : ''}</i>`;
    }).join('');
    root.querySelectorAll('[data-tape-piece]').forEach(button => {
      const used = assembled.includes(button.dataset.tapePiece),piece = question.ribbons.find(piece => piece.id === button.dataset.tapePiece);
      button.disabled = locked || used; button.classList.toggle('is-used',used);
      button.setAttribute('aria-label',`${used ? 'Peça já usada' : 'Adicionar peça'} de ${piece.value} centímetros`);
    });
    root.querySelector('[data-tape-reset]').disabled = locked || assembled.length === 0;
    state.callbacks.onReady?.(!locked && assembled.length > 0);
  }

  function change(id,remove=false) {
    if (!state || state.locked) return false;
    const piece = state.question.ribbons.find(piece => piece.id === id),used = state.assembled.includes(id);
    if (!piece || (remove ? !used : used)) return false;
    if (remove) state.assembled = state.assembled.filter(value => value !== id);
    else state.assembled.push(id);
    state.feedback = ''; state.lastResult = null;
    state.root.querySelector('.tape-game').classList.remove('is-correct','is-wrong');
    state.root.querySelector('[data-tape-status]').textContent = `Peça de ${piece.value} cm ${remove ? 'retirada' : 'adicionada'}.`;
    state.callbacks.onChange?.(); refresh(); return true;
  }

  function handleClick(event) {
    if (!state || !state.root.contains(event.target)) return;
    if (state.suppressClick) { state.suppressClick = false; if (event.detail > 0) return; }
    if (state.locked) return;
    const piece = event.target.closest('[data-tape-piece]'),placed = event.target.closest('[data-tape-placed]');
    if (piece && !piece.disabled) change(piece.dataset.tapePiece);
    else if (placed && !placed.disabled) {
      const id = placed.dataset.tapePlaced;
      change(id,true);
      if (event.detail === 0) state.root.querySelector(`[data-tape-piece="${id}"]`)?.focus();
    } else if (event.target.closest('[data-tape-reset]')) {
      cancelDrag(); state.assembled = []; state.feedback = ''; state.lastResult = null;
      state.root.querySelector('.tape-game').classList.remove('is-correct','is-wrong');
      state.callbacks.onChange?.(); refresh();
      state.root.querySelector('[data-tape-status]').textContent = 'Montagem reiniciada. As tentativas de confirmação já usadas continuam contando.';
    }
  }

  function handleKeydown(event) {
    if (!state || !state.root.contains(event.target)) return;
    if (event.key === 'Escape') cancelDrag();
    if (['Enter',' ','Escape'].includes(event.key)) event.stopPropagation();
  }

  function startDrag(event) {
    if (state && !drag) state.suppressClick = false;
    const element = event.target.closest('[data-tape-piece],[data-tape-placed]');
    if (!state || state.locked || !element || element.disabled || event.button !== 0 || drag) return;
    const rect = element.getBoundingClientRect();
    drag = {element,id:element.dataset.tapePiece || element.dataset.tapePlaced,remove:Boolean(element.dataset.tapePlaced),pointerId:event.pointerId,x:event.clientX,y:event.clientY,offsetX:event.clientX - rect.left,offsetY:event.clientY - rect.top,width:rect.width,height:rect.height,moved:false};
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
      drag.ghost.classList.add('tape-drag-ghost');
      drag.ghost.removeAttribute('data-tape-piece'); drag.ghost.removeAttribute('data-tape-placed');
      drag.ghost.setAttribute('aria-hidden','true'); drag.ghost.tabIndex = -1;
      Object.assign(drag.ghost.style,{width:`${drag.width}px`,height:`${drag.height}px`});
      document.body.appendChild(drag.ghost); drag.element.classList.add('is-dragging');
    }
    event.preventDefault();
    drag.ghost.style.left = `${event.clientX - drag.offsetX}px`; drag.ghost.style.top = `${event.clientY - drag.offsetY}px`;
    const target = document.elementFromPoint(event.clientX,event.clientY);
    state.root.querySelector('[data-tape-assembly]').classList.toggle('is-drop-target',!drag.remove && Boolean(target?.closest('[data-tape-assembly]')));
    state.root.querySelector('[data-tape-tray]').classList.toggle('is-drop-target',drag.remove && Boolean(target?.closest('[data-tape-tray]')));
  }

  function endDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = drag,target = event.type === 'pointerup' ? document.elementFromPoint(event.clientX,event.clientY) : null;
    const accepted = current.remove ? target?.closest('[data-tape-tray]') : target?.closest('[data-tape-assembly]');
    cancelDrag();
    if (!current.moved || !state) return;
    state.suppressClick = true;
    if (accepted && state.root.contains(accepted)) change(current.id,current.remove);
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
    const result = evaluate(state.question,state.assembled);
    state.lastResult = result; state.feedback = result.message;
    if (result.complete) {
      state.root.querySelector('.tape-game').classList.toggle('is-correct',result.correct);
      state.root.querySelector('.tape-game').classList.toggle('is-wrong',!result.correct);
    }
    return result;
  }

  function lock() {
    if (!state) return;
    cancelDrag(); state.locked = true;
    if (state.lastResult && !state.lastResult.correct) {
      state.feedback = `As duas tentativas terminaram. Uma combinação possível é: ${resolution(state.question)}`;
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

  return {mission,isType,evaluate,solutions,resolution,render,submit,lock,clear,
    get feedback() { return state?.feedback || ''; }};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = tapeMissions;
