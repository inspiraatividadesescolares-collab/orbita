const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {mission} = require('../division-problems.js');
const calculation = require('../division-calculation.js');
const {mission:first} = require('../division-missions.js');
const {mission:second} = require('../division-concepts.js');

function copies(q) {
  const frames = Array.from({length:q.divisor},(_,i) => ({id:i + 1,kind:'frame'}));
  return [...frames,...Array.from({length:q.total},(_,i) => ({id:q.divisor + i + 1,kind:'cap',parent:frames[Math.floor(i / Number(q.answer))].id}))];
}
test('dez problemas cobrem os seis divisores, preservam o exemplo e têm gabaritos inteiros',() => {
  assert.equal(mission.title,'Problemas envolvendo divisão'); assert.equal(mission.questions.length,10);
  assert.deepEqual([...new Set(mission.questions.map(q => q.divisor))].sort((a,b) => a - b),[1,2,3,4,5,10]);
  assert.equal(mission.questions[0].text,'Lúcia comprou 10 figurinhas e vai dividi-las igualmente com sua amiga. Com quantas figurinhas Lúcia vai ficar?');
  assert.deepEqual(mission.questions.map(q => q.answer),['5','12','5','3','4','3','6','6','5','2']);
  for (const [index,q] of mission.questions.entries()) {
    assert.equal(q.id,`d17m3q${index + 1}`); assert.equal(q.type,'division-calculation'); assert.equal(q.options,undefined);
    assert.equal(Number(q.answer),q.total / q.divisor); assert.equal(q.requireArrangement,true);
    assert.ok(q.text && q.spokenText && q.correct && q.incorrect && q.answerLabel);
    for (const image of [q.itemImage,q.targetImage]) assert.ok(fs.existsSync(path.join(__dirname,'..',image)),image);
  }
  assert.equal(new Set([...first.questions,...second.questions,...mission.questions].map(q => q.id)).size,30);
});
test('a resposta exige a quantidade de molduras e tampinhas e a repartição correta',() => {
  for (const q of mission.questions) {
    const figures = copies(q);
    assert.equal(calculation.evaluate(q,figures,q.answer).correct,true);
    assert.equal(calculation.evaluate(q,figures,'0').complete,true);
    assert.equal(calculation.evaluate(q,figures,'0').correct,false);
    assert.equal(calculation.evaluate(q,[],q.answer).complete,false);
    assert.equal(calculation.evaluate(q,figures.slice(0,-1),q.answer).complete,false);
    const outside = figures.map(copy => copy.kind === 'cap' ? {...copy,parent:null} : copy);
    assert.equal(calculation.evaluate(q,outside,q.answer).complete,false);
    const unequally = figures.map(copy => copy.kind === 'cap' ? {...copy,parent:1} : copy);
    assert.equal(calculation.evaluate(q,unequally,q.answer).complete,q.divisor === 1);
    assert.equal(calculation.evaluate(q,[...figures,{id:999,kind:'frame'}],q.answer).complete,false);
    assert.equal(calculation.evaluate(q,[...figures,figures[0]],q.answer).complete,false);
    for (const invalid of ['',null,'2.5','-1','abc']) assert.equal(calculation.evaluate(q,figures,invalid).complete,false);
  }
});
test('as ferramentas da missão 2 continuam aceitando alternativas sem exigir uma montagem',() => {
  for (const q of second.questions.filter(calculation.isType)) {
    assert.equal(calculation.evaluate(q,[],q.answer).correct,true);
    assert.equal(calculation.evaluate(q,[],q.options.find(option => option !== q.answer)).correct,false);
  }
});
