const express   = require('express');
const orderCtrl = require('./bot.order.controller');
const lineCtrl  = require('./bot.line.controller');
var config      = require('./../../config/line.config');

const jsonfile = require('jsonfile')
var path = require('path');

const router = express.Router();

/** absolute url is /api/bot/<route path> */

router.route('/webhook')
    .post(
        lineCtrl.middleware(config),
        lineCtrl.handlePreErr,
        lineCtrl.webhook
        );

router.route('/:mode/:brand/:site')
    /** POST /:brandId/:orderId - Create new order push message */
    .post(orderCtrl.ordering);

module.exports = router;



/** Load user when API with userId route parameter is hit */
//router.param('userId', userCtrl.load);