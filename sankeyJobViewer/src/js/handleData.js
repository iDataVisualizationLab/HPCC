let maxCore = 36;
function queryLayout() {
    return d3.json('../jobviewer/src/data/layout.json').then(layout => {
        Layout.data = layout;
        Layout.data_flat = d3.entries(layout).map(d=>(d.value=_.flatten(d.value).filter(e=>e!==null),d));
        let {tree,compute_layoutLink} = data2tree(Layout.data_flat);
        Layout.tree = tree;
        Layout.compute_layout = compute_layoutLink;
        userPie.maxValue(d3.keys(Layout.compute_layout).length*maxCore);
    });
}

function handleData(data){
    const computers = data[COMPUTE];
    _.mapObject(computers,(d,i)=>(d.user=[],d.jobName=[]))
    const jobs = data[JOB]; // object
    const rack = Layout.data;
    const user_job = d3.nest()
        .key(d=>d.value[USER]) //user
        .key(d=>d.key.split('.')[0]) //job array
        .object(d3.entries(jobs));
    const users = _.mapObject(user_job,(u,i)=>{
        const job = [];
        let totalCore = 0;
        const node = _.uniq(_.flatten(_.values(u).map(d=>d.map(d=>(job.push(d.key),totalCore+=d.value.cpu_cores,d.value.node_list)))));
        node.forEach(c=> computers[c].user.push(i))
        const jobMain = _.uniq(job.map(j=>j.split('.')[0]));
        return {node,job,jobMain,totalCore}
    });
    const jobName_job = d3.nest()
        .key(d=>d.value[JOBNAME].slice(0,3)) //user
        .key(d=>d.key.split('.')[0]) //job array
        .entries(d3.entries(jobs));
    const jobByNames = {};
    jobName_job.forEach((val,i)=>{
        let d = val.values;
        const job = [];
        const jobName = [];

        const node = _.uniq(_.flatten(d.map(d=>d.values.map(d=>{
            job.push(d.key);
            jobName.push(d.value[JOBNAME]);
            return d.value.node_list}))));
        let key = val.key;
        let lengthK = _.uniq(jobName).length;
        if(lengthK>1)
            key +='...(+'+lengthK+')';
        else
            key = jobName[0];
        d.map(d=>d.values.forEach(d=>d.value['job_name_short']= key))
        node.forEach(c=> computers[c].jobName.push(key));
        const jobMain = _.uniq(job.map(j=>j.split('.')[0]));
        jobByNames[key] =  {node,job,jobMain}
    });
    return {computers,jobs,jobByNames,users}
}
function adjustTree(sampleS,computers){
    let {tree,compute_layoutLink} = data2tree(Layout.data_flat,sampleS,computers);
    Layout.tree = tree;
}

// Setup the positions of outer nodes
function getData(d){
    if ( vizservice[serviceSelected].text==='User')
        return d.user;//?userIndex[d.user[0]]:-1;
    if ( vizservice[serviceSelected].text==='Radar'&&d.cluster){
        return d.cluster.length?d.cluster[0].name:d.cluster.name;
    }
    return d.metrics[vizservice[serviceSelected].text]
}

function getData_delta(d){
    if ( vizservice[serviceSelected].text!=='User' && vizservice[serviceSelected].text!=='Radar')
        return d.metrics_delta[vizservice[serviceSelected].text];
    return 0;
}

function data2tree(data,sampleS,computers){
    let serviceName = null;
    const compute_layoutLink = {};
    const tree =  {name:"__main__",children:data.map(d=>{
            const el = {
                name:d.key,
                children:d.value.map(c=>{
                        const item = {
                            name:c,
                            value:1,
                            metrics:{},
                            metrics_delta:{},
                            user: computers?computers[c].user:[],
                            jobName: computers?computers[c].jobName:[]
                        };
                        if (sampleS){
                            serviceFullList.forEach(s=>item.metrics[s.text]=_.last(sampleS[c][serviceListattr[s.idroot]])[s.id]);
                            if (computers)
                                computers[c].metric = item.metrics;
                            if (Layout.computers_old){
                                serviceFullList.forEach(s=>item.metrics_delta[s.text] = item.metrics[s.text]-Layout.computers_old[c].metric[s.text]);
                            }
                        }
                        compute_layoutLink[c] = d.key;
                        return item;
                    })
            };
            el.summary={};
            if (sampleS)
                serviceFullList.forEach(s=>{
                    const dataarr = el.children.map(d=>d.metrics[s.text]);
                    el.summary[s.text] = {
                        min: d3.min(dataarr),
                        max:d3.max(dataarr),
                        // q1:d3.min(dataarr),
                        // q3:d3.min(dataarr),
                        // median:d3.min(dataarr),
                        mean: d3.mean(dataarr),
                        // std:d3.min(dataarr),
                    };
                });
            return el;
    })
    };
    return {tree,compute_layoutLink};
}
let currentDraw=()=>{};
let tsnedata = {};
function queryData(data) {
    const data_ = handleDataUrl(data);
    let  sampleS = data_.sampleS;
    tsnedata = data_.tsnedata;
    let {computers,jobs,users,jobByNames} = handleData(data);
    adjustTree(sampleS,computers);
    Layout.currentTime = data.currentTime;
    Layout.users = users;
    Layout.jobs = jobs;
    Layout.jobByNames = jobByNames;
    Layout.computers_old = computers;
    currentDraw = ()=>{
        // drawObject.draw();
        userPie.data(Layout.users).draw();
        d3.select('#RankingList tbody').selectAll('tr')
            .data(Layout.snapshot.filter(d=>d.highlight).sort((a,b)=>Math.abs(_.last(b.stackdelta))-Math.abs(_.last(a.stackdelta))).map(d=>[d.key,d.value,d.stackdelta.map(e=>`<span class="${e>0?'upsymbol':(e===0?'equalsymbol':'downsymbol')}"></span>`).join(''),`${_.last(d.stackdelta)>0?'+':''}${_.last(d.stackdelta)}`]),d=>d[0])
            .join('tr').selectAll('td')
            .data(d=>d).join('td').html(d=>d);

    };
    createdata();
    // _.partial(draw,{computers,jobs,users,jobByNames,sampleS},currentTime);
    currentDraw();
    // currentDraw = _.partial(draw,{computers,jobs,users,jobByNames,sampleS},currentTime);
    // currentDraw(serviceSelected);
}
function createdata(){
    if (!Layout.order){ // init order
        Layout.order = _.flatten(Layout.data_flat.map(d=>d.value));
        Layout.order.object = {};
        Layout.order.forEach((c,i)=>Layout.order.object[c]=i);
    }
    serviceName = vizservice[serviceSelected];
    let dataviz = [];
    Layout.tree.children.forEach(r=>r.children.forEach(c=>{
        let data = {data:c,value:getData(c),key:c.name};
        data.drawData  = getDrawData(data);
        dataviz.push(data);
    }));
    Layout.snapshot = dataviz
    // dataviz.sort((a,b)=>-Layout.order.object[b.key]+Layout.order.object[a.key]);
    // dataviz.forEach((d,i)=>d.id=i);
    // drawObject.data(dataviz);
}
let handleDataComputeByUser = function({computers,jobs}){
    if (handleDataComputeByUser.mode==='core')
        return handleDataComputeByUser_core(computers,jobs);
    else
        return handleDataComputeByUser_compute(computers,jobs);
};
handleDataComputeByUser.mode = 'core';
function handleDataComputeByUser_core(computers,jobs){
    debugger
    let data = [];
    for (let comp in computers){
        let condition = false;
        let item = {key:comp,values:[],users:[],range:[Infinity,-Infinity],data:computers[comp]};
        computers[comp].job_id.forEach((jIDs,i)=>{
            if (jIDs.length){
                let jobArr = jIDs.map(j=>jobs[j]).filter(d=>Layout.userSelected[d.user_name]);
                if (jobArr.length){
                    let user_name = {};
                    let job_name = d3.nest().key(d=>d.job_name)
                        .rollup(d=>d3.sum(d,e=>(user_name[e.user_name]=true,e.node_list_obj[comp]))).entries(jobArr);
                    job_name.total = d3.sum(job_name,e=>e.value);
                    job_name.user = Object.keys(user_name);
                    item.values.push(job_name.sort((a,b)=>d3.ascending(a.key,b.key)));
                    condition = true;
                }else
                    item.values.push(null);
            }else
                item.values.push(null);
            item[Layout.timespan[i]] = item.values[i];
        });
        if (condition)
            data.push(item);
    }
    data.sort((a,b)=>+a.range[0]-b.range[0])
    return data;
}
function handleDataComputeByUser_compute(computers,jobs){
    let data = [];
    for (let comp in computers){
        let condition = false;
        let item = {key:comp,values:[],range:[Infinity,-Infinity],data:computers[comp]};
        computers[comp].job_id.forEach((jIDs,i)=>{
            if (jIDs.length){
                let jobArr = jIDs.map(j=>jobs[j]).filter(d=>Layout.userSelected[d.user_name]);
                if (jobArr.length) {
                    let user_name = {};
                    let job_name = d3.nest().key(d=>d.job_name)
                        .rollup(d=>(d.forEach(e=>user_name[e.user_name]=true),1)).entries(jobArr);
                    job_name.total = d3.sum(job_name,e=>e.value);
                    job_name.user = Object.keys(user_name);
                    item.values.push(job_name.sort((a, b) => d3.ascending(a.key, b.key)));
                    condition = true;
                }else
                    item.values.push(null);
            }else
                item.values.push(null);
            item[Layout.timespan[i]] = item.values[i];
        });
        if (condition)
            data.push(item);
    }
    data.sort((a,b)=>+a.range[0]-b.range[0])
    return data;
}
// function handleDataComputeByUser(computers,jobs,timespan){
//     let data = [];
//     debugger
//     for (let jID in  jobs){
//         jobs[jID].node_list.forEach(comp=>{
//             let item = {key:comp,values:[],value:jobs[jID].node_list_obj[comp],data:jobs[jID]};
//             timespan.forEach(t=>{
//                 if ((new Date(jobs[jID].start_time)<=t) && (!jobs[jID].finish_time || (t<=new Date(jobs[jID].finish_time)))){
//                     item[t] = [{key:jobs[jID].user_name,value:jobs[jID].node_list_obj[comp]}];
//                     item[t].total = jobs[jID].node_list_obj[comp];
//                 }else {
//                     item[t] = [];
//                     item[t].total = jobs[jID].node_list_obj[comp];
//                 }
//                 item.values.push(item[t])
//             });
//             data.push(item);
//         })
//     };
//     return data;
// }
function handleRankingData(data){
    console.time('handleRankingData');
    let sampleS = handleSmalldata(data);
    let {computers,jobs,users,jobByNames} = handleData(data);
    Layout.timeRange = [sampleS.timespan[0],sampleS.timespan[sampleS.timespan.length-1]];
    Layout.jobsStatic = jobs;
    Layout.usersStatic = users;
    Layout.timespan = sampleS.timespan;

    handleDataComputeByUser.data = {computers,jobs};
    userPie.data(Layout.usersStatic).draw();
    Layout.userTimeline = handleDataComputeByUser(handleDataComputeByUser.data);
    console.timeEnd('handleRankingData');
}
