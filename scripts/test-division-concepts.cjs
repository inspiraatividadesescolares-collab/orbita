const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const concepts = require('../division-concepts.js');
const division = require('../division-missions.js');
const questions = concepts.mission.questions;

test('dez questões preservam os gabaritos, incluem alternativas na 7 e localizam todas as imagens',() => {
  assert.equal(concepts.mission.title,'Metade, terça parte e quarta parte');
  assert.equal(questions.length,10);
  assert.deepEqual(questions.map(q => q.choiceAnswer || q.answer),['metade','4','terça parte','5','quarta parte','5','10','20 ÷ 5 = 4','8','9']);
  const expected = [['metade','quarta parte','quinta parte','terça parte'],['8','6','3','4'],['quinta parte','metade','décima parte','terça parte'],['3','5','6','2'],['metade','quarta parte','quinta parte','terça parte'],['10','16','4','5'],['20','5','10','15'],['20 − 5 = 15','20 ÷ 4 = 5','20 ÷ 5 = 4','20 + 5 = 25'],['8','11','6','7'],['9','11','13','6']];
  assert.deepEqual(questions.map(q => q.options),expected);
  assert.equal(questions[6].type,'division-sharing');
  assert.equal(questions[7].choiceAnswer,'20 ÷ 5 = 4');
  const files = new Set();
  for (const [index,q] of questions.entries()) {
    assert.equal(q.id,`d17m2q${index + 1}`);
    assert.ok(q.text && q.spokenText && q.correct && q.incorrect);
    if (q.type === 'quiz') for (const option of q.options) assert.equal(q.feedbackByAnswer[option],option === q.answer ? q.correct : q.incorrect);
    for (const file of concepts.images(q)) {
      assert.ok(fs.existsSync(path.join(__dirname,'..',file)),file); files.add(file);
    }
  }
  assert.equal(files.size,20);
  assert.equal(new Set([...division.mission.questions,...questions].map(q => q.id)).size,20);
});

test('repartições exigem todos os itens em partes iguais antes de escolher uma alternativa',() => {
  assert.deepEqual([questions[0],questions[2],questions[4]].map(q => q.divisionVisual.parts),[2,3,4]);
  for (const [index,total,parts] of [[1,8,2],[3,15,3],[5,20,4],[6,20,2]]) {
    const q = questions[index],locations = Array.from({length:total},(_,i) => Math.floor(i / (total / parts)));
    assert.equal(q.total,total); assert.equal(q.targets.length,parts); assert.equal(q.requireEqual,true);
    assert.equal(division.evaluate(q,Array(total).fill(-1),q.choiceAnswer).complete,false);
    assert.equal(division.evaluate(q,Array(total).fill(0),q.choiceAnswer).complete,false);
    for (const option of q.options) assert.equal(division.evaluate(q,locations,option).correct,option === q.choiceAnswer);
  }
  assert.equal(questions[5].targetLayout,'shelf');
  assert.deepEqual(questions[5].targets.map(t => t.label),['Contos de fadas','Animais','Terror','Heróis']);
  assert.ok(questions[3].targets[1].image.endsWith('d17-m2-q5-c.png'));
  for (const index of [8,9]) { assert.equal(questions[index].type,'division-calculation'); assert.ok(questions[index].itemImage.endsWith('tampinha-calculo.svg')); }
});

test('folhas devem formar quatro grupos de cinco antes de escolher a divisão correta',() => {
  const q = questions[7],locations = Array.from({length:20},(_,index) => Math.floor(index / 5));
  for (const option of q.options) {
    const result = division.evaluate(q,locations,option,4);
    assert.equal(result.complete,true); assert.equal(result.correct,option === '20 ÷ 5 = 4');
  }
  assert.equal(division.evaluate(q,Array(20).fill(-1),q.choiceAnswer).complete,false);
  assert.equal(division.evaluate(q,locations,null,4).complete,false);
  assert.equal(division.evaluate(q,locations,'4',4).complete,false);
  assert.equal(division.evaluate(q,Array(20).fill(0),q.choiceAnswer).correct,false);
});
