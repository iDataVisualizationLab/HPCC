angular.module('hpccApp', [])
    .constant('hpcc', window.hpcc)
    .config(['$httpProvider', function($httpProvider) {
        $httpProvider.defaults.withCredentials = true;
    }])
    .constant('_', window._);