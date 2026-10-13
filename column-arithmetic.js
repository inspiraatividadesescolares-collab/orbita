const columnArithmetic = (() => {
  const places = ['unidades','dezenas','centenas'];
  const additionSets = [
    [132,323],[214,152],[341,227],[403,165],[526,243],
    [162,407],[235,354],[620,179],[451,238],[703,186]
  ];
  const subtractionSets = [
    [536,323],[764,241],[895,462],[648,215],[957,436],
    [783,152],[609,204],[870,350],[466,143],[999,678]
  ];
  const mixedSets = [
    ['+',241,326],['−',875,342],['−',698,265],['+',512,174],['+',360,428],
    ['−',947,526],['+',125,643],['−',786,154],['−',550,230],['+',804,183]
  ];

  function makeQuestion(mission,index,sign,top,bottom) {
    const result = sign === '+' ? top + bottom : top - bottom;
    return {
      id:`d6m${mission}q${index + 1}`,type:'column-arithmetic',sign,top,bottom,result,
      text:mission === 3 ? 'Observe o sinal e resolva a conta.' : `Resolva a ${sign === '+' ? 'adição' : 'subtração'} sem reagrupamento.`,
      correct:`MUITO BEM! ${top} ${sign} ${bottom} = ${result}. Você resolveu a conta começando pelas unidades!`
    };
  }

  const challenge = {
    title:'Desafio 6 — Adição e subtração sem reagrupamento',
    missions:[
      {
        title:'Adição sem reagrupamento',
        intro:'Resolva 10 adições sem reagrupamento. Digite cada algarismo do resultado diretamente no seu quadradinho, começando pelas unidades, à direita. Depois preencha as dezenas e as centenas e confira a resposta.',
        questions:additionSets.map(([top,bottom],index) => makeQuestion(1,index,'+',top,bottom))
      },
      {
        title:'Subtração sem reagrupamento',
        intro:'Resolva 10 subtrações sem reagrupamento. Digite cada algarismo do resultado diretamente no seu quadradinho: primeiro as unidades, à direita, depois as dezenas e as centenas. Confira quando os três estiverem preenchidos.',
        questions:subtractionSets.map(([top,bottom],index) => makeQuestion(2,index,'−',top,bottom))
      },
      {
        title:'Adição e subtração sem reagrupamento',
        intro:'Resolva 10 contas que misturam adição e subtração sem reagrupamento. Observe o sinal em cada questão: + para somar e − para subtrair. Digite os algarismos nos quadradinhos, começando pelas unidades, depois dezenas e centenas.',
        questions:mixedSets.map(([sign,top,bottom],index) => makeQuestion(3,index,sign,top,bottom))
      }
    ]
  };

  const isType = question => question?.type === 'column-arithmetic';
  const digits = number => String(number).padStart(3,'0').split('').reverse();

  // Os valores seguem a ordem de preenchimento: unidades, dezenas, centenas.
  function evaluate(question,values) {
    if (!Array.isArray(values) || values.length !== 3 || Array.from(values).some(value => !/^[0-9]$/.test(String(value)))) {
      return {complete:false,correct:false,message:'Digite um algarismo em cada quadradinho, começando pelas unidades.'};
    }
    const expected = digits(question.result);
    const matches = values.map((value,place) => String(value) === expected[place]);
    return {complete:true,correct:matches.every(Boolean),matches,
      message:`Observe o sinal ${question.sign}. ${question.sign === '+' ? 'Some' : 'Subtraia'} os algarismos de cada coluna, começando pelas unidades, depois dezenas e centenas. Tente novamente.`};
  }

  function resolution(question) {
    const top = digits(question.top),bottom = digits(question.bottom);
    const steps = places.map((place,index) => `${place}: ${top[index]} ${question.sign} ${bottom[index]} = ${digits(question.result)[index]}`);
    return `${question.top} ${question.sign} ${question.bottom} = ${question.result}. Confira por coluna: ${steps.join('; ')}.`;
  }

  let state = null;

  function render(question,container,callbacks={}) {
    state = {question,container,callbacks,locked:false,feedback:'',lastResult:null};
    container.classList.add('column-arithmetic-activity');
    const row = (number,sign='') => `<div class="column-arithmetic-row"><span class="column-arithmetic-sign" aria-hidden="true">${sign}</span>${String(number).split('').map(digit => `<span>${digit}</span>`).join('')}</div>`;
    container.innerHTML = `<div class="column-arithmetic">
      <p class="column-arithmetic-help" id="column-arithmetic-help">Digite nos quadradinhos, começando pelas unidades, à direita.</p>
      <div class="column-arithmetic-board" role="group" aria-label="${question.top} ${question.sign === '+' ? 'mais' : 'menos'} ${question.bottom}">
        <div class="column-arithmetic-labels" aria-hidden="true"><span></span><span>C</span><span>D</span><span>U</span></div>
        ${row(question.top)}${row(question.bottom,question.sign)}
        <div class="column-arithmetic-line" aria-hidden="true"></div>
        <div class="column-arithmetic-row column-arithmetic-answer">
          ${places.map((place,index) => `<input type="text" inputmode="numeric" enterkeyhint="${index < 2 ? 'next' : 'done'}" maxlength="1" pattern="[0-9]" autocomplete="off" spellcheck="false" data-column-digit="${index}" style="grid-column:${4 - index};grid-row:1" aria-label="Algarismo das ${place} do resultado" aria-describedby="column-arithmetic-help" ${index ? 'disabled' : ''}>`).join('')}
        </div>
      </div>
      <p class="column-arithmetic-order">Unidades → dezenas → centenas</p>
      <p class="column-arithmetic-message" data-column-arithmetic-message role="status" aria-live="polite"></p>
    </div>`;
    state.root = container.querySelector('.column-arithmetic');
    state.inputs = [...container.querySelectorAll('[data-column-digit]')];
    refresh();
    if (state.root.getClientRects().length) state.inputs[0].focus({preventScroll:true});
  }

  function refresh() {
    state.inputs.forEach((input,index) => {
      input.disabled = state.locked || state.inputs.slice(0,index).some(previous => !previous.value);
    });
    state.callbacks.onReady?.(!state.locked && state.inputs.every(input => /^[0-9]$/.test(input.value)));
  }

  function handleInput(event) {
    if (!state || state.locked || !state.inputs.includes(event.target) || event.target.disabled) return;
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g,'').slice(-1);
    const index = Number(input.dataset.columnDigit);
    if (!input.value) state.inputs.slice(index + 1).forEach(next => { next.value = ''; });
    state.inputs.forEach(cell => { cell.classList.remove('is-correct','is-wrong'); cell.removeAttribute('aria-invalid'); });
    state.feedback = '';
    state.lastResult = null;
    state.container.querySelector('[data-column-arithmetic-message]').textContent = '';
    state.callbacks.onChange?.();
    refresh();
    if (input.value && index < 2) {
      state.inputs[index + 1].focus({preventScroll:true});
      state.inputs[index + 1].select();
    }
  }

  function handleKeydown(event) {
    if (!state || state.locked || !state.inputs.includes(event.target)) return false;
    const index = Number(event.target.dataset.columnDigit);
    let next = null;
    if (event.key === 'ArrowLeft') next = state.inputs[index + 1];
    if (event.key === 'ArrowRight' || (event.key === 'Backspace' && !event.target.value)) next = state.inputs[index - 1];
    if (event.key === 'Enter' && state.inputs.some(input => !input.value)) next = state.inputs.find(input => !input.value);
    if (next && !next.disabled) {
      event.preventDefault();
      next.focus({preventScroll:true}); next.select();
      return true;
    }
    return false;
  }

  function submit() {
    if (!state || state.locked) return null;
    const result = evaluate(state.question,state.inputs.map(input => input.value));
    state.lastResult = result;
    state.feedback = result.message;
    state.container.querySelector('[data-column-arithmetic-message]').textContent = result.complete ? '' : result.message;
    if (!result.complete) state.inputs.find(input => !input.value && !input.disabled)?.focus();
    else state.inputs.forEach((input,index) => {
      input.classList.toggle('is-correct',result.matches[index]);
      input.classList.toggle('is-wrong',!result.matches[index]);
      input.setAttribute('aria-invalid',String(!result.matches[index]));
    });
    return result;
  }

  function lock() {
    if (!state) return;
    state.locked = true;
    refresh();
    if (state.lastResult && !state.lastResult.correct) {
      const answer = resolution(state.question);
      state.feedback = `Vamos conferir a conta. ${answer}`;
    }
  }

  function clear() { state = null; }

  return {challenge,isType,render,handleInput,handleKeydown,submit,lock,clear,evaluate,resolution,
    get feedback() { return state?.feedback || ''; },
    get spokenQuestion() {
      if (!state) return '';
      const {question} = state;
      return `${question.text} ${question.top} ${question.sign === '+' ? 'mais' : 'menos'} ${question.bottom}. Digite os algarismos nos quadradinhos, começando pelas unidades, depois dezenas e centenas.`;
    }};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = columnArithmetic;
