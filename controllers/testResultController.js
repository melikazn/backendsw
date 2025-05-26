//Importera databaskoppling och språkverktyg
const pool = require("../config/db");
const { getMessage } = require("../helpers/languageHelper");
// Funktion för att omvandla CEFR-nivåer till en ordnad lista
function getLevelOrder() {
  return ["A1", "A2", "B1", "B2", "C1"];
}

function getNextLevel(currentLevel) {
  const order = getLevelOrder();
  const index = order.indexOf(currentLevel);
  return index >= 0 && index < order.length - 1 ? order[index + 1] : null;
}
// Initiera ett test 
exports.startTestTimer = async (req, res) => {
  const { testId } = req.params;
  const lang = req.user.language || 'sv';

  try {
    // Kontrollera att testet har minst en fråga
    const [[questionCountRow]] = await pool.query(
      `SELECT COUNT(*) AS count FROM questions WHERE test_id = ?`,
      [testId]
    );

    // Om inga frågor finns, skicka fel
    if (questionCountRow.count === 0) {
      return res.status(400).json({ message: "Det finns inga frågor till detta test." });
    }

    // Bekräfta att testet kan startas
    return res.status(200).json({
      message: getMessage("testStarted", lang),
    });

  } catch (error) {
    console.error("Fel vid start av test:", error);
    res.status(500).json({
      message: getMessage("errorStartingTest", lang),
      error: error.message
    });
  }
};
// Skicka in test och räkna resultat
exports.submitTest = async (req, res) => {
  const { testId } = req.params;
  const { answers, startedAt } = req.body;
  const lang = req.user.language || 'sv';
  const userId = req.user.id;
// Kontrollera att inkomna svar är en array
  if (!Array.isArray(answers)) {
    return res.status(400).json({ message: getMessage("answersMustBeArray", lang) });
  }

  try {
     // Hämta antal frågor för det angivna testet
    const [[questionCountRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM questions WHERE test_id = ?`,
      [testId]
    );
    const totalQuestionsFromDb = questionCountRow.total;
    // Säkerställ att användaren har svarat på exakt alla frågor  
    if (answers.length !== totalQuestionsFromDb) {
      return res.status(400).json({ message: getMessage("allQuestionsMustBeAnswered", lang) });
    }
    // Beräkna hur lång tid användaren tog på sig
    const startTime = startedAt ? new Date(startedAt) : new Date();
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);
    const durationFormatted = `${Math.floor(durationSeconds / 60)} minuter och ${durationSeconds % 60} sekunder`;

    let correctCount = 0;
    const feedback = [];
    // Rätta varje fråga genom att jämföra användarens svar mot databasen
    for (const answer of answers) {
      const [[question]] = await pool.query(
        `SELECT q.id AS question_id, q.question_text, q.description, a.is_correct
         FROM questions q
         JOIN answers a ON a.question_id = q.id
         WHERE q.id = ? AND a.id = ?`,
        [answer.questionId, answer.answerId]
      );

      if (!question) continue;

      const isCorrect = !!question.is_correct;
      if (isCorrect) correctCount++;
    // Bygg feedback för varje fråga
      feedback.push({
        questionId: question.question_id,
        question: question.question_text,
        description: question.description || null,
        isCorrect,
        userAnswerId: answer.answerId
      });
    }
    // Räkna ut om testet är godkänt (minst 70% rätt)
    const requiredCorrect = Math.ceil(totalQuestionsFromDb * 0.7);
    const passed = correctCount >= requiredCorrect;
    // Spara testresultatet i databasen
    await pool.query(
      `INSERT INTO results (
        user_id, test_id, correct_answers, total_questions, passed,
        submitted_at, duration_seconds, duration_formatted, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, NOW())`,
      [userId, testId, correctCount, totalQuestionsFromDb, passed, durationSeconds, durationFormatted]
    );

    // Uppdatera nivå om användaren klarat alla tester för aktuell och tidigare nivåer
    if (passed) {
      const [[testInfo]] = await pool.query(
        `SELECT s.level FROM tests t JOIN sections s ON t.section_id = s.id WHERE t.id = ?`,
        [testId]
      );
      
      const level = testInfo.level;
      const levelOrder = getLevelOrder();
      const currentLevelIndex = levelOrder.indexOf(level);

      if (currentLevelIndex >= 0) {
        // Alla nivåer som krävs: aktuell + alla tidigare
        const requiredLevels = levelOrder.slice(0, currentLevelIndex + 1);
        // Hämta alla test-id:n från dessa nivåer
        const [allTests] = await pool.query(
          `SELECT t.id FROM tests t
           JOIN sections s ON t.section_id = s.id
           WHERE s.level IN (?)`,
          [requiredLevels]
        );

        const allTestIds = allTests.map(t => t.id);
        // Hämta vilka av dessa tester användaren har klarat
        const [userPassedTests] = await pool.query(
          `SELECT test_id FROM results
           WHERE user_id = ? AND passed = true AND test_id IN (?)`,
          [userId, allTestIds]
        );
        // Om användaren klarat alla tester från aktuella + tidigare nivåer, uppgradera
        if (userPassedTests.length === allTestIds.length) {
          const nextLevel = getNextLevel(level);
          if (nextLevel) {
            await pool.query("UPDATE users SET level = ? WHERE id = ?", [nextLevel, userId]);
          }
        }
      }
    }
    // Skicka tillbaka resultatet till frontend
    res.status(200).json({
      message: passed ? getMessage("testPassed", lang) : getMessage("testFailed", lang),
      correctAnswers: correctCount,
      totalQuestions: totalQuestionsFromDb,
      requiredCorrect,
      passed,
      duration: durationFormatted,
      feedback
    });
  } catch (error) {
    console.error("❌ Fel vid rättning:", error);
    res.status(500).json({ message: getMessage("errorSubmittingTest", lang), error: error.message });
  }
};

//  Hämta senaste testresultat per test 
exports.getTestResultsForUser = async (req, res) => {
  const userId = req.user.id;
  const lang = req.user.language || 'sv';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const passedFilter = req.query.passed;
  const offset = (page - 1) * limit;

  try {
    const passedCondition = passedFilter === "true" ? true : passedFilter === "false" ? false : null;

    // Hämta senaste resultat för varje test användaren gjort
    const [allResults] = await pool.query(
      `SELECT r1.test_id, t.title AS test_title, r1.correct_answers, r1.total_questions,
              r1.passed, r1.created_at, r1.duration_formatted
       FROM results r1
       JOIN (
         SELECT test_id, MAX(created_at) AS latest
         FROM results
         WHERE user_id = ?
         GROUP BY test_id
       ) r2 ON r1.test_id = r2.test_id AND r1.created_at = r2.latest
       JOIN tests t ON r1.test_id = t.id
       WHERE r1.user_id = ?
       ${passedFilter !== undefined ? 'AND r1.passed = ?' : ''}
       ORDER BY r1.created_at DESC`,
      passedFilter !== undefined ? [userId, userId, passedCondition] : [userId, userId]
    );

    // Räkna total antal resultat och beräkna sidor
    const total = allResults.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = allResults.slice(offset, offset + limit);

    res.status(200).json({
      page,
      totalPages,
      limit,
      results: paginated
    });
  } catch (error) {
    console.error("❌ Fel vid hämtning av testresultat:", error);
    res.status(500).json({ message: getMessage("errorFetchingResults", lang), error: error.message });
  }
};
