const crossOperations = (() => {
  const symbols = {addition:'+',subtraction:'−',multiplication:'×'};
  const operationNames = {addition:'adição',subtraction:'subtração',multiplication:'multiplicação'};
  const calculate = (operation,a,b) => operation === 'addition' ? a + b : operation === 'subtraction' ? a - b : a * b;
  const blanks = ['b','d','g','h','k'];
  // Os resultados C e E são compartilhados pelas contas horizontais e verticais.
  const cells = [
    ['a',0,0],['op',0,1],['b',0,2],['eq',0,3],['c',0,4],
    ['op',1,4],['d',2,4],['eq',3,4],
    ['f',4,0],['op',4,1],['g',4,2],['eq',4,3],['e',4,4],['op',4,5],['h',4,6],['eq',4,7],['i',4,8],
    ['op',5,4],['j',6,4],['eq',7,4],['k',8,4]
  ];
  const equations = [
    {keys:['a','b','c'],direction:'horizontal'},
    {keys:['c','d','e'],direction:'vertical'},
    {keys:['f','g','e'],direction:'horizontal'},
    {keys:['e','h','i'],direction:'horizontal'},
    {keys:['e','j','k'],direction:'vertical'}
  ];
  const seeds = {
    addition:[
      [4,4,5,6,2,5],[2,3,4,5,6,2],[7,2,1,4,3,6],[3,5,6,8,4,3],[5,6,2,9,5,4],
      [6,1,5,7,8,3],[1,8,7,6,2,4],[0,6,4,3,7,9],[8,3,6,12,1,2],[9,4,5,10,2,1]
    ],
    subtraction:[
      [18,4,5,16,3,2],[20,5,3,18,4,2],[15,3,4,13,5,1],[17,6,2,14,3,5],[16,2,7,12,4,6],
      [19,8,5,10,2,3],[14,4,6,9,1,4],[13,5,3,11,5,2],[12,0,4,15,6,7],[20,7,2,19,8,9]
    ],
    multiplication:[
      [1,2,2,2,5,3],[2,2,1,1,4,5],[3,1,1,1,3,4],[4,1,1,2,5,10],[5,1,2,2,4,5],
      [2,5,1,5,3,10],[1,5,1,1,2,4],[10,1,1,10,0,3],[1,1,1,1,10,0],[2,1,0,4,5,10]
    ]
  };

  function createQuestion(operation,seed,index,mission) {
    const [a,b,d,f,h,j] = seed,c = calculate(operation,a,b),e = calculate(operation,c,d);
    const g = operation === 'addition' ? e - f : operation === 'subtraction' ? f - e : e / f;
    const solution = {a,b,c,d,e,f,g,h,i:calculate(operation,e,h),j,k:calculate(operation,e,j)};
    const answers = blanks.map(key => solution[key]);
    // Mantém o banco do exemplo e varia a ordem nas outras questões.
    const order = index === 0 ? [0,1,2,3,4] : [3,0,4,2,1].map(id => (id + index) % 5);
    const numbers = order.map(id => answers[id]);
    const givens = Object.fromEntries(Object.entries(solution).filter(([key]) => !blanks.includes(key)));
    const word = {addition:'mais',subtraction:'menos',multiplication:'vezes'}[operation];
    const describe = key => blanks.includes(key) ? `quadrinho ${blanks.indexOf(key) + 1}` : String(givens[key]);
    return {
      id:`d15m${mission}-cruza-q${index + 1}`,type:'cross-operations',operation,givens,numbers,
      text:'Complete a cruzadinha com os números abaixo, de modo que todas as operações fiquem corretas.',
      spokenText:`Complete a cruzadinha de ${operationNames[operation]}. Arraste os números ou toque no quadrinho e depois no número. ${equations.map(({keys:[left,right,result],direction}) => `Na ${direction}: ${describe(left)} ${word} ${describe(right)} é igual a ${describe(result)}.`).join(' ')} Números disponíveis: ${numbers.join(', ')}.`,
      correct:'Você acertou! Todas as operações da cruzadinha estão corretas.'
    };
  }

  const challenge = {
    title:'Desafio 15 — Cruza operações',
    missions:[
      {title:'Adição',operation:'addition',limit:'Todos os resultados são de até 20.'},
      {title:'Subtração',operation:'subtraction',limit:'Todas as contas começam com um número de até 20.'},
      {title:'Multiplicação',operation:'multiplication',limit:'Use os fatos do 0, 1, 2, 3, 4, 5 e 10.'}
    ].map(({title,operation,limit},index) => ({
      title,
      intro:`Complete 10 cruzadinhas de ${operationNames[operation]}. Cada cruzadinha tem cinco quadrinhos vazios. Arraste cada número até um quadrinho ou toque no quadrinho e depois no número. Observe as contas na horizontal e na vertical: os números dos cruzamentos participam das duas direções. ${limit} Use todas as peças uma vez e confira sua resposta. Você tem duas tentativas por questão.`,
      questions:seeds[operation].map((seed,questionIndex) => createQuestion(operation,seed,questionIndex,index + 1))
    }))
  };

  function valuesFor(question,placements) {
    return {...question.givens,...Object.fromEntries(blanks.map((key,index) => [key,question.numbers[placements[index]]]))};
  }

  function evaluate(question,placements) {
    if (!Array.isArray(placements) || placements.length !== blanks.length || placements.some(id => !Number.isInteger(id) || id < 0 || id >= question.numbers.length) || new Set(placements).size !== blanks.length) {
      return {complete:false,correct:false,message:'Coloque todos os números nos cinco quadrinhos antes de conferir.'};
    }
    const values = valuesFor(question,placements);
    const wrong = equations.find(({keys:[a,b,c]}) => calculate(question.operation,values[a],values[b]) !== values[c]);
    if (!wrong) return {complete:true,correct:true,values,message:question.correct};
    const [a,b,c] = wrong.keys;
    return {complete:true,correct:false,values,message:`Na ${wrong.direction}, ${values[a]} ${symbols[question.operation]} ${values[b]} dá ${calculate(question.operation,values[a],values[b])}, e o resultado no quadro é ${values[c]}. Troque os números e confira as duas direções.`};
  }

  function solutions(question) {
    const matches = [];
    const visit = order => {
      if (order.length === question.numbers.length) {
        if (evaluate(question,order).correct) matches.push(order);
        return;
      }
      question.numbers.forEach((_,id) => { if (!order.includes(id)) visit([...order,id]); });
    };
    visit([]);
    return matches;
  }

  function resolution(question) {
    const values = valuesFor(question,solutions(question)[0]);
    return equations.map(({keys:[a,b,c]}) => `${values[a]} ${symbols[question.operation]} ${values[b]} = ${values[c]}`).join('; ') + '.';
  }

  let state = null,drag = null,touchTap = null;
  const isType = question => question?.type === 'cross-operations';

  function render(question,container,callbacks={}) {
    clear();
    state = {question,root:container,callbacks,placements:Array(blanks.length).fill(null),selectedSlot:null,selectedToken:null,locked:false,feedback:'',lastResult:null,suppressClick:false};
    container.classList.add('cross-activity');
    const cellMarkup = cells.map(([key,row,column]) => {
      const position = `style="grid-row:${row + 1};grid-column:${column + 1}"`;
      if (key === 'op' || key === 'eq') return `<span class="cross-sign" ${position} aria-hidden="true">${key === 'op' ? symbols[question.operation] : '='}</span>`;
      const slot = blanks.indexOf(key);
      return slot >= 0
        ? `<button type="button" class="cross-slot" ${position} data-cross-slot="${slot}" aria-label="Quadrinho ${slot + 1}, vazio" aria-pressed="false"><small aria-hidden="true">${slot + 1}</small><strong data-cross-value></strong></button>`
        : `<span class="cross-fixed" ${position} aria-label="Número fixo ${question.givens[key]}">${question.givens[key]}</span>`;
    }).join('');
    container.innerHTML = `<div class="cross-game">
      <div class="cross-board" role="group" aria-label="Cruzadinha de ${operationNames[question.operation]}: três contas horizontais e duas verticais">${cellMarkup}</div>
      <div class="cross-controls"><div class="cross-instructions"><span>CRUZA OPERAÇÕES</span><p>Arraste o número até o quadrinho ou toque no quadrinho e depois no número.</p><small>Confira as contas na horizontal → e na vertical ↓.</small></div>
        <div class="cross-bank" data-cross-bank><span>NÚMEROS DISPONÍVEIS</span><div class="cross-tokens">${question.numbers.map((number,id) => `<button type="button" class="cross-token" data-cross-token="${id}" aria-label="Número ${number}, peça ${id + 1}" aria-pressed="false">${number}</button>`).join('')}</div><p data-cross-count>0 de 5 quadrinhos preenchidos</p></div>
        <p class="cross-help" data-cross-help role="status" aria-live="polite">Escolha um quadrinho ou um número.</p>
        <div class="cross-tools"><button type="button" data-cross-return disabled>Devolver número</button><button type="button" data-cross-reset>↻ Recomeçar</button></div>
      </div>
    </div>`;
    container.addEventListener('click',handleClick);
    container.addEventListener('keydown',handleKeydown);
    container.addEventListener('pointerdown',startDrag);
    container.addEventListener('pointermove',trackTouchTap,{passive:true});
    container.addEventListener('pointerup',finishTouchTap);
    container.addEventListener('pointercancel',cancelTouchTap);
    refresh();
  }

  function refresh() {
    if (!state) return;
    const {question,root,placements,selectedSlot,selectedToken,locked} = state;
    root.querySelectorAll('[data-cross-slot]').forEach(button => {
      const slot = Number(button.dataset.crossSlot),token = placements[slot];
      button.querySelector('[data-cross-value]').textContent = token === null ? '' : question.numbers[token];
      button.dataset.crossPlaced = token === null ? '' : String(token);
      button.classList.toggle('is-filled',token !== null);
      button.classList.toggle('is-selected',selectedSlot === slot);
      button.classList.toggle('is-ready',!locked && selectedToken !== null && selectedSlot !== slot);
      button.setAttribute('aria-label',`Quadrinho ${slot + 1}, ${token === null ? 'vazio' : `número ${question.numbers[token]}`}`);
      button.setAttribute('aria-pressed',String(selectedSlot === slot));
      button.disabled = locked;
    });
    root.querySelectorAll('[data-cross-token]').forEach(button => {
      const id = Number(button.dataset.crossToken);
      button.hidden = placements.includes(id);
      button.disabled = locked;
      button.classList.toggle('is-selected',selectedToken === id);
      button.setAttribute('aria-pressed',String(selectedToken === id));
    });
    const count = placements.filter(id => id !== null).length;
    root.querySelector('[data-cross-count]').textContent = `${count} de 5 quadrinhos preenchidos`;
    root.querySelector('[data-cross-return]').disabled = locked || selectedToken === null || !placements.includes(selectedToken);
    root.querySelector('[data-cross-reset]').disabled = locked || count === 0;
    root.querySelector('[data-cross-help]').textContent = locked ? 'Questão finalizada.'
      : selectedSlot !== null ? `Quadrinho ${selectedSlot + 1} selecionado. Toque em um número para preenchê-lo.`
      : selectedToken !== null ? `Número ${question.numbers[selectedToken]} selecionado. Escolha um quadrinho.`
      : count === 5 ? 'Todos os quadrinhos estão preenchidos. Confira sua resposta.' : 'Escolha um quadrinho ou um número.';
    state.callbacks.onReady?.(!locked && count === blanks.length);
  }

  function changed() {
    state.feedback = ''; state.lastResult = null;
    state.root.querySelector('.cross-game').classList.remove('is-correct','is-wrong');
    state.callbacks.onChange?.();
    refresh();
  }

  function place(token,slot) {
    if (!state || state.locked || !Number.isInteger(token) || token < 0 || token >= state.question.numbers.length || !Number.isInteger(slot) || slot < 0 || slot >= blanks.length) return;
    const previous = state.placements.indexOf(token),displaced = state.placements[slot];
    if (previous !== slot) {
      if (previous >= 0) state.placements[previous] = displaced;
      state.placements[slot] = token;
    }
    state.selectedSlot = null; state.selectedToken = null; changed();
  }

  function returnToken(token) {
    if (!state || state.locked) return;
    const previous = state.placements.indexOf(token);
    if (previous < 0) return;
    state.placements[previous] = null; state.selectedSlot = null; state.selectedToken = null; changed();
  }

  function handleClick(event) {
    if (!state || !state.root.contains(event.target)) return;
    if (state.suppressClick) { state.suppressClick = false; if (event.detail > 0) return; }
    if (state.locked) return;
    const slotButton = event.target.closest('[data-cross-slot]'),tokenButton = event.target.closest('[data-cross-token]');
    if (slotButton) {
      const slot = Number(slotButton.dataset.crossSlot);
      if (state.selectedToken !== null) { place(state.selectedToken,slot); return; }
      state.selectedSlot = state.selectedSlot === slot ? null : slot;
      state.selectedToken = state.selectedSlot === null ? null : state.placements[slot];
      refresh(); return;
    }
    if (tokenButton) {
      const token = Number(tokenButton.dataset.crossToken);
      if (state.selectedSlot !== null) { place(token,state.selectedSlot); return; }
      state.selectedToken = state.selectedToken === token ? null : token; refresh(); return;
    }
    if (event.target.closest('[data-cross-return]')) { returnToken(state.selectedToken); return; }
    if (event.target.closest('[data-cross-reset]')) {
      cancelDrag(); state.placements.fill(null); state.selectedSlot = null; state.selectedToken = null; changed();
    }
  }

  function handleKeydown(event) {
    if (event.key !== 'Escape' || !state?.root.contains(event.target)) return;
    event.preventDefault(); event.stopPropagation();
    cancelDrag(); state.selectedSlot = null; state.selectedToken = null; refresh();
  }

  function startDrag(event) {
    if (state && !drag) state.suppressClick = false;
    const button = event.target.closest('button');
    touchTap = event.pointerType === 'touch' && event.isPrimary && button && !button.disabled
      ? {element:button,pointerId:event.pointerId,x:event.clientX,y:event.clientY} : null;
    const element = event.target.closest('[data-cross-token],[data-cross-slot]');
    if (!state || state.locked || !element || element.disabled || event.button !== 0 || !event.isPrimary || drag) return;
    const token = element.matches('[data-cross-token]') ? Number(element.dataset.crossToken) : state.placements[Number(element.dataset.crossSlot)];
    if (token === null) return;
    drag = {element,token,pointerId:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
    element.setPointerCapture?.(event.pointerId);
    document.addEventListener('pointermove',moveDrag,{passive:false});
    document.addEventListener('pointerup',endDrag);
    document.addEventListener('pointercancel',endDrag);
  }

  function trackTouchTap(event) {
    if (touchTap?.pointerId === event.pointerId && Math.hypot(event.clientX - touchTap.x,event.clientY - touchTap.y) >= 7) touchTap = null;
  }

  function finishTouchTap(event) {
    const tap = touchTap; touchTap = null;
    if (!tap || tap.pointerId !== event.pointerId || drag?.moved || !state || state.locked || !state.root.contains(tap.element)) return;
    // Alguns navegadores deixam de emitir click depois de um arraste por toque.
    handleClick({target:tap.element,detail:0});
    state.suppressClick = true;
  }

  function cancelTouchTap() { touchTap = null; }

  function moveDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x,event.clientY - drag.y) < 7) return;
    if (!drag.moved) {
      drag.moved = true; drag.ghost = document.createElement('div');
      drag.ghost.className = 'cross-drag-ghost'; drag.ghost.textContent = state.question.numbers[drag.token];
      drag.ghost.setAttribute('aria-hidden','true'); document.body.appendChild(drag.ghost);
      drag.element.classList.add('is-dragging');
    }
    event.preventDefault();
    drag.ghost.style.left = `${event.clientX}px`; drag.ghost.style.top = `${event.clientY}px`;
    const target = document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-cross-slot],[data-cross-bank]');
    state.root.querySelectorAll('[data-cross-slot],[data-cross-bank]').forEach(zone => zone.classList.toggle('is-drop-target',zone === target));
  }

  function endDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = drag,target = event.type === 'pointerup' ? document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-cross-slot],[data-cross-bank]') : null;
    cancelDrag();
    if (!current.moved || !state) return;
    state.suppressClick = true;
    if (!target || !state.root.contains(target)) return;
    if (target.matches('[data-cross-slot]')) place(current.token,Number(target.dataset.crossSlot));
    else returnToken(current.token);
  }

  function cancelDrag() {
    if (typeof document === 'undefined') return;
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
    const result = evaluate(state.question,state.placements);
    state.lastResult = result; state.feedback = result.message;
    if (result.complete) {
      state.root.querySelector('.cross-game').classList.toggle('is-correct',result.correct);
      state.root.querySelector('.cross-game').classList.toggle('is-wrong',!result.correct);
    } else state.root.querySelector('[data-cross-help]').textContent = result.message;
    return result;
  }

  function lock() {
    if (!state) return;
    cancelDrag(); state.locked = true; state.selectedSlot = null; state.selectedToken = null;
    if (state.lastResult && !state.lastResult.correct) state.feedback = `As duas tentativas terminaram. Confira uma solução: ${resolution(state.question)}`;
    refresh();
  }

  function clear() {
    cancelDrag();
    cancelTouchTap();
    if (state) {
      state.root.removeEventListener('click',handleClick);
      state.root.removeEventListener('keydown',handleKeydown);
      state.root.removeEventListener('pointerdown',startDrag);
      state.root.removeEventListener('pointermove',trackTouchTap);
      state.root.removeEventListener('pointerup',finishTouchTap);
      state.root.removeEventListener('pointercancel',cancelTouchTap);
    }
    state = null;
  }

  return {challenge,isType,evaluate,solutions,resolution,render,submit,lock,clear,cells,equations,blanks,calculate,
    get feedback() { return state?.feedback || ''; }};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = crossOperations;
