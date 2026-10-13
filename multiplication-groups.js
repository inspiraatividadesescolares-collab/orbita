const multiplicationGroups = (() => {
  const levels = [
    {text:'Lia colocou 3 maçãs em cada cesta. Quantas maçãs há ao todo?',groups:3,perGroup:3,item:'maçã',plural:'maçãs',art:'apple',target:'Cesta',container:'basket'},
    {text:'Pedro colocou 3 bombons em cada caixa. Há 4 caixas. Quantos bombons há ao todo?',groups:4,perGroup:3,item:'bombom',plural:'bombons',art:'chocolate',target:'Caixa',container:'box'},
    {text:'Bia colocou 2 flores em cada vaso. Há 3 vasos. Quantas flores há ao todo?',groups:3,perGroup:2,item:'flor',plural:'flores',art:'flower',target:'Vaso',container:'vase'},
    {text:'Caio colocou 5 estrelas de papel em cada quadro. Há 4 quadros. Quantas estrelas há ao todo?',groups:4,perGroup:5,item:'estrela',plural:'estrelas',art:'star',target:'Quadro',container:'frame'},
    {text:'Nina colocou 6 morangos em cada pote. Há 2 potes. Quantos morangos há ao todo?',groups:2,perGroup:6,item:'morango',plural:'morangos',art:'strawberry',target:'Pote',container:'pot'},
    {text:'Ravi colocou 2 biscoitos em cada prato. Há 4 pratos. Quantos biscoitos há ao todo?',groups:4,perGroup:2,item:'biscoito',plural:'biscoitos',art:'cookie',target:'Prato',container:'plate'},
    {text:'Ana colocou 3 balas em cada caixa. Há 2 caixas. Quantas balas há ao todo?',groups:2,perGroup:3,item:'bala',plural:'balas',art:'candy',target:'Caixa',container:'box'},
    {text:'Davi colocou 2 laranjas em cada cesta. Há 4 cestas. Quantas laranjas há ao todo?',groups:4,perGroup:2,item:'laranja',plural:'laranjas',art:'orange',target:'Cesta',container:'basket'},
    {text:'Luna colocou 4 lápis em cada caixa. Há 4 caixas. Quantos lápis há ao todo?',groups:4,perGroup:4,item:'lápis',plural:'lápis',art:'pencil',target:'Caixa',container:'box'},
    {text:'Ivo colocou 3 biscoitos em cada prato. Há 5 pratos. Quantos biscoitos há ao todo?',groups:5,perGroup:3,item:'biscoito',plural:'biscoitos',art:'cookie',target:'Prato',container:'plate'}
  ];
  const mission = {
    title:'A ideia da multiplicação',
    video:'assets/videos/desafio-6/missao-1/vd-explica-d6-m1.mp4',
    intro:'Monte grupos com a mesma quantidade de objetos. Arraste a figura até cada destino: ela continua disponível para você usar quantas vezes precisar. Você também pode tocar na figura e depois no destino. Para retirar um objeto, toque nele. Depois, conte todos os objetos, digite o total e confira. São 10 questões, com duas tentativas por questão.',
    questions:levels.map((level,index) => ({
      id:`d12m1q${index + 1}`,type:'multiplication-groups',...level,answer:level.groups * level.perGroup,
      spokenText:`${level.text} Há ${level.groups} destinos na tela. Arraste a figura ou selecione a figura e depois o destino. Coloque ${level.perGroup} ${level.plural} em cada um. Depois conte todos os objetos e digite o total.`,
      correct:`MUITO BEM! ${level.groups} × ${level.perGroup} = ${level.groups * level.perGroup}. Há ${level.groups * level.perGroup} ${level.plural} ao todo.`,
      incorrect:`Coloque ${level.perGroup} ${level.plural} em cada ${level.target.toLocaleLowerCase('pt-BR')} e conte todos os objetos novamente.`
    }))
  };
  const isType = question => question?.type === 'multiplication-groups';
  const parseAnswer = value => /^\d+$/.test(String(value ?? '').trim()) && Number.isSafeInteger(Number(value)) ? Number(value) : null;
  function evaluate(question,counts,answer) {
    if (!Array.isArray(counts) || counts.length !== question.groups || counts.some(count => !Number.isInteger(count) || count < 0)) return {complete:false,correct:false,message:'Monte os grupos antes de responder.'};
    if (counts.some(count => count === 0)) return {complete:false,correct:false,message:'Coloque objetos em todos os destinos antes de responder.'};
    const value = parseAnswer(answer);
    if (value === null) return {complete:false,correct:false,message:'Digite um número inteiro para o total.'};
    const arranged = counts.every(count => count === question.perGroup);
    return {complete:true,correct:arranged && value === question.answer,
      message:!arranged ? question.incorrect : value === question.answer ? question.correct : `Conte os objetos de todos os ${question.groups} grupos e confira o total digitado.`};
  }
  const imageRoot = 'assets/imagens/questoes/3-ano/desafio-12/missao-1/ilustracoes-geradas';
  function itemArt(question) {
    return `<img class="multiplication-item-art" src="${imageRoot}/${question.art}.webp" alt="" draggable="false" decoding="async">`;
  }
  function containerArt(kind) {
    return `<img class="multiplication-container-art" src="${imageRoot}/${kind}.webp" alt="" draggable="false" decoding="async">`;
  }
  let state = null,drag = null;
  function render(question,root,callbacks={}) {
    clear();
    state = {question,root,callbacks,counts:Array(question.groups).fill(0),selected:false,locked:false,suppressClick:false,feedback:''};
    root.classList.add('multiplication-group-activity');
    root.innerHTML = `<div class="multiplication-group-game">
      <p class="multiplication-group-help">Coloque <strong>${question.perGroup} ${question.plural}</strong> em cada ${question.target.toLocaleLowerCase('pt-BR')}. Depois, conte tudo e digite o total.</p>
      <div class="multiplication-object-bank"><button type="button" class="multiplication-object-source" data-multiplication-source aria-label="Selecionar ${question.item} para colocar nos destinos" aria-pressed="false">${itemArt(question)}</button><div><strong>Arraste para os grupos</strong><p>A figura pode ser usada várias vezes.</p><small>Ou toque nela e depois no destino.</small></div></div>
      <div class="multiplication-group-targets" style="--group-columns:${question.groups}" aria-label="${question.groups} destinos">${Array.from({length:question.groups},(_,index) => `<section class="multiplication-group" data-multiplication-drop="${index}"><h4>${question.target} ${index + 1}</h4><div class="multiplication-container multiplication-container--${question.container}">${containerArt(question.container)}<button type="button" class="multiplication-destination" data-multiplication-destination="${index}" aria-label="Colocar ${question.item} em ${question.target} ${index + 1}"></button><div class="multiplication-group-items" data-multiplication-items="${index}"></div></div><span data-multiplication-count="${index}">Vazia</span></section>`).join('')}</div>
      <div class="multiplication-group-answer"><label for="multiplication-total">Total de ${question.plural}</label><input id="multiplication-total" data-multiplication-answer type="text" inputmode="numeric" enterkeyhint="done" autocomplete="off" maxlength="3" aria-describedby="multiplication-total-help"><span id="multiplication-total-help">Conte todos os objetos e digite o total.</span></div>
      <div class="multiplication-group-tools"><p>Toque em um objeto do grupo para retirá-lo.</p><button type="button" data-multiplication-reset>Recomeçar</button></div>
      <p class="multiplication-group-status" data-multiplication-status role="status" aria-live="polite"></p>
    </div>`;
    root.addEventListener('click',handleClick); root.addEventListener('input',handleInput);
    root.addEventListener('keydown',handleKeydown); root.addEventListener('pointerdown',startDrag);
    refresh();
  }
  function announce(message) { if (state) state.root.querySelector('[data-multiplication-status]').textContent = message; }
  function refresh() {
    if (!state) return;
    const {question,root,counts,locked,selected} = state;
    root.querySelector('[data-multiplication-source]').setAttribute('aria-pressed',String(selected));
    root.querySelector('[data-multiplication-source]').classList.toggle('is-selected',selected);
    counts.forEach((count,index) => {
      const items = root.querySelector(`[data-multiplication-items="${index}"]`),columns = Math.min(count || 1,question.container === 'vase' ? 2 : 3);
      items.style.setProperty('--item-columns',columns);
      items.style.setProperty('--item-rows',Math.max(1,Math.ceil(count / columns)));
      root.querySelector(`[data-multiplication-count="${index}"]`).textContent = `${count} ${count === 1 ? question.item : question.plural}`;
      const destination = root.querySelector(`[data-multiplication-destination="${index}"]`);
      destination.setAttribute('aria-label',`${question.target} ${index + 1}, ${count} ${question.plural}. Colocar ${question.item}.`);
      root.querySelector(`[data-multiplication-drop="${index}"]`).classList.toggle('is-ready',selected && !locked);
    });
    root.querySelectorAll('button,input').forEach(element => { element.disabled = locked; });
    state.callbacks.onReady?.(!locked && counts.every(count => count > 0) && parseAnswer(root.querySelector('[data-multiplication-answer]').value) !== null);
  }
  function resetFeedback() { state.feedback = ''; state.root.querySelector('.multiplication-group-game').classList.remove('is-wrong','is-correct'); state.callbacks.onChange?.(); }
  function changeGroup(index,amount) {
    if (!state || state.locked || !Number.isInteger(index) || index < 0 || index >= state.counts.length) return false;
    const next = state.counts[index] + amount;
    if (next < 0) return false;
    if (next > Math.max(6,state.question.perGroup + 2)) { announce('Esse destino está cheio. Retire um objeto ou escolha outro destino.'); return false; }
    state.counts[index] = next;
    const {root,question} = state,items = root.querySelector(`[data-multiplication-items="${index}"]`);
    if (amount > 0) items.insertAdjacentHTML('beforeend',`<button type="button" class="multiplication-group-piece" data-multiplication-remove="${index}" aria-label="Retirar ${question.item} de ${question.target} ${index + 1}">${itemArt(question)}</button>`);
    else items.lastElementChild?.remove();
    root.querySelector('[data-multiplication-answer]').value = '';
    resetFeedback(); refresh(); announce(`${question.target} ${index + 1}: ${next} ${next === 1 ? question.item : question.plural}.`);
    return true;
  }
  function handleClick(event) {
    if (!state || state.locked) return;
    if (state.suppressClick && event.detail > 0) { state.suppressClick = false; return; }
    const source = event.target.closest('[data-multiplication-source]');
    if (source) { state.selected = !state.selected; refresh(); announce(state.selected ? 'Figura selecionada. Toque no destino para colocar uma cópia.' : 'Seleção desfeita.'); return; }
    const remove = event.target.closest('[data-multiplication-remove]');
    if (remove) { const group = Number(remove.dataset.multiplicationRemove); if (changeGroup(group,-1) && event.detail === 0) state.root.querySelector(`[data-multiplication-destination="${group}"]`).focus(); return; }
    if (event.target.closest('[data-multiplication-reset]')) {
      cancelDrag(); state.counts.fill(0); state.selected = false;
      state.root.querySelectorAll('[data-multiplication-items]').forEach(items => { items.innerHTML = ''; });
      state.root.querySelector('[data-multiplication-answer]').value = ''; resetFeedback(); refresh(); announce('Destinos esvaziados. As tentativas já usadas continuam contando.'); return;
    }
    const destination = event.target.closest('[data-multiplication-drop]');
    if (destination) {
      if (state.selected) changeGroup(Number(destination.dataset.multiplicationDrop),1);
      else announce('Arraste a figura para cá ou selecione a figura primeiro.');
    }
  }
  function handleInput(event) { if (state && !state.locked && event.target.matches('[data-multiplication-answer]')) { resetFeedback(); refresh(); } }
  function handleKeydown(event) {
    if (!state) return;
    if (event.key === 'Escape') { cancelDrag(); state.selected = false; refresh(); announce('Seleção desfeita.'); }
    if (event.target.matches('[data-multiplication-answer]') && event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); if (!state.locked && !event.repeat) state.callbacks.onSubmit?.(); }
  }
  function markTarget(x,y) {
    let target = null;
    state?.root.querySelectorAll('[data-multiplication-drop]').forEach(zone => {
      const rect = zone.getBoundingClientRect(),inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      zone.classList.toggle('is-drop-target',inside); if (inside) target = Number(zone.dataset.multiplicationDrop);
    });
    return target;
  }
  function startDrag(event) {
    const element = event.target.closest('[data-multiplication-source]');
    if (!state || state.locked || !element || event.button !== 0 || drag) return;
    drag = {element,pointerId:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
    element.setPointerCapture(event.pointerId);
    document.addEventListener('pointermove',moveDrag); document.addEventListener('pointerup',endDrag); document.addEventListener('pointercancel',endDrag);
  }
  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x,event.clientY - drag.y) < 7) return;
    if (!drag.moved) {
      drag.moved = true; drag.ghost = document.createElement('div'); drag.ghost.className = 'multiplication-drag-ghost';
      drag.ghost.setAttribute('aria-hidden','true'); drag.ghost.innerHTML = itemArt(state.question); document.body.appendChild(drag.ghost);
    }
    event.preventDefault(); drag.ghost.style.left = `${event.clientX - 28}px`; drag.ghost.style.top = `${event.clientY - 28}px`; markTarget(event.clientX,event.clientY);
  }
  function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const moved = drag.moved,target = moved && event.type === 'pointerup' ? markTarget(event.clientX,event.clientY) : null;
    cancelDrag();
    if (!moved || !state) return;
    state.suppressClick = true; const currentState = state;
    setTimeout(() => { if (state === currentState) state.suppressClick = false; },0);
    if (event.type === 'pointercancel') return;
    if (target !== null) changeGroup(target,1); else announce('Solte a figura dentro de um dos destinos.');
  }
  function cancelDrag() {
    document.removeEventListener('pointermove',moveDrag); document.removeEventListener('pointerup',endDrag); document.removeEventListener('pointercancel',endDrag);
    if (drag) { drag.ghost?.remove(); if (drag.element.hasPointerCapture?.(drag.pointerId)) drag.element.releasePointerCapture(drag.pointerId); drag = null; }
    state?.root.querySelectorAll('.is-drop-target').forEach(zone => zone.classList.remove('is-drop-target'));
  }
  function submit() {
    if (!state || state.locked || drag?.moved) return null;
    const input = state.root.querySelector('[data-multiplication-answer]'),result = evaluate(state.question,state.counts,input.value);
    if (!result.complete) { announce(result.message); return result; }
    cancelDrag(); state.feedback = result.message; state.lastResult = result;
    state.root.querySelector('.multiplication-group-game').classList.toggle('is-wrong',!result.correct);
    state.root.querySelector('.multiplication-group-game').classList.toggle('is-correct',result.correct);
    if (!result.correct) { input.value = ''; refresh(); input.focus(); }
    return result;
  }
  function lock() {
    if (!state) return;
    cancelDrag(); state.locked = true; state.selected = false;
    if (!state.lastResult?.correct) state.feedback = `Veja como formar os grupos: ${state.question.perGroup} ${state.question.plural} em cada ${state.question.target.toLocaleLowerCase('pt-BR')}. ${state.question.groups} × ${state.question.perGroup} = ${state.question.answer}. Há ${state.question.answer} ${state.question.plural} ao todo.`;
    refresh();
  }
  function clear() {
    cancelDrag();
    if (state) { state.root.removeEventListener('click',handleClick); state.root.removeEventListener('input',handleInput); state.root.removeEventListener('keydown',handleKeydown); state.root.removeEventListener('pointerdown',startDrag); }
    state = null;
  }
  return {mission,isType,parseAnswer,evaluate,render,submit,lock,clear,get feedback() { return state?.feedback || ''; }};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = multiplicationGroups;
