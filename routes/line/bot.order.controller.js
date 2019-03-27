var logger = require('./../../config/winston')(__filename)
const APIError = require('./../helpers/APIError');
const httpStatus = require('http-status');
var _ = require('lodash');

var {middleware ,handlePreErr ,line_replyMessage ,line_pushMessage} = require('./../helpers/line.handler')
//Persitence File
const fileHandler = require('./../helpers/FileHandler')
var {formatJSON , formatJSONWrap ,printText ,isUndefined ,isNull} = require('./../helpers/text.handler')
//DB cache
var mongoose = require('mongoose');
const Order = require('./bot.order.model');
const Store = require('./bot.store.model');

//const StringBuilder = require("string-builder");

//Fleax message
var receiptTemplete = require('../../config/flex/receipt')
var head_logo = require('./../../config/flex/receipt/head.logo')
var hero_head = require('./../../config/flex/receipt/hero.store')
var head_spaceline = require('./../../config/flex/receipt/spaceline')

var hero_date = require('./../../config/flex/receipt/hero.date')
var hero_check = require('./../../config/flex/receipt/hero.check')
var hero_mode = require('./../../config/flex/receipt/hero.mode')
var hero_separator = require('./../../config/flex/receipt/hero.separator')

var body_head = require('./../../config/flex/receipt/body.head')
var body_contents = require('./../../config/flex/receipt/body.contents')
var body_item = require('./../../config/flex/receipt/body.item')

var foot_separator = require('./../../config/flex/receipt/hero.separator_extra')
var foot_subtotal = require('./../../config/flex/receipt/foot.subtotal')
var foot_payment = require('./../../config/flex/receipt/foot.payments')


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

    /*
    logger.info('format param mode :'+obj)
    var sb = new StringBuilder();
    sb.append("         "+obj.site+"            ");
    sb.appendLine();
    sb.append("Server:                  "+"date");
    sb.appendLine();
    sb.append("Check/Order              "+obj.orderNumber);
    sb.appendLine();
    sb.appendLine();
    sb.append("Order Type:  "+obj.mode)
    sb.appendLine();
    sb.appendLine();
    sb.appendLine("*** 1112Delivery ***");
    sb.appendLine();

    sb.appendLine("[items]");
    sb.appendLine();
    */

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

function pushOnLine(site,order){
    findLineGroup(site)
        .then(
            siteObj => {
                if(siteObj.length > 0){
                    //var bb = JSON.parse(bubble);
                    //logger.info(bubble.type);

                    //line_pushMessage('C6d421685d70593dbcce2427fe20cde3f',{ type: 'flex',altText:'1112Delivery', contents: bubble });
                    line_pushMessage(order,siteObj[0].groupId,{ type: 'flex',altText:'1112Delivery', contents: buildReceipt(order) })
                }
            }
        )
        .catch(err => logger.info('Can not push message '+err))
}



function buildReceipt(order) {
    var receiptRoot = JSON.parse(JSON.stringify(receiptTemplete));
    var headtext = JSON.parse(JSON.stringify(hero_head));
    var headdate = JSON.parse(JSON.stringify(hero_date));
    var headcheck = JSON.parse(JSON.stringify(hero_check));
    var headmode = JSON.parse(JSON.stringify(hero_mode));

    //Item setting
    var itemContents = JSON.parse(JSON.stringify(body_contents));
    var items = order.items;
    var receipt_items = [];

    for(var i=0; i<items.length;i++){
        var item = JSON.parse(JSON.stringify(body_item));
        item.contents[0].text = items[i].itemName;
        item.contents[1].text = items[i].amount.toString();
        receipt_items = _.concat(receipt_items,item);
        logger.info(printText('item['+i+']',receipt_items));
    }
    itemContents.contents = receipt_items;

    receiptRoot.body.contents.push(head_logo);
    headtext.text = order.orderFrom
    receiptRoot.body.contents.push(headtext);
    receiptRoot.body.contents.push(head_spaceline);
    headdate.contents[1].text = formatDate(Date.now());
    receiptRoot.body.contents.push(headdate);
    headcheck.contents[1].text = order.orderNumber;
    receiptRoot.body.contents.push(headcheck);
    headmode.contents[1].text = order.mode;
    receiptRoot.body.contents.push(headmode);
    receiptRoot.body.contents.push(hero_separator);
    receiptRoot.body.contents.push(body_head);
    receiptRoot.body.contents.push(itemContents);
    receiptRoot.body.contents.push(foot_separator);
    foot_subtotal.contents[1].text = order.subtotal;
    receiptRoot.body.contents.push(foot_subtotal);
    foot_payment.contents[1].text = order.payment;
    receiptRoot.body.contents.push(foot_payment);
    logger.info(printText('receipt out',receiptRoot));
    return receiptRoot;
}

function getValue(jsonObject,key){
    if(!isUndefined(jsonObject.key)){
        return jsonObject.key;
    }else{
        return 'undefined';
    }

}

function mapToOrder(jsonrequest,brand){
    var orderform = '';
    var orderId = '';
    var Note = !isUndefined(jsonrequest.Note)?jsonrequest.Note:'undefined';
    if(!isUndefined(Note)){
        orderform = Note.substring(Note.indexOf('(')+1,Note.indexOf(')'));
        logger.info(printText('order from :'+orderform,null));

        var word = 'TPC Order:';
        orderId = Note.substring(Note.indexOf(word)+word.length).trim();
        logger.info(printText('order='+orderId.trim(),null))
    }else{
        orderform = '1112delivery';
    }

    var mode = ''; var StoreName ='';var StoreNumber = '';
    var dob  = ''; var items = []; var subtotal =''; var payment ='';
    if(jsonrequest.hasOwnProperty('SDM')){
        dob = !isUndefined(jsonrequest.SDM.DateOfTrans)?jsonrequest.SDM.DateOfTrans:'undefined'; //"DateOfTrans": "0001-01-01T00:00:00",
        var dqlist = _.filter(jsonrequest.SDM.Entries,function(item){
            return _.startsWith(item.Name,brand+'-');
        })
        for(var i=0; i< dqlist.length;i++){
            var itemno = dqlist[i].ItemID;
            var itemname = dqlist[i].Name;
            var itemprice = dqlist[i].Price;
            items.push({
                itemNumber: itemno,
                itemName: itemname,
                amount: itemprice
            })
            //logger.info(printText(itemname+'   '+itemprice ,null));
        }
        mode = jsonrequest.SDM.OrderName.substring(0,jsonrequest.SDM.OrderName.indexOf(' - '));
        StoreName = jsonrequest.SDM.StoreName;
        StoreNumber = jsonrequest.SDM.StoreNumber.substring(jsonrequest.SDM.StoreNumber.length-4);
        subtotal = jsonrequest.SDM.GrossTotal;
        payment = !isNull(jsonrequest.SDM.Payments)?jsonrequest.SDM.Payments:'none';

    }

    const order = new Order({
        mode: mode,
        brand: brand, //'DQ'
        site: brand+StoreNumber,
        orderFrom: orderform,
        orderNumber: orderId,
        userName: jsonrequest.DriverName,
        //mobileNumber: '',
        storeCode: StoreNumber,
        transactionTime: dob,
        items: items,
        subtotal: subtotal,
        payment: payment,
        status: ''
    });

    //to do create each item model
    return order;
}
/**
 * Order push to store
 * @param req
 * @param res
 * @param next
 */
function ordering(req, res, next) {
    //logger.info(printText('request inbound',req.body));
    var jsonrequest = req.body;
    var brand = req.params.brand.toUpperCase();
    if(jsonrequest.hasOwnProperty('SDM')) {
        var order = mapToOrder(jsonrequest, brand);
        //logger.info(printText('map order',order));
        order.save()
            .then(savedOrder => {
                fileHandler.orderOutputFile(savedOrder, order.site + '.' + formatDate(Date.now()));
                pushOnLine(order.site, savedOrder);

                //res.json(savedOrder)
                res.json({
                    code: httpStatus.OK,
                    message: httpStatus[httpStatus.OK],
                    stack:{}
                })
            })
            //.then() // push message to line group store
            .catch(e => next(e));
    }else{
        const err = new APIError('Invalid data', httpStatus.BAD_REQUEST ,true);
        next(err);
    }
}

function findOrder(req, res, next) {
    var brand = req.params.brand.toUpperCase();
    var orderId = req.params.order.toLowerCase();
    Order.getOrderId(orderId,brand)
        .then(order =>{
            res.json(order)
        })
        .catch(e => next(e));
}

module.exports = { ordering ,findOrder};