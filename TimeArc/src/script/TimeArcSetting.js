let TimeArcSetting = function (){
    let graphicopt = {
        contain: '#Chartcontent',
        margin: {top: 10, right: 10, bottom: 0, left: 200},
        offset: {top: 0},
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
        },
        display: {
            links: {
                'stroke-opacity': 0.5
            }
        }
    };
    let scheme={};
    let contain = d3.select("#Chartcontent");
    let master = {};
    let TimeArc  = d3.TimeArc();
    let isFirst = true;
    let catergogryList=[{key: 'user', value: {colororder: 0}},{key: 'compute', value: {colororder: 1}},{key: 'rack', value: {colororder: 2}}];
    let layout={};
    master.timearc = TimeArc;
    master.reset = function(){

        return master;
    };
    master.init = function () {
        TimeArc.svg(contain)
            .graphicopt(graphicopt)
            // .mouseover(onmouseoverRadar).mouseout(onmouseleaveRadar)
            .catergogryList(catergogryList)
            .init();

        return master;
    };

    master.stop = function (){

    };

    master.draw = function () {
        if (isFirst) {
            master.init();
            isFirst = false;
        }

        TimeArc.runopt(scheme).data(scheme.data).draw();

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
            TimeArc.graphicopt(graphicopt);
            return master;
        }else {
            return graphicopt;
        }

    };
    let isNeedRender = true;
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
    master.schema = function (){
        isNeedRender = true;
    };
    master.layout = function(d){
        layout = {};
        d.forEach(k=>layout[k.Name]= _.flatten(k.value).filter(d=>d))
        TimeArc.classMap(layout)
    };
    return master;
};
function handle_data_timeArc () {
    let scheme ={limitColums : [0,10],
        limitTime : [sampleS.timespan[0],_.last(sampleS.timespan)],
        time: {rate:5,unit:'Minute'},
        // timeLink: {rate:5,unit:'Minute'},
        timeformat: d3.timeDay.every(1),
    };
    let dataObj = {};
    scheme.data=[];
    scheme.data.timespan = sampleS.timespan.slice();
    sampleJobdata.forEach(j=>{
        function linkData(key) {
            let date = new Date(j[key]);
            if (date < scheme.data.timespan[0])
                date = scheme.data.timespan[0];
            const data = {category: {user: {}, compute: {}}, date: date};
            data.category.user[j.user] = 1;
            j.nodes.forEach(comp=>data.category.compute[comp] = 1)
            data.type = key;
            data.id = j.jobID;
            scheme.data.push(data);
        }

        linkData('startTime');
        if (j.endTime)
            linkData('endTime');
    });
    scheme.data.tsnedata = tsnedata;
    scheme.data.selectedService = 0;
    // scheme.limitTime = d3.extent(scheme.data,d=>d.date)
    scheme.limitTime = [sampleS.timespan[0],_.last(sampleS.timespan)]
    timeArc.graphicopt(timeArcopt).scheme(scheme).draw();
}
