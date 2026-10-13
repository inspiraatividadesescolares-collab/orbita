const test = require('node:test');
const assert = require('node:assert/strict');
const multiplication = require('../order-multiplication.js');
const questions = multiplication.challenge.missions.flatMap(mission => mission.questions);
const answer = question => String(question.result).split('').reverse();
const carries = question => multiplication.plan(question).records.map(record => String(record.value));

test('há três missões de dez multiplicações diferentes com zero, um e dois reagrupamentos',() => {
  assert.equal(multiplication.challenge.missions.length,3);
  assert.equal(questions.length,30);
  assert.equal(new Set(questions.map(q => q.id)).size,30);
  assert.equal(new Set(questions.map(q => `${q.top}x${q.multiplier}`)).size,30);
  for (const [count,mission] of multiplication.challenge.missions.entries()) {
    assert.equal(mission.questions.length,10);
    for (const question of mission.questions) {
      assert.equal(multiplication.isType(question),true);
      assert.equal(question.result,question.top * question.multiplier);
      assert.ok(question.top >= 100 && question.top < 1000);
      assert.ok(question.multiplier >= 2 && question.multiplier <= 5);
      assert.ok(question.result >= 100 && question.result < 1000);
      assert.equal(multiplication.plan(question).records.length,count,question.id);
    }
  }
});

test('130 × 2, 125 × 3 e 165 × 2 preservam os exemplos e a ordem das etapas',() => {
  const [plain,single,double] = multiplication.challenge.missions.map(mission => mission.questions[0]);
  assert.deepEqual([plain.top,plain.multiplier,plain.result],[130,2,260]);
  assert.deepEqual(multiplication.plan(plain).columns.map(c => [c.digit,c.multiplier,c.result]),[[0,2,0],[3,2,6],[1,2,2]]);
  assert.deepEqual(multiplication.plan(plain).tasks.map(t => [t.kind,t.source,t.place,t.expected]),[['answer',0,0,'0'],['answer',1,1,'6'],['answer',2,2,'2']]);
  assert.deepEqual([single.top,single.multiplier,single.result],[125,3,375]);
  assert.deepEqual(multiplication.plan(single).records,[{source:0,place:1,value:1}]);
  assert.deepEqual(multiplication.plan(single).tasks.map(t => [t.kind,t.source,t.place,t.expected]),[['answer',0,0,'5'],['carry',0,1,'1'],['answer',1,1,'7'],['answer',2,2,'3']]);
  assert.deepEqual([double.top,double.multiplier,double.result],[165,2,330]);
  assert.deepEqual(multiplication.plan(double).records,[{source:0,place:1,value:1},{source:1,place:2,value:1}]);
  assert.deepEqual(multiplication.plan(double).tasks.map(t => [t.kind,t.source,t.place,t.expected]),[['answer',0,0,'0'],['carry',0,1,'1'],['answer',1,1,'3'],['carry',1,2,'1'],['answer',2,2,'3']]);
});

test('cada reagrupamento conserva a ordem decimal e entra na multiplicação seguinte',() => {
  const carryValues = new Set(),singleSources = new Set();
  for (const question of questions) {
    const work = multiplication.plan(question);
    assert.equal(work.columns.reduce((sum,column,index) => sum + column.result * 10 ** index,0),question.result);
    for (const [index,column] of work.columns.entries()) {
      assert.equal(column.total,column.digit * question.multiplier + column.carry);
      assert.equal(column.total,column.result + 10 * column.nextCarry);
      if (index < 2) assert.equal(work.columns[index + 1].carry,column.nextCarry);
    }
    for (const record of work.records) {
      assert.equal(record.place,record.source + 1);
      assert.equal(record.value,Math.floor(work.columns[record.source].total / 10));
      carryValues.add(record.value);
      if (question.regroupCount === 1) singleSources.add(record.source);
    }
  }
  assert.deepEqual([...singleSources].sort(),[0,1]);
  assert.deepEqual([...carryValues].sort(),[1,2,3,4]);
});

test('a correção exige todos os algarismos e também os valores dos reagrupamentos',() => {
  for (const question of questions) {
    const digits = answer(question),records = carries(question);
    assert.equal(multiplication.evaluate(question,digits,records).correct,true,question.id);
    for (const index of digits.keys()) {
      const wrong = digits.slice(); wrong[index] = String((Number(wrong[index]) + 1) % 10);
      const result = multiplication.evaluate(question,wrong,records);
      assert.equal(result.complete,true); assert.equal(result.correct,false); assert.equal(result.matches[index],false);
    }
    for (const index of records.keys()) {
      const wrong = records.slice(); wrong[index] = '0';
      const result = multiplication.evaluate(question,digits,wrong);
      assert.equal(result.complete,true); assert.equal(result.correct,false); assert.equal(result.recordMatches[index],false);
      assert.match(result.message,/reagrupamento/);
    }
    assert.ok(multiplication.resolution(question).includes(`${question.top} × ${question.multiplier} = ${question.result}`));
  }
});

test('respostas incompletas, índices faltantes e valores inválidos não gastam tentativas; zero é aceito',() => {
  const question = multiplication.challenge.missions[2].questions[0];
  for (const values of [null,[],Array(3),['0','','3'],['0','3','33'],['0','3','a'],['0','3','-1'],['0','3','3.0']]) {
    assert.equal(multiplication.evaluate(question,values,['1','1']).complete,false);
  }
  for (const values of [null,[],Array(2),['1',''],['1','a'],['1','10'],['1','1','1']]) {
    assert.equal(multiplication.evaluate(question,['0','3','3'],values).complete,false);
  }
  assert.equal(multiplication.evaluate(question,['0','3','3'],['1','1']).correct,true);
});
