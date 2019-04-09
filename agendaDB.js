var logger = require('./config/winston')(__filename)
var config = require('./config/config')
var tag = require('./config/tag')
const Agenda = require('agenda');
const MongoClient = require('mongodb').MongoClient;
const Store = require('./routes/line/bot.store.model');
const Order = require('./routes/line/bot.order.model');

const orderCtrl = require('./routes/line/bot.order.controller');
var {Timestamp} = require('mongodb');

var moment = require('moment');
var _ = require('lodash');

const agenda = new Agenda()

/* DATE-TIMESTAMP
var begin = moment().add(-5,'minutes')
var end = moment().add(5,'minutes')
logger.info(typeof begin)
logger.info(new Date(begin))
logger.info(new Timestamp(new Date(begin),0))
logger.info(new Timestamp((new Date(begin)).getTime()/1000,0))
logger.info(typeof end)
logger.info(new Date(end))
logger.info(new Timestamp(new Date(end),0))
logger.info(new Timestamp((new Date(end)).getTime(),0))
logger.info(new Timestamp((new Date(end)).getTime()/1000,0))
var endtime = (new Date(end)).getTime()
logger.info(new Date(endtime))
*/

function futureOrder(url){
    agenda.database( url ,'agendaJob');
        //agenda.processEvery('1 minute'); //agenda.maxConcurrency(2); //agenda.defaultConcurrency(2);
    agenda.define('futureOrderBeforeDuetime', async function(job, done) {
        //logger.info(tag.trigger_futureOrder+'job is running')
        Order.getUnAlertedBetweenMinutesTime(config.alert_future_min * -1)
            .then( async (future) => {
                logger.info(tag.trigger_futureOrder+future.length+' docket(s) found')
                if(future.length > 0) {
                    await Promise.all(future.map( async (docket) => {
                        await orderCtrl.pushOnLineFutureOrder(docket.site, docket, 1)
                     }))
                }
                done()
            })
            .catch( (err) =>{
                logger.info(tag.trigger_futureOrder+err)
                done()
            })

    });

    agenda.define('clearorder', async function(job, done) {
        //logger.info(tag.trigger_housekeeping+'job is running')
        Order.find({createdAt: {'$lte':moment().add(-1,'days').format('YYYY-MM-DDTHH:mm:ss.SSS') } ,alerted: true })
            .deleteMany().exec()
            .then((doc) =>{
                logger.info(tag.trigger_housekeeping+doc.deletedCount+' docket(s) removed')
            })

        //Order.find({createdAt: {'$lte':moment().add(-2,'hours').format('YYYY-MM-DDTHH:mm:ss.SSS') }})
        done()
    });

    agenda.define('futuremorning', async function(job, done) {
        //logger.info(tag.cached_future_morning+'job is running')
        Order.find({alertDate: {'$lte':moment().add(5,'minutes').format('YYYY-MM-DDTHH:mm:ss.SSS')} ,alerted:false ,future:true} )
            .exec()
            .then( async (future) => {
                logger.info(tag.cached_future_morning+future.length+' docket(s) found')
                if(future.length > 0) {
                    await Promise.all(future.map( async (docket) => {
                        await orderCtrl.pushOnLineFutureOrder(docket.site, docket, 1)
                    }))
                }
                done()
            })
            .catch( (err) =>{
                logger.info(tag.cached_future_morning+err)
                done()
            })
    });

    agenda.on('ready', async function() {
        await agenda.start();
        await agenda.every('5 minutes', ['futureOrderBeforeDuetime','clearorder']);
        await agenda.every('0 6 * * *','futuremorning');   //agenda.schedule(new Date(Date.now() + 10000), 'clearorder');
    });
}

function viewJob(req, res, next){
    logger.info('To view processor job running')
    //agenda.on('ready', function() {
        //logger.info('agenda is started')
        agenda.jobs()
            .then( jobs =>{
                //logger.info('found jobs')
                var Jobs = [];
                jobs.map(job => {
                    Jobs.push(job.agenda.attrs)
                })
                res.json(jobs)
            })
            .catch(err => {
                //const apiErr = new APIError(err)
                logger.error(err.message)
                next(err)
            })
    //})

}

module.exports = {futureOrder,viewJob}