var application_name ='ClusteringView';
let profile = {};
srcpath = '../HiperView/';
let filename_pattern = [
    {value:"mean",key:"value"},
    {value:"quantile_0.25",key:"q1"},
    {value:"quantile_0.75",key:"q3"},
    {value:"quantile_1",key:"maxval"},
    {value:"quantile_0",key:"minval"},
    ];

let radarDes = radarDescription();
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
    const variables = _.without(Object.keys(data[0]),'timestamp','time','labels','re_label','count','radius');
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
        let range = d3.extent(data,d=>d[variables[i]]); // min-max scale
        // <editor-fold desc="name detection scale">
        if (keys[k])
            range = serviceLists_or.find(d=>d.text===keys[k]).sub[0].range;
        // </editor-fold>
        const temp = {"text":k,"id":i,"enable":true,"sub":[{"text":k,"id":0,"enable":true,"idroot":i,"angle":i*2*Math.PI/(variables.length),"range":range}]};
        thresholds.push(range);
        serviceLists.push(temp);
    });
    serviceList_selected = serviceList.map((d,i)=>{return{text:d,index:i}});
    serviceFullList = serviceLists2serviceFullList(serviceLists);
    label_name = data.map(d=>d.labels||d.re_label);
    clusterS = {};
    clusterDescription = {};
    data.forEach((d,i)=>{

        let temp ={};
        serviceLists.forEach((s,i)=>{
            temp[s.text] = {value: d[variables[i]]};
        });
        clusterS[d.labels||d.re_label] = temp;
        clusterDescription[d.labels||d.re_label] = {id: d.labels||d.re_label,text: d.labels||d.re_label, axis:[]};
    });
    categoryScale.domain(data.map(d=>d.labels))
}
function updateDataType(data,type){
    const variables = _.without(Object.keys(data[0]),'timestamp','time','labels','re_label','count','radius');
    data.forEach((d,i)=>{

        let temp =clusterS[d.labels||d.re_label];
        serviceLists.forEach((s,i)=>{
            temp[s.text][type] = +d[variables[i]]
        });
    });
}
let clusterS ={};
let clusterDescription ={};




function onSaveDescription (){
    var filename = $('#savename_description').val()+".json";
    var type = "json";
    var str = JSON.stringify(clusterDescription);
    var file = new Blob([str], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}