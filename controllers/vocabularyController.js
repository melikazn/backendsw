// Importera databaskoppling
const pool = require("../config/db");

// Hämta bokstäver baserat på nivå
exports.getLettersByLevel = async (req, res) => {
  const { level } = req.query;
  if (!level) return res.status(400).json({ message: "Level krävs" });

  try {
    // Hämta unika första bokstäver för ord på vald nivå
    const [rows] = await pool.query(
      `SELECT DISTINCT first_letter FROM vocabulary WHERE level = ? ORDER BY first_letter ASC`,
      [level]
    );
    const letters = rows.map(r => r.first_letter);
    res.json(letters);
  } catch (err) {
    res.status(500).json({ message: "Fel vid hämtning av bokstäver", error: err.message });
  }
};

//Hämta ord baserat på nivå och första bokstav 
exports.getWordsByLevelAndLetter = async (req, res) => {
  const { level, letter, page = 1, limit = 20, sort = "word" } = req.query;

  if (!level || !letter) {
    return res.status(400).json({ message: "Både nivå och bokstav krävs" });
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const allowedSort = ["word", "translation", "level"];
  const sortBy = allowedSort.includes(sort) ? sort : "word";

  const userId = req.user?.id || null;

  try {
    // Hämta totalt antal ord för paginering
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM vocabulary
       WHERE level = ? AND first_letter = ? COLLATE utf8mb4_swedish_ci`,
      [level.toUpperCase(), letter]
    );

    // Hämta ord och kontrollera favoriter
    const [words] = await pool.query(
      `SELECT v.id, v.word, v.translation, v.meaning, v.level,
              CASE WHEN f.word_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_favorite
       FROM vocabulary v
       LEFT JOIN favorite_words f
         ON v.id = f.word_id AND f.user_id ${userId ? "= ?" : "IS NULL"}
       WHERE v.level = ? AND v.first_letter = ? COLLATE utf8mb4_swedish_ci
       ORDER BY ${sortBy} ASC
       LIMIT ? OFFSET ?`,
      userId
        ? [userId, level.toUpperCase(), letter, parseInt(limit), offset]
        : [level.toUpperCase(), letter, parseInt(limit), offset]
    );

    res.status(200).json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      words,
    });
  } catch (err) {
    res.status(500).json({ message: "Fel vid hämtning av ord", error: err.message });
  }
};

//Lägg till ett nytt ord 
exports.addWord = async (req, res) => {
  // Destrukturera data från body
  const {
    word,
    first_letter,
    word_class,
    article,
    forms,
    meaning,
    synonyms,
    translation,
    example,
    level
  } = req.body;

  // Kontrollera om användaren valt att tvinga in duplicerat ord
  const forceInsert = req.query.force === "true";

  // Kontrollera att alla obligatoriska fält är ifyllda
  if (!word || !word_class || !meaning || !translation || !example || !level) {
    return res.status(400).json({ message: "Obligatoriska fält saknas." });
  }

  try {
    // Kontrollera om ordet redan finns i databasen
    const [existing] = await pool.query("SELECT * FROM vocabulary WHERE word = ?", [word]);

    // Om ordet finns och användaren inte valt att ignorera dubbletter, returnera 409
    if (existing.length > 0 && !forceInsert) {
      return res.status(409).json({
        message: "⚠️ Ordet finns redan. Vill du ändå lägga till det?",
        existing
      });
    }

    // Om first_letter inte skickats: använd första bokstaven i ordet
    const computedFirstLetter = first_letter || word.charAt(0);

    // Spara ordet i databasen
    await pool.query(
      `INSERT INTO vocabulary
        (word, first_letter, word_class, article, forms, meaning, synonyms, translation, example, level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        word,
        computedFirstLetter.toUpperCase(),
        word_class,
        article,
        JSON.stringify(forms || []),
        meaning,
        JSON.stringify(synonyms || []),
        translation,
        example,
        level.toUpperCase()
      ]
    );

    // Returnera bekräftelse
    res.status(201).json({ message: "Ordet har lagts till" });
  } catch (err) {
    console.error("❌ Fel vid tillägg av ord:", err);
    res.status(500).json({ message: "Fel vid tillägg av ord", error: err.message });
  }
};

// Uppdatera ett befintligt ord
exports.updateWord = async (req, res) => {
  const { id } = req.params;
  const {
    word, word_class, article, forms,
    meaning, synonyms, translation, example, level
  } = req.body;

  try {
     // extrahera första bokstaven
    const first_letter = word.charAt(0).toUpperCase();

    await pool.query(
      `UPDATE vocabulary SET
        word = ?, first_letter = ?, word_class = ?, article = ?, forms = ?,
        meaning = ?, synonyms = ?, translation = ?, example = ?, level = ?
       WHERE id = ?`,
      [
        word,
        first_letter,
        word_class,
        article,
        JSON.stringify(forms || []),
        meaning,
        JSON.stringify(synonyms || []),
        translation,
        example,
        level.toUpperCase(),
        id
      ]
    );

    res.status(200).json({ message: "Ordet uppdaterades" });
  } catch (err) {
    res.status(500).json({ message: "Fel vid uppdatering av ord", error: err.message });
  }
};

//Radera ett ord 
exports.deleteWord = async (req, res) => {
  const { id } = req.params;

  try {
    // Radera ordet fr[n databasen 
    await pool.query("DELETE FROM vocabulary WHERE id = ?", [id]);
    res.status(200).json({ message: "Ordet har tagits bort" });
  } catch (err) {
    res.status(500).json({ message: "Fel vid borttagning", error: err.message });
  }
};

//  Sök efter ord eller översättning
exports.searchVocabulary = async (req, res) => {
    const { query } = req.query;
    // Om ingen sökterm skickas, avvisa med 400
    if (!query) {
      return res.status(400).json({ message: "Sökterm krävs" });
    }
  
    try {
      const likeQuery = `%${query}%`;
  
      const [results] = await pool.query(`
        SELECT id, word, translation, meaning, word_class, level
        FROM vocabulary
        WHERE word LIKE ?
           OR translation LIKE ?
           OR meaning LIKE ?
           OR word_class LIKE ?
      `, [likeQuery, likeQuery, likeQuery, likeQuery]);
  
      res.status(200).json(results);
    } catch (err) {
      res.status(500).json({ message: "Fel vid sökning", error: err.message });
    }
  };

// Generera ett quiz baserat på slumpmässiga ord på en viss nivå och bokstav
exports.getVocabularyQuiz = async (req, res) => {
  const { level, letter } = req.query;

  // Kontrollera att nivå och bokstav skickas
  if (!level || !letter) {
    return res.status(400).json({ message: "Både nivå och bokstav krävs" });
  }

  try {
    // Hämta 5 slumpmässiga ord från databasen för det angivna nivån och bokstaven
    const [words] = await pool.query(
      `SELECT id, word, translation FROM vocabulary
       WHERE level = ? AND first_letter = ?
       ORDER BY RAND()
       LIMIT 5`,
      [level.toUpperCase(), letter.toUpperCase()]
    );

    // Kontrollera att det finns minst 5 ord
    if (words.length < 5) {
      return res.status(400).json({ message: "Inte tillräckligt många ord för quiz" });
    }

    const quiz = [];

    // För varje ord, hämta tre felaktiga översättningar som alternativ
    for (const word of words) {
      const [wrong] = await pool.query(
        `SELECT translation FROM vocabulary
         WHERE id != ? AND translation IS NOT NULL AND translation != ''
         ORDER BY RAND()
         LIMIT 3`,
        [word.id]
      );

      const allOptions = [word.translation, ...wrong.map(w => w.translation)];

      // Blanda alternativen slumpmässigt
      const shuffled = allOptions
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(obj => obj.value);

      // Skapa quiz-fråga med blandade alternativ
      quiz.push({
        word: word.word,
        wordId: word.id,
        options: shuffled,
      });
    }

    res.status(200).json(quiz);
  } catch (err) {
    res.status(500).json({ message: "Fel vid hämtning av quiz", error: err.message });
  }
};

// Hämta alla quizresultat för en användare
exports.getVocabularyQuizResults = async (req, res) => {
  const userId = req.user.id;
  const lang = req.user.language || 'sv';

  try {
    const [results] = await pool.query(
      `SELECT level, letter, total_questions, correct_answers, duration_seconds, created_at
       FROM vocabulary_quiz_results
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: "Fel vid hämtning av quizresultat", error: err.message });
  }
};

// Hämta bästa resultat per nivå 
exports.getBestVocabularyResultsPerLevel = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await pool.query(
      `SELECT level, MAX(correct_answers) AS best_score
       FROM vocabulary_quiz_results
       WHERE user_id = ?
       GROUP BY level`,
      [userId]
    );

    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: "Fel vid hämtning av bästa resultat", error: err.message });
  }
};


//Hmta utvecklingshistorik för användarens vokabulärquiz per nivå
exports.getVocabularyProgressByLevel = async (req, res) => {
  const userId = req.user.id;
  const { level } = req.query;

  // Säkerställ att nivå är angiven
  if (!level) {
    return res.status(400).json({ message: "Nivå (level) krävs" });
  }

  try {
    // Hämta quizresultat för användaren på angiven nivå sorterat på tid
    const [history] = await pool.query(
      `SELECT letter, correct_answers, total_questions, duration_seconds, created_at
       FROM vocabulary_quiz_results
       WHERE user_id = ? AND level = ?
       ORDER BY created_at DESC`,
      [userId, level.toUpperCase()]
    );

    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ message: "Fel vid hämtning av utvecklingshistorik", error: err.message });
  }
};

//Spara quizresultat och returnera feedback
exports.submitVocabularyQuiz = async (req, res) => {
  const { level, letter, questions, duration_seconds } = req.body;
  const userId = req.user.id;
  const lang = req.user.language || 'sv';

  // Validera att alla fält finns och är korrekta
  if (!level || !letter || !Array.isArray(questions) || questions.length === 0) {
    console.error("❌ Ogiltiga data skickades:", req.body);
    return res.status(400).json({ message: "Ogiltiga data" });
  }

  let correct = 0; 
  const incorrectWords = [];

  try {
    // Rätta varje fråga
    for (const q of questions) {
      const [rows] = await pool.query(
        "SELECT id, word, translation FROM vocabulary WHERE id = ?",
        [q.wordId]
      );

      if (rows.length > 0) {
        const correctTranslation = rows[0].translation;
        if (q.userAnswer === correctTranslation) {
          correct++;
        } else {
          // Spara info om felaktigt svar för feedback
          incorrectWords.push({
            wordId: rows[0].id,
            word: rows[0].word,
            translation: correctTranslation
          });
        }
      }
    }

    // Spara resultatet i databasen
    await pool.query(
      `INSERT INTO vocabulary_quiz_results
       (user_id, level, letter, total_questions, correct_answers, duration_seconds)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        level.toUpperCase(),
        letter.toUpperCase(),
        questions.length,
        correct,
        duration_seconds
      ]
    );

    // Skicka tillbaka resultat och felaktiga ord
    res.status(200).json({  
      message: `Du fick ${correct} av ${questions.length} rätt.`,
      correct,
      total: questions.length,
      incorrectWords
    });
  } catch (err) {
    console.error("❌ Fel vid sparande av resultat:", err);
    res.status(500).json({ message: "Fel vid sparande av resultat", error: err.message });
  }
};

// Hämta ett specifikt ords fulla information
exports.getWordById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query("SELECT * FROM vocabulary WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Ordet hittades inte" });
    }

    const word = rows[0];
    // Parsar JSON-strängar till objekt eller lista igen
    word.forms = JSON.parse(word.forms || "[]");
    word.synonyms = JSON.parse(word.synonyms || "[]");

    res.status(200).json(word);
  } catch (err) {
    res.status(500).json({ message: "Fel vid hämtning av ordet", error: err.message });
  }
};

// Hämta 100 slumpmässiga ord för quiz från angiven nivå
exports.getFullVocabularyQuizByLevel = async (req, res) => {
  const { level } = req.query;
  const userId = req.user.id;

  if (!level) {
    return res.status(400).json({ message: "Level krävs" });
  }

  try {
    const [words] = await pool.query(
      `SELECT id, word, translation
       FROM vocabulary
       WHERE level = ?
       ORDER BY RAND()
       LIMIT 100`,
      [level.toUpperCase()]
    );

    if (words.length === 0) {
      return res.status(404).json({ message: "Inga ord hittades för denna nivå" });
    }

    const quiz = [];

    // Hämta felaktiga alternativ för varje ord och blanda dem
    for (const word of words) {
      const [wrong] = await pool.query(
        `SELECT translation FROM vocabulary
         WHERE id != ? AND translation IS NOT NULL AND translation != ''
         ORDER BY RAND()
         LIMIT 3`,
        [word.id]
      );

      const allOptions = [word.translation, ...wrong.map(w => w.translation)];

      const shuffled = allOptions
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(obj => obj.value);

      quiz.push({
        wordId: word.id,
        word: word.word,
        options: shuffled,
      });
    }

    res.status(200).json({ questions: quiz });
  } catch (err) {
    res.status(500).json({ message: "Fel vid hämtning av quiz", error: err.message });
  }
};