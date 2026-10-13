const arithmeticEnigmas = (() => {
  const singlePrompt = 'Que número eu tenho que colocar no quadradinho, para que a operação fique correta?';
  const pairPrompt = 'Quais números eu tenho que colocar nos quadradinhos, para que a operação fique correta?';
  const places = ['unidades','dezenas','centenas'];
  const additionSets = [
    ['132','32_',455,3,'MUITO BEM!'], ['42','2_',69,7,'VOCÊ BRILHOU!'],
    ['73','1_',89,6,'PARABÉNS!'], ['46','3_',78,2,'CERTINHO!'],
    ['64','3_',99,5,'VOCÊ ACERTOU!'], ['33','3_',71,8,'SENSACIONAL!'],
    ['25','3_',64,9,'VOCÊ É DEMAIS!'], ['49','3_',81,2,'QUE DEMAIS!'],
    ['38','3_',72,4,'VOCÊ ARRASOU!'], ['61','1_',80,9,'PERFEITO!']
  ];
  // 49 + 32 = 81: o resultado 71 no roteiro era um erro de cálculo.
  const subtractionSets = [
    ['77','2_',55,[2],'VOCÊ BRILHOU!','VOCÊ ERROU!'],
    ['42','2_',21,[1],'ISSO MESMO!','VOCÊ ERROU!'],
    ['77','1_',60,[7],'SUCESSO!','PENSE BEM!'],
    ['46','3_',15,[1],'SENSACIONAL!','RESPOSTA ERRADA!'],
    ['66','3_',32,[4],'RESPOSTA CERTA!','RESPOSTA ERRADA!'],
    ['63','3_',26,[7],'RESPOSTA CERTA!','RESPOSTA ERRADA!'],
    ['85','3_',47,[8],'PARABÉNS!','NÃO ESTÁ CERTO!'],
    ['90','7_',15,[5],'VOCÊ BRILHOU!','VEJA BEM!'],
    ['91','2_',64,[7],'RESPOSTA CERTA!','RESPOSTA ERRADA!'],
    ['54','1_',35,[9],'VOCÊ É 10!','NÃO ESTÁ CERTO!']
  ];
  const pairSets = [
    ['3_','3_',72,[6,6],'same-digit','VOCÊ SABE TUDO!','NÃO ESTÁ CERTO!'],
    ['4_','2_',68,[4,4],'same-digit','SENSACIONAL!','RESPOSTA ERRADA!'],
    ['5_','3_',82,[1,1],'same-digit','VOCÊ ARRASOU!','NÃO FOI DESSA VEZ!'],
    ['2_','2_',54,[7,7],'same-digit','MUITO BOM!','NÃO DESISTA!'],
    ['3_','4_',80,[5,5],'same-digit','ISSO MESMO!','RESPOSTA ERRADA!'],
    ['3_','3_',71,[5,6],null,'PARABÉNS!','RESPOSTA ERRADA!'],
    ['6_','2_',94,[8,6],'even','VOCÊ ACERTOU!','VOCÊ ERROU!'],
    ['4_','4_',88,[5,3],'odd','PERFEITO!','NÃO É ISSO!'],
    ['2_','2_',48,[4,4],'equal','BRILHANTE!','PENSE BEM!'],
    ['3_','2_',60,[1,9],'closest','PERFEITO!','PENSE MELHOR!']
  ];

  const fill = (template,digit) => Number(template.replace('_',String(digit)));
  function operands(question,values) {
    return {top:fill(question.topTemplate,values[0]),bottom:fill(question.bottomTemplate,values[values.length - 1])};
  }

  // A proximidade é calculada sobre todos os algarismos possíveis dos quadradinhos.
  function closestDifference(question) {
    let closest = Infinity;
    for (let a = 0; a <= 9; a++) for (let b = 0; b <= 9; b++) {
      const {top,bottom} = operands(question,[a,b]);
      if (top + bottom === question.target) closest = Math.min(closest,Math.abs(top - bottom));
    }
    return closest;
  }

  function evaluate(question,values) {
    const count = [question.topTemplate,question.bottomTemplate].filter(template => template.includes('_')).length;
    if (!Array.isArray(values) || values.length !== count || Array.from(values).some(value => !/^[0-9]$/.test(String(value)))) {
      return {complete:false,correct:false,message:count === 1 ? 'Preencha o quadradinho com um algarismo de 0 a 9.' : 'Preencha os dois quadradinhos com algarismos de 0 a 9.'};
    }
    const {top,bottom} = operands(question,values);
    const result = question.sign === '+' ? top + bottom : top - bottom;
    let constraint = '';
    if (question.rule === 'same-digit' && Number(values[0]) !== Number(values[1])) constraint = 'Use o mesmo número nos dois quadradinhos.';
    if (question.rule === 'even' && !values.every(value => Number(value) % 2 === 0)) constraint = 'Os dois números dos quadradinhos precisam ser PARES.';
    if (question.rule === 'odd' && !values.every(value => Number(value) % 2 === 1)) constraint = 'Os dois números dos quadradinhos precisam ser ÍMPARES.';
    if (question.rule === 'equal' && top !== bottom) constraint = 'As parcelas precisam ficar iguais.';
    if (question.rule === 'closest' && Math.abs(top - bottom) !== closestDifference(question)) constraint = 'As parcelas podem ficar mais próximas uma da outra.';
    const correct = result === question.target && !constraint;
    const equation = `${top} ${question.sign === '+' ? '+' : '−'} ${bottom} = ${result}`;
    const detail = result !== question.target ? `O resultado pedido é ${question.target}.` : constraint;
    return {complete:true,correct,top,bottom,result,equation,values:values.map(Number),
      message:correct ? `${question.praise} ${equation}${question.rule === 'equal' ? ' e as parcelas ficam iguais' : question.rule === 'closest' ? ' e as parcelas ficam o mais próximas possível' : ''}.`
        : `${question.encouragement} ${equation}. ${detail} Tente novamente.`};
  }

  function makeQuestion(mission,index,topTemplate,bottomTemplate,target,sign,answers,rule,praise,encouragement='PENSE BEM!') {
    const question = {id:`d9m${mission}q${index + 1}`,type:'arithmetic-enigma',mode:'input',
      text:singlePrompt,topTemplate,bottomTemplate,target,sign,rule,praise,encouragement,answers};
    if (mission === 3) {
      question.text = rule === 'same-digit' ? 'Que número eu tenho que colocar nos quadradinhos, para que a operação fique correta? Use o mesmo número nos dois.'
        : rule === 'even' ? 'Quais números PARES eu tenho que colocar nos quadradinhos, para que a operação fique correta?'
        : rule === 'odd' ? 'Quais números ÍMPARES eu tenho que colocar nos quadradinhos, para que a operação fique correta?'
        : rule === 'equal' ? 'Quais números eu tenho que colocar nos quadradinhos, para que a operação fique correta e as parcelas fiquem iguais?'
        : rule === 'closest' ? 'Quais números eu tenho que colocar nos quadradinhos, para que a operação fique correta e as parcelas fiquem O MAIS PRÓXIMAS POSSÍVEL uma da outra?'
        : pairPrompt;
    }
    question.correct = evaluate(question,answers).message;
    return question;
  }

  const challenge = {
    title:'Desafio 9 — Enigmas de adição e subtração',
    missions:[
      {title:'Enigmas — Adição',video:'assets/videos/desafio-9/missao-1/vd-explica-d3-m1.mp4',
        intro:'Descubra o algarismo que falta em cada conta. Digite no quadradinho e confira sua resposta. Observe o que acontece com a soma ao experimentar um número.',
        questions:additionSets.map(([top,bottom,target,digit,praise],index) => ({
          ...makeQuestion(1,index,top,bottom,target,'+',[digit],null,praise),answer:String(digit)
        }))},
      {title:'Enigmas — Subtração',video:'assets/videos/desafio-9/missao-2/vd-explica-d3-m2.mp4',
        intro:'Descubra o algarismo escondido nas subtrações. Digite diretamente no quadradinho e confira a conta. Quando for necessário reagrupar, observe os valores escritos acima dos algarismos cortados.',
        questions:subtractionSets.map(([top,bottom,target,answers,praise,encouragement],index) =>
          makeQuestion(2,index,top,bottom,target,'−',answers,null,praise,encouragement))},
      {title:'Enigmas — Adição e subtração',video:'assets/videos/desafio-9/missao-3/vd explica d3-m3 (1).mp4',
        intro:'Digite um algarismo em cada um dos dois quadradinhos. Observe cada pedido: usar o mesmo algarismo, escolher pares ou ímpares, formar parcelas iguais ou deixá-las o mais próximas possível.',
        questions:pairSets.map(([top,bottom,target,answers,rule,praise,encouragement],index) =>
          makeQuestion(3,index,top,bottom,target,'+',answers,rule,praise,encouragement))}
    ]
  };

  function calculationSteps(top,bottom,sign) {
    const steps = [];
    let transfer = 0;
    const columns = Math.max(String(top).length,String(bottom).length);
    for (let place = 0; place < columns; place++) {
      const topDigit = Math.floor(top / 10 ** place) % 10;
      const bottomDigit = Math.floor(bottom / 10 ** place) % 10;
      const incoming = transfer;
      const total = sign === '+' ? topDigit + bottomDigit + incoming : topDigit - incoming - bottomDigit;
      transfer = sign === '+' ? Number(total >= 10) : Number(total < 0);
      steps.push({place,topDigit,bottomDigit,incoming,total,transfer,digit:(total + 10) % 10});
    }
    return steps;
  }

  // Mantém o valor do minuendo ao trocar uma dezena por dez unidades,
  // incluindo empréstimos que passam por zeros ou por mais de uma coluna.
  function subtractionRegrouping(top,bottom) {
    const columns = Math.max(String(top).length,String(bottom).length);
    const original = Array.from({length:columns},(_,place) => Math.floor(top / 10 ** place) % 10);
    const values = original.slice();
    const exchanges = [];
    for (let place = 0; place < columns; place++) {
      const bottomDigit = Math.floor(bottom / 10 ** place) % 10;
      if (values[place] >= bottomDigit) continue;
      let donor = place + 1;
      while (donor < columns && values[donor] === 0) donor++;
      if (donor === columns) break;
      values[donor]--;
      for (let intermediate = donor - 1; intermediate > place; intermediate--) values[intermediate] = 9;
      const before = values[place];
      values[place] += 10;
      exchanges.push({place,donor,before,regrouped:values[place],bottomDigit});
    }
    return {original,values,exchanges,changed:values.map((value,place) => value !== original[place])};
  }

  const isType = question => question?.type === 'arithmetic-enigma';
  let state = null;
  function rowMarkup(template,row,columns) {
    return template.padStart(columns,' ').split('').map((digit,index) => {
      const place = columns - index - 1;
      if (digit === ' ') return '<span aria-hidden="true"></span>';
      if (digit === '_') {
        const operand = state.question.sign === '+' ? (row === 'top' ? 'primeira parcela' : 'segunda parcela') : (row === 'top' ? 'minuendo' : 'subtraendo');
        return `<input type="text" inputmode="numeric" enterkeyhint="${row === 'top' ? 'next' : 'done'}" maxlength="1" pattern="[0-9]" autocomplete="off" spellcheck="false" data-enigma-input="${row}" data-enigma-place="${place}" aria-label="Algarismo das ${places[place]} que falta ${state.question.sign === '+' ? 'na' : 'no'} ${operand}" aria-describedby="enigma-help">`;
      }
      return `<span data-enigma-digit="${row}-${place}">${digit}</span>`;
    }).join('');
  }

  function render(question,container,callbacks={}) {
    clear();
    state = {question,container,callbacks,locked:false,lastResult:null,feedback:''};
    container.classList.add('enigma-activity');
    // Reserva a próxima ordem para resultados de tentativas como 64 + 36 = 100.
    const columns = Math.max(question.topTemplate.length,question.bottomTemplate.length,String(question.target).length) + 1;
    container.innerHTML = `<div class="enigma-game">
      <div class="enigma-operation" style="--enigma-columns:${columns}" role="group" aria-label="Conta com quadradinho: resultado pedido ${question.target}">
        <div class="enigma-row enigma-transfers" aria-hidden="true">${Array.from({length:columns},(_,index) => `<span data-enigma-transfer="${columns - index - 1}"></span>`).join('')}</div>
        <div class="enigma-row enigma-top">${rowMarkup(question.topTemplate,'top',columns)}</div>
        <div class="enigma-row enigma-bottom"><i class="enigma-sign" aria-hidden="true">${question.sign}</i>${rowMarkup(question.bottomTemplate,'bottom',columns)}</div>
        <div class="enigma-line" aria-hidden="true"></div>
        <div class="enigma-row enigma-result" data-enigma-result>${rowMarkup(String(question.target),'result',columns)}</div>
      </div>
      <div class="enigma-panel"><p class="enigma-help" id="enigma-help">${question.topTemplate.includes('_') ? 'Digite um algarismo em cada quadradinho da conta e confira.' : 'Digite o algarismo no quadradinho da conta e confira.'}</p>
        <p class="enigma-target">Resultado pedido: <strong>${question.target}</strong></p>
        <div class="enigma-regroup" data-enigma-regroup role="status" aria-live="polite" hidden></div>
        <p class="enigma-message" data-enigma-message role="status" aria-live="polite"></p>
      </div></div>`;
    state.root = container.querySelector('.enigma-game');
    state.inputs = [...container.querySelectorAll('[data-enigma-input]')];
    callbacks.onReady?.(false);
    if (state.root.getClientRects().length) state.inputs[0]?.focus({preventScroll:true});
  }

  function resetDisplay() {
    const {question,container} = state;
    container.querySelectorAll('[data-enigma-transfer]').forEach(cell => { cell.textContent = ''; cell.classList.remove('is-active','is-borrowed'); });
    container.querySelectorAll('.is-regroup-source,.is-regrouped').forEach(cell => cell.classList.remove('is-regroup-source','is-regrouped'));
    state.inputs.forEach(cell => {
      cell.classList.remove('is-correct','is-wrong'); cell.removeAttribute('aria-invalid');
    });
    const result = container.querySelector('[data-enigma-result]');
    const columns = Number(container.querySelector('.enigma-operation').style.getPropertyValue('--enigma-columns'));
    result.innerHTML = rowMarkup(String(question.target),'result',columns);
    result.classList.remove('is-correct','is-wrong');
    container.querySelector('[data-enigma-regroup]').hidden = true;
    container.querySelector('[data-enigma-message]').textContent = '';
    state.lastResult = null; state.feedback = '';
  }

  function showAttempt(result) {
    const {question,container} = state;
    resetDisplay();
    state.lastResult = result;
    state.feedback = result.message;
    state.inputs.forEach(input => {
      input.classList.add(result.correct ? 'is-correct' : 'is-wrong');
      input.setAttribute('aria-invalid',String(!result.correct));
    });
    const output = container.querySelector('[data-enigma-result]');
    const columns = Number(container.querySelector('.enigma-operation').style.getPropertyValue('--enigma-columns'));
    output.innerHTML = rowMarkup(String(result.result),'result',columns);
    output.classList.add(result.correct ? 'is-correct' : 'is-wrong');
    const explanation = container.querySelector('[data-enigma-regroup]');
    if (question.sign !== '+') {
      const regroup = subtractionRegrouping(result.top,result.bottom);
      explanation.hidden = regroup.exchanges.length === 0;
      regroup.values.forEach((value,place) => {
        if (!regroup.changed[place]) return;
        const cell = container.querySelector(`[data-enigma-transfer="${place}"]`);
        cell.textContent = value;
        cell.classList.add('is-borrowed');
        container.querySelector(`[data-enigma-digit="top-${place}"], [data-enigma-input="top"][data-enigma-place="${place}"]`)?.classList.add('is-regrouped');
      });
      explanation.textContent = regroup.exchanges.map(step => `Nas ${places[step.place]}, trocamos 1 ${places[step.place + 1] === 'dezenas' ? 'dezena' : 'centena'} por 10 ${places[step.place]}. ${step.regrouped} − ${step.bottomDigit} = ${step.regrouped - step.bottomDigit}.`).join(' ');
      return;
    }
    const transfers = calculationSteps(result.top,result.bottom,question.sign).filter(step => step.transfer);
    explanation.hidden = transfers.length === 0;
    explanation.textContent = transfers.map((step,index) => {
      const cell = container.querySelector(`[data-enigma-transfer="${step.place + 1}"]`);
      cell.textContent = '+1';
      cell.style.setProperty('--enigma-transfer-order',index);
      cell.classList.add('is-active');
      container.querySelector(`[data-enigma-digit="top-${step.place}"]`)?.classList.add('is-regroup-source');
      container.querySelector(`[data-enigma-input="top"][data-enigma-place="${step.place}"]`)?.classList.add('is-regroup-source');
      return `Nas ${places[step.place]}, ${step.topDigit} + ${step.bottomDigit}${step.incoming ? ' + 1' : ''} = ${step.total}. Escrevemos ${step.digit} e levamos 1 para as ${places[step.place + 1]}.`;
    }).join(' ');
  }

  function handleInput(event) {
    if (!state || state.locked || !state.inputs.includes(event.target)) return;
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g,'').slice(-1);
    resetDisplay();
    state.callbacks.onChange?.();
    state.callbacks.onReady?.(state.inputs.every(cell => /^[0-9]$/.test(cell.value)));
    const next = state.inputs[state.inputs.indexOf(input) + 1];
    if (input.value && next) { next.focus({preventScroll:true}); next.select(); }
  }

  function submit() {
    if (!state || state.locked) return null;
    const result = evaluate(state.question,state.inputs.map(input => input.value));
    if (!result.complete) {
      state.container.querySelector('[data-enigma-message]').textContent = result.message;
      state.inputs.find(input => !input.value)?.focus({preventScroll:true});
    } else showAttempt(result);
    return result;
  }

  function lock() {
    if (!state) return;
    state.locked = true;
    state.container.querySelectorAll('input,button').forEach(element => { element.disabled = true; });
    if (state.lastResult && !state.lastResult.correct) {
      const question = state.question;
      const answer = question.answers;
      const solution = evaluate(question,answer);
      state.feedback = `${state.lastResult.message.replace(/ Tente novamente\.$/,'')} Confira a solução: ${answer.join(' e ')}. ${solution.equation}.`;
    }
  }
  function clear() { state = null; }

  return {challenge,isType,render,handleInput,submit,lock,clear,evaluate,calculationSteps,subtractionRegrouping,closestDifference,
    get feedback() { return state?.feedback || ''; },
    get spokenQuestion() {
      if (!state) return '';
      const {question} = state;
      const name = template => template.split('').map(digit => digit === '_' ? 'quadradinho' : digit).join(', ');
      return `${question.text} A conta é: ${name(question.topTemplate)} ${question.sign === '+' ? 'mais' : 'menos'} ${name(question.bottomTemplate)}. Resultado pedido: ${question.target}. Digite ${state.inputs.length === 1 ? 'o algarismo no quadradinho' : 'um algarismo em cada quadradinho'} e confira.`;
    }};
})();

if (typeof module !== 'undefined' && module.exports) module.exports = arithmeticEnigmas;
