const jsonfile = require('jsonfile')
const path = require('path')
const json_file_extention = '.json'
const Store = require('./../line/bot.store.model');
var logger = require('./../../config/winston')(__filename)
var fs = require('fs');

function removeFutureOutputFile(obj,filename){

    file = path.join(path.dirname(require.main.filename),'/../future/'+filename+json_file_extention)
    fs.unlink(file ,res => {
        Store.find({'_id': obj._id }).remove().exec();
    })
}

function removeStoreOutputFile(obj,filename){
    //Remove file of groupId
    //Remove site object out of cache mem

    file = path.join(path.dirname(require.main.filename),'/../stores/'+filename+json_file_extention)
    fs.unlink(file ,res => {
            Store.find({'groupId': obj.groupId }).remove().exec();
        })
}

function storeOutputFile(obj,filename){
    file = path.join(path.dirname(require.main.filename),'/../stores/'+filename+json_file_extention)
    jsonfile.writeFile(file, obj)
        .then(res => {
            logger.info('Callback => success ,store/site line group write file to '+filename+' complete')
            logger.info('Mongoose => find groupId '+obj.groupId)

            //Save site object into cache
            if(obj.storeId.length > 0){
                //After group join message first time ,then message with store=XXXXXX
                Store.find({ 'groupId': obj.groupId }, 'site', function (err, siteObj) {
                    if(err){
                        return handler(err)
                    }else{
                        //logger.info(Object.keys(siteObj).length)
                        //logger.info(siteObj.constructor)
                        //logger.info(siteObj)

                        //Array empty
                        if(Object.keys(siteObj).length === 0){
                            //Object.keys(siteObj).length === 0 && siteObj.constructor === Object
                            logger.info('Found empty site.')

                            var store = new Store(
                                {
                                    site: obj.storeId,
                                    groupId: obj.groupId
                                })
                            store.save()
                                .then(savedStore => {
                                    logger.info('Mongoose => insert store '+obj.storeId+',groupId '+obj.groupId)
                                })
                                .catch(err => logger.error('Mongoose => error insert store '+err))

                        }else{
                            logger.info('Found site '+obj.storeId +'.')
                            //Use : Model.findOneAndUpdate(conditions, update, options, (error, doc) => {
                            Store.findOneAndUpdate({ 'groupId': obj.groupId } ,{$set:{site:obj.storeId}}, {new: true},(err,doc) =>{
                                if(err) logger.info(err)
                                logger.info('Mongoose => update store '+obj.storeId+',groupId '+obj.groupId)
                                //console.log(doc)
                            })

                        }
                    }
                })
            }

        })
        .catch(error => logger.info(error))
}

function futureOutputFile(obj,filename){
    return new Promise((resolve, reject) => {
        futureFile = path.join(path.dirname(require.main.filename),'/../future/'+filename)
        jsonReadFile(futureFile)
            .then(list =>{
                list.push(obj);
                jsonfile.writeFile(futureFile, list , { spaces: 2} )
                    .then(res => {
                        logger.info('Callback => success ,future append file to '+filename+' complete '+obj._id)
                        resolve(res)
                    })
                    .catch(error => {
                        logger.info('future.json append file error => '+error)
                        reject(error)
                    })
            })
            .catch(err =>{
                logger.info('future.json file error => '+err)
                reject(err)
                /*
                var list = [];
                list.push(obj);
                jsonfile.writeFile(futureFile, list , { flag: 'a' ,spaces: 2} )
                    .then(res => {
                        logger.info('Callback => success ,future create file to '+filename+' complete')
                    })
                    .catch(error => logger.info('future.json create file error => '+error))
                */
                /*
                var futures = JSON.parse(list); //now it an object
                futures.push(obj); //add some data
                var json = JSON.stringify(futures); //convert it back to json
                fs.writeFile(futureFile, json, 'utf8', (data) => {
                    logger.info('Callback => success ,future append file to '+filename+' complete '+obj._id)
                    resolve(data)
                });
                */
            })
    })
}

function orderOutputFile(obj,filename){
    var site = filename.substring(0,filename.indexOf('.'))
    storepath = path.join(path.dirname(require.main.filename),'/../orders/'+site)
    file = path.join(path.dirname(require.main.filename),'/../orders/'+site+'/'+filename+json_file_extention)
    if (!fs.existsSync(storepath)){
        fs.mkdirSync(storepath);
    }
    jsonReadFile(file)
        .then(list =>{
            list.push(obj);
            jsonfile.writeFile(file, list , { spaces: 2} )
                .then(res => {
                    logger.info('Callback => success ,order append file to '+filename+' complete')
                })
                .catch(error => logger.info('Order append file error => '+error))
        })
        .catch(err =>{
            var list = [];
            list.push(obj);
            jsonfile.writeFile(file, list , { flag: 'a' ,spaces: 2} )
                .then(res => {
                    logger.info('Callback => success ,data create file to '+filename+' complete')
                })
                .catch(error => logger.info('Order create file error => '+error))
        })
}

function jsonReadFile(filename){
    return new Promise(
        (resolve, reject) => {
            jsonfile.readFile(filename)
                .then(obj => resolve(obj))
                .catch(error => reject(error))
        }
    );

}

module.exports = { storeOutputFile ,orderOutputFile ,jsonReadFile ,removeStoreOutputFile ,removeFutureOutputFile ,futureOutputFile}