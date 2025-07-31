'use strict';

/**
 * @ngdoc directive
 * @name vlui.directive:tab
 * @description
 * # tab
 */
angular.module('hpccApp')
  .directive('tab', function() {
    return {
      templateUrl: 'src/script/angular/components/tabs/tab.html',
      restrict: 'E',
      require: '^^tabset',
      replace: true,
      transclude: true,
      scope: {
        heading: '@'
      },
      link: function(scope, element, attrs, tabsetController) {
        tabsetController.addTab(scope);
      }
    };
  });
