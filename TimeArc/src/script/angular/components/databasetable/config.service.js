'use strict';

// Service for the spec config.
// We keep this separate so that changes are kept even if the spec changes.
angular.module('hpccApp')
  .factory('Config', function() {
    var Config = {};

    Config.data = {};
    Config.layout = {};
    Config.config = {};


    Config.getConfig = function() {
      return Config.config;
    };

    Config.updateConfig = function(config){
        for (let i in config) {
            if ('undefined' !== typeof config[i]) {
                Config.config[i] = config[i];
            }
        }
    };

    Config.getData = function() {
      return Config.data;
    };

      Config.getLayout = function() {
          return Config.layout;
      };

    Config.updateDataset = function(dataset, type) {
      if (dataset.values) {
        Config.data.values = dataset.values;
        delete Config.data.url;
        Config.data.formatType = undefined;
      } else {
        Config.data.url = dataset.url;
        delete Config.data.values;
        Config.data.formatType = type;
      }
    };

      Config.updateLayout = function(layout, type) {
          if (layout.values) {
              Config.layout.values = layout.values;
              delete Config.layout.url;
              Config.layout.formatType = undefined;
          } else {
              Config.layout.url = layout.url;
              delete Config.layout.values;
              Config.layout.formatType = type;
          }
      };

    return Config;
  });
