(function(){

    'use strict';

angular.module('myModule').controller('MyFormCtrl', 
function MyFormCtrl($scope) {
    var vm = this; // vm stands for "View Model" --> see https://github.com/johnpapa/angular-styleguide#controlleras-with-vm
    vm.user = {};
    vm.userRegistration = {};
    vm.tokenUser = '{Your Token Login}';
  

  $scope.vm.userFields = [
    {
      // the key to be used in the model values
      // so this will be bound to vm.user.username
      key: 'username',
      type: 'input',
      templateOptions: {
        label: 'Username',
        placeholder: 'johndoe',
        required: true
      }
    },
    {
      key: 'password',
      type: 'input',
      templateOptions: {
        type: 'password',
        label: 'Password',
        required: true
      },
      expressionProperties: {
        'templateOptions.disabled': '!model.username' // disabled when username is blank
      }
    }
  ];
  
  

  $scope.vm.createUserFields = [
    {
      // the key to be used in the model values
      // so this will be bound to vm.user.username
      key: 'username',
      type: 'input',
      templateOptions: {
        label: 'Username',
        placeholder: 'johndoe',
        required: true
      }
    },
    {
      key: 'password',
      type: 'input',
      templateOptions: {
        type: 'password',
        label: 'Password',
        required: true
      },
      expressionProperties: {
        'templateOptions.disabled': '!model.username' // disabled when username is blank
      }
    },
     {
      // the key to be used in the model values
      // so this will be bound to vm.user.username
      key: 'email',
      type: 'input',
      templateOptions: {
        label: 'eMail',
        placeholder: 'email@mail.com',
        required: true
      }
    },
    {
      // the key to be used in the model values
      // so this will be bound to vm.user.username
      key: 'phone',
      type: 'input',
      templateOptions: {
        label: 'phone',
        placeholder: '09867565',
        required: true
      }
    }
  ];


  vm.onCreateRoleSuperAdmin=function(){

  };

 vm.onCreateSuperAdmin=function(){

  };

  vm.onCreateUserSuperAdmin=function(){

  };

  vm.onLogin = function() {
        console.log('form submitted:', vm.user);
  }

  vm.onSubmitCreateUser = function(){
        console.log(vm.userRegistration);
  };
  
  
  
 
});

})();