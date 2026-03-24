const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const categories = ["SAILING TRIP 1 DAY", "SAILING TRIP PHINISI", "PRIVATE DARAT", "TRIP KHUSUS"];
const shipTypes = ["Standart Boat", "Superior Phinisi", "Deluxe Phinisi", "Luxury Phinisi"];
const shipsDay = ["Explore Together", "Wave Rider", "Sea Zaydan", "Makara", "Lamain Cruise", "Kimochi Voyages", "Elissa Speedboat", "East Cruise", "Lacoco", "Elrora", "Redwhale"];
const shipsPhinisi = ["Senada", "Umami", "Lamborajo 1", "Pesona Bajo", "Soe Besar Vanrei", "Semesta Voyages", "Dinara 1", "NK Jaya 2"];

const seed = async () => {
    console.log('Seeding PostgreSQL master data...');

    for (const name of categories) {
        const exists = await pool.query("SELECT 1 FROM master_categories WHERE name = $1", [name]);
        if (exists.rowCount === 0) await pool.query("INSERT INTO master_categories (name) VALUES ($1)", [name]);
    }
    console.log('✓ Categories done');

    for (const name of shipTypes) {
        const exists = await pool.query("SELECT 1 FROM master_ship_types WHERE name = $1", [name]);
        if (exists.rowCount === 0) await pool.query("INSERT INTO master_ship_types (name) VALUES ($1)", [name]);
    }
    console.log('✓ Ship types done');

    for (const name of shipsDay) {
        const exists = await pool.query("SELECT 1 FROM master_ships WHERE name = $1", [name]);
        if (exists.rowCount === 0) await pool.query("INSERT INTO master_ships (name, category_name) VALUES ($1, 'SAILING TRIP 1 DAY')", [name]);
    }
    for (const name of shipsPhinisi) {
        const exists = await pool.query("SELECT 1 FROM master_ships WHERE name = $1", [name]);
        if (exists.rowCount === 0) await pool.query("INSERT INTO master_ships (name, category_name) VALUES ($1, 'SAILING TRIP PHINISI')", [name]);
    }
    console.log('✓ Ships done (', shipsDay.length + shipsPhinisi.length, 'total ships)');

    console.log('\nSeed completed!');
    await pool.end();
};

seed().catch(async e => { console.error('Seed error:', e.message); await pool.end(); process.exit(1); });
