const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Force resetting admin user...');
db.prepare("DELETE FROM users WHERE username = 'admin'").run();
const headpass = bcrypt.hashSync('admin123', 8);
db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run('admin', headpass, 'admin');

const users = db.prepare('SELECT id, username, role FROM users').all();
console.log(JSON.stringify(users, null, 2));
db.close();
