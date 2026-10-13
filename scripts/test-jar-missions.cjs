const assert = require('node:assert/strict');
const {test} = require('node:test');
const {challenge,applyAction,evaluate,solve} = require('../jar-missions.js');
const questions = challenge.missions[0].questions;

test('as dez questões preservam as capacidades e metas do jogo original',() => {
  assert.equal(challenge.missions.length,1);
  assert.equal(questions.length,10);
  assert.match(challenge.missions[0].intro,/duas tentativas/);
  assert.deepEqual(questions.map(q => [q.capacities,q.target]),[
    [[500,300,1000],200],[[500,300,1000],800],[[500,300,1000],700],[[500,300,1000],400],
    [[700,200,900],600],[[600,200,900],500],[[900,200,1000],500],[[900,200,1000],300],
    [[800,700,1000],400],[[800,500,1000],400]
  ]);
  assert.equal(new Set(questions.map(q => q.id)).size,10);
  questions.forEach((q,index) => {
    assert.equal(q.id,`d14m1q${index + 1}`);
    assert.equal(q.type,'jar-transfer');
    assert.ok(q.correct && q.incorrect && q.spokenText);
  });
});

test('encher, transferir e esvaziar respeitam a capacidade e conservam a água transferida',() => {
  const q = questions[0],initial = [0,0,0];
  assert.deepEqual(applyAction(q,initial,{kind:'fill',from:0}).volumes,[500,0,0]);
  assert.deepEqual(initial,[0,0,0]);
  assert.deepEqual(applyAction(q,[500,0,0],{kind:'pour',from:0,to:1}).volumes,[200,300,0]);
  assert.deepEqual(applyAction(q,[500,200,950],{kind:'pour',from:0,to:2}).volumes,[450,200,1000]);
  assert.deepEqual(applyAction(q,[200,300,0],{kind:'pour',from:0,to:2}).volumes,[0,300,200]);
  assert.deepEqual(applyAction(q,[200,300,0],{kind:'empty',from:1}).volumes,[200,0,0]);
  assert.deepEqual(applyAction(q,[200,0,0],{kind:'fill',from:0}).volumes,[500,0,0]);
});

test('ações inválidas e ações sem efeito não alteram as jarras',() => {
  const q = questions[0];
  for (const [volumes,action] of [
    [[0,0,0],{kind:'pour',from:0,to:1}],[[0,0,0],{kind:'empty',from:0}],
    [[500,0,0],{kind:'fill',from:0}],[[500,300,0],{kind:'pour',from:0,to:1}],
    [[500,0,0],{kind:'pour',from:0,to:0}],[[500,0,0],{kind:'fill',from:null}],
    [[501,0,0],{kind:'empty',from:0}],[[0,-1,0],{kind:'fill',from:0}],
    [[0,0,0],{kind:'pour',from:0,to:3}],[[0,0,0],{kind:'partial-fill',from:0}]
  ]) {
    const before = [...volumes];
    assert.equal(applyAction(q,volumes,action).changed,false);
    assert.deepEqual(volumes,before);
  }
});

test('cada meta é alcançável e só a quantidade exata na maior jarra é aceita',() => {
  for (const q of questions) {
    const solution = solve(q);
    assert.ok(solution?.length,q.id);
    let volumes = [0,0,0];
    for (const action of solution) {
      const result = applyAction(q,volumes,action);
      assert.equal(result.changed,true,q.id);
      if (action.kind === 'pour') assert.equal(result.volumes.reduce((a,b) => a + b),volumes.reduce((a,b) => a + b));
      result.volumes.forEach((volume,index) => assert.ok(volume >= 0 && volume <= q.capacities[index]));
      volumes = result.volumes;
    }
    assert.equal(evaluate(q,volumes).correct,true,q.id);
    assert.equal(volumes[2],q.target);
    assert.equal(evaluate(q,[0,0,q.target - 1]).correct,false);
    assert.equal(evaluate(q,[0,0,q.target + 1]).correct,false);
    assert.equal(evaluate(q,[q.target,0,0]).correct,false);
  }
});

test('feedback usa a capacidade real de 900 mL nas questões 5 e 6',() => {
  for (const q of questions.slice(4,6)) {
    assert.match(evaluate(q,[0,0,0]).message,/jarra de 900 mL/);
    assert.match(q.text,/jarra de 900 mL/);
  }
});
