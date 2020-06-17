csv = 'Name,row,column,value\n'
csv+= data.map(d=>{
    let temp = JSON.stringify( d3.range(0,60).map(r=>d3.range(0,2).map(c=>sampleS[`compute-${d}-${c+r*2}`]?`compute-${d}-${c+r*2}`:undefined)))
    return `Rack ${d+1},60,2,'`+temp+"'";
}).join('\n')
