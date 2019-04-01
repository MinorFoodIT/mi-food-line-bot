var express = require('express');
//var usersRouter = require('./user/users');
var lineRouter = require('./line/bot.route');
var logger = require('./../config/winston')(__filename)

var router = express.Router();

/* GET home page. */
/*
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
*/

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) => {
      logger.info('health check')
      res.send('OK')
    }
);

// mount bot routes at /bot
router.use('/v1/bot', lineRouter);

module.exports = router;
