'use strict';

/**
 * @ngdoc directive
 * @name vlui.directive:fileDropzone
 * @description
 * # fileDropzone
 */
angular.module('hpccApp')
  // Add the file reader as a named dependency
  .constant('FileReader', window.FileReader)
  .directive('fileDropzone', function (Modals, FileReader,$http) {

    // Helper methods

    function isSizeValid(size, maxSize) {
      // Size is provided in bytes; maxSize is provided in megabytes
      // Coerce maxSize to a number in case it comes in as a string,
      // & return true when max file size was not specified, is empty,
      // or is sufficiently large
      return !maxSize || ( size / 1024 / 1024 < +maxSize );
    }

    function isTypeValid(type, validMimeTypes) {
        console.log(type)
        // If no mime type restrictions were provided, or the provided file's
        // type is whitelisted, type is valid
      return !validMimeTypes || ( validMimeTypes.indexOf(type) > -1 );
    }

    return {
      templateUrl: 'src/script/angular/components/databasetable/filedropzone.html',
      replace: true,
      restrict: 'E',
      // Permit arbitrary child content
      transclude: true,
      scope: {
        maxFileSize: '@',
        validMimeTypes: '@',
        // Expose this directive's dataset property to parent scopes through
        // two-way databinding
        dataset: '='
      },
      link: function (scope, element/*, attrs*/) {
        scope.dataset = scope.dataset || {};

        element.on('dragover dragenter', function onDragEnter(event) {
          if (event) {
            event.preventDefault();
          }
          event.originalEvent.dataTransfer.effectAllowed = 'copy';
        });

        function readFile(file) {
            preloader(true, 0,"Add data....");
          if (!isTypeValid(file.type, scope.validMimeTypes)) {
            scope.$apply(function() {
                preloader(false);
                M.toast({html: 'Invalid file type. File must be one of following types: ' + scope.validMimeTypes});
            });
            return;
          }
          if (!isSizeValid(file.size, scope.maxFileSize)) {
            scope.$apply(function() {
                preloader(false);
                M.toast({html: 'File must be smaller than ' + scope.maxFileSize + ' MB'});
            });

            return;
          }
          console.log(file.type)
            if (file.type === "application/json"){
                var reader = new FileReader();
                reader.onload = function(evt) {
                    return scope.$apply(function (scope) {
                        scope.dataset.data = evt.target.result;
                        // Strip file name extensions from the uploaded data
                        scope.dataset.name = file.name.replace(/\.\w+$/, '');
                        scope.dataset.type = 'json';
                    });
                };
                reader.readAsText(file);
            }else if(file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"){
                var reader = new FileReader();
                reader.onload = function(evt) {
                    return scope.$apply(function (scope) {
                        var wb = XLSX.read( evt.target.result, {type:"array"});
                        scope.dataset.wb = wb;
                        scope.dataset.sheetName = wb.SheetNames;
                        scope.dataset.selectedOption = wb.SheetNames[0];
                        // XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[3]]);
                        // Strip file name extensions from the uploaded data
                        scope.dataset.name = file.name.replace(/\.\w+$/, '');
                        scope.dataset.type = 'xlsx';
                    });
                };
                reader.readAsArrayBuffer(file);
            }else {
                var reader = new FileReader();

                reader.onload = function (evt) {
                    return scope.$apply(function (scope) {
                        scope.dataset.data = evt.target.result;
                        scope.dataset.size = evt.loaded;
                        // scope.dataset.sampletext = scope.dataset.data.slice(0,1000);
                        // scope.dataset.sampletext = scope.dataset.data.split('\n').slice([0,1]).join('\n');
                        const dataTemp = scope.dataset.data.split('\n');
                        scope.dataset.column = dataTemp[0].split(',').length;
                        if (scope.dataset.column===1){
                            scope.dataset.column = dataTemp[0].split('\t').length;
                        }
                        scope.dataset.row = dataTemp.length;
                        // Strip file name extensions from the uploaded data
                        scope.dataset.name = file.name.replace(/\.\w+$/, '');
                    });
                };

                reader.onerror = function () {
                    console.log('Error reading file');
                };

                reader.readAsText(file);
            }
        }

        element.on('drop', function onDrop(event) {
          if (event) {
            event.preventDefault();
          }

          readFile(event.originalEvent.dataTransfer.files[0]);
        });

        element.find('input[type="file"]').on('change', function onUpload(/*event*/) {
          // "this" is the input element
          readFile(this.files[0]);
        });
      }

    };
  });
