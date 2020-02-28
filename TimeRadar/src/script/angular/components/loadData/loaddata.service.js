'use strict';

angular.module('hpccApp')
.factory('Loaddata', function($timeout,Dataset,_, Config) {

    var Loaddata = {
        data:{}
    };
    let first = true;

    Loaddata.reset = function(hard) {
        Loaddata.data = Dataset.currentDataset;
    };
    function loadFile(){
        preloader(true);
        exit_warp();
        const choice = Loaddata.data;
        let loadclusterInfo = false;


            if (first||(db === 'csv'&& choice.category==='hpcc')) { //reload hostlist
                d3.json(srcpath+'data/hotslist_Quanah.json', function (error, data) {
                    if (error) {
                    } else {
                        firstTime = true;
                        hostList = data;
                        systemFormat();
                        inithostResults();
                        jobMap.hosts(hosts);
                        formatService(true);
                        MetricController.axisSchema(serviceFullList, true).update();
                    }
                });
                first = false;
            }

            dataInformation.filename = choice.name;
            if(choice.category==='hpcc')
                setTimeout(() => {
                    console.time("totalTime:");
                    d3.json(choice.url).on("progress", function(evt) {
                        dataInformation.size = evt.total;
                        console.log("Amount loaded: " + Math.round(evt.loaded/evt.total*100)+'%')
                    }).get(function(error,data) {
                            console.timeEnd("totalTime:");
                        if (error) {

                        }

                        d3.json(choice.url.replace(/(\w+).json|(\w+).csv/,'$1_job_compact.json'), function (error, job) {
                            if (error) {
                                loadata1(data, undefined);
                                return;
                            }
                            loadata1(data, job);
                            return;
                        });
                    });
                }, 0);
            else
                readFilecsv(choice.url,choice.separate)

        function loadata1(data,job){
            makedataworker();
            data['timespan'] = data.timespan.map(d=>new Date(d3.timeFormat('%a %b %d %X CDT %Y')(new Date(d.replace('Z','')))));
            _.without(Object.keys(data),'timespan').forEach(h=>{
                delete data[h].arrCPU_load;
                serviceLists.forEach((s,si)=>{
                    if (data[h][serviceListattr[si]])
                        data[h][serviceListattr[si]] = data.timespan.map((d,i)=>
                            data[h][serviceListattr[si]][i]? data[h][serviceListattr[si]][i].slice(0,s.sub.length):d3.range(0,s.sub.length).map(e=>null));
                    else
                        data[h][serviceListattr[si]] = data.timespan.map(d=>d3.range(0,s.sub.length).map(e=>null));
                })
            });
            updateDatainformation(data['timespan']);
            sampleS = data;
            if(job)
                sampleJobdata = job;
            else
                sampleJobdata = [{
                    jobID: "1",
                    name: "1",
                    nodes: hosts.map(h=>h.name),
                    startTime: new Date(_.last(sampleS.timespan)-100).toString(),
                    submitTime: new Date(_.last(sampleS.timespan)-100).toString(),
                    user: "dummyJob"
                }];
            if (choice.url.includes('influxdb')){
                processResult = processResult_influxdb;
                db = "influxdb";
                realTimesetting(false,"influxdb",true,sampleS);
            }else {
                db = "nagios";
                processResult = processResult_old;
                realTimesetting(false,undefined,true,sampleS);
            }
            d3.select(".currentDate")
                .text("" + (data['timespan'][0]).toDateString());

            let clusternum = (data['timespan'].length<50)?[5,7]:[6,8];
            loadPresetCluster(choice.url.replace(/(\w+).json|(\w+).csv/,'$1'),(status)=>{loadclusterInfo= status;
                if(loadclusterInfo){
                    handle_dataRaw();
                    initDataWorker();
                    if (!init)
                        resetRequest();
                    else
                        main();
                    preloader(false)
                }else {
                    recalculateCluster({
                        clusterMethod: 'leaderbin',
                        normMethod: 'l2',
                        bin: {startBinGridSize: 4, range: clusternum}
                    }, function () {
                        handle_dataRaw();
                        initDataWorker();
                        if (!init)
                            resetRequest();
                        else
                            main();
                        preloader(false)
                    });
                }

            });
        }
    }
    function loadPresetCluster(name,calback) {
        return d3.csv(`${name}_cluster.csv`, function (cluster) {
            if (cluster==null) {
                M.toast({html: 'Do not have preset major group information. Recalculate major groups'});
                if (calback) {
                    calback(false);// status
                }
            }else {
                updateClusterControlUI((cluster || []).length);
                cluster.forEach(d => {
                    d.radius = +d.radius;
                    d.mse = +d.mse;
                    d.__metrics = serviceFullList.map(s => {
                        return {
                            axis: s.text,
                            value: d3.scaleLinear().domain(s.range)(d[s.text]) || 0,
                            // minval:d3.scaleLinear().domain(s.range)(d[s.text+'_min'])||0,
                            // maxval:d3.scaleLinear().domain(s.range)(d[s.text+'_max'])||0,
                        }
                    });
                    d.__metrics.normalize = d.__metrics.map((e, i) => e.value);
                });
                cluster_info = cluster;
                clusterDescription = {};
                recomendName(cluster_info);
                recomendColor(cluster_info);
                if(calback){
                    calback(true);// status
                }
            }
        });
    }
    function readFilecsv(file,separate) {
        firstTime= true;
        exit_warp();
        preloader(true);
        setTimeout(() => {
            d3.csv(file).on("progress", function(evt) {
                dataInformation.size = evt.total;
                console.log("Amount loaded: " + Math.round(evt.loaded/evt.total*100)+'%')
            }).get(function (error, data) {
                if (error) {
                } else {
                    db = "csv";
                    newdatatoFormat_noSuggestion(data,separate);

                    inithostResults();
                    formatService(true);
                    processResult = processResult_csv;
                    makedataworker();
                    initDataWorker();
                    // addDatasetsOptions()
                    MetricController.axisSchema(serviceFullList, true).update();
                    realTimesetting(false, "csv", true, sampleS);
                    updateDatainformation(sampleS['timespan']);

                    sampleJobdata = [{
                        jobID: "1",
                        name: "1",
                        nodes: hosts.map(h=>h.name),
                        startTime: new Date(_.last(sampleS.timespan)-100).toString(),
                        submitTime: new Date(_.last(sampleS.timespan)-100).toString(),
                        user: "dummyJob"
                    }];

                    d3.select(".currentDate")
                        .text("" + (sampleS['timespan'][0]).toDateString());
                    updateClusterControlUI();
                    loadPresetCluster(file.replace(/(\w+).json|(\w+).csv/,'$1'),(status)=>{
                        let loadclusterInfo= status;
                        if (loadclusterInfo) {
                            handle_dataRaw();
                            if (!init)
                                resetRequest();
                            preloader(false);
                        }else {
                            recalculateCluster({
                                clusterMethod: 'leaderbin',
                                normMethod: 'l2',
                                bin: {startBinGridSize: 4, range: [7, 8]}
                            }, function () {
                                handle_dataRaw();
                                if (!init)
                                    resetRequest();
                                preloader(false);
                            });
                        }})

                }
            })
        }, 0);
    }
    Loaddata.reset();
    Dataset.onUpdateFinish.push(function() {
        Loaddata.reset(true);
        console.log(Dataset.currentDataset);
        if (Loaddata.data.name)
            loadFile(Dataset.currentDataset);
    });
    return Loaddata;
})
