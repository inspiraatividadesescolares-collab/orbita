const divisionCalculation = (() => {
  const isType = question => question?.type === 'division-calculation';
  const parseAnswer = answer => /^\d+$/.test(String(answer ?? '').trim()) && Number.isSafeInteger(Number(answer)) ? Number(answer) : null;
  function arrangement(question,copies) {
    if (!question.requireArrangement) return {complete:true};
    if (!Array.isArray(copies) || new Set(copies.map(copy => copy.id)).size !== copies.length || copies.some(copy => !['cap','frame'].includes(copy.kind))) return {complete:false,message:'Monte os grupos usando as ferramentas da área de cálculo.'};
    const frames = copies.filter(copy => copy.kind === 'frame'),caps = copies.filter(copy => copy.kind === 'cap');
    if (frames.length !== question.divisor || caps.length !== question.total) return {complete:false,message:`Monte ${question.divisor} ${question.divisor === 1 ? 'moldura' : 'molduras'} e represente os ${question.total} objetos com tampinhas.`};
    const counts = frames.map(frame => caps.filter(cap => cap.parent === frame.id).length);
    if (counts.reduce((sum,count) => sum + count,0) !== question.total) return {complete:false,message:'Coloque todas as tampinhas dentro das molduras.'};
    if (!counts.every(count => count === question.total / question.divisor)) return {complete:false,message:'Reparta as tampinhas em quantidades iguais entre as molduras.'};
    return {complete:true,counts};
  }
  function evaluate(question,copies,answer) {
    const groups = arrangement(question,copies);
    if (!groups.complete) return {...groups,correct:false};
    const choice = Array.isArray(question.options),value = choice ? answer : parseAnswer(answer);
    if (choice ? !question.options.includes(value) : value === null) return {complete:false,correct:false,message:choice ? 'Escolha uma alternativa.' : 'Digite um número inteiro para responder.'};
    const correct = choice ? value === question.answer : value === Number(question.answer);
    return {complete:true,correct,message:correct ? question.correct : `TENTE NOVAMENTE! ${question.incorrect} Você tem mais uma tentativa.`};
  }
  let state = null,drag = null;
  const name = kind => kind === 'cap' ? 'Tampinha' : state?.question.frameLabel || 'Quadro';
  const announce = text => { if (state) state.root.querySelector('[data-calculation-status]').textContent = text; };
  const board = () => state.root.querySelector('[data-calculation-board]');
  const toolImage = kind => kind === 'cap' ? state.question.itemImage : state.question.targetImage;
  const element = id => state.root.querySelector(`[data-calculation-copy="${id}"]`);
  function toolMarkup(kind) {
    const crop = kind === 'frame' && state.question.frameCrop;
    if (!crop) return `<img src="${toolImage(kind)}" alt="" draggable="false">`;
    const [x,y,width,height] = crop;
    return `<span class="calculation-crop-art"><img src="${toolImage(kind)}" alt="" draggable="false" style="left:${-x / width * 100}%;top:${-y / height * 100}%;width:${10000 / width}%;height:${10000 / height}%"></span>`;
  }

  function render(question,container,callbacks={}) {
    clear();
    state = {question,root:container,callbacks,copies:[],nextId:1,selection:null,locked:false,choice:null,result:null,feedback:'',suppressClick:false};
    const columns = Math.min(question.divisor || 1,5),rows = Math.ceil((question.divisor || 1) / columns),mobileColumns = Math.min(question.divisor || 1,2),mobileRows = Math.ceil((question.divisor || 1) / mobileColumns);
    container.classList.add('calculation-activity');
    container.innerHTML = `<div class="calculation-game ${question.options ? '' : 'calculation-game--input'}" style="--calculation-columns:${columns};--calculation-rows:${rows};--calculation-mobile-columns:${mobileColumns};--calculation-mobile-rows:${mobileRows}">
      <div class="calculation-toolbar"><p>${question.options ? 'Arraste a tampinha ou o quadro para criar uma cópia na área de cálculo. Você também pode selecionar e tocar na área. Repita quantas vezes precisar.' : 'Arraste a moldura e a tampinha para montar os grupos. Você também pode selecionar e tocar na área. Reparta igualmente e depois digite a resposta.'}</p><button type="button" data-calculation-reset>↻ Limpar área</button></div>
      <div class="calculation-workspace"><div class="calculation-tools" role="group" aria-label="Ferramentas para calcular">
        ${(question.options ? ['cap','frame'] : ['frame','cap']).map(kind => `<button type="button" data-calculation-tool="${kind}" aria-label="${name(kind)}. Selecionar para criar uma cópia" aria-pressed="false">${toolMarkup(kind)}<span>${name(kind)}</span></button>`).join('')}
        <button type="button" data-calculation-remove disabled>Remover selecionado</button>
      </div><div class="calculation-board" data-calculation-board><button type="button" class="calculation-surface" data-calculation-place aria-label="Área de cálculo. Colocar a ferramenta ou figura selecionada."></button><span class="calculation-placeholder" data-calculation-placeholder>Monte seu cálculo aqui</span></div></div>
      <div class="calculation-summary" data-calculation-summary></div>
      ${question.options ? `<div class="calculation-choices" role="group" aria-label="Escolha a resposta">${question.options.map((option,index) => `<button type="button" data-calculation-choice="${option}"><b>${String.fromCharCode(65 + index)})</b> ${option}</button>`).join('')}</div>` : `<div class="calculation-answer"><label for="calculation-answer-input">${question.answerLabel}</label><input id="calculation-answer-input" data-calculation-answer type="text" inputmode="numeric" enterkeyhint="done" autocomplete="off" maxlength="3" aria-describedby="calculation-answer-help" disabled><p id="calculation-answer-help" data-calculation-answer-help></p></div>`}
      <span class="division-status" data-calculation-status role="status" aria-live="polite"></span>
    </div>`;
    container.addEventListener('click',handleClick);
    container.addEventListener('keydown',handleKeydown);
    container.addEventListener('pointerdown',startDrag);
    container.addEventListener('input',handleInput);
    window.addEventListener('resize',handleResize);
    refresh();
  }

  function refresh() {
    if (!state) return;
    const {root,locked,selection,copies} = state;
    root.querySelectorAll('[data-calculation-tool]').forEach(button => {
      const selected = selection?.kind === button.dataset.calculationTool;
      button.disabled = locked; button.classList.toggle('is-selected',selected); button.setAttribute('aria-pressed',String(selected));
    });
    root.querySelectorAll('[data-calculation-copy]').forEach(button => {
      const copy = copies.find(copy => copy.id === Number(button.dataset.calculationCopy)),selected = selection?.id === copy.id;
      button.disabled = locked; button.classList.toggle('is-selected',selected); button.setAttribute('aria-pressed',String(selected));
      button.style.left = `${copy.x * 100}%`; button.style.top = `${copy.y * 100}%`;
    });
    root.querySelector('[data-calculation-place]').disabled = locked;
    root.querySelector('[data-calculation-reset]').disabled = locked;
    root.querySelector('[data-calculation-remove]').disabled = locked || !selection?.id;
    root.querySelector('[data-calculation-placeholder]').hidden = copies.length > 0;
    const caps = copies.filter(copy => copy.kind === 'cap').length,frames = copies.length - caps;
    const frameWord = state.question.frameLabel ? (frames === 1 ? 'moldura' : 'molduras') : (frames === 1 ? 'quadro' : 'quadros');
    root.querySelector('[data-calculation-summary]').textContent = `${caps} ${caps === 1 ? 'tampinha' : 'tampinhas'} · ${frames} ${frameWord}`;
    root.querySelectorAll('[data-calculation-choice]').forEach(button => {
      const selected = state.choice === button.dataset.calculationChoice;
      button.disabled = locked || Boolean(selected && state.result && !state.result.correct);
      button.classList.toggle('is-correct',Boolean(selected && state.result?.correct));
      button.classList.toggle('is-wrong',Boolean(selected && state.result && !state.result.correct));
    });
    const input = root.querySelector('[data-calculation-answer]');
    if (input) {
      const groups = arrangement(state.question,copies);
      input.disabled = locked || !groups.complete;
      input.classList.toggle('is-correct',Boolean(state.result?.correct));
      input.classList.toggle('is-wrong',Boolean(state.result && !state.result.correct));
      root.querySelector('[data-calculation-answer-help]').textContent = groups.complete ? 'Conte as tampinhas de uma moldura e digite sua resposta.' : groups.message;
      state.callbacks.onReady?.(!locked && groups.complete && parseAnswer(input.value) !== null);
    }
  }

  function point(x,y) {
    const rect = board().getBoundingClientRect();
    return {x:(x - rect.left) / rect.width,y:(y - rect.top) / rect.height};
  }

  function clamp(copy,x,y) {
    const rect = board().getBoundingClientRect(),figure = element(copy.id).getBoundingClientRect();
    const edgeX = Math.min(.49,figure.width / rect.width / 2),edgeY = Math.min(.49,figure.height / rect.height / 2);
    return {x:Math.max(edgeX,Math.min(1 - edgeX,x)),y:Math.max(edgeY,Math.min(1 - edgeY,y))};
  }

  function findParent(copy) {
    const area = board().getBoundingClientRect(),x = area.left + copy.x * area.width,y = area.top + copy.y * area.height;
    const frame = [...state.copies].reverse().find(candidate => {
      if (candidate.kind !== 'frame') return false;
      const rect = element(candidate.id).getBoundingClientRect();
      return x > rect.left + rect.width * .12 && x < rect.right - rect.width * .12 && y > rect.top + rect.height * .12 && y < rect.bottom - rect.height * .12;
    });
    return frame?.id || null;
  }

  function fitInsideFrame(copy) {
    copy.parent = findParent(copy);
    if (!copy.parent || !state.question.frameInset) return;
    const rect = element(copy.parent).getBoundingClientRect(),cap = element(copy.id).getBoundingClientRect(),area = board().getBoundingClientRect();
    const [insetX,insetY] = state.question.frameInset;
    // Keep the whole cap inside the frame while preserving the chosen group.
    const left = rect.left + rect.width * insetX + cap.width / 2,right = rect.right - rect.width * insetX - cap.width / 2;
    const top = rect.top + rect.height * insetY + cap.height / 2,bottom = rect.bottom - rect.height * insetY - cap.height / 2;
    copy.x = (Math.max(left,Math.min(right,area.left + copy.x * area.width)) - area.left) / area.width;
    copy.y = (Math.max(top,Math.min(bottom,area.top + copy.y * area.height)) - area.top) / area.height;
  }

  function resetFeedback(clearAnswer=true) {
    state.choice = null; state.result = null; state.feedback = ''; state.callbacks.onChange?.();
    if (clearAnswer) { const input = state.root.querySelector('[data-calculation-answer]'); if (input) input.value = ''; }
  }

  function add(kind,x,y) {
    const copy = {id:state.nextId++,kind,x,y,parent:null};
    state.copies.push(copy);
    board().insertAdjacentHTML('beforeend',`<button type="button" class="calculation-copy calculation-copy--${kind}" data-calculation-copy="${copy.id}" aria-label="${name(kind)} ${copy.id}. Selecionar; use as setas para mover e Delete para remover" aria-pressed="false">${toolMarkup(kind)}</button>`);
    Object.assign(copy,clamp(copy,x,y)); refresh();
    state.copies.filter(copy => copy.kind === 'cap').forEach(fitInsideFrame);
    resetFeedback(); refresh(); announce(`${name(kind)} ${kind === 'cap' ? 'adicionada' : 'adicionado'}. A ferramenta continua disponível para criar outras cópias.`);
    return copy;
  }

  function move(copy,x,y) {
    const next = clamp(copy,x,y),dx = next.x - copy.x,dy = next.y - copy.y;
    Object.assign(copy,next);
    if (copy.kind === 'frame') state.copies.filter(child => child.parent === copy.id).forEach(child => { child.x += dx; child.y += dy; });
    refresh();
    state.copies.filter(copy => copy.kind === 'cap').forEach(fitInsideFrame);
    resetFeedback(); refresh(); announce(`${name(copy.kind)} ${copy.kind === 'cap' ? 'movida' : 'movido'} na área de cálculo.`);
  }

  function removeSelected() {
    const id = state.selection?.id;
    if (!id) return;
    element(id).remove(); state.copies = state.copies.filter(copy => copy.id !== id);
    state.copies.filter(copy => copy.parent === id).forEach(copy => { copy.parent = null; });
    state.selection = null; resetFeedback(); refresh(); announce('Figura removida. As ferramentas continuam disponíveis.');
  }

  function place(event) {
    const selected = state.selection;
    if (!selected) return;
    const position = event.detail === 0 ? {x:.5,y:.5} : point(event.clientX,event.clientY);
    if (selected.kind) add(selected.kind,position.x,position.y);
    else { move(state.copies.find(copy => copy.id === selected.id),position.x,position.y); state.selection = null; refresh(); }
  }

  function handleClick(event) {
    if (!state || state.locked) return;
    if (state.suppressClick) { state.suppressClick = false; if (event.detail > 0) return; }
    const tool = event.target.closest('[data-calculation-tool]');
    if (tool) { state.selection = state.selection?.kind === tool.dataset.calculationTool ? null : {kind:tool.dataset.calculationTool}; refresh(); return; }
    if (event.target.closest('[data-calculation-remove]')) { removeSelected(); return; }
    if (event.target.closest('[data-calculation-reset]')) {
      cancelDrag(); state.root.querySelectorAll('[data-calculation-copy]').forEach(copy => copy.remove());
      state.copies = []; state.selection = null; resetFeedback(); refresh(); announce('Área limpa. As tentativas já usadas continuam contando.'); return;
    }
    const choice = event.target.closest('[data-calculation-choice]');
    if (choice) { if (!choice.disabled) { state.choice = choice.dataset.calculationChoice; state.callbacks.onSubmit?.(); } return; }
    const copy = event.target.closest('[data-calculation-copy]');
    if (copy && !state.selection?.kind) {
      const id = Number(copy.dataset.calculationCopy); state.selection = state.selection?.id === id ? null : {id}; refresh(); return;
    }
    if (event.target.closest('[data-calculation-board]')) place(event);
  }

  function handleKeydown(event) {
    if (!state || state.locked) return;
    if (['Enter',' ','Escape','Delete','Backspace','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)) event.stopPropagation();
    if (event.key === 'Escape') { cancelDrag(); state.selection = null; refresh(); }
    if (event.target.matches('[data-calculation-answer]') && event.key === 'Enter') { event.preventDefault(); if (!event.repeat) state.callbacks.onSubmit?.(); return; }
    const copyElement = event.target.closest('[data-calculation-copy]');
    if (!copyElement) return;
    const copy = state.copies.find(copy => copy.id === Number(copyElement.dataset.calculationCopy));
    if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); state.selection = {id:copy.id}; removeSelected(); board().querySelector('[data-calculation-place]').focus(); }
    const directions = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if (directions[event.key]) {
      event.preventDefault(); const rect = board().getBoundingClientRect(),[dx,dy] = directions[event.key];
      move(copy,copy.x + dx * 10 / rect.width,copy.y + dy * 10 / rect.height);
    }
  }
  function handleInput(event) {
    if (!state || state.locked || !event.target.matches('[data-calculation-answer]')) return;
    resetFeedback(false); refresh();
  }

  function startDrag(event) {
    if (!state || state.locked || drag || event.button !== 0) return;
    state.suppressClick = false;
    const source = event.target.closest('[data-calculation-tool],[data-calculation-copy]');
    if (!source || source.disabled) return;
    const rect = source.getBoundingClientRect(),id = Number(source.dataset.calculationCopy);
    drag = {source,id:id || null,kind:source.dataset.calculationTool || state.copies.find(copy => copy.id === id).kind,
      pointerId:event.pointerId,x:event.clientX,y:event.clientY,offsetX:event.clientX - rect.left - rect.width / 2,offsetY:event.clientY - rect.top - rect.height / 2,moved:false};
    source.setPointerCapture(event.pointerId);
    document.addEventListener('pointermove',moveDrag); document.addEventListener('pointerup',endDrag); document.addEventListener('pointercancel',endDrag);
  }

  function moveDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x,event.clientY - drag.y) < 7) return;
    if (!drag.moved) {
      drag.moved = true; drag.ghost = document.createElement('div'); drag.ghost.className = `calculation-ghost calculation-ghost--${drag.kind}`;
      drag.ghost.setAttribute('aria-hidden','true'); drag.ghost.innerHTML = toolMarkup(drag.kind); document.body.appendChild(drag.ghost);
    }
    event.preventDefault(); drag.ghost.style.left = `${event.clientX}px`; drag.ghost.style.top = `${event.clientY}px`;
    const rect = board().getBoundingClientRect();
    board().classList.toggle('is-drop-target',event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom);
  }

  function endDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = drag,rect = board().getBoundingClientRect(); cancelDrag();
    if (!current.moved || !state) return;
    const session = state; session.suppressClick = true; setTimeout(() => { session.suppressClick = false; },0);
    if (event.type !== 'pointerup' || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
    const position = point(event.clientX - (current.id ? current.offsetX : 0),event.clientY - (current.id ? current.offsetY : 0));
    if (current.id) move(state.copies.find(copy => copy.id === current.id),position.x,position.y);
    else add(current.kind,position.x,position.y);
    state.selection = null; refresh();
  }

  function cancelDrag() {
    document.removeEventListener('pointermove',moveDrag); document.removeEventListener('pointerup',endDrag); document.removeEventListener('pointercancel',endDrag);
    if (drag) { const current = drag; drag = null; current.ghost?.remove(); if (current.source.hasPointerCapture?.(current.pointerId)) current.source.releasePointerCapture(current.pointerId); }
    if (state) board().classList.remove('is-drop-target');
  }
  function handleResize() {
    if (!state) return;
    state.copies.forEach(copy => Object.assign(copy,clamp(copy,copy.x,copy.y))); refresh();
    state.copies.filter(copy => copy.kind === 'cap').forEach(fitInsideFrame); refresh();
  }
  function submit() {
    if (!state || state.locked || drag?.moved) return null;
    const result = evaluate(state.question,state.copies,state.question.options ? state.choice : state.root.querySelector('[data-calculation-answer]').value);
    if (!result.complete) { announce(result.message); return result; }
    state.result = result; state.feedback = result.message; refresh(); return result;
  }
  function lock() { if (state) { cancelDrag(); state.locked = true; state.selection = null; if (state.result && !state.result.correct) state.feedback = `As duas tentativas terminaram. ${state.question.correct.replace(/^[^!]+!\s*/,'')}`; refresh(); } }
  function clear() {
    cancelDrag();
    if (state) { state.root.removeEventListener('click',handleClick); state.root.removeEventListener('keydown',handleKeydown); state.root.removeEventListener('pointerdown',startDrag); state.root.removeEventListener('input',handleInput); }
    window.removeEventListener('resize',handleResize);
    state = null;
  }
  return {isType,parseAnswer,arrangement,evaluate,render,submit,lock,clear,get feedback() { return state?.feedback || ''; }};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = divisionCalculation;
