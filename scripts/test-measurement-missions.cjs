const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const {challenge} = require('../measurement-missions.js');
const letters = ['CBDCACACDB','CBADCBCBAD','DCBCACCBDC'];

test('três missões têm dez questões, todas as imagens e os gabaritos conferidos',() => {
  assert.deepEqual(challenge.missions.map(m => m.title),['Comprimento','Massa','Capacidade']);
  const ids = new Set(),images = new Set();
  for (const [missionIndex,mission] of challenge.missions.entries()) {
    assert.equal(mission.questions.length,10);
    assert.ok(mission.intro);
    for (const [questionIndex,question] of mission.questions.entries()) {
      assert.equal(question.id,`d13m${missionIndex + 1}q${questionIndex + 1}`);
      assert.equal(question.type,'quiz');
      assert.equal(question.variant,'qt1');
      assert.equal(question.options.length,4);
      assert.equal(new Set(question.options).size,4);
      const correct = letters[missionIndex].charCodeAt(questionIndex) - 65;
      assert.equal(question.answer,question.options[correct],question.id);
      assert.equal(question.correct,question.feedbackByAnswer[question.answer]);
      assert.equal(Object.keys(question.feedbackByAnswer).length,4);
      for (const option of question.options) assert.ok(question.feedbackByAnswer[option],question.id);
      assert.ok(question.imageAlt,question.id);
      assert.ok(question.image.endsWith(`/d7-m${missionIndex + 1}-q${questionIndex + 1}.png`));
      assert.ok(fs.existsSync(path.join(__dirname,'..',question.image)),question.image);
      ids.add(question.id); images.add(question.image);
    }
  }
  assert.equal(ids.size,30);
  assert.equal(images.size,30);
});

test('comprimentos, conversões de massa e cálculos de capacidade respeitam as unidades',() => {
  const [length,mass,capacity] = challenge.missions.map(m => m.questions);
  assert.equal(length[2].answer,'100 cm');
  assert.equal(length[3].answer,`${100 - 40} cm`);
  assert.equal(length[5].answer,`${8 - 0} cm`);
  assert.equal(length[6].answer,`${7 - 2} cm`);
  assert.equal(length[8].answer,`${[6,3,6,1].reduce((sum,value) => sum + value,0)} metros`);
  assert.equal(length[9].answer,'1 m e 50 cm');
  assert.equal(mass[5].answer,'laranja');
  assert.equal(mass[7].answer,'1.000 gramas');
  assert.equal(mass[8].answer,`${Math.min(80,800,1000,50000)} g`);
  assert.equal(capacity[2].answer,'250 mL');
  assert.equal(Number(capacity[3].answer),[300,400,500].sort((a,b) => a - b)[1]);
  assert.equal(Number(capacity[4].answer),400 + 200 - 100);
  const amounts = capacity[6].options.map(option => {
    const [,count,volume] = /^(\d+) copos de (\d+) mL$/.exec(option);
    return Number(count) * Number(volume);
  });
  assert.deepEqual(amounts,[600,900,1000,800]);
  assert.equal(amounts[capacity[6].options.indexOf(capacity[6].answer)],1000);
  assert.equal(Number(capacity[7].answer),7 * 3);
});

test('capacidade usa os gabaritos corrigidos e os feedbacks de cada recipiente',() => {
  const questions = challenge.missions[2].questions;
  assert.equal(questions[5].answer,'Um balde');
  assert.match(questions[5].feedbackByAnswer['Uma colher'],/15 mL/);
  assert.match(questions[5].feedbackByAnswer['Um copo'],/400 mL/);
  assert.match(questions[5].feedbackByAnswer['Uma piscina'],/5\.000 L/);
  assert.equal(questions[6].answer,'2 copos de 500 mL');
  assert.match(questions[9].text,/exatamente 1 L/);
  assert.match(questions[9].feedbackByAnswer['O balde'],/10 L/);
  assert.match(questions[9].feedbackByAnswer['O copo'],/250 mL/);
  assert.match(questions[9].feedbackByAnswer['O filtro'],/5 L/);
});
