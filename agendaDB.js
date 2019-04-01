const Agenda = require('agenda');
const MongoClient = require('mongodb').MongoClient;
const Store = require('./routes/line/bot.store.model');
const Order = require('./routes/line/bot.order.model');
const Future = require('./routes/line/bot.future.model');
const orderCtrl = require('./routes/line/bot.order.controller');

var moment = require('moment');
var _ = require('lodash');

const agenda = new Agenda()

function futureOrderMorning(url){

    agenda.database( url ,'agendaJob2');
    agenda.maxConcurrency(2);
    agenda.defaultConcurrency(2);

    agenda.on('ready', function() {
        agenda.define('futureorder', function(job, done) {
            Future.find({alertDate: {'$gte':moment().add(-5,'minutes').format('YYYY-MM-DDTHH:mm:ss.SSS') ,
                                    '$lte':moment().add(5,'minutes').format('YYYY-MM-DDTHH:mm:ss.SSS')}})
                 .exec()
                 .then( future => {
                     orderCtrl.pushOnLine(future.site,future,1)
                 })
        });

        //agenda.schedule(new Date(Date.now() + 1000), 'clearorder');
        agenda.schedule('tomorrow at 6am','futureorder');
        agenda.start();
    });
}

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

function viewJob(){
    agenda.on('start', function() {
        agenda.jobs()
            .then( jobs =>{
                console.log(jobs)
            });
    })

}

module.exports = {futureOrderMorning,clearHistoryOrder,viewJob}