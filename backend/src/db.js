const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "database.sqlite");

function initDb() {
  const db = new sqlite3.Database(DB_PATH);

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS tarefas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE,
        custo REAL NOT NULL CHECK (custo >= 0),
        data_limite TEXT NOT NULL,
        ordem INTEGER NOT NULL UNIQUE
      );
    `);
  });

  return db;
}

const db = initDb();

module.exports = db;

