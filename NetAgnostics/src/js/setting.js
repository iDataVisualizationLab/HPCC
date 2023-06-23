let serviceLists,serviceList_selected,alternative_service,alternative_scale;
TTUsetting();
function TTUsetting(){
    serviceFullList = [{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]},{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]},{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]},{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]
    // serviceListattr = ["arrTemperature", "arrMemory_usage", "arrFans_health", "arrPower_usage"];
    serviceLists = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
    serviceList_selected = [{"text":"Temperature","index":0},{"text":"Memory_usage","index":1},{"text":"Fans_speed","index":2},{"text":"Power_consum","index":3}];
    alternative_service = ["cpu_inl_temp", "memory_usage", "fan_speed", "power_usage"];
    alternative_scale = [1,1,1,0.5];
}
let colorScaleList = {
    n: 7,
    rainbow: ["#000066", "#4400ff", "#00ddff", "#00ddaa", "#00dd00", "#aadd00", "#ffcc00", "#ff8800", "#ff0000", "#660000"],
    colorBlueRed:  ["#9dbee6", "#afcae6", "#c8dce6", "#e6e6d8", "#e6d49c", "#e6852f", "#e61e1a"],
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
let metricRangeMinMax=false;
const undefinedValue = -1;
const JOB_STATE = 'job_state';
const coreLimit = 128;
const initColorFunc =  d3.scaleLinear().domain([0,0.2, 0.4, 0.6, 0.8, 0.9, 1]).range(colorScaleList.colorBlueRed)

function handleDataUrl(_data) {
    if (_data.time_stamp[0] > 999999999999999999)
        _data.time_stamp = _data.time_stamp.map(d => new Date((+d) / 1000000));
    else if (_data.time_stamp[0] < 9999999999) {
        _data.time_stamp = _data.time_stamp.map(d => new Date((+d) * 1000));
    }
    const timerange = d3.extent(_data.time_stamp);
    const compute = Object.entries(_data.nodes_info);
    const allDim = {};
    compute.forEach(d => {
        Object.keys(d[1]).forEach(k => {
            if (!allDim[k]) {
                allDim[k] = d[1][k].find(d => _.isNumber(d)) !== undefined ? 'number' : 'other';
            }
        })
    });
    // const dimensionKeys = Object.keys(compute[0][1]).filter(s=>compute[0][1][s].find(d=>_.isNumber(d)));
    let dimensionKeys = Object.keys(allDim).filter(k => allDim[k] === 'number');
    const indexMem = dimensionKeys.findIndex(d => d.match(/memory/i));
    if (indexMem !== -1)
        dimensionKeys = [dimensionKeys[indexMem], ...dimensionKeys.slice(0, indexMem), ...dimensionKeys.slice(indexMem + 1)];

    const dimensions = dimensionKeys.map((s, i) => ({
        text: s,
        index: i, range: [Infinity, -Infinity], scale: d3.scaleLinear(),
        order: i,
        angle: (i / dimensionKeys.length) * 2 * Math.PI,
        enable: true,
        suddenRange: [Infinity, -Infinity]
    }));
    const computers = {};

    let jobonnode = undefined;
    compute.forEach(d => {
        if (_data.nodes_info[d[0]].job_id) {
            jobonnode = jobonnode ?? {};
            _data.nodes_info[d[0]].job_id.forEach(d => {
                d.forEach(j => jobonnode[j] = true);
            })
        }
        computers[d[0]] = {
            job_id: [],
            key: d[0],
            user: [],
            drawData: []
        };
        dimensionKeys.forEach((k, ki) => {
            const comp = d[0];
            d[1][k] = d[1][k] ?? (_data.time_stamp.map(() => null));
            computers[comp][k] = (d[1][k] ?? []);
            computers[comp][k].sudden = [];
            let current = +computers[comp][k][0];
            computers[comp][k].forEach((d, ti) => {
                if (d === '') {
                    computers[comp][k][ti] = null;
                    d = null;
                }
                if (d !== null) {
                    if (d < dimensions[ki].range[0])
                        dimensions[ki].range[0] = d;
                    if (d > dimensions[ki].range[1])
                        dimensions[ki].range[1] = d;
                }
                const sudden = (+d) - current;
                computers[comp][k].sudden[ti] = sudden;
                current = +d;

                if (sudden <  dimensions[ki].suddenRange[0])
                    dimensions[ki].suddenRange[0] = sudden;
                if (sudden >  dimensions[ki].suddenRange[1])
                    dimensions[ki].suddenRange[1] = sudden;
            })
        })
    });
    // update scale
    dimensions.forEach(d => {
        const recomend = getRefRange(d.text, d.range);
        d.min = d.range[0];
        d.max = d.range[1];
        d.possibleUnit = recomend;
        // d.range = [recomend];
        d.range = metricRangeMinMax ? [d.min, d.max] : recomend.range.slice();
        d.scale.domain(d.range)
    });
    const jobs = {};
    const job_ref = undefined;
    // need update core info to job_ref
    // improve speed in delete property
    const _jobs_info = {};
    const jobWarning = {jobs_info:Object.keys(_data.jobs_info).length,jobs_onNode: Object.keys(jobonnode).length}
    Object.keys(_data.jobs_info).forEach(job_id => {
        // remove job not belong to this cluster
        if (jobonnode && (!jobonnode[job_id])) {
            // delete _data.jobs_info[job_id]
            return;
        }
        _jobs_info[job_id] = _data.jobs_info[job_id];
        _data.jobs_info[job_id].finish_time = _data.jobs_info[job_id].finish_time ?? _data.jobs_info[job_id].end_time;
        const user_name = _data.jobs_info[job_id].user_name;
        const job_name = _data.jobs_info[job_id].job_name ?? _data.jobs_info[job_id].name;
        const start_time = adjustTime(_data.jobs_info[job_id].start_time);
        const end_time = adjustTime(_data.jobs_info[job_id].finish_time);
        const node_list = _data.jobs_info[job_id].node_list ?? _data.jobs_info[job_id].nodes;
        // debugger
        const cpus_ = _data.jobs_info[job_id].cpus ?? (_data.jobs_info[job_id].cpu_cores);
        const cores = cpus_ / node_list.length;
        let node_list_obj = {};
        if (job_ref && job_ref[job_id]) {
            node_list_obj = job_ref[job_id].node_list_obj;
        } else
            node_list.forEach((n) => node_list_obj[n] = cores);
        if (node_list.length)
            jobs[job_id] = {
                job_id,
                user_name,
                job_name,
                node_list,
                node_list_obj,
                _node_list: node_list.slice(),
                _node_list_obj: {...node_list_obj},
                cpus: cpus_,
                cpu_cores: cores,
                summary: [],
                start_time,
                finish_time: end_time,
                [JOB_STATE]:_data.jobs_info[job_id][JOB_STATE], // Dec 16, 2022
                _data: _data.jobs_info[job_id]
            }
    });
    jobWarning.overlap = Object.keys(_jobs_info).length;
    _data.jobs_info = _jobs_info;
    console.log(jobWarning)

    const {users} = handleCUJ({computers, jobs}, _data.time_stamp);
    // add new DIm
    handleWorkload(computers, dimensions, dimensionKeys, metricRangeMinMax);
    const coreUsageIndex = dimensions.length-1;
    const tsnedata = {};
    Object.keys(computers).forEach(d => {
        tsnedata[d] = _data.time_stamp.map((t, ti) => {
            const item = dimensionKeys.map((k, ki) => {
                return dimensions[ki].scale(computers[d][k][ti] ?? undefined) ?? null;
            });
            item.key = d;
            item.timestep = ti;
            item.name = d;
            return item
        })
    });
    const powerIndex = dimensions.findIndex(d=>d.possibleUnit.type==='power' && d.text.match(/cpu/i));

    const scheme = {data: _data, users, computers, jobs, tsnedata, time_stamp: _data.time_stamp, timerange};
    scheme.powerIndex = powerIndex;
    scheme.node_state = _data.node_state??[];
    scheme.nodes_alloc = _data.nodes_alloc??[];

    // this only for javascript version
    let da = 2*Math.PI/(dimensions.length-1);
    dimensions.forEach((d,i)=>{
        d.id = i;
        d.idroot = i;
        d.angle = da*i;
        d.enable = true;
    })
    serviceLists = dimensions.map(d=>({text:d.text,id:d.id,enable:true,sub:[d]}))
    serviceFullList = dimensions;
    //----------javascript version

    return{sampleS:computers,tsnedata:tsnedata,...scheme};
}
function handleSmalldata(dataRaw){
    let hosts = Object.keys(dataRaw.nodes_info).map(ip=>{
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
    let hosts = Object.keys(dataRaw.nodes_info).map(ip=>{
        return {
            ip: ip,
            name: ip,
        }
    });
    Object.keys(dataRaw.jobs_info).forEach(jID=>{
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
    Object.keys(nodes_info).forEach(hname=>{
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
        Object.keys(nodes_info).forEach(h=> {
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

function handleWorkload(computers, dimensions, dimensionKeys, metricRangeMinMax) {
    const k = 'core usage';
    dimensionKeys.push(k)
    const i = dimensions.length;
    const dimT = {
        text: k,
        index: i,
        range: [Infinity, -Infinity],
        scale: d3.scaleLinear(),
        order: i,
        possibleUnit: {type: null, unit: null, range: [0, 100]},
        enable: true
    };
    dimensions.push(dimT)
    dimensions.forEach((d, i) => {
        d.angle = (i / dimensions.length) * 2 * Math.PI;
    });

    function getdata(d) {
        // return (Math.min(1,d3.sum(Object.values(d))/coreLimit)) *100;
        return d3.sum(Object.values(d)) / coreLimit * 100;
    }

    Object.keys(computers).forEach((comp) => {
        computers[comp][k] = [];
        computers[comp][k].sudden = [];
        computers[comp][k][0] = getdata(computers[comp]['cpus'][0]);
        let current = computers[comp][k][0];
        computers[comp]['cpus'].forEach((_d, ti) => {
            const d = getdata(_d ?? {});
            computers[comp][k][ti] = d;
            if (_d !== null) {
                if (d < dimT.range[0])
                    dimT.range[0] = d;
                if (d > dimT.range[1])
                    dimT.range[1] = d;
            }
            computers[comp][k].sudden[ti] = (+d) - current;
            current = +d;
        })
    });

    dimT.min = dimT.range[0];
    dimT.max = dimT.range[1];
    dimT.range = metricRangeMinMax ? [dimT.min, dimT.max] : [0, 100];
    dimT.scale.domain(dimT.range)

}

function handleCUJ({computers, jobs}, timestamp) {
    const compute_user = {};
    const jobm = {}
    Object.keys(computers).forEach((k) => {
        jobm[k] = timestamp.map(() => ({}));
        const d = computers[k];
        d.user = [];
        d.jobName = timestamp.map(() => []);
        d.job_id = timestamp.map(() => []);
        d.users = timestamp.map(() => []);
        d.cpus = timestamp.map(() => ({}));
        compute_user[k] = timestamp.map(() => ({}));
    });

    const jobData = Object.entries(jobs);
    jobData.forEach(jj => {
        const j = {key: jj[0], value: jj[1]}
        j.value.start_Index = timestamp.findIndex((t) => t > j.value.start_time);
        if (j.value.start_Index > 0)
            j.value.start_Index--;
        else if (j.value.start_Index === -1)
            j.value.start_Index = timestamp.length - 1;
        j.value.finish_Index = j.value.finish_time ? timestamp.findIndex((t) => t > j.value.finish_time) : -1;
        if (j.value.finish_Index > 0)
            j.value.finish_Index--;
        else if (j.value.finish_Index === -1)
            j.value.finish_Index = timestamp.length - 1;
        j.value.node_list.forEach(comp => {
            if (computers[comp]) {
                for (let t = j.value.start_Index; t <= j.value.finish_Index; t++) {
                    if (!jobm[comp][t][j.key]) {
                        computers[comp].job_id[t].push(j.key);
                        jobm[comp][t][j.key] = false;
                    }
                    computers[comp].cpus[t][j.key] = (j.value.node_list_obj[comp]);
                    if (!compute_user[comp][t][j.value.user_name]) {
                        compute_user[comp][t][j.value.user_name] = true;
                        computers[comp].users[t].push(j.value.user_name);
                    }
                }
            }
        })
    });
    const users = getUsers(jobs, computers, timestamp.length);
    Object.keys(users).forEach((k, i) => {
        users[k].node.forEach((c) => computers[c] ? computers[c].user.push(k) : '');
    });
    return {users}
}

function getUsers(jobs, computers, timestep = 1) {
    const user_job = d3.groups(Object.entries(jobs), (d) => (d[1])['user_name'], (d) => (d[0]).split('.')[0].trim());
    const users = {};
    user_job.forEach((u, i) => {
        const k = u[0];
        // const  u =user_job[k];
        const job = [];
        let totalCore = 0;
        let totalCore_share = 0;
        let totalCore_notShare = 0;
        const nodeObj = {};
        u[1].map(e => e[1].map(d => {
            job.push(d[0]);
            const core = d[1].cpus * (d[1].finish_Index - d[1].start_Index + 1);
            totalCore += core;
            if (d[1].finish_Index === d[1].start_Index) {
                d[1].node_list.forEach((comp) => {
                    if (computers[comp].users[d[1].start_Index].length === 1) {
                        totalCore_notShare += d[1].node_list_obj[comp];
                    } else {
                        totalCore_share += d[1].node_list_obj[comp];
                    }
                })
            }
            d[1].node_list.forEach(n=>nodeObj[n]=true);
        }));
        const node = Object.keys(nodeObj);
        totalCore = totalCore / timestep;
        totalCore_notShare = totalCore_notShare / timestep;
        totalCore_share = totalCore_share / timestep;
        // const node = _.uniq(_.flattenDeep(_.values(u).map(d=>d.map(d=>(job.push(d.key),totalCore+=d3.sum(Object.values(d.value.node_list_obj)),d.value.node_list)))));
        users[k] = {node, job, totalCore, totalCore_notShare, totalCore_share}
    });
    return users;
}

function adjustTime(d) {
    if (d > 999999999999999999)
        return d / 1000000;
    else if (d < 9999999999) {
        return d * 1000;
    }
    return d;
}