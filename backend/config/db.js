const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool (Updated for Aiven Cloud)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 28303,
    ssl: {
        rejectUnauthorized: false // SSL required for cloud-hosted MySQL
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db.promise();