'use strict';

/**
 * @ngdoc directive
 * @name vlui.directive:pasteDataset
 * @description
 * # pasteDataset
 */
angular.module('hpccApp')
  .directive('pasteDataset', function (Dataset, Config, _) {
    return {
      templateUrl: 'src/script/angular/components/databasetable/pastedataset.html',
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

        // Initialize scope variables
        scope.dataset = {
          name: '',
          data: '',
          sampletext:'',
          column:0,
          row:0,
          sheetName:[],
          selectedOption:0
        };


        scope.addDataset = function() {
          if (scope.dataset.type === 'xlsx') {
            data = XLSX.utils.sheet_to_json(scope.dataset.wb.Sheets[scope.dataset.selectedOption]);
          } else if(scope.dataset.type === 'json') {
            debugger
            var data = JSON.parse(scope.dataset.data);
            // if (d3.keys(data[0]).length === 1)
            //   data = d3.tsvParse(scope.dataset.data);
          }else {
            var data = d3.csvParse(scope.dataset.data);
            if (d3.keys(data[0]).length === 1)
              data = d3.tsvParse(scope.dataset.data);
          }
          var pastedDataset = {
            id: Date.now(),  // time as id
            name: scope.dataset.name,
            values: data,
            group: 'pasted'
          };

          // Log that we have pasted data


          // Register the pasted data as a new dataset
          Dataset.dataset = Dataset.add(pastedDataset);

          // Activate the newly-registered dataset
          Dataset.update(Dataset.dataset);

          // Close this directive's containing modal
          closeModal();
        }
      }
    };
  });
