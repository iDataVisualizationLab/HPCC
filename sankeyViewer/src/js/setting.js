// serviceFullList = [{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]},{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]},{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]},{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]
serviceListattr = ["arrTemperature", "arrMemory_usage", "arrFans_health", "arrPower_usage", "arrJob_scheduling"];
var serviceLists = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
serviceFullList = [];
serviceLists.forEach(s=>s.sub.forEach(s=>serviceFullList.push(s)));
debugger
var serviceList_selected = [{"text":"Temperature","index":0},{"text":"Memory_usage","index":1},{"text":"Fans_speed","index":2},{"text":"Power_consum","index":3}];
var alternative_service = ["cpu_inl_temp", "memory_usage", "fan_speed", "power_usage"];
var alternative_scale = [1,1,1,0.5];
var runopt ={ // run opt global
    minMax: 0,
};
let hosts = [];
let outlierMultiply = 1.5
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
    hosts = d3.keys(dataRaw.nodes_info).map(ip=>{
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
    var alternative_service = ["cpu_inl_temp", "memory_usage", "fan_speed", "power_usage"];
    var alternative_scale = [1,1,1,0.5];

    var sampleh = {};
    var ser = serviceListattr.slice();
    ser.pop();
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
function calculateServiceRange() {
    debugger
    serviceFullList.forEach(s=>{
        s._range = s.range.slice();
    });
    serviceList_selected.forEach((s, si) => {
        const sa = serviceListattr[s.index]
        let min = +Infinity;
        let max = -Infinity;
        _.without(Object.keys(sampleS),'timespan').map(h => {
            let temp_range = d3.extent(_.flatten(sampleS[h][sa]));
            if (temp_range[0] < min)
                min = temp_range[0];
            if (temp_range[1] > max)
                max = temp_range[1];
        });
        serviceLists[si].sub.forEach(sub => sub.range = [min, max]);
    })
}
function initTsnedata() {
    tsnedata = {};
    Object.keys(sampleS).filter(d=>d!=='timespan').forEach(h => {
        tsnedata[h] = sampleS.timespan.map((t, i) => {
            let array_normalize = _.flatten(serviceLists.map(a => d3.range(0, a.sub.length).map(vi => {
                let v = sampleS[h][serviceListattr[a.id]][i][vi];
                return  v === null? undefined:d3.scaleLinear().domain(a.sub[0].range)(v);
            })));
            array_normalize.name = h;
            array_normalize.timestep = i;
            return array_normalize;
        })
    });
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
    sampleh.timespan = time_stamp.map(d=>d);
    let tsnedata = {};
    let minMaxData = {};
    let data = dataRaw.nodes_info;
    hosts.forEach(h => {
        // console.time(h.name)
        sampleh[h.name] = {};
        tsnedata[h.name] = [];
        minMaxData[h.name] = [];
        ser.forEach(s => sampleh[h.name][s] = []);
        alternative_service.forEach((sa, si) => {
            var scale = alternative_scale[si];
            sampleh.timespan.forEach((dt, ti) => {
                let value = [];
                if (!_.isArray(data[h.ip][sa][ti])){
                    data[h.ip][sa][ti] = [data[h.ip][sa][ti]]
                }
                for (let ii = 0;ii<serviceLists[si].sub.length;ii++){
                    value.push((data[h.ip][sa][ti][ii]==='' || (data[h.ip][sa][ti][ii]===undefined||data[h.ip][sa][ti][ii]===null))?null:data[h.ip][sa][ti][ii]*scale)
                }
                let arrID = serviceListattr[si];
                sampleh[h.name][arrID][ti] = value;
                if (tsnedata[h.name][ti]===undefined){
                    tsnedata[h.name][ti] = [];
                    tsnedata[h.name][ti].name = h.name;
                    tsnedata[h.name][ti].timestep =ti;
                    minMaxData[h.name][ti] = [[],[]];
                    minMaxData[h.name][ti].name = h.name;
                    minMaxData[h.name][ti].timestep =ti;
                }
                value.forEach(v=>{
                    const val = v === null ? undefined : scaleService[si](v);
                    tsnedata[h.name][ti].push(val);
                    minMaxData[h.name][ti][0].push(val);
                    minMaxData[h.name][ti][1].push(val);
                });
            })
        })

        // console.timeEnd(h.name)
    });
    return {sampleh,tsnedata,minMaxData};
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

function getsummaryservice(){
    let histodram = {
        resolution:20,
    };
    // let dataf = _.reduce(_.chunk(_.unzip(data),serviceFull_selected.length),function(memo, num){ return memo.map((d,i)=>{d.push(num[i]); return _.flatten(d); })});
    let dataf = _.unzip(_.flatten(_.keys(tsnedata).map(e=>tsnedata[e]),1));
    dataMetric = dataf;
    let ob = {};
    dataf.forEach((d,i)=>{
        d=d.filter(e=>e!==undefined).sort((a,b)=>a-b);
        let r;
        if (d.length){
            var x = d3.scaleLinear()
                .domain(d3.extent(d));
            var histogram = d3.histogram()
                .domain(x.domain())
                .thresholds(x.ticks(histodram.resolution))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
                .value(d => d);
            let hisdata = histogram(d);

            let sumstat = hisdata.map((d,i)=>[d.x0+(d.x1-d.x0)/2,(d||[]).length]);
            r = {
                axis: serviceFullList[i].text,
                q1: ss.quantileSorted(d,0.25) ,
                q3: ss.quantileSorted(d,0.75),
                median: ss.medianSorted(d) ,
                // outlier: ,
                arr: sumstat};
            if (d.length>4)
            {
                // const iqr = r.q3-r.q1;
                // r.outlier = _.unique(d.filter(e=>e>(r.q3+outlierMultiply*iqr)||e<(r.q1-outlierMultiply*iqr)));
                r.outlier = [];
            }else{
                r.outlier =  _.unique(d);
            }
        }else{
            r = {
                axis: serviceFullList[i].text,
                q1: undefined ,
                q3: undefined,
                median: undefined ,
                outlier: [],
                arr: []};
        }
        ob[r.axis] = r;

    });
    return ob;
}
