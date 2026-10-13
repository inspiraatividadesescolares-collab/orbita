const subtractionCards = (() => {
  const pairSets = [
    [3,5,7,9,11,14], [2,6,8,12,15,18], [4,7,10,13,16,19],
    [1,5,9,12,17,20], [3,6,11,14,18,20], [2,7,10,15,17,19],
    [4,8,12,13,16,20], [1,6,9,14,15,18], [5,7,11,16,18,20],
    [2,8,10,13,17,20]
  ];
  const targetSets = [
    [10,[1,2,4,5,7,9]], [10,[0,3,4,6,8,9]],
    [15,[2,5,7,10,12,13]], [15,[1,4,6,9,11,14]], [15,[3,7,8,10,12,14]],
    [20,[2,6,9,12,15,18]], [20,[1,5,8,11,16,19]],
    [20,[3,7,10,13,17,18]], [20,[4,8,12,14,16,19]], [20,[5,9,11,15,17,19]]
  ];
  const reviewSets = [
    [[10,4,6],[9,3,5],[8,5,3],[12,2,10],[11,5,7],[7,3,4]],
    [[14,6,8],[15,5,9],[13,7,6],[18,8,10],[16,9,8],[12,4,8]],
    [[17,8,9],[20,7,13],[15,6,8],[14,9,5],[19,5,13],[16,7,9]],
    [[20,8,12],[18,9,8],[17,5,12],[13,6,7],[15,8,6],[19,7,12]],
    [[16,8,8],[12,7,6],[18,6,12],[20,9,11],[17,9,7],[14,5,9]],
    [[15,7,8],[19,8,11],[16,6,9],[20,5,15],[18,7,12],[13,8,5]],
    [[20,11,9],[19,12,7],[18,13,6],[17,10,7],[16,12,5],[15,11,4]],
    [[20,14,6],[18,12,6],[17,13,5],[19,15,4],[16,11,5],[15,12,2]],
    [[19,9,10],[20,12,8],[18,11,8],[17,8,9],[16,7,8],[15,9,6]],
    [[20,13,7],[19,11,8],[18,9,10],[17,12,5],[16,8,8],[15,7,7]]
  ];
  const challenge = {
    title:'Desafio 4 — Desafio das cartas: subtração',
    missions:[
      {
        title:'Escolha os termos da operação',
        intro:'Em cada uma das 10 rodadas, escolha duas das seis cartas viradas para baixo. Depois, toque na carta com o maior número para colocá-lo no início da subtração. Faça maior − menor, digite o resultado e clique em CONFIRMAR.',
        questions:pairSets.map((numbers,index) => ({
          id:`d4m1-cartas-q${index + 1}`,type:'subtract-pair',numbers,
          text:'Escolha duas cartas e subtraia o número menor do maior.',
          correct:'Muito bem! Você subtraiu o número menor do número maior.',
          incorrect:'Observe os dois números. Comece pelo maior e retire o menor.'
        }))
      },
      {
        title:'Quanto falta?',
        intro:'Observe o número que precisa alcançar e escolha uma das seis cartas. Descubra quanto falta para o número da carta chegar ao alvo, digite a resposta e clique em CONFIRMAR. Complete 10 nas rodadas 1 e 2, 15 nas rodadas 3 a 5 e 20 nas rodadas 6 a 10.',
        questions:targetSets.map(([target,numbers],index) => ({
          id:`d4m2-complete-q${index + 1}`,type:'subtract-target',target,numbers,
          text:`Escolha uma carta e descubra quanto falta para chegar a ${target}.`,
          correct:'Isso mesmo! Esse é o número que faltava.'
        }))
      },
      {
        title:'Descubra o erro',
        intro:'Em cada uma das 10 questões, as seis cartas começam viradas para baixo. Escolha apenas uma carta para revelar a operação e marque CERTO ou ERRADO. Leia o feedback e passe para a próxima questão.',
        questions:reviewSets.map((operations,index) => ({
          id:`d4m3-analise-q${index + 1}`,type:'subtract-review',
          operations:operations.map(([greater,smaller,result]) => ({greater,smaller,result})),
          text:'Escolha uma carta. A operação está certa ou errada?',
          correct:'CERTO! Muito bem! Você analisou a operação corretamente.',
          incorrect:'OBSERVE NOVAMENTE! Resolva a subtração para descobrir se o resultado apresentado está correto.'
        }))
      }
    ]
  };
  const isType = question => ['subtract-pair','subtract-target','subtract-review'].includes(question.type);
  const validIndex = (index,length) => Number.isInteger(index) && index >= 0 && index < length;
  const operationText = operation => `${operation.greater} − ${operation.smaller} = ${operation.result}`;
  const greaterChoiceNotice = 'Você escolheu o número menor. Toque na carta com o maior número para continuar.';

  function evaluateNumbers(question,numbers,greaterIndex,answer) {
    const required = question.type === 'subtract-pair' ? 2 : 1;
    if (numbers.length !== required || numbers.some(number => !question.numbers.includes(number)) || new Set(numbers).size !== required) {
      return {complete:false,correct:false,message:`Escolha ${required === 2 ? 'duas cartas' : 'uma carta'} antes de responder.`};
    }
    if (required === 2 && !validIndex(greaterIndex,2)) {
      return {complete:false,correct:false,message:'Toque na carta com o maior número.'};
    }
    if (required === 2 && numbers[greaterIndex] !== Math.max(...numbers)) {
      return {complete:false,correct:false,message:greaterChoiceNotice};
    }
    if (!/^\d{1,2}$/.test(String(answer).trim()) || Number(answer) > 20) {
      return {complete:false,correct:false,message:'Digite um número de 0 a 20.'};
    }
    const greater = required === 2 ? Math.max(...numbers) : question.target;
    const smaller = required === 2 ? Math.min(...numbers) : numbers[0];
    const correct = Number(answer) === greater - smaller && (required === 1 || numbers[greaterIndex] === greater);
    return {complete:true,correct,greater,smaller,difference:greater - smaller,
      message:required === 2 ? question.incorrect : `Ainda não. Pense: quanto precisamos acrescentar a ${smaller} para chegar a ${greater}?`};
  }

  function evaluateOperation(operation,verdict) {
    if (typeof verdict !== 'boolean') return {complete:false,correct:false};
    const difference = operation.greater - operation.smaller;
    const isCorrect = difference === operation.result;
    return {complete:true,correct:verdict === isCorrect,isCorrect,difference,
      resolution:`${operation.greater} − ${operation.smaller} = ${difference}. Portanto, ${operationText(operation)} está ${isCorrect ? 'certo' : 'errado'}.`};
  }

  function createReviewRound(question) {
    return {question,active:null,attempts:0,result:null,finished:false};
  }

  function selectOperation(round,index) {
    if (round.finished || round.active !== null || !validIndex(index,round.question.operations.length)) return false;
    round.active = index;
    return true;
  }

  function answerOperation(round,verdict) {
    const index = round.active;
    if (round.finished || index === null) return null;
    const result = evaluateOperation(round.question.operations[index],verdict);
    if (!result.complete) return result;
    round.attempts += 1;
    round.result = result.correct;
    round.finished = true;
    return {...result,resolved:true,finished:true};
  }

  function reviewSummary(round) {
    return {complete:round.finished,correct:round.result === true,attempts:round.attempts,
      errors:round.result === false ? 1 : 0,retried:false};
  }

  function shuffled(numbers) {
    const deck = numbers.slice();
    for (let index = deck.length - 1; index > 0; index--) {
      const next = Math.floor(Math.random() * (index + 1));
      [deck[index],deck[next]] = [deck[next],deck[index]];
    }
    return deck;
  }

  let state = null;

  function render(question,container,callbacks={}) {
    state = {question,container,callbacks,deck:question.numbers ? shuffled(question.numbers) : [],
      selected:[],greater:null,wrongGreater:null,locked:false,feedback:'',lastResult:null,
      review:question.type === 'subtract-review' ? createReviewRound(question) : null};
    container.classList.add('subtraction-card-activity');
    const reviewing = Boolean(state.review);
    const goal = reviewing ? 'ESCOLHA 1 CARTA' : question.type === 'subtract-pair' ? 'MAIOR − MENOR' : `CHEGUE ATÉ ${question.target}`;
    container.innerHTML = `<div class="subtraction-game">
      <div class="subtraction-goal"><span>${reviewing ? 'DE OLHO NO RESULTADO' : 'SUA MISSÃO'}</span><strong>${goal}</strong></div>
      <p class="subtraction-help" data-subtraction-help aria-live="polite"></p>
      <div class="subtraction-deck ${reviewing ? 'subtraction-deck--review' : ''}" role="group" aria-label="Seis cartas de subtração">
        ${Array.from({length:6},(_,index) => `<button type="button" class="subtraction-card" data-subtraction-card="${index}" aria-pressed="false">
          <span class="subtraction-card__inner"><span class="subtraction-card__back" aria-hidden="true"><i>✦</i><b>ÓRBITA</b><small>CARTA ${index + 1}</small></span>
          <span class="subtraction-card__front"><strong data-card-value></strong><small data-card-caption></small></span></span></button>`).join('')}
      </div>
      <p class="subtraction-progress" data-subtraction-progress role="status"></p>
      ${reviewing ? `<div class="subtraction-review-panel" data-subtraction-review-panel hidden>
        <p>O resultado desta operação está…</p><strong class="subtraction-operation" data-review-operation></strong>
        <div class="subtraction-verdicts"><button type="button" data-subtraction-verdict="true">✓ CERTO</button><button type="button" data-subtraction-verdict="false">✕ ERRADO</button></div>
        <div class="subtraction-review-feedback" data-review-feedback role="status" aria-live="polite" hidden><strong data-review-feedback-title></strong><p data-review-feedback-copy></p><p class="subtraction-resolution" data-review-resolution></p><button type="button" data-speak-subtraction-review>🔊 Ouvir feedback</button></div>
      </div>` : `<div class="subtraction-answer" data-subtraction-answer hidden>
        <p data-subtraction-prompt></p><div class="subtraction-answer-line">${question.type === 'subtract-pair' ? '<strong class="subtraction-operation" data-subtraction-operation></strong>' : ''}
        <input type="text" inputmode="numeric" enterkeyhint="done" maxlength="2" pattern="[0-9]*" autocomplete="off" data-challenge-input data-subtraction-input aria-label="${question.type === 'subtract-pair' ? 'Resultado da subtração' : 'Quantidade que falta para chegar ao alvo'}"></div>
        ${question.type === 'subtract-pair' ? '<p class="subtraction-resolution" data-subtraction-resolution aria-live="polite"></p>' : ''}
      </div>`}
      <p class="subtraction-message" data-subtraction-message role="status" aria-live="polite"></p>
    </div>`;
    state.root = container.querySelector('.subtraction-game');
    refresh();
  }

  function refresh() {
    const {question,review,selected,greater,container} = state;
    const required = question.type === 'subtract-pair' ? 2 : 1;
    const ready = selected.length === required && (required === 1 || (greater !== null && state.deck[greater] === Math.max(...selected.map(index => state.deck[index]))));
    container.querySelectorAll('[data-subtraction-card]').forEach((button,index) => {
      const revealed = review ? review.active === index : selected.includes(index);
      const active = review ? review.active === index : greater === index;
      const resolved = review && review.finished && review.active === index;
      button.classList.toggle('is-face-up',revealed);
      button.classList.toggle('is-selected',active);
      button.classList.toggle('is-wrong-choice',state.wrongGreater === index);
      button.classList.toggle('is-analyzed',Boolean(resolved));
      button.classList.toggle('needs-review',resolved && review.result === false);
      button.disabled = state.locked || (review ? review.active !== null : selected.length >= required && (required === 1 || !selected.includes(index)));
      button.setAttribute('aria-pressed',String(active));
      const value = revealed ? review ? operationText(question.operations[index]) : state.deck[index] : '';
      const caption = !revealed ? '' : review ? resolved ? (question.operations[index].greater - question.operations[index].smaller === question.operations[index].result ? 'Resultado certo' : 'Resultado errado') : 'Analise a operação' : state.wrongGreater === index ? 'NÚMERO MENOR' : active ? 'MAIOR NÚMERO' : (required === 2 ? 'Carta escolhida' : 'SEU NÚMERO');
      button.querySelector('[data-card-value]').textContent = value;
      button.querySelector('[data-card-caption]').textContent = caption;
      button.setAttribute('aria-label',revealed ? `Carta ${index + 1}: ${value}. ${caption}${resolved ? '. Analisada' : ''}` : `Carta ${index + 1}, virada para baixo`);
    });
    container.querySelector('[data-subtraction-help]').textContent = review
      ? review.finished ? 'Resposta registrada. Passe para a próxima questão.' : review.active === null ? 'Toque em uma carta para revelar a operação.' : 'Resolva a subtração e confira o resultado apresentado.'
      : selected.length < required ? `Escolha ${required === 2 ? 'duas cartas' : 'uma carta'} para revelar os números.`
        : required === 2 && greater === null ? 'Agora toque na carta com o maior número.' : 'Digite a resposta e clique em CONFIRMAR.';
    container.querySelector('[data-subtraction-progress]').textContent = review
      ? `${review.active === null ? 0 : 1} de 1 carta escolhida`
      : `${selected.length} de ${required} carta${required === 2 ? 's' : ''} escolhida${required === 2 ? 's' : ''}`;
    if (!review) {
      const answer = container.querySelector('[data-subtraction-answer]');
      const operation = container.querySelector('[data-subtraction-operation]');
      answer.hidden = !ready;
      if (operation && !ready) operation.textContent = '';
      if (ready) {
        const first = required === 2 ? state.deck[greater] : question.target;
        const second = required === 2 ? state.deck[selected.find(index => index !== greater)] : state.deck[selected[0]];
        container.querySelector('[data-subtraction-prompt]').textContent = required === 2 ? 'Faça maior − menor:' : 'Quanto falta?';
        if (operation) operation.textContent = `${first} − ${second} =`;
      }
      state.callbacks.onReady?.(ready);
    } else {
      container.querySelector('[data-subtraction-review-panel]').hidden = review.active === null;
      if (review.active !== null) container.querySelector('[data-review-operation]').textContent = operationText(question.operations[review.active]);
    }
  }

  function changed() {
    state.container.querySelector('[data-subtraction-message]').textContent = '';
    state.callbacks.onChange?.();
  }

  function handleClick(event) {
    if (!state || !state.root.contains(event.target)) return false;
    if (event.target.closest('[data-speak-subtraction-review]')) return false;
    if (state.locked) return true;
    const card = event.target.closest('[data-subtraction-card]');
    if (card && !card.disabled) {
      const index = Number(card.dataset.subtractionCard);
      if (state.review) {
        if (!selectOperation(state.review,index)) return true;
        state.container.querySelector('[data-review-feedback]').hidden = true;
      } else if (!state.selected.includes(index)) {
        state.selected.push(index);
      } else if (state.question.type === 'subtract-pair' && state.selected.length === 2) {
        const largest = Math.max(...state.selected.map(selectedIndex => state.deck[selectedIndex]));
        state.wrongGreater = state.deck[index] === largest ? null : index;
        state.greater = state.wrongGreater === null ? index : null;
        state.container.querySelector('[data-subtraction-input]').value = '';
      }
      refresh(); changed();
      if (state.wrongGreater !== null) state.container.querySelector('[data-subtraction-message]').textContent = greaterChoiceNotice;
      if (state.review) state.container.querySelector('[data-subtraction-verdict]').focus();
      return true;
    }
    const verdict = event.target.closest('[data-subtraction-verdict]');
    if (verdict && !verdict.disabled) {
      const result = answerOperation(state.review,verdict.dataset.subtractionVerdict === 'true');
      if (!result?.complete) return true;
      const feedback = state.container.querySelector('[data-review-feedback]');
      feedback.hidden = false; feedback.classList.toggle('is-error',!result.correct);
      feedback.querySelector('[data-review-feedback-title]').textContent = result.correct ? 'CERTO!' : 'OBSERVE NOVAMENTE!';
      feedback.querySelector('[data-review-feedback-copy]').textContent = result.correct ? 'Muito bem! Você analisou a operação corretamente.' : 'Resolva a subtração para descobrir se o resultado apresentado está correto.';
      feedback.querySelector('[data-review-resolution]').textContent = result.resolved ? result.resolution : '';
      state.container.querySelectorAll('[data-subtraction-verdict]').forEach(button => { button.disabled = result.resolved; });
      state.callbacks.onVerdict?.(result.correct);
      refresh();
      if (result.finished) state.callbacks.onComplete?.(reviewSummary(state.review));
      return true;
    }
    // A leitura em voz alta é tratada pelo aplicativo, inclusive após a rodada terminar.
    return !event.target.closest('[data-speak-subtraction-review]');
  }

  function handleInput(event) {
    if (!state || state.locked || !event.target.matches('[data-subtraction-input]') || !state.root.contains(event.target)) return;
    changed();
  }

  function submit() {
    if (!state || state.locked || state.review) return null;
    const input = state.container.querySelector('[data-subtraction-input]');
    const result = evaluateNumbers(state.question,state.selected.map(index => state.deck[index]),state.selected.indexOf(state.greater),input.value);
    state.feedback = result.message;
    state.lastResult = result;
    state.container.querySelector('[data-subtraction-message]').textContent = result.complete ? '' : result.message;
    if (!result.complete && !input.closest('[hidden]')) input.focus();
    return result;
  }

  function lock() {
    if (!state) return;
    state.locked = true;
    if (state.lastResult?.complete) {
      const {greater,smaller,difference} = state.lastResult;
      if (state.question.type === 'subtract-pair') {
        state.greater = state.selected.find(index => state.deck[index] === greater);
        refresh();
      }
      const input = state.container.querySelector('[data-subtraction-input]');
      input.classList.toggle('is-correct',state.lastResult.correct);
      input.classList.toggle('is-wrong',!state.lastResult.correct);
      input.setAttribute('aria-invalid',String(!state.lastResult.correct));
      if (state.question.type === 'subtract-pair') state.container.querySelector('[data-subtraction-resolution]').textContent = `${greater} − ${smaller} = ${difference}`;
    }
    state.container.querySelectorAll('button,input').forEach(element => { if (!element.matches('[data-speak-subtraction-review]')) element.disabled = true; });
  }

  function clear() { state = null; }

  return {challenge,isType,render,handleClick,handleInput,submit,lock,clear,
    evaluateNumbers,evaluateOperation,createReviewRound,selectOperation,answerOperation,reviewSummary,
    get feedback() { return state?.feedback || ''; },
    get spokenQuestion() {
      if (!state) return '';
      if (state.review && state.review.active !== null) return `O resultado da operação ${operationText(state.question.operations[state.review.active])} está certo ou errado?`;
      if (state.question.type === 'subtract-target' && state.selected.length) return `Quanto falta para ${state.deck[state.selected[0]]} chegar a ${state.question.target}?`;
      if (state.question.type === 'subtract-pair' && state.selected.length === 2) return `As cartas escolhidas são ${state.selected.map(index => state.deck[index]).join(' e ')}. Identifique o maior número e subtraia o menor. Digite o resultado e confirme.`;
      return state.question.text;
    }};
})();

if (typeof module !== 'undefined') module.exports = subtractionCards;
