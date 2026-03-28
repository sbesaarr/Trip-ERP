const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('database.sqlite');

const tables = [
  'Bookings', 'Guests', 'Products', 'Payments', 'Refunds', 
  'ExtraServices', 'OperatorPayments', 'Users', 'Ships', 
  'Sales', 'Categories', 'ShipTypes'
];

// Mapping Sheet Name to SQLite Table Name (Internal)
const mapping = {
  'Bookings': 'bookings',
  'Guests': 'guests',
  'Products': 'products',
  'Payments': 'booking_payments',
  'Refunds': 'refunds',
  'ExtraServices': 'booking_services',
  'OperatorPayments': 'operator_payments',
  'Users': 'users',
  'Ships': 'master_ships',
  'Sales': 'master_sales',
  'Categories': 'master_categories',
  'ShipTypes': 'master_ship_types'
};

const exportData = {};

tables.forEach(sheetName => {
  const tableName = mapping[sheetName];
  try {
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    exportData[sheetName] = rows;
    console.log(`Exported ${rows.length} rows from ${tableName} -> ${sheetName}`);
  } catch (e) {
    console.error(`Skipping ${tableName}: ${e.message}`);
  }
});

fs.writeFileSync('migration_payload.json', JSON.stringify(exportData, null, 2));
console.log('\nSUCCESS! Data terpanggil dan disimpan di migration_payload.json');
console.log('Silakan copy isi file tersebut untuk diimport ke Google Apps Script.');
db.close();
