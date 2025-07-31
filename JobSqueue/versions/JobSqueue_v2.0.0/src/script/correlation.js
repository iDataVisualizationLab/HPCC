// Vung Pham 2019 Soil application https://github.com/iDataVisualizationLab/Soil/blob/master/js/correlation.js
/*Inspired from http://bl.ocks.org/dahtah/4731053*/
function variance(u){
    var n=u.length,alpha = (n/(n-1));
    var r =  (d3.mean(u.map(function(v) { return v*v;})) - Math.pow(d3.mean(u),2));
    return alpha*r;
}
function standardise(u){
    var m = d3.mean(u), s=Math.sqrt(variance(u));
    return u.map(function(v) { return (v-m)/s;});
}
//Compute Pearson's correlation between u and v
Array.prototype.mult = function (b) {
    var s = Array(this.length);
    for (var ind = 0; ind < this.length; ind++)
    {
        if (typeof(b)=="number")
        {
            s[ind] = this[ind]* b;
        }
        else
        {
            s[ind] = this[ind]* b[ind];
        }
    }
    return s;
};
function pearsonCorcoef(u,v)
{
    var us = standardise(u),vs = standardise(v),n=u.length;
    return (1/(n-1))*d3.sum(us.mult(vs));

}