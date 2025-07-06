'use strict';

/**
 * @ngdoc directive
 * @name hpcc.directive:modalCloseButton
 * @description
 * # modalCloseButton
 */
angular.module('hpccApp')
  .directive('modalCloseButton', function() {
    return {
      templateUrl: 'src/script/angular/components/modal/modalclosebutton.html',
      restrict: 'E',
      require: '^^modal',
      scope: {
        closeAction: '&'
      },
      link: function(scope, element, attrs, modalController) {
        scope.closeModal = function() {
          modalController.close();
          if (scope.closeAction) {
            scope.closeAction();
          }
        };
      }
    };
  });
