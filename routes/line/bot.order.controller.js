const Order = require('./bot.order.model');
var config = require('../../config/config');
const fileHandler = require('./../helpers/FileHandler')
var mongoose = require('mongoose');
const Store = require('./bot.store.model');

const Client = require('@line/bot-sdk').Client;
const client = new Client(config);

//json query
var jp = require('jsonpath');

//const axios = require('axios');
//axios.defaults.baseURL = 'https://api.line.me/v2/bot/message/push';
//axios.defaults.headers.common['Authorization'] = 'Bearer '+config.channelAccessToken;
//axios.defaults.headers.post['Content-Type'] = 'application/json';

/**
 * Load user and append to req.
 */
/*
function load(req, res, next, id) {
    User.get(id)
        .then((user) => {
            req.user = user; // eslint-disable-line no-param-reassign
            return next();
        })
        .catch(e => next(e));
}
*/

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function formatMessage(obj) {
    console.info('format param mode :'+obj)
    var msg = 'Alert: '+ obj.mode+' channel ,order no '+obj.orderNumber +' mobile '+ obj.mobileNumber+ ' ,time '+obj.transactionTime+' is incomming.'
    return msg;
}

function findLineGroup(site){
    return new Promise(
        (resolve ,reject) => {
            //var Store = mongoose.model('Store', StoreSchema);
            Store.find({ 'site': site }, 'groupId', function (err, siteObj) {
                //if (err) return handleError(err);
                if(err) reject(err)
                resolve(siteObj)
                // 'siteObj' contains the list of athletes that match the criteria.
            })
        }
    );

}

function pushOnLine(site,msg){
    findLineGroup(site)
        .then(
            siteObj => {
                if(siteObj.length > 0){
                    client
                        .pushMessage(siteObj[0].groupId, { type: 'text', text: msg })
                        .catch((err) => {
                            if (err instanceof HTTPError) {
                                console.error(err.statusCode);
                            }
                        });
                }
            }
        )
        .catch(err => console.info('Can not push message '+err))
}

/**
 * Order push to store
 * @param req
 * @param res
 * @param next
 */
function ordering(req, res, next) {
    console.info('request param mode :'+req.params.mode)
    const order = new Order({
        mode: req.params.mode,
        brand: req.params.brand,
        site: req.params.site,
        orderNumber: req.body.orderNumber,
        userName: req.body.userName,
        mobileNumber: req.body.mobileNumber,
        storeCode: req.body.storeCode,
        transactionTime: req.body.transactionTime
    });

    order.save()
        .then(savedOrder=> {
            fileHandler.orderOutputFile(savedOrder,req.params.site+'.'+formatDate(Date.now()))
            res.json(savedOrder)
        })
        .then(pushOnLine(req.params.site,formatMessage(order))) // push message to line group store
        .catch(e => next(e));
}

module.exports = { ordering };