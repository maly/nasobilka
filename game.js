(function (root) {
  const storageKeys = {
    level: 'nasobilka.level',
    score: 'nasobilka.score'
  };

  function getLevelFactors(level) {
    const tables = {
      1: [2],
      2: [3],
      3: [4],
      4: [5],
      5: [6],
      6: [7],
      7: [8],
      8: [9],
      9: [2, 3],
      10: [4, 5],
      11: [6, 7],
      12: [8, 9],
      13: [2, 3, 4],
      14: [5, 6, 7],
      15: [7, 8, 9],
      16: [3, 4, 5, 6],
      17: [6, 7, 8, 9]
    };

    if (level >= 18) {
      return [2, 3, 4, 5, 6, 7, 8, 9];
    }

    return tables[level] || [2, 3, 4, 5, 6, 7, 8, 9];
  }

  function getTimeLimit(level) {
    // Slow time until level 18 (all numbers combined)
    return level >= 18 ? 10 : 30;
  }

  function getRoundQuestionCount(factors) {
    return 20;
  }

  function calculateRoundScore(correctCount, questionCount, level) {
    return calculateRoundScoreBreakdown(correctCount, questionCount, level).earnedPoints;
  }

  function calculateRoundScoreBreakdown(correctCount, questionCount, level) {
    const wrongCount = questionCount - correctCount;
    const correctPoints = correctCount * 100;
    const wrongPoints = wrongCount * -150;
    const baseTotal = correctPoints + wrongPoints;
    const ratio = questionCount > 0 ? correctCount / questionCount : 0;
    const bonusMultiplier = ratio === 1 ? 2 : ratio >= 0.9 ? 1.5 : 1;
    const afterAccuracyBonus = Math.round(baseTotal * bonusMultiplier);
    const levelMultiplier = 1 + (level / 10);
    const levelTotal = Math.round(afterAccuracyBonus * levelMultiplier);

    return {
      correctPoints,
      wrongPoints,
      baseTotal,
      bonusName: ratio === 1 ? 'SUPER BONUS' : ratio >= 0.9 ? 'BONUS' : '',
      bonusPoints: afterAccuracyBonus - baseTotal,
      afterAccuracyBonus,
      levelMultiplier,
      levelBonusPoints: levelTotal - afterAccuracyBonus,
      earnedPoints: Math.max(0, levelTotal)
    };
  }

  function getRoundOutcome(correctCount, questionCount, level) {
    const ratio = questionCount > 0 ? correctCount / questionCount : 0;

    return {
      passed: ratio >= 0.8,
      nextLevel: ratio >= 0.8 ? level + 1 : level,
      stars: ratio === 1 ? 3 : ratio >= 0.9 ? 2 : ratio >= 0.8 ? 1 : 0
    };
  }

  function getResultButtonText(outcome) {
    return outcome.passed ? 'LEVEL UP' : 'Zkusit znovu';
  }

  function pick(items, random) {
    return items[Math.floor(random() * items.length)];
  }

  function shuffle(items, random) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      const value = copy[index];
      copy[index] = copy[swapIndex];
      copy[swapIndex] = value;
    }
    return copy;
  }

  function createWrongAnswers(a, b, level, correctAnswer, random) {
    const answers = [];
    const nearbyFacts = level >= 3
      ? [[a, b + 1], [a + 1, b], [Math.max(1, a - 1), b], [a, Math.max(1, b - 1)], [b, a + 1]]
      : [[a, b + 1], [Math.max(1, a - 1), b], [a, Math.max(1, b - 1)], [a + 1, b]];

    nearbyFacts.forEach((fact) => {
      const value = fact[0] * fact[1];
      if (value !== correctAnswer && !answers.includes(value)) {
        answers.push(value);
      }
    });

    let offset = 1;
    while (answers.length < 2) {
      [correctAnswer + offset, correctAnswer - offset].forEach((value) => {
        if (value > 0 && value !== correctAnswer && !answers.includes(value) && answers.length < 2) {
          answers.push(value);
        }
      });
      offset += 1;
    }

    return shuffle(answers, random).slice(0, 2);
  }

  function createQuestion(level, random = Math.random, previousExpression = null) {
    const factors = getLevelFactors(level);
    const multipliers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    let first = pick(factors, random);
    let second = pick(multipliers, random);

    if (random() >= 0.5) {
      const value = first;
      first = second;
      second = value;
    }

    const allCombinations = factors
      .flatMap((f) => multipliers.map((m) => [f, m]))
      .concat(multipliers.flatMap((m) => factors.map((f) => [m, f])));

    if (previousExpression && `${first} · ${second}` === previousExpression) {
      const alternatives = allCombinations.filter(
        (fact) => `${fact[0]} · ${fact[1]}` !== previousExpression
      );
      if (alternatives.length > 0) {
        const replacement = pick(alternatives, random);
        first = replacement[0];
        second = replacement[1];
      }
    }

    const correctAnswer = first * second;
    const wrongAnswers = createWrongAnswers(first, second, level, correctAnswer, random);
    const options = shuffle([correctAnswer].concat(wrongAnswers), random);

    return {
      expression: `${first} · ${second}`,
      correctAnswer,
      options
    };
  }

  function createRound(level, random = Math.random) {
    const questions = [];
    const questionCount = getRoundQuestionCount(getLevelFactors(level));

    while (questions.length < questionCount) {
      const previous = questions.length > 0 ? questions[questions.length - 1].expression : null;
      questions.push(createQuestion(level, random, previous));
    }

    return questions;
  }

  // Přístup k localStorage může sám vyhodit výjimku (SecurityError při zablokovaném úložišti).
  function getStorage() {
    try {
      return root.localStorage || null;
    } catch (error) {
      return null;
    }
  }

  function readStoredNumber(key, fallback) {
    const storage = getStorage();
    if (!storage) {
      return fallback;
    }
    try {
      const raw = storage.getItem(key);
      if (raw === null || raw === undefined) {
        return fallback;
      }
      const value = Number(raw);
      return Number.isFinite(value) && value >= 0 ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function readStoredLevel() {
    const level = Math.floor(readStoredNumber(storageKeys.level, 1));
    if (level < 1 || level > 20) {
      return 1;
    }
    return level;
  }

  function readStoredScore() {
    return Math.round(readStoredNumber(storageKeys.score, 0));
  }

  // Vrací true, pokud se postup uložil; false, pokud je úložiště nedostupné.
  function saveProgress(level, score) {
    const storage = getStorage();
    if (!storage) {
      return false;
    }
    try {
      storage.setItem(storageKeys.level, String(level));
      storage.setItem(storageKeys.score, String(score));
      return true;
    } catch (error) {
      // úložiště nedostupné nebo plné – hra pokračuje bez ukládání
      return false;
    }
  }

  const api = {
    calculateRoundScore,
    calculateRoundScoreBreakdown,
    createQuestion,
    createRound,
    getLevelFactors,
    getRoundQuestionCount,
    getRoundOutcome,
    getResultButtonText,
    getTimeLimit,
    readStoredLevel,
    readStoredScore,
    saveProgress
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.NasobilkaGame = api;
})(typeof window === 'undefined' ? globalThis : window);
