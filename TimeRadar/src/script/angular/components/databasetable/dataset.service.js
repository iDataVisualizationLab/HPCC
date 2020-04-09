'use strict';

angular.module('hpccApp')
  .factory('Dataset', function($http, $q, _, SampleData, Config) {
    var Dataset = {};

    // Start with the list of sample datasets
    var datasets = SampleData;

    Dataset.datasets = datasets;
    // Dataset.dataset = datasets[7];
    Dataset.dataset = datasets[7];
    Dataset.currentDataset = undefined;  // dataset before update
    Dataset.stats = {};
    Dataset.type = undefined;

    var typeOrder = {
      nominal: 0,
      ordinal: 0,
      geographic: 2,
      temporal: 3,
      quantitative: 4
    };

    Dataset.fieldOrderBy = {};

    Dataset.fieldOrderBy.type = function(fieldDef) {
      if (fieldDef.aggregate==='count') return 4;
      return typeOrder[fieldDef.type];
    };

    Dataset.fieldOrderBy.typeThenName = function(fieldDef) {
      return Dataset.fieldOrderBy.type(fieldDef) + '_' +
        (fieldDef.aggregate === 'count' ? '~' : fieldDef.field.toLowerCase());
        // ~ is the last character in ASCII
    };

    Dataset.fieldOrderBy.original = function() {
      return 0; // no swap will occur
    };

    Dataset.fieldOrderBy.field = function(fieldDef) {
      return fieldDef.field;
    };

    Dataset.fieldOrder = Dataset.fieldOrderBy.typeThenName;

    // update the schema and stats
    Dataset.onUpdate = [];
    Dataset.onUpdateFinish = [];

    Dataset.update = function(dataset) {
      var updatePromise;

      if (dataset.values) {
        updatePromise = $q(function(resolve, reject) {
          // jshint unused:false
          Dataset.type = undefined;
          updateFromData(dataset, dataset.values);
          resolve();
        });
      } else {
        updatePromise = new Promise(function(resolve, reject){
            resolve(updateFromData(dataset, []));
        }).then();
          // console.time('request time')
          // fetch('http://129.118.104.141:8080/v1/metrics?start=2020-02-14T12%3A00%3A00%2B00%3A00&end=2020-02-14T18%3A00%3A00%2B00%3A00&interval=5m&value=max').then(d=>d.json()).then(response => {
          //     console.timeEnd('request time')
          //     console.time('encode time')
          //     Object.keys(response).forEach(k=>
          //         response[k] =JSON.parse(pako.inflate(base64ToBuffer(response[k]['base64(zip(o))']), { to: 'string' })))
          //     console.timeEnd('encode time')
          //     console.log(response)
          // })

        //     $http.get(dataset.url, {cache: true}).then(function(response) {
        //   var data;
        //
        //   // first see whether the data is JSON, otherwise try to parse CSV
        //   if (_.isObject(response.data)) {
        //      data = response.data;
        //      Dataset.type = 'json';
        //   }
        //   // else {
        //   //     // read file
        //   //   data = util.read(response.data, {type: 'csv'});
        //   //   Dataset.type = 'csv';
        //   // }
        //
        //   updateFromData(dataset, data);
        // });
      }

      Dataset.onUpdate.forEach(function(listener) {
        updatePromise = updatePromise.then(listener);
      });

      // Copy the dataset into the config service once it is ready
        updatePromise = updatePromise.then(function() {
        Config.updateDataset(dataset, Dataset.type);
      });

      Dataset.onUpdateFinish.forEach(function(listener) {
            updatePromise = updatePromise.then(listener);
      });

      return updatePromise;
    };

    function base64ToBuffer(str){
      str = window.atob(str); // creates a ASCII string
      var buffer = new ArrayBuffer(str.length),
          view = new Uint8Array(buffer);
      for(var i = 0; i < str.length; i++){
          view[i] = str.charCodeAt(i);
      }
      return buffer;
    }
    function updateFromData(dataset, data) {
      Dataset.data = data;
      Dataset.currentDataset = dataset;

      // TODO: find all reference of Dataset.stats.sample and replace
    }

    Dataset.add = function(dataset) {
      if (!dataset.id) {
        dataset.id = dataset.url;
      }
      datasets.push(dataset);

      return dataset;
    };

    return Dataset;
  });
