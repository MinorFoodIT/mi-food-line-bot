var logger = require('./config/winston')(__filename)
//var config = require('./../../config/config')
const Agenda = require('agenda');
const MongoClient = require('mongodb').MongoClient;
const Store = require('./routes/line/bot.store.model');
const Order = require('./routes/line/bot.order.model');
const Future = require('./routes/line/bot.future.model');
const orderCtrl = require('./routes/line/bot.order.controller');

var moment = require('moment');
var _ = require('lodash');

const agenda = new Agenda()

function futureOrder(url){

    agenda.database( url ,'agendaJob3');
    agenda.maxConcurrency(2);
    agenda.defaultConcurrency(2);

    agenda.on('ready', function() {
        agenda.define('futureOrderBeforeDuetime', function(job, done) {
            Future.find({alertDate: {'$gte':moment().add(-5,'minutes').format('YYYY-MM-DDTHH:mm:ss.SSS') ,
                                     '$lte':moment().add(5,'minutes').format('YYYY-MM-DDTHH:mm:ss.SSS')}
                         ,alerted: false})
                .exec()
                .then( future => {
                    orderCtrl.pushOnLineFutureOrder(future.site,future,1)
                })
        });
        agenda.every('5 minute', 'futureOrderBeforeDuetime');
        agenda.start();
    });
}

function futureOrderMorning(url){

    agenda.database( url ,'agendaJob2');
    agenda.maxConcurrency(2);
    agenda.defaultConcurrency(2);

    agenda.on('ready', function() {
        agenda.define('futuremorning', function(job, done) {
            Future.find({alertDate: {'$gte':moment().add(-5,'minutes').format('YYYY-MM-DDTHH:mm:ss.SSS') ,
                                    '$lte':moment().add(5,'minutes').format('YYYY-MM-DDTHH:mm:ss.SSS')}})
                 .exec()
                 .then( future => {
                     orderCtrl.pushOnLineFutureOrder(future.site,future,1)
                 })
        });

        //agenda.schedule(new Date(Date.now() + 10000), 'clearorder');
        agenda.schedule('tomorrow at 6am','futuremorning');
        agenda.start();
    });
}

/*
* Deprecated not store order into file
* */
function clearHistoryOrder(url){
        //console.log(moment().add(-1,'days').format('YYYY-MM-DDTHH:mm:ss.SSS')+'Z')
    //const agenda = new Agenda()
    agenda.database( url ,'agendaJob1');
    //agenda.processEvery('1 minute');
    agenda.maxConcurrency(2);
    agenda.defaultConcurrency(2);

    agenda.on('ready', function() {
        agenda.define('clearorder', function(job, done) {
            Order.find({createdAt: {'$lte':moment().add(-1,'days').format('YYYY-MM-DDTHH:mm:ss.SSS') }})
                .deleteMany().exec()
                                        //Order.find({createdAt: {'$lte':moment().add(-2,'hours').format('YYYY-MM-DDTHH:mm:ss.SSS') }})

            /* Order list
            Order.list()
                .then(data =>{
                    console.log('job rerun >>')
                    console.log(data)
                    done()
                })
                .catch(err => console.log(err))
            */
        });

        //agenda.schedule(new Date(Date.now() + 1000), 'clearorder');
        agenda.every('10 minute', 'clearorder');
        agenda.start();
    });

}

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
        agenda.every('2 hours', 'clearfuture');
        agenda.start();
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
            .catch(err => next(err))
    //})

}

module.exports = {futureOrder,futureOrderMorning,clearHistoryOrder,clearHistoryFuture,viewJob}