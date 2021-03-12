

d3.csv('hpl-quanah-slurm-3-3-2021.csv').then(dataRaw=>{
    const timeRange = [+Infinity,-Infinity];
    const timeEndCut = 2*60*1000; // 2 m
    let timeCutCount = Math.round(Math.min(d3.min(dataRaw,d=>+d.time)*1000-timeEndCut*2,30*60*1000)/60/1000); // 30 m
    const timeCut = timeCutCount*60*1000; // 30 m
    console.log('Duration: ',timeCutCount,'m')
    dataRaw.forEach(r=>{
        r.timeEnd = d3.timeParse('%b-%d-%Y-%H:%M:%S')(r['Month']+'-'+r['Day']+'-'+r['Year']+'-'+r['Time']);
        r.timeEndCut = new Date(+r.timeEnd-timeEndCut);
        r.time = +r.time;
        r.timeStart = new Date(+r.timeEnd-r.time*1000);
        r.timeStartCut = new Date(+r.timeEndCut-timeCut);
        if (r.timeStart<timeRange[0])
            timeRange[0] = r.timeStart;
        if (r.timeEnd>timeRange[1])
            timeRange[1] = r.timeEnd;
    });
    debugger
    let maxtimeCutCount = 0;
    d3.json(`https://influx.ttu.edu:8080/v1/metrics?start=${timeRange[0].toISOString()}&end=${timeRange[1].toISOString()}&interval=1m&value=max&compress=false`).then(_data=>{
        debugger
        const serviceLists = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
        const serviceList_selected = [{"text":"Temperature","index":0},{"text":"Fans_speed","index":2},{"text":"Power_consum","index":3}];
        const alternative_service = ["cpu_inl_temp", "fan_speed", "power_usage"];
        const dataObj = [];
        const time2index = d3.scaleLinear().domain([_data.time_stamp[0]/1000000,_data.time_stamp[1]/1000000]).range([0,1]);
        dataRaw.forEach(r=>{
            const comp = `10.101.${r.Rack}.${r.Node}`;
            const value = +r.gflops;
            const item = {id:comp,class:((value>600)?'High':((value>500)?'Medium':'Low') ),arr:{}};
            const startIndex = Math.round(time2index(+r.timeStart));
            const endIndex = Math.round(time2index(+r.timeEnd));
            if ((endIndex-startIndex) > maxtimeCutCount)
                maxtimeCutCount = (endIndex-startIndex);
            item.arr['gflops'] = d3.range(startIndex,endIndex).map(d=>+r['gflops']);
            alternative_service.forEach((as,asi)=>{
                const seri = serviceList_selected[asi].index;
                if (serviceLists[seri].sub.length>1){
                    serviceLists[seri].sub.forEach((s,si)=>{
                            item.arr[s.text]= _data.nodes_info[comp][as].slice(startIndex,endIndex).map(d=>d[si]<0?undefined:d[si]);
                    });
                }else{
                    const s = serviceLists[seri].sub[0];
                    item.arr[s.text]= _data.nodes_info[comp][as].slice(startIndex,endIndex);
                }
            });
            dataObj.push(item)
        });
        // shap file
        const keys = Object.keys(dataObj[0].arr);
        let shap = 'class,node,time,'+Object.keys(dataObj[0].arr).join(',');
        let dataframe = 'timestamp';
        dataObj.map(d=>{
            keys.forEach(k=>{
                dataframe+=(','+d.id+'-'+k)
            });
        });
        d3.range(0,maxtimeCutCount).forEach(t=>{
            dataframe+=`\n${new Date(time2index.invert(t))}`;
            dataObj.forEach(d=>{
                const values = Object.values(d.arr).map(d=>d[t]).join(',');
                shap+=`\n${d.class},${d.id},${new Date(time2index.invert(t))},${values}`;
                dataframe += ','+values;
            });
        })
    })
})
