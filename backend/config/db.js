const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool (better for performance)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

module.exports = db.promise(); // Use promises for cleaner code