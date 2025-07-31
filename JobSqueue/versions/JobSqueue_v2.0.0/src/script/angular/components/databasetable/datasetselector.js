'use strict';

angular.module('hpccApp')
  .directive('datasetSelector', function(Modals) {
    return {
      templateUrl: 'src/script/angular/components/databasetable/datasetselector.html',
      restrict: 'E',
      replace: true,
      scope: {},
      link: function postLink(scope/*, element, attrs*/) {
        scope.loadDataset = function() {
          Modals.open('database-table');
        };
      }
    };
  });
