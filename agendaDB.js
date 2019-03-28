const Agenda = require('agenda');
const MongoClient = require('mongodb').MongoClient;
const Store = require('./routes/line/bot.store.model');
const Order = require('./routes/line/bot.order.model');
var moment = require('moment');

function futureOrder(url){


}

function clearHistoryOrder(url){
    //console.log(moment().add(-1,'days').format('YYYY-MM-DDTHH:mm:ss.SSS')+'Z')

    const agenda = new Agenda()
    agenda.database( url ,'agendaJob1');
    //agenda.processEvery('1 minute');
    agenda.maxConcurrency(2);
    agenda.defaultConcurrency(2);

    agenda.on('ready', function() {
        agenda.define('clearorder', function(job, done) {
            Order.find({createdAt: {'$lte':moment().add(-1,'days').format('YYYY-MM-DDTHH:mm:ss.SSS')+'Z' }})
                .deleteMany().exec()

            Order.list()
                .then(data =>{
                    console.log('job rerun >>')
                    console.log(data)
                    done()
                })
                .catch(err => console.log(err))
        });

        //agenda.schedule(new Date(Date.now() + 1000), 'clearorder');
        agenda.every('1 minute', 'clearorder');
        agenda.start();

    });

}

module.exports = {futureOrder,clearHistoryOrder}