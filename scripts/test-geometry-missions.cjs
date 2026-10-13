const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const {challenge} = require('../geometry-missions.js');

const answerLetters = ['DBBADBCBAD','ABDBAACCCD','ACCDABAACB'];

test('30 questões de geometria têm gabaritos, quatro feedbacks e mídia disponível',() => {
  assert.equal(challenge.missions.length,3);
  const ids = new Set();
  for (const [missionIndex,mission] of challenge.missions.entries()) {
    assert.equal(mission.questions.length,10);
    assert.ok(mission.intro);
    assert.ok(fs.existsSync(path.join(__dirname,'..',mission.video)),mission.video);
    for (const [questionIndex,question] of mission.questions.entries()) {
      assert.equal(question.type,'quiz');
      assert.equal(question.variant,'qt1');
      assert.equal(question.options.length,4);
      assert.equal(new Set(question.options).size,4);
      const correct = answerLetters[missionIndex].charCodeAt(questionIndex) - 65;
      assert.equal(question.answer,question.options[correct],question.id);
      assert.equal(question.correct,question.feedbackByAnswer[question.answer]);
      assert.equal(Object.keys(question.feedbackByAnswer).length,4);
      for (const option of question.options) assert.ok(question.feedbackByAnswer[option],`${question.id}: ${option}`);
      assert.ok(question.imageAlt,question.id);
      assert.ok(fs.existsSync(path.join(__dirname,'..',question.image)),question.image);
      assert.ok(!ids.has(question.id),question.id);
      ids.add(question.id);
    }
  }
  assert.equal(ids.size,30);
});

test('divergências do roteiro respeitam as figuras e as propriedades geométricas',() => {
  const [polygons,symmetry,solids] = challenge.missions.map(mission => mission.questions);
  assert.equal(polygons[9].answer,'Porque ela é aberta.');
  assert.match(symmetry[4].answer,/forma e o tamanho/);
  assert.equal(solids[4].answer,'cubo');
  assert.equal(solids[6].answer,'quadrado');
  assert.match(solids[6].correct,/quadrado/);
  assert.match(solids[5].feedbackByAnswer.cone,/cone tem uma superfície curva/);
  assert.match(solids[2].image,/piramide\.svg$/);
  assert.equal(solids[2].answer,'uma pirâmide');
});
