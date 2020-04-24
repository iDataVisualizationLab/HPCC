let key_order = ["ThermalTotalPSUHeatDissipation-PowerToCoolRatio", "ThermalTotalPSUHeatDissipation-SysAirflowPerSysInputPower", "PowerMetricsTotalStoragePower-TotalCPUPower", "PowerMetricsTotalStoragePower-SystemPowerConsumption", "DIMMSocketA1TemperatureReading-TemperatureReading", "CUPSSystemUsage-CPUUsage", "Fan5RPMReading-RPMReading", "Fan4RPMReading-RPMReading", "CUPSSystemUsage-SystemUsage", "CUPSSystemUsage-MemoryUsage", "Fan2RPMReading-RPMReading", "DIMMSocketA2TemperatureReading-TemperatureReading", "DIMMSocketA3TemperatureReading-TemperatureReading", "CPU1TempTemperatureReading-TemperatureReading", "CPU2TempTemperatureReading-TemperatureReading", "Fan6RPMReading-RPMReading", "DIMMSocketA4TemperatureReading-TemperatureReading", "PowerMetricsTotalStoragePower-TotalMemoryPower", "DIMMSocketA5TemperatureReading-TemperatureReading", "Fan1RPMReading-RPMReading", "Fan3RPMReading-RPMReading", "CUPSSystemUsage-IOUsage", "DIMMSocketA6TemperatureReading-TemperatureReading"];
function newdatatoFormat_noSuggestion (data,separate){
    separate = separate||"-";
    serviceList = [];
    serviceLists = [];
    serviceListattr = [];
    serviceAttr={};
    hostList ={data:{hostlist:{}}};
    // FIXME detect format
    const variables = _.without(Object.keys(data[0]),'timestamp','time');
    data.forEach(d=>variables.forEach(k=>d[k] = d[k]===""?null:(+d[k]))) // format number
    // test sepatate

    if (variables.find(k=>k.split(separate).length>1)===undefined)
        separate = "-";


    let keys ={};

    // testing---------
    if (variables.find(v=>v.includes(key_order[0]))){
        variables.sort((a,b)=>key_order.findIndex(k=>a.includes(k))-key_order.findIndex(k=>b.includes(k)))
    }
    //-----------------
    variables.forEach((k,ki)=>{
        let split_string = k.split(separate);
        const nameh = split_string.shift();
        hostList.data.hostlist [nameh] = {
            rack: 1,//nameh.split('.')[2],
            node: 1,//.split('.')[3],
            id : nameh,
        };
        let currentkey = split_string.join(separate);
        // const keys_replace =Object.keys(basic_service).map(k=>extractWordsCollection(getTermsArrayCollection(k),currentkey,k)).filter(d=>Object.keys(d).length);
        if(!keys[currentkey])
            keys[currentkey] = {r:undefined,vi:[]};
        // if (keys_replace.length)
        //     keys[currentkey].r = Object.keys(keys_replace[0])[0]||0;
        keys[currentkey].vi.push(ki)
    });

    // check unionkeys
    d3.keys(hostList.data.hostlist).forEach(hname=>{
        Object.keys(keys).forEach((k,i)=>{
            if (data.columns.find(c=>c===hname+separate+k)===undefined)
                delete keys[k];
        })
    });

    serviceQuery["csv"]= serviceQuery["csv"]||{};

    let validAxis = 0;
    Object.keys(keys).forEach((k,i)=>{
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
        let range =[+Infinity,-Infinity];
        keys[k].vi.forEach(vi=>{
            let temprange = d3.extent(data,d=>+d[variables[vi]]);
            if (temprange[0]<range[0])
                range[0] = temprange[0];
            if (temprange[1]>range[1])
                range[1] = temprange[1];
        });
        // if (keys[k].r) {
        //     let suggest_range = serviceLists_or.find(d => d.text === keys[k].r).sub[0].range;
        //     if (suggest_range[0]<=range[0]&&suggest_range[1]>=range[1])
        //         range = suggest_range;
        // }
        if (range[0]!==range[1]){
            validAxis++;
        }else{
            singleDataAxis.push(i);
        }
        const temp = {"text":k,"id":i,"enable":range[0]!==range[1],"sub":[{"text":k,"id":0,"enable":true,"idroot":i,"angle":i*2*Math.PI/(Object.keys(keys).length),"range":range}]};
        thresholds.push(range);
        serviceLists.push(temp);
    });
    serviceLists.forEach(s=>{
        let g = [d3.min(s.sub,d=>d.range[0]),d3.max(s.sub,d=>d.range[1])];
        s.sub.forEach(d=>d.range = g);
    })
    serviceList_selected = serviceList.map((d,i)=>{return{text:d,index:i}});
    serviceFullList = serviceLists2serviceFullList(serviceLists);
    scaleService = serviceFullList.map(d=>d3.scaleLinear().domain(d.range));
    let currentValidAxis = 0;
    serviceFullList.forEach(d=>{
        d.enable = d.range[0]!==d.range[1];
        if (d.enable) {
            d.angle = currentValidAxis * 2 * Math.PI / validAxis;
            currentValidAxis++;
        }else
            d.angle = 0;
    });
    const host_name = Object.keys(hostList.data.hostlist);
    sampleS = {};
    tsnedata = {};
    sampleS['timespan'] = data.map(d=>new Date(d.time||d.timestamp))
    data.forEach(d=>{
        host_name.forEach(h=> {
            serviceListattr.forEach((attr,i) => {
                if (sampleS[h]===undefined) {
                    sampleS[h] = {};
                    tsnedata[h] = [];
                }
                sampleS[h][attr] = sampleS[h][attr]||[];
                let currentIndex = sampleS[h][attr].length;
                if (tsnedata[h][currentIndex]===undefined){
                    tsnedata[h][currentIndex] = [];
                    tsnedata[h][currentIndex].name = h;
                    tsnedata[h][currentIndex].timestep =currentIndex;
                }
                let retievedData = processResult_csv(d[h+separate+attr],attr);
                // let retievedData = d[h+separate+attr];
                sampleS[h][attr].push(retievedData);
                tsnedata[h][currentIndex].push(retievedData[0]===null?0:scaleService[i](retievedData[0])||0);
            });
        })
    });
}