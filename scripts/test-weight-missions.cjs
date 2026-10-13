const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {mission,balance,solutions,parseAnswer,evaluate,resolution} = require('../weight-missions.js');

test('dez questões preservam as frutas, massas, pesos e imagens do jogo original',() => {
  assert.equal(mission.title,'Quanto pesa?');
  assert.deepEqual(mission.questions.map(q => [q.fruit,q.mass,q.weights]),[
    ['melancia',8,[2,5,11]],['abacaxi',3,[2,4,5]],['jaca',10,[3,5,12]],
    ['laranja',1,[3,5,6]],['melão',7,[3,6,10]],['mamão',4,[2,5,7]],
    ['abóbora',9,[3,5,12]],['manga',2,[3,5,6]],['coco',6,[3,4,5]],['abacate',5,[2,4,7]]
  ]);
  mission.questions.forEach((q,index) => {
    assert.equal(q.id,`d14m3q${index + 1}`); assert.equal(q.type,'weight-balance');
    assert.ok(fs.existsSync(path.join(__dirname,'..',q.fruitImage)));
    assert.ok(q.correct && q.incorrect && q.spokenText);
    assert.ok(!q.text.includes(`${q.mass} kg`),'enunciado não revela a massa');
  });
});

test('todas as distribuições respeitam a massa total, a inclinação e qualquer solução de equilíbrio',() => {
  for (const q of mission.questions) {
    let matches = 0;
    for (const a of ['bank','left','right']) for (const b of ['bank','left','right']) for (const c of ['bank','left','right']) {
      const locations = [a,b,c],left = q.weights.reduce((sum,value,index) => sum + (locations[index] === 'left' ? value : 0),0);
      const right = q.weights.reduce((sum,value,index) => sum + (locations[index] === 'right' ? value : 0),0);
      const state = balance(q,locations);
      assert.equal(state.left,left); assert.equal(state.right,right);
      assert.equal(state.difference,q.mass + left - right);
      assert.equal(state.balanced,right - left === q.mass);
      assert.equal(Math.sign(state.tilt) || 0,-Math.sign(state.difference) || 0);
      assert.ok(Math.abs(state.tilt) <= 9);
      const result = evaluate(q,locations,q.mass);
      assert.equal(result.complete,state.balanced);
      assert.equal(result.correct,state.balanced);
      if (state.balanced) {
        matches++;
        assert.match(resolution(q,locations),new RegExp(`${right} kg − ${left} kg = ${q.mass} kg`));
        assert.equal(evaluate(q,locations,q.mass + 1).correct,false);
        assert.equal(evaluate(q,locations,`${q.mass},0`).correct,true);
      }
    }
    assert.ok(matches > 0,q.fruit); assert.equal(solutions(q).length,matches);
  }
  assert.ok(solutions(mission.questions[1]).length > 1,'abacaxi aceita diferentes distribuições');
});

test('balança sem equilíbrio e resposta inválida não consomem tentativa',() => {
  const q = mission.questions[0],solution = solutions(q)[0];
  for (const locations of [null,[],['left','right'],['left','right','outra']]) {
    assert.equal(balance(q,locations),null); assert.equal(evaluate(q,locations,8).complete,false);
  }
  assert.equal(evaluate(q,['bank','bank','bank'],8).complete,false);
  for (const answer of ['',null,' ',NaN,Infinity,'kg','8 kg','-8','1e1','8,0,0']) {
    assert.equal(parseAnswer(answer),null); assert.equal(evaluate(q,solution,answer).complete,false);
  }
  assert.equal(evaluate(q,solution,'0').complete,true); assert.equal(evaluate(q,solution,'0').correct,false);
  assert.equal(parseAnswer(' 8,5 '),8.5);
  assert.equal(evaluate(q,solution,'8').message,q.correct);
  assert.match(evaluate(q,solution,'9').message,/diferença.*mais uma tentativa/);
});
