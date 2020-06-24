'use strict';

angular.module('hpccApp')
    .controller('MainCtrl', function($scope, $document, Dataset,Layout,$location, Config,Modals,Loaddata) {
        $scope.Dataset = Dataset;
        $scope.Layout = Layout;
        $scope.Modals = Modals;
        $scope.Loaddata = Loaddata;

        Config.updateConfig({colorScheme:d3.scaleSequential()
                .interpolator(d3.interpolateSpectral)})

        Dataset.update(Dataset.dataset).then(function() {
            Config.updateDataset(Dataset.dataset);
            console.log(Dataset.currentDataset.name)
        });
        Layout.update(Layout.dataset).then(function() {
            Config.updateDataset(Layout.dataset);
        });

    });
