
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
    _.mapObject(computers,(d,i)=>(d.user=[],d.jobName=[],d.isNew=[]))
    const jobs = data[JOB]; // object
    const rack = Layout.data;
    const jobmap = d3.entries(jobs);
    const user_job = d3.nest()
        .key(d=>d.value[USER]) //user
        .key(d=>d.key.split('.')[0]) //job array
        .object(jobmap);
    const users = _.mapObject(user_job,(d,i)=>{
        const job = [];
        const isNew = [];
        const node = _.uniq(_.flatten(_.values(d).map(d=>d.map(d=>{
            job.push(d.key);
            if (d.value.isNew){
                isNew.push(d.key);
                d.value.node_list.forEach(c=>computers[c].isNew.push(d.key));
            }
            return d.value.node_list;
        }))));
        node.forEach(c=> computers[c].user.push(i));
        const jobMain = _.uniq(job.map(j=>j.split('.')[0]));
        return {node,job,jobMain,isNew}
    });
    const jobName_job = d3.nest()
        .key(d=>d.value[JOBNAME].slice(0,3)) //user
        .key(d=>d.key.split('.')[0]) //job array
        .entries(d3.entries(jobs));
    const jobByNames = {};
    jobName_job.forEach((val,i)=>{
        let d = val.values;
        const job = [];
        const isNew = [];
        const jobName = [];

        const node = _.uniq(_.flatten(d.map(d=>d.values.map(d=>{
            job.push(d.key);
            jobName.push(d.value[JOBNAME]);
            if (d.value.isNew){
                isNew.push(d.key);
            }
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
        jobByNames[key] =  {node,job,jobMain,isNew}
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
    return (d.metric||d.metrics)[vizservice[serviceSelected].text]
}

function getData_delta(d){
    if ( vizservice[serviceSelected].text!=='User' && vizservice[serviceSelected].text!=='Radar')
        return d.metrics_delta[vizservice[serviceSelected].text];
    return 0;
}

function data2tree(data,sampleS,computers){
    let serviceName = null;
    if (cluster_info&&vizservice[serviceSelected].text==='Radar'){
        cluster_info.forEach(d=>(d.arr=[],d.total=0));
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
                            isNew:computers?computers[c].isNew:[],
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
    if (cluster_info&&vizservice[serviceSelected].text==='Radar') {
        cluster_info.forEach(d => (d.total = d.arr.length));
        cluster_map(cluster_info)
    }
    return {tree,compute_layoutLink};
}
let currentDraw=()=>{};
let tsnedata = {};
function queryData(data) {
    const currentTime = data.currentTime;
    Layout.currentTime =  data.currentTime;
    const data_ = handleDataUrl(data);
    let  sampleS = data_.sampleS;
    tsnedata = data_.tsnedata;
    let {computers,jobs,users,jobByNames} = handleData(data);
    adjustTree(sampleS,computers);
    Layout.users = users;
    Layout.jobByNames = jobByNames;
    Layout.computers_old = computers;
    if (vizservice.length&&vizservice[serviceSelected].text==='Radar' && group_opt.recall){
        group_opt.recall();
        cluster_info.forEach(d=>d.total=d.arr.length)
        cluster_map(cluster_info);
        handle_clusterinfo();
        Layout.tree.children.forEach(d=>{
            d.children.forEach(e=>{
                getCluster(e);
            })
        });
    }

    currentDraw = ()=>{
        drawObject.draw();
    };
    createdata({computers,jobs,users,jobByNames,sampleS});
    // _.partial(draw,{computers,jobs,users,jobByNames,sampleS},currentTime);
    // currentDraw = _.partial(draw,{computers,jobs,users,jobByNames,sampleS},currentTime);
    // currentDraw(serviceSelected);
    currentDraw();
}
function createdata({computers,jobs,users,jobByNames,sampleS}){
    let dataIn = {nodes:[],links:[]};
    Layout.tree.children.forEach(r=>r.children.forEach(c=>{
        let data = {id:c.name,type:'compute',data:c,value:getData(c),key:c.name};
        data.drawData  = getDrawData(data);
        // dataIn.nodes.push({id:c.name,type:'compute',drawData:getDrawData(data),data:computers[c.name]});
        dataIn.nodes.push(data);
        computers[c.name].user.forEach(u=>dataIn.links.push({source:c.name,target:u}));
    }));
    Object.keys(users).forEach(u=>{
        dataIn.nodes.push({id:u,type:'user',data:users[u],drawData:[{
                invalid: undefined,
                scale:1,
                offset:-8,
               d:'M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'}]})
    });
    drawObject.data(dataIn);
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
$('#loadClusterInfobtn').on('click',()=>$('#clusterInfo_input_file').trigger('click'));
$('#clusterInfo_input_file').on('input',(evt)=>{
    let f = evt.target.files[0];
    var reader = new FileReader();
    reader.onload = (function (theFile) {
        return function (e) {
            loadPresetCluster(e.target.result, onchangeCluster)
        }
    })(f);

    reader.readAsDataURL(f);
});
function loadPresetCluster(name,calback) {
    const fileName = name.includes('data:')?name:`${name}_cluster.csv`;
    return d3.csv(fileName).then(function (cluster) {
        if (cluster==null||checkValidClusterinfo(cluster)) {
            if (cluster==null){
                d3.select('#toastHolder').append('div')
                    .attr('data-autohide',true)
                    .attr('class','clusterInfo')
                    .html(`<div class="toast-header">
                      <strong class="mr-auto text-primary">Load Cluster Information</strong>
                      <button type="button" class="ml-2 mb-1 close" data-dismiss="toast">&times;</button>
                    </div>
                    <div class="toast-body">
                      Do not have preset major group information. Recalculate major groups
                    </div>`);
                $('.clusterInfo').toast('show');

            }else{
                d3.select('#toastHolder').append('div')
                    .attr('data-autohide',true)
                    .attr('class','clusterInfo')
                    .html(`<div class="toast-header">
                      <strong class="mr-auto text-primary">Load Cluster Information</strong>
                      <button type="button" class="ml-2 mb-1 close" data-dismiss="toast">&times;</button>
                    </div>
                    <div class="toast-body">
                      Wrong cluster file format!
                    </div>`);
                $('.clusterInfo').toast('show');
            }
            if (calback) {
                calback(false);// status
            }
        }else {
            clusterDescription = {};
            let haveDescription = false;
            cluster.forEach((d,i) => {
                d.radius = +d.radius;
                d.mse = +d.mse;
                d.__metrics = serviceFullList.map(s => {
                    return {
                        axis: s.text,
                        value: d3.scaleLinear().domain(s.range)(d[s.text]) || 0,
                        // minval:d3.scaleLinear().domain(s.range)(d[s.text+'_min'])||0,
                        // maxval:d3.scaleLinear().domain(s.range)(d[s.text+'_max'])||0,
                    }
                });
                d.__metrics.normalize = d.__metrics.map((e, i) => e.value);
                if(d.description) {
                    haveDescription = true;
                    clusterDescription[`group_${i + 1}`] = {id:`group_${i + 1}`,text: d.description};
                    delete d.description;
                }
            });
            cluster.forEach(c=>c.arr=[]);
            cluster_info = cluster;
            // clusterDescription = {};
            recomendName(cluster_info,haveDescription);
            recomendColor(cluster_info);
            if(calback){
                calback(true);// status
            }
        }
    });
    function checkValidClusterinfo(cluster_input){
        // check the axis
        cluster_input[0]
        let invalid = false;
        serviceFullList.find(s=>{
            invalid = cluster_input[0][s.text]===undefined
            return invalid
        })
        return invalid;
    }
}
