const express   = require('express');
//const orderCtrl = require('./bot.order.controller');
//var config      = require('./../../config/line.config');
var agendaDB = require('./../../agendaDB.js')
var client = require('./../../redis-client')

const jsonfile = require('jsonfile')
var path = require('path');

const router = express.Router();

router.route('/jobrunning')
    .get(agendaDB.viewJob);

router.route('/redis/store')
    .get(function(req, res, next){
        client.keys('*')
            .then(async (keys) =>{
                //console.log(keys)
                var sites = []
                Promise.all(
                    keys.map(async key =>{
                        await client.get(key)
                        .then( (value) =>{
                            var storeId = JSON.parse(value).storeId
                            if( typeof storeId !== 'undefined' ){
                                 sites.push({key: key, site: storeId})
                            }
                        })
                        .catch((err) =>{})
                    })
                ).then( () => {
                    res.json(sites)
                })
            })
            .catch( err =>{
            })
    });

module.exports = router;