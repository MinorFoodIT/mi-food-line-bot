var tag = require('./config/tag')
var logger = require('./config/winston')(__filename)
var redis = require('redis');
const redisUrl = 'redis://127.0.0.1:6379';
var client = redis.createClient({
    url: redisUrl,
    retry_strategy: function (options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with
            // a individual error
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands
            // with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
    }
});
const util = require('util');
client.get = util.promisify(client.get);
client.keys = util.promisify(client.keys);

client.on('connect', function() {
    logger.info(tag.redis+'client connected');
});
client.on('error', function(err){
    logger.info(tag.redis+'client error '+err);
});

module.exports = client