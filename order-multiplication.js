const orderMultiplication = (() => {
  const places = ['unidades','dezenas','centenas'];
  const sets = [
    [[130,2],[212,3],[321,2],[102,4],[111,5],[203,3],[220,4],[312,3],[401,2],[101,5]],
    [[125,3],[146,2],[241,3],[214,4],[305,3],[172,2],[126,3],[181,4],[151,5],[104,5]],
    [[165,2],[258,3],[176,4],[189,5],[287,3],[368,2],[196,4],[157,5],[275,3],[148,5]]
  ];
  const isDigit = value => /^[0-9]$/.test(String(value));
  const digits = number => String(number).padStart(3,'0').split('').reverse().map(Number);
  const isType = question => question?.type === 'order-multiplication';

  function plan(question) {
    const top = digits(question.top),columns = [],records = [],tasks = [];
    let carry = 0;
    for (let place = 0; place < 3; place++) {
      const product = top[place] * question.multiplier,total = product + carry,result = total % 10;
      const nextCarry = Math.floor(total / 10);
      columns.push({place,digit:top[place],multiplier:question.multiplier,product,carry,total,result,nextCarry});
      tasks.push({kind:'answer',index:place,place,source:place,expected:String(result)});
      if (nextCarry) {
        if (place === 2) throw new RangeError('O resultado precisa caber nas três ordens da operação.');
        records.push({source:place,place:place + 1,value:nextCarry});
        tasks.push({kind:'carry',index:records.length - 1,place:place + 1,source:place,expected:String(nextCarry)});
      }
      carry = nextCarry;
    }
    return {columns,records,tasks};
  }

  function makeQuestion(mission,index,top,multiplier) {
    const result = top * multiplier;
    const regroupCount = mission - 1;
    const question = {id:`d16m${mission}-ordens-q${index + 1}`,type:'order-multiplication',top,multiplier,result,regroupCount,
      text:regroupCount === 0 ? 'Resolva a multiplicação sem reagrupamento.' : `Resolva a multiplicação com ${regroupCount} ${regroupCount === 1 ? 'reagrupamento' : 'reagrupamentos'}.`,
      spokenText:`Multiplique ${top} por ${multiplier}. Digite o resultado nos quadradinhos, começando pelas unidades, depois dezenas e centenas. ${regroupCount ? `Registre ${regroupCount === 1 ? 'o reagrupamento no quadradinho' : 'os dois reagrupamentos nos quadradinhos'} acima da operação. ` : ''}Os algarismos destacados indicam a etapa atual.`,
      correct:`Acertou! ${top} × ${multiplier} = ${result}.${regroupCount ? ' Os reagrupamentos também estão corretos!' : ''}`};
    if (plan(question).records.length !== regroupCount) throw new Error(`Quantidade de reagrupamentos incorreta: ${question.id}`);
    return question;
  }

  const challenge = {
    title:'Desafio 16 — Multiplicação por ordens',
    missions:[
      {title:'Multiplicação sem reagrupamento',
        intro:'Resolva 10 multiplicações sem reagrupamento. Digite cada algarismo do resultado diretamente no seu quadradinho: primeiro as unidades, depois as dezenas e as centenas. O multiplicador e o algarismo da etapa ficam destacados. Confira a resposta ao terminar. Você tem duas tentativas por questão.',
        example:{operation:'130 × 2',steps:['Unidades: 2 × 0 = 0.','Dezenas: 2 × 3 = 6.','Centenas: 2 × 1 = 2. Resultado: 260.']}},
      {title:'Multiplicação com 1 reagrupamento',
        intro:'Resolva 10 multiplicações com um reagrupamento. Comece pelas unidades e observe os algarismos destacados. Escreva o algarismo do resultado embaixo e, quando necessário, registre o reagrupamento no quadradinho acima da próxima ordem. Some esse valor ao multiplicar a próxima coluna. Você tem duas tentativas por questão.',
        example:{operation:'125 × 3',steps:['Unidades: 3 × 5 = 15. Escreva 5 e reagrupe 1 nas dezenas.','Dezenas: 3 × 2 + 1 = 7.','Centenas: 3 × 1 = 3. Resultado: 375.']}},
      {title:'Multiplicação com 2 reagrupamentos',
        intro:'Resolva 10 multiplicações com dois reagrupamentos. Digite o resultado a partir das unidades e registre os valores reagrupados nos quadradinhos acima das dezenas e das centenas. Inclua cada reagrupamento na etapa seguinte e acompanhe os algarismos destacados. Você tem duas tentativas por questão.',
        example:{operation:'165 × 2',steps:['Unidades: 2 × 5 = 10. Escreva 0 e reagrupe 1 nas dezenas.','Dezenas: 2 × 6 + 1 = 13. Escreva 3 e reagrupe 1 nas centenas.','Centenas: 2 × 1 + 1 = 3. Resultado: 330.']}}
    ].map((mission,index) => ({...mission,questions:sets[index].map(([top,multiplier],questionIndex) => makeQuestion(index + 1,questionIndex,top,multiplier))}))
  };

  function evaluate(question,answers,entries) {
    const work = plan(question);
    if (!Array.isArray(answers) || answers.length !== 3 || Array.from(answers).some(value => !isDigit(value)) ||
        !Array.isArray(entries) || entries.length !== work.records.length || Array.from(entries).some(value => !isDigit(value))) {
      return {complete:false,correct:false,message:'Preencha os três algarismos do resultado e os quadradinhos de reagrupamento, quando houver.'};
    }
    const matches = answers.map((value,index) => Number(value) === work.columns[index].result);
    const recordMatches = entries.map((value,index) => Number(value) === work.records[index].value);
    const record = recordMatches.indexOf(false),wrong = matches.indexOf(false);
    const message = record >= 0
      ? `Confira o reagrupamento acima das ${places[work.records[record].place]}. Escreva quantos grupos de 10 passam para a próxima ordem.`
      : wrong >= 0 ? `Confira as ${places[wrong]}: multiplique o algarismo dessa ordem por ${question.multiplier}${work.columns[wrong].carry ? ' e some o reagrupamento' : ''}. Digite o algarismo dessa ordem no resultado.` : question.correct;
    return {complete:true,correct:matches.every(Boolean) && recordMatches.every(Boolean),matches,recordMatches,message};
  }

  function resolution(question) {
    const records = plan(question).records;
    return `${question.top} × ${question.multiplier} = ${question.result}. ${records.length ? `Reagrupamentos: ${records.map(record => `${record.value} nas ${places[record.place]}`).join('; ')}.` : 'Sem reagrupamento.'}`;
  }

  let state = null;
  const taskValue = task => (task.kind === 'answer' ? state.answers : state.entries)[task.index];
  function progress() {
    const next = state.work.tasks.findIndex(task => !isDigit(taskValue(task)));
    return next < 0 ? state.work.tasks.length : next;
  }
  function inputFor(task) { return task.kind === 'answer' ? state.answerInputs[task.place] : state.recordInputs[task.index]; }
  function focusTask(index=progress()) {
    if (!state || state.locked) return;
    const task = state.work.tasks[index],input = task && inputFor(task);
    if (!input || input.disabled) return;
    state.activeTask = index; refresh(); input.focus({preventScroll:true}); input.select();
  }

  function render(question,container,callbacks={}) {
    clear();
    const work = plan(question);
    state = {question,root:container,callbacks,work,answers:Array(3).fill(''),entries:Array(work.records.length).fill(''),activeTask:0,locked:false,feedback:'',lastResult:null};
    container.classList.add('order-multiplication-activity');
    const input = (task,index) => `<input type="text" inputmode="numeric" enterkeyhint="next" maxlength="1" pattern="[0-9]" autocomplete="off" spellcheck="false" data-order-task="${index}" data-order-${task.kind}="${task.kind === 'answer' ? task.place : task.index}" style="grid-column:${4 - task.place};grid-row:1" aria-label="${task.kind === 'answer' ? 'Algarismo do resultado nas' : 'Reagrupamento acima das'} ${places[task.place]}" aria-describedby="order-multiplication-help" disabled>`;
    container.innerHTML = `<div class="order-multiplication-game">
      <div class="order-multiplication-board" role="group" aria-label="${question.top} vezes ${question.multiplier}, operação por ordens">
        <div class="order-multiplication-labels" aria-hidden="true"><span></span><span>C</span><span>D</span><span>U</span></div>
        ${work.records.length ? `<div class="order-multiplication-row order-multiplication-records" role="group" aria-label="Reagrupamentos">${work.tasks.map((task,index) => task.kind === 'carry' ? input(task,index) : '').join('')}</div>` : ''}
        <div class="order-multiplication-row">${digits(question.top).map((digit,place) => `<span class="order-multiplication-digit" data-order-top="${place}" style="grid-column:${4 - place};grid-row:1" aria-label="${digit} nas ${places[place]}">${digit}</span>`).join('')}</div>
        <div class="order-multiplication-row"><span class="order-multiplication-sign" aria-hidden="true">×</span><span class="order-multiplication-digit" data-order-multiplier style="grid-column:4" aria-label="Multiplicador ${question.multiplier}">${question.multiplier}</span></div>
        <div class="order-multiplication-line" aria-hidden="true"></div>
        <div class="order-multiplication-row order-multiplication-answers">${work.tasks.map((task,index) => task.kind === 'answer' ? input(task,index) : '').join('')}</div>
      </div>
      <div class="order-multiplication-controls"><div class="order-multiplication-step" data-order-step role="status" aria-live="polite"></div>
        <p id="order-multiplication-help" data-order-help></p>
        <div class="order-multiplication-guide"><span>COMECE PELAS UNIDADES</span><p>Unidades → dezenas → centenas</p><small>${work.records.length ? 'Resultado nos quadrados de baixo. Reagrupamentos nos quadradinhos de cima.' : 'Digite um algarismo em cada quadrado do resultado.'}</small></div>
        <button type="button" data-order-reset>↻ Recomeçar conta</button>
        <p class="order-multiplication-message" data-order-message role="status" aria-live="polite"></p>
      </div>
    </div>`;
    state.answerInputs = places.map((_,place) => container.querySelector(`[data-order-answer="${place}"]`));
    state.recordInputs = work.records.map((_,index) => container.querySelector(`[data-order-carry="${index}"]`));
    container.addEventListener('input',handleInput);
    container.addEventListener('click',handleClick);
    container.addEventListener('keydown',handleKeydown);
    container.addEventListener('focusin',handleFocus);
    refresh();
    if (container.getClientRects().length && !container.closest('[hidden]')) focusTask();
  }

  function refresh() {
    if (!state) return;
    const {root,work,question,locked} = state,next = progress();
    const task = !locked && state.activeTask !== null ? work.tasks[state.activeTask] : null;
    work.tasks.forEach((item,index) => {
      const input = inputFor(item);
      input.value = taskValue(item); input.disabled = locked || index > next;
      input.classList.toggle('is-current',task === item);
      input.classList.toggle('is-incoming',!locked && item.kind === 'carry' && task?.kind === 'answer' && item.place === task.place && isDigit(taskValue(item)));
    });
    root.querySelectorAll('[data-order-top]').forEach(element => {
      const place = Number(element.dataset.orderTop),active = task?.source === place;
      element.classList.toggle('is-highlighted',active);
      element.setAttribute('aria-label',`${digits(question.top)[place]} nas ${places[place]}${active ? ', em destaque nesta etapa' : ''}`);
    });
    root.querySelector('[data-order-multiplier]').classList.toggle('is-highlighted',Boolean(task));
    const stage = root.querySelector('[data-order-step]');
    stage.textContent = locked ? 'Operação finalizada' : task ? `Etapa ${task.source + 1} de 3 · ${places[task.source][0].toUpperCase() + places[task.source].slice(1)}` : 'Pronto para conferir!';
    root.querySelector('[data-order-help]').textContent = locked ? 'Confira o feedback da sua resposta.'
      : !task ? 'Confira o resultado e os reagrupamentos, quando houver.'
      : task.kind === 'carry' ? `Registre o reagrupamento das ${places[task.source]} no quadradinho acima das ${places[task.place]}.`
      : `Multiplique os dois algarismos destacados${work.columns[task.place].carry ? ' e some o reagrupamento acima desta ordem' : ''}. Digite o algarismo das ${places[task.place]} no quadrado do resultado.`;
    root.querySelector('[data-order-reset]').disabled = locked;
    state.callbacks.onReady?.(!locked && next === work.tasks.length);
  }

  function handleFocus(event) {
    if (!state || state.locked || !event.target.matches('[data-order-task]') || event.target.disabled) return;
    state.activeTask = Number(event.target.dataset.orderTask); refresh();
  }

  function handleInput(event) {
    if (!state || state.locked || !event.target.matches('[data-order-task]') || event.target.disabled) return;
    const index = Number(event.target.dataset.orderTask),task = state.work.tasks[index];
    const value = event.target.value.replace(/[^0-9]/g,'').slice(-1);
    (task.kind === 'answer' ? state.answers : state.entries)[task.index] = value;
    state.work.tasks.slice(index + 1).forEach(later => { (later.kind === 'answer' ? state.answers : state.entries)[later.index] = ''; });
    state.lastResult = null; state.feedback = '';
    state.root.querySelectorAll('input').forEach(input => { input.classList.remove('is-correct','is-wrong'); input.removeAttribute('aria-invalid'); });
    state.root.querySelector('[data-order-message]').textContent = '';
    state.callbacks.onChange?.();
    const next = progress(); state.activeTask = next < state.work.tasks.length ? next : null; refresh();
    if (value) focusTask();
  }

  function handleClick(event) {
    if (!state || state.locked || !event.target.closest('[data-order-reset]')) return;
    const {question,root,callbacks} = state; callbacks.onChange?.(); render(question,root,callbacks);
  }

  function handleKeydown(event) {
    if (!state || state.locked || !event.target.matches('[data-order-task]') || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const index = Number(event.target.dataset.orderTask);
    if (event.key === 'Enter') {
      event.preventDefault(); event.stopPropagation();
      if (event.repeat) return;
      if (progress() < state.work.tasks.length) focusTask(); else state.callbacks.onSubmit?.();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || (event.key === 'Backspace' && !event.target.value)) {
      const destination = index + (event.key === 'ArrowLeft' ? 1 : -1);
      const task = state.work.tasks[destination],input = task && inputFor(task);
      if (input && !input.disabled) { event.preventDefault(); event.stopPropagation(); focusTask(destination); }
    }
  }

  function submit() {
    if (!state || state.locked) return null;
    const result = evaluate(state.question,state.answers,state.entries);
    state.lastResult = result; state.feedback = result.message;
    state.root.querySelector('[data-order-message]').textContent = result.complete ? '' : result.message;
    if (!result.complete) focusTask();
    else {
      const mark = (input,correct) => {
        input.classList.toggle('is-correct',correct); input.classList.toggle('is-wrong',!correct);
        input.setAttribute('aria-invalid',String(!correct));
      };
      state.answerInputs.forEach((input,index) => mark(input,result.matches[index]));
      state.recordInputs.forEach((input,index) => mark(input,result.recordMatches[index]));
    }
    return result;
  }

  function lock() {
    if (!state) return;
    state.locked = true; state.activeTask = null;
    if (state.lastResult && !state.lastResult.correct) state.feedback = `As duas tentativas terminaram. ${resolution(state.question)}`;
    refresh();
  }

  function clear() {
    if (state) {
      state.root.removeEventListener('input',handleInput);
      state.root.removeEventListener('click',handleClick);
      state.root.removeEventListener('keydown',handleKeydown);
      state.root.removeEventListener('focusin',handleFocus);
    }
    state = null;
  }

  return {challenge,isType,plan,evaluate,resolution,render,submit,lock,clear,
    get feedback() { return state?.feedback || ''; },
    get spokenQuestion() {
      if (!state) return '';
      return `${state.question.spokenText} ${state.root.querySelector('[data-order-step]').textContent}. ${state.root.querySelector('[data-order-help]').textContent}`;
    }};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = orderMultiplication;
