const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Migrating statuses to unified format...');

const bookings = db.prepare('SELECT id, status, lead_status FROM bookings').all();

const migrate = db.transaction((bookings) => {
    for (const b of bookings) {
        let newStatus = 'Booking';

        // Check lead_status first (pipeline)
        if (b.lead_status === 'DEAL') newStatus = 'Closing';
        if (b.lead_status === 'CANCEL' || b.lead_status === 'REFUND') newStatus = 'Cancel';
        if (b.lead_status === 'BELUM TRIP') newStatus = 'Belum Trip';
        if (b.lead_status === 'SUDAH TRIP') newStatus = 'Sudah Trip';

        // Then check trip status (more specific for trip phase)
        if (b.status === 'SEDANG TRIP') newStatus = 'Sedang Trip';
        if (b.status === 'SUDAH TRIP') newStatus = 'Sudah Trip';
        if (b.status === 'CANCEL/RESCHEDULE') newStatus = 'Cancel';

        db.prepare('UPDATE bookings SET status = ?, lead_status = ? WHERE id = ?').run(newStatus, newStatus, b.id);
    }
});

migrate(bookings);
console.log('Migration complete.');
db.close();
