'use strict';

angular.module('hpccApp')
    .factory('Layout', function($http, $q, _, SampleLayout, Config) {
        var Layout = {};

        // Start with the list of sample datasets
        var layoutsets = SampleLayout;

        Layout.layoutsets = layoutsets;
        // Dataset.dataset = layoutsets[7];
        Layout.dataset = layoutsets[0];
        Layout.currentLayout = undefined;  // dataset before update
        Layout.stats = {};
        Layout.type = undefined;


        // update the schema and stats
        Layout.onUpdate = [];
        Layout.onUpdateFinish = [];
        Layout.update = function(dataset) {
            var updatePromise;

            if (dataset.values) {
                updatePromise = $q(function(resolve, reject) {
                    // jshint unused:false
                    Layout.type = undefined;
                    updateFromData(dataset, dataset.values);
                    resolve();
                });
            } else {
                updatePromise = new Promise(function(resolve, reject){
                    d3.csv(dataset.url,function(d){
                        d.forEach(e=>e.value = JSON.parse(e.value.replace(/'/g,'"')));
                        const data = {groups:d,hosts:[],hostsObj:{}};
                        d.forEach(e=>_.flatten(e.value).filter(c=>c!=null).forEach(c=>data.hostsObj[c]={}));
                        d3.keys(data.hostsObj).forEach((k,i)=>{
                            data.hosts.push({name:k, index: i})
                        });
                        resolve(updateFromData(dataset, data))
                    });
                }).then();
            }

            Layout.onUpdate.forEach(function(listener) {
                updatePromise = updatePromise.then(listener);
            });

            // Copy the dataset into the config service once it is ready
            updatePromise = updatePromise.then(function() {
                Config.updateLayout(dataset, Layout.type);
            });

            Layout.onUpdateFinish.forEach(function(listener) {
                updatePromise = updatePromise.then(listener);
            });

            return updatePromise;
        };
        Layout.onUpdateHostFinish = [];
        Layout.updateHost = function() {
            var updatePromise;
            updatePromise = new Promise(function(resolve, reject){
                d3.keys(Layout.data.hostsObj).forEach(k=>{
                    Layout.data.hostsObj[k].notSelected = !Layout.data.hostsObj[k].preselected;
                });
                resolve()
            });
            Layout.onUpdateHostFinish.forEach(function(listener) {
                updatePromise = updatePromise.then(listener);
            });
        }
        function updateFromData(dataset, data) {
            Layout.data = data;
            Layout.currentLayout = dataset;

        }

        Layout.add = function(dataset) {
            if (!dataset.id) {
                dataset.id = dataset.url;
            }
            layoutsets.push(dataset);

            return dataset;
        };

        return Layout;
    });
