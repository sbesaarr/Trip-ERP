const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);
const users = db.prepare('SELECT id, username, password, role FROM users').all();
console.log(JSON.stringify(users, null, 2));
db.close();
