'use strict';

/**
 * @ngdoc directive
 * @name vlui.directive:pasteDataset
 * @description
 * # pasteDataset
 */
angular.module('hpccApp')
    .directive('layoutDisplay', function (Layout,Dataset, Config, _) {
        return {
            templateUrl: 'src/script/angular/components/layouttable/layoutdisplay.html',
            restrict: 'E',
            require: '?^^modal',
            replace: true,
            scope: true,
            link: function postLink(scope, element, attrs, modalController) {
                // If this directive occurs within a a modal, give ourselves a way to close
                // that modal once the add button has been clicked
                function closeModal() {
                    if (modalController) {
                        modalController.close();
                    }
                }
                scope.Layout = Layout;
                Layout.data.groups.forEach(r=>{
                    const flat = _.flatten(r.value).filter(e=>e!==null);
                    r.total=flat.length;
                    r.selected=flat.filter(c=>!(Layout.data.hostsObj[c].notSelected||Layout.data.hostsObj[c].notExisted)).length;
                })
                // Initialize scope variables
                // scope.dataset = {
                //     name: '',
                //     data: '',
                //     sampletext:'',
                //     column:0,
                //     row:0,
                // };
                //
                //
                // scope.addDataset = function() {
                //     var data = d3.csvParse(scope.dataset.data);
                //
                //     var pastedDataset = {
                //         id: Date.now(),  // time as id
                //         name: scope.dataset.name,
                //         values: data,
                //         group: 'pasted'
                //     };
                //
                //     // Log that we have pasted data
                //
                //
                //     // Register the pasted data as a new dataset
                //     Dataset.dataset = Dataset.add(pastedDataset);
                //
                //     // Activate the newly-registered dataset
                //     Dataset.update(Dataset.dataset);
                //
                //     // Close this directive's containing modal
                //     closeModal();
                // };
            }
        };
    });
