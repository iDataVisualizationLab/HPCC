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
        const temp = {"text":k,"id":i,"enable":true,"sub":[{"text":k,"id":0,"enable":true,"idroot":i,"angle":i*2*Math.PI/(variables.length),"range":range}]};
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