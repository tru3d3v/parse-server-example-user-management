var config = require('../../app_config.json');
var querystring = require('querystring');
var http = require('http');
var fs = require('fs');
var url = require('url');
var MongoClient = require('mongodb').MongoClient


var myModule = module.exports = {

    func1:function (){
         return "Function1";
    },
    func2:function (){
         return "Function2";
    },
     getUsersByIds:function(objectIds,callback){

         return MongoClient.connect(config.databaseURI).then(function(db) {

               return db.collection('_User').find({"_id":{"$in":objectIds}}).toArray(function (err, results) 
               {
                        if (err){ throw err}

                        var users = [];
                        results.forEach(function(item){
                            users.push({id:item._id,username:item.username,email:item.email,phone:item.phone});
                        });
                        
                        callback(users);
                });

               
               
               /*.then(function(docs) {
                      db.close();
                      return docs;
                });*/

            },
            function(error){
                var anu = error;
            });
    },
    getEmailById:function(objectId){

         return MongoClient.connect(config.databaseURI).then(function(db) {

               return db.collection('_User').findOne({_id:objectId}).then(function(doc) {
                      db.close();
                      return doc.email;
                });

            },
            function(error){
                var anu = error;
            });
    },
    getUserFields:function(items){

        var arrayOfUsers = [];
        var promises = [];
        
       items.forEach(function(item){

            var email = item.get("email");
            if(email==undefined){
                
                    promises.push({id: item.id,username:item.get('username'),email:myModule.getEmailById(item.id)});
            }else{
                    promises.push(Parse.Promise.as({id: item.id,username:item.get('username'),email:email}));
            }   
            
        });

        var isRelease =promises.length;
        return   Parse.Promise.when(promises).then(function(promise){
           
           var results = [];
            promise.forEach(function(item){
                    var email = item.email;
                    if(typeof(email)=='object'){
                        email.then(function(emailPromise){
                            item.email = emailPromise;
                            isRelease++;
                        });
                    }
                    results.push(item);
            });
            return Parse.Promise.when(results);
        });

    },
    callHttpPost:function(pathApi,body,method){

            var post_data = body!='' ?  querystring.stringify(body) : '' ;
            // TODO ..
    },

    checkUserToken:function(userToken,callback){

            var host = url.parse(config.serverURL).hostname; 
            var post_options = {
                host: host,
                port:config.port,
                path: '/parse/users/me',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Parse-Application-Id':config.appId,
                    'X-Parse-REST-API-Key':config.masterKey,
                    'X-Parse-Session-Token':userToken
                }
            };

             var post_req = http.request(post_options, function(res) {
                    res.setEncoding('utf8');
                    
                    res.on('data', function (responseString) {
                        var response = JSON.parse(responseString);
                            if(response.sessionToken!=undefined){
                                callback({sessionToken:response.sessionToken,valid:true,iduser:response.objectId});
                            }
                            if(response.code!=undefined)
                            {
                                callback({sessionToken:response.sessionToken,valid:false,error:response.error});
                            }
                            
                    });
                });

             post_req.end();

    }

};