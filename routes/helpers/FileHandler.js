const jsonfile = require('jsonfile')
const path = require('path')
const json_file_extention = '.json'
const Store = require('./../line/bot.store.model');

function storeOutputFile(obj,filename){
    file = path.join(path.dirname(require.main.filename),'/../stores/'+filename+json_file_extention)
    jsonfile.writeFile(file, obj)
        .then(res => {
            console.log('Callback:Success:Write file to '+filename+' complete')
            console.log('Mongoose: find groupId '+obj.groupId)

            //Save site object into cache
            if(obj.storeId.length > 0){
                //After group join message first time ,then message with store=XXXXXX
                Store.find({ 'groupId': obj.groupId }, 'site', function (err, siteObj) {
                    if(err){
                        return handler(err)
                    }else{
                        //console.info(Object.keys(siteObj).length)
                        //console.info(siteObj.constructor)
                        console.info(siteObj)

                        //Array empty
                        if(Object.keys(siteObj).length === 0){
                            //Object.keys(siteObj).length === 0 && siteObj.constructor === Object
                            console.info('Find empty site.')

                            var store = new Store(
                                {
                                    site: obj.storeId,
                                    groupId: obj.groupId
                                })
                            store.save()
                                .then(savedStore => {
                                    console.info('Mongoose: insert store '+obj.storeId+',groupId '+obj.groupId)
                                })
                                .catch(err => console.error('Mongoose: error insert store '+err))

                        }else{
                            console.info('Find site '+obj.storeId +' found.')
                            //Use : Model.findOneAndUpdate(conditions, update, options, (error, doc) => {
                            Store.findOneAndUpdate({ 'groupId': obj.groupId } ,{$set:{site:obj.storeId}}, {new: true},(err,doc) =>{
                                if(err) console.log(err)
                                console.info('Mongoose: update store '+obj.storeId+',groupId '+obj.groupId)
                                //console.log(doc)
                            })

                        }
                    }
                })
            }

        })
        .catch(error => console.error(error))
}

function orderOutputFile(obj,filename){
    file = path.join(path.dirname(require.main.filename),'/../orders/'+filename+json_file_extention)
    jsonfile.writeFile(file, obj , { flag: 'a' ,spaces: 2} )
        .then(res => {
            console.log('Callback:Success:Update file to '+filename+' complete')
        })
        .catch(error => console.error(error))
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

module.exports = { storeOutputFile ,orderOutputFile ,storeReadFile}