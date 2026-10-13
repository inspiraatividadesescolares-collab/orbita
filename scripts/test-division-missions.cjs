const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const division = require('../division-missions.js');
const questions = division.mission.questions;
const solution = q => Array.from({length:q.total},(_,i) => Math.floor(i / (q.groupSize || q.answer)));

test('missão contém as dez questões e as vinte imagens fornecidas',() => {
  assert.equal(division.challenge.title,'Desafio 17 — Introdução à divisão');
  assert.equal(division.challenge.missions.length,1);
  assert.equal(division.mission.title,'A ideia da divisão');
  assert.equal(questions.length,10);
  assert.equal(new Set(questions.map(q => q.id)).size,10);
  assert.deepEqual(questions.map(q => q.answer),[3,2,5,4,5,4,4,3,2,3]);
  assert.deepEqual(questions.map(q => q.total),[6,8,10,8,15,16,20,6,10,9]);
  assert.equal(questions[0].itemImage.endsWith('d17-m1-q1-b.png'),true);
  assert.equal(questions[0].targetImage.endsWith('d17-m1-q1-a.png'),true);
  const images = new Set();
  for (const [index,q] of questions.entries()) {
    assert.equal(q.id,`d17m1q${index + 1}`);
    assert.ok(q.text && q.spokenText && q.correct && q.incorrect && q.answerLabel);
    for (const image of [q.itemImage,q.targetImage]) {
      assert.ok(fs.existsSync(path.join(__dirname,'..',image)),image);
      images.add(image);
    }
  }
  assert.equal(images.size,20);
});

test('repartições exigem todas as figuras, partes iguais e resposta correta',() => {
  for (const q of questions.filter(q => q.mode === 'sharing')) {
    const locations = solution(q);
    assert.equal(division.evaluate(q,locations,String(q.answer)).correct,true,q.id);
    assert.equal(division.evaluate(q,locations,String(q.answer + 1)).correct,false,q.id);
    assert.equal(division.evaluate(q,Array(q.total).fill(0),String(q.answer)).correct,false,q.id);
    locations[0] = -1;
    assert.equal(division.evaluate(q,locations,String(q.answer)).complete,false,q.id);
    assert.equal(division.evaluate(q,solution(q),'').complete,false,q.id);
  }
});

test('duplas e grupos de cinco exigem o tamanho do grupo e a quantidade de grupos',() => {
  for (const q of questions.filter(q => q.mode === 'grouping')) {
    const locations = solution(q);
    assert.equal(division.evaluate(q,locations,q.answer,q.answer).correct,true,q.id);
    assert.equal(division.evaluate(q,locations,q.answer,q.answer + 1).correct,true,'destino vazio não conta como grupo');
    assert.equal(division.evaluate(q,locations,q.groupSize,q.answer).correct,false,'resposta deve contar grupos');
    assert.equal(division.evaluate(q,Array(q.total).fill(0),q.answer,1).correct,false,'um só grupo não resolve');
    const wrong = [...locations]; wrong[0] = 1;
    assert.equal(division.evaluate(q,wrong,q.answer,q.answer).correct,false,q.id);
  }
});

test('valores incompletos ou inválidos não consomem tentativa',() => {
  const q = questions[0];
  for (const answer of ['',null,'-3','3.5','3,0','3 maçãs','3e0','Infinity','999999999999999999999']) {
    assert.equal(division.parseAnswer(answer),null,String(answer));
    assert.equal(division.evaluate(q,solution(q),answer).complete,false,String(answer));
  }
  assert.equal(division.parseAnswer(' 03 '),3);
  for (const locations of [null,[],Array(6).fill(9),Array(6).fill('0'),Array(6).fill(-2)]) {
    assert.equal(division.evaluate(q,locations,3).complete,false);
  }
  assert.equal(division.distribution(q,solution(q),3),null);
});
