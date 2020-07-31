'use strict';

/**
 * @ngdoc directive
 * @name vlui.directive:pasteDataset
 * @description
 * # pasteDataset
 */
angular.module('hpccApp')
    .directive('loadUrl', function (Dataset, Config, _) {
        return {
            templateUrl: 'src/script/angular/components/databasetable/loadurl.html',
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
                    url:'',
                    data: '',
                    sampletext:'',
                    column:0,
                    row:0,
                };
                scope.url = {
                    start:'2020-07-27T12:00:00-05:00',
                    end:'2020-07-28T12:00:00-05:00',
                    interval:'5m',
                    value:'max',
                    compress:'true'
                }

                scope.addDataset = function() {
                    scope.dataset.url = `https://influx.ttu.edu:8080/v1/metrics?start=${scope.url.start}&end=${scope.url.end}&interval=${scope.url.interval}&value=${scope.url.value}&compress=${scope.url.compress}`
                    // https://influx.ttu.edu:8080/v1/metrics?start=2020-02-14T12%3A00%3A00-05%3A00&end=2020-02-14T18%3A00%3A00-05%3A00&interval=5m&value=max&compress=true
                    d3.json(scope.dataset.url,(response)=> {
                        Object.keys(response).forEach(k => response[k] = JSON.parse(pako.inflate(base64ToArrayBuffer(response[k]['base64(zip(o))']), {to: 'string'})));
                        let data=handleDataUrl(response)
                        scope.dataset.data = data.sampleS;
                        scope.dataset.jobdata = data.jobS;
                        var pastedDataset = {
                            id: Date.now(),  // time as id
                            name: `HPC-${scope.url.start}-${scope.url.end}-${scope.url.interval}`,
                            values: scope.dataset.data,
                            jobs: scope.dataset.jobdata,
                            url:scope.dataset.url,
                            category:'hpcc',
                            group: 'url'
                        };

                        // Register the pasted data as a new dataset
                        Dataset.dataset = Dataset.add(pastedDataset);

                        // Activate the newly-registered dataset
                        Dataset.update(Dataset.dataset);

                        // Close this directive's containing modal
                        closeModal();
                    });
                };
                function base64ToArrayBuffer(base64) {
                    var binaryString = window.atob(base64);
                    var binaryLen = binaryString.length;
                    var bytes = new Uint8Array(binaryLen);
                    for (var i = 0; i < binaryLen; i++) {
                        var ascii = binaryString.charCodeAt(i);
                        bytes[i] = ascii;
                    }
                    return bytes;
                }
                function handleDataUrl(dataRaw) {
                    let hosts = d3.keys(dataRaw.nodes_info).map(ip=>{
                        return {
                            ip: ip,
                            name: `compute-${ip.split('.')[2]}-${ip.split('.')[3]}`,
                        }
                    })
                    // hosts.forEach(d=>d.ip = `10.101.${d.hpcc_rack}.${d.hpcc_node}`);
                    let jobjson = dataRaw.jobs_info;
                    let jobo = {};
                    let jobd = [];
                    for (let jobID in jobjson) {
                        let d = jobjson[jobID];
                        // d.node_list = JSON.parse(d.node_list.replace(/'/g,'"'));
                        let temp = {
                            "nodes": d.node_list.map(ip=>hosts.find(d=>d.ip===ip.split('-')[0]).name),
                            "jobID": ""+jobID,
                            "user": d.user_name,
                            "startTime": d.start_time/1000000,
                            "submitTime": d.submit_time/1000000
                        };
                        if (d['finish_time'])
                            temp.endTime = d['finish_time']/1000000;
                        jobo[jobID] = temp;
                        jobd.push(jobo[jobID]);
                    }


                    // var alternative_service = ["CPU1_Temp", "CPU2_Temp", "Inlet_Temp", "Memory_Usage", "Fan_1_Speed", "Fan_2_Speed", "Fan_3_Speed", "Fan_4_Speed", "Power_Usage"];
                    // var alternative_service = ["cpu_inl_temp","cpu_usage", "memory_usage", "fan_speed", "power_usage"];
                    var alternative_service = ["cpu_inl_temp", "memory_usage", "fan_speed", "power_usage"];
                    var alternative_scale = [1,0.5,1,0.5];

                    var sampleh = {};
                    var ser = serviceListattr.slice();
                    ser.pop();

                    let data = dataRaw.nodes_info;
                    sampleh.timespan = dataRaw.time_stamp.map(d=>d/1000000);
                    hosts.forEach(h => {
                        sampleh[h.name] = {};
                        ser.forEach(s => sampleh[h.name][s] = []);
                        alternative_service.forEach((sa, si) => {
                            var scale = alternative_scale[si];
                            sampleh.timespan.forEach((dt, ti) => {
                                let value = _.isArray(data[h.ip][sa][ti])?data[h.ip][sa][ti].map(d=>d===""?null:((+d) * scale)):[(data[h.ip][sa][ti]===""?null:((+data[h.ip][sa][ti]) * scale))];
                                let arrID = serviceListattr[si];
                                sampleh[h.name][arrID][ti] = value;
                            })
                        })
                    });

                    jobd = jobd.filter(d=>d.nodes.length);
                    // DEBUGING
                    // console.log(dataRaw.nodesInfo['10.101.7.59']);
                    // console.log(jobd.filter(j=>j['jobID']==='1126680'));
                    // DEBUGING
                    return{sampleS:sampleh,jobS:jobd};
                }
            }
        };
    });
