const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const sqliteDb = new Database(dbPath);

// Enable WAL mode for better concurrency
sqliteDb.pragma('journal_mode = WAL');
sqliteDb.pragma('foreign_keys = ON');

console.log('Connected to SQLite database at:', dbPath);

// Callback-based wrapper so server.js doesn't need to change
const db = {
    all: (sql, params, cb) => {
        if (typeof params === 'function') { cb = params; params = []; }
        try {
            const rows = sqliteDb.prepare(sql).all(params || []);
            if (cb) cb(null, rows);
        } catch (err) {
            if (cb) cb(err, []);
        }
    },
    get: (sql, params, cb) => {
        if (typeof params === 'function') { cb = params; params = []; }
        try {
            const row = sqliteDb.prepare(sql).get(params || []);
            if (cb) cb(null, row || null);
        } catch (err) {
            if (cb) cb(err, null);
        }
    },
    run: (sql, params, cb) => {
        if (typeof params === 'function') { cb = params; params = []; }
        try {
            const stmt = sqliteDb.prepare(sql);
            const info = stmt.run(params || []);
            const context = { lastID: info.lastInsertRowid, changes: info.changes };
            if (cb) cb.call(context, null);
        } catch (err) {
            if (cb) cb.call({ lastID: null, changes: 0 }, err);
        }
    },
    serialize: (cb) => { cb(); },
    prepare: (sql) => {
        const stmt = sqliteDb.prepare(sql);
        return {
            run: (...args) => {
                let cb = null;
                if (args.length > 0 && typeof args[args.length - 1] === 'function') {
                    cb = args.pop();
                }
                try {
                    const info = stmt.run(...args);
                    const context = { lastID: info.lastInsertRowid, changes: info.changes };
                    if (cb) cb.call(context, null);
                } catch (err) {
                    if (cb) cb.call({ lastID: null, changes: 0 }, err);
                }
            },
            finalize: (cb) => { if (cb) cb(); }
        };
    }
};

// Initialize schema
const initDB = () => {
    sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            price REAL NOT NULL,
            cost_price REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS guests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER REFERENCES products(id),
            guest_id INTEGER REFERENCES guests(id),
            trip_date TEXT NOT NULL,
            pax INTEGER NOT NULL,
            total_price REAL NOT NULL,
            down_payment REAL DEFAULT 0,
            status TEXT DEFAULT 'BELUM TRIP',
            lead_status TEXT DEFAULT 'LEADS',
            closing_by TEXT,
            guest_type TEXT,
            service_type TEXT,
            service_category TEXT,
            ship_type TEXT,
            cabin_name TEXT,
            ship_name TEXT,
            operator_name TEXT,
            documentation_url TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS booking_services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id),
            qty INTEGER DEFAULT 1,
            price REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS booking_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
            payment_date TEXT NOT NULL,
            amount REAL NOT NULL,
            proof_url TEXT
        );

        CREATE TABLE IF NOT EXISTS operator_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
            payment_date TEXT NOT NULL,
            amount REAL NOT NULL,
            proof_url TEXT
        );

        CREATE TABLE IF NOT EXISTS master_ships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category_name TEXT
        );

        CREATE TABLE IF NOT EXISTS master_sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS master_services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS master_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS master_ship_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS refunds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
            refund_date TEXT NOT NULL,
            amount REAL NOT NULL,
            note TEXT
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'staff',
            photo_url TEXT
        );
    `);

    // Seed admin user
    const users = sqliteDb.prepare('SELECT id, username, role FROM users WHERE username = ?').all('admin');
    if (users.length === 0) {
        console.log('Seeding master admin user...');
        const headpass = bcrypt.hashSync('admin123', 8);
        sqliteDb.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run('admin', headpass, 'admin');
    } else if (users.length > 1) {
        console.log('Cleaning up duplicate admin users...');
        const toKeep = users.find(u => u.role === 'admin') || users[users.length - 1];
        sqliteDb.prepare("DELETE FROM users WHERE username = ? AND id != ?").run('admin', toKeep.id);
        const headpass = bcrypt.hashSync('admin123', 8);
        sqliteDb.prepare("UPDATE users SET role = 'admin', password = ? WHERE id = ?").run(headpass, toKeep.id);
    }

    // Seed initial products
    const prodCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM products').get();
    if (prodCount.count === 0) {
        console.log('Seeding initial products data...');
        const ins = sqliteDb.prepare("INSERT INTO products (name, type, price, cost_price) VALUES (?, ?, ?, ?)");
        ins.run("Open Trip Darat 3D2N", "Open Trip", 1500000, 1000000);
        ins.run("Sailing 1 Day Komodo", "Sailing Trip", 1200000, 800000);
        ins.run("Private Trip Darat 2D1N", "Private Trip", 2500000, 1800000);
        ins.run("Sewa Spesial Drone", "Layanan Tambahan", 1500000, 1000000);
    }

    // Safe migration for existing DBs
    try { sqliteDb.exec(`ALTER TABLE bookings ADD COLUMN lead_status TEXT DEFAULT 'LEADS'`); } catch(e) {}
    try { sqliteDb.exec(`ALTER TABLE bookings ADD COLUMN documentation_url TEXT`); } catch(e) {}

    console.log('SQLite schema ready.');
};

initDB();

module.exports = db;
