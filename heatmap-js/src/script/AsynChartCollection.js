let AsynChartCollection = function (){
    let graphicopt = {
        contain: '#heatmap_holder',
        margin: {top: 0, right: 0, bottom: 0, left: 0},
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
    }
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
        itemScheme.color.domain = [0,1];
        let temp = {
            id: id,
            plot: new AsynChart().graphicopt(itemGraphicopt).scheme(itemScheme),
        };
        return temp;
    }

    master.draw = function () {
        master.init();
        const plotItem = contain.selectAll('div.plotItem')
            .data(plotLists,d=>d.id);
        plotItem.exit().each(d=>d.plot.destroy())
        plotItem.exit().remove();
        const plotItemNew = plotItem.enter()
            .append('div')
            .attr('class','plotItem')
            .attr('id',d=>d.id)
            .styles({width:graphicopt.width+'px', height:graphicopt.height+'px', position: 'relative'})
            .each(d=>d.plot.draw());
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
}

function handle_data_heatmap () {
    let data = [];
    heatmapopt.height = heatmapopt.margin.top +heatmapopt.margin.bottom +10;
    hosts.forEach((h, hi) => {
        const hname = h.name;
        let hostdata = tsnedata[hname];
        sampleS.timespan.forEach((t, ti) => {
            let values = {}
            serviceFullList.forEach((s, si) => {
                    values[s.text] = hostdata[ti][si];
            });
            values.timestep = sampleS.timespan[ti];
            values.compute = hname;
            data.push(values)
        })
    });
    let scheme = {
        data:{value:data},
        x: {key:'timestep',type:'Band'},
        y: {key:'compute',type:'Band',visible:false},
        mark:{type:"rect"},
        color:{key:undefined,type:"Linear"}
    };
    heatMap.graphicopt(heatmapopt).scheme(scheme).reset().draw();
}
