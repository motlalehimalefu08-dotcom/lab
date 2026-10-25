
const mysql = require("mysql2/promise");
const fs = require("fs");
require("dotenv").config();

let ca;

if (process.env.DB_SSL_CA) {
    ca = process.env.DB_SSL_CA;
} else if (process.env.DB_SSL_CA_PATH) {
    ca = fs.readFileSync(process.env.DB_SSL_CA_PATH, "utf8");
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: ca ? { ca } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;








