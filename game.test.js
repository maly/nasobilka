const assert = require('assert');
const game = require('./game.js');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error.message);
    process.exitCode = 1;
  }
}

test('level 1 uses only multiplication table of 2', () => {
  const factors = game.getLevelFactors(1);
  assert.deepStrictEqual(factors, [2]);
});

test('level 9 combines tables 2 and 3', () => {
  const factors = game.getLevelFactors(9);
  assert.deepStrictEqual(factors, [2, 3]);
});

test('level 4 uses a 10 second limit while earlier levels use 15 seconds', () => {
    assert.strictEqual(game.getTimeLimit(1), 30);
    assert.strictEqual(game.getTimeLimit(10), 30);
    assert.strictEqual(game.getTimeLimit(17), 30);
    assert.strictEqual(game.getTimeLimit(18), 10);
});

test('round question count is always 20', () => {
  assert.strictEqual(game.getRoundQuestionCount([2]), 20);
  assert.strictEqual(game.getRoundQuestionCount([2, 3, 4, 5, 6, 7, 8, 9]), 20);
});

test('round score applies base score, accuracy bonus, and level multiplier', () => {
  assert.strictEqual(game.calculateRoundScore(16, 20, 1), 1100);
  assert.strictEqual(game.calculateRoundScore(18, 20, 9), 4275);
  assert.strictEqual(game.calculateRoundScore(20, 20, 18), 11200);
});

test('round score breakdown shows bonuses and never returns negative earned points', () => {
  assert.deepStrictEqual(game.calculateRoundScoreBreakdown(14, 20, 1), {
    correctPoints: 1400,
    wrongPoints: -900,
    baseTotal: 500,
    bonusName: '',
    bonusPoints: 0,
    afterAccuracyBonus: 500,
    levelMultiplier: 1.1,
    levelBonusPoints: 50,
    earnedPoints: 550
  });

  assert.deepStrictEqual(game.calculateRoundScoreBreakdown(18, 20, 9), {
    correctPoints: 1800,
    wrongPoints: -300,
    baseTotal: 1500,
    bonusName: 'BONUS',
    bonusPoints: 750,
    afterAccuracyBonus: 2250,
    levelMultiplier: 1.9,
    levelBonusPoints: 2025,
    earnedPoints: 4275
  });

  assert.strictEqual(game.calculateRoundScoreBreakdown(0, 20, 1).earnedPoints, 0);
});

test('round outcome advances and awards stars by percentage', () => {
  assert.deepStrictEqual(game.getRoundOutcome(15, 20, 1), { passed: false, nextLevel: 1, stars: 0 });
  assert.deepStrictEqual(game.getRoundOutcome(16, 20, 1), { passed: true, nextLevel: 2, stars: 1 });
  assert.deepStrictEqual(game.getRoundOutcome(18, 20, 1), { passed: true, nextLevel: 2, stars: 2 });
  assert.deepStrictEqual(game.getRoundOutcome(20, 20, 1), { passed: true, nextLevel: 2, stars: 3 });
});

test('result button says LEVEL UP only after passing the level', () => {
  assert.strictEqual(game.getResultButtonText({ passed: true }), 'LEVEL UP');
  assert.strictEqual(game.getResultButtonText({ passed: false }), 'Zkusit znovu');
});

test('generated question has a dotted expression and exactly one correct option', () => {
  const question = game.createQuestion(1, () => 0.5);
  assert.strictEqual(question.expression, '6 · 2');
  assert.strictEqual(question.correctAnswer, 12);
  assert.strictEqual(question.options.length, 3);
  assert.strictEqual(new Set(question.options).size, 3);
  assert.strictEqual(question.options.filter((option) => option === question.correctAnswer).length, 1);
});

test('generated round does not repeat the same ordered multiplication twice in a row', () => {
  const round = game.createRound(9, () => 0);
  assert.strictEqual(round.length, 20);

  for (let index = 1; index < round.length; index += 1) {
    assert.notStrictEqual(round[index].expression, round[index - 1].expression);
  }
});

test('generated round is always 20 questions', () => {
  assert.strictEqual(game.createRound(1, () => 0.5).length, 20);
  assert.strictEqual(game.createRound(9, () => 0.5).length, 20);
  assert.strictEqual(game.createRound(18, () => 0.5).length, 20);
});
