const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const repoRoot = path.resolve(__dirname, "..", "..");
const srcRoot = path.join(repoRoot, "app-source", "src");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "accredicore",
});

function collectFrontendContracts(rootDir) {
  const tables = new Set();
  const functions = new Set();

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!/\.(ts|tsx)$/.test(entry.name)) {
        continue;
      }

      const source = fs.readFileSync(fullPath, "utf8");
      for (const match of source.matchAll(/\.from\('([^']+)'\s*(?:as\s+any)?\)/g)) {
        tables.add(match[1]);
      }
      for (const match of source.matchAll(/\.rpc\('([^']+)'\)/g)) {
        functions.add(match[1]);
      }
    }
  }

  walk(rootDir);
  return {
    tables: [...tables].sort(),
    functions: [...functions].sort(),
  };
}

async function loadLocalObjects() {
  const [tableResult, functionResult] = await Promise.all([
    pool.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `),
    pool.query(`
      select routine_name
      from information_schema.routines
      where specific_schema = 'public'
      order by routine_name
    `),
  ]);

  return {
    tables: tableResult.rows.map((row) => row.table_name),
    functions: functionResult.rows.map((row) => row.routine_name),
  };
}

async function main() {
  const frontendContracts = collectFrontendContracts(srcRoot);
  const localObjects = await loadLocalObjects();

  const localTables = new Set(localObjects.tables);
  const localFunctions = new Set(localObjects.functions);

  const missingTables = frontendContracts.tables.filter(
    (tableName) => !localTables.has(tableName)
  );
  const missingFunctions = frontendContracts.functions.filter(
    (functionName) => !localFunctions.has(functionName)
  );

  const report = {
    database: process.env.DB_NAME || "accredicore",
    host: process.env.DB_HOST || "localhost",
    frontendContracts,
    localObjects,
    missing: {
      tables: missingTables,
      functions: missingFunctions,
    },
    ready: missingTables.length === 0 && missingFunctions.length === 0,
  };

  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ready ? 0 : 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
