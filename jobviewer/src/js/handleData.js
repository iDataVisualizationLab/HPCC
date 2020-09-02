
function queryLayout() {
    return d3.json('src/data/layout.json').then(layout => {
        Layout.data = layout;
        Layout.data_flat = d3.entries(layout).map(d=>(d.value=_.flatten(d.value).filter(e=>e!==null),d));
        let {tree,compute_layoutLink} = data2tree(Layout.data_flat);
        Layout.tree = tree;
        Layout.compute_layout = compute_layoutLink;
    });
}

function handleData(data){
    const computers = data[COMPUTE];
    _.mapObject(computers,(d,i)=>(d.user=[],d.jobName=[]))
    const jobs = data[JOB]; // object
    const rack = Layout.data;
    // console.log('totaljob: ',d3.keys(jobs).length);
    // Object.keys(jobs).forEach(j=>{
    //     const d = jobs[j];
    //     if (!d.finish_time) {
    //         delete jobs[j]
    //     }tree
    // }); // lastest job
    const user_job = d3.nest()
        .key(d=>d.value[USER]) //user
        .key(d=>d.key.split('.')[0]) //job array
        .object(d3.entries(jobs));
    const users = _.mapObject(user_job,(d,i)=>{
        const job = [];
        const node = _.uniq(_.flatten(_.values(d).map(d=>d.map(d=>(job.push(d.key),d.value.node_list)))));

        node.forEach(c=> computers[c].user.push(i))
        const jobMain = _.uniq(job.map(j=>j.split('.')[0]));
        return {node,job,jobMain}
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
        return d.user.length//?userIndex[d.user[0]]:-1;
    if ( vizservice[serviceSelected].text==='Radar'&&d.cluster)
        return -d.cluster.arr.length;
    return d.metrics[vizservice[serviceSelected].text]
}

function getData_delta(d){
    if ( vizservice[serviceSelected].text!=='User' && vizservice[serviceSelected].text!=='Radar')
        return d.metrics_delta[vizservice[serviceSelected].text];
    return 0;
}

function data2tree(data,sampleS,computers){
    let serviceName = null;
    if (cluster_info&&vizservice[serviceSelected].text==='Radar'){
        cluster_info.forEach(d=>d.arr=[])
        serviceName = vizservice[serviceSelected].text;
    }
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
                        if (serviceName==='Radar'&&cluster_info)
                        {
                            getCluster(item)
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
    const currentTime = data.currentTime;
    Layout.users = users;
    Layout.jobByNames = jobByNames;
    Layout.computers_old = computers;
    if (vizservice.length&&vizservice[serviceSelected].text==='Radar' && group_opt.recall){
        group_opt.recall()
        cluster_map(cluster_info);
        handle_clusterinfo();
        Layout.tree.children.forEach(d=>{
            d.children.forEach(e=>{
                getCluster(e);
            })
        });
    }
    currentDraw = _.partial(draw,{computers,jobs,users,jobByNames,sampleS},currentTime);
    currentDraw(serviceSelected);
}

function sortData(){
    const layout_array =  Layout.data_flat;
    Layout.tree.children.forEach((d,i)=>{
        let orderData = {};
        d.children.sort((a,b)=>-getData(a)+getData(b));
        d.children.forEach((e,i)=>orderData[e.name]=i);
        layout_array[i].value.sort((a,b)=>orderData[a]-orderData[b]);
    });
}
