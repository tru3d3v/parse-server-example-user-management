var utilityModule = require('./modules/utility_module.js');
var config = require('../app_config.json');
var nodemailer = require('nodemailer');
const xoauth2 = require('xoauth2');

/**
 * Spec User Management:
 * Only Role Super Administrator, Truvel Administrator, IT Manager can Modify record
 * Then Roles Table the ACL's must be Set allow Read  for Truvel Administrator and IT Manager
 */

Parse.Cloud.define('sayHello', function (req, res) {
        res.success({kolom1:"haiashsdkashd"});
});

Parse.Cloud.define('createRoleSuperAdmin', function (req, res) {
    var query = new Parse.Query(new Parse.Role());

    //Find User Administrator 
    query.equalTo("name",config.groupUserManagement.SuperAdmin);
    query.first().then(function(superadmin){
        // Super Admin is not exist
        if(superadmin==undefined){
            // Create ACL, only super admin can modify
            var roleACL = new Parse.ACL();
            roleACL.setPublicReadAccess(true);
            var role = new Parse.Role(config.groupUserManagement.SuperAdmin, roleACL);
            roleACL.setRoleWriteAccess(role, true);
            roleACL.setRoleReadAccess(role, true);
            role.setACL(roleACL);
            return role.save().then(function(roleCreated){
                return {message:'OK',role:roleCreated};
            });
        }else{
                return Parse.Promise.error( {code:'0',message: config.groupUserManagement.SuperAdmin+" already exist"});
        }
    }).then(
        // Only Two result   FinalResult or Error
        function(finalResult){
                return  res.success(finalResult);
        },
        function(error){
                return res.error({code:error.code,message: error.message});
        }
    );

});


Parse.Cloud.define('createUserSuperAdmin', function (req, res) {

    // Variable from Request
    var username = req.params.username;
    var password = req.params.password;
    var email = req.params.email;

    /** New Code */
    var Role = new Parse.Role();
    var query = new Parse.Query(Role);
    query.equalTo("name", config.groupUserManagement.SuperAdmin);
    query.first().then(function(rolesuperadmin){
            //Create User SuperAdmin
            var newuser = new Parse.User();
            newuser.set("username", username);
            newuser.set("password", password);
            newuser.set("email", email);
            newuser.set("phone", "");
            // Make sure Role super admin is exist
            if(rolesuperadmin!=undefined){
                // Only ROLE.id SuperAdmin Can't write and access
                var roleACL = new Parse.ACL();
                roleACL.setPublicReadAccess(false);
                roleACL.setRoleWriteAccess(rolesuperadmin, true);
                roleACL.setRoleReadAccess(rolesuperadmin, true);
                newuser.setACL(roleACL);

                return newuser.save().then(function(newuserCreated){
                    return newuserCreated;
                }).then(function(newuserCreated){

                    // Add user to Role
                    rolesuperadmin.getUsers().add(newuserCreated);
                    return rolesuperadmin.save().then(function(rolesaved){

                        return {message:"OK",role:rolesaved};
                    },function(error){
                        if(error.code!=101){
                            return Parse.Promise.error( {message:"Error: " + error.code + " " + error.message});
                        }else{
                            // Special case return success
                            return Parse.Promise.error({message:'User set role as '+rolesuperadmin.get('name')});
                        }
                    });        
                });
            }else{
                return Parse.Promise.error({code:'00',message:'Role '+config.groupUserManagement.SuperAdmin+' is not exist'});
            }
    }).then(
        // Only Two result   FinalResult or Error
        function(finalResult){
                return  res.success(finalResult);
        },
        function(error){
                return res.error({code:error.code,message: error.message});
        }
    );
    
});

Parse.Cloud.define('createRole', function (req, res) {
        var rolename = req.params.rolename;
        var userToken = req.headers.usertoken;
        //Set Login User Token
        Parse.User.enableUnsafeCurrentUser()
        Parse.User.become(userToken).then(function (currentUser) {

            // Just Make sure Super Admin is Exist
            var query = new Parse.Query(new Parse.Role());
            query.equalTo("name",config.groupUserManagement.SuperAdmin);
            query.first().then(function(role){
                if(role!=undefined){
                    return role;
                }else{
                    return Parse.Promise.error({code:'00',message:"Please make sure Role "+config.groupUserManagement.SuperAdmin+" is exist"});
                }
            }).then(function(RoleSuperAdmin){
                    // Disable Role 'SuperAdmin' ACL Read acces public
                    var roleACL = RoleSuperAdmin.getACL();// new Parse.ACL();
                    var isRead = roleACL.getPublicReadAccess();
                    roleACL.setPublicReadAccess(false);
                    isRead = roleACL.getPublicReadAccess();
                    RoleSuperAdmin.setACL(roleACL);
                    return RoleSuperAdmin.save();
            }).then(function(RoleSuperAdmin){
                 
                // Check is Role "Truvel Administrator" and "IT Manager"" is exist" 
                // if not exist. Throw error that's role must be first created
                // if exist Add that's Role as ACL's RoleReadAccess
                query.containedIn("name",[config.groupUserManagement.SuperAdmin,config.groupUserManagement.Administrator,config.groupUserManagement.Administrator2]);
                return query.find().then(function(roleGroupManageUsers){
                    if(roleGroupManageUsers.length<3){
                        if(rolename==config.groupUserManagement.Administrator || rolename==config.groupUserManagement.Administrator2 ){
                                // Create Role Dependency 'Truvel Administrator' and 'IT Manager'
                                // With ACL 'Super Administrator' can modify and read this Role
                                var roleACL = new Parse.ACL();
                                var query = new Parse.Query(new Parse.Role());
                                query.equalTo("name", rolename);
                                return query.first().then(function(role){
                                     if(role==undefined){
                                                roleACL.setRoleWriteAccess(RoleSuperAdmin, true);
                                                roleACL.setRoleReadAccess(RoleSuperAdmin, true);
                                                var role = new Parse.Role(rolename, roleACL);
                                                // Self Role Managable
                                                roleACL.setRoleWriteAccess(role, true);
                                                roleACL.setRoleReadAccess(role, true);

                                                return role.save().then(function(role){
                                                                return {message:'Role created ',roleCreated:role};
                                                        }
                                                );

                                    }else{
                                        return Parse.Promise.error({code:'00',message:"Role '"+rolename+"' already exist !"});
                                    }
                                });

                        }else{
                            return Parse.Promise.error({code:'00',message:"Please create role '"+config.groupUserManagement.Administrator+"' and '"+config.groupUserManagement.Administrator2+"' for the first time creation role "});
                        }
                    }else{
                                // Create another Role
                                // With ACL 'Super Administrator' can modify and read this Role
                                // Then ACL 'Truvel Administrator' and 'IT Manager' can read only
                                 var roleACL = new Parse.ACL();
                                // Loop roles
                                var RoleNotcontainedIn = true;
                                roleGroupManageUsers.forEach(function(role){
                                    var rolenameSpecial = role.get("name");
                                    // Make sure request Role Name not containedIn
                                    if(rolenameSpecial==rolename){
                                         RoleNotcontainedIn = false;
                                         return;
                                    }

                                    if(rolenameSpecial==config.groupUserManagement.Administrator || rolenameSpecial==config.groupUserManagement.Administrator2 ){
                                        // Just Read access
                                        roleACL.setPublicReadAccess(false);
                                        roleACL.setRoleReadAccess(role,true);
                                    }
                                    else if(rolenameSpecial==config.groupUserManagement.SuperAdmin){
                                        // Read and Write
                                        roleACL.setRoleWriteAccess(role, true);
                                        roleACL.setRoleReadAccess(role, true);
                                    }
                                });
                                // End of loop Roles
                                if(RoleNotcontainedIn){
                                    var role = new Parse.Role(rolename, roleACL);
                                    return role.save().then(function(role){
                                                    return {message:'Role created ',roleCreated:role};
                                            }
                                    );
                                }else{
                                   return  Parse.Promise.error({code:'00',message:"Role '"+rolename+"' already exist !"});
                                }
                    }
                });

            }).then(
                // Only Two result   FinalResult or Error
                function(finalResult){
                        return  res.success(finalResult);
                },
                function(error){
                        return res.error({code:error.code,message: error.message});
                }
            );

        },
        function (error) {
            // The token could not be validated.
            return res.error({message:'The token could not be validated, please login correctly'});
        });
});

// Only Super Admin can create Truvel Admin & IT Manager User 'sementara'
Parse.Cloud.define('createUser', function (req, res) {
        // Body Request
        var rolename =req.params.rolename; // Get From Body
        var username = req.params.username;
        var password = req.params.password;
        var email = req.params.email;
        var phone = req.params.phone;

        // Login with Token headers
        var userToken = req.headers.usertoken;

        //Set Login User Token
        Parse.User.enableUnsafeCurrentUser();
        Parse.User.become(userToken).then(function (currentUser) {

            var newuser = new Parse.User();
            newuser.set("username", username);
            newuser.set("password", password);
            newuser.set("email", email);
            newuser.set("phone", phone);

            // Set ACL Only "Truvel Administrator" and "IT Manager" can modify this Record
            var Role = new Parse.Role();
            var query = new Parse.Query(Role);
            query.containedIn("name",[config.groupUserManagement.SuperAdmin,config.groupUserManagement.Administrator,config.groupUserManagement.Administrator2]);
            query.find().then(function(roles){

                    var roleACL = new Parse.ACL();
                    // Begin of Loop Roles
                    roles.forEach(function(role){
                    // Add Role to ACL User record's
                        if(role!=undefined)
                        {
                                roleACL.setPublicReadAccess(false);
                                roleACL.setRoleWriteAccess(role, true);
                                roleACL.setRoleReadAccess(role, true);
                        }
                    });
                    newuser.setACL(roleACL);
                    // End Of Loop Roles
                    
                        var Role = new Parse.Role();
                        var query = new Parse.Query(Role);
                        query.equalTo("name", rolename);
                        return query.first().then(function(roleuser){

                                if(roleuser!=undefined){
                                    return newuser.save().then(function(user){
                                        // Add user object to Role
                                        roleuser.getUsers().add(user);
                                        // Save Role record and push the Users
                                        return roleuser.save().then(
                                            function(edited_roleuser){
                                                    return {message:"OK",user:newuser.id};
                                            });
                                    });
                                }else{
                                    return Parse.Promise.error({code:'00',message:"Role "+ rolename+" doesnt not exist !, please add Role"});
                                }
                        });

            }).then(
                // Only Two result   FinalResult or Error
                function(finalResult){
                        return  res.success(finalResult);
                },
                function(error){
                        return res.error({code:error.code,message: error.message});
                });
                
            }, function (error) {
                    // The token could not be validated.
                    return res.error({message:'The token could not be validated, please login correctly'});
            });
                    //End of Login with Token


});

Parse.Cloud.define('listOfUsers', function (req, res) {

     
        // Get From Login user http://localhost:1338/parse/login?username=uname&password=pwd
        var userToken = req.headers.usertoken;
        var arrayOfUsers = [];
        var result = {};
        var userToken = req.headers.usertoken;

        //Set Login User Token
        Parse.User.enableUnsafeCurrentUser();
        Parse.User.become(userToken).then(function (currentUser) {

                var emailFound = [];
                var emailNotFound = [];
                 var query = new Parse.Query(Parse.User);
                        query.find().then(function(items) {

                                            items.forEach(function(item){
                                                if(item.get('email')==undefined){
                                                    emailNotFound.push({id:item.id,username:item.get("username")});
                                                }else{
                                                    emailFound.push({id:item.id,username:item.get("username"),email:item.get("email"),phone:item.get("phone")});
                                                }
                                            });

                                            return {emailFound:emailFound,emailNotFound:emailNotFound};
                                    }
                            ).then(function(objects){
                                    
                                    var finalResult = [];
                                    //for()
                                    var ids = [];
                                    for(var i=0; i<objects.emailNotFound.length; i++){
                                        var item = objects.emailNotFound[i];
                                        ids.push(item.id);
                                    }

                                    // Get data with native's MongoDBS
                                     var promises = utilityModule.getUsersByIds(ids,function(records){
                                            // Merge Objects
                                            objects.emailFound.forEach(function(item){
                                                finalResult.push(item);
                                            });

                                            records.forEach(function(item){
                                                finalResult.push(item);
                                            });

                                            /** Responses */
                                             return res.success(finalResult);
                                    });
                            });


        }, function (error) {
                    // The token could not be validated.
                    return res.error({message:'The token could not be validated, please login correctly'});
        });
});

Parse.Cloud.define('testEmail',function(req,res){

        var transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                    type: 'OAuth2',
                    user: 'your_email@mail.com',
                    clientId: '{your_client_id_from_google}',
                    clientSecret: '{your_secret_from_google}',
                    refreshToken: '{refresh_token_from_google}',
                    accessToken: '{acces_token_from_google}',
                    expires: 1484314697598
            }
        });

  var mailOptions = {
        from: 'tru3.d3v@gmail.com', // sender address
        to: 'mmchs85@gmail.com', // list of receivers
        subject: 'Test email oAuth from Example', // Subject line
        text: 'this is some text', //, // plaintext body
        html: '<b>Hello oAuth ✔</b>' // You can choose to send an HTML body instead
    };

  transporter.sendMail(mailOptions, function(error, info){
    if(error){
        res.error(error);
    }else{
      res.success('Message sent: ' + info.response);
      
    };
  });

});

Parse.Cloud.define('resetPassword', function (req, res) {

        var email = req.params.email;

        Parse.User.requestPasswordReset(email, {
                success: function(response) {
                return res.success("Password reset request was sent successfully");
                    var anu = 0;
                },
                error: function(error) {
                    // Show the error message somewhere
                    return res.error("Error: " + error.code + " " + error.message);
                }
            });
});