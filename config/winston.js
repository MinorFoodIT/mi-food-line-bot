const winston = require('winston');

var logger = winston.createLogger({
    level: 'info',
    //format: winston.format.json(),
    format: winston.format.combine(
        winston.format(function dynamicContent(info, opts) {
            info.message = '' + info.message;
            return info;
        })(),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: __dirname + '/../log/app.log',
            handleExceptions: true,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            colorize: false,
        }),
        new (winston.transports.Console)({
            json: true,
            colorize: true
        })
    ]
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write: function(message, encoding) {
        // use the 'info' log level so the output will be picked up by both transports (file and console)
        logger.info(message);
    },
};

module.exports = logger;