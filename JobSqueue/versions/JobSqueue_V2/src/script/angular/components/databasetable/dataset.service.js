'use strict';
/* global console */
/* global d3 */
angular.module('hpccApp')
    .factory('Dataset', function ($http, $q, _, SampleData, Config) {
        var Dataset = {};
        var now = new Date();
        Dataset.fromTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        Dataset.toTime = now;

        // Start with the list of sample datasets
        var datasets = SampleData;

        Dataset.datasets = datasets;
        // Dataset.dataset = datasets[7];
        Dataset.dataset = datasets[0];
        Dataset.currentDataset = undefined; // dataset before update
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

        Dataset.fieldOrderBy.type = function (fieldDef) {
            if (fieldDef.aggregate === 'count') return 4;
            return typeOrder[fieldDef.type];
        };

        Dataset.fieldOrderBy.typeThenName = function (fieldDef) {
            return Dataset.fieldOrderBy.type(fieldDef) + '_' +
                (fieldDef.aggregate === 'count' ? '~' : fieldDef.field.toLowerCase());
            // ~ is the last character in ASCII
        };

        Dataset.fieldOrderBy.original = function () {
            return 0; // no swap will occur
        };

        Dataset.fieldOrderBy.field = function (fieldDef) {
            return fieldDef.field;
        };

        Dataset.fieldOrder = Dataset.fieldOrderBy.typeThenName;

        // update the schema and stats
        Dataset.onUpdate = [];
        Dataset.onUpdateFinish = [];

        Dataset.update = function (dataset) {
            var updatePromise;
            if (Dataset.timer) {
                Dataset.timer.stop();
                delete Dataset.timer;
            }

            function requestUpdate() {
                if ((!dataset.repeat) && dataset.values) {
                    updatePromise = $q(function (resolve, reject) {
                        // jshint unused:false
                        Dataset.type = undefined;
                        updateFromData(dataset, dataset.values);
                        resolve();
                    });
                } else {

                    if (dataset.type === 'xlsx') {
                        updatePromise = $http({
                            method: 'GET',
                            url: dataset.url,
                            responseType: 'arraybuffer'
                        }).then(function (datain) {
                            var wb = XLSX.read(datain.data, {
                                type: "array"
                            });
                            dataset.values = XLSX.utils.sheet_to_json(wb.Sheets[dataset.selectedOption]);
                            updateFromData(dataset, dataset.values);
                        });
                    } else if (dataset.type === 'csv') {
                        updatePromise = $http.get(dataset.url, {
                            cache: true
                        }).then(function (response) {
                            var data;

                            // first see whether the data is JSON, otherwise try to parse CSV
                            if (_.isObject(response.data)) {
                                data = response.data;
                                Dataset.type = 'json';
                            } else {
                                data = d3.csvParse(scope.dataset.data);
                                if (d3.keys(data[0]).length === 1)
                                    data = d3.tsvParse(scope.dataset.data);
                                Dataset.type = 'csv';
                            }
                            updateFromData(dataset, data);
                        });

                    } else if (dataset.type === 'json') {
                        // debugger
                        updatePromise = d3.json(dataset.url).then(function (response) {
                            var data;
                            // first see whether the data is JSON, otherwise try to parse CSV
                            if (_.isObject(response)) {
                                data = response;
                                Dataset.type = 'json';
                            }
                            dataset.values = data;
                            console.log(data);
                            updateFromData(dataset, data);
                        });
                    } else {
                        // console.log(Dataset.fromTime, Dataset.toTime)
                        function transformJobsToQueueStatus(jobDetails) {
                            const formatSecondsToHHMMSS = (seconds) => {
                                const h = Math.floor(seconds / 3600);
                                const m = Math.floor((seconds % 3600) / 60);
                                const s = seconds % 60;
                                return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
                            };

                            const now = Math.floor(Date.now() / 1000);

                            const queue_status = jobDetails.map(job => {
                                // const now = Math.floor(Date.now() / 1000);
                                const jobState = (job.job_state && job.job_state[0]) || "UNKNOWN";
                                const submitTime = job.submit_time || 0;
                                const startTime = job.start_time || submitTime;
                                const endTime = job.end_time || now;
                                const timeLimitSec = (job.time_limit || 0) * 60;

                                let elapsedTime;
                                if (["RUNNING", "PENDING"].includes(jobState)) {
                                    elapsedTime = now - startTime;
                                } else if (["COMPLETED", "FAILED", "CANCELLED", "OUT_OF_MEMORY", "TIMEOUT"].includes(jobState)) {
                                    elapsedTime = endTime - startTime;
                                } else {
                                    elapsedTime = 0; // fallback
                                }

                                const remaining = timeLimitSec - elapsedTime;

                                return {
                                    ARRAY_JOB_ID: String(job.array_job_id || job.job_id || ''),
                                    CPUS: job.cpus || (job.cpus_per_task || 1) * (job.tasks || 1),
                                    JOBID: String(job.job_id || ''),
                                    MIN_MEMORY: job.memory_per_node ? `${Math.floor(job.memory_per_node / 1024)}M` : "0M",
                                    NAME: job.name || '',
                                    NODELIST: job.nodes || [],
                                    PARTITION: job.partition || '',
                                    START_TIME: startTime,
                                    STATE: jobState,
                                    SUBMIT_TIME: submitTime,
                                    TIME: formatSecondsToHHMMSS(elapsedTime),
                                    TIME_LEFT: jobState === "RUNNING" && timeLimitSec > 0 && remaining > 0 ?
                                        `${Math.floor(remaining / 86400)}-${formatSecondsToHHMMSS(remaining % 86400)}` :
                                        "INVALID",
                                    USER: job.user_name || ''
                                };
                            });

                            return {
                                queue_status,
                                timestamp: now
                            };
                        }

                        updatePromise = $http.post(dataset.url, {
                            start: d3.timeFormat("%Y-%m-%d %H:%M:%S%Z")(Dataset.fromTime),
                            end: d3.timeFormat("%Y-%m-%d %H:%M:%S%Z")(Dataset.toTime),
                            interval: "5m",
                            aggregation: "max",
                            nodelist: "10.101.93.[1-8]",
                            metrics: ["Jobs_Info"],
                            compression: false
                        }).then(function (response) {
                            var data = response.data;
                            Dataset.type = 'json';
                            dataset.values = transformJobsToQueueStatus(data.job_details)
                            // dataset.values = data;
                            console.log("Fetched data:", dataset.values);
                            updateFromData(dataset, data);
                        });
                    }

                }

                Dataset.onUpdate.forEach(function (listener) {
                    updatePromise = updatePromise.then(listener);
                });

                // Copy the dataset into the config service once it is ready
                updatePromise = updatePromise.then(function () {
                    Config.updateDataset(dataset, Dataset.type);
                });

                Dataset.onUpdateFinish.forEach(function (listener) {
                    updatePromise = updatePromise.then(listener);
                });
                return updatePromise
            }
            if (dataset.repeat) {
                updatePromise = requestUpdate();
                Dataset.timer = d3.interval(requestUpdate, dataset.repeat)
            } else {
                updatePromise = requestUpdate();
            }

            return updatePromise;
        };


        function updateFromData(dataset, data) {
            Dataset.data = data;
            Dataset.currentDataset = dataset;

            // TODO: find all reference of Dataset.stats.sample and replace
        }

        Dataset.add = function (dataset) {
            if (!dataset.id) {
                dataset.id = dataset.url;
            }
            datasets.push(dataset);

            return dataset;
        };

        return Dataset;
    });