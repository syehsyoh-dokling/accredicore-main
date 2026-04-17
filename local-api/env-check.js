require("dotenv").config();
console.log("DB_PASSWORD raw =", JSON.stringify(process.env.DB_PASSWORD));
console.log("DB_PASSWORD length =", (process.env.DB_PASSWORD || "").length);
