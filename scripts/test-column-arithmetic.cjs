const test = require('node:test');
const assert = require('node:assert/strict');
const arithmetic = require('../column-arithmetic.js');
const [addition,subtraction,mixed] = arithmetic.challenge.missions;
const questions = arithmetic.challenge.missions.flatMap(mission => mission.questions);

test('três missões de dez contas diferentes, com os exemplos fornecidos',() => {
  assert.equal(arithmetic.challenge.missions.length,3);
  assert.equal(questions.length,30);
  assert.equal(new Set(questions.map(question => question.id)).size,30);
  assert.equal(new Set(questions.map(question => `${question.top}${question.sign}${question.bottom}`)).size,30);
  for (const mission of arithmetic.challenge.missions) assert.equal(mission.questions.length,10);
  assert.deepEqual([addition.questions[0].top,addition.questions[0].bottom,addition.questions[0].result],[132,323,455]);
  assert.deepEqual([subtraction.questions[0].top,subtraction.questions[0].bottom,subtraction.questions[0].result],[536,323,213]);
  assert.ok(addition.questions.every(question => question.sign === '+'));
  assert.ok(subtraction.questions.every(question => question.sign === '−'));
  assert.equal(mixed.questions.filter(question => question.sign === '+').length,5);
  assert.equal(mixed.questions.filter(question => question.sign === '−').length,5);
  assert.ok(mixed.questions.some((question,index) => index && question.sign === mixed.questions[index - 1].sign),
    'a missão mista não permite descobrir o sinal por alternância automática');
});

test('todas as colunas dispensam reserva ou empréstimo e têm resultado de três algarismos',() => {
  for (const question of questions) {
    assert.ok(question.top >= 100 && question.top <= 999,question.id);
    assert.ok(question.bottom >= 100 && question.bottom <= 999,question.id);
    assert.ok(question.result >= 100 && question.result <= 999,question.id);
    assert.equal(question.result,question.sign === '+' ? question.top + question.bottom : question.top - question.bottom);
    for (let place = 0; place < 3; place++) {
      const top = Math.floor(question.top / 10 ** place) % 10;
      const bottom = Math.floor(question.bottom / 10 ** place) % 10;
      assert.ok(question.sign === '+' ? top + bottom <= 9 : top >= bottom,`${question.id}, coluna ${place}`);
    }
  }
});

test('a avaliação respeita a ordem U, D, C e rejeita erros em qualquer coluna',() => {
  for (const question of questions) {
    const answer = String(question.result).split('').reverse();
    assert.equal(arithmetic.evaluate(question,answer).correct,true,question.id);
    for (let place = 0; place < 3; place++) {
      const wrong = answer.slice();
      wrong[place] = String((Number(wrong[place]) + 1) % 10);
      const verdict = arithmetic.evaluate(question,wrong);
      assert.equal(verdict.complete,true);
      assert.equal(verdict.correct,false);
      assert.equal(verdict.matches[place],false);
    }
    const resolution = arithmetic.resolution(question);
    assert.ok(resolution.includes(`${question.top} ${question.sign} ${question.bottom} = ${question.result}`));
    assert.match(resolution,/unidades:.*dezenas:.*centenas:/);
  }
});

test('campos incompletos ou inválidos não contam como uma resposta e zero é aceito',() => {
  for (const values of [null,[],['5','5'],['','5','4'],[' ','5','4'],['a','5','4'],['12','5','4'],['-1','5','4'],['1.0','5','4'],[null,'5','4'],Array(3)]) {
    assert.equal(arithmetic.evaluate(addition.questions[0],values).complete,false,JSON.stringify(values));
  }
  const zero = subtraction.questions.find(question => String(question.result).includes('0'));
  assert.ok(zero);
  assert.equal(arithmetic.evaluate(zero,String(zero.result).split('').reverse()).correct,true);
});
