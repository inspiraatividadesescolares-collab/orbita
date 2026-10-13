const assert = require('node:assert/strict');
const test = require('node:test');
const cross = require('../cross-operations.js');
const questions = cross.challenge.missions.flatMap(mission => mission.questions);
const allowedFacts = new Set([0,1,2,3,4,5,10]);
const results = question => cross.solutions(question).map(order => cross.evaluate(question,order).values);

test('Desafio 15 tem três missões de dez cruzadinhas diferentes e cinco peças por questão',() => {
  assert.equal(cross.challenge.title,'Desafio 15 — Cruza operações');
  assert.deepEqual(cross.challenge.missions.map(mission => mission.title),['Adição','Subtração','Multiplicação']);
  assert.equal(questions.length,30);
  assert.equal(new Set(questions.map(question => question.id)).size,30);
  assert.equal(new Set(questions.map(question => JSON.stringify([question.operation,question.givens,question.numbers]))).size,30);
  for (const mission of cross.challenge.missions) {
    assert.equal(mission.questions.length,10);
    for (const question of mission.questions) {
      assert.equal(question.numbers.length,5);
      assert.equal(cross.isType(question),true);
      assert.ok(Object.values(question.givens).concat(question.numbers).every(number => Number.isInteger(number) && number >= 0));
      assert.ok(cross.blanks.every(key => !(key in question.givens)));
      assert.match(question.spokenText,/Na horizontal:.*Na vertical:/);
    }
  }
});

test('o primeiro exemplo mantém os números propostos e as cinco contas conectadas',() => {
  const first = questions[0];
  assert.deepEqual(first.numbers,[4,5,7,2,18]);
  assert.equal(cross.resolution(first),'4 + 4 = 8; 8 + 5 = 13; 6 + 7 = 13; 13 + 2 = 15; 13 + 5 = 18.');
  const positions = new Map(cross.cells.filter(([key]) => !['op','eq'].includes(key)).map(([key,row,col]) => [key,[row,col]]));
  for (const {keys,direction} of cross.equations) {
    const [a,b,c] = keys.map(key => positions.get(key));
    const axis = direction === 'horizontal' ? 1 : 0,other = 1 - axis;
    assert.equal(a[other],b[other]); assert.equal(b[other],c[other]);
    assert.equal(b[axis] - a[axis],2); assert.equal(c[axis] - b[axis],2);
  }
  assert.equal(new Set(cross.cells.map(([,row,col]) => `${row},${col}`)).size,cross.cells.length);
});

test('todas as cruzadinhas têm soluções corretas nas duas direções e aceitam peças repetidas',() => {
  let duplicateBanks = 0;
  for (const question of questions) {
    const solutions = cross.solutions(question);
    assert.ok(solutions.length,question.id);
    for (const values of results(question)) {
      for (const {keys:[a,b,c]} of cross.equations) {
        const result = question.operation === 'addition' ? values[a] + values[b] : question.operation === 'subtraction' ? values[a] - values[b] : values[a] * values[b];
        assert.equal(result,values[c],question.id);
      }
    }
    if (new Set(question.numbers).size < 5) duplicateBanks++;
    const wrong = solutions[0].slice();
    const different = wrong.findIndex(id => question.numbers[id] !== question.numbers[wrong[0]]);
    [wrong[0],wrong[different]] = [wrong[different],wrong[0]];
    const attempt = cross.evaluate(question,wrong);
    assert.equal(attempt.complete,true); assert.equal(attempt.correct,false);
    assert.match(attempt.message,/horizontal|vertical/);
  }
  assert.ok(duplicateBanks > 0);
});

test('todas as soluções respeitam os limites de cada missão, inclusive zero e os fatos do 10',() => {
  const facts = new Set();
  for (const question of questions) for (const values of results(question)) {
    for (const {keys:[a,b,c]} of cross.equations) {
      if (question.operation === 'addition') assert.ok(values[c] <= 20,question.id);
      if (question.operation === 'subtraction') { assert.ok(values[a] <= 20,question.id); assert.ok(values[c] >= 0,question.id); }
      if (question.operation === 'multiplication') {
        assert.ok(allowedFacts.has(values[a]) && allowedFacts.has(values[b]),question.id);
        facts.add(values[a]); facts.add(values[b]);
      }
    }
  }
  assert.deepEqual([...facts].sort((a,b) => a - b),[0,1,2,3,4,5,10]);
});

test('quadros incompletos, peças usadas duas vezes e índices inválidos não contam como resposta',() => {
  for (const invalid of [null,[],[0,1,2,3],[0,1,2,3,null],[0,1,2,3,3],[0,1,2,3,5],[0,1,2,3,-1],[0,1,2,3,'4']]) {
    assert.deepEqual(cross.evaluate(questions[0],invalid),{complete:false,correct:false,message:'Coloque todos os números nos cinco quadrinhos antes de conferir.'});
  }
});
