let AsynChartCollection = function (){
    let graphicopt = {
        contain: '#heatmap_holder',
        margin: {top: 0, right: 0, bottom: 50, left: 0},
        width: 1500,
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
    let scheme={};
    let plotLists = [], plotObj= {},contain = d3.select("#heatmap_holder");
    let master = {};
    master.reset = function(){
        const plotItem = contain.selectAll('div.plotItem');
        plotItem.each(d=>d.plot.destroy())
        plotItem.remove();
        return master;
    };
    master.init = function () {
        let serviceFullList_ob = {};

        serviceFullList.find((s,si)=>{
            if(s.enable){
                serviceFullList_ob[s.text]= 1
            }
        });
        let includekey = Object.keys(serviceFullList_ob);

        includekey.forEach(s=>{
            if (!plotObj[s]){
                plotObj[s] = initChart(s);
            }
        });

        let exclude = _.difference(Object.keys(plotObj),includekey);
        exclude.forEach(s=>{
            delete plotObj[s];
        });

        plotLists = d3.values(plotObj);
        return master;
    };
    function initChart(service){
        let id = fixName2Class(service)+'__asynplot';
        let itemGraphicopt ={width:graphicopt.width,height:graphicopt.height,margin:graphicopt.margin,contain:'#'+id};
        let itemScheme={};
        for (let i in scheme) {
            itemScheme[i] = scheme[i];
        }
        itemScheme.color = _.cloneDeep(scheme.color);
        itemScheme.color.key = service;
        itemScheme.color.domain = serviceFullList.find(s=>s.text===service).range;
        itemScheme.color.title = serviceLists[serviceFullList.find(s=>s.text===service).idroot];
        itemScheme.title = {text : service};
        let temp = {
            id: id,
            plot: new AsynChart().graphicopt(itemGraphicopt).scheme(itemScheme),
        };
        return temp;
    }
    master.stop = function (){
        contain.selectAll('div.plotItem').remove();
        plotObj = {}
    };

    master.draw = function () {
        master.init();
        const plotItem = contain.selectAll('div.plotItem')
            .data(plotLists,d=>d.id);
        plotItem.exit().each(d=>d.plot.destroy());
        plotItem.exit().remove();
        const plotItemNew = plotItem.enter()
            .append('div')
            .attr('class','plotItem')
            .attr('id',d=>d.id)
            .styles({width:graphicopt.width+'px', height:graphicopt.height+'px', position: 'relative'})
            .each(d=>d.plot.draw());
        preloader(false);
    };
    master.graphicopt = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    graphicopt[i] = __[i];
                }
            }
            return master;
        }else {
            return graphicopt;
        }

    };
    master.scheme = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    scheme[i] = __[i];
                }
            }
            return master;
        }else {
            return scheme;
        }

    };
    return master;
};

function handle_data_heatmap () {
    preloader(true, 0,"Process data input for heatmap....");
    let data = [];
    heatmapopt.height = heatmapopt.margin.top +heatmapopt.margin.bottom +1.5*hosts.length;
    // console.time('correlation compute: ')
    const hostOrder = getComputeCorrelation(serviceFullList[0].text);
    // console.timeEnd('correlation compute: ')
    // const hostOrder = d3.range(0,hosts.length);
    console.time('extractData: ');

    hostOrder.forEach((h, hi) => {
        const hname = hosts[h].name;
        let hostdata = sampleS[hname];

        sampleS.timespan.forEach((t, ti) => {
            let values = {};
            serviceLists.forEach((s, si) => {
                s.sub.forEach((sub,subi)=>{
                    values[sub.text] = hostdata[serviceListattr[si]][ti][subi];
                })
            });
            values.timestep = sampleS.timespan[ti];
            values.next = sampleS.timespan[ti+1]||sampleS.timespan[ti];
            values.compute = hname;
            values.rack = 'Rack '+ hosts[h].hpcc_rack;
            data.push(values);
        })
    });

    // rack
    // const rackData = d3.nest().key(d=>d.rack).key(d=>d.timestep).rollup(d=>{
    //     let values = {};
    //     serviceFullList.forEach((s, si) => {
    //     values[s.text] = d3.mean(d,e=>e[s.text]);})
    //     values.timestep = d[0].timestep;
    //     values.next = d[0].next;
    //     values.compute = d[0].compute;
    //     values.rack = d[0].rack;
    //     return values;
    // }).entries(data);
    // data = [];
    // rackData.forEach(d=>d.values.forEach(e=>data.push(e.value)));
    // end rack

    console.timeEnd('extractData: ')
    let scheme = {
        data:{value:data},
        x: {key:'timestep',keyNext:'next',type:'Time', axis:{tickFormat: 'return multiFormat(datum)'}},
        y: {key:'compute',type:'Band', axis:{tickValues:'return !(index%15)'}},
        // y: {key:'rack',type:'Band'},
        mark:{type:"rect"},
        color:{key:undefined,type:"Linear",domain:[0,1]}
    };
    preloader(true, 0,"Generate heatmap....");
    heatMap.graphicopt(heatmapopt).scheme(scheme).reset().draw();
}

function getComputeCorrelation(service){
    return orderComputeByCorrelation(correlationComputeCal(service))
}
function correlationComputeCal(service){
    const serviceIndex = serviceFullList.findIndex(d=>d.text===service);
    const data = hosts.map(h=>tsnedata[h.name].map(d=>d[serviceIndex]));
    let indexActiveService =d3.range(0,hosts.length);
    const n = indexActiveService.length;
    let simMatrix = [];
    for (let i = 0;i<n; i++){
        let temp_arr = [];
        for (let j=i+1; j<n; j++){
            let tempval = ss.sampleCorrelation(data[i],data[j]);
            // let tempval = pearsonCorcoef(data[i],data[j]);
            if (_.isNaN(tempval))
                tempval = 0;
            temp_arr.push(tempval)
        }
        temp_arr.name = hosts[i].name;
        temp_arr.index = i;
        temp_arr.index_s = indexActiveService[i];
        simMatrix.push(temp_arr)
    }
    return simMatrix;
}
function orderComputeByCorrelation(variableCorrelation){
    let simMatrix = variableCorrelation;
    const orderMatrix = simMatrix.map(d=>d.index);
    let mapIndex = [];
    simMatrix.forEach((v,i)=>{
        v.total =0;
        mapIndex.push(i);
        orderMatrix.forEach((j,jj)=>{
            if (i!==j) {
                if (j-i>0)
                    v.total += v[j-i-1];
                else
                    v.total += simMatrix[jj][i-1-j];
            }
        })
    });
    mapIndex.sort((a,b)=> simMatrix[a].total-simMatrix[b].total);
    let current_index = mapIndex.pop();
    let orderIndex = [simMatrix[current_index].index_s];

    do{
        let maxL = -Infinity;
        let maxI = 0;
        mapIndex.forEach((d)=>{
            let temp;
            if (orderMatrix[d]>simMatrix[current_index].index ){
                temp = simMatrix[current_index][orderMatrix[d]-simMatrix[current_index].index -1];
            }else{
                temp = simMatrix[d][simMatrix[current_index].index -orderMatrix[d]-1]
            }
            if (maxL<temp){
                maxL = temp;
                maxI = d;
            }
        });
        orderIndex.push(simMatrix[maxI].index_s);
        current_index = maxI;
        mapIndex = mapIndex.filter(d=>d!==maxI);
    } while(mapIndex.length);
    return orderIndex;
}
