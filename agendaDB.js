var logger = require('./config/winston')(__filename)
var config = require('./config/config')
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
    agenda.database( url ,'agendaJob3');
        //agenda.processEvery('1 minute'); //agenda.maxConcurrency(2); //agenda.defaultConcurrency(2);
    agenda.define('futureOrderBeforeDuetime', async function(job, done) {
        logger.info('run futureOrderBeforeDuetime')
        Order.getUnAlertedBetweenMinutesTime(config.alert_future_min * -1)
            .then( (future) => {
                logger.info('callback futureOrderBeforeDuetime')
                if(future.length > 0) {
                    orderCtrl.pushOnLineFutureOrder(future[0].site, future[0], 1)
                }
                done()
            })
            .catch( (err) =>{
                logger.info('no result '+err)
                done()
            })

    });

    agenda.on('ready', async function() {
        await agenda.start();
        await agenda.every('1 minute', 'futureOrderBeforeDuetime');
    });
}

function futureOrderMorning(url){
    agenda.database( url ,'agendaJob2');
    agenda.define('futuremorning', function(job, done) {
        Future.find({alertDate: {'$gte':moment().add(-5,'minutes').format('YYYY-MM-DDTHH:mm:ss.SSS') ,
                '$lte':moment().add(5,'minutes').format('YYYY-MM-DDTHH:mm:ss.SSS')}})
            .exec()
            .then( future => {
                orderCtrl.pushOnLineFutureOrder(future.site,future,1)
            })
    });

    agenda.on('ready', function() {
        agenda.start();
        agenda.schedule('tomorrow at 6am','futuremorning');   //agenda.schedule(new Date(Date.now() + 10000), 'clearorder');
    });
}

function clearHistoryOrder(url){
    agenda.database( url ,'agendaJob1');
    agenda.on('ready', function() {
        agenda.define('clearorder', function(job, done) {
            Order.find({createdAt: {'$lte':moment().add(-1,'days').format('YYYY-MM-DDTHH:mm:ss.SSS') } ,alerted: true })
                .deleteMany().exec()
                                        //Order.find({createdAt: {'$lte':moment().add(-2,'hours').format('YYYY-MM-DDTHH:mm:ss.SSS') }})
            done()
        });
    });

    agenda.start();
    agenda.every('5 minutes', 'clearorder');
    //agenda.every('8 hours', 'clearorder');
}

/* removed
function clearHistoryFuture(url){
    agenda.database( url ,'agendaJob4');
    //agenda.processEvery('1 minute');
    agenda.maxConcurrency(2);
    agenda.defaultConcurrency(2);

    agenda.on('ready', function() {
        agenda.define('clearfuture', function(job, done) {
            Future.find({alertDate: {'$lte':moment().add(-7,'days').format('YYYY-MM-DDTHH:mm:ss.SSS') }})
                .deleteMany().exec()

            Future.find({alerted: true})
                .deleteMany().exec()

        });

        //agenda.schedule(new Date(Date.now() + 1000), 'clearfuture');
        agenda.every('8 hours', 'clearfuture');
        agenda.start();
    });

}
*/
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
            .catch(err => next(err))
    //})

}

module.exports = {futureOrder,futureOrderMorning,clearHistoryOrder,viewJob}