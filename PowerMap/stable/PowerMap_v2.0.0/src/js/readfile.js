let _tempData={};
function handleMetricCSV(){
    var fileName = $(this).val();
    //replace the "Choose a file" label
    $(this).next('.custom-file-label').html(fileName);
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
    var fileName = $(this).val();
    //replace the "Choose a file" label
    $(this).next('.custom-file-label').html(fileName);
    readFromInput(event,(_data)=>{
        d3.json(_data).then(data=>{
            let jobs = data;
            if(_.isArray(data))
            {
                jobs = {};
                let getTime = d=>(+new Date(d) /1000);
                if (+new Date(data[0].start_time)<9999999999)
                    getTime = d=>+new Date(d);
                data.forEach(d=>{
                    d.start_time = getTime(d.start_time??d.startTime);
                    d.submit_time = getTime(d.submit_time??d.submitTime);
                    if (d.end_time||d.finish_time||d.endTime||d.finishTime)
                        d.end_time = getTime(d.finish_time??d.end_time??d.finishTime??d.endTime);
                    d.jobID = d.jobID.replace('.','|');
                    d.user_name = d.user_name??d.user;
                    // d.user_name = d.user_name??d.user;
                    jobs[d.jobID] = d;
                })
            }
            debugger
            // Object.values(data).forEach(d=>{
            //     d.start_time = +new Date(d.start_time);
            //     d.submit_time = +new Date(d.start_time);
            //     d.node_list = d.node_list?d.node_list:d.nodes.slice();
            //     delete d.nodes;
            //     d.node_list_obj = {};
            //     d.node_list.forEach(c=>d.node_list_obj[c]=1)
            //     if (d.finish_time)
            //         d.finish_time = +new Date(d.start_time);
            // });
            _tempData.jobs_info = jobs;
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
        let timeInterval = 5*60;
        const time2Index = d3.scaleLinear();
        debugger
        if (_tempData.time_stamp){
            timeRange = [_tempData.time_stamp[0]/1000,_tempData.time_stamp[_tempData.time_stamp.length-1]/1000];
            timeInterval = (_tempData.time_stamp[1]-_tempData.time_stamp[0])/1000;
        }
        const jobs_info = {};
        Object.keys(_tempData.jobs_info).forEach(jid=> {
            const j = _tempData.jobs_info[jid];
            j.jobID = (j.jobID??jid).replace('.', '|');
            jobs_info[j.jobID] = j;
            // if (j.start_time<timeRange[0]){
            //     timeRange[0] = j.start_time;
            // }
            // if (j.end_time)
            // {
            //     if (j.end_time>timeRange[1])
            //         timeRange[1] = j.end_time;
            // }else {
            //     if (j.start_time>timeRange[1])
            //         timeRange[1] = j.start_time;
            // }
        });
        const time_stamp = _tempData.time_stamp;//d3.range(0,Math.ceil((timeRange[1]-timeRange[0])/timeInterval)).map(d=>(d*timeInterval+timeRange[0])*1000);
        time2Index.domain(timeRange).range([0,time_stamp.length-1]);
        if (Object.keys(nodes_info).length){
            const startIndex = Math.floor(time2Index(_tempData.time_stamp[0]/1000));
            const endIndex = Math.ceil(time2Index(_tempData.time_stamp[_tempData.time_stamp.length-1]/1000));
            Object.values(nodes_info).forEach(d=>{
                alternative_service.forEach(s=>{
                    d[s] = [...d3.range(0,startIndex),...d[s],...d3.range(endIndex+1,time_stamp.length-1)]
                });
                d.jobs = time_stamp.map(d=>[]);
            });
        }

        Object.values(jobs_info).forEach(j=>{
            const startIndex = Math.max(0,Math.ceil(time2Index(j.start_time)));
            const endIndex = Math.min(j.end_time?Math.ceil(time2Index(j.end_time)):time2Index.range()[1],time2Index.range()[1]);

            j.nodes.forEach(comp=>{
                if ( !nodes_info[comp]) // new node
                {
                    nodes_info[comp] = {};
                    alternative_service.forEach(s=>nodes_info[comp][s]=new Array(time_stamp.length));
                    nodes_info[comp].jobs = time_stamp.map(d=>[]);
                }
                for (let i = startIndex;i<=endIndex;i++)
                    nodes_info[comp].jobs[i].push(j.jobID);
            });
        });
        // handleInputSlumrData(_tempData)
        _tempData.time_stamp = _tempData.time_stamp.map(d => d * 1000000);
        request.updateData(new Promise((resolve, reject) => {resolve(handleInputSlumrData(_tempData))}));
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

    const time_stamp = data.map(d=>+new Date(d.time||d.timestamp));
debugger
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
