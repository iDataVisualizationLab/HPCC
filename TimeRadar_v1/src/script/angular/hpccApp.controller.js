'use strict';

angular.module('hpccApp')
    .controller('MainCtrl', function($scope, $document, Dataset,$location, Config,Modals,Loaddata) {
        $scope.Dataset = Dataset;
        $scope.Modals = Modals;
        $scope.Loaddata = Loaddata;

        Dataset.update(Dataset.dataset).then(function() {
            Config.updateDataset(Dataset.dataset);
            console.log(Dataset.currentDataset.name)
        })
    });