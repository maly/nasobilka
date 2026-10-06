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

test('level 18 switches the limit from 30 to 10 seconds', () => {
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

// Pomocník: podstrčí falešný localStorage (root je v Node globalThis) a po testu ho vrátí zpět.
function withLocalStorage(descriptor, fn) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', Object.assign({ configurable: true }, descriptor));
  try {
    fn();
  } finally {
    if (original) {
      Object.defineProperty(globalThis, 'localStorage', original);
    } else {
      delete globalThis.localStorage;
    }
  }
}

function fakeStorage(initial = {}) {
  const data = Object.assign({}, initial);
  return {
    data,
    getItem: (key) => (Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    }
  };
}

test('storage: throwing localStorage getter falls back to level 1 and score 0', () => {
  withLocalStorage({
    get() {
      const error = new Error('blocked');
      error.name = 'SecurityError';
      throw error;
    }
  }, () => {
    assert.strictEqual(game.readStoredLevel(), 1);
    assert.strictEqual(game.readStoredScore(), 0);
    assert.strictEqual(game.saveProgress(5, 100), false);
  });
});

test('storage: throwing getItem falls back to defaults', () => {
  const storage = fakeStorage();
  storage.getItem = () => {
    throw new Error('boom');
  };
  withLocalStorage({ value: storage }, () => {
    assert.strictEqual(game.readStoredLevel(), 1);
    assert.strictEqual(game.readStoredScore(), 0);
  });
});

test('storage: setItem throwing QuotaExceededError does not throw and returns false', () => {
  const storage = fakeStorage();
  storage.setItem = () => {
    const error = new Error('quota');
    error.name = 'QuotaExceededError';
    throw error;
  };
  withLocalStorage({ value: storage }, () => {
    assert.doesNotThrow(() => game.saveProgress(5, 1200));
    assert.strictEqual(game.saveProgress(5, 1200), false);
  });
});

test('storage: missing localStorage falls back and saveProgress returns false', () => {
  withLocalStorage({ value: undefined }, () => {
    assert.strictEqual(game.readStoredLevel(), 1);
    assert.strictEqual(game.readStoredScore(), 0);
    assert.strictEqual(game.saveProgress(2, 10), false);
  });
});

test('storage: empty storage (null values) gives level 1 and score 0', () => {
  withLocalStorage({ value: fakeStorage() }, () => {
    assert.strictEqual(game.readStoredLevel(), 1);
    assert.strictEqual(game.readStoredScore(), 0);
  });
});

test('storage: invalid or out-of-range values give level 1', () => {
  ['abc', '-5', '0', 'NaN'].forEach((raw) => {
    withLocalStorage({ value: fakeStorage({ 'nasobilka.level': raw }) }, () => {
      assert.strictEqual(game.readStoredLevel(), 1, raw);
    });
  });
});

test('storage: saveProgress and read roundtrip', () => {
  withLocalStorage({ value: fakeStorage() }, () => {
    assert.strictEqual(game.saveProgress(5, 1200), true);
    assert.strictEqual(game.readStoredLevel(), 5);
    assert.strictEqual(game.readStoredScore(), 1200);
  });
});

// Hra nemá strop levelů (nextLevel = level + 1), takže postup nad level 20 se po obnovení stránky nesmí ztratit.
test('storage: level above 20 survives page reload together with score', () => {
  withLocalStorage({ value: fakeStorage() }, () => {
    assert.strictEqual(game.saveProgress(21, 5000), true);
    assert.strictEqual(game.readStoredLevel(), 21);
    assert.strictEqual(game.readStoredScore(), 5000);
  });
});

test('storage: high stored level is loaded unchanged, not reset to 1', () => {
  withLocalStorage({ value: fakeStorage({ 'nasobilka.level': '99' }) }, () => {
    assert.strictEqual(game.readStoredLevel(), 99);
  });
});

test('storage: fractional level rounds down and invalid values still give level 1', () => {
  withLocalStorage({ value: fakeStorage({ 'nasobilka.level': '1.9' }) }, () => {
    assert.strictEqual(game.readStoredLevel(), 1);
  });
  ['0', '-5', 'abc', 'NaN'].forEach((raw) => {
    withLocalStorage({ value: fakeStorage({ 'nasobilka.level': raw }) }, () => {
      assert.strictEqual(game.readStoredLevel(), 1, raw);
    });
  });
});
