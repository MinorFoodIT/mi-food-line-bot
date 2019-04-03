var os = require('os');
var logger = require('./config/winston')(__filename)
var mongoose = require('mongoose');
const Store = require('./routes/line/bot.store.model');
const Order = require('./routes/line/bot.order.model');
const Future = require('./routes/line/bot.future.model');

var MongoMemoryServer = require('mongodb-memory-server');

const storeFolder = './stores/';
const orderFolder = './orders/';
const futureFolder = './future/';
const fs = require('fs');

const fileHandler = require('./routes/helpers/FileHandler')

var moment = require('moment');
var dateNow = moment().format('YYYY-MM-DD');

var agenda = require('./agendaDB');
/**
 * In memory database
 */

/*
const mongod = new MongoMemoryServer.MongoMemoryServer({
    instance: {
        port: 10050, // by default choose any free port
        ip: '127.0.0.1', // by default '127.0.0.1', for binding to all IP addresses set it to `::,0.0.0.0`,
        dbName: 'IMDB', // by default generate random dbName
        dbPath: 'temp', // by default create in temp directory
        //storageEngine: 'ephemeralForTest', // by default `ephemeralForTest`, available engines: [ 'devnull', 'ephemeralForTest', 'mmapv1', 'wiredTiger' ]
        //debug: false, // by default false
        //replSet: string, // by default no replica set, replica set name
        //auth: false, // by default `mongod` is started with '--noauth', start `mongod` with '--auth'
        //args: string[], // by default no additional arguments, any additional command line arguments for `mongod` `mongod` (ex. ['--notablescan'])
    }

    binary: {
        version: 'lastest', // by default 'latest'
        downloadDir: 'node_modules/.cache/mongodb-memory-server/mongodb-binaries', // by default node_modules/.cache/mongodb-memory-server/mongodb-binaries
        platform: os.platform(), // by default os.platform()
        arch: os.arch(), // by default os.arch()
        debug: false, // by default false
        checkMD5: false, // by default false OR process.env.MONGOMS_MD5_CHECK
        systemBinary: 'process.env.MONGOMS_SYSTEM_BINARY', // by default undefined or process.env.MONGOMS_SYSTEM_BINARY
    },

    debug: false, // by default false
    autoStart: true, // by default true

});
*/
/*
{
    instance: {
        port: 10050,
        ip: '127.0.0.1',
        dbName: 'IMDB',
        dbPath: 'temp',
        storageEngine: `devnull`, // by default `ephemeralForTest`, available engines: [ 'devnull', 'ephemeralForTest', 'mmapv1', 'wiredTiger' ]
        debug: false, // by default false
        //replSet: 'no', // by default no replica set, replica set name
        auth: false // by default `mongod` is started with '--noauth', start `mongod` with '--auth'
        //args: string[], // by default no additional arguments, any additional command line arguments for `mongod` `mongod` (ex. ['--notablescan'])
    },
    debug: true,
    autoStart: true

}
*/
mongoose.Promise = Promise;

const mongod = new MongoMemoryServer.MongoMemoryServer();

const mongooseOpts = { // options for mongoose 4.11.3 and above
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
    useNewUrlParser: true,
};

function defindStore(){
    return new Promise(
        (resolve, reject) => {
            const StoreSchema = new mongoose.Schema({
                site: {
                    type: String,
                    required: true
                },
                groupId: {
                    type: String,
                    required: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            });

            StoreSchema.method({
            });

            try{
                resolve(StoreSchema);
            }catch(err){
                reject(err)
            }
        }
    );
}

mongod.getConnectionString().then((mongoUri) => {
    mongoose.connect(mongoUri, mongooseOpts);
    mongoose.connection.on('error', () => {
        throw new Error(`Mongoose: unable to connect to database: ${mongoUri}`);
    });
    mongoose.connection.on('connected', () => {
        logger.info('Mongoose: cached mongo connection created')
        //console.info(mongoose.connection.readyState)

            fs.readdir(storeFolder, (err, files) => {
                Promise.all(
                    files.map(file => {
                        //console.log(file);
                        fileHandler.jsonReadFile(storeFolder+file)
                            .then(storeGroup => {
                                //instance model
                                var store = new Store(
                                    {
                                        site: storeGroup.storeId,
                                        groupId: storeGroup.groupId
                                    })
                                /*
                                store.save(function (err,savedStore) {
                                    if(err) console.error('Mongoose: error insert store')
                                    console.info('Mongoose: insert store '+storeGroup.storeId+',groupId '+storeGroup.groupId)
                                })
                                */

                                store.save()
                                    .then(savedStore => {
                                        logger.info('Mongoose: insert store '+storeGroup.storeId+',groupId '+storeGroup.groupId)
                                        return null;
                                    })
                                    .catch(err => {
                                        logger.error('Mongoose: error insert store '+err)
                                        return null;
                                    })
                                    .finally(function(){return null;})
                            })
                            .catch(err => {
                                logger.error('Mongoose: error insert store '+err)
                            })
                    })
                )
            })

            fs.readdir(orderFolder, (err, folders) => {
                Promise.all(
                    folders.map(folder => {
                        fs.readdir(orderFolder+folder , (err, files) => {
                            Promise.all(
                            files.map(file => {
                                if(file.indexOf(dateNow) > -1){
                                    //load only current date
                                    fileHandler.jsonReadFile(orderFolder+folder+'/'+file)
                                        .then( listorder =>{
                                            listorder.map(order => {
                                                Order.create(order)
                                                    .then(logger.info('Mongoose: insert order '+order.orderNumber))
                                                    .catch(err => logger.log('Mongoose: error insert order '+err))
                                            })
                                        })
                                        .catch(err => {
                                            logger.error('Mongoose: error insert order '+err)
                                        })
                                }
                            })
                            )
                        })
                    })
                ).then(
                    //assign job
                    agenda.clearHistoryOrder(mongoUri)
                )
            })

            fs.readdir(futureFolder, (err, files) => {
                Promise.all(
                    files.map(file => {
                        fileHandler.jsonReadFile(futureFolder+file)
                            .then(future =>{
                                Future.create(future)
                                    .then(logger.info('Mongoose: insert future order '+future.orderNumber +' alert date '+future.alertDate))
                                    .catch(err => logger.log('Mongoose: error insert future order '+err))
                            })
                            .catch(err => {
                                logger.error('Mongoose: error insert future order '+err)
                            })
                    })
                ).then( () => {
                        //JOB
                        agenda.futureOrderMorning(mongoUri);
                        agenda.futureOrder(mongoUri);
                        agenda.clearHistoryFuture(mongoUri);
                    }
                )
            })
    });
    mongoose.connection.on('disconnected', () => {
        logger.info('Mongoose: connection disconnected')
    });

});


/**
 *
 * @returns {Promise<{port: number, dbName: string, dbPath: string, uri: string}>}
 */
/*
exports.url = async function () {
    const uri = await mongod.getConnectionString();
    const port = await mongod.getPort();
    const dbPath = await mongod.getDbPath();
    const dbName = await mongod.getDbName();

    return {uri,port,dbPath,dbName};
}
*/


exports.stop = function() {
    // you may stop mongod manually
    mongod.stop();
    return 'Mongoose: mongod cache stoped';
}


