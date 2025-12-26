
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./skillswap.db');

db.serialize(() => {
    console.log("--- USERS WITH LOCATION ---");
    db.each("SELECT id, username, city, country, latitude, longitude FROM users", (err, row) => {
        console.log(`${row.id}: ${row.username} - Loc: ${row.city}, ${row.country} (${row.latitude}, ${row.longitude})`);
    });
});

db.close();
