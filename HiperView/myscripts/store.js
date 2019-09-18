// store
var chosenService = 0;
const variablesNames = ['serviceList','serviceLists','serviceListattr','serviceListattrnest']
var conf={};
variablesNames.forEach(d=>conf[d] = window[d]);

//***********************
Loadtostore();

//***********************

function SaveStore() {
    variablesNames.forEach(d=>{ conf[d] = window[d];saveConf(d);});
}
function checkInvalidStore(){
    var retrievedObject = localStorage.getItem(application_name+'_'+'serviceLists');
    if (retrievedObject!=null&&retrievedObject!==undefined&&retrievedObject!=="undefined") {
        let checkpoint = JSON.parse(retrievedObject);
        return checkpoint[0].sub[0].angle ===undefined;
    } else {
        return true;
    }
}
function Loadtostore() {
    if(checkInvalidStore())
        DeleteAllstore();
    variablesNames.forEach(d=>{ window[d] = checkConf(d)});
    // relink object
    serviceFullList = serviceLists2serviceFullList(serviceLists);
}
function DeleteAllstore() {
    variablesNames.forEach(d=>refeshConf(d));
}
function checkConf(namekey) {
    var retrievedObject = localStorage.getItem(application_name+'_'+namekey);
    if (retrievedObject!=null&&retrievedObject!==undefined&&retrievedObject!=="undefined") {
        conf[namekey] = JSON.parse(retrievedObject);
        return conf[namekey];
    } else {
        saveConf(namekey);
        return conf[namekey];
    }
}

function saveConf(namekey) {
    localStorage.setItem(application_name+'_'+namekey, JSON.stringify(conf[namekey]));
}

function refeshConf(namekey) {
    localStorage.removeItem(application_name+'_'+namekey);
}
