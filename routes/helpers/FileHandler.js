const jsonfile = require('jsonfile')
const path = require('path')
const json_file_extention = '.json'
const Store = require('./../line/bot.store.model');
var logger = require('./../../config/winston')
var fs = require('fs');

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
            logger.info('Callback > Success > Write file to '+filename+' complete')
            logger.info('Mongoose: find groupId '+obj.groupId)

            //Save site object into cache
            if(obj.storeId.length > 0){
                //After group join message first time ,then message with store=XXXXXX
                Store.find({ 'groupId': obj.groupId }, 'site', function (err, siteObj) {
                    if(err){
                        return handler(err)
                    }else{
                        //logger.info(Object.keys(siteObj).length)
                        //logger.info(siteObj.constructor)
                        logger.info(siteObj)

                        //Array empty
                        if(Object.keys(siteObj).length === 0){
                            //Object.keys(siteObj).length === 0 && siteObj.constructor === Object
                            logger.info('Find empty site.')

                            var store = new Store(
                                {
                                    site: obj.storeId,
                                    groupId: obj.groupId
                                })
                            store.save()
                                .then(savedStore => {
                                    logger.info('Mongoose: insert store '+obj.storeId+',groupId '+obj.groupId)
                                })
                                .catch(err => logger.error('Mongoose: error insert store '+err))

                        }else{
                            logger.info('Find site '+obj.storeId +' found.')
                            //Use : Model.findOneAndUpdate(conditions, update, options, (error, doc) => {
                            Store.findOneAndUpdate({ 'groupId': obj.groupId } ,{$set:{site:obj.storeId}}, {new: true},(err,doc) =>{
                                if(err) logger.info(err)
                                logger.info('Mongoose: update store '+obj.storeId+',groupId '+obj.groupId)
                                //console.log(doc)
                            })

                        }
                    }
                })
            }

        })
        .catch(error => logger.error(error))
}

function orderOutputFile(obj,filename){
    file = path.join(path.dirname(require.main.filename),'/../orders/'+filename+json_file_extention)
    jsonfile.writeFile(file, obj , { flag: 'a' ,spaces: 2} )
        .then(res => {
            logger.info('Callback:Success:Update file to '+filename+' complete')
        })
        .catch(error => logger.error(error))
}

function storeReadFile(filename){
    return new Promise(
        (resolve, reject) => {
            jsonfile.readFile(filename)
                .then(obj => resolve(obj))
                .catch(error => reject(error))
        }
    );

}

module.exports = { storeOutputFile ,orderOutputFile ,storeReadFile ,removeStoreOutputFile}