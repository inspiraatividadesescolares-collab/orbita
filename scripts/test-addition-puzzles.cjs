const test = require('node:test');
const assert = require('node:assert/strict');
const puzzles = require('../addition-puzzles.js');
const [triangle,square,click] = puzzles.challenge.missions;

function permutations(values) {
  if (!values.length) return [[]];
  return values.flatMap((value,index) => permutations(values.filter((_,i) => i !== index)).map(rest => [value,...rest]));
}

test('as dez questões do triângulo têm solução, incluindo números repetidos e soma livre',() => {
  assert.equal(triangle.questions.length,10);
  assert.deepEqual(triangle.questions.map(question => question.target),[5,3,4,10,12,13,null,null,null,null]);
  for (const question of triangle.questions) {
    const solutions = permutations([0,1,2,3,4,5]).filter(order => {
      const [a,b,c,d,e,f] = order.map(index => question.numbers[index]);
      return a + b + d === a + c + f && a + c + f === d + e + f && (question.target === null || a + b + d === question.target);
    });
    assert.ok(solutions.length > 0,question.id);
    for (const solution of solutions) assert.equal(puzzles.evaluateTriangle(question,solution).correct,true);
    assert.equal(puzzles.evaluateTriangle(question,[0,0,1,2,3,4]).complete,false);
    assert.equal(puzzles.evaluateTriangle(question,[null,null,null,null,null,null]).complete,false);
  }
});

test('a missão 2 tem dez quadros diferentes e todos têm soluções válidas',() => {
  assert.equal(square.questions.length,10);
  assert.equal(new Set(square.questions.map(question => question.givens.join(','))).size,10);
  assert.deepEqual(square.questions[0].givens,[7,null,null,null,3,null,3,null,null]);
  const rows = [];
  for (let a = 0; a <= 9; a++) for (let b = 0; b <= 9; b++) {
    const c = 10 - a - b;
    if (c >= 0 && c <= 9 && new Set([a,b,c]).size === 3) rows.push([a,b,c]);
  }
  const solutions = [];
  for (const first of rows) for (const second of rows) {
    const third = first.map((value,column) => 10 - value - second[column]);
    if (third.some(value => value < 0 || value > 9) || new Set(third).size !== 3) continue;
    if ([0,1,2].some(column => new Set([first[column],second[column],third[column]]).size !== 3)) continue;
    solutions.push([...first,...second,...third]);
  }
  square.questions.forEach((question,index) => {
    assert.equal(question.id,`d3m2-quadrado-q${index + 1}`);
    assert.equal(question.target,10);
    assert.equal(question.givens.length,9);
    assert.equal(question.givens.filter(value => value !== null).length,3);
    assert.ok(question.givens.every(value => value === null || (Number.isInteger(value) && value >= 0 && value <= 9)));
    const matching = solutions.filter(solution => question.givens.every((value,cell) => value === null || solution[cell] === value));
    assert.ok(matching.length > 0,question.id);
    for (const solution of matching) assert.equal(puzzles.evaluateSquare(question,solution).correct,true);
  });
});

test('o quadrado aceita soluções alternativas e rejeita repetições, espaços e números fora de 0 a 9',() => {
  const question = square.questions[0];
  for (const solution of [[7,0,3,0,3,7,3,7,0],[7,1,2,0,3,7,3,6,1],[7,2,1,0,3,7,3,5,2]]) {
    assert.equal(puzzles.evaluateSquare(question,solution).correct,true);
  }
  assert.equal(puzzles.evaluateSquare(question,[7,3,0,0,3,7,3,4,3]).correct,false);
  assert.equal(puzzles.evaluateSquare(question,[7,2,1,0,3,7,3,5,3]).correct,false);
  assert.equal(puzzles.evaluateSquare(question,[7,2,1,0,3,7,3,5,null]).complete,false);
  assert.equal(puzzles.evaluateSquare(question,[7,2,1,0,3,7,3,5,10]).complete,false);
  assert.equal(puzzles.evaluateSquare(question,[6,2,2,0,3,7,3,5,2]).complete,false);
});

test('cada quadro de 25 números tem exatamente um trio correto para os totais de 10 a 20',() => {
  assert.deepEqual(click.questions.map(question => question.target),Array.from({length:11},(_,i) => i + 10));
  for (const question of click.questions) {
    assert.equal(question.numbers.length,25);
    assert.ok(question.numbers.every(number => Number.isInteger(number) && number >= 0 && number <= 9));
    const solutions = [];
    for (let i = 0; i < 23; i++) for (let j = i + 1; j < 24; j++) for (let k = j + 1; k < 25; k++) {
      if (question.numbers[i] + question.numbers[j] + question.numbers[k] === question.target) solutions.push([i,j,k]);
    }
    assert.equal(solutions.length,1,question.id);
    assert.equal(puzzles.evaluateThreeNumbers(question,solutions[0]).correct,true);
    assert.equal(puzzles.evaluateThreeNumbers(question,solutions[0].slice(0,2)).complete,false);
    assert.equal(puzzles.evaluateThreeNumbers(question,[solutions[0][0],solutions[0][0],solutions[0][1]]).complete,false);
    assert.equal(puzzles.evaluateThreeNumbers(question,[0,1,25]).complete,false);
  }
});
