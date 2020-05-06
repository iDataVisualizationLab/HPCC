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
    $('#clusterInfo_input_file').on('input',(evt)=>{
        let f = evt.target.files[0];
        var reader = new FileReader();
        reader.onload = (function (theFile) {
            return function (e) {

                loadPresetCluster(e.target.result, (status) => {
                    if (status) {
                        handle_dataRaw();
                        try {
                            initDataWorker();
                        }catch(e){
                            console.log(e)
                        }
                        if (!init)
                            resetRequest();
                        else
                            main();
                        preloader(false)
                    }
                    firstTime = false;
                })
            }
        })(f);

        reader.readAsDataURL(f);
    });
    $('#loadClusterInfobtn').on('click',()=>$('#clusterInfo_input_file').trigger('click'));
    function loadFile(){
        preloader(true);
        exit_warp();
        const choice = Loaddata.data;
        let loadclusterInfo = false;


            dataInformation.filename = choice.name;
            if(choice.category==='hpcc')
                setTimeout(() => {
                    console.time("totalTime:");
                    d3.json(choice.url).on("progress", function(evt) {
                        if (evt.total) {
                            preloader(true, 0, "File loaded: " + Math.round(evt.loaded/evt.total*100)+'%');
                            dataInformation.size = evt.total;
                        }else{
                            preloader(true, 0, "File loaded: " +bytesToString(evt.loaded));
                            dataInformation.size = evt.loaded;
                        }
                    }).get(function(error,data) {
                            console.timeEnd("totalTime:");
                        if (error) {

                        }

                        d3.json(choice.url.replace(/(\w+).json|(\w+).csv/,'$1_job_compact.json'), function (error, job) {
                            if (error) {
                                loadata1(data, undefined);
                                shap={};
                                d3.json(choice.url.replace(/(\w+).json|(\w+).csv/,'$1_shap.json'), function (error, shape) {
                                    if(!error)
                                        shap  = shape;
                                });
                                return;
                            }
                            loadata1(data, job);
                            shap={};
                            d3.json(choice.url.replace(/(\w+).json|(\w+).csv/,'$1_shap.json'), function (error, shape) {
                                if(!error)
                                    shap  = shape;
                            });
                            return;
                        });
                    });
                }, 0);
            else
                readFilecsv(choice.url,choice.separate,choice)

        function loadata1(data,job){
            makedataworker();
            data['timespan'] = data.timespan.map(d=>new Date(d3.timeFormat('%a %b %d %X CDT %Y')(new Date(+d?+d:d.replace('Z','')))));
            sampleS = data;
            if (choice.category==='hpcc') { //reload hostlist
                firstTime = true;
                systemFormat();
                inithosts();
                formatService(true);
                jobMap.hosts(hosts);
                MetricController.axisSchema(serviceFullList, true).update();
                first = false;
            }
            _.without(Object.keys(data),'timespan').forEach(h=>{
                delete data[h].arrCPU_load;
                serviceLists.forEach((s,si)=>{
                    if (data[h][serviceListattr[si]])
                        data[h][serviceListattr[si]] = data.timespan.map((d,i)=>
                            data[h][serviceListattr[si]][i]? data[h][serviceListattr[si]][i].slice(0,s.sub.length).map(e=>e?e:null):d3.range(0,s.sub.length).map(e=>null));
                    else
                        data[h][serviceListattr[si]] = data.timespan.map(d=>d3.range(0,s.sub.length).map(e=>null));
                })
            });
            updateDatainformation(data['timespan']);
            inithostResults();
            // make normalize data
            initTsnedata();
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
                firstTime= false;

            });
        }
    }
    function loadPresetCluster(name,calback) {
        const fileName = name.includes('data:')?name:`${name}_cluster.csv`;
        return d3.csv(fileName, function (cluster) {
            if (cluster==null||checkVliadClusterinfo(cluster)) {
                if (cluster==null)
                    M.toast({html: 'Do not have preset major group information. Recalculate major groups'});
                else
                    M.toast({html: 'Wrong cluster file format!'});
                if (calback) {
                    calback(false);// status
                }
            }else {
                updateClusterControlUI((cluster || []).length);
                clusterDescription = {};
                let haveDescription = false;
                cluster.forEach((d,i) => {
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
                    if(d.description) {
                        haveDescription = true;
                        clusterDescription[`group_${i + 1}`] = {id:`group_${i + 1}`,text: d.description};
                        delete d.description;
                    }
                });
                cluster_info = cluster;
                // clusterDescription = {};
                recomendName(cluster_info,haveDescription);
                recomendColor(cluster_info);
                if(calback){
                    calback(true);// status
                }
            }
        });
        function checkVliadClusterinfo(cluster_input){
            // check the axis
            cluster_input[0]
            let invalid = false;
            serviceFullList.find(s=>{
                invalid = cluster_input[0][s.text]===undefined
                return invalid
            })
            return invalid;
        }
    }
    function readFilecsv(file,separate,object) {
        separate = separate||'|';
        firstTime= true;
        exit_warp();
        preloader(true, 0,"Load data....");

        function loadcsv(data) {
            shap={};
            d3.json(choice.url.replace(/(\w+).json|(\w+).csv/,'$1_shap.json'), function (error, shape) {
                if(!error)
                    shap  = shape;
            });

            db = "csv";
            newdatatoFormat_noSuggestion(data, separate);
            inithostResults();
            formatService(true);
            processResult = processResult_csv;
            initTsnedata();
            makedataworker();
            initDataWorker();
            // addDatasetsOptions()

            MetricController.axisSchema(serviceFullList, true).update();
            firstTime = false;
            realTimesetting(false, "csv", true, sampleS);
            updateDatainformation(sampleS['timespan']);

            sampleJobdata = [{
                jobID: "1",
                name: "1",
                nodes: hosts.map(h => h.name),
                startTime: new Date(_.last(sampleS.timespan) - 100).toString(),
                submitTime: new Date(_.last(sampleS.timespan) - 100).toString(),
                user: "dummyJob"
            }];


            updateClusterControlUI();
            // preloader(true, 0, "File loaded: " + Math.round(evt.loaded/evt.total*100)+'%');
            loadPresetCluster(file?file.replace(/(\w+).json|(\w+).csv/, '$1'):'', (status) => {
                let loadclusterInfo = status;
                if (loadclusterInfo) {
                    handle_dataRaw();
                    if (!init)
                        resetRequest();
                    preloader(false);
                } else {
                    recalculateCluster({
                        clusterMethod: 'leaderbin',
                        normMethod: 'l2',
                        bin: {startBinGridSize: 4, range: [7, 9]}
                    }, function () {
                        handle_dataRaw();
                        if (!init)
                            resetRequest();
                        preloader(false);
                    });
                }
            })
        }

        setTimeout(() => {
            if (file) {
                d3.csv(file).on("progress", function (evt) {
                    if (evt.total) {
                        preloader(true, 0, "File loaded: " + Math.round(evt.loaded / evt.total * 100) + '%');
                        dataInformation.size = evt.total;
                    } else {
                        preloader(true, 0, "File loaded: " + bytesToString(evt.loaded));
                        dataInformation.size = evt.loaded;
                    }
                    // console.log("Amount loaded: " + Math.round(evt.loaded/evt.total*100)+'%')
                }).get(function (error, data) {
                    if (error) {
                    } else {
                        loadcsv(data);

                    }
                })
            }else{
                dataInformation.size = object.size;
                loadcsv(object.values)
            }
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
