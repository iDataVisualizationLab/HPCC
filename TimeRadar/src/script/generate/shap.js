var q = {};
hosts.forEach(h=>d3.csv(srcpath+`data/shap/shap_dataframe/shap_importance_${h.name}.csv`,function(error,result) {
    if (error) return null;
    q[h.name] = serviceFullList.map(s=>{
        r=result.find(e=>e.feature_name===s.text)
        value ={};
        _.without(d3.keys(r),'feature_name').forEach(c=>value[c]=+r[c])
        return{axis: s.text,value:value}});
}));
console.log(JSON.stringify(q))


var q = {};
hosts.forEach(h=>d3.csv(srcpath+`data/shap/shap_dataframe/shap_importance_${h.name}.csv`,function(error,result) {
    if (error) return null;
    q[h.name] = serviceFullList.map(s=>{
        r=result.find(e=>e.feature_name===s.text)
        value ={};
        _.without(d3.keys(r),'feature_name').forEach(c=>value[c]=+r[c])
        return{axis: s.text,value:value}});
}));
console.log(JSON.stringify(q))