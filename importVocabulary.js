// Importerar nödvändiga moduler
const fs = require("fs");
const path = require("path");

// Databaskoppling
const pool = require("./config/db");

// Huvudfunktion för att importera alla JSON-filer 
async function importAllFiles(folderPath) {
  // Läs in alla filer i mappen som slutar med .json
  const files = fs.readdirSync(folderPath).filter(file => file.endsWith(".json"));

  // Tillåtna nivåer
  const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];

  // Loopar igenom varje JSON-fil
  for (const file of files) {
    // Läser innehållet i filen och omvandlar JSON till JavaScript-objekt
    const data = fs.readFileSync(path.join(folderPath, file), "utf-8");
    const words = JSON.parse(data);

    // Loopar igenom varje ord i filen
    for (const word of words) {
      // Plockar ut fälten från ordobjektet
      const {
        word: term,
        First_Letter,
        word_class,
        article,
        forms,
        meaning,
        synonyms,
        translation,
        example,
        level
      } = word;

      // Rensar och validerar nivå
      const cleanedLevel = (level || "").trim().toUpperCase();

      // Hoppa över ord med ogiltig nivå
      if (!validLevels.includes(cleanedLevel)) {
        console.warn(`⛔️ Skippat ord "${term}" (${file}) – ogiltig nivå: "${level}"`);
        continue;
      }

      try {
        // Infoga ordet i databasen
        await pool.query(`
          INSERT INTO vocabulary
          (word, first_letter, word_class, article, forms, meaning, synonyms, translation, example, level)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          term,
          First_Letter.toUpperCase(),
          word_class,
          article,
          JSON.stringify(forms),
          meaning,
          JSON.stringify(synonyms),
          translation,
          example,
          cleanedLevel
        ]);
      } catch (err) {
        console.error(`❌ Misslyckades att lägga till: ${term} (${file})`, err.message);
      }
    }

    // Loggar att filen importerades klart
    console.log(`✅ Importerat fil: ${file}`);
  }

  console.log("🚀 Alla filer är importerade!");
}

// Ange sökvägen till mappen där JSON-filerna ligger
const folderPath = path.join(__dirname, "vocab_json"); 

// Kör importen och avsluta programmet när det är klart
importAllFiles(folderPath)
  .then(() => process.exit())
  .catch(console.error);
