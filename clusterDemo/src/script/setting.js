let profile = {};
srcpath = '../HiperView/';

//overwrite function
function onClickRadarColor (d){
    changeRadarColor(d);
    MetricController.updatecolor(arrColor);
}

function newdatatoFormat_cluster (data){
    serviceList = [];
    serviceLists = [];
    serviceListattr = [];
    // FIXME detect format
    const variables = _.without(Object.keys(data[0]),'timestamp','time','label');
    data.forEach(d=>variables.forEach(k=>d[k] = +d[k])) // format number
    let keys ={};
    let label_name =[];
    variables.forEach(k=>{
        let split_string = k.split('-');
        keys[split_string.join('-')]=1;
    });

    serviceQuery["csv"]= serviceQuery["csv"]||{};
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
        const range = d3.extent(data,d=>d[variables[i]]);
        const temp = {"text":k,"id":i,"enable":true,"sub":[{"text":k,"id":0,"enable":true,"idroot":i,"angle":i*2*Math.PI/(variables.length-1),"range":range}]};
        thresholds.push(range);
        serviceLists.push(temp);
    });
    serviceList_selected = serviceList.map((d,i)=>{return{text:d,index:i}});
    serviceFullList = serviceLists2serviceFullList(serviceLists);
    label_name = data.map(d=>d.label);
    clusterS = {};
    data.forEach(d=>{
        label_name.forEach(h=> {
            clusterS[h] = d;
        })
    });
}
let clusterS ={};