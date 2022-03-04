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
