var query_time;
let cluster_info=[];
let dataRaw;
function initApp(){
    // load filter file
        preloader(true,undefined,'Read data file...');
        readFilecsv(d3.select('#datacom').node().value);
}
function formatService(init){
    serviceLists.forEach(s=>{
        if(s.text.split('vs.').length>1) {
            s.enable = false;
            s.sub[0].enable = false;
        }
    });
    serviceFullList_Fullrange = _.clone(serviceFullList);
    conf.serviceList = serviceList;
    conf.serviceLists = serviceLists;
    conf.serviceListattr = serviceListattr;
    conf.serviceListattrnest = serviceListattrnest;
    service_custom_added = [{text:'Time',id:-1,enable:true,isDate:true,class:"sorting_disabled"},{text:'Cluster',id:-2,enable:false,hide:true,
        color:colorCluster,
        axisCustom:{ticks:0,tickFormat:d=> `Group ${cluster_info[d].orderG+1}`,tickInvert:d=> cluster_info.find(c=>c.name===d).index}}];
    serviceFullList_withExtra = _.flatten([service_custom_added,serviceFullList]);
    drawFiltertable();
}


function readData() {
    let hostResults = {}, hosts=[];
    let hostsList = _.without(d3.keys(sampleS),'timespan');
    let count = 0;
    let comphost;
    let lengthData = sampleS.timespan.length;
    let iterationstep =lengthData-1;
    sampleS.timespan = sampleS.timespan.map(d=>new Date(d));
    hostsList.forEach(att => {
        var h = {};
        h.name = att;
        h.hpcc_rack = +att.split("-")[1];
        h.hpcc_node = +att.split("-")[2].split(".")[0];
        h.index = hosts.length;

        // to contain the historical query results
        hostResults[h.name] = {};
        hostResults[h.name].index = h.index;
        hostResults[h.name].arrTemperature = [];
        hostResults[h.name].arrCPU_load = [];
        hostResults[h.name].arrMemory_usage = [];
        hostResults[h.name].arrFans_health = [];
        hostResults[h.name].arrPower_usage = [];
        hostResults[h.name].arrTime = [];
        hosts.push(h);
        readDataList(count,0);
        count++;

        function readDataList(count,iteration) {
            var name= hosts[count].name;
            for (i = 0; i < iterationstep; i++) {
                query_time = undefined;

                serviceListattr.forEach((sv, si)=> {
                    var result = simulateResults2(hosts[count].name, iteration, serviceList[si]);
                    // query_time = result.result.query_time||query_time;
                    // name = result.data.service.host_name||name;
                    result = result.map(d=>d!==null?d:undefined)
                    hostResults[name][sv].push(result);
                });
                iteration++;
            }
            hostResults[name]['arrTime']=sampleS.timespan;
            return iteration;
        }

    })
    return hostResults;

}

function object2Data(ob){
    return d3.entries(ob).filter(d=>d.key!=='timespan');
}

function object2DataPrallel(ob){
    var temp = object2Data(ob);
    var count = 0;
    var newdata =[];
    var comlength = sampleS.timespan.length;
    temp.forEach(com=>{
        var namet = com.key.split('-');
        var rack, host;
        let ishpcc = true;
        if (namet.length>1) {
            rack = namet[1];
            host = namet[2];
        }else{
            namet = com.key.split('.'); // IP?
            if (namet.length>1) {
                rack = namet[2];
                host = namet[3];
            }else {
                rack = com.key;
                host = com.key;
                ishpcc = false;
            }
        }
        for (i = 0; i<comlength; i++){
            var eachIn = {};
            var validkey =true;
            serviceListattrnest.forEach(s=>{
                s.sub.forEach((sub,sj)=>{
                    eachIn[sub] = com.value[s.key][i][sj];
                    // if(_.isNaN(eachIn[sub]))
                    //     eachIn[sub] = undefined
                    // validkey = validkey&&(eachIn[sub]!==undefined)
                });
            });
            if (validkey) {
                eachIn[stickKey] = stickKey===TIMEKEY? sampleS.timespan[i] : sampleS.timespan.length-1-i;
                eachIn.rack = ishpcc?("Rack " + rack):rack;
                eachIn.compute = com.key;
                eachIn.group = ishpcc?("Rack " + rack):rack;
                eachIn.Cluster =com.value['arrcluster']?(com.value['arrcluster'][i]):0;
                eachIn.name = com.key + ', ' + stickKeyFormat(eachIn[stickKey]);
                eachIn.id = com.key + "-" + count;
                count++;
                newdata.push(eachIn);
            }
        }

    });
    // if(stickKey!==TIMEKEY){
    //     serviceFullList.push({text: stickKey,
    //         id: serviceFullList.length,
    //         enable: true,
    //         idroot: serviceFullList.length,
    //         angle: 5.834386356666759,
    //         range: stickKey!==TIMEKEY?[sampleS.timespan[0],_.last(sampleS.timespan)] [0, sampleS.timespan.length-1]
    //     })
    // // }
    // return newdata.filter(d=>d.Time< new Date('Thu Mar 21 2019 16:20:00 GMT-0500 (Central Daylight Time)'))
    return newdata;
}

function colorbyCategory(data,key) {
    var listKey = _(data).unique(key).map(d=>d[key]).naturalSort();
    var listcolor= listKey.map(colorscale);
    colors.domain(listKey).range(listcolor);
    color = colors;
}
function colorbyValue(order) {
    var listcolor= order.map(d=>color(d.value));
    colors.domain(order.map(d=>d.text)).range(listcolor);
}