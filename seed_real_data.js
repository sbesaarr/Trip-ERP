const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "backend/database.sqlite");
const db = new sqlite3.Database(dbPath);

const products = [
    { name: "Open Trip Waerebo 2D1N", type: "Open Trip", price: 1850000, cost_price: 1500000 },
    { name: "Open Trip Nuca Molas 2D1N", type: "Open Trip", price: 2000000, cost_price: 1700000 },
    { name: "Overland Flores 5D4N", type: "Open Trip", price: 8500000, cost_price: 7500000 },
    { name: "Open Trip Kelimutu Fullday", type: "Open Trip", price: 1250000, cost_price: 945000 },
    
    { name: "Sailing Phinisi Superior - ZAHRA JAYA 02", type: "Sailing Trip", price: 5000000, cost_price: 4500000 },
    { name: "Sailing Phinisi Deluxe - SENADA", type: "Sailing Trip", price: 7000000, cost_price: 6000000 },
    { name: "Sailing 1 Day Speedboat - EXPLORE TOGETHER", type: "Sailing Trip", price: 1350000, cost_price: 900000 },

    { name: "Private Trip Waerebo 2D1N (Base Price)", type: "Private Trip", price: 5600000, cost_price: 4500000 },
    { name: "Private Trip Nuca Molas 2D1N (Base Price)", type: "Private Trip", price: 6000000, cost_price: 5000000 },
    { name: "Private Trip City Tour 1 Day", type: "Private Trip", price: 1500000, cost_price: 1200000 },

    { name: "Layanan Tambahan - Sewa Dokumentasi Drone", type: "Layanan Tambahan", price: 1500000, cost_price: 1000000 },
    { name: "Layanan Tambahan - Airport Transfer", type: "Layanan Tambahan", price: 250000, cost_price: 150000 },
    { name: "Layanan Tambahan - Hotel & Akomodasi", type: "Layanan Tambahan", price: 750000, cost_price: 600000 },
    { name: "Layanan Tambahan - Extra Meals / BBQ", type: "Layanan Tambahan", price: 350000, cost_price: 250000 }
];

db.serialize(() => {
    db.run("DELETE FROM bookings");
    db.run("DELETE FROM products");
    db.run("DELETE FROM sqlite_sequence WHERE name=\"products\" OR name=\"bookings\"");

    const stmt = db.prepare("INSERT INTO products (name, type, price, cost_price) VALUES (?, ?, ?, ?)");
    products.forEach(p => {
        stmt.run(p.name, p.type, p.price, p.cost_price);
    });
    stmt.finalize(() => {
        console.log("Successfully seeded real data into SQLite!");
        db.close();
    });
});

