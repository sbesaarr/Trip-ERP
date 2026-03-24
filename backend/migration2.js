const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Running migration 2 (Master Settings)...");

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS master_ships (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`);
    db.run(`CREATE TABLE IF NOT EXISTS master_sales (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`);
    db.run(`CREATE TABLE IF NOT EXISTS master_services (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`, () => {
        
        // Seed some defaults if empty
        db.get("SELECT COUNT(*) as count FROM master_services", (err, row) => {
            if (!err && row.count === 0) {
                const stmt1 = db.prepare("INSERT INTO master_services (name) VALUES (?)");
                ["Open Trip", "Private Trip", "Sailing Komodo", "Speedboat One Day", "City Tour"].forEach(n => stmt1.run(n));
                stmt1.finalize();
                
                const stmt2 = db.prepare("INSERT INTO master_sales (name) VALUES (?)");
                ["Admin Office", "Sales Agent A", "Marketing B"].forEach(n => stmt2.run(n));
                stmt2.finalize();
                
                const stmt3 = db.prepare("INSERT INTO master_ships (name) VALUES (?)");
                ["Phinisi Zahra", "Speedboat Manta", "Kapal Kayu Standard"].forEach(n => stmt3.run(n));
                stmt3.finalize();
            }
            console.log("Master settings tables seeded and verified.");
            db.close();
        });
    });
});
