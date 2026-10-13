const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const {challenge} = require('../multiplication-missions.js');
const letters = ['DACBCDCCBA','CDDACDCADC','DCCDBCDADC'];

test('30 questões incluem 10 montagens de grupos e 20 quizzes com imagens e vídeos',() => {
  assert.equal(challenge.missions.length,3);
  const ids = new Set();
  let images = 0;
  for (const [missionIndex,mission] of challenge.missions.entries()) {
    assert.equal(mission.questions.length,10);
    assert.ok(mission.intro);
    assert.ok(fs.existsSync(path.join(__dirname,'..',mission.video)),mission.video);
    for (const [questionIndex,question] of mission.questions.entries()) {
      assert.equal(question.id,`d12m${missionIndex + 1}q${questionIndex + 1}`);
      assert.ok(!ids.has(question.id),question.id);
      ids.add(question.id);
      if (missionIndex === 0) {
        assert.equal(question.type,'multiplication-groups');
        assert.equal(question.answer,question.groups * question.perGroup);
        assert.ok(!question.options && !question.image);
        assert.ok(question.correct && question.incorrect && question.spokenText);
        continue;
      }
      assert.equal(question.type,'quiz');
      assert.equal(question.options.length,4);
      assert.equal(new Set(question.options).size,4);
      const correct = letters[missionIndex].charCodeAt(questionIndex) - 65;
      assert.equal(question.answer,question.options[correct],question.id);
      assert.equal(question.correct,question.feedbackByAnswer[question.answer]);
      assert.equal(Object.keys(question.feedbackByAnswer).length,4);
      for (const [index,option] of question.options.entries()) {
        assert.equal(question.feedbackByAnswer[option],index === correct ? question.correct : question.incorrect);
      }
      assert.equal(question.variant,'qt1');
      assert.ok(question.imageAlt,question.id);
      assert.ok(fs.existsSync(path.join(__dirname,'..',question.image)),question.image);
      images++;
    }
  }
  assert.equal(ids.size,30);
  assert.equal(images,20);
});

test('produtos por 0, 1, 2, 3, 5 e 10 são matematicamente corretos e têm leitura da operação',() => {
  assert.deepEqual(challenge.missions[1].questions.map(q => Number(q.answer)),[6,3,0,6,4,8,2,0,10,9]);
  assert.deepEqual(challenge.missions[2].questions.slice(0,7).map(q => Number(q.answer)),[15,10,5,0,20,25,50]);
  for (const mission of challenge.missions) for (const question of mission.questions) if (question.factors) {
    const [left,right] = question.factors;
    assert.equal(Number(question.answer),left * right,question.id);
    assert.equal(question.spokenText,`Quanto é ${left} vezes ${right}?`);
  }
  assert.equal(challenge.missions[2].questions[7].answer,'0 e 5');
  assert.equal(challenge.missions[2].questions[8].answer,'0');
  assert.equal(challenge.missions[2].questions[9].answer,'80');
});

test('gabaritos das missões 2 e 3 continuam corretos',() => {
  const [,small,large] = challenge.missions.map(m => m.questions);
  assert.equal(small[9].answer,'9');
  assert.equal(large[3].answer,'0');
});

test('a montagem e o total precisam estar corretos; entradas incompletas não contam como resposta',() => {
  const {evaluate} = require('../multiplication-groups.js');
  const question = challenge.missions[0].questions[0];
  assert.equal(evaluate(question,[3,3,3],'9').correct,true);
  assert.equal(evaluate(question,[2,3,4],'9').correct,false);
  assert.equal(evaluate(question,[3,3,3],'8').correct,false);
  for (const answer of ['', 'maçãs', '-9', '9.5', '9e0']) assert.equal(evaluate(question,[3,3,3],answer).complete,false);
  for (const counts of [[0,0,0],[3,3,0],[3,3],[-1,3,3],[2.5,3,3]]) assert.equal(evaluate(question,counts,'9').complete,false);
  for (const question of challenge.missions[0].questions) assert.equal(evaluate(question,Array(question.groups).fill(question.perGroup),String(question.answer)).correct,true);
});
