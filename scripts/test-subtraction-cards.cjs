const test = require('node:test');
const assert = require('node:assert/strict');
const cards = require('../subtraction-cards.js');
const [pair,target,review] = cards.challenge.missions;

test('as três missões têm dez rodadas, IDs únicos e seis cartas por rodada',() => {
  const questions = cards.challenge.missions.flatMap(mission => mission.questions);
  assert.equal(questions.length,30);
  assert.equal(new Set(questions.map(question => question.id)).size,30);
  for (const mission of cards.challenge.missions) {
    assert.equal(mission.questions.length,10);
    for (const question of mission.questions) assert.equal((question.numbers || question.operations).length,6);
  }
});

test('qualquer par das cartas pode ser resolvido, respeitando a escolha do maior número',() => {
  for (const question of pair.questions) {
    for (let first = 0; first < 5; first++) for (let second = first + 1; second < 6; second++) {
      const numbers = [question.numbers[first],question.numbers[second]];
      const difference = Math.abs(numbers[0] - numbers[1]);
      const greater = numbers[0] > numbers[1] ? 0 : 1;
      assert.equal(cards.evaluateNumbers(question,numbers,greater,String(difference)).correct,true);
      const smallerChoice = cards.evaluateNumbers(question,numbers,1 - greater,String(difference));
      assert.equal(smallerChoice.correct,false);
      assert.equal(smallerChoice.complete,false);
      assert.match(smallerChoice.message,/número menor.*maior número/);
      assert.equal(cards.evaluateNumbers(question,numbers,greater,String(difference + 1)).correct,false);
      assert.equal(cards.evaluateNumbers(question,numbers,null,String(difference)).complete,false);
    }
    assert.equal(cards.evaluateNumbers(question,[question.numbers[0]],0,'1').complete,false);
    assert.equal(cards.evaluateNumbers(question,[question.numbers[0],question.numbers[0]],0,'0').complete,false);
  }
});

test('os alvos progridem de 10 a 20 e todas as cartas permitem completar o alvo',() => {
  assert.deepEqual(target.questions.map(question => question.target),[10,10,15,15,15,20,20,20,20,20]);
  for (const question of target.questions) {
    assert.equal(new Set(question.numbers).size,6);
    for (const number of question.numbers) {
      assert.ok(number >= 0 && number < question.target);
      const answer = question.target - number;
      assert.equal(cards.evaluateNumbers(question,[number],-1,String(answer)).correct,true);
      const wrong = cards.evaluateNumbers(question,[number],-1,String(answer - 1));
      assert.equal(wrong.correct,false);
      assert.ok(wrong.message.includes(`a ${number} para chegar a ${question.target}`));
    }
  }
});

test('respostas vazias, texto, decimais, sinais e números fora do intervalo não gastam tentativas',() => {
  const question = target.questions[0];
  for (const answer of ['', ' ', 'abc', '-1', '+2', '2.0', '1e1', '21', '999']) {
    assert.equal(cards.evaluateNumbers(question,[question.numbers[0]],-1,answer).complete,false,answer);
  }
});

test('as 60 operações distinguem a verdade da operação do acerto do estudante',() => {
  let correctOperations = 0;
  let incorrectOperations = 0;
  for (const question of review.questions) {
    for (const operation of question.operations) {
      const expected = operation.greater - operation.smaller === operation.result;
      expected ? correctOperations++ : incorrectOperations++;
      const right = cards.evaluateOperation(operation,expected);
      assert.equal(right.correct,true);
      assert.equal(cards.evaluateOperation(operation,!expected).correct,false);
      assert.equal(cards.evaluateOperation(operation,'true').complete,false);
      assert.ok(right.resolution.includes(`${operation.greater} − ${operation.smaller} = ${operation.greater - operation.smaller}`));
      assert.ok(right.resolution.endsWith(`está ${expected ? 'certo' : 'errado'}.`));
    }
  }
  assert.equal(correctOperations,40);
  assert.equal(incorrectOperations,20);
});

test('cada questão termina após responder a uma única carta escolhida',() => {
  for (const question of review.questions) for (let index = 0; index < 6; index++) {
    const round = cards.createReviewRound(question);
    assert.equal(cards.answerOperation(round,true),null);
    assert.equal(cards.selectOperation(round,index),true);
    for (let other = 0; other < 6; other++) assert.equal(cards.selectOperation(round,other),false);
    const operation = question.operations[index];
    const result = cards.answerOperation(round,operation.greater - operation.smaller === operation.result);
    assert.equal(result.correct,true);
    assert.equal(result.finished,true);
    assert.deepEqual(cards.reviewSummary(round),{complete:true,correct:true,attempts:1,errors:0,retried:false});
    assert.equal(cards.answerOperation(round,true),null);
    assert.equal(cards.selectOperation(round,(index + 1) % 6),false);
  }
});

test('uma resposta incorreta encerra a questão e mostra a resolução, sem segunda carta ou tentativa',() => {
  const question = review.questions[0];
  const round = cards.createReviewRound(question);
  cards.selectOperation(round,1);
  const result = cards.answerOperation(round,true);
  assert.equal(result.resolved,true);
  assert.equal(result.finished,true);
  assert.equal(result.correct,false);
  assert.ok(result.resolution.includes('9 − 3 = 6'));
  assert.deepEqual(cards.reviewSummary(round),{complete:true,correct:false,attempts:1,errors:1,retried:false});
  assert.equal(cards.answerOperation(round,false),null);
  assert.equal(cards.selectOperation(round,2),false);
});

test('escolhas inválidas e respostas sem carta não concluem a questão nem contam tentativas',() => {
  const round = cards.createReviewRound(review.questions[0]);
  for (const index of [-1,6,1.5,null]) assert.equal(cards.selectOperation(round,index),false);
  assert.equal(cards.answerOperation(round,true),null);
  assert.deepEqual(cards.reviewSummary(round),{complete:false,correct:false,attempts:0,errors:0,retried:false});
  cards.selectOperation(round,2);
  assert.equal(cards.answerOperation(round,'true').complete,false);
  assert.deepEqual(cards.reviewSummary(round),{complete:false,correct:false,attempts:0,errors:0,retried:false});
});
