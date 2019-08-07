let profile = {};
srcpath = '../HiperView/';
var serviceLists_or = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.834386356666759,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.4487989505128276,"range":[3,98]}]},{"text":"Job_load","id":1,"enable":true,"sub":[{"text":"Job load","id":0,"enable":true,"idroot":1,"angle":1.2566370614359172,"range":[0,10]}]},{"text":"Memory_usage","id":2,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":2,"angle":1.8849555921538759,"range":[0,99]}]},{"text":"Fans_speed","id":3,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":3,"angle":2.4751942119192307,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":3,"angle":2.9239931624320583,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":3,"angle":3.372792112944886,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":3,"angle":3.8215910634577135,"range":[1050,17850]}]},{"text":"Power_consum","id":4,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":4,"angle":4.71238898038469,"range":[0,200]}]}];

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
    const variables = _.without(Object.keys(data[0]),'timestamp','time','labels');
    data.forEach(d=>variables.forEach(k=>d[k] = +d[k])) // format number
    let keys ={};
    let label_name =[];
    variables.forEach(k=>{
        let split_string = k.split('-');
        split_string.shift();
        let currentkey = split_string.join('-');
        const keys_replace =Object.keys(basic_service).map(k=>extractWordsCollection(getTermsArrayCollection(k),currentkey,k)).filter(d=>Object.keys(d).length);


        keys[currentkey]=Object.keys(keys_replace[0])[0]||0;
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
        let range = d3.extent(data,d=>d[variables[i]]);
        if (keys[k])
            range = serviceLists_or.find(d=>d.text===keys[k]).sub[0].range;
        const temp = {"text":k,"id":i,"enable":true,"sub":[{"text":k,"id":0,"enable":true,"idroot":i,"angle":i*2*Math.PI/(variables.length-1),"range":range}]};
        thresholds.push(range);
        serviceLists.push(temp);
    });
    serviceList_selected = serviceList.map((d,i)=>{return{text:d,index:i}});
    serviceFullList = serviceLists2serviceFullList(serviceLists);
    label_name = data.map(d=>d.labels);
    clusterS = {};
    data.forEach((d,i)=>{

            let temp ={};
            serviceLists.forEach((s,i)=>{
                temp[s.text] = d[variables[i]]
            })
            clusterS[d.labels] = temp;
    });
}
let clusterS ={};