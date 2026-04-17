require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "accredicore",
});

(async () => {
  try {
    const r = await pool.query("SELECT current_database(), current_user, NOW()");
    console.log("DB CONNECT OK");
    console.log(r.rows);
  } catch (e) {
    console.error("DB CONNECT FAIL");
    console.error(e.message);
  } finally {
    await pool.end();
  }
})();
