const assert = require('node:assert/strict');
const {test} = require('node:test');
const {challenge} = require('../mental-calculations.js');

const answers = [
  [155,159,259,368,468,559,677,787,847,187],
  [409,309,509,593,690,212,313,415,515,595],
  [508,508,512,713,717,711,809,709,615,817]
];
const letters = ['ACBDBADCAB','CDABDCBACD','CADBACBDAC'];

test('cada missão mantém dez questões, alternativas A a D e numeração de 1 a 10',() => {
  assert.equal(challenge.missions.length,3);
  const ids = new Set();
  for (const [missionIndex,mission] of challenge.missions.entries()) {
    assert.equal(mission.questions.length,10);
    assert.match(mission.intro,/Resolva mentalmente e marque apenas uma alternativa/);
    for (const [questionIndex,question] of mission.questions.entries()) {
      assert.equal(question.id,`d11m${missionIndex + 1}q${questionIndex + 1}`);
      assert.equal(question.type,'quiz');
      assert.equal(question.variant,'qt3');
      assert.equal(question.options.length,4);
      assert.equal(new Set(question.options).size,4);
      assert.equal(question.answer,String(answers[missionIndex][questionIndex]));
      assert.equal(question.options.indexOf(question.answer),letters[missionIndex].charCodeAt(questionIndex) - 65);
      const [,left,right] = /^Quanto é (\d+) \+ (\d+)\?$/.exec(question.text);
      assert.equal(Number(left) + Number(right),Number(question.answer));
      assert.ok(question.correct && question.incorrect);
      ids.add(question.id);
    }
  }
  assert.equal(ids.size,30);
});

test('as três introduções reproduzem os exemplos de composição e decomposição enviados',() => {
  assert.deepEqual(challenge.missions.map(mission => mission.example),[
    {operation:'102 + 53',steps:['102 = 100 + 2 e 53 = 50 + 3','100 + 50 = 150','2 + 3 = 5','150 + 5 = 155']},
    {operation:'397 + 12',steps:['397 = 390 + 7 e 12 = 10 + 2','390 + 10 = 400','7 + 2 = 9','400 + 9 = 409']},
    {operation:'306 + 202',steps:['306 = 300 + 6 e 202 = 200 + 2','300 + 200 = 500','6 + 2 = 8','500 + 8 = 508']}
  ]);
});

test('todas as igualdades dos feedbacks estão corretas, inclusive quando as unidades somam dez ou mais',() => {
  for (const mission of challenge.missions) for (const question of mission.questions) {
    const equations = [...question.correct.matchAll(/(\d+) \+ (\d+) = (\d+)|(\d+) = (\d+) \+ (\d+)/g)];
    assert.equal(equations.length,5,question.id);
    for (const equation of equations) {
      if (equation[1]) assert.equal(Number(equation[1]) + Number(equation[2]),Number(equation[3]),equation[0]);
      else assert.equal(Number(equation[4]),Number(equation[5]) + Number(equation[6]),equation[0]);
    }
  }
  assert.match(challenge.missions[1].questions[4].correct,/8 \+ 2 = 10; 680 \+ 10 = 690/);
  assert.match(challenge.missions[2].questions[4].correct,/9 \+ 8 = 17; 700 \+ 17 = 717/);
});
