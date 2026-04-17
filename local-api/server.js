require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "accredicore",
});

app.get("/api/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, now: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/profiles", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, email, full_name, created_at, updated_at
      FROM public.profiles
      ORDER BY created_at DESC
      LIMIT 50
    `);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/tasks", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, description, assigned_to, assigned_by, team_id,
             status, priority, due_date, completed_at, created_at, updated_at
      FROM public.tasks
      ORDER BY created_at DESC
      LIMIT 50
    `);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const {
      title,
      description = null,
      assigned_to = null,
      assigned_by,
      team_id = null,
      status = "pending",
      priority = "medium"
    } = req.body || {};

    if (!title || !assigned_by) {
      return res.status(400).json({
        ok: false,
        error: "title and assigned_by are required"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO public.tasks (
        id, title, description, assigned_to, assigned_by, team_id, status, priority
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7
      )
      RETURNING id, title, description, assigned_to, assigned_by, team_id,
                status, priority, due_date, completed_at, created_at, updated_at
      `,
      [title, description, assigned_to, assigned_by, team_id, status, priority]
    );

    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/routes", (_req, res) => {
  try {
    const router = app._router || app.router;
    const stack = (router && router.stack) ? router.stack : [];
    const routes = [];

    for (const layer of stack) {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods || {})
          .filter(Boolean)
          .map(m => m.toUpperCase());
        routes.push({ path: layer.route.path, methods });
      }
    }

    res.json({ ok: true, data: routes });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Local API running on http://localhost:${port}`);
});



