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
    });
    return {sampleh,tsnedata,minMaxData};
}
function getServiceSet(compObj,getminmax){
    let notService = {'jobs':true,'cpus':true}
    let comps = d3.values(compObj);
    let sample =comps[0];
    serviceListattr =Object.keys(comps[0]).filter(s=>{
        return _.isArray(sample[s]) && !notService[s]
    });
    const angle = Math.PI*2/serviceListattr.length;
    serviceLists = serviceListattr.map((s,si)=>({
        "text": s,
        "id": si,
        "enable": true,
        "sub": [{"text": s, "id": 0, "enable": true, "idroot": si, "angle": si*angle, "range": getminmax?[Infinity,-Infinity]:[0, 0]}]
    }));
    serviceFullList = [];
    serviceLists.forEach(s=>s.sub.forEach(ss=>serviceFullList.push(ss)));

    serviceList_selected = serviceListattr.map((s,si)=>({"text": s, "index": si}));
    alternative_service = serviceListattr.slice();
    alternative_scale = serviceListattr.map(d=>1);

    comps.forEach(c=>{
        serviceFullList.forEach(s=>{
            const range = d3.extent(c[s.text]);
            if (range[0]<s.range[0])
                s.range[0] = range[0];
            if (range[1]>s.range[1])
                s.range[1] = range[1];
        })
    })

}
