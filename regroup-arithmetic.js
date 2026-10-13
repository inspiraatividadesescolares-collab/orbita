const regroupArithmetic = (() => {
  const places = ['unidades','dezenas','centenas'];
  const additionSets = [
    [139,383],[247,126],[358,264],[426,185],[567,218],
    [185,237],[609,174],[462,281],[294,507],[368,257]
  ];
  const subtractionSets = [
    [731,326],[542,218],[864,479],[653,287],[902,456],
    [700,348],[810,275],[624,158],[754,382],[600,237]
  ];
  const mixedSets = [
    ['+',268,157],['−',821,347],['−',705,268],['+',436,287],['+',157,368],
    ['−',642,286],['+',584,239],['−',900,475],['−',763,428],['+',309,486]
  ];
  const digits = number => String(number).padStart(3,'0').split('').reverse().map(Number);
  const isDigit = value => /^[0-9]$/.test(String(value));
  const isType = question => question?.type === 'regroup-arithmetic';

  function makeQuestion(mission,index,sign,top,bottom) {
    const result = sign === '+' ? top + bottom : top - bottom;
    return {id:`d7m${mission}q${index + 1}`,type:'regroup-arithmetic',sign,top,bottom,result,
      text:mission === 3 ? 'Observe o sinal e resolva com reagrupamento.' : `Resolva a ${sign === '+' ? 'adição' : 'subtração'} com reagrupamento.`,
      correct:`MUITO BEM! ${top} ${sign} ${bottom} = ${result}. O resultado e os reagrupamentos estão corretos!`};
  }

  const challenge = {
    title:'Desafio 7 — Adição e subtração com reagrupamento',
    missions:[
      {title:'Adição com reagrupamento',
        intro:'Resolva 10 adições, começando pelas unidades. Digite o algarismo do resultado no quadradinho de baixo e registre a reserva no quadradinho acima da próxima casa. Inclua essa reserva ao somar a próxima coluna.',
        questions:additionSets.map(([top,bottom],index) => makeQuestion(1,index,'+',top,bottom))},
      {title:'Subtração com reagrupamento',
        intro:'Resolva 10 subtrações, começando pelas unidades. Quando precisar emprestar, digite no quadradinho de cima quanto fica na casa que empresta. O sistema risca os algarismos envolvidos e registra o valor na casa que recebe. Depois digite o resultado embaixo. Se houver zero, comece o empréstimo na próxima casa disponível.',
        questions:subtractionSets.map(([top,bottom],index) => makeQuestion(2,index,'−',top,bottom))},
      {title:'Adição e subtração com reagrupamento',
        intro:'Resolva 10 contas de adição e subtração com reagrupamento. Observe o sinal antes de calcular. Registre as reservas ou os empréstimos nos quadradinhos acima da operação e preencha o resultado a partir das unidades.',
        questions:mixedSets.map(([sign,top,bottom],index) => makeQuestion(3,index,sign,top,bottom))}
    ]
  };

  // Cada tarefa corresponde a um registro do jogador ou a uma coluna do resultado.
  function plan(question) {
    const top = digits(question.top),bottom = digits(question.bottom);
    const records = [],tasks = [],columns = [];
    const recordTask = record => {
      const index = records.length;
      records.push(record);
      tasks.push({kind:'record',index,place:record.donor ?? record.place,expected:String(record.after ?? 1)});
    };
    if (question.sign === '+') {
      let carry = 0;
      for (let place = 0; place < 3; place++) {
        const total = top[place] + bottom[place] + carry;
        columns.push({top:top[place],bottom:bottom[place],carry,total,result:total % 10});
        tasks.push({kind:'answer',index:place,place,expected:String(total % 10)});
        carry = Math.floor(total / 10);
        if (carry && place < 2) recordTask({place:place + 1,source:place,after:carry});
      }
    } else {
      const work = top.slice();
      function borrow(receiver,trigger) {
        const donor = receiver + 1;
        if (donor > 2) throw new Error('A subtração precisa ter resultado positivo.');
        if (work[donor] === 0) borrow(donor,trigger);
        const before = work[donor],receivedBefore = work[receiver];
        work[donor] -= 1; work[receiver] += 10;
        recordTask({donor,receiver,trigger,before,after:work[donor],receivedBefore,received:work[receiver]});
      }
      for (let place = 0; place < 3; place++) {
        if (work[place] < bottom[place]) borrow(place,place);
        const result = work[place] - bottom[place];
        columns.push({top:work[place],bottom:bottom[place],result});
        tasks.push({kind:'answer',index:place,place,expected:String(result)});
      }
    }
    return {records,tasks,columns};
  }

  function evaluate(question,answers,entries) {
    const expected = plan(question);
    if (!Array.isArray(answers) || answers.length !== 3 || Array.from(answers).some(value => !isDigit(value)) ||
        !Array.isArray(entries) || entries.length !== expected.records.length || Array.from(entries).some(value => !isDigit(value))) {
      return {complete:false,correct:false,message:'Preencha o resultado e registre os reagrupamentos nos quadradinhos acima da operação.'};
    }
    const matches = answers.map((value,index) => Number(value) === expected.columns[index].result);
    const recordMatches = entries.map((value,index) => Number(value) === expected.records[index].after);
    return {complete:true,correct:matches.every(Boolean) && recordMatches.every(Boolean),matches,recordMatches,
      message:recordMatches.some(match => !match)
        ? `Confira os registros acima da operação. ${question.sign === '+' ? 'A cada grupo de 10, reserve 1 na próxima casa.' : 'Ao emprestar, a casa que empresta deve diminuir em 1.'} Tente novamente.`
        : `Observe o sinal ${question.sign} e use os valores reagrupados ao calcular cada coluna. Tente novamente.`};
  }

  function resolution(question) {
    const work = plan(question);
    const changes = work.records.map(record => question.sign === '+'
      ? `reserve ${record.after} nas ${places[record.place]}`
      : `${places[record.donor]}: ${record.before} → ${record.after}; ${places[record.receiver]}: ${record.receivedBefore} → ${record.received}`);
    const columns = work.columns.map((column,place) => `${places[place]}: ${column.top} ${question.sign} ${column.bottom}${column.carry ? ` + ${column.carry}` : ''} = ${column.total ?? column.result}${column.total >= 10 ? ` (escreva ${column.result})` : ''}`);
    return `${question.top} ${question.sign} ${question.bottom} = ${question.result}. Reagrupamentos: ${changes.join('; ')}. ${columns.join('; ')}.`;
  }

  function working(question,entries) {
    const values = digits(question.top),changed = new Set(),latest = Array(3).fill(null);
    if (question.sign === '−') {
      const records = plan(question).records;
      for (let index = 0; index < records.length && isDigit(entries[index]); index++) {
        const {donor,receiver} = records[index];
        values[donor] = Number(entries[index]); values[receiver] += 10;
        changed.add(donor); changed.add(receiver);
        latest[donor] = {kind:'manual',index}; latest[receiver] = {kind:'auto',index};
      }
    }
    return {values,changed,latest};
  }

  let state = null;
  const taskValue = task => task.kind === 'answer' ? state.answers[task.index] : state.entries[task.index];
  function progress() {
    const pending = state.plan.tasks.findIndex(task => !isDigit(taskValue(task)));
    return pending < 0 ? state.plan.tasks.length : pending;
  }
  function focusTask(index=progress()) {
    const task = state.plan.tasks[index];
    if (!task) return;
    const input = task.kind === 'answer' ? state.answersInputs[task.place] : state.recordInputs[task.place];
    if (!input.disabled && !input.readOnly) { input.focus({preventScroll:true}); input.select(); }
  }

  function render(question,container,callbacks={}) {
    state = {question,container,callbacks,plan:plan(question),answers:Array(3).fill(''),entries:Array(plan(question).records.length).fill(''),locked:false,feedback:'',lastResult:null};
    container.classList.add('column-arithmetic-activity','regroup-arithmetic-activity');
    const top = String(question.top).split('');
    container.innerHTML = `<div class="column-arithmetic regroup-arithmetic">
      <p class="column-arithmetic-help" id="regroup-arithmetic-help" data-regroup-help></p>
      <div class="column-arithmetic-board" role="group" aria-label="${question.top} ${question.sign === '+' ? 'mais' : 'menos'} ${question.bottom}, com reagrupamento">
        <div class="column-arithmetic-labels" aria-hidden="true"><span></span><span>C</span><span>D</span><span>U</span></div>
        <div class="column-arithmetic-row regroup-record-row" role="group" aria-label="Registros dos reagrupamentos">
          ${places.map((place,index) => question.sign === '+' && index === 0 ? '' : `<input type="text" inputmode="numeric" enterkeyhint="next" maxlength="1" pattern="[0-9]*" autocomplete="off" spellcheck="false" data-regroup-record="${index}" style="grid-column:${4 - index};grid-row:1" aria-label="${question.sign === '+' ? 'Reserva' : 'Valor reagrupado'} na casa das ${place}" aria-describedby="regroup-arithmetic-help" disabled>`).join('')}
        </div>
        <div class="column-arithmetic-row"> <span></span>${top.map((digit,index) => `<span data-regroup-top="${2 - index}" aria-label="${digit} ${places[2 - index]}">${digit}</span>`).join('')}</div>
        <div class="column-arithmetic-row"><span class="column-arithmetic-sign" aria-hidden="true">${question.sign}</span>${String(question.bottom).split('').map(digit => `<span>${digit}</span>`).join('')}</div>
        <div class="column-arithmetic-line" aria-hidden="true"></div>
        <div class="column-arithmetic-row column-arithmetic-answer">
          ${places.map((place,index) => `<input type="text" inputmode="numeric" enterkeyhint="${index < 2 ? 'next' : 'done'}" maxlength="1" pattern="[0-9]" autocomplete="off" spellcheck="false" data-regroup-answer="${index}" style="grid-column:${4 - index};grid-row:1" aria-label="Algarismo das ${place} do resultado" aria-describedby="regroup-arithmetic-help" disabled>`).join('')}
        </div>
      </div>
      <p class="column-arithmetic-order">Resultado: unidades → dezenas → centenas<br>Reagrupamentos: nos quadradinhos de cima</p>
      <button type="button" class="regroup-reset" data-reset-regroup>Recomeçar conta</button>
      <p class="column-arithmetic-message" data-regroup-message role="status" aria-live="polite"></p>
    </div>`;
    state.root = container.querySelector('.regroup-arithmetic');
    state.answersInputs = places.map((_,place) => container.querySelector(`[data-regroup-answer="${place}"]`));
    state.recordInputs = places.map((_,place) => container.querySelector(`[data-regroup-record="${place}"]`));
    refresh();
    if (state.root.getClientRects().length) focusTask();
  }

  function refresh() {
    const next = progress(),pending = state.plan.tasks[next];
    const work = working(state.question,state.entries);
    state.answersInputs.forEach((input,place) => {
      const taskIndex = state.plan.tasks.findIndex(task => task.kind === 'answer' && task.place === place);
      input.value = state.answers[place]; input.disabled = state.locked || taskIndex > next;
      input.dataset.regroupTask = String(taskIndex);
    });
    state.recordInputs.forEach((input,place) => {
      if (!input) return;
      let taskIndex = -1,auto = false,value = '';
      if (state.question.sign === '+') {
        taskIndex = state.plan.tasks.findIndex(task => task.kind === 'record' && task.place === place);
        if (taskIndex >= 0) value = state.entries[state.plan.tasks[taskIndex].index];
      } else {
        const latest = work.latest[place];
        auto = latest?.kind === 'auto'; value = latest ? String(work.values[place]) : '';
        if (pending?.kind === 'record' && pending.place === place) { taskIndex = next; auto = false; }
        else if (latest?.kind === 'manual') taskIndex = state.plan.tasks.findIndex(task => task.kind === 'record' && task.index === latest.index);
      }
      input.value = value; input.readOnly = auto;
      input.disabled = state.locked || (!auto && (taskIndex < 0 || taskIndex > next));
      input.tabIndex = auto ? -1 : 0;
      input.maxLength = auto ? 2 : 1;
      input.classList.toggle('is-automatic',auto);
      input.setAttribute('aria-label',`${state.question.sign === '+' ? 'Reserva' : 'Valor reagrupado'} na casa das ${places[place]}${auto ? ', preenchido automaticamente' : ''}`);
      if (taskIndex >= 0) input.dataset.regroupTask = String(taskIndex);
      else delete input.dataset.regroupTask;
      const original = state.container.querySelector(`[data-regroup-top="${place}"]`);
      original.classList.toggle('is-regrouped',work.changed.has(place));
      original.setAttribute('aria-label',`${digits(state.question.top)[place]} ${places[place]}${work.changed.has(place) ? ', riscado após reagrupamento' : ''}`);
    });
    const help = !pending ? 'Confira o resultado e os registros acima da operação.' : pending.kind === 'answer'
      ? `Digite o algarismo das ${places[pending.place]} do resultado, no quadradinho de baixo.`
      : state.question.sign === '+' ? `Registre a reserva no quadradinho acima das ${places[pending.place]}.`
        : `Empreste 1 ${pending.place === 1 ? 'dezena' : 'centena'} e digite quanto fica na casa das ${places[pending.place]}, no quadradinho de cima.`;
    state.container.querySelector('[data-regroup-help]').textContent = help;
    state.container.querySelector('[data-reset-regroup]').disabled = state.locked;
    state.callbacks.onReady?.(!state.locked && next === state.plan.tasks.length);
  }

  function handleInput(event) {
    if (!state || state.locked || !state.root.contains(event.target) || event.target.disabled || event.target.readOnly || !event.target.hasAttribute('data-regroup-task')) return;
    const index = Number(event.target.dataset.regroupTask),task = state.plan.tasks[index];
    const value = event.target.value.replace(/[^0-9]/g,'').slice(-1);
    (task.kind === 'answer' ? state.answers : state.entries)[task.index] = value;
    state.plan.tasks.slice(index + 1).forEach(later => { (later.kind === 'answer' ? state.answers : state.entries)[later.index] = ''; });
    state.lastResult = null; state.feedback = '';
    state.root.querySelectorAll('input').forEach(input => { input.classList.remove('is-correct','is-wrong'); input.removeAttribute('aria-invalid'); });
    state.container.querySelector('[data-regroup-message]').textContent = '';
    state.callbacks.onChange?.(); refresh();
    if (value) focusTask();
  }

  function handleClick(event) {
    if (!state || !state.root.contains(event.target) || !event.target.closest('[data-reset-regroup]')) return false;
    if (!state.locked) {
      const {question,container,callbacks} = state;
      callbacks.onChange?.(); render(question,container,callbacks);
    }
    return true;
  }

  function handleKeydown(event) {
    if (!state || state.locked || !state.root.contains(event.target) || !event.target.matches('[data-regroup-answer],[data-regroup-record]')) return false;
    if (event.key === 'Enter' && progress() < state.plan.tasks.length) { event.preventDefault(); focusTask(); return true; }
    if (event.key === 'Backspace' && !event.target.value) {
      const previous = Number(event.target.dataset.regroupTask) - 1;
      if (previous >= 0) { event.preventDefault(); focusTask(previous); return true; }
    }
    return false;
  }

  function submit() {
    if (!state || state.locked) return null;
    const result = evaluate(state.question,state.answers,state.entries);
    state.lastResult = result; state.feedback = result.message;
    state.container.querySelector('[data-regroup-message]').textContent = result.complete ? '' : result.message;
    if (!result.complete) focusTask();
    else {
      state.answersInputs.forEach((input,index) => mark(input,result.matches[index]));
      state.plan.records.forEach((record,index) => { if (!result.recordMatches[index]) mark(state.recordInputs[record.donor ?? record.place],false); });
    }
    return result;
  }

  function mark(input,correct) {
    input.classList.toggle('is-correct',correct); input.classList.toggle('is-wrong',!correct);
    input.setAttribute('aria-invalid',String(!correct));
  }
  function lock() {
    if (!state) return;
    state.locked = true; refresh();
    if (state.lastResult && !state.lastResult.correct) state.feedback = `Vamos conferir. ${resolution(state.question)}`;
  }
  function clear() { state = null; }

  return {challenge,isType,plan,evaluate,resolution,working,render,handleInput,handleClick,handleKeydown,submit,lock,clear,
    get feedback() { return state?.feedback || ''; },
    get spokenQuestion() {
      if (!state) return '';
      const {question} = state;
      return `${question.text} ${question.top} ${question.sign === '+' ? 'mais' : 'menos'} ${question.bottom}. Registre os reagrupamentos nos quadradinhos acima da operação e digite o resultado começando pelas unidades.`;
    }};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = regroupArithmetic;
