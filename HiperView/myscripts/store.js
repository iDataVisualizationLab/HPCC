// store
var chosenService = 0;
var conf={};
conf.serviceList = serviceList;
conf.serviceLists = serviceLists;
conf.serviceListattr = serviceListattr;
conf.serviceListattrnest = serviceListattrnest;

function Loadtostore() {
    checkConf('serviceList');
    checkConf('serviceLists');
    checkConf('serviceListattr');
    checkConf('serviceListattrnest');
}
//***********************
Loadtostore();
//***********************


function checkConf(namekey) {
    var retrievedObject = localStorage.getItem(namekey);
    if (retrievedObject!=null&&retrievedObject!==undefined&&retrievedObject!=="undefined") {
        conf[namekey] = JSON.parse(retrievedObject);
        console.log('retrievedObject: ', JSON.parse(retrievedObject));
    } else {
        saveConf(namekey);
    }
}

function saveConf(namekey) {
    localStorage.setItem(namekey, JSON.stringify(conf[namekey]));
}
