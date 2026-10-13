const additionPuzzles = (() => {
  const triangleSides = [[0,1,3],[0,2,5],[3,4,5]];
  const trianglePositions = [[50,12],[29.5,48],[70.5,48],[9,84],[50,84],[91,84]];
  const triangleLabels = ['Vértice superior','Meio do lado esquerdo','Meio do lado direito','Vértice inferior esquerdo','Meio da base','Vértice inferior direito'];
  const triangleSets = [
    [5,[1,1,1,1,3,3]], [3,[3,0,1,1,0,2]], [4,[0,1,3,0,1,4]],
    [10,[1,3,4,9,0,6]], [12,[9,2,8,2,1,1]], [13,[11,2,0,9,11,2]],
    [null,[3,2,2,0,5,0]], [null,[1,2,2,0,3,0]],
    [null,[0,1,3,3,0,1]], [null,[3,9,8,0,11,1]]
  ];
  const squareSets = [
    [7,null,null,null,3,null,3,null,null],
    [null,4,null,4,null,null,null,null,3],
    [1,null,null,null,null,8,null,3,null],
    [null,null,7,null,1,null,0,null,null],
    [2,null,null,3,null,null,null,3,null],
    [null,6,null,null,null,0,3,null,null],
    [null,null,6,5,null,null,null,null,1],
    [2,null,null,null,7,null,null,null,0],
    [null,6,null,1,null,null,5,null,null],
    [null,null,5,null,4,null,null,5,null]
  ];
  const clickSets = [
    [[0,4,6],[7,8,9]], [[2,3,6],[5,7,8,9]], [[3,4,5],[6,7,8,9]],
    [[1,3,9],[0,7,8]], [[1,4,9],[0,3,6]], [[4,5,6],[0,1,2,3]],
    [[3,6,7],[0,1,2,4]], [[2,7,8],[0,1,3,4]], [[5,6,7],[0,1,2,3,4]],
    [[4,7,8],[0,1,2,3,5]], [[3,8,9],[0,1,2,4,5]]
  ];

  // Distratores e posições determinísticos: cada quadro tem um único trio correto.
  function clickBoard(solution,pool,index) {
    const board = Array.from({length:25},(_,cell) => pool[(cell * 7 + index) % pool.length]);
    const positions = [(index * 3 + 3) % 25,(index * 3 + 9) % 25,(index * 3 + 15) % 25];
    positions.forEach((cell,i) => { board[cell] = solution[i]; });
    return board;
  }

  const challenge = {
    title:'Desafio 3 — Quebra-cabeça: adição',
    missions:[
      {
        title:'Triângulo da soma',
        intro:'Arraste os seis números para os quadrados do triângulo. Cada lado tem três números. Nas primeiras seis questões, alcance a soma indicada; nas demais, encontre uma soma igual nos três lados.',
        questions:triangleSets.map(([target,numbers],index) => ({
          id:`d3m1-triangulo-q${index + 1}`, type:'sum-triangle', target, numbers,
          text:target === null
            ? 'Posicione os números de forma que a soma em todos os lados seja igual:'
            : `Posicione os números de forma que a soma em todos os lados seja: ${target}.`,
          correct:'MUITO BEM! Os três lados do triângulo têm a mesma soma!'
        }))
      },
      {
        title:'Quadrado da soma',
        intro:'Resolva os dez quadros, completando os espaços vazios com números de 0 a 9. Os números que já estão no quadro ficam no lugar. Todas as linhas e colunas devem somar 10, sem repetir números na mesma linha ou coluna.',
        questions:squareSets.map((givens,index) => ({
          id:`d3m2-quadrado-q${index + 1}`, type:'sum-square', target:10,
          givens,
          text:'Complete o quadro abaixo com números de 0 a 9, de forma que o resultado em todas as linhas e colunas seja igual a 10.',
          correct:'PARABÉNS! Todas as linhas e colunas somam 10, sem números repetidos na mesma linha ou coluna!'
        }))
      },
      {
        title:'Clique 10',
        intro:'Escolha exatamente três números no quadro para formar o total pedido. Toque novamente para desfazer uma escolha. Os totais vão de 10 a 20, e cada quadro tem uma única combinação correta.',
        questions:clickSets.map(([solution,pool],index) => ({
          id:`d3m3-clique-q${index + 1}`, type:'sum-three', target:10 + index,
          numbers:clickBoard(solution,pool,index),
          text:`Clique em 3 números até formar o total ${10 + index}.`,
          correct:`ACERTOU! Os três números escolhidos somam ${10 + index}!`
        }))
      }
    ]
  };

  function evaluateTriangle(question,placements) {
    if (placements.length !== 6 || placements.some(id => !Number.isInteger(id) || id < 0 || id >= question.numbers.length) || new Set(placements).size !== 6) {
      return {complete:false,correct:false,message:'Coloque os seis números nos quadrados do triângulo.'};
    }
    const sums = triangleSides.map(side => side.reduce((sum,slot) => sum + question.numbers[placements[slot]],0));
    const target = question.target ?? sums[0];
    const correct = sums.every(sum => sum === target);
    return {complete:true,correct,sums,message:`As somas dos lados esquerdo, direito e da base são ${sums.join(', ')}. ${question.target === null ? 'Os três resultados precisam ser iguais.' : `Cada lado precisa somar ${target}.`} Mova os números e tente novamente.`};
  }

  function evaluateSquare(question,values) {
    if (values.length !== 9 || values.some(value => !Number.isInteger(value) || value < 0 || value > 9)) {
      return {complete:false,correct:false,message:'Preencha todos os espaços com um algarismo de 0 a 9.'};
    }
    if (question.givens.some((value,index) => value !== null && values[index] !== value)) {
      return {complete:false,correct:false,message:'Mantenha os números que já estavam no quadro.'};
    }
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8]];
    const repeated = lines.findIndex(line => new Set(line.map(index => values[index])).size !== 3);
    const sums = lines.map(line => line.reduce((sum,index) => sum + values[index],0));
    const wrong = sums.findIndex(sum => sum !== question.target);
    const lineName = index => index < 3 ? `linha ${index + 1}` : `coluna ${index - 2}`;
    const message = repeated >= 0
      ? `Há um número repetido na ${lineName(repeated)}. Use números diferentes dentro de cada linha e coluna.`
      : wrong >= 0 ? `A ${lineName(wrong)} soma ${sums[wrong]}. Ajuste os números para que todas as linhas e colunas somem ${question.target}.` : '';
    return {complete:true,correct:repeated < 0 && wrong < 0,sums,message};
  }

  function evaluateThreeNumbers(question,selected) {
    if (selected.length !== 3 || new Set(selected).size !== 3 || selected.some(index => !Number.isInteger(index) || index < 0 || index >= question.numbers.length)) {
      return {complete:false,correct:false,message:'Escolha exatamente três quadrados antes de conferir.'};
    }
    const numbers = selected.map(index => question.numbers[index]);
    const total = numbers.reduce((sum,number) => sum + number,0);
    return {complete:true,correct:total === question.target,total,message:`${numbers.join(' + ')} = ${total}. O total pedido é ${question.target}. Escolha outro trio e tente novamente.`};
  }

  let state = null;
  let pointerDrag = null;
  let touchTap = null;
  let suppressedClickElement = null;
  let suppressedClickUntil = 0;
  const isType = question => ['sum-triangle','sum-square','sum-three'].includes(question.type);

  function render(question,container,onChange) {
    cancelPointerDrag();
    touchTap = null;
    state = {question,container,onChange,placements:Array(6).fill(null),selectedToken:null,
      values:question.givens?.slice(),selected:[],locked:false,feedback:''};
    container.classList.add('addition-puzzle-activity');
    const target = question.target === null ? 'Mesma soma nos três lados' : `Soma ${question.target}`;
    let board = '';
    if (question.type === 'sum-triangle') {
      board = `<p class="sum-puzzle-help">Arraste um número ou toque nele e depois no quadrado de destino.</p>
        <div class="sum-triangle" aria-label="Triângulo com seis quadrados">
          <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 12 L9 84 L91 84 Z"/></svg>
          ${trianglePositions.map(([x,y],index) => `<button type="button" class="sum-triangle-slot" style="--slot-x:${x}%;--slot-y:${y}%" data-triangle-slot="${index}" aria-label="${triangleLabels[index]}, vazio"></button>`).join('')}
        </div>
        <div class="sum-number-bank" data-triangle-bank aria-label="Números disponíveis">${question.numbers.map((number,index) => `<button type="button" class="sum-number-token" data-triangle-token="${index}" aria-label="Número ${number}, peça ${index + 1}" aria-pressed="false">${number}</button>`).join('')}</div>
        <div class="sum-puzzle-tools"><button type="button" data-return-triangle disabled>Devolver número</button><button type="button" data-reset-sum-puzzle>Recomeçar</button></div>`;
    } else if (question.type === 'sum-square') {
      board = `<p class="sum-puzzle-help">Não é permitido repetir números na mesma linha ou coluna.</p>
        <div class="sum-square-grid" role="group" aria-label="Quadrado da soma, três linhas e três colunas">
          ${question.givens.map((value,index) => value !== null
            ? `<span class="sum-square-fixed" aria-label="Linha ${Math.floor(index / 3) + 1}, coluna ${index % 3 + 1}: ${value}, número fixo">${value}</span>`
            : `<input type="text" inputmode="numeric" maxlength="1" pattern="[0-9]" autocomplete="off" data-sum-square-cell="${index}" aria-label="Linha ${Math.floor(index / 3) + 1}, coluna ${index % 3 + 1}">`).join('')}
        </div><div class="sum-puzzle-tools"><button type="button" data-reset-sum-puzzle>Recomeçar</button></div>`;
    } else {
      board = `<p class="sum-puzzle-help">Escolha três quadrados. Toque novamente para desfazer uma escolha.</p>
        <div class="sum-click-grid" role="group" aria-label="Quadro de números, cinco linhas e cinco colunas">
          ${question.numbers.map((number,index) => `<button type="button" data-sum-three-cell="${index}" aria-pressed="false" aria-label="Número ${number}, linha ${Math.floor(index / 5) + 1}, coluna ${index % 5 + 1}">${number}</button>`).join('')}
        </div><p class="sum-selection-status" data-sum-selection-status>0 de 3 números escolhidos</p>
        <div class="sum-puzzle-tools"><button type="button" data-reset-sum-puzzle>Limpar escolhas</button></div>`;
    }
    container.innerHTML = `<div class="sum-puzzle"><div class="sum-puzzle-goal"><span>OBJETIVO</span><strong>${target}</strong></div>${board}<p class="sum-puzzle-message" data-sum-puzzle-message role="status" aria-live="polite"></p></div>`;
    state.root = container.querySelector('.sum-puzzle');
  }

  function changed() {
    state.feedback = '';
    state.container.querySelector('[data-sum-puzzle-message]').textContent = '';
    state.onChange?.();
  }

  function refreshTriangle() {
    state.container.querySelectorAll('[data-triangle-slot]').forEach(slot => {
      const index = Number(slot.dataset.triangleSlot);
      const token = state.placements[index];
      slot.textContent = token === null ? '' : state.question.numbers[token];
      slot.classList.toggle('is-selected',token !== null && token === state.selectedToken);
      slot.setAttribute('aria-label',`${triangleLabels[index]}, ${token === null ? 'vazio' : `número ${state.question.numbers[token]}`}`);
      slot.setAttribute('aria-pressed',String(token !== null && token === state.selectedToken));
      if (token === null) delete slot.dataset.triangleToken;
      else slot.dataset.triangleToken = String(token);
    });
    state.container.querySelectorAll('[data-triangle-bank] [data-triangle-token]').forEach(button => {
      const token = Number(button.dataset.triangleToken);
      button.hidden = state.placements.includes(token);
      button.classList.toggle('is-selected',token === state.selectedToken);
      button.setAttribute('aria-pressed',String(token === state.selectedToken));
    });
    state.container.querySelector('[data-return-triangle]').disabled = state.selectedToken === null || !state.placements.includes(state.selectedToken);
  }

  function placeToken(token,destination) {
    if (!state || state.locked || !Number.isInteger(token) || token < 0 || token >= state.question.numbers.length || !Number.isInteger(destination) || destination < 0 || destination > 5) return;
    const previous = state.placements.indexOf(token);
    if (previous === destination) { state.selectedToken = null; refreshTriangle(); return; }
    const displaced = state.placements[destination];
    if (previous >= 0) state.placements[previous] = displaced;
    state.placements[destination] = token;
    state.selectedToken = null;
    refreshTriangle(); changed();
  }

  function returnToken(token) {
    const previous = state.placements.indexOf(token);
    if (previous >= 0) state.placements[previous] = null;
    state.selectedToken = null;
    refreshTriangle(); changed();
  }

  function handleClick(event) {
    if (!state || !state.root.contains(event.target)) return false;
    if (state.locked || (event.detail > 0 && Date.now() < suppressedClickUntil && event.target.closest('button') === suppressedClickElement)) return true;
    const slot = event.target.closest('[data-triangle-slot]');
    const token = event.target.closest('[data-triangle-token]');
    if (slot && state.selectedToken !== null) { placeToken(state.selectedToken,Number(slot.dataset.triangleSlot)); return true; }
    if (token) {
      const id = Number(token.dataset.triangleToken);
      state.selectedToken = state.selectedToken === id ? null : id;
      refreshTriangle(); return true;
    }
    if (event.target.closest('[data-return-triangle]') || (event.target.closest('[data-triangle-bank]') && state.selectedToken !== null)) {
      returnToken(state.selectedToken); return true;
    }
    if (event.target.closest('[data-reset-sum-puzzle]')) {
      const {question,container,onChange} = state;
      render(question,container,onChange); changed(); return true;
    }
    const cell = event.target.closest('[data-sum-three-cell]');
    if (cell) {
      const index = Number(cell.dataset.sumThreeCell);
      if (state.selected.includes(index)) state.selected = state.selected.filter(item => item !== index);
      else if (state.selected.length < 3) state.selected.push(index);
      else {
        state.container.querySelector('[data-sum-puzzle-message]').textContent = 'Você já escolheu três números. Toque em um deles para trocar a escolha.';
        return true;
      }
      cell.classList.toggle('is-selected',state.selected.includes(index));
      cell.setAttribute('aria-pressed',String(state.selected.includes(index)));
      state.container.querySelector('[data-sum-selection-status]').textContent = `${state.selected.length} de 3 números escolhidos`;
      changed(); return true;
    }
    return false;
  }

  function handleInput(event) {
    const input = event.target.closest('[data-sum-square-cell]');
    if (!input || !state || state.locked || !state.container.contains(input)) return;
    input.value = input.value.replace(/\D/g,'').slice(0,1);
    state.values[Number(input.dataset.sumSquareCell)] = input.value === '' ? null : Number(input.value);
    changed();
  }

  function submit() {
    if (!state || state.locked) return null;
    const question = state.question;
    const result = question.type === 'sum-triangle' ? evaluateTriangle(question,state.placements)
      : question.type === 'sum-square' ? evaluateSquare(question,state.values)
      : evaluateThreeNumbers(question,state.selected);
    state.feedback = result.message;
    state.container.querySelector('[data-sum-puzzle-message]').textContent = result.complete ? '' : result.message;
    if (!result.complete && question.type === 'sum-square') state.container.querySelectorAll('[data-sum-square-cell]').forEach(input => {
      if (state.values[Number(input.dataset.sumSquareCell)] === null && !state.container.contains(document.activeElement)) input.focus();
    });
    return result;
  }

  function lock() {
    if (!state) return;
    cancelPointerDrag(); state.locked = true;
    state.container.querySelectorAll('button,input').forEach(element => { element.disabled = true; });
  }

  function cancelPointerDrag() {
    if (!pointerDrag) return;
    pointerDrag.ghost?.remove();
    pointerDrag.element.classList.remove('is-dragging');
    if (pointerDrag.element.hasPointerCapture?.(pointerDrag.pointerId)) pointerDrag.element.releasePointerCapture(pointerDrag.pointerId);
    pointerDrag = null;
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown',event => {
      if (event.isPrimary) { suppressedClickElement = null; suppressedClickUntil = 0; }
      const button = event.target.closest('button');
      touchTap = event.pointerType === 'touch' && event.isPrimary && button && !button.disabled && state?.root.contains(button)
        ? {element:button,pointerId:event.pointerId,x:event.clientX,y:event.clientY} : null;
      const element = event.target.closest('[data-triangle-token]');
      if (!element || element.disabled || !state || state.locked || !state.container.contains(element) || event.button !== 0 || !event.isPrimary) return;
      pointerDrag = {element,token:Number(element.dataset.triangleToken),pointerId:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
      element.setPointerCapture?.(event.pointerId);
    });
    document.addEventListener('pointermove',event => {
      if (touchTap?.pointerId === event.pointerId && Math.hypot(event.clientX - touchTap.x,event.clientY - touchTap.y) >= 6) touchTap = null;
      const drag = pointerDrag;
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.x,event.clientY - drag.y) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        drag.ghost = document.createElement('div');
        drag.ghost.className = 'sum-number-ghost';
        drag.ghost.textContent = state.question.numbers[drag.token];
        document.body.appendChild(drag.ghost);
        drag.element.classList.add('is-dragging');
      }
      drag.ghost.style.left = `${event.clientX}px`;
      drag.ghost.style.top = `${event.clientY}px`;
    });
    const finishDrag = event => {
      const drag = pointerDrag;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const destination = drag.moved && event.type === 'pointerup' ? document.elementFromPoint(event.clientX,event.clientY) : null;
      const slot = destination?.closest('[data-triangle-slot]');
      const bank = destination?.closest('[data-triangle-bank]');
      cancelPointerDrag();
      if (drag.moved) {
        suppressedClickElement = drag.element;
        suppressedClickUntil = Date.now() + 500;
        if (slot) placeToken(drag.token,Number(slot.dataset.triangleSlot));
        else if (bank) returnToken(drag.token);
      }
    };
    document.addEventListener('pointerup',finishDrag);
    document.addEventListener('pointercancel',finishDrag);
    // Ativa toques curtos mesmo após um arraste; evita o clique de compatibilidade duplicado.
    document.addEventListener('pointerup',event => {
      const tap = touchTap;
      touchTap = null;
      if (!tap || tap.pointerId !== event.pointerId || !state || state.locked || !state.root.contains(tap.element)) return;
      if (document.elementFromPoint(event.clientX,event.clientY)?.closest('button') !== tap.element) return;
      tap.element.click();
      suppressedClickElement = tap.element;
      suppressedClickUntil = Date.now() + 500;
    });
    document.addEventListener('pointercancel',() => { touchTap = null; });
  }

  return {challenge,isType,render,handleClick,handleInput,submit,lock,
    evaluateTriangle,evaluateSquare,evaluateThreeNumbers,
    get feedback() { return state?.feedback || ''; }};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = additionPuzzles;
