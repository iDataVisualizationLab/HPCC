let maxCore = 36;
function queryLayout() {
    return d3.json('../jobviewer/src/data/layout.json').then(layout => {
        Layout.data = layout;
        Layout.data_flat = d3.entries(layout).map(d=>(d.value=_.flatten(d.value).filter(e=>e!==null),d));
        let {tree,compute_layoutLink} = data2tree(Layout.data_flat);
        Layout.tree = tree;
        Layout.compute_layout = compute_layoutLink;
        // userPie.maxValue(d3.keys(Layout.compute_layout).length*maxCore);
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
        node.forEach(c=> computers[c].user.push(i));
        // const jobMain = _.uniq(job.map(j=>j.split('.')[0]));
        // return {node,job,jobMain,totalCore}
        return {node,job,totalCore}
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
        // const jobMain = _.uniq(job.map(j=>j.split('.')[0]));
        // jobByNames[key] =  {node,job,jobMain}
        jobByNames[key] =  {node,job}
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
    // if (cluster_info&&vizservice[serviceSelected].text==='Radar'){
    //     cluster_info.forEach(d=>d.arr=[])
    //     serviceName = vizservice[serviceSelected].text;
    // }
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
                        // if (serviceName==='Radar'&&cluster_info)
                        // {
                        //     getCluster(item)
                        // }
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
    // if (cluster_info&&vizservice[serviceSelected].text==='Radar') {
    //     cluster_info.forEach(d => (d.total = d.arr.length));
    //     cluster_map(cluster_info)
    // }
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


function handleDataComputeByJob({computers,jobs:_jobs,users:_users}){
    const jobs = {};
    const users = {};
    Layout.jobarrdata = {};
    Layout.userarrdata = {};
    Layout.minMaxDataCompJob = {};
    Layout.minMaxDataUser = {};
    Object.keys(_jobs).forEach(k=>{
        // if (_jobs[k].total_nodes>1){
        jobs[k] = _jobs[k];
        Layout.jobarrdata[k] = [];
        Layout.minMaxDataCompJob[k] = [];

        if (!jobs[k].isJobarray){
            users[_jobs[k].user_name] = _users[_jobs[k].user_name];
            Layout.userarrdata[_jobs[k].user_name] = [];
            Layout.minMaxDataUser[_jobs[k].user_name] = [];
        }else{
            jobs[k].comp = {};
        }
        // }
    });

    let data = [];
    for (let comp in computers){
        let item = {key:comp,values:[],range:[Infinity,-Infinity],data:computers[comp]};
        let job = {};
        computers[comp].job_id.forEach((jIDs,i)=>{
            let jobArr = jIDs.map(j=>jobs[j]).filter(d=>{
                if (d){
                    if (!Layout.jobarrdata[d.job_id][i]){
                        Layout.jobarrdata[d.job_id][i]=[];
                    }
                    Layout.jobarrdata[d.job_id][i].push(tsnedata[comp][i]);
                    if (!Layout.userarrdata[d.user_name][i]){
                        Layout.userarrdata[d.user_name][i] = [];
                    }
                    Layout.userarrdata[d.user_name][i].push(tsnedata[comp][i]);

                    if(d.job_array_id){
                        if (!Layout.jobarrdata[d.job_array_id][i]){
                            Layout.jobarrdata[d.job_array_id][i]=[];
                        }
                        if (!jobs[d.job_array_id].comp[i])
                            jobs[d.job_array_id].comp[i] = {};
                        if (!jobs[d.job_array_id].comp[i][comp]){
                            jobs[d.job_array_id].comp[i][comp] = 1;
                            Layout.jobarrdata[d.job_array_id][i].push(tsnedata[comp][i]);
                        }
                    }
                    return true;
                }
                return false
            });
            const key = jobArr.map(d=>d.job_id);
            if (!job[key])
                job[key]=true;
            else
                jobArr=[];

            if (jobArr.length){
                let username = d3.nest().key(d=>d.job_id)
                    .rollup(d=>d3.sum(d,e=>e.node_list_obj[comp])).entries(jobArr);
                username.total = d3.sum(username,e=>e.value)
                item.values.push(username.sort((a,b)=>d3.ascending(a.key,b.key)));
            }else
                item.values.push(null);
            item[Layout.timespan[i]] = item.values[i];
        });
        data.push(item);
    }
    Object.keys(Layout.jobarrdata).forEach(k=>{
        Layout.jobarrdata[k].forEach((d,i)=>{
            const timestep = Layout.jobarrdata[k][i][0].timestep;
            let valueMin = [];
            let valueMax = [];
            let value = Layout.jobarrdata[k][i][0].map((d,si)=>{
                const vals = Layout.jobarrdata[k][i].map(d=>d[si]);
                valueMin.push(d3.min(vals));
                valueMax.push(d3.max(vals));
                return  d3.mean(vals);
            });
            value.name = k;
            valueMin.name = k;
            valueMax.name = k;
            value.timestep = timestep;
            valueMin.timestep = timestep;
            valueMax.timestep = timestep;
            Layout.minMaxDataCompJob[k][i] = [valueMin,valueMax]
            Layout.jobarrdata[k][i] = value;
        })
    })

    Object.keys(Layout.userarrdata).forEach(k=>{
        Layout.userarrdata[k].forEach((d,i)=>{
            const timestep = Layout.userarrdata[k][i][0].timestep;
            let valueMin = [];
            let valueMax = [];
            let value = Layout.userarrdata[k][i][0].map((d,si)=>{
                const vals = Layout.userarrdata[k][i].map(d=>d[si]);
                valueMin.push(d3.min(vals));
                valueMax.push(d3.max(vals));
                return  d3.mean(vals);
            });
            value.name = k;
            valueMin.name = k;
            valueMax.name = k;
            value.timestep = timestep;
            valueMin.timestep = timestep;
            valueMax.timestep = timestep;
            Layout.minMaxDataUser[k][i] = [valueMin,valueMax]
            Layout.userarrdata[k][i] = value;
        })
    })

    data.sort((a,b)=>+a.range[0]-b.range[0])
    return data;
}

function handleDataComputeByUser_core(computers,jobs){
    //start
    let data = [];
    let obj = {};
    let noJobMap = {};
    for (let j in jobs){
        obj[j] = {key:j,values:Layout.timespan.map(t=>null),range:[Infinity,-Infinity],data:jobs[j],arr:[]};
        data.push(obj[j]);
    }
    for (let comp in computers){
        let jonj = {};
        noJobMap[comp] = [];
        computers[comp].job_id.forEach((jIDs,i)=>{
            if (jIDs.length){
                jIDs.forEach(j=>{
                    if (!jonj[j]){
                        let item = obj[j];
                        if (!item.values[i]) {
                            item.values[i] = [];
                            item.values[i].total = 0;
                        }
                        const compData = {key:comp,type:'compute',value:1};
                        const userData = {key:jobs[j].user_name,type:'user',value:1}
                        item.values[i].push(compData);
                        // item.values[i].push(userData);
                        item.values[i].total += jobs[j].node_list_obj[comp];
                        // item.arr.push({time:Layout.timespan[i],value:[compData,{key:j,type:'job',value:1},userData]});
                        item.arr.push({time:Layout.timespan[i],value:[{key:j,type:'job',value:1},userData]});
                        item.arr.push({time:Layout.timespan[i],value:[compData,{key:j,type:'job',value:1}]});
                        if(jobs[j].job_array_id){
                            // item.arr.push({time:Layout.timespan[i],value:[compData,{key:jobs[j].job_array_id,type:'job',value:1},userData]});
                            item.arr.push({time:Layout.timespan[i],value:[compData,{key:jobs[j].job_array_id,type:'job',value:1}]});
                            item.arr.push({time:Layout.timespan[i],value:[{key:jobs[j].job_array_id,type:'job',value:1},userData]});
                        }
                        jonj[j]=true;
                    }
                });
            }else{
                noJobMap[comp][i] = 1;
            }
        });
    }
    // data.sort((a,b)=>+a.range[0]-b.range[0])
    return {data,noJobMap};
}
function handleDataComputeByUser_compute(computers,jobs){
    let data = [];
    for (let comp in computers){
        let item = {key:comp,values:[],range:[Infinity,-Infinity],data:computers[comp]};
        computers[comp].job_id.forEach((jIDs,i)=>{
            if (jIDs.length){
                let jobArr = jIDs.map(j=>jobs[j]);
                let username = d3.nest().key(d=>d.user_name)
                    .rollup(d=>d3.sum(d,e=>e.node_list_obj[comp])).entries(jobArr);
                username.total = 1;
                item.values.push(username.sort((a,b)=>d3.ascending(a.key,b.key)));
            }else
                item.values.push(null);
            item[Layout.timespan[i]] = item.values[i];
        });
        data.push(item);
    }
    data.sort((a,b)=>+a.range[0]-b.range[0])
    return data;
}
function handleRankingData(data){
    console.time('handleRankingData');
    let r = handleSmalldata(data);
    let sampleS = r.sampleh;
    tsnedata = r.tsnedata;
    Layout.minMaxDataComp = r.minMaxData;
    let {computers,jobs,users,jobByNames} = handleData(data);
    Layout.timeRange = [sampleS.timespan[0],sampleS.timespan[sampleS.timespan.length-1]];
    Layout.jobsStatic = jobs;
    Layout.usersStatic = users;
    let hosts = d3.keys(sampleS);
    hosts.shift();
    // let ranking = {byComputer:{},byMetric:{},byUser:{}};
    // d3.keys(users).forEach(u=>{ranking.byUser[u]={};
    //     serviceFullList.forEach(s=>ranking.byUser[u][s.text]=[])
    // });
    // hosts.forEach(h=>ranking.byComputer[h]={});
    // sampleS.timespan.forEach((t,ti)=>{
    //     serviceFullList.forEach(ser=>{
    //         if (!ranking.byMetric[ser.text])
    //             ranking.byMetric[ser.text]=[];
    //         ranking.byMetric[ser.text][ti]={};
    //         let sorteddata = hosts.map(h=>{
    //             if(!ranking.byComputer[h][ser.text])
    //                 ranking.byComputer[h][ser.text] = [];
    //             try {
    //                 return {
    //                     key: h,
    //                     value: sampleS[h][serviceListattr[ser.idroot]][ti][ser.id],
    //                     user: _.uniq(computers[h].job_id[ti].map(j => jobs[j].user_name))
    //                 };
    //             }catch(e){
    //                 debugger
    //                 console.log(h,ti,job_id[ti])
    //             }
    //         }).sort((a,b)=>-b.value+a.value);
    //         sorteddata.forEach((d,i)=>{
    //             ranking.byMetric[ser.text][ti][d.key] = d.value;
    //             ranking.byComputer[d.key][ser.text][ti] = d.value;
    //             d.user.forEach(u=>{
    //                 if (!ranking.byUser[u][ser.text][d.key])
    //                     ranking.byUser[u][ser.text][d.key] = [];
    //                 ranking.byUser[u][ser.text][d.key][ti]=d.value;
    //             });
    //         });
    //     });
    // });
    // Layout.ranking = ranking;
    Layout.timespan = sampleS.timespan;

    handleDataComputeByUser.data = {computers,jobs};
    const result = handleDataComputeByUser(handleDataComputeByUser.data);
    Layout.jobCompTimeline = result.data;
    Layout.noJobMap = result.noJobMap;
    Layout.jobTimeline = handleDataComputeByJob({computers,jobs,users});

    searchControl.data({compute:Object.keys(computers),user:Object.keys(Layout.usersStatic),job:Object.keys(Layout.jobsStatic)});

    Object.values(Layout.jobsStatic).forEach(d=>{
        d.summary = serviceFullList.map((s,si)=>{
            const val = {mean: Layout.jobarrdata[d.job_id]?d3.mean(Layout.jobarrdata[d.job_id],d=>d?d[s.idroot]:undefined):null}
            val.min = Layout.minMaxDataCompJob[d.job_id]?d3.min(Layout.minMaxDataCompJob[d.job_id],d=>d?d[0][s.idroot]:undefined):null;
            val.max = Layout.minMaxDataCompJob[d.job_id]?d3.max(Layout.minMaxDataCompJob[d.job_id],d=>d?d[1][s.idroot]:undefined):null;
            val.num = Layout.jobarrdata[d.job_id].filter(d=>((d?d[s.idroot]:undefined) !==undefined)).length;
            return val
        })
    });
    Object.keys(Layout.usersStatic).forEach(k=>{
        const d = Layout.usersStatic[k];
        d.total_nodes = d.node.length;
        d.summary = serviceFullList.map((s,si)=>{
            const val = {mean: Layout.userarrdata[k]?d3.mean(Layout.userarrdata[k],d=>d?d[s.idroot]:undefined):null}
            val.min = Layout.minMaxDataUser[k]?d3.min(Layout.minMaxDataUser[k],d=>d?d[0][s.idroot]:undefined):null;
            val.max = Layout.minMaxDataUser[k]?d3.max(Layout.minMaxDataUser[k],d=>d?d[1][s.idroot]:undefined):null;
            val.num = Layout.userarrdata[k].filter(d=>((d?d[s.idroot]:undefined) !==undefined)).length;
            return val
        })
    });
    Layout.computesStatic = computers;
    Object.keys(Layout.computesStatic).forEach(k=>{
        const d = Layout.computesStatic[k];
        d.summary = serviceFullList.map((s,si)=>{
            const val = {mean: tsnedata[k]?d3.mean(tsnedata[k],d=>d?d[s.idroot]:undefined):null}
            val.min = Layout.minMaxDataComp[k]?d3.min(Layout.minMaxDataComp[k],d=>d?d[0][s.idroot]:undefined):null;
            val.max = Layout.minMaxDataComp[k]?d3.max(Layout.minMaxDataComp[k],d=>d?d[1][s.idroot]:undefined):null;
            val.num = tsnedata[k].filter(d=>((d?d[s.idroot]:undefined) !==undefined)).length;
            return val
        })
    });
    console.timeEnd('handleRankingData');
}
