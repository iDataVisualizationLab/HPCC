
function queryLayout() {
    return d3.json('src/data/layout.json').then(layout => {
        Layout.data = layout;
        Layout.data_flat = d3.entries(layout).map(d=>(d.value=_.flatten(d.value).filter(e=>e!==null),d));
    });
}

function handleData(data){
    const computers = data[COMPUTE];
    _.mapObject(computers,(d,i)=>d.user=[])
    const jobs = data[JOB]; // object
    const rack = Layout.data;
    const user_job = d3.nest()
        .key(d=>d.value[USER]) //user
        .key(d=>d.key.split('.')[0]) //job array
        .object(d3.entries(jobs));
    const users = _.mapObject(user_job,(d,i)=>{
        const job = [];
        const node = _.uniq(_.flatten(_.values(d).map(d=>d.map(d=>(job.push(d.key),d.value.node_list)))));

        node.forEach(c=> computers[c].user.push(i));
        const jobMain = _.uniq(job.map(j=>j.split('.')[0]));
        return {node,job,jobMain}
    });
    return {computers,jobs,users}
}
function adjustScag(sampleS,computers,scagdata){
    let {scag} = data2scag(sampleS,computers,scagdata);
    Layout.scag = scag;
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

function data2scag(sampleS,computers,scagdata){
    let scag = {};
    if (sampleS){
        console.time('scag:');
        const scaleservice = serviceFullList.map(d=>d3.scaleLinear().domain(d.range));
        const norm=Object.keys(computers)
            .map(c=>{
                const out = serviceFullList.map((s,si)=> {
                    const d = scaleservice[si](sampleS[c][serviceListattr[s.idroot]][0][s.id])??null;
                    return d<0?null:d;
                });
                out.name = c;
                return out;
            });
        if(scagdata){
            for (let i =0;i<serviceFullList.length-1;i++){
                for (let j =i+1;j<serviceFullList.length;j++){
                    const points = norm.map(d=>{
                        const out = [d[i],d[j]];
                        out.data = d.name;
                        return out;
                    });
                    scagdata[serviceFullList[i].text+"||"+serviceFullList[j].text].metrics.normalizedPoints = points;
                }
            }
            scag = scagdata;
            console.timeEnd('scag:')
            return {scag};
        }else{
            for (let i =0;i<serviceFullList.length-1;i++){
                for (let j =i+1;j<serviceFullList.length;j++){
                    const points = norm.map(d=>{
                        const out = [d[i],d[j]];
                        out.data = d.name;
                        return out;
                    });
                    scag[serviceFullList[i].text+"||"+serviceFullList[j].text] = {dim:[serviceFullList[i].text,serviceFullList[j].text],
                        metrics:new scagnostics(points.filter(d=>(d[0]!==null)&&(d[1]!==null)), scagOpt)};
                    scag[serviceFullList[i].text+"||"+serviceFullList[j].text].metrics.normalizedPoints = points
                }
            }
        }
        console.timeEnd('scag:')
    }

    return {scag};
}
let currentDraw=()=>{};
let tsnedata = {};
function queryData(data) {
    Layout.scagpair = scagpair(serviceFullList);
    const data_ = handleDataUrl(data);
    let  sampleS = data_.sampleS;
    tsnedata = data_.tsnedata;
    let {computers,jobs,users} = handleData(data);
    adjustScag(sampleS,computers,data.scag);
    const currentTime = data.currentTime;
    Layout.computers_old = computers;
    currentDraw = _.partial(draw,computers,jobs,users,sampleS,currentTime);
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
