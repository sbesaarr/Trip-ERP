const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Running migration 3 (Split Categories)...");

db.serialize(() => {
    db.run("ALTER TABLE bookings ADD COLUMN service_category TEXT", (err) => {
        if(err && !err.message.includes('duplicate')) console.log(err.message);
    });

    db.run(`CREATE TABLE IF NOT EXISTS master_categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`);

    // Move the recently added categorizations to the new table
    db.run("INSERT INTO master_categories (name) SELECT name FROM master_services WHERE name IN ('SAILING TRIP 1 DAY', 'SAILING TRIP PHINISI', 'PRIVATE DARAT', 'TRIP KHUSUS')");
    
    // Purge them from the wrong table
    db.run("DELETE FROM master_services WHERE name IN ('SAILING TRIP 1 DAY', 'SAILING TRIP PHINISI', 'PRIVATE DARAT', 'TRIP KHUSUS')", () => {
        console.log("Categories migrated successfully.");
        db.close();
    });
});
