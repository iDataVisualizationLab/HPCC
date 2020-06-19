'use strict';

angular.module('hpccApp')
    .directive('layoutSelector', function(Modals) {
        return {
            templateUrl: 'src/script/angular/components/layouttable/layoutselector.html',
            restrict: 'E',
            replace: true,
            scope: {},
            link: function postLink(scope/*, element, attrs*/) {
                scope.loadLayout = function() {
                    Modals.open('layout-table');
                };
            }
        };
    });
