'use strict';

angular.module('hpccApp')
.factory('Loaddata', function($timeout,Dataset,_, Config) {
    var srcpathRoot ="../HiperView/"
    var Loaddata = {
        data:{}
    };
    let first = true;
    let init = true;
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
                            initFunc();
                        init = false
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
        var promiseQueue;

            if (first||(db === 'csv'&& choice.category==='hpcc')) { //reload hostlist
                promiseQueue = d3.json(srcpathRoot+'data/hotslist_Quanah.json').then(function (data) {

                        firstTime = true;
                        hostList = data;
                        systemFormat();
                        inithostResults();
                        formatService(true);
                        // MetricController.axisSchema(serviceFullList, true).update();
                });
                first = false;
            }else{
                promiseQueue = new Promise(function(resolve, reject){
                    resolve();
                });
            }

            dataInformation.filename = choice.name;
            if(choice.category==='hpcc')
                setTimeout(() => {
                    console.time("totalTime:");
                    promiseQueue.then(d3.json(choice.url).then(function(data) {
                            console.timeEnd("totalTime:");

                            loadata1(data);

                    }));
                }, 0);
            else
                readFilecsv(choice.url,choice.separate,choice)

        function loadata1(data){

            data['timespan'] = data.timespan.map(d=>new Date(d3.timeFormat('%a %b %d %X CDT %Y')(new Date(+d?+d:d.replace('Z','')))));
            _.without(Object.keys(data),'timespan').forEach(h=>{
                delete data[h].arrCPU_load;
                serviceLists.forEach((s,si)=>{
                    if (data[h][serviceListattr[si]])
                        data[h][serviceListattr[si]] = data.timespan.map((d,i)=>
                            data[h][serviceListattr[si]][i]? data[h][serviceListattr[si]][i].slice(0,s.sub.length).map(e=>e?e:undefined):d3.range(0,s.sub.length).map(e=>undefined));
                    else
                        data[h][serviceListattr[si]] = data.timespan.map(d=>d3.range(0,s.sub.length).map(e=>null));
                })
            });
            updateDatainformation(data['timespan']);
            // console.log(data["compute-1-26"].arrFans_health[0])
            sampleS = data;

            // make normalize data
            tsnedata = {};
            hosts.forEach(h => {
                tsnedata[h.name] = sampleS.timespan.map((t, i) => {
                    let array_normalize = _.flatten(serviceLists.map(a => d3.range(0, a.sub.length).map(vi => {
                        let v = sampleS[h.name][serviceListattr[a.id]][i][vi];
                        return d3.scaleLinear().domain(a.sub[0].range)(v === null ? undefined: v) || 0})));
                    array_normalize.name = h.name;
                    array_normalize.timestep =i;
                    return array_normalize;
                })});

            if (choice.url.includes('influxdb')){
                processResult = processResult_influxdb;
                db = "influxdb";
                realTimesetting(false,"influxdb",true,sampleS);
            }else {
                db = "nagios";
                processResult = processResult_old;
                realTimesetting(false,undefined,true,sampleS);
            }


            if (!init)
                resetRequest();
            else
                initFunc();
            init = false;
            preloader(false)
            firstTime = false;
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
            db = "csv";
            newdatatoFormat_noSuggestion(data, separate);
            if (object.customTime){
                stickKey = object.customTime.label;
                stickKeyFormat = object.customTime.format;
            }else{
                stickKey = TIMEKEY;
                stickKeyFormat = TIMEFORMAT;
            }
            serviceListattrnest = serviceLists.map(d=>({
                key:d.text,sub:d.sub.map(e=>e.text)
            }));
            selectedService = serviceLists[0].text;
            inithostResults();
            formatService(true);
            processResult = processResult_csv;

            // addDatasetsOptions()

            // MetricController.axisSchema(serviceFullList, true).update();
            firstTime = false;
            realTimesetting(false, "csv", true, sampleS);
            updateDatainformation(sampleS['timespan']);


            // preloader(true, 0, "File loaded: " + Math.round(evt.loaded/evt.total*100)+'%');

                    if (!firstTime){
                        resetRequest();
                    }
                    else{
                        initFunc();
                    }
            initFunc = false
                    preloader(false);

        }

        setTimeout(() => {
            if (file) {
                d3.csv(file).then(function (data) {

                        loadcsv(data);

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
