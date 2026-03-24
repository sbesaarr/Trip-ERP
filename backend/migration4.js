const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Running Migration 4: Adding photo_url to users...');

db.serialize(() => {
    db.run("ALTER TABLE users ADD COLUMN photo_url TEXT", function(err) {
        if (err && !err.message.includes("duplicate column")) {
            console.error("Migration Failed:", err);
        } else {
            console.log("Migration 4 Success: Added photo_url to users table!");
        }
    });
});

setTimeout(() => db.close(), 1000);
