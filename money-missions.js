const moneyMissions = (() => {
  const denominations = [100,50,20,10,5,2,1];
  const imageRoot = 'assets/imagens/questoes/3-ano/desafio-8/dinheiro';
  const illustrationRoot = 'assets/imagens/questoes/3-ano/desafio-8/ilustracoes';
  const formatter = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
  const formatMoney = cents => formatter.format(cents / 100).replace(/\u00a0/g,' ');
  const escape = value => String(value).replace(/[&<>"']/g,char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const sum = pieces => pieces.reduce((total,value) => total + value * 100,0);
  const isType = question => question?.type?.startsWith('money-') || false;

  // Centavos inteiros evitam comparações de ponto flutuante e preservam a digitação livre.
  function parseMoney(raw) {
    if (typeof raw !== 'string') return null;
    let text = raw.trim().replace(/^R\s*\$\s*/i,'').trim();
    if (/^\d+\.\d{1,2}$/.test(text)) text = text.replace('.',',');
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)) return null;
    const [whole,fraction=''] = text.replace(/\./g,'').split(',');
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2,'0'));
    return Number.isSafeInteger(cents) ? cents : null;
  }

  const person = (name,art,pieces) => ({name,image:`${illustrationRoot}/characters/${art}.png`,pieces});
  const product = (name,art,price,quantity=1) => ({name,image:`${illustrationRoot}/objects/${art}.png`,price,quantity});
  const countSets = [[20,10],[20,5,1],[10,10,5,5],[20,10,2,2,1]];
  const compareSets = [
    [person('Lia','lia',[20,10,5]),person('Ravi','ravi',[20,10,2,1])],
    [person('Bia','bia',[5,5,5,2,1]),person('Téo','teo',[20])],
    [person('João','joao',[20]),person('Duda','duda',[10,5,5])],
    [person('Nina','nina',[20,5,1]),person('Ivo','ivo',[10,10,2,2,2])]
  ];
  const differenceSets = [
    {people:[person('Lia','lia',[20,10,5]),person('Ravi','ravi',[20,5,2,1])],reference:1},
    {people:[person('Ana','ana',[20,20,2]),person('Beto','beto',[20,10,5]),person('Caio','caio',[20,5,2,1])],reference:2}
  ];
  const paySets = [
    [product('Lápis de cor','lapis-cor',7)], [product('Livro','livro',18)],
    [product('Jogo','jogo',25)], [product('Mochila','mochila',42)], [product('Kit de pintura','kit-pintura',68)],
    [product('Bola','bola',12),product('Corda','corda',7)],
    [product('Livro','livro',18),product('Caderno','caderno',8)],
    [product('Tintas','tintas',15),product('Pincéis','pinceis',6)],
    [product('Caderno','caderno',8,2)], [product('Caderno','caderno',5,3)]
  ];
  const changeSets = [
    [[product('Lápis de cor','lapis-cor',7)],[10]], [[product('Carrinho','carrinho',13)],[20]],
    [[product('Livro','livro',18)],[20]], [[product('Bola','bola',26)],[20,10]],
    [[product('Jogo','jogo',27)],[50]], [[product('Mochila','mochila',38)],[50]],
    [[product('Kit de pintura','kit-pintura',64)],[100]], [[product('Tênis','tenis',75)],[100]],
    [[product('Brinquedo','brinquedo',18,2)],[50]], [[product('Livro','livro',12,3)],[100]]
  ];

  const priceTotal = products => products.reduce((total,item) => total + item.price * item.quantity * 100,0);
  function comparison(question) {
    const totals = question.people.map(item => sum(item.pieces)),highest = Math.max(...totals);
    return {totals,winner:totals.every(total => total === highest) ? 'equal' : String(totals.indexOf(highest)),highest};
  }
  function expectedAmount(question) {
    if (question.type === 'money-count') return sum(question.pieces);
    if (question.type === 'money-difference') return comparison(question).highest - sum(question.people[question.reference].pieces);
    if (question.type === 'money-change') return sum(question.paidPieces) - priceTotal(question.products);
    return priceTotal(question.products);
  }
  function operationOptions(question) {
    if (!question.operation) return [];
    const [first,second] = question.products;
    const left = second ? first.price : first.quantity,right = second ? second.price : first.price;
    return [{value:'+',text:`${left} + ${right}`},{value:'×',text:`${left} × ${right}`}];
  }
  function resolution(question) {
    if (question.people) {
      const {totals,winner} = comparison(question);
      const values = question.people.map((item,index) => `${item.name}: ${formatMoney(totals[index])}`).join('; ');
      if (question.type === 'money-difference') return `${values}. ${question.people[Number(winner)].name} tem ${formatMoney(expectedAmount(question))} a mais que ${question.people[question.reference].name}.`;
      return `${values}. ${winner === 'equal' ? 'Os dois têm a mesma quantia.' : `${question.people[Number(winner)].name} tem mais dinheiro.`}`;
    }
    if (question.type === 'money-count') return `O cofrinho tem ${formatMoney(expectedAmount(question))}.`;
    if (question.type === 'money-change') return `A compra custa ${formatMoney(priceTotal(question.products))}, e o cliente entregou ${formatMoney(sum(question.paidPieces))}. O troco é ${formatMoney(expectedAmount(question))}.`;
    const operation = operationOptions(question).find(option => option.value === question.operation);
    return `${operation ? `${operation.text} = ${expectedAmount(question) / 100}. ` : ''}O pagamento exato é ${formatMoney(expectedAmount(question))}. Qualquer composição com esse total vale.`;
  }
  function withFeedback(question) { return {...question,correct:`MUITO BEM! ${resolution(question)}`}; }
  const challenge = {
    title:'Desafio 8 — Sistema monetário',
    missions:[
      {title:'Contar e comparar',intro:'Conte as cédulas e moedas nas 4 primeiras questões. Depois, compare o dinheiro de duas pessoas em 4 questões. Nas 2 últimas, escolha quem tem mais e digite quanto essa pessoa tem a mais que o personagem indicado. Você pode digitar 35, 35,00 ou R$ 35,00.',
        questions:[
          ...countSets.map((pieces,index) => withFeedback({id:`d8m1q${index + 1}`,type:'money-count',block:'A',pieces,text:'Quanto dinheiro há no cofrinho?'})),
          ...compareSets.map((people,index) => withFeedback({id:`d8m1q${index + 5}`,type:'money-compare',block:'B',people,text:'Conte o dinheiro e escolha quem tem mais.'})),
          ...differenceSets.map((set,index) => withFeedback({id:`d8m1q${index + 9}`,type:'money-difference',block:'C',...set,text:`Quem tem mais dinheiro? Quanto essa pessoa tem a mais que ${set.people[set.reference].name}?`}))
        ]},
      {title:'Pagar',intro:'Você vai à loja! Faça 5 pagamentos de um produto e 5 compras em que precisa escolher uma adição ou multiplicação antes de pagar. Arraste o dinheiro da carteira para o balcão ou toque duas vezes. Devolva peças, limpe o balcão e confirme. Qualquer combinação com o valor exato é aceita.',
        questions:paySets.map((products,index) => withFeedback({id:`d8m2q${index + 1}`,type:'money-pay',block:index < 5 ? 'A' : 'B',products,operation:index < 5 ? null : products.length > 1 ? '+' : '×',text:index < 5 ? 'Pague o produto com o valor exato.' : 'Escolha a operação e prepare o pagamento exato.'}))},
      {title:'Calcular o troco',intro:'Agora você é o vendedor. Observe o preço e o dinheiro entregue pelo cliente e prepare o troco no balcão. São 4 trocos pequenos, 4 com diferentes cédulas e 2 compras com várias unidades. Use o arraste ou o toque duplo. Abra a ajuda quando precisar lembrar como calcular o troco.',
        questions:changeSets.map(([products,paidPieces],index) => withFeedback({id:`d8m3q${index + 1}`,type:'money-change',block:index < 4 ? 'A' : index < 8 ? 'B' : 'C',products,paidPieces,text:'Você é o vendedor. Qual é o troco?'}))}
    ]
  };

  function paymentTotal(counts) {
    if (!counts || typeof counts !== 'object' || Array.isArray(counts) || Object.keys(counts).some(key => !denominations.some(value => key === String(value)))) return null;
    let total = 0;
    for (const value of denominations) {
      const count = counts[value] ?? 0;
      if (!Number.isSafeInteger(count) || count < 0) return null;
      total += value * 100 * count;
    }
    return Number.isSafeInteger(total) ? total : null;
  }
  function evaluate(question,response={}) {
    const amount = parseMoney(response.amount ?? '');
    if (question.type === 'money-count') return amount === null
      ? {complete:false,correct:false,message:'Digite o valor que você contou, como 35 ou 35,00.'}
      : {complete:true,correct:amount === expectedAmount(question),message:'Conte cada cédula e moeda uma vez e some os valores. Tente novamente.'};
    if (question.people) {
      const selected = response.selected;
      if (!(question.people.some((_,index) => selected === String(index)) || (question.type === 'money-compare' && selected === 'equal'))) return {complete:false,correct:false,message:'Escolha um personagem ou a opção de quantias iguais.'};
      if (question.type === 'money-difference' && amount === null) return {complete:false,correct:false,message:'Depois de escolher quem tem mais, digite quanto essa pessoa tem a mais que o personagem indicado.'};
      const winner = comparison(question).winner;
      return {complete:true,correct:selected === winner && (question.type !== 'money-difference' || amount === expectedAmount(question)),message:question.type === 'money-difference' ? `Conte os valores de todos. Compare quem tem mais com ${question.people[question.reference].name} e confira a diferença.` : 'Compare o valor total de cada pessoa. Ter mais peças de dinheiro não significa ter mais reais.'};
    }
    const total = paymentTotal(response.counts);
    if (question.operation && !operationOptions(question).some(option => option.value === response.operation)) return {complete:false,correct:false,message:'Escolha a operação antes de preparar o pagamento.'};
    if (total === null || total === 0) return {complete:false,correct:false,message:question.type === 'money-change' ? 'Coloque o troco no balcão antes de confirmar.' : 'Coloque o dinheiro no balcão antes de confirmar.'};
    const operationCorrect = !question.operation || question.operation === response.operation;
    return {complete:true,correct:operationCorrect && total === expectedAmount(question),total,
      message:!operationCorrect ? 'Confira a operação: some preços diferentes e use a multiplicação para várias unidades de um mesmo produto.'
        : question.type === 'money-change' ? `Você preparou ${formatMoney(total)}. O preço junto com o troco precisa completar a quantia entregue pelo cliente. Ajuste as peças e tente novamente.`
          : `Há ${formatMoney(total)} no balcão. Confira os preços e ajuste o dinheiro para fazer um pagamento exato.`};
  }

  // Recorte e orientação feitos por CSS: as imagens originais são preservadas.
  const geometry = {1:[709,[172,409,537,774]],2:[708,[156,279,607,1129]],5:[708,[146,238,598,1131]],10:[708,[130,204,577,1130]],20:[708,[130,180,577,1133]],50:[708,[120,112,589,1120]],100:[708,[112,92,591,1133]]};
  function moneyArt(value) {
    const [width,[x1,y1,x2,y2]] = geometry[value],w = x2 - x1,h = y2 - y1,coin = value === 1;
    const style = coin ? `width:${width / w * 100}%;left:${-x1 / w * 100}%;top:${-y1 / h * 100}%` : `width:${width / h * 100}%;left:${y2 / h * 100}%;top:${-x1 / w * 100}%`;
    return `<span class="money-art ${coin ? 'money-art--coin' : 'money-art--note'}" style="aspect-ratio:${coin ? `${w}/${h}` : `${h}/${w}`}"><img src="${imageRoot}/${value}.png" alt="${coin ? 'Moeda' : 'Cédula'} de ${formatMoney(value * 100)}" draggable="false" style="${style}"></span>`;
  }
  function collection(pieces) {
    return `<div class="money-collection">${pieces.map(value => `<figure>${moneyArt(value)}</figure>`).join('')}</div>`;
  }
  function amountInput(label) {
    return `<label class="money-answer-label">${escape(label)}<input type="text" inputmode="decimal" enterkeyhint="done" maxlength="24" autocomplete="off" placeholder="R$ 0,00" data-money-amount aria-label="${escape(label)}"><small>Ex.: 35 ou 35,00</small></label>`;
  }
  function productCards(products) {
    return `<div class="money-products" style="--product-count:${products.length}">${products.map(item => `<article><img class="money-product-image" src="${item.image}" alt="${escape(item.name)}" draggable="false"><div><h4>${item.quantity > 1 ? `${item.quantity} unidades de ` : ''}${escape(item.name)}</h4><p>${formatMoney(item.price * 100)}${item.quantity > 1 ? ' cada' : ''}</p></div></article>`).join('')}</div>`;
  }

  let state = null,drag = null,lastTap = null,suppressDoubleUntil = 0;
  function render(question,container,callbacks={}) {
    clear();
    state = {question,container,callbacks,selected:null,operation:null,counts:{},locked:false,feedback:'',lastResult:null};
    container.classList.add('money-activity');
    let body;
    if (question.type === 'money-count') body = `<div class="money-count-stage"><section><h4>Meu cofrinho</h4>${collection(question.pieces)}</section>${amountInput('Quanto dinheiro há no cofrinho?')}</div>`;
    else if (question.people) body = `<div class="money-people" style="--people-count:${question.people.length}">${question.people.map((item,index) => `<button type="button" class="money-person" data-money-person="${index}" aria-pressed="false" aria-label="Escolher ${escape(item.name)}"><span class="money-person-heading"><img class="money-character-image" src="${item.image}" alt="" draggable="false"><strong>${escape(item.name)}</strong></span>${collection(item.pieces)}</button>`).join('')}</div>
      ${question.type === 'money-compare' ? '<button type="button" class="money-equal" data-money-person="equal" aria-pressed="false">OS DOIS TÊM A MESMA QUANTIA</button>' : `<div class="money-difference-answer">${amountInput(question.people.length === 2 ? 'Quanto a pessoa escolhida tem a mais?' : `Quanto a pessoa escolhida tem a mais que ${question.people[question.reference].name}?`)}</div>`}`;
    else body = `<div class="money-shop">
      <section class="money-purchase" data-money-purchase aria-label="Objetos da compra"><h4 class="money-panel-title">Objetos</h4>${productCards(question.products)}
      ${question.paidPieces ? `<div class="money-client-payment"><strong>O cliente entregou</strong><span class="money-paid-amount">${formatMoney(sum(question.paidPieces))}</span>${collection(question.paidPieces)}</div>` : ''}
      ${question.operation ? `<div class="money-operation"><span>Qual operação resolve esta compra?</span><div>${operationOptions(question).map(option => `<button type="button" data-money-operation="${option.value}" aria-pressed="false">${option.text}</button>`).join('')}</div></div>` : ''}
      </section>
      <section class="money-counter" data-money-counter aria-label="Balcão para ${question.type === 'money-change' ? 'entregar o troco' : 'pagar'}"><header><div><h4 class="money-panel-title">Balcão</h4><strong data-money-total role="status" aria-live="polite">Total no balcão: R$ 0,00</strong></div><button type="button" data-money-clear>Limpar</button></header><p class="money-drop-instruction">${question.type === 'money-change' ? 'Arraste o troco para cá' : 'Arraste o dinheiro para pagar'}</p><div class="money-counter-pieces" data-money-counter-pieces></div>
      ${question.paidPieces ? '<button type="button" data-money-help aria-expanded="false" aria-controls="money-help-panel">Preciso de ajuda</button><p id="money-help-panel" data-money-help-panel hidden>VALOR PAGO − PREÇO = TROCO' + (question.products.some(item => item.quantity > 1) ? '. Primeiro, calcule o preço de todas as unidades.' : '') + '</p>' : ''}</section>
      <section class="money-wallet" data-money-wallet aria-label="${question.type === 'money-change' ? 'Gaveta do vendedor' : 'Carteira do estudante'}"><header class="money-wallet-heading"><h4 class="money-panel-title">${question.type === 'money-change' ? 'Gaveta do vendedor' : 'Minha carteira'}</h4><span data-money-wallet-total>No balcão: R$ 0,00</span></header><div class="money-wallet-grid">${denominations.map(value => `<div class="money-wallet-slot"><button type="button" class="money-piece" data-money-piece="${value}" data-money-source="wallet" aria-label="${formatMoney(value * 100)}: arraste ou toque duas vezes para adicionar">${moneyArt(value)}</button></div>`).join('')}</div></section>
    </div>
      <p class="money-controls-help">Arraste ou toque duas vezes para adicionar. Para devolver, arraste para ${question.type === 'money-change' ? 'a gaveta' : 'a carteira'} ou toque duas vezes na peça do balcão. Você pode repetir os valores.</p>
    `;
    container.innerHTML = `<div class="money-game">${body}<p class="money-message" data-money-message role="status" aria-live="polite"></p></div>`;
    state.root = container.querySelector('.money-game');
    refresh();
    const input = state.root.querySelector('[data-money-amount]');
    if (question.type === 'money-count' && state.root.getClientRects().length) input.focus({preventScroll:true});
  }

  function response() {
    return {amount:state.root.querySelector('[data-money-amount]')?.value ?? '',selected:state.selected,counts:state.counts,operation:state.operation};
  }
  function refresh() {
    const {question,root,locked} = state;
    root.querySelectorAll('[data-money-person]').forEach(button => {
      const selected = button.dataset.moneyPerson === state.selected;
      button.classList.toggle('is-selected',selected); button.setAttribute('aria-pressed',String(selected)); button.disabled = locked;
    });
    root.querySelectorAll('[data-money-operation]').forEach(button => {
      const selected = button.dataset.moneyOperation === state.operation;
      button.classList.toggle('is-selected',selected); button.setAttribute('aria-pressed',String(selected)); button.disabled = locked;
    });
    const walletLocked = locked || Boolean(question.operation && !state.operation);
    root.querySelectorAll('[data-money-piece][data-money-source="wallet"]').forEach(button => { button.disabled = walletLocked; });
    const counter = root.querySelector('[data-money-counter-pieces]');
    if (counter) {
      counter.innerHTML = denominations.flatMap(value => Array.from({length:state.counts[value] || 0},() => `<button type="button" class="money-piece money-counter-piece" data-money-piece="${value}" data-money-source="counter" aria-label="Devolver ${value === 1 ? 'uma moeda' : 'uma cédula'} de ${formatMoney(value * 100)}: arraste para ${question.type === 'money-change' ? 'a gaveta' : 'a carteira'} ou toque duas vezes" ${locked ? 'disabled' : ''}>${moneyArt(value)}</button>`)).join('') || `<span class="money-counter-empty">${question.operation && !state.operation ? 'Escolha a operação para abrir a carteira.' : 'Coloque o dinheiro aqui.'}</span>`;
      root.querySelector('[data-money-total]').textContent = `Total no balcão: ${formatMoney(paymentTotal(state.counts))}`;
      root.querySelector('[data-money-wallet-total]').textContent = `No balcão: ${formatMoney(paymentTotal(state.counts))}`;
      root.querySelector('[data-money-clear]').disabled = walletLocked || paymentTotal(state.counts) === 0;
    }
    root.querySelectorAll('[data-money-amount]').forEach(input => { input.disabled = locked; });
    state.callbacks.onReady?.(!locked && evaluate(question,response()).complete);
  }
  function changed() {
    state.feedback = ''; state.lastResult = null;
    state.root.querySelector('[data-money-message]').textContent = '';
    state.root.querySelectorAll('.is-correct,.is-wrong').forEach(element => element.classList.remove('is-correct','is-wrong'));
    state.root.querySelector('[data-money-amount]')?.removeAttribute('aria-invalid');
    state.callbacks.onChange?.(); refresh();
  }
  function move(value,source='wallet') {
    if (!state || state.locked || !denominations.includes(value) || (state.question.operation && !state.operation)) return false;
    const count = state.counts[value] || 0,change = source === 'counter' ? -1 : 1;
    if (count + change < 0 || !Number.isSafeInteger((paymentTotal(state.counts) || 0) + change * value * 100)) return false;
    state.counts[value] = count + change; changed(); return true;
  }
  function handleClick(event) {
    if (!state || !state.root.contains(event.target)) return false;
    const help = event.target.closest('[data-money-help]');
    if (help) { const panel = state.root.querySelector('[data-money-help-panel]'); panel.hidden = !panel.hidden; help.setAttribute('aria-expanded',String(!panel.hidden)); return true; }
    if (state.locked) return true;
    const personButton = event.target.closest('[data-money-person]');
    if (personButton) { state.selected = personButton.dataset.moneyPerson; changed(); return true; }
    const operation = event.target.closest('[data-money-operation]');
    if (operation) { state.operation = operation.dataset.moneyOperation; changed(); return true; }
    if (event.target.closest('[data-money-clear]')) { state.counts = {}; changed(); return true; }
    const piece = event.target.closest('[data-money-piece]');
    if (piece && !piece.disabled && event.detail === 0) move(Number(piece.dataset.moneyPiece),piece.dataset.moneySource);
    return true;
  }
  function handleInput(event) {
    if (!state?.root || state.locked || !state.root.contains(event.target) || !event.target.matches('[data-money-amount]')) return;
    changed();
  }
  function handleBlur(event) {
    if (!state?.root || state.locked || !state.root.contains(event.target) || !event.target.matches('[data-money-amount]')) return;
    const amount = parseMoney(event.target.value);
    if (amount !== null) event.target.value = formatMoney(amount);
  }
  function handleKeydown(event) {
    return Boolean(state && state.root.contains(event.target) && event.target.closest('button') && ['Enter',' '].includes(event.key));
  }
  function submit() {
    if (!state || state.locked) return null;
    const input = state.root.querySelector('[data-money-amount]');
    if (input) handleBlur({target:input});
    const result = evaluate(state.question,response());
    state.lastResult = result; state.feedback = result.message;
    state.root.querySelector('[data-money-message]').textContent = result.complete ? '' : result.message;
    if (!result.complete) input?.focus();
    else {
      const target = input || state.root.querySelector(`[data-money-person="${state.selected}"]`) || state.root.querySelector('[data-money-counter]');
      target?.classList.toggle('is-correct',result.correct); target?.classList.toggle('is-wrong',!result.correct);
      input?.setAttribute('aria-invalid',String(!result.correct));
    }
    return result;
  }
  function lock() {
    if (!state) return;
    cancelDrag(); state.locked = true; refresh();
    if (state.lastResult && !state.lastResult.correct) state.feedback = `Vamos conferir. ${resolution(state.question)}`;
  }
  function cancelDrag() {
    if (!drag) return;
    if (drag.scrollFrame) cancelAnimationFrame(drag.scrollFrame);
    drag.ghost?.remove(); drag.element.classList.remove('is-dragging');
    if (drag.element.hasPointerCapture?.(drag.pointerId)) drag.element.releasePointerCapture(drag.pointerId);
    drag = null;
  }
  function clear() { cancelDrag(); state = null; lastTap = null; suppressDoubleUntil = 0; }

  function scrollWhileDragging() {
    if (!drag?.moved) return;
    const up = Math.max(0,110 - drag.clientY),down = Math.max(0,drag.clientY - (innerHeight - 70));
    if (up || down) window.scrollBy(0,Math.max(-18,Math.min(18,(down - up) / 4)));
    drag.scrollFrame = requestAnimationFrame(scrollWhileDragging);
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown',event => {
      const piece = event.target.closest('[data-money-piece]');
      if (!state || state.locked || !piece || piece.disabled || !state.root.contains(piece) || event.button !== 0) return;
      cancelDrag();
      drag = {element:piece,pointerId:event.pointerId,x:event.clientX,y:event.clientY,value:Number(piece.dataset.moneyPiece),source:piece.dataset.moneySource,moved:false};
      piece.setPointerCapture?.(event.pointerId);
    });
    document.addEventListener('pointermove',event => {
      if (!drag || drag.pointerId !== event.pointerId || !state) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.x,event.clientY - drag.y) < 8) return;
      event.preventDefault();
      if (!drag.moved) {
        drag.moved = true; lastTap = null;
        drag.ghost = drag.element.cloneNode(true); drag.ghost.className = 'money-piece money-drag-ghost';
        drag.ghost.setAttribute('aria-hidden','true'); drag.ghost.tabIndex = -1;
        document.body.appendChild(drag.ghost); drag.element.classList.add('is-dragging');
        drag.scrollFrame = requestAnimationFrame(scrollWhileDragging);
      }
      drag.clientY = event.clientY;
      drag.ghost.style.left = `${event.clientX}px`; drag.ghost.style.top = `${event.clientY}px`;
    },{passive:false});
    document.addEventListener('pointerup',event => {
      if (!drag || drag.pointerId !== event.pointerId || !state) return;
      const current = drag;
      const destination = document.elementFromPoint(event.clientX,event.clientY);
      cancelDrag();
      if (current.moved) {
        if ((current.source === 'wallet' && destination?.closest('[data-money-counter]')) || (current.source === 'counter' && destination?.closest('[data-money-wallet]'))) move(current.value,current.source);
        suppressDoubleUntil = Date.now() + 500; lastTap = null;
      } else {
        if (destination?.closest('[data-money-piece]') !== current.element) { lastTap = null; return; }
        const time = Date.now();
        if (lastTap && lastTap.value === current.value && lastTap.source === current.source && time - lastTap.time < 400) { move(current.value,current.source); suppressDoubleUntil = time + 500; lastTap = null; }
        else lastTap = {value:current.value,source:current.source,time};
      }
    });
    document.addEventListener('pointercancel',() => { cancelDrag(); lastTap = null; });
    document.addEventListener('dblclick',event => {
      const piece = event.target.closest('[data-money-piece]');
      if (!state || state.locked || !piece || piece.disabled || !state.root.contains(piece) || Date.now() < suppressDoubleUntil) return;
      move(Number(piece.dataset.moneyPiece),piece.dataset.moneySource); lastTap = null;
    });
  }

  return {challenge,isType,parseMoney,formatMoney,paymentTotal,priceTotal,expectedAmount,comparison,operationOptions,evaluate,resolution,
    denominations,moneyArt,render,handleClick,handleInput,handleBlur,handleKeydown,submit,lock,clear,
    get feedback() { return state?.feedback || ''; },
    get spokenQuestion() {
      if (!state) return '';
      const q = state.question;
      const pieces = values => values.map(value => `${value === 1 ? 'moeda' : 'cédula'} de ${value} ${value === 1 ? 'real' : 'reais'}`).join(', ');
      if (q.type === 'money-count') return `${q.text} ${pieces(q.pieces)}.`;
      if (q.people) return `${q.text} ${q.people.map(item => `${item.name} possui ${pieces(item.pieces)}.`).join(' ')}`;
      return `${q.text} ${q.products.map(item => `${item.quantity} ${item.name}, ${formatMoney(item.price * 100)} cada.`).join(' ')}${q.paidPieces ? ` O cliente entregou ${formatMoney(sum(q.paidPieces))}.` : ''}`;
    }};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = moneyMissions;
