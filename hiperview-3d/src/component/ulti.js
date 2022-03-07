import * as d3 from "d3"
export const undefinedValue = -1;
export const metricRef ={
    'temp':d=>[3,98],
    'fan':d=>[0,d[1]],
    'power': d=>[0,Math.max(400,d[1])],
    'percent': ()=>[0,100]
};
export const getRefRange = (name,range)=>{
    if (name.match(/temp/i))
        return {type:'temp',unit:'C',range:metricRef['temp'](range)};
    if (name.match(/power|consump/i))
        return {type:'power',unit:'W',range:metricRef['power'](range)};
    if (name.match(/usage|\%|percen/i))
        return {type:'percent',unit:'%',range:metricRef['percent'](range)};
    if (name.match(/fan/i))
        return {type:'fan',unit:'rpm',range:metricRef['fan'](range)};
    return {type:null,unit:null,range}
}
export const colorScaleList = {
    n: 7,
    rainbow: ["#000066", "#4400ff", "#00ddff", "#00ddaa", "#00dd00", "#aadd00", "#ffcc00", "#ff8800", "#ff0000", "#660000"],
    soil: ["#2244AA","#4A8FC2", "#76A5B1", "#9DBCA2", "#C3D392", "#F8E571", "#F2B659", "#eb6424", "#D63128", "#660000"],
    customschemeCategory:  ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#bcbd22", "#17becf"],
    schemeCategory20: ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'],
    customFunc: function(name){
        const n= this.n;
        // @ts-ignore
        const arrColor = this[name];
        let colorLength = arrColor.length;
        const arrThresholds=d3.range(0,colorLength).map(e=>e/(colorLength-1));
        // @ts-ignore
        let colorTemperature = d3.scaleLinear().domain(arrThresholds).range(arrColor).interpolate(d3.interpolateHcl);

        return d3.range(0,n).map(e=>colorTemperature(e/(n-1)))
    },
    d3colorChosefunc: function(name,num){
        const n = num?? this.n;
        // @ts-ignore
        const scheme = d3[`scheme${name}`];
        let colors = [];
        if (scheme) {
            if (typeof (scheme[0]) !== 'string') {
                colors = (scheme[n]||scheme[scheme.length-1]).slice();
            }
            else
                colors=  scheme.slice();
        } else {
            // @ts-ignore
            const interpolate = d3[`interpolate${name}`];
            colors = [];
            for (let i = 0; i < n; ++i) {
                colors.push(d3.rgb(interpolate(i / (n - 1))).hex());
            }
        }
        colors = this.customFunc(undefined,colors,n);
        return colors;
    },
},colorArr = {Radar: [
        {val: 'rainbow',type:'custom',label: 'Rainbow'},
        {val: 'RdBu',type:'d3',label: 'Blue2Red',invert:true},
        {val: 'soil',type:'custom',label: 'RedYelBlu'},
        {val: 'Viridis',type:'d3',label: 'Viridis'},
        {val: 'Greys',type:'d3',label: 'Greys'}],
    Cluster: [{val: 'Category10',type:'d3',label: 'D3'},{val: 'Paired',type:'d3',label: 'Blue2Red'}]} ;
