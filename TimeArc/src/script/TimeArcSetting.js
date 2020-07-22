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
    let catergogryList=[{key: 'user', value: {colororder: 0}},{key: 'compute', value: {colororder: 1}}];
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
    return master;
};
function handle_data_timeArc () {
    let scheme ={limitColums : [0,10],
        limitTime : [sampleS.timespan[0],_.last(sampleS.timespan)],
        time: {rate:1,unit:'Hour'},
        timeLink: {rate:1,unit:'Hour'},
        timeformat: d3.timeDay.every(1),
    };
    let dataObj = {};
    scheme.data=[];
    sampleJobdata.forEach(j=>{
        j.nodes.forEach(comp=>{
            if (!dataObj[j.user+j.startTime+comp]) {
                const data = {category: {user: {}, compute: {}}, date: new Date(j.startTime)};
                data.category.user[j.user] = 1;
                data.category.compute[comp] = 1;
                dataObj[j.user + j.startTime + comp] = data;
                scheme.data.push(data)
            }
        })
    });
    scheme.data.tsnedata = tsnedata;
    scheme.data.timespan = sampleS.timespan.slice();
    scheme.data.selectedService = 0;
    scheme.limitTime = d3.extent(scheme.data,d=>d.date)
    timeArc.graphicopt(timeArcopt).scheme(scheme).draw();
}
