const fs = require("fs");
const path = require("path");
const pool = require("./db"); // importerar din databasanslutning

const sqlPath = path.join(__dirname, "swedish.sql");

(async () => {
  try {
    const sql = fs.readFileSync(sqlPath, "utf8");

    await pool.query(sql);
    console.log("✅ SQL-importen är klar!");
  } catch (error) {
    console.error("❌ Fel vid import:", error.message);
  } finally {
    pool.end(); // stänger anslutningen
  }
})();
