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

test('level 1 uses only factors 5, 6, and 7', () => {
  const factors = game.getLevelFactors(1);
  assert.deepStrictEqual(factors, [5, 6, 7]);
});

test('level 2 adds factor 8', () => {
  const factors = game.getLevelFactors(2);
  assert.deepStrictEqual(factors, [5, 6, 7, 8]);
});

test('level 4 uses a 10 second limit while earlier levels use 15 seconds', () => {
  assert.strictEqual(game.getTimeLimit(1), 15);
  assert.strictEqual(game.getTimeLimit(3), 15);
  assert.strictEqual(game.getTimeLimit(4), 10);
  assert.strictEqual(game.getTimeLimit(8), 10);
});

test('round question count is the next higher ten from factor count squared', () => {
  assert.strictEqual(game.getRoundQuestionCount([5, 6, 7]), 10);
  assert.strictEqual(game.getRoundQuestionCount([5, 6, 7, 8]), 20);
  assert.strictEqual(game.getRoundQuestionCount([4, 5, 6, 7, 8]), 30);
  assert.strictEqual(game.getRoundQuestionCount([3, 4, 5, 6, 7, 8]), 40);
});

test('round score applies base score, accuracy bonus, and level multiplier', () => {
  assert.strictEqual(game.calculateRoundScore(8, 10, 1), 550);
  assert.strictEqual(game.calculateRoundScore(18, 20, 2), 2700);
  assert.strictEqual(game.calculateRoundScore(20, 20, 4), 5600);
});

test('round score breakdown shows bonuses and never returns negative earned points', () => {
  assert.deepStrictEqual(game.calculateRoundScoreBreakdown(7, 10, 1), {
    correctPoints: 700,
    wrongPoints: -450,
    baseTotal: 250,
    bonusName: '',
    bonusPoints: 0,
    afterAccuracyBonus: 250,
    levelMultiplier: 1.1,
    levelBonusPoints: 25,
    earnedPoints: 275
  });

  assert.deepStrictEqual(game.calculateRoundScoreBreakdown(18, 20, 2), {
    correctPoints: 1800,
    wrongPoints: -300,
    baseTotal: 1500,
    bonusName: 'BONUS',
    bonusPoints: 750,
    afterAccuracyBonus: 2250,
    levelMultiplier: 1.2,
    levelBonusPoints: 450,
    earnedPoints: 2700
  });

  assert.strictEqual(game.calculateRoundScoreBreakdown(0, 10, 1).earnedPoints, 0);
});

test('round outcome advances and awards stars by percentage', () => {
  assert.deepStrictEqual(game.getRoundOutcome(15, 20, 3), { passed: false, nextLevel: 3, stars: 0 });
  assert.deepStrictEqual(game.getRoundOutcome(16, 20, 3), { passed: true, nextLevel: 4, stars: 1 });
  assert.deepStrictEqual(game.getRoundOutcome(18, 20, 3), { passed: true, nextLevel: 4, stars: 2 });
  assert.deepStrictEqual(game.getRoundOutcome(20, 20, 3), { passed: true, nextLevel: 4, stars: 3 });
});

test('result button says LEVEL UP only after passing the level', () => {
  assert.strictEqual(game.getResultButtonText({ passed: true }), 'LEVEL UP');
  assert.strictEqual(game.getResultButtonText({ passed: false }), 'Zkusit znovu');
});

test('generated question has a dotted expression and exactly one correct option', () => {
  const question = game.createQuestion(1, () => 0);
  assert.strictEqual(question.expression, '5 · 5');
  assert.strictEqual(question.correctAnswer, 25);
  assert.strictEqual(question.options.length, 3);
  assert.strictEqual(new Set(question.options).size, 3);
  assert.strictEqual(question.options.filter((option) => option === question.correctAnswer).length, 1);
});

test('generated round does not repeat the same ordered multiplication twice in a row', () => {
  const round = game.createRound(1, () => 0);
  assert.strictEqual(round.length, 10);

  for (let index = 1; index < round.length; index += 1) {
    assert.notStrictEqual(round[index].expression, round[index - 1].expression);
  }
});

test('generated round length follows the current level factor count', () => {
  assert.strictEqual(game.createRound(1, () => 0).length, 10);
  assert.strictEqual(game.createRound(2, () => 0).length, 20);
});
