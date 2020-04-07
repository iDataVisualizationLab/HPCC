d3.text(srcpath+"data/data_raw/train_FD001.txt",(data)=>{

    data = data.split('\n').map(d=>{
        let temp = d.trim().split(' ');
        let item = {};
        item.id = temp.shift();
        if (item.id!=='') {
            item.timestep = +temp.shift();
            temp.shift();
            temp.shift();
            temp.shift();
            //_.pullAt(temp, [2,7,14,15,18]);
            temp = _.pullAt(temp, [2, 3, 4, 7, 8, 9, 11, 12, 13, 14]);
            item.data = temp.slice(0, 21);
            return item
        }
        return undefined;
    }).filter(d=>d);
    let nest = d3.nest().key(d=>d.id).entries(data)
    nest.forEach(d=>d.values.sort((a,b)=>a.timestep-b.timestep))
    console.log(nest);
    // let average_cycle = Math.round(d3.mean(nest,d=>d.values.length));
    let average_cycle = 200;
    let dim;
    data = nest.map(d=>{
        dim = d.values[0].data.length;
        let start = d.values.length-average_cycle;
        d.values = d.values.slice(start<0?0:start,d.values.length);
        if (start<0)
            d.values = _.concat(d3.range(0,-start).map(()=>({id: d.key,data:d3.range(0,dim).map(d=>'null')})),d.values);
        return d.values;
    });
    console.log(data)
    let name = [2, 3, 4, 7, 8, 9, 11, 12, 13, 14];
    let csv = "timestamp," + data.map(d=>d3.range(0,dim).map(e=>d[0].id+'-sensor'+name[e]).join(',')).join(',');
    let startTimePoint = 'Fri Feb 28 2020 00:00:00 GMT-0600 (Central Standard Time)';
    let timespan = d3.range(0,average_cycle).map(d=>new Date(new Date(startTimePoint).setMinutes(30*d)).toString())
    timespan.forEach((t,ti)=>{
        csv+= '\n' +t+','+data.map(d=>{
            return d[ti].data.join(',')
        }).join(',')
    })

    console.log(csv)
})