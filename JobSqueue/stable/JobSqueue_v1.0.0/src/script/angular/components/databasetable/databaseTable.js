'use strict';

/**
 * @ngdoc directive
 * @name hpccApp.directive:datasetModal
 * @description
 * # datasetModal
 */
angular.module('hpccApp')
    .directive('databaseTable', function () {
        return {
            templateUrl: 'src/script/angular/components/databasetable/databaseTable.html',
            restrict: 'E',
            scope: false
        };
    });