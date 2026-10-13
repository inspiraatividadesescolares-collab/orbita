const assert = require('node:assert/strict');
const {test} = require('node:test');
const {mission,evaluate,solutions} = require('../tape-missions.js');

test('dez questões preservam os personagens, objetos e medidas do jogo Quanto mede?',() => {
  assert.equal(mission.title,'Quanto mede?');
  assert.equal(mission.questions.length,10);
  assert.deepEqual(mission.questions.map(q => [q.character,q.item,q.ribbons.map(r => r.value)]),[
    ['Aninha','fita',[20,50,30,40]],['Caio','barbante',[15,25,60,35,45]],
    ['Bia','cordão',[25,35,40,45,55]],['Davi','corda',[15,30,55,40]],
    ['Luiza','fita decorativa',[20,35,45,60,25]],['Miguel','faixa',[10,25,65,45]],
    ['Helena','barbante',[30,45,25,50,15]],['Pedro','fita de cetim',[20,30,55,15,40]],
    ['Sofia','cordão',[25,40,35,50]],['Theo','fita para sua pipa',[15,20,30,45,65]]
  ]);
  mission.questions.forEach((q,index) => {
    assert.equal(q.id,`d14m2q${index + 1}`);
    assert.equal(q.type,'tape-assembly'); assert.equal(q.target,100);
    assert.ok(q.correct && q.incorrect && q.spokenText);
    assert.equal(new Set(q.ribbons.map(r => r.id)).size,q.ribbons.length);
  });
});

test('todas as combinações que somam 100 cm são aceitas, independentemente da ordem',() => {
  for (const q of mission.questions) {
    let correctCount = 0;
    for (let mask = 1; mask < 2 ** q.ribbons.length; mask++) {
      const chosen = q.ribbons.filter((_,index) => mask & 2 ** index);
      const total = chosen.reduce((sum,r) => sum + r.value,0),ids = chosen.map(r => r.id);
      assert.equal(evaluate(q,ids).total,total);
      assert.equal(evaluate(q,ids).correct,total === 100);
      assert.equal(evaluate(q,[...ids].reverse()).correct,total === 100);
      if (total === 100) correctCount++;
    }
    assert.ok(correctCount > 0,q.id);
    assert.equal(solutions(q).length,correctCount,q.id);
  }
  assert.equal(solutions(mission.questions[2]).length,2,'Bia pode usar 25 + 35 + 40 ou 45 + 55');
});

test('cada peça só pode ser usada uma vez e respostas vazias ou desconhecidas não contam como tentativa',() => {
  const q = mission.questions[0];
  for (const ids of [[],null,['desconhecida'],['blue-50','blue-50']]) assert.equal(evaluate(q,ids).complete,false);
  assert.match(evaluate(q,['rose-20']).message,/Faltam 80 cm/);
  assert.match(evaluate(q,q.ribbons.map(r => r.id)).message,/Passou 40 cm/);
  assert.equal(evaluate(q,['rose-20','blue-50','red-30']).correct,true);
});
