var express = require('express');
//var usersRouter = require('./user/users');
var lineRouter = require('./line/bot.route');
var logger = require('./../config/winston')

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) => {
      logger.info('health check')
      res.send('OK')
    }
);

// mount user routes at /users
//router.use('/users', usersRouter);

// mount auth routes at /auth
//router.use('/auth', authRoutes);

// mount bot routes at /bot
router.use('/bot', lineRouter);


module.exports = router;
