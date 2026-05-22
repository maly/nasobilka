# PRD: Multiplication Practice Game

> Czech summary: Samostatna mobilni stranka pro osmilete dite, ktera formou hry procvicuje nasobilku po 10 prikladech v levelu.

## Overview

This feature is a standalone touch-first web page for practicing multiplication as a game. The player answers a level-sized set of multiplication questions, advances to the next level after at least 80% correct answers, and earns score with stars and short positive animations.

The first version must be simple, fully Czech, usable on a mobile phone, and independent from any backend or existing application framework.

## User story

As an 8-year-old player, I want to practice multiplication by tapping one of three possible answers so that I can improve while feeling like I am progressing through a game.

## Entry points

| Trigger | Location | Details |
|---------|----------|---------|
| Open page | Standalone `index.html` | The game starts from a static web page that can be opened directly in a browser. |
| Start round | Main game screen | The player taps a Czech start/continue button to begin a 10-question level round. |
| Choose answer | Question screen | The player taps one of three large answer buttons. |

## Inputs

| Parameter | Type | Format | Required | Default | Validation |
|-----------|------|--------|----------|---------|------------|
| Stored level | Number | Positive integer in `localStorage` | No | `1` | If missing, invalid, or below 1, use level 1. |
| Answer choice | Number | One of the three visible answer values | Yes during active question | None | Only taps on visible answer buttons count. Further taps after answering are ignored. |
| Question timeout | Timer | Seconds per question | Yes | 15 seconds for levels 1-3; 10 seconds for level 4 | Timeout counts unanswered questions as wrong. |

## Expected behavior

### Happy path

1. The player opens the standalone page.
2. The page reads the saved level from `localStorage`; if none exists, level 1 starts.
3. The top area shows the current level in Czech, for example `Level 1`.
4. The player starts a round for the current level.
5. Each round question count is derived from the number of factors in the level: use the nearest higher multiple of 10 from `factor count * factor count`.
6. Each question is shown as the main full-screen focus, optimized for mobile.
7. The multiplication expression is displayed large at the top, using a centered multiplication dot instead of a baseline period, for example `7 · 5`.
8. Three large touch targets appear below the expression.
9. Exactly one answer is correct.
10. Wrong answers should look plausible, especially by using nearby multiplication facts such as `7 · 6` or `6 · 5`.
11. A non-numeric striped progress bar shows the remaining time for the current question.
12. If the player taps the correct answer before time runs out:
    - The answer is counted as correct.
    - A quick Czech success animation appears, for example `Spravne!`.
    - The game advances to the next question.
13. If the player taps a wrong answer or time expires:
    - The answer is counted as wrong.
    - A quick Czech failure state appears, for example `Spatne`.
    - The correct answer is shown.
    - The game advances to the next question after a short pause.
14. After all questions in the round, the level result screen appears with:
    - `Level dokoncen`
    - Correct count, for example `16 z 20 spravne`
    - A score breakdown with correct-answer points, wrong-answer penalty, subtotal, accuracy bonus when applicable, level bonus, and final earned points
    - Star result
15. If the player got at least 80% correct answers:
    - The result screen's continue button says `LEVEL UP`.
    - The saved level increases by 1.
    - The next round starts at the new level when the player continues.
16. If the player got fewer than 80% correct answers:
    - The player remains on the same level.
    - The next attempt generates a fresh 10-question round.

### Level rules

| Level | Multiplication factors | Difficulty behavior | Time limit |
|-------|------------------------|---------------------|------------|
| 1 | 5, 6, 7 | Random combinations and random factor order, for example `5 · 7` and `7 · 5` | 15 seconds |
| 2 | 5, 6, 7, 8 | Random combinations and random factor order | 15 seconds |
| 3 | Same factor range as level 2 | More confusing wrong answers, favoring nearby multiplication facts | 15 seconds |
| 4 | Same factor range as level 3 | Same confusing answer behavior | 10 seconds |
| 5+ | Not specified in v1 | Keep playable by reusing level 4 behavior until future design defines more levels | 10 seconds |

Round size:
- 3 factors: 10 questions
- 4 factors: 20 questions
- 5 factors: 30 questions
- 6 factors: 40 questions
- General rule: nearest higher multiple of 10 from `N * N`, where `N` is the number of factors.

### Scoring

Score is calculated at the end of each level round.

Base score:
- Correct answer: `+100`
- Wrong answer or timeout: `-150`

Accuracy bonus:
- 90% or more correct answers, but not perfect: multiply round score by `1.5`
- 100% correct answers: multiply round score by `2`
- Below 90% correct answers: no accuracy bonus

Level bonus:
- Multiply the result by `N`, where `N = 1 + (level number / 10)`
- Example: level 1 uses `x1.1`, level 2 uses `x1.2`

Final score handling:
- Wrong answers are shown as a red penalty line.
- Earned points for a completed level cannot be negative; clamp the final earned score to 0.
- Display score values as whole numbers.
- Persist total score in `localStorage`.
- Add each completed round's final score to the total score.

Result score display:
- Show correct answers as a green line, for example `7 spravne ..... 700`.
- Show wrong answers as a red line, for example `3 spatne ..... - 450`.
- Show base subtotal, for example `Celkem ..... 250`.
- Below that, show `BONUS` or `SUPER BONUS` when an accuracy bonus applies.
- Below that, show `LEVEL BONUS`.
- End with `CELKEM BODU`.

### Stars and gamification

The first version should include lightweight gamification without extra systems:

- Display total score prominently.
- Show stars on the level result screen:
  - 3 stars for 100% correct answers
  - 2 stars for at least 90% correct answers
  - 1 star for at least 80% correct answers
  - 0 stars for fewer than 80% correct answers
- Show a cheerful visual animation for correct answers.
- Show a larger celebratory animation on level completion.
- Show a stronger `LEVEL UP` celebration when the player advances.
- Keep all labels and messages in Czech.

### Error handling

| Error condition | User feedback | Recovery |
|----------------|---------------|----------|
| Missing saved level | No error shown | Start at level 1. |
| Invalid saved level | No error shown | Replace with level 1 on next save. |
| Missing saved score | No error shown | Start score at 0. |
| Invalid saved score | No error shown | Replace with score 0 on next save. |
| Question timeout | Show `Spatne` and the correct answer | Continue to the next question after a short pause. |
| Repeated tap after answering | No additional feedback | Ignore the tap until the next question appears. |

## Integration points

This repository currently contains project instruction files only. The feature should introduce a minimal standalone static implementation:

- `index.html` for structure
- A CSS file or inline style block for the mobile-first visual presentation
- A JavaScript file or inline script for deterministic game state, question generation, timers, scoring, persistence, and animations
- Browser `localStorage` for persisting current level and total score

No backend, build tool, server, package manager, account system, or external API is required for v1.

## Scope boundary

This feature does NOT:

- Add sounds or music.
- Add a reset-progress button.
- Add user accounts, profiles, or cloud sync.
- Add parent dashboards or analytics.
- Add configurable level definitions beyond the simple v1 rules above.
- Add keyboard-first controls; touch interaction is the primary target.
- Require a framework or build pipeline.

## Suggestions (accepted)

- Forgotten essential: Persist current level and total score in `localStorage`.
- Forgotten essential: Ignore late/repeated taps after a question has already been answered.
- Creative addition: Use stars as the simple achievement layer for each completed level.
- Creative addition: Use cheerful answer and level-up animations without audio.

## Acceptance criteria

- [ ] Opening the standalone page shows the saved current level, or level 1 when no saved level exists.
- [ ] A level round contains the nearest higher multiple of 10 from `factor count * factor count`.
- [ ] Each question displays a large multiplication expression using a centered multiplication dot, not `x`, `*`, or a baseline period.
- [ ] Each question displays exactly three answer choices with exactly one correct answer.
- [ ] Answer choices are large enough for comfortable mobile touch input.
- [ ] The timer is shown as a striped visual bar, not as numeric countdown text.
- [ ] A correct tap before timeout counts as correct and shows a quick `Spravne!` animation.
- [ ] A wrong tap counts as wrong, shows `Spatne`, and displays the correct answer.
- [ ] A timeout counts as wrong, shows `Spatne`, and displays the correct answer.
- [ ] After the full round, the result screen shows correct answers out of the actual question count.
- [ ] Getting at least 80% correct answers advances the saved level by 1 and changes the result button text to `LEVEL UP`.
- [ ] Getting fewer than 80% correct answers keeps the player on the same level.
- [ ] Level 1 only uses factors 5, 6, and 7, in varied combinations and order.
- [ ] Level 2 adds factor 8.
- [ ] Level 3 uses more confusing wrong answers based on nearby multiplication facts.
- [ ] Level 4 uses a 10-second time limit.
- [ ] Level 5 and higher remain playable by reusing level 4 behavior.
- [ ] End-of-round score follows the requested formula: `(+100 per correct -150 per wrong)`, then accuracy bonus, then level multiplier.
- [ ] At least 90% correct answers applies a `+50%` score bonus.
- [ ] 100% correct answers applies a `+100%` score bonus.
- [ ] The result screen shows correct points in green, wrong-answer penalty in red, subtotal, bonus, level bonus, and final points.
- [ ] Final earned points for a level are never negative.
- [ ] Total score persists across page reloads.
- [ ] All visible text is in Czech.
- [ ] The first version works without audio.

## Technical notes

- Keep the implementation small and static because the current repository has no application scaffold.
- Prefer plain HTML, CSS, and JavaScript unless a later implementation task explicitly introduces a framework.
- Use deterministic plain code for scoring, routing between screens, timers, and persistence.
- Question generation should avoid duplicate answer values within the same question.
- Question generation should avoid showing the same ordered multiplication expression twice in a row; reversed order is allowed.
- For confusing wrong answers, generate candidate products from nearby facts first, then fall back to numerically nearby values if needed.
- Use short transition durations so gameplay stays fast for a child on mobile.
