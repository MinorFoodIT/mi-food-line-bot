const fileHandler = require('./routes/helpers/FileHandler')
var kue = require('kue');

var reqQueue = kue.createQueue({redis: {
        host: 'localhost',
        port: 6379
    }});
var actionQueue = kue.createQueue({redis: {
        host: 'localhost',
        port: 6379
    }});


function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

reqQueue.process('1112Delivery' ,(job,done) => {
                            //Queue to write sync file
                                //var savedOrder = job.data
                                //fileHandler.orderOutputFile(savedOrder, savedOrder.site + '.' + formatDate(Date.now()));
                            done()
                  })

reqQueue.process('1112Delivery(future)' ,(job,done) => {
    var futureSaved = job.data
    //fileHandler.futureOutputFile(futureSaved, 'future.json')
    done()
})

reqQueue.on('complete', function(result){

});

/*
var job = kue.reqQueue.create('1112Delivery',savedOrder)
            .priority('normal').attempts(2)
            .removeOnComplete( true )
            .save(err =>{
                if(err) {
                 logger.info(tag.reqQueue_1112d_error+ err)
                }
            })
job.log({orderId: savedOrder.orderNumber ,brand: savedOrder.brand })

//Save alert Morning
var job = kue.reqQueue.create('1112Delivery(future)',futureMorningSaved)
    .priority('normal').attempts(2)
    .removeOnComplete( true )
    .save(err =>{
        if(err) {
            logger.info(tag.reqQueue_1112dfuture_error+ err)
        }
    })
job.log({orderId: futureMorningSaved.orderNumber ,brand: futureMorningSaved.brand ,dueDate: futureMorningSaved.alertDate })
*/

module.exports = { reqQueue , actionQueue}