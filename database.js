const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Goblue2026",
    database: "LV"
})

module.exports = connection;