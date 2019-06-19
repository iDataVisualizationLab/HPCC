// store
var chosenService = 0;
const variablesNames = ['serviceList','serviceLists','serviceListattr','serviceListattrnest']
var conf={};
variablesNames.forEach(d=>conf[d] = window[d]);

function Loadtostore() {
    variablesNames.forEach(d=>{ window[d] = checkConf(d)});
}
function DeleteAllstore() {
    variablesNames.forEach(d=>refeshConf(d));
}
//***********************
Loadtostore();
//***********************


function checkConf(namekey) {
    var retrievedObject = localStorage.getItem(namekey);
    if (retrievedObject!=null&&retrievedObject!==undefined&&retrievedObject!=="undefined") {
        conf[namekey] = JSON.parse(retrievedObject);
        return conf[namekey];
    } else {
        saveConf(namekey);
        return conf[namekey];
    }
}

function saveConf(namekey) {
    localStorage.setItem(namekey, JSON.stringify(conf[namekey]));
}

function refeshConf(namekey) {
    localStorage.removeItem(namekey);
}
