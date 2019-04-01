# BOT LINE@ messaging
 Minor FoodIT is own project

# Test Local
 set NODE_ENV=development

# AWS
 Dev host : https://n.1112delivery.com
 
# Feature
 * version 1.0.0
      * Order route and controller
      * Line route and webhook controller
      * Cache data object in mongo database (In memory)
      * Scheme 
         * Store - keep {site ,groupId}
         * Order - keep order delivery data 
      * File storage
         * ./stores/  ,keep each store metadata
         * ./orders/  ,keep transaction data daily 
      * Swagger API document

 * version 1.0.1
      * Future order
        * Keep order transaction as files by date and site
        * Cache order transaction daily 
            * Filter out older than today
        * Keep future order for notification on promise date and before N minutes to due time (configurable)  
      
 
      