'use strict';

/**
 * @ngdoc directive
 * @name hpccApp.directive:datasetModal
 * @description
 * # datasetModal
 */
angular.module('hpccApp')
    .directive('layoutTable', function () {
        return {
            templateUrl: 'src/script/angular/components/layouttable/layoutTable.html',
            restrict: 'E',
            scope: false
        };
    });
