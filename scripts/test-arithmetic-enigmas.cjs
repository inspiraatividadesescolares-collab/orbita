const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const enigmas = require('../arithmetic-enigmas.js');
const missions = enigmas.challenge.missions;

assert.equal(missions.length,3);
assert.deepEqual(missions.map(mission => mission.questions.length),[10,10,10]);
assert.equal(new Set(missions.flatMap(mission => mission.questions.map(question => question.id))).size,30);
missions.forEach(mission => assert.ok(fs.existsSync(path.join(__dirname,'..',mission.video)),mission.video));

const expectedAddition = [[132,323,455],[42,27,69],[73,16,89],[46,32,78],[64,35,99],
  [33,38,71],[25,39,64],[49,32,81],[38,34,72],[61,19,80]];
missions[0].questions.forEach((question,index) => {
  assert.equal(question.mode,'input');
  const result = enigmas.evaluate(question,[question.answer]);
  assert.equal(result.correct,true,question.id);
  assert.deepEqual([result.top,result.bottom,result.result],expectedAddition[index]);
  const carries = enigmas.calculationSteps(result.top,result.bottom,'+').some(step => step.transfer);
  assert.equal(carries,index >= 5,`${question.id}: primeiras cinco sem reagrupamento, últimas cinco com reagrupamento`);
  const correctDigits = Array.from({length:10},(_,digit) => digit).filter(digit => enigmas.evaluate(question,[digit]).correct);
  assert.deepEqual(correctDigits,[Number(question.answer)],question.id);
  for (const digit of Array.from({length:10},(_,digit) => digit)) {
    const attempt = enigmas.evaluate(question,[digit]);
    assert.equal(attempt.result,Number(question.topTemplate) + Number(question.bottomTemplate.replace('_',digit)));
    assert.ok(attempt.message.includes(attempt.equation));
  }
  for (const input of [[],[''],['12'],['a'],[-1],[null],[undefined],[1,2]]) {
    assert.equal(enigmas.evaluate(question,input).complete,false,`${question.id}: ${JSON.stringify(input)}`);
  }
});
assert.equal(new Set(missions[0].questions.map(question => question.praise)).size,10,'feedback positivo variado');
assert.deepEqual(enigmas.calculationSteps(64,36,'+').filter(step => step.transfer).map(step => step.place),[0,1]);
assert.deepEqual(enigmas.calculationSteps(132,329,'+').filter(step => step.transfer).map(step => step.place),[0]);

const expectedAnswers = [[[2],[1],[7],[1],[4],[7],[8],[5],[7],[9]],
  [[6,6],[4,4],[1,1],[7,7],[5,5],[5,6],[8,6],[5,3],[4,4],[1,9]]];
missions.slice(1).forEach((mission,missionIndex) => mission.questions.forEach((question,index) => {
  assert.equal(question.mode,'input');
  assert.equal(question.options,undefined,'sem alternativas de múltipla escolha');
  assert.deepEqual(question.answers,expectedAnswers[missionIndex][index],question.id);
  assert.equal(enigmas.evaluate(question,question.answers).correct,true,question.id);
  assert.equal(enigmas.evaluate(question,question.answers.slice(0,-1)).complete,false,question.id);
  assert.equal(enigmas.evaluate(question,question.answers.map(() => '')).complete,false,question.id);
}));
const mixed = missions[2].questions;
assert.equal(enigmas.evaluate(mixed[0],[6]).complete,false,'os dois quadradinhos devem ser digitados');
assert.match(enigmas.evaluate(mixed[0],[5,7]).message,/35 \+ 37 = 72.*mesmo número/);
assert.match(enigmas.evaluate(mixed[6],[7,7]).message,/67 \+ 27 = 94.*PARES/);
assert.match(enigmas.evaluate(mixed[7],[6,2]).message,/46 \+ 42 = 88.*ÍMPARES/);
assert.match(enigmas.evaluate(mixed[8],[6,2]).message,/26 \+ 22 = 48.*iguais/);
assert.match(enigmas.evaluate(mixed[9],[5,5]).message,/35 \+ 25 = 60.*próximas/);
assert.equal(enigmas.closestDifference(mixed[9]),2);
assert.equal(enigmas.evaluate(mixed[5],[6,5]).correct,true,'qualquer combinação que cumpra o enunciado é aceita');
assert.equal(enigmas.evaluate(mixed[6],[6,8]).correct,true,'a ordem inversa dos pares também é válida');
for (const pair of [[1,7],[3,5],[5,3],[7,1]]) assert.equal(enigmas.evaluate(mixed[7],pair).correct,true);
assert.equal(enigmas.evaluate(mixed[5],[0,9]).correct,false,'combinações livres ainda precisam atingir o total');
assert.equal(enigmas.evaluate({...missions[0].questions[0],topTemplate:'20',bottomTemplate:'1_',target:30},[0]).correct,true,'zero é um algarismo válido');
for (const [top,bottom,expected] of [[77,22,[7,7]],[63,37,[13,5]],[85,38,[15,7]],[90,75,[10,8]],[91,27,[11,8]],[54,19,[14,4]],[100,19,[10,9,0]],[330,249,[10,12,2]]]) {
  const regroup = enigmas.subtractionRegrouping(top,bottom);
  assert.deepEqual(regroup.values,expected,`${top} − ${bottom}: valores escritos acima dos algarismos cortados`);
  assert.equal(regroup.values.reduce((sum,value,place) => sum + value * 10 ** place,0),top,'o reagrupamento conserva o valor do minuendo');
}
console.log('30 enigmas digitáveis: entradas completas, soluções alternativas, condições e valores reagrupados da subtração conferidos.');
