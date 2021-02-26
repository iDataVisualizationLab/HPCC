let serviceLists,serviceList_selected,alternative_service,alternative_scale;
TTUsetting();
function TTUsetting(){
    serviceFullList = [{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]},{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]},{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]},{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]
    serviceListattr = ["arrTemperature", "arrMemory_usage", "arrFans_health", "arrPower_usage"];
    serviceLists = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
    serviceList_selected = [{"text":"Temperature","index":0},{"text":"Memory_usage","index":1},{"text":"Fans_speed","index":2},{"text":"Power_consum","index":3}];
    alternative_service = ["cpu_inl_temp", "memory_usage", "fan_speed", "power_usage"];
    alternative_scale = [1,1,1,0.5];
}
let colorScaleList = {
    n: 7,
    rainbow: ["#000066", "#4400ff", "#00ddff", "#00ddaa", "#00dd00", "#aadd00", "#ffcc00", "#ff8800", "#ff0000", "#660000"],
    soil: ["#2244AA","#4A8FC2", "#76A5B1", "#9DBCA2", "#C3D392", "#F8E571", "#F2B659", "#eb6424", "#D63128", "#660000"],
    customschemeCategory:  ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#bcbd22", "#17becf"],
    customFunc: function(name,arr,num){
        const n= num||this.n;
        const arrColor = arr||this[name];
        let colorLength = arrColor.length;
        const arrThresholds=d3.range(0,colorLength).map(e=>e/(colorLength-1));
        let colorTemperature = d3.scaleLinear()
            .domain(arrThresholds)
            .range(arrColor)
            .interpolate(d3.interpolateHcl);

        return d3.range(0,n).map(e=>colorTemperature(e/(n-1)))
    },
    d3colorChosefunc: function(name,num){
        const n = num|| this.n;
        if (d3[`scheme${name}`]) {
            if (typeof (d3[`scheme${name}`][0]) !== 'string') {
                colors = (d3[`scheme${name}`][n]||d3[`scheme${name}`][d3[`scheme${name}`].length-1]).slice();
            }
            else
                colors=  d3[`scheme${name}`].slice();
        } else {
            const interpolate = d3[`interpolate${name}`];
            colors = [];
            for (let i = 0; i < n; ++i) {
                colors.push(d3.rgb(interpolate(i / (n - 1))).hex());
            }
        }
        colors = this.customFunc(undefined,colors,n);
        return colors;
    },
},colorArr = {Radar: [
        {val: 'rainbow',type:'custom',label: 'Rainbow'},
        {val: 'RdBu',type:'d3',label: 'Blue2Red',invert:true},
        {val: 'soil',type:'custom',label: 'RedYelBlu'},
        {val: 'Viridis',type:'d3',label: 'Viridis'},
        {val: 'Greys',type:'d3',label: 'Greys'}],
    Cluster: [{val: 'Category10',type:'d3',label: 'D3'},{val: 'Paired',type:'d3',label: 'Blue2Red'}]};
let scaleService;

function handleDataUrl(dataRaw) {
    let hosts = d3.keys(dataRaw.nodes_info).map(ip=>{
        return {
            ip: ip,
            name: ip,
        }
    });
    d3.keys(dataRaw.jobs_info).forEach(jID=>{
        dataRaw.jobs_info[jID].node_list = dataRaw.jobs_info[jID].node_list.map(c=>c.split('-')[0]);
        if(dataRaw.jobs_info[jID].start_time>9999999999999)
        {dataRaw.jobs_info[jID].start_time = dataRaw.jobs_info[jID].start_time/1000000
        dataRaw.jobs_info[jID].submit_time = dataRaw.jobs_info[jID].submit_time/1000000
        if (dataRaw.jobs_info[jID].finish_time && data.jobs_info[jID].finish_time>9999999999999)
            dataRaw.jobs_info[jID].finish_time = dataRaw.jobs_info[jID].finish_time/1000000}
    })
    let time_stamp = dataRaw.time_stamp.map(d=>d/1000000)

    var sampleh = {};
    var ser = serviceListattr.slice();
    let tsnedata = {};
    let data = dataRaw.nodes_info;
    sampleh.timespan = time_stamp.map(d=>d*1000);
    scaleService = d3.nest().key(d=>d.idroot).rollup(d=>d3.scaleLinear().domain(d[0].range)).object(serviceFullList);
    hosts.forEach(h => {
        sampleh[h.name] = {};
        tsnedata[h.name] = [];
        ser.forEach(s => sampleh[h.name][s] = []);
        alternative_service.forEach((sa, si) => {
            var scale = alternative_scale[si];
            sampleh.timespan.forEach((dt, ti) => {
                let value = [];
                if (!_.isArray(data[h.ip][sa][ti])){
                    data[h.ip][sa][ti] = [data[h.ip][sa][ti]]
                }
                for (let ii = 0;ii<serviceLists[si].sub.length;ii++){
                    value.push((data[h.ip][sa][ti][ii]==='' || data[h.ip][sa][ti][ii]===undefined)?null:data[h.ip][sa][ti][ii]*scale)
                }
                let arrID = serviceListattr[si];
                if (sampleh[h.name][arrID]===undefined)
                    debugger
                let currentIndex =  sampleh[h.name][arrID].length;
                sampleh[h.name][arrID][ti] = value;

                if (tsnedata[h.name][currentIndex]===undefined){
                    tsnedata[h.name][currentIndex] = [];
                    tsnedata[h.name][currentIndex].name = h.name;
                    tsnedata[h.name][currentIndex].timestep =currentIndex;
                }
                value.forEach(v=>tsnedata[h.name][currentIndex].push(v === null ? 0 : scaleService[si](v) || 0))
            })
        })
    });

    return{sampleS:sampleh,tsnedata:tsnedata};
}
function handleSmalldata(dataRaw){
    let hosts = d3.keys(dataRaw.nodes_info).map(ip=>{
        return {
            ip: ip,
            name: ip,
        }
    });
    scaleService = d3.nest().key(d=>d.idroot).rollup(d=>d3.scaleLinear().domain(d[0].range)).object(serviceFullList);
    let time_stamp = dataRaw.time_stamp.map(d=>d>9999999999999?(d/1000000):d)
    let sampleh = {};
    var ser = serviceListattr.slice();
    ser.pop();
    sampleh.timespan = time_stamp.map(d=>d);
    let data = dataRaw.nodes_info;
    hosts.forEach(h => {
        sampleh[h.name] = {};
        ser.forEach(s => sampleh[h.name][s] = []);
        alternative_service.forEach((sa, si) => {
            var scale = alternative_scale[si];
            sampleh.timespan.forEach((dt, ti) => {
                let value = [];
                if (!_.isArray(data[h.ip][sa][ti])){
                    data[h.ip][sa][ti] = [data[h.ip][sa][ti]]
                }
                for (let ii = 0;ii<serviceLists[si].sub.length;ii++){
                    value.push((data[h.ip][sa][ti][ii]==='' || data[h.ip][sa][ti][ii]===undefined)?null:data[h.ip][sa][ti][ii]*scale)
                }
                let arrID = serviceListattr[si];
                sampleh[h.name][arrID][ti] = value;
            })
        })
    });
    return sampleh;
}
function handleAllData(dataRaw){
    let hosts = d3.keys(dataRaw.nodes_info).map(ip=>{
        return {
            ip: ip,
            name: ip,
        }
    });
    d3.keys(dataRaw.jobs_info).forEach(jID=>{
        dataRaw.jobs_info[jID].node_list_short = dataRaw.jobs_info[jID].node_list.map(c=>c.split('-')[0]);
        if(dataRaw.jobs_info[jID].start_time>9999999999999)
        {dataRaw.jobs_info[jID].start_time = dataRaw.jobs_info[jID].start_time/1000000;
            dataRaw.jobs_info[jID].submit_time = dataRaw.jobs_info[jID].submit_time/1000000
            if (dataRaw.jobs_info[jID].finish_time  && data.jobs_info[jID].finish_time>9999999999999)
                dataRaw.jobs_info[jID].finish_time = dataRaw.jobs_info[jID].finish_time/1000000}
    });
    scaleService = d3.nest().key(d=>d.idroot).rollup(d=>d3.scaleLinear().domain(d[0].range)).object(serviceFullList);
    let time_stamp = dataRaw.time_stamp.map(d=>d/1000000);
    let sampleh = {};
    var ser = serviceListattr.slice();
    ser.pop();
    sampleh.timespan = time_stamp.map(d=>d*1000);
    let data = dataRaw.nodes_info;
    hosts.forEach(h => {
        sampleh[h.name] = {};
        ser.forEach(s => sampleh[h.name][s] = []);
        alternative_service.forEach((sa, si) => {
            var scale = alternative_scale[si];
            sampleh.timespan.forEach((dt, ti) => {
                let value = [];
                if (!_.isArray(data[h.ip][sa][ti])){
                    data[h.ip][sa][ti] = [data[h.ip][sa][ti]]
                }
                for (let ii = 0;ii<serviceLists[si].sub.length;ii++){
                    value.push((data[h.ip][sa][ti][ii]==='' || data[h.ip][sa][ti][ii]===undefined)?null:data[h.ip][sa][ti][ii]*scale)
                }
                let arrID = serviceListattr[si];
                sampleh[h.name][arrID][ti] = value;
            })
        })
    });
    return sampleh;
}



let _tempData={};
function handleMetricCSV(){
    readFromInput(event,(_data)=>{
        d3.csv(_data).then(data=>{
            let results = newdatatoFormat_noSuggestion(data,"|");
            Object.keys(results).forEach(k=>{
                _tempData[k] = results[k];
            });
        })
    },()=>{
        ["nodes_info","time_stamp","serviceList_selected","serviceLists","serviceListattr","alternative_service","alternative_scale","serviceFullList"]
            .forEach(k=> delete _tempData[k])
    })
}

function handlejobJson(){
    readFromInput(event,(_data)=>{
        d3.json(_data).then(data=>{
            Object.values(data).forEach(d=>{
                d.start_time = +new Date(d.start_time);
                d.submit_time = +new Date(d.start_time);
                if (d.finish_time)
                    d.finish_time = +new Date(d.start_time);
            });
            _tempData.jobs_info = data;
        })
    })
}

function onChangeData(){
    if (_tempData.jobs_info){

        if (!_tempData.serviceFullList){
            serviceFullList = [];
            serviceListattr = [];
            serviceLists = [];
            serviceList_selected = [];
            alternative_service = [];
            alternative_scale = [];
        }else{
            serviceFullList = _tempData.serviceFullList;
            serviceListattr = _tempData.serviceListattr;
            serviceLists = _tempData.serviceLists;
            serviceList_selected = _tempData.serviceList_selected;
            alternative_service = _tempData.alternative_service;
            alternative_scale = _tempData.alternative_scale;
        }
        const nodes_info = {..._tempData.nodes_info};
        let timeRange = [Infinity,-Infinity];
        let timeInterval = 5*60000;
        const time2Index = d3.scaleLinear();
        if (_tempData.time_stamp){
            timeRange = [_tempData.time_stamp[0]/1000000,_tempData.time_stamp[_tempData.time_stamp.length-1]/1000000];
            timeInterval = (_tempData.time_stamp[1]-_tempData.time_stamp[0])/1000000;
        }
        const jobs_info = {};
        Object.values(_tempData.jobs_info).forEach(j=> {
            j.jobID = j.jobID.replace('.', '|');
            jobs_info[j.jobID] = j;
            if (j.start_time<timeRange[0]){
                timeRange[0] = j.start_time;
            }
            if (j.finish_time)
            {
                if (j.finish_time>timeRange[1])
                    timeRange[1] = j.finish_time;
            }else {
                if (j.start_time>timeRange[1])
                    timeRange[1] = j.start_time;
            }
        });
        const time_stamp = d3.range(0,Math.ceil((timeRange[1]-timeRange[0])/timeInterval)).map(d=>(d*timeInterval+timeRange[0])*1000000);
        time2Index.domain(timeRange).range([0,time_stamp.length-1]);
        if (Object.keys(nodes_info).length){
            const startIndex = Math.floor(time2Index(_tempData.time_stamp[0]/1000000));
            const endIndex = Math.ceil(time2Index(_tempData.time_stamp[_tempData.time_stamp.length-1]/1000000));
            Object.values(nodes_info).forEach(d=>{
                alternative_service.forEach(s=>{
                    d[s] = [...d3.range(0,startIndex),...d[s],...d3.range(endIndex+1,time_stamp.length-1)]
                });
                d.job_id = time_stamp.map(d=>[]);
            });
        }

        Object.values(jobs_info).forEach(j=>{
            const startIndex = Math.max(0,Math.ceil(time2Index(j.start_time)));
            const endIndex = j.finish_time?Math.ceil(time2Index(j.finish_time)):time2Index.range()[1];

                j.node_list.forEach(comp=>{
                    if ( !nodes_info[comp]) // new node
                    {
                        nodes_info[comp] = {};
                        alternative_service.forEach(s=>nodes_info[comp][s]=new Array(time_stamp.length));
                        nodes_info[comp].job_id = time_stamp.map(d=>[]);
                    }
                    for (let i = startIndex;i<=endIndex;i++)
                        nodes_info[comp].job_id[i].push(j.jobID);
                });
        });


        // map node and job
        // const time2Index = d3.scaleLinear().domain([_tempData.time_stamp[0]/1000000,_tempData.time_stamp[_tempData.time_stamp.length-1]/1000000])
        //     .range([0,_tempData.time_stamp.length-1]);
        // const jobs_info = {};
        // Object.values(_tempData.nodes_info).forEach(comp=>comp.job_id = _tempData.time_stamp.map(d=>[]));
        // Object.values(_tempData.jobs_info).forEach(j=>{
        //     let valid = true;
        //     j.jobID = j.jobID.replace('.','|');
        //     const startIndex = Math.max(0,Math.ceil(time2Index(j.start_time)));
        //     const endIndex = j.finish_time?Math.ceil(time2Index(j.finish_time)):time2Index.range()[1];
        //     valid = startIndex<=time2Index.range()[1];
        //     if (valid){
        //         valid = 0;
        //         j.node_list.forEach(comp=>{
        //             if ( !_tempData.nodes_info[comp])
        //                 return;
        //             valid++;
        //             for (let i = startIndex;i<=endIndex;i++)
        //                 _tempData.nodes_info[comp].job_id[i].push(j.jobID);
        //         });
        //         if (valid){
        //             jobs_info[j.jobID] = j;
        //         }
        //     }
        // });
        request.updateData(new Promise((resolve, reject) => {resolve({jobs_info,nodes_info,time_stamp})}));
        _tempData = {};
        debugger;
        $('#datasetSelection').modal('hide');
    }else{
        // throw error
        throw 'Load fail!';
    }
}

function serviceLists2serviceFullList (serviceLists){
    let temp = [];
    serviceLists.forEach(s=>s.sub.forEach(sub=>{
        sub.idroot = s.id;
        sub.enable = s.enable&&(sub.enable===undefined?true:sub.enable);
        temp.push(sub);}));
    return temp;
}
function newdatatoFormat_noSuggestion (data,separate){
    separate = separate||"-";
    const serviceList = [];
    const serviceLists = [];
    const serviceListattr = [];
    const alternative_service = [];
    const alternative_scale = [];
    const serviceAttr={};
    let nodes_info ={};
    let singleDataAxis = [];
    // FIXME detect format
    const variables = _.without(Object.keys(data[0]),'timestamp','time');
    data.forEach(d=>variables.forEach(k=>d[k] = d[k]===""?null:(+d[k]))) // format number
    // test sepatate

    if (variables.find(k=>k.split(separate).length>1)===undefined)
        separate = "-";

    debugger
    let keys ={};
    variables.forEach((k,ki)=>{
        let split_string = k.split(separate);
        const nameh = split_string.shift();
        nodes_info[nameh] = {};
        let currentkey = split_string.join(separate);
        if(!keys[currentkey])
            keys[currentkey] = {r:undefined,vi:[]};
        keys[currentkey].vi.push(ki)
    });
    // check unionkeys
    d3.keys(nodes_info).forEach(hname=>{
        Object.keys(keys).forEach((k,i)=>{
            if (data.columns.find(c=>c===hname+separate+k)===undefined)
                delete keys[k];
        })
    });


    let validAxis = 0;
    Object.keys(keys).forEach((k,i)=>{
        serviceList.push(k);
        serviceListattr.push(k);
        let range =[+Infinity,-Infinity];
        keys[k].vi.forEach(vi=>{
            let temprange = d3.extent(data,d=>d[variables[vi]]);
            if (temprange[0]<range[0])
                range[0] = temprange[0];
            if (temprange[1]>range[1])
                range[1] = temprange[1];
        });
        // let range = d3.extent(data,d=>d[variables[i]]);
        if (keys[k].r) {
            let suggest_range = serviceLists_or.find(d => d.text === keys[k].r).sub[0].range;
            if (suggest_range[0]<=range[0]&&suggest_range[1]>=range[1])
                range = suggest_range;
        }
        if (range[0]!==range[1]){
            validAxis++;
        }else{
            singleDataAxis.push(i);
        }
        const temp = {"text":k,"id":i,"enable":range[0]!==range[1],"sub":[{"text":k,"id":0,"enable":true,"idroot":i,"angle":i*2*Math.PI/(Object.keys(keys).length),"range":range}]};
        serviceLists.push(temp);
        alternative_service.push(k);
        alternative_scale.push(1);
    });
    const serviceList_selected = serviceList.map((d,i)=>{return{text:d,index:i}});
    const serviceFullList = serviceLists2serviceFullList(serviceLists);

    debugger
    const time_stamp = data.map(d=>+new Date(d.time||d.timestamp)*1000000);

    data.forEach(d=>{
        d3.keys(nodes_info).forEach(h=> {
            serviceListattr.forEach((attr,i) => {
                nodes_info[h][attr] = nodes_info[h][attr]||[];
                nodes_info[h][attr].push(+d[h+separate+attr]);
            });
        })
    });
    return {nodes_info,time_stamp,serviceList_selected,serviceLists,serviceListattr,alternative_service,alternative_scale,serviceFullList}
}

function readFromInput(event,load_d3,failHandle=(()=>{})){
    try {
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            // Great success! All the File APIs are supported.
        } else {
            alert('The File APIs are not fully supported in this browser.');
        }
        var f = event.target.files[0]; // FileList object
        var reader = new FileReader();

        reader.onload = function (event) {
            load_d3(event.target.result)
        };
        // Read in the file as a data URL.
        reader.readAsDataURL(f);
    }catch(e){
        failHandle();
    }
}
