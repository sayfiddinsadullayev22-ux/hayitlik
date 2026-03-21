import Database from 'better-sqlite3';

let db;

export async function getDb() {
  if (!db) {
    db = new Database('bot_database.db');
    
    // Create users table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        username TEXT,
        full_name TEXT,
        referal_code TEXT UNIQUE,
        referer_id INTEGER,
        referal_count INTEGER DEFAULT 0,
        is_verified INTEGER DEFAULT 0,
        joined_date DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Create referrals table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        referer_id INTEGER,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (referer_id) REFERENCES users(user_id)
      )
    `).run();
  }
  return db;
}
