'use strict';

/**
 * @ngdoc directive
 * @name vlui.directive:pasteDataset
 * @description
 * # pasteDataset
 */
angular.module('hpccApp')
    .directive('ngIndeterminate', function($compile) {
        return {
            restrict: 'A',
            link: function(scope, element, attributes) {
                scope.$watch(attributes['ngIndeterminate'], function (value) {
                    element.prop('indeterminate', !!value);
                });
            }
        };
    });
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
                let inputState = [];
                Layout.data.groups.forEach(r=>{
                    const flat = _.flatten(r.value).filter(e=>e!==null);
                    r.total=flat.length;
                    r.selected=flat.filter(c=>!(Layout.data.hostsObj[c].notSelected||Layout.data.hostsObj[c].notExisted)).length;
                    inputState.push(r.selected);
                });
                scope.services = serviceFullList;
                scope.serviceSelected = serviceFullList[0];
                scope.data = {};
                d3.keys(Layout.data.hostsObj).forEach(h=>{
                    Layout.data.hostsObj[h].preselected = !Layout.data.hostsObj[h].notSelected;
                    scope.data[h] = {};
                    serviceFullList.forEach(s=>scope.data[h][s.text]=_.last(Dataset.data.sampleS[h][serviceListattr[s.idroot]])[s.id]);
                });
                scope.colorItem = Config.getConfig().colorScheme?Config.getConfig().colorScheme.copy():d3.scaleSequential();
                scope.colorItem.domain(scope.serviceSelected.range.slice().reverse());
                const colorItem = function(d){
                    if (d)
                        return scope.colorItem(d);
                    else
                        return '#afafaf';
                };
                scope.onSelect = function(c,event,rack){
                    event.stopPropagation();
                    if (Layout.data.hostsObj[c].preselected)
                        rack.selected--;
                    else
                        rack.selected++;
                    Layout.data.hostsObj[c].preselected = !Layout.data.hostsObj[c].preselected
                };
                scope.onSelectAll = function(event,rack){
                    event.stopPropagation();
                    if (rack.selected===rack.total){
                        d3.keys(Layout.data.hostsObj).forEach(c=>Layout.data.hostsObj[c].preselected = false);
                        rack.selected = 0;
                    }else{
                        d3.keys(Layout.data.hostsObj).forEach(c=>Layout.data.hostsObj[c].preselected = true);
                        rack.selected = rack.total;
                    }
                };
                scope.reset = function(){
                    Layout.data.groups.forEach((r,i)=>{
                        r.selected=inputState[i];
                        d3.keys(Layout.data.hostsObj).forEach(h=> {
                            Layout.data.hostsObj[h].preselected = !Layout.data.hostsObj[h].notSelected;
                        })
                    });
                };
                scope.apply = function(){
                    Layout.updateHost();
                    closeModal();
                };
                scope.serviceWatcher = function() {
                    scope.serviceSelected = this.serviceSelected;
                    this.colorItem.domain(this.serviceSelected.range.slice().reverse());
                    // updateNodes();
                };


            }
        };
    });
