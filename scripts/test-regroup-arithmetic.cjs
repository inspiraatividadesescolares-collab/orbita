const test = require('node:test');
const assert = require('node:assert/strict');
const arithmetic = require('../regroup-arithmetic.js');
const [addition,subtraction,mixed] = arithmetic.challenge.missions;
const questions = arithmetic.challenge.missions.flatMap(mission => mission.questions);

test('há três missões de dez contas e todas precisam de reagrupamento',() => {
  assert.equal(arithmetic.challenge.missions.length,3);
  assert.equal(questions.length,30);
  assert.equal(new Set(questions.map(question => question.id)).size,30);
  assert.equal(new Set(questions.map(question => `${question.top}${question.sign}${question.bottom}`)).size,30);
  for (const mission of arithmetic.challenge.missions) assert.equal(mission.questions.length,10);
  assert.ok(addition.questions.every(question => question.sign === '+'));
  assert.ok(subtraction.questions.every(question => question.sign === '−'));
  assert.equal(mixed.questions.filter(question => question.sign === '+').length,5);
  assert.equal(mixed.questions.filter(question => question.sign === '−').length,5);
  assert.ok(mixed.questions.some((question,index) => index && question.sign === mixed.questions[index - 1].sign));
  for (const question of questions) {
    assert.ok(question.top >= 100 && question.top <= 999);
    assert.ok(question.bottom >= 100 && question.bottom <= 999);
    assert.ok(question.result >= 100 && question.result <= 999);
    assert.equal(question.result,question.sign === '+' ? question.top + question.bottom : question.top - question.bottom);
    const work = arithmetic.plan(question);
    assert.ok(work.records.length >= 1,question.id);
    assert.equal(work.columns.reduce((total,column,place) => total + column.result * 10 ** place,0),question.result);
    assert.deepEqual(work.tasks.filter(task => task.kind === 'answer').map(task => task.place),[0,1,2]);
  }
});

test('139 + 383 exige duas reservas manuais e dá 522',() => {
  const question = addition.questions[0];
  assert.deepEqual([question.top,question.bottom,question.result],[139,383,522]);
  const work = arithmetic.plan(question);
  assert.deepEqual(work.records.map(record => [record.place,record.after]),[[1,1],[2,1]]);
  assert.deepEqual(work.tasks.map(task => [task.kind,task.place]),[['answer',0],['record',1],['answer',1],['record',2],['answer',2]]);
  assert.equal(arithmetic.evaluate(question,['2','2','5'],['1','1']).correct,true);
  assert.equal(arithmetic.evaluate(question,['2','2','5'],['0','1']).correct,false);
  assert.equal(arithmetic.evaluate(question,['2','2','5'],['','1']).complete,false);
});

test('731 − 326: o jogador reduz as dezenas a 2 e o sistema registra 11 nas unidades',() => {
  const question = subtraction.questions[0];
  assert.deepEqual([question.top,question.bottom,question.result],[731,326,405]);
  const work = arithmetic.plan(question);
  assert.deepEqual(work.records.map(record => [record.donor,record.receiver,record.before,record.after,record.received]),[[1,0,3,2,11]]);
  const working = arithmetic.working(question,['2']);
  assert.deepEqual(working.values,[11,2,7]);
  assert.deepEqual([...working.changed].sort(),[0,1]);
  assert.equal(working.latest[0].kind,'auto');
  assert.equal(working.latest[1].kind,'manual');
  assert.equal(arithmetic.evaluate(question,['5','0','4'],['2']).correct,true);
});

test('empréstimos através do zero e dois empréstimos seguidos conservam o valor do minuendo',() => {
  const chain = subtraction.questions[4]; // 902 − 456
  assert.deepEqual(arithmetic.working(chain,['8']).values,[2,10,8]);
  assert.deepEqual(arithmetic.working(chain,['8','9']).values,[12,9,8]);
  const double = subtraction.questions[2]; // 864 − 479
  assert.deepEqual(arithmetic.working(double,['5','7']).values,[14,15,7]);
  const zero = subtraction.questions[6]; // 810 − 275
  assert.deepEqual(arithmetic.working(zero,['0']).values,[10,0,8]);
  assert.deepEqual(arithmetic.working(zero,['0','7']).values,[10,10,7]);
  for (const question of questions.filter(question => question.sign === '−')) {
    const records = arithmetic.plan(question).records;
    for (let count = 1; count <= records.length; count++) {
      const {values} = arithmetic.working(question,records.slice(0,count).map(record => String(record.after)));
      assert.equal(values.reduce((total,value,place) => total + value * 10 ** place,0),question.top,question.id);
    }
  }
});

test('resultado e todos os registros precisam estar corretos, inclusive os que recebem outro empréstimo depois',() => {
  for (const question of questions) {
    const answer = String(question.result).split('').reverse();
    const records = arithmetic.plan(question).records.map(record => String(record.after));
    assert.equal(arithmetic.evaluate(question,answer,records).correct,true,question.id);
    for (let index = 0; index < records.length; index++) {
      const wrong = records.slice(); wrong[index] = String((Number(wrong[index]) + 1) % 10);
      const verdict = arithmetic.evaluate(question,answer,wrong);
      assert.equal(verdict.complete,true); assert.equal(verdict.correct,false); assert.equal(verdict.recordMatches[index],false);
    }
    for (let place = 0; place < 3; place++) {
      const wrong = answer.slice(); wrong[place] = String((Number(wrong[place]) + 1) % 10);
      assert.equal(arithmetic.evaluate(question,wrong,records).correct,false);
    }
    assert.ok(arithmetic.resolution(question).includes(`${question.top} ${question.sign} ${question.bottom} = ${question.result}`));
  }
});

test('há questões em que somente as dezenas precisam ser reagrupadas',() => {
  const sum = addition.questions[7]; // 462 + 281
  assert.deepEqual(arithmetic.plan(sum).tasks.map(task => [task.kind,task.place]),[['answer',0],['answer',1],['record',2],['answer',2]]);
  const difference = subtraction.questions[8]; // 754 − 382
  assert.deepEqual(arithmetic.plan(difference).tasks.map(task => [task.kind,task.place]),[['answer',0],['record',2],['answer',1],['answer',2]]);
  assert.deepEqual(arithmetic.working(difference,['6']).values,[4,15,6]);
});

test('respostas incompletas e registros inválidos não consomem tentativas',() => {
  const question = subtraction.questions[0];
  for (const answer of [null,[],Array(3),['5','','4'],['5','00','4'],['5','a','4']]) assert.equal(arithmetic.evaluate(question,answer,['2']).complete,false);
  for (const records of [null,[],Array(1),[''],[' '],['a'],['-1'],['2.0'],['12'],['1','2']]) assert.equal(arithmetic.evaluate(question,['5','0','4'],records).complete,false);
});
