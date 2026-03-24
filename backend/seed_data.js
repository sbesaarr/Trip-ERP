const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Seeding Database...");

const categories = ["SAILING TRIP 1 DAY", "SAILING TRIP PHINISI", "PRIVATE DARAT", "TRIP KHUSUS"];
const shipTypes = ["Standart Boat", "Superior Phinisi", "Deluxe Phinisi", "Luxury Phinisi"];

const shipsDay = ["Explore Together", "Wave Rider", "Sea Zaydan", "Makara", "Lamain Cruise", "Kimochi Voyages", "Elissa Speedboat", "East Cruise", "Lacoco", "Elrora", "Redwhale"];
const shipsPhinisi = ["Senada", "Umami", "Lamborajo 1", "Pesona Bajo", "Soe Besar Vanrei", "Semesta Voyages", "Dinara 1", "NK Jaya 2"];

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS master_ship_types (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`);

    // Categories
    categories.forEach(name => {
        db.run("INSERT INTO master_categories (name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM master_categories WHERE name = ?)", [name, name]);
    });
    
    // Ship Types
    shipTypes.forEach(name => {
         db.run("INSERT INTO master_ship_types (name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM master_ship_types WHERE name = ?)", [name, name]);
    });

    // Ships
    shipsDay.forEach(name => {
        db.run("INSERT INTO master_ships (name, category_name) SELECT ?, 'SAILING TRIP 1 DAY' WHERE NOT EXISTS (SELECT 1 FROM master_ships WHERE name = ?)", [name, name]);
    });

    shipsPhinisi.forEach(name => {
        db.run("INSERT INTO master_ships (name, category_name) SELECT ?, 'SAILING TRIP PHINISI' WHERE NOT EXISTS (SELECT 1 FROM master_ships WHERE name = ?)", [name, name]);
    });

    console.log("Seed completed. Data inserted.");
});
