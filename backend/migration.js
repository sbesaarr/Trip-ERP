const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Running migrations...");

db.serialize(() => {
    // Ignore errors if columns already exist
    const alters = [
        "ALTER TABLE bookings ADD COLUMN closing_by TEXT",
        "ALTER TABLE bookings ADD COLUMN guest_type TEXT",
        "ALTER TABLE bookings ADD COLUMN service_type TEXT",
        "ALTER TABLE bookings ADD COLUMN ship_name TEXT",
        "ALTER TABLE bookings ADD COLUMN operator_name TEXT"
    ];

    alters.forEach(q => {
        db.run(q, (err) => {
            if (err) {
                if (!err.message.includes("duplicate column name")) {
                    console.error("Migration warning:", err.message);
                }
            } else {
                console.log("Applied:", q);
            }
        });
    });

    db.run(`CREATE TABLE IF NOT EXISTS operator_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER,
        payment_date TEXT NOT NULL,
        amount REAL NOT NULL,
        proof_url TEXT,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )`, () => {
        console.log("operator_payments table verified.");
        db.close();
    });
});
