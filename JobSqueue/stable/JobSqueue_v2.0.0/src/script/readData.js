var query_time;
cluster_info=[];
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
    // service_custom_added = [{text:'Time',id:-1,enable:true,class:"sorting_disabled"},{text:'Cluster',id:-2,enable:false,hide:true,
    service_custom_added = [{text:'Cluster',id:-2,enable:false,hide:true,
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
                eachIn.name = ishpcc?com.key + ', ' + stickKeyFormat(eachIn[stickKey]):count;
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
function durationstring2Milisecond(s){
    let miliseconds = 0;
    const _days = s.split('-');
    let _time = '';
    if (_days.length>1){
        miliseconds+= (+_days[0])*24*3600*1000;
        _time = _days[1].split(':').reverse();
    }else{
        _time = _days[0].split(':').reverse();
    }
    miliseconds+= (_time[0]??0)*1000;
    miliseconds+= (_time[1]??0)*60*1000;
    miliseconds+= (_time[2]??0)*3600*1000;
    return miliseconds
}

function newdatatoFormat (dataR,notSplit,{definedType,preprocess,disableAxis,initAxis,axisOrder,customAxis,color},currentTimestamp){
    definedType = definedType??{};
    preprocess = preprocess??{};
    preloader(true, 0, 'reading file...');
    let data = _.cloneDeep(dataR);
    serviceList = [];
    serviceLists = [];
    serviceListattr = [];
    serviceAttr={};
    hosts =[];

    if (customAxis){
        data.forEach(d=>{
            Object.keys(customAxis).forEach(k=>{
                d[k] = customAxis[k](d,currentTimestamp);
            })
        })
    }


    let variables = Object.keys(data[0]);
    if (variables.find(v=>v==='GUID')) {
        IDkey = 'GUID';
        variables = variables.filter(d=>d!==IDkey);
    }else {
        IDkey = '__id__';
        data.forEach((d,i)=>d[IDkey]=''+i)
    }

    // if (disableAxis)
    //     variables = variables.filter(k=>!disableAxis[k]);

    let SUBJECTSob = {};
    SUBJECTS = [];
    if (notSplit){
        SUBJECTSob[""] = 0;
        SUBJECTS=[""];
    }
    // TODO remove this function
    serviceQuery["csv"]= serviceQuery["csv"]||{};
    let global_range = [0,0];
    // time---------------------------
    let timerange = [+Infinity,-Infinity];
    let timeformat = d3.timeFormat("%m/%d/%Y");
    variables.forEach((k,i)=>{
        serviceQuery["csv"][k]={};
        serviceQuery["csv"][k][k]={
            type : 'number',
            format : () =>k,
            numberOfEntries: 1};
        serviceAttr[k] = {
            key: k,
            val:[k]
        };
        serviceList.push(k);
        serviceListattr.push(k);

        let stringObject = {};
        let stringKey = [];
        let isString = definedType[k]?definedType[k]==='text':false;
        let format = preprocess[k]?preprocess[k]:(d)=>d;
        let isSingle = false;
        let isTime = false;
        let stringNum = 0;
        range = [+Infinity,-Infinity];

        // time hanle

        data.forEach(d => {
            d[k]=format(d[k]);
            if (d[k]===undefined) {
                d[k] = 'NULL';
            }
            if (!_.isNaN(+d[k])) {
                    range[0] = Math.min(range[0], +d[k]);
                    range[1] = Math.max(range[1], +d[k]);
            } else
                isString = true;
            if (!stringObject[d[k]]) {
                stringObject[d[k]] = 1;
                stringKey.push(d[k]);
                stringNum++;
            }
        });

        isSingle = stringKey.length===1;
    if (definedType[k]&&definedType[k]==='time'){
        isString = false;
        isTime = true;
        const scaleTime = d3.scaleTime().domain(d3.extent(data,d=>new Date(d[k])));
        stringKey = scaleTime.ticks().map(d=>d.toLocaleString());
        stringObject = {};
        stringKey.forEach((s, si) => stringObject[s] = si);
        range = [0, stringKey.length - 1];
        scaleTime.range(range);
        data.forEach(d=>d[k]=scaleTime(new Date(d[k])))
    }else if (definedType[k]&&definedType[k]==='duration'){ // millisecond
        isString = false;
        isTime = true;
        const scaleTime = d3.scaleTime().domain(d3.extent(data,d=>{
            d[k] = durationstring2Milisecond(d[k]);
        return d[k]}));
        // stringKey = scaleTime.ticks().map(d=>moment.duration(+d)
        //     .format('dd hh:mm:ss', { trim: false }));
        // stringObject = {};
        // stringKey.forEach((s, si) => stringObject[s] = si);
        // range = [0, stringKey.length - 1];
        range = scaleTime.domain();
        scaleTime.range(range);
    }else if(new RegExp(/date|time/gi).test(k)){
        isString = false;
        isTime = true;
        const scaleTime = d3.scaleTime().domain(d3.extent(data,d=>new Date(d[k])));
        stringKey = scaleTime.ticks().map(d=>d.toLocaleString());
        stringObject = {};
        stringKey.forEach((s, si) => stringObject[s] = si);
        range = [0, stringKey.length - 1];
        scaleTime.range(range);
        data.forEach(d=>d[k]=scaleTime(new Date(d[k])))
    }else {
        if (isString) {
            stringKey.naturalSort();
            if (stringNum===1&&stringObject['NULL']) // only undefined
            {
                let tempS = ['NULL']
                stringObject = {'NULL':range[0]-(range[1]-range[0])/10};
                stringKey.forEach(k=>{
                    if(k!=='NULL')
                        tempS[+k] = +k;
                    else
                        stringObject[+k] = +k;
                });
                stringKey = tempS;
                range = [stringObject['NULL'], range[1]];
            }else {
                if (stringObject['NULL']){
                    let tempS = ['NULL'];
                    stringKey.forEach(k=>k!=='NULL'?tempS.push(k):null)
                    stringKey = tempS;
                }
                stringKey.forEach((s, si) => stringObject[s] = si);
                range = [0, stringKey.length - 1];
            }
        } else {
            stringKey = undefined;
            stringObject = undefined;
        }
    }
        let temp = {"text":k,"id":axisOrder[k]??i,"enable":true,"sub":[{"text":k,"id":0,"enable":disableAxis&&(!disableAxis[k]),"idroot":i,"angle":i*2*Math.PI/(variables.length),"range":range,"isTime":isTime,"isString":isString,isSingle:isSingle,collection:stringKey,collectionObj:stringObject}]};
        if (color[k]){
            temp.sub[0].color = color[k].copy().domain(color[k].domain().map(d=>temp.sub[0].collectionObj[d]));
        }else{
            if (isString) {
                temp.sub[0].color = d3.scaleOrdinal().range(d3.schemeCategory10);
            }
            if (temp.sub[0].isSingle)
                temp.sub[0].color = d3.scaleOrdinal().range(['#ddd']);
        }
        thresholds.push([0,1]);
        serviceLists.push(temp);
    });


    serviceLists.sort((a,b)=>a.id-b.id).forEach((s,i)=>s.id=i)

    serviceList_selected = serviceList.map((d,i)=>{return{text:d,index:i}});
    serviceFullList = serviceLists2serviceFullList(serviceLists);
    scaleService = serviceFullList.map(d=>d3.scaleLinear().domain(d.range));

    // time---------------------------
    // let timeKey = d3.scaleTime().domain(timerange.map(r=>ExcelDateToJSDate(r))).ticks(d3.timeDay.every(1)).map(d=>timeformat(d));
    // let timeObject = {};
    // timeKey.forEach((s, si) => timeObject[s] = si);
    // timerange = [0, timeKey.length - 1];
    serviceFullList.forEach(function(s){
        if (s.isTime) {
            // s.collection = timeKey;
            // s.collectionObj = timeObject;
            // s.range = timerange;
            if (definedType[s.text]&&definedType[s.text]==='duration'){
                const timeScale = d3.scaleTime().domain([new Date(s.collection[0]),new Date(s.collection[s.collection.length-1])]).range(s.range);
                s.axisCustom = {
                    ticks: 0, tickFormat: function (d) {
                        return moment.duration(d)
                            .format('dd hh:mm:ss', { trim: false });
                    }, tickInvert: d => timeScale(d)
                };
            }else{
                const timeScale = d3.scaleTime().domain([new Date(s.collection[0]),new Date(s.collection[s.collection.length-1])]).range(s.range);
                s.axisCustom = {
                    ticks: 0, tickFormatFull: function (d) {
                        return timeScale.invert(d).toLocaleString();
                    }, tickFormat: function (d) {
                        return multiFormat(timeScale.invert(d))
                    }, tickInvert: d => timeScale(d)
                };
            }
            // s.axisCustom = {
            //     ticks: 0, tickFormat: function (d) {
            //         return s.collection[d]
            //     }, tickInvert: d => s.collectionObj[d]
            // };
        }else{
        if (s.isString) {
                s.axisCustom = {
                    limit: 10,
                    ticks: 0, tickFormat: function (d) {
                        if (_.isString(s.collection[d])) {
                            let temp = s.collection[d].split(' ')[0];
                            s.collectionObj[temp] = d;
                            return temp;
                        } else
                            return s.collection[d]
                    }, tickInvert: d => s.collectionObj[d]
                };
            }
        }
    });

    sampleS = {};
    tsnedata = {};
    sampleS['timespan'] = [new Date()];

    data.forEach(d=>{
        serviceFullList.forEach(s=>{
            k = s.text;
            if (s.isString)
                d[k] = s.collectionObj[d[k]];
            else
                d[k] = d[k]===""?null:(+d[k]);
        })// format number
        const name = d[IDkey];
        const fixname = name.replace('|','__');
        if (!sampleS[fixname]) {
            let sub = name.split('|')[1] || "";
            if (!notSplit) {
                if (SUBJECTSob[sub] === undefined) {
                    SUBJECTSob[sub] = SUBJECTS.length;
                    SUBJECTS.push(sub);
                }
            }
            const category = SUBJECTSob[sub];
            hosts.push({
                name: fixname,
                genese: notSplit ? fixname : fixname.split('__')[0],
                category: category,
                index: hosts.length,
            });

            serviceListattr.forEach((attr, i) => {
                if (sampleS[fixname] === undefined) {
                    sampleS[fixname] = {};
                    tsnedata[fixname] = [[]];
                    tsnedata[fixname][0].name = fixname;
                    tsnedata[fixname][0].timestep = 0;
                    tsnedata[fixname][0].category = category;
                }
                const value = d[variables[i]];
                sampleS[fixname][attr] = [[value]];
                tsnedata[fixname][0].push(value === null ? 0 : scaleService[i](value) || 0);
            });

        }
    }); // format number

    // find outliers
    preloader(true, 0, 'Prepare data...');
    // outlyingList = outlier();
}
function ExcelDateToJSDate(serial) {
    var utc_days  = Math.floor(serial - 25569);
    var utc_value = utc_days * 86400;
    var date_info = new Date(utc_value * 1000);

    var fractional_day = serial - Math.floor(serial) + 0.0000001;

    var total_seconds = Math.floor(86400 * fractional_day);

    var seconds = total_seconds % 60;

    total_seconds -= seconds;

    var hours = Math.floor(total_seconds / (60 * 60));
    var minutes = Math.floor(total_seconds / 60) % 60;

    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}
