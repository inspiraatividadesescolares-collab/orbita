const test = require('node:test');
const assert = require('node:assert/strict');
const money = require('../money-missions.js');
const [count,pay,change] = money.challenge.missions;
const questions = money.challenge.missions.flatMap(mission => mission.questions);

test('três missões de dez questões, com a divisão dos blocos solicitada',() => {
  assert.equal(money.challenge.missions.length,3);
  assert.equal(new Set(questions.map(question => question.id)).size,30);
  for (const mission of money.challenge.missions) assert.equal(mission.questions.length,10);
  assert.deepEqual(count.questions.map(q => q.block),['A','A','A','A','B','B','B','B','C','C']);
  assert.deepEqual(pay.questions.map(q => q.block),['A','A','A','A','A','B','B','B','B','B']);
  assert.deepEqual(change.questions.map(q => q.block),['A','A','A','A','B','B','B','B','C','C']);
  const collections = count.questions.slice(0,4).map(q => q.pieces);
  assert.ok(collections[0].length >= 2 && collections[0].length <= 3);
  assert.equal(new Set(collections[0]).size,collections[0].length);
  assert.ok(collections[1].includes(1));
  assert.ok(new Set(collections[2]).size < collections[2].length);
  assert.ok(new Set(collections[3]).size >= 4);
  assert.deepEqual(collections[3],[20,10,2,2,1]);
  assert.deepEqual(count.questions.slice(0,4).map(money.expectedAmount),[3000,2600,3000,3500]);
});

test('as quatro formas de digitar dinheiro e a precisão de centavos são aceitas',() => {
  for (const raw of ['35','35,00','R$ 35','R$ 35,00','  R$ 35,00  ']) {
    assert.equal(money.parseMoney(raw),3500);
    assert.equal(money.formatMoney(money.parseMoney(raw)),'R$ 35,00');
  }
  for (const [raw,expected] of [['0',0],['0,05',5],['1,2',120],['35.50',3550],['R$ 1.235,01',123501]]) assert.equal(money.parseMoney(raw),expected);
  for (const raw of ['',null,35,'-1','+35','1e2','35 reais','35,001','35,','R$','1,2,3','1.23.456','Infinity','9007199254740991']) assert.equal(money.parseMoney(raw),null,String(raw));
  for (const cents of [0,1,5,10,99,123,3500,123501]) assert.equal(money.parseMoney(money.formatMoney(cents)),cents);
  const question = count.questions[3];
  for (const raw of ['35','35,00','R$ 35','R$ 35,00']) assert.equal(money.evaluate(question,{amount:raw}).correct,true);
  assert.equal(money.evaluate(question,{amount:'35,01'}).correct,false);
});

test('comparação usa valores, aceita equivalências e exige pessoa e diferença corretas',() => {
  const comparisons = count.questions.slice(4,8);
  assert.deepEqual(comparisons.map(q => money.comparison(q).winner),['0','1','equal','equal']);
  assert.ok(comparisons[1].people[1].pieces.length < comparisons[1].people[0].pieces.length);
  for (const question of comparisons) {
    const correct = money.comparison(question).winner;
    assert.equal(money.evaluate(question,{selected:correct}).correct,true);
    assert.equal(money.evaluate(question,{selected:correct === '0' ? '1' : '0'}).correct,false);
    assert.equal(money.evaluate(question).complete,false);
  }
  for (const [index,question] of count.questions.slice(8).entries()) {
    assert.equal(question.people.length,index + 2);
    assert.ok(question.text.includes(question.people[question.reference].name));
    const amount = index ? '14' : '7';
    assert.equal(money.evaluate(question,{selected:'0',amount}).correct,true);
    assert.equal(money.evaluate(question,{selected:'1',amount}).correct,false);
    assert.equal(money.evaluate(question,{selected:'0',amount:'1'}).correct,false);
    assert.equal(money.evaluate(question,{selected:'0'}).complete,false);
    assert.equal(money.evaluate(question,{amount}).complete,false);
  }
});

test('preços, operações e trocos correspondem aos exemplos do arquivo',() => {
  assert.deepEqual(pay.questions.map(money.expectedAmount),[700,1800,2500,4200,6800,1900,2600,2100,1600,1500]);
  assert.deepEqual(pay.questions.slice(5).map(q => q.operation),['+','+','+','×','×']);
  assert.deepEqual(money.operationOptions(pay.questions[5]).map(option => option.text),['12 + 7','12 × 7']);
  assert.deepEqual(money.operationOptions(pay.questions[8]).map(option => option.text),['2 + 8','2 × 8']);
  assert.deepEqual(change.questions.map(money.expectedAmount),[300,700,200,400,2300,1200,3600,2500,1400,6400]);
  assert.deepEqual(change.questions.slice(8).map(q => q.products[0].quantity),[2,3]);
  for (const question of change.questions) assert.ok(!money.resolution(question).includes('VALOR PAGO − PREÇO = TROCO'));
});

test('pagamentos e trocos aceitam qualquer composição equivalente, mas não uma operação errada',() => {
  const twenty = {...pay.questions[0],products:[{name:'Produto',price:20,quantity:1}]};
  for (const counts of [{20:1},{10:2},{5:4},{10:1,5:2},{2:10},{1:20}]) assert.equal(money.evaluate(twenty,{counts}).correct,true);
  for (const question of [...pay.questions,...change.questions]) {
    let remaining = money.expectedAmount(question) / 100;
    const greedy = {};
    for (const value of money.denominations) { greedy[value] = Math.floor(remaining / value); remaining %= value; }
    for (const counts of [greedy,{1:money.expectedAmount(question) / 100}]) {
      assert.equal(money.evaluate(question,{counts,operation:question.operation}).correct,true,question.id);
      assert.equal(money.evaluate(question,{counts:{...counts,1:(counts[1] || 0) + 1},operation:question.operation}).correct,false);
      if (question.operation) {
        assert.equal(money.evaluate(question,{counts,operation:question.operation === '+' ? '×' : '+'}).correct,false);
        assert.equal(money.evaluate(question,{counts}).complete,false);
      }
    }
    for (const counts of [null,[],{1:-1},{1:0.5},{3:1},{'01':1},{1:'2'},{100:Number.MAX_SAFE_INTEGER},{}]) assert.equal(money.evaluate(question,{counts,operation:question.operation}).complete,false);
  }
});
