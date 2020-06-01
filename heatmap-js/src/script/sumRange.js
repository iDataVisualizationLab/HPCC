let timeLine = function() {
    let graphicopt = {
            margin: {top: 20, right: 10, bottom: 0, left: 10},
            width: 250,
            height: 50,
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
        }, runopt = {compute: {setting: 'pie'}}, radarcreate, tableData = {}, tableHeader = [], tableFooter = [],
        colorscale,
        svg, g,
        data = [], arr = [],
        hosts = []
    ;
    let master ={};

    master.draw = function (){

    }

    master.graphicopt = function (_) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    graphicopt[i] = _[i];
                }
            }
            if (graphicopt.radaropt)
                graphicopt.radaropt.schema = schema;
            return master;
        }else {
            return graphicopt;
        }

    };

    master.svg = function (_) {
        return arguments.length ? (svg = _, master) : svg;
    };

}