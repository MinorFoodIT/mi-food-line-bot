const express   = require('express');
//const orderCtrl = require('./bot.order.controller');
//var config      = require('./../../config/line.config');
var agendaDB = require('./../../agendaDB.js')

const jsonfile = require('jsonfile')
var path = require('path');

const router = express.Router();

router.route('/jobrunning')
    .get(agendaDB.viewJob);

module.exports = router;