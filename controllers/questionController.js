// Importerar databas och språkhantering
const pool = require("../config/db");
const { getMessage } = require("../helpers/languageHelper");

// Skapa en ny fråga kopplad till ett test
exports.createQuestion = async (req, res) => {
  const { testId } = req.params;
  const { question_text, description } = req.body;
  const lang = req.user.language || 'sv';

  // Kontrollera att frågetext finns
  if (!question_text) {
    return res.status(400).json({ message: getMessage("questionTextRequired", lang) });
  }

  try {
    // Lägg till frågan i databasen med eventuell beskrivning
    const [result] = await pool.query(
      "INSERT INTO questions (test_id, question_text, description) VALUES (?, ?, ?)",
      [testId, question_text, description || null]
    );

    // Returnera ny fråga med ID
    const insertedId = result.insertId;
    res.status(201).json({
      message: getMessage("questionAdded", lang),
      id: insertedId
    });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};

//Skapa ett svar till en fråga
exports.createAnswer = async (req, res) => {
  const { questionId } = req.params;
  const { answer_text, is_correct } = req.body;
  const lang = req.user.language || 'sv';

  // Kontrollera att svarstext finns
  if (!answer_text) {
    return res.status(400).json({ message: getMessage("answerTextRequired", lang) });
  }

  try {
    // Lägg till svaret i databasen och konvertera is_correct till boolean
    await pool.query(
      "INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?)",
      [questionId, answer_text, is_correct === true]
    );
    res.status(201).json({ message: getMessage("answerAdded", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};

// Hämta alla frågor och svar till ett test 
exports.getQuestionsForTest = async (req, res) => {
  const { testId } = req.params;
  const lang = req.user.language || 'sv';

  try {
    const [questions] = await pool.query(
      "SELECT * FROM questions WHERE test_id = ?",
      [testId]
    );

    // Hämta svar till varje fråga och koppla dem
    for (const question of questions) {
      const [answers] = await pool.query(
        "SELECT id, answer_text, is_correct FROM answers WHERE question_id = ?",
        [question.id]
      );
      question.answers = answers;
    }

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: getMessage("errorFetching", lang), error: error.message });
  }
};

// Hämta en enskild fråga med tillhörande svar
exports.getQuestionById = async (req, res) => {
  const { questionId } = req.params;
  const lang = req.user.language || 'sv';

  try {
    const [rows] = await pool.query("SELECT * FROM questions WHERE id = ?", [questionId]);
    if (rows.length === 0) return res.status(404).json({ message: getMessage("questionNotFound", lang) });

    const [answers] = await pool.query(
      "SELECT id, answer_text FROM answers WHERE question_id = ?",
      [questionId]
    );

    const question = rows[0];
    question.answers = answers;

    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ message: getMessage("errorFetching", lang), error: error.message });
  }
};

// Uppdatera frågetext
exports.updateQuestion = async (req, res) => {
  const { questionId } = req.params;
  const { question_text } = req.body;
  const lang = req.user.language || 'sv';

  if (!question_text) {
    return res.status(400).json({ message: getMessage("questionTextRequired", lang) });
  }

  try {
    await pool.query("UPDATE questions SET question_text = ? WHERE id = ?", [question_text, questionId]);
    res.status(200).json({ message: getMessage("questionUpdated", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};

// Ta bort en fråga och dess svar
exports.deleteQuestion = async (req, res) => {
  const { questionId } = req.params;
  const lang = req.user.language || 'sv';

  try {
    await pool.query("DELETE FROM answers WHERE question_id = ?", [questionId]);
    await pool.query("DELETE FROM questions WHERE id = ?", [questionId]);
    res.status(200).json({ message: getMessage("questionDeleted", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};

// Uppdatera ett befintligt svar
exports.updateAnswer = async (req, res) => {
  const { id } = req.params;
  const { answer_text, is_correct } = req.body;
  const lang = req.user.language || 'sv';

  try {
    await pool.query(
      "UPDATE answers SET answer_text = ?, is_correct = ? WHERE id = ?",
      [answer_text, is_correct === true || is_correct === 1, id]
    );
    res.status(200).json({ message: getMessage("answerUpdated", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};

