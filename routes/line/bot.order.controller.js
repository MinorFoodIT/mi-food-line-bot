var _ = require('lodash');
var moment = require('moment');
var config = require('./../../config/config')
var tag = require('./../../config/tag')
var logger = require('./../../config/winston')(__filename)
const APIError = require('./../helpers/APIError');
const httpStatus = require('http-status');
var kue = require('./../../kuetask');
var redis = require('redis')
var client = require('./../../redis-client')

var {middleware ,handlePreErr ,line_replyMessage ,line_pushMessage, line_pushMessageFuture} = require('./../helpers/line.handler')
const fileHandler = require('./../helpers/FileHandler')
var {formatJSON , formatJSONWrap ,printText ,isUndefined ,isNull} = require('./../helpers/text.handler')

//DB cache
var mongoose = require('mongoose');
const Order = require('./bot.order.model');
const Store = require('./bot.store.model');
const Future = require('./bot.future.model');

//Fleax message
var receiptTemplete = require('../../config/flex/receipt')
var head_logo = require('./../../config/flex/receipt/head.logo')
var hero_head = require('./../../config/flex/receipt/hero.store')
var head_spaceline = require('./../../config/flex/receipt/spaceline')

var hero_future = require('../../config/flex/receipt/hero.futureorder')
var hero_date = require('./../../config/flex/receipt/hero.date')
var hero_check = require('./../../config/flex/receipt/hero.check')
var hero_mode = require('./../../config/flex/receipt/hero.mode')
var hero_separator = require('./../../config/flex/receipt/hero.separator')

var body_head = require('./../../config/flex/receipt/body.head')
var body_contents = require('./../../config/flex/receipt/body.contents')
var body_item = require('./../../config/flex/receipt/body.item')

var foot_separator = require('./../../config/flex/receipt/hero.separator_extra')
var foot_complete_subtotal = require('../../config/flex/receipt/foot.complete_subtotal')
var foot_discount = require('./../../config/flex/receipt/foot.discount')
var foot_subtotal = require('./../../config/flex/receipt/foot.subtotal')
var foot_vat7 = require('./../../config/flex/receipt/foot.vat7')
var foot_total = require('./../../config/flex/receipt/foot.total')
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

function findLineGroup(site){
    return new Promise(
        async (resolve ,reject) => {
            //Find in regis
            const linegroup = await client.get(site);
            if(linegroup){
                var siteObj = {
                    groupId: linegroup,
                    userId: "",
                    type: "group",
                    storeId: site,
                    storeName: ""
                }
                resolve(siteObj)
            }

            //Find from file cached in memory
            Store.find({ 'site': site }, 'groupId', function (err, siteObj) {
                //if (err) return handleError(err);
                if(err) reject(err)
                resolve(siteObj)
                // 'siteObj' contains the list of athletes that match the criteria.
            })
        }
    );

}

function pushOnLine(site,order,orderType){
    findLineGroup(site)
        .then(
            siteObj => {
                if(siteObj.length > 0){
                    if(orderType == 1)
                        logger.info(tag.push_order+order.orderNumber+ ' to '+site);
                    else
                        logger.info(tag.push_future_order+order.orderNumber+ ' to '+site);

                    line_pushMessage(orderType,order,siteObj[0].groupId,{ type: 'flex',altText:'1112Delivery', contents: buildReceipt(order,orderType) })
                }
            }
        )
        .catch(err => logger.info('Could not push message '+err))
}

function pushOnLineFutureOrder(site,order,orderType){
    findLineGroup(site)
        .then(
            siteObj => {
                if(siteObj.length > 0){
                    if(orderType == 1)
                        logger.info(tag.push_order+order.orderNumber+ ' to '+site);
                    else
                        logger.info(tag.push_future_order+order.orderNumber+ ' to '+site);

                    line_pushMessageFuture(orderType,order,siteObj[0].groupId,{ type: 'flex',altText:'1112Delivery', contents: buildReceipt(order,orderType) })
                }
            }
        )
        .catch(err => logger.info('Could not push message '+err))
}

function iterationCopy(src) {
    let target = {};
    for (let prop in src) {
        if (src.hasOwnProperty(prop)) {
            target[prop] = src[prop];
        }
    }
    return target;
}

function copyDocumentObject(objectToCopy) {
    return JSON.parse(JSON.stringify(objectToCopy))
}



function buildReceipt(order,orderType) {
    var receiptRoot = JSON.parse(JSON.stringify(receiptTemplete));
    var headtext = JSON.parse(JSON.stringify(hero_head));
    var headfuture = JSON.parse(JSON.stringify(hero_future));
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
            //logger.info(printText('item['+i+']',receipt_items));
    }
    itemContents.contents = receipt_items;

    receiptRoot.body.contents.push(head_logo);
    headtext.text = order.orderFrom
    receiptRoot.body.contents.push(headtext);
    receiptRoot.body.contents.push(head_spaceline);
    if(orderType == 1){
            //logger.info('dueDate '+order.dueDate)
        headfuture.contents[1].text = moment(order.dueDate).format('YYYY-MM-DD HH:mm:ss');
        receiptRoot.body.contents.push(headfuture);
    }
    headdate.contents[1].text = formatDate(Date.now());
    receiptRoot.body.contents.push(headdate);
    headcheck.contents[1].text = order.orderNumber;
    receiptRoot.body.contents.push(headcheck);
    headmode.contents[1].text = order.mode;
    receiptRoot.body.contents.push(headmode);
    receiptRoot.body.contents.push(hero_separator);
    receiptRoot.body.contents.push(body_head);
    receiptRoot.body.contents.push(itemContents);

    foot_complete_subtotal.contents[1].text = order.subtotal;
    receiptRoot.body.contents.push(foot_complete_subtotal);
    foot_discount.contents[1].text = new String( -1 * order.discount).toString();
    receiptRoot.body.contents.push(foot_discount);
    receiptRoot.body.contents.push(foot_subtotal);
    receiptRoot.body.contents.push(foot_vat7);
    receiptRoot.body.contents.push(foot_total);

    //foot_payment.contents[1].text = order.payment;
    //receiptRoot.body.contents.push(foot_payment);
        //logger.info(printText('receipt out',receiptRoot));
    return receiptRoot;
}

function getValue(jsonObject,key){
    if(!isUndefined(jsonObject.key)){
        return jsonObject.key;
    }else{
        return 'undefined';
    }

}

/*
function mapToOrder(jsonrequest,brand){
    var orderform = '';
    var orderId = '';
    var Note = !isUndefined(jsonrequest.Note)?jsonrequest.Note:'undefined';
    if(!isUndefined(Note)){
        orderform = Note.substring(Note.indexOf('(')+1,Note.indexOf(')'));
            //logger.info(printText('order from :'+orderform,null));

        var word = 'TPC Order:';
        orderId = Note.substring(Note.indexOf(word)+word.length).trim();
            //logger.info(printText('order='+orderId.trim(),null))
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
*/

function mapToOrder(jsonrequest,brand){
    var orderform = '';
    var orderId = '';
    var Note = !isUndefined(jsonrequest.Note)?jsonrequest.Note:'undefined';
    if(!isUndefined(Note)){
        orderform = Note.substring(Note.indexOf('(')+1,Note.indexOf(')'));
            //logger.info(printText('order from :'+orderform,null));

        var word = 'TPC Order:';
        orderId = Note.substring(Note.indexOf(word)+word.length).trim();
            //logger.info(printText('order='+orderId.trim(),null))
    }else{
        orderform = '1112delivery';
    }

    var orderType = jsonrequest.SDM.OrderType
    var mode = '' , StoreName ='' ,StoreNumber = '';
    var dob  = '', items = [] ,subtotal ='' , payment ='' , dueDate , discount = '';
    if(jsonrequest.hasOwnProperty('SDM')){
        dueDate = jsonrequest.SDM.DueTime;
        discount = jsonrequest.SDM.DiscountTotal;
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

    if(orderType == 1) {
        const future = new Future({
            dueDate: dueDate,
            alert: false,
            mode: mode,
            brand: brand, //'DQ'
            site: brand + StoreNumber,
            orderFrom: orderform,
            orderNumber: orderId,
            userName: jsonrequest.DriverName,
            //mobileNumber: '',
            storeCode: StoreNumber,
            transactionTime: dob,
            items: items,
            subtotal: subtotal,
            payment: payment,
            discount: discount,
            status: ''
        });

        //to do create each item model
        return future;
    }else{
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
            discount: discount,
            status: ''
        });

        //to do create each item model
        return order;
    }
}
/**
 * Order push to store
 * @param req
 * @param res
 * @param next
 */
function ordering(req, res, next) {
    try{
        var jsonrequest = req.body;
        var brand = req.params.brand.toUpperCase();
        if(jsonrequest.hasOwnProperty('SDM')) {
            var orderType = jsonrequest.SDM.OrderType

            var order = mapToOrder(jsonrequest, brand);

            order.save()
                .then(savedOrder => {
                    logger.info(tag.incomming_order+ JSON.stringify(savedOrder));
                        //Deprecated not store history on files ,instead to console
                        //fileHandler.orderOutputFile(savedOrder, order.site + '.' + formatDate(Date.now()));
                    pushOnLine(order.site, savedOrder ,orderType);

                    var job = kue.reqQueue.create('1112Delivery',savedOrder)
                                    .priority('normal').attempts(2)
                                    .removeOnComplete( true )
                                    .save(err =>{
                                        if(err) {
                                            logger.info(tag.reqQueue_1112d_error+ err)
                                        }
                                    })
                    job.log({orderId: savedOrder.orderNumber ,brand: savedOrder.brand })

                    //future order
                    if(orderType == 1){
                            //logger.info(orderType)
                        //Filter futrue
                        var future = mapToOrder(jsonrequest, brand);
                            //logger.info(future.dueDate)
                        var now = moment()
                        var due = moment(future.dueDate)
                        var duration = moment.duration(due.diff(now));
                        var days = duration.asDays();
                        if(days >= 1){
                            var futureDay = mapToOrder(jsonrequest, brand);
                                //logger.info(due.format('YYYY-MM-DD HH:mm:ss'))
                            var morning = moment(due.format('YYYY-MM-DD')+' '+'06:00:00', 'YYYY-MM-DD HH:mm:ss').toDate();
                                //logger.info(morning)
                            futureDay.alertDate = morning
                            futureDay.save()
                                .then(futureSaved => {
                                    //Save alert Morning
                                    var job = kue.reqQueue.create('1112Delivery(future)',futureSaved)
                                        .priority('normal').attempts(2)
                                        .removeOnComplete( true )
                                        .save(err =>{
                                            if(err) {
                                                logger.info(tag.reqQueue_1112dfuture_error+ err)
                                            }

                                            var hours = duration.asHours();
                                            if (hours >= 1) {
                                                var futureHour = mapToOrder(jsonrequest, brand);
                                                var beforeHour = moment(due.add((parseInt(config.alert_future_min) * -1), 'minutes').format('YYYY-MM-DD HH:mm:ss')).toDate();
                                                futureHour.alertDate = beforeHour
                                                futureHour.save()
                                                    .then(futureSaved => {
                                                        //save alert before time of due
                                                        var job = kue.reqQueue.create('1112Delivery(future)',futureSaved)
                                                            .priority('normal').attempts(2)
                                                            .removeOnComplete( true )
                                                            .save(err => {
                                                                if (err) {
                                                                    logger.info(tag.reqQueue_1112dfuture_error+ err)
                                                                }
                                                            })
                                                        job.log({orderId: futureSaved.orderNumber ,brand: futureSaved.brand ,dueDate: futureSaved.alertDate })

                                                        fileHandler.futureOutputFile(futureSaved, 'future.json')
                                                    })
                                            }

                                        })
                                    job.log({orderId: futureSaved.orderNumber ,brand: futureSaved.brand ,dueDate: futureSaved.alertDate })

                                    /*
                                    Promise.all(
                                        fileHandler.futureOutputFile(futureSaved, 'future.json')
                                    ).then( () => {

                                    })
                                    */
                                })
                        }

                    }
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

    }catch(error){
        console.log('order controller error '+error)
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

function findFuture(req, res, next) {
    var brand = req.params.brand.toUpperCase();
    Future.getBrand(brand)
        .then(orders =>{
            res.json(orders)
        })
        .catch(e => next(e));
}

module.exports = { ordering ,findOrder ,findFuture ,pushOnLine ,pushOnLineFutureOrder ,findLineGroup};