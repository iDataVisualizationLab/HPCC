'use strict';

angular.module('hpccApp')
    .controller('MainCtrl', function($scope, $document, Dataset,$location, Config,Modals) {
        $scope.Dataset = Dataset;
        $scope.Modals = Modals;

        Dataset.update(Dataset.dataset).then(function() {
            Config.updateDataset(Dataset.dataset);

        })
    });