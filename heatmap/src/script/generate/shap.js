var shap= {};
hosts.forEach(h=>d3.csv(srcpath+`data/shap/shap_dataframe/shap_importance_${h.name}.csv`,function(error,result) {
    if (error) return null;
    shap[h.name] = serviceFullList.map(s=>{
        r=result.find(e=>e.feature_name===s.text)
        value ={};
        _.without(d3.keys(r),'feature_name').forEach(c=>value[c]=+r[c])
        return{axis: s.text,value:value}});
}));
console.log(JSON.stringify(q))


var shap= {};
var q= d3.queue();
hosts.forEach(h=>q.defer(readshap,srcpath+`data/shap/shap_dataframe/shap_importance_${h.name}.csv`,h.name));
q.awaitAll(function(error,results) {
    if (error) console.log(error);
    console.log(shap);
});
function readshap(name,hname,callback){
    d3.csv(name,function(error,result) {
        if (error) return callback(null);
        shap[hname] = serviceFullList.map(s=>{
            r=result.find(e=>e.feature_name===s.text)
            value ={};
            _.without(d3.keys(r),'feature_name').forEach(c=>value[c]=+r[c])
            return{axis: s.text,value:value}});
        callback(true)
    })
}
hosts.forEach(h=>q.defer(d3.csv(srcpath+`data/shap/shap_dataframe/shap_importance_${h.name}.csv`,function(error,result) {
    if (error) return null;
    shap[h.name] = serviceFullList.map(s=>{
        r=result.find(e=>e.feature_name===s.text)
        value ={};
        _.without(d3.keys(r),'feature_name').forEach(c=>value[c]=+r[c])
        return{axis: s.text,value:value}});
})));
console.log(JSON.stringify(shap))