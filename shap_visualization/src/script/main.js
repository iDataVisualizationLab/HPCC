let graphicopt = {
    margin: {top: 50, right: 0, bottom: 0, left: 200},
    width: 1200,
    height: 1000,
    scalezoom: 1,
    widthView: function () {
        return this.width * this.scalezoom
    },
    heightView: function () {
        return this.height * this.scalezoom
    },
    widthG: function () {
        return this.widthView() - this.margin.left - this.margin.right
    },
    heightG: function () {
        return this.heightView() - this.margin.top - this.margin.bottom
    }
};
let svg = d3.select('svg');
thresholds = [[0,1]]
d3.json('../HiperView/data/17Feb2020_cluster_info.json',function(e,cluster){
    console.log(cluster)
    d3.json('../HiperView/data/influxdb12Feb_2020_withoutJobLoad.json',function(e,shap){
        console.log(shap)
        let comp = d3.keys(shap);
        let dim = shap[comp[0]].map(d=>d.axis);

        let g = svg.attr('width',graphicopt.width)
           .attr('height',graphicopt.height).append('g')
        g.attr('transform',`translate(${graphicopt.margin.left},${graphicopt.margin.top})`);
        let x = d3.scalePoint().domain(dim).range([0,graphicopt.widthG()]).padding(0.5);
        let height_t = x.step()*0.25*comp.length;
        let y = d3.scalePoint().domain(comp).range([0,height_t]).padding(0.5);
        svg.attr('height',height_t+graphicopt.margin.top+graphicopt.margin.bottom)
        let radarChartclusteropt  = {
            margin: {top: 0, right: 0, bottom: 0, left: 0},
            w: x.step(),
            h: x.step(),
            radiuschange: false,
            levels:6,
            dotRadius:2,
            mini:true,
            strokeWidth:1,
            maxValue: 0.5,
            isNormalize:true,
            showHelperPoint: false,
            roundStrokes: true,
            ringStroke_width: 0.15,
            ringColor:'black',
            fillin:0.5,
            boxplot:false,
            animationDuration:1000,
            showText: false};

        // rose chart
        cluster.forEach(cl=>cl.fullName = 'Group '+(cl.orderG+1));
        let globalMax = -Infinity;
        let matrix = [];
        comp.forEach(c=>{
            dim.forEach((d,di)=>{
                let temp = cluster.map(cl=>{
                    let value = shap[c][di].value[cl.index]||0;
                    if (globalMax<value)
                        globalMax = value;
                    return {axis:'Group '+(cl.orderG+1),_value:value};
                });
                temp.name = `${c}_${d}`;
                temp.__posName_x = d;
                temp.__posName_y = c;
                matrix.push(temp);
            })
        })
        let axisscale = d3.scaleLinear().domain([0,globalMax]);
        let schema  =cluster.map(d=>({text:d.fullName,id: 0,idroot: d.index,enable:true,angle:Math.PI*2*d.index/cluster.length,range:[0,globalMax]}));
        matrix.forEach(m=>{m.forEach((e,ei)=>m[ei].value = axisscale(m[ei]._value))});

        // simlarity
        let nestComp = d3.nest().key(d=>d.__posName_y).entries(matrix);
        let new_index = similarityCal(nestComp.map((c,i)=>{
            c.index = i;
            let temp = [];
            c.values.forEach(d=>d.forEach(e=>temp.push({value:e.value})));
            temp.name = c.key;
            let temp_b = [temp];
            temp_b.id = c.key;
            temp_b.order = i;
            return temp_b;
        }));

        y.domain(nestComp.sort((a,b)=>new_index[a.index]-new_index[b.index]).map(d=>d.key))

        radarChartclusteropt.schema = schema;
        radarChartclusteropt.color = function(i,d){return cluster[i].color};
        // legend
        let legendx = g.selectAll('.dim.label').data(dim)
        legendx.exit();
        legendx.enter().append('text')
            .attr('text-anchor','middle')
            .attr('class',d=>fixName2Class(d)).attr('x',d=>x(d)).attr('y',-20).text(d=>d);

        let legendy = g.selectAll('.comp.label').data(comp)
        legendy.exit();
        legendy.enter().append('text')
            .attr('text-anchor','end')
            .attr('class',d=>fixName2Class(d)).attr('y',d=>y(d)).attr('x',-x.step()/2).text(d=>d);
        // RoseChart
        let el = g.selectAll('g.rosechart').data(matrix);
        el.exit().remove();
        el.enter().append('g').attr('class',d=>`rosechart ${fixName2Class(d.name)}`);
        g.selectAll('g.rosechart')
            .attr('transform',d=>`translate(${x(d.__posName_x)-radarChartclusteropt.w/2},${y(d.__posName_y)-radarChartclusteropt.h/2})`)
            .each(function(d){
                setTimeout(function(){
                    RoseChart(`.rosechart.${fixName2Class(d.name)}`,[d],radarChartclusteropt).select('.levels.gridCircle').remove();
                },1);

            })
    });
});

function similarityCal(data){
    const n = data.length;
    let simMatrix = [];
    let mapIndex = [];
    for (let i = 0;i<n; i++){
        let temp_arr = [];
        temp_arr.total = 0;
        for (let j=i+1; j<n; j++){
            let tempval = similarity(data[i][0],data[j][0]);
            temp_arr.total += tempval;
            temp_arr.push(tempval)
        }
        for (let j=0;j<i;j++)
            temp_arr.total += simMatrix[j][i-1-j];
        temp_arr.name = data[i][0].name;
        temp_arr.index = i;
        mapIndex.push(i);
        simMatrix.push(temp_arr)
    }
    mapIndex.sort((a,b)=> simMatrix[a].total-simMatrix[b].total);
    // let undefinedposition = data.findIndex(d=>d[0].text.match(': undefined'))
    // mapIndex.sort((a,b)=>
    //     b===undefinedposition?1:(a===undefinedposition?-1:0)
    // )
    let current_index = mapIndex.pop();
    let orderIndex = [simMatrix[current_index].index];

    do{
        let maxL = Infinity;
        let maxI = 0;
        mapIndex.forEach((d)=>{
            let temp;
            if (d>simMatrix[current_index].index ){
                temp = simMatrix[current_index][d-current_index-1];
            }else{
                temp = simMatrix[d][current_index-d-1]
            }
            if (maxL>temp){
                maxL = temp;
                maxI = d;
            }
        });
        debugger
        orderIndex.push(simMatrix[maxI].index);
        current_index = maxI;
        mapIndex = mapIndex.filter(d=>d!=maxI);} while(mapIndex.length);
    return orderIndex;
    function similarity (a,b){
        return Math.sqrt(d3.sum(a,(d,i)=>(d.value-b[i].value)*(d.value-b[i].value)));
    }
}