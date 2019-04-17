var mysql      = require('mysql');
var logger = require('./config/winston')(__filename)
/*
var connection = mysql.createConnection({
    host     : 'localhost',
    port     : '3306',
    user     : 'admin',
    password : 'minor@1234',
    database : 'food_api'
});
connection.connect(function(err){
    if(err){ throw  err}
    logger.info('[mysql] Connected Success!');
});

connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
    if (error) throw error;
    logger.info('[mysql] The solution is: ', results[0].solution);
});

connection.end();

*/

var pool = mysql.createPool({
    connectionLimit : 10,
    host     : '172.17.0.1',
    port     : '3306',
    user     : 'admin',
    password : 'minor@1234',
    database : 'food_api'
});

var getConnection = function(callback) {
    pool.getConnection(function(err, connection) {
        callback(err, connection);
    });
};

module.exports = getConnection;