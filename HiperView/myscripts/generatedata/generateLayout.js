data=d3.range(0,10);
csv = 'Name,row,column,value\n'
csv+= data.map(d=>{
    let temp = JSON.stringify( d3.range(0,30).map(r=>d3.range(0,2).map(c=>sampleS[`compute-${d+1}-${c+r*2+1}`]?`compute-${d+1}-${c+r*2+1}`:undefined))).replace(/"/g,"'")
    return `Rack ${d+1},60,2,"`+temp+'"';
}).join('\n')
