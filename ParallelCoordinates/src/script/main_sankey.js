var width, height;

var m = [40, 60, 10, 10],
    w,
    h,
    xscale,
    yscale = {},
    dragging = {},
    line =  d3.line(),
    axis,
    data,
    foreground,
    foreground_opacity=1,
    background,
    highlighted,
    dimensions,
    legend,
    render_speed = 50,
    brush_count = 0,
    excluded_groups = [],
    svg,g,listMetric;


//legend prt
var levelStep = 4;
var arrThresholds;
var selectedService = "CPU1 Temp";
var orderLegend;
var svgLengend;
//read file
var thresholds = [[3,98], [0,10], [0,99], [1050,17850],[0,200] ];
var chosenService = 0;
var conf={};
conf.serviceList = serviceList;
conf.serviceLists = serviceLists;
conf.serviceListattr = serviceListattr;
conf.serviceListattrnest = serviceListattrnest;
let dataInformation={filename:'',size:0,timerange:[],interval:'',totalstep:0,hostsnum:0,datanum:0};
var sampleS
var tsnedata
function Loadtostore() {
    // checkConf('serviceList');
    // checkConf('serviceLists');
    // checkConf('serviceListattr');
    // checkConf('serviceListattrnest');
}

// color
let colorScaleList = {
    n: 7,
    rainbow: ["#000066", "#4400ff", "#00ddff", "#00ddaa", "#00dd00", "#aadd00", "#ffcc00", "#ff8800", "#ff0000", "#660000"],
    soil: ["#2244AA","#4A8FC2", "#76A5B1", "#9DBCA2", "#C3D392", "#F8E571", "#F2B659", "#eb6424", "#D63128", "#660000"],
    customschemeCategory:  ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#bcbd22", "#17becf"],
    customFunc: function(name,arr,num){
        const n= num||this.n;
        const arrColor = arr||this[name];
        let colorLength = arrColor.length;
        const arrThresholds=d3.range(0,colorLength).map(e=>e/(colorLength-1));
        let colorTemperature = d3.scaleLinear()
            .domain(arrThresholds)
            .range(arrColor)
            .interpolate(d3.interpolateHcl);

        return d3.range(0,n).map(e=>colorTemperature(e/(n-1)))
    },
    d3colorChosefunc: function(name,num){
        const n = num|| this.n;
        if (d3[`scheme${name}`]) {
            if (typeof (d3[`scheme${name}`][0]) !== 'string') {
                colors = (d3[`scheme${name}`][n]||d3[`scheme${name}`][d3[`scheme${name}`].length-1]).slice();
            }
            else
                colors=  d3[`scheme${name}`].slice();
        } else {
            const interpolate = d3[`interpolate${name}`];
            colors = [];
            for (let i = 0; i < n; ++i) {
                colors.push(d3.rgb(interpolate(i / (n - 1))).hex());
            }
        }
        colors = this.customFunc(undefined,colors,n);
        return colors;
    },
},colorArr = {Radar: [
        {val: 'rainbow',type:'custom',label: 'Rainbow'},
        {val: 'RdBu',type:'d3',label: 'Blue2Red',invert:true},
        {val: 'soil',type:'custom',label: 'RedYelBlu'},
        {val: 'Viridis',type:'d3',label: 'Viridis'},
        {val: 'Greys',type:'d3',label: 'Greys'}],
    Cluster: [{val: 'Category10',type:'d3',label: 'D3'},{val: 'Paired',type:'d3',label: 'Blue2Red'}]};


//var arrColor = ['#00c', '#1a9850','#fee08b', '#d73027'];
// var arrColor = ['#110066','#4400ff', '#00cccc', '#00dd00','#ffcc44', '#ff0000', '#660000'];
// let arrColor = colorScaleList.customFunc('rainbow');
// let arrColor = colorScaleList.d3colorChosefunc('Greys');
var arrColor = ['#000066','#0000ff', '#1a9850', '#ddee00','#ffcc44', '#ff0000', '#660000'];
let colorCluster  = d3.scaleOrdinal().range(d3.schemeCategory10);

var service_custom_added = [];
var serviceFullList_withExtra =[];
// let processData = processData_old;

//***********************
// Loadtostore();
//***********************
// START: loader spinner settings ****************************
var opts = {
    lines: 25, // The number of lines to draw
    length: 15, // The length of each line
    width: 5, // The line thickness
    radius: 25, // The radius of the inner circle
    color: '#f00', // #rgb or #rrggbb or array of colors
    speed: 2, // Rounds per second
    trail: 50, // Afterglow percentage
    className: 'spinner', // The CSS class to assign to the spinner
};
var target = document.getElementById('loadingSpinner');
var  spinner = new Spinner(opts).spin(target);
// END: loader spinner settings ****************************

var undefinedValue = undefined;
var undefinedColor = "#666";
var colorscale = d3.scaleOrdinal(d3.schemeCategory10);
var colors = d3.scaleOrdinal();
var color,opa;
/// drawLegend *****************************************************************
let legendw= 80;
let legendh= 20;
let barw = 300;
let barScale = d3.scaleLinear();
let db = 'nagios';
// let animationtime = false ;
const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
Array.prototype.naturalSort= function(_){
    if (arguments.length) {
        return this.sort(function (as, bs) {
            return collator.compare(as[_],bs[_]);
        });
    }else {
        return this.sort(collator.compare);
    }
};

let group_opt = {
    clusterMethod: 'leaderbin',
    bin:{
        startBinGridSize: 5,
        range: [7,8]
    }
};

let sankey = d3.sankey()
    .nodeSort(null)
    .linkSort(null)
    .nodeWidth(6)
    .nodePadding(10);
function filterAxisbyDom(d) {
    const pdata = d3.select(this.parentElement.parentElement).datum();
    if(d.value.enable !== this.checked) {
        d.value.enable = this.checked;
        if (this.checked) {
            add_axis(pdata.arr, g);
            d3.select(this.parentElement.parentElement).classed('disable', false);
        }
        else {
            remove_axis(pdata.arr, g);
            d3.select(this.parentElement.parentElement).classed('disable', true);
        }
        // TODO required to avoid a bug
        var extent = d3.brushSelection(svg.selectAll(".dimension").filter(d => d == pdata.arr));
        if (extent)
            extent = extent.map(yscale[d].invert).sort((a, b) => a - b);
        update_ticks(pdata.arr, extent);
    }
}
let listOption=[];
function drawFiltertable() {
    listOption = serviceFullList_withExtra.map((e,ei) => {
        return {service: e.text, arr: e.text,order:ei,id:e.id, text: e.text, enable: e.enable,hide:e.hide}
    });

    let table = d3.select("#axisSetting").select('tbody');
    table
        .selectAll('tr').data(listOption)
        .join(enter => {
            const tr = enter.append("tr");
            tr.attr('data-id', d => d.arr);
            tr.classed('hide', d => d.hide);
            tr.each(function(d){d.tableObj = d3.select(this);})
            const alltr = tr.selectAll('td')
                .data(d => [{key: 'enable', value: d, type: "checkbox"}, {
                    key: 'colorBy',
                    value: false,
                    type: "radio"
                }, {key: 'text', value: d.text}]).enter()
                .append("td");
            alltr.filter(d => d.type === "radio")
                .append("input")
                .attrs(function (d, i) {
                    const pdata = d3.select(this.parentElement.parentElement).datum();
                    return {
                        type: "radio",
                        name: "colorby",
                        value: pdata.service
                    }
                }).on('change', function (d) {
                d3.select('tr.axisActive').classed('axisActive', false);
                d3.select(this.parentElement.parentElement).classed('axisActive', true);
                changeVar(d3.select(this.parentElement.parentElement).datum());
                brush();
            });
            alltr.filter(d => d.type === "checkbox")
                .append("input")
                .attrs(function (d, i) {
                    return {
                        type: "checkbox",
                        checked: serviceFullList_withExtra[d.value.order].enable ? "checked" : null
                    }
                }).on('adjustValue',function(d){
                    d3.select(this).attr('checked',serviceFullList_withExtra[d.value.order].enable ? "checked" : null)
            }).on('change', function (d) {
                filterAxisbyDom.call(this, d);
                xscale.domain(dimensions);
                d3.select("#foreground").style("opacity", foreground_opacity);
                brush();
            });
            alltr.filter(d => d.type === undefined)
                .text(d => d.value);
        }, update =>{
            const tr = update;
            tr.classed('hide', d => d.hide);
            tr.each(function(d){d.tableObj = d3.select(this);})
            tr.attr('data-id', d => d.arr);
            const alltr = tr.selectAll('td')
                .data(d => [{key: 'enable', value: d, type: "checkbox"}, {
                    key: 'colorBy',
                    value: false,
                    type: "radio"
                }, {key: 'text', value: d.text}]);
            alltr.filter(d => d.type === undefined)
                .text(d => d.value);
            alltr.filter(d => d.type === "checkbox")
                .select("input")
                .each(function(d){this.checked = serviceFullList_withExtra[d.value.order].enable})
            }
        );
    listMetric = Sortable.create($('tbody')[0], {
        animation: 150,
        sort: true,
        dataIdAttr: 'data-id',
        filter: ".disable",
        onStart: function (/**Event*/evt) {
            evt.oldIndex;  // element index within parent
            const currentAxis = d3.select(evt.item).datum();
            const chosenAxis = svg.selectAll(".dimension").filter(d => d == currentAxis.arr);
            _.bind(dragstart, chosenAxis.node(), chosenAxis.datum())();
        },
        onEnd: function (/**Event*/evt) {
            var itemEl = evt.item;  // dragged HTMLElement
            evt.to;    // target list
            evt.from;  // previous list
            evt.oldIndex;  // element's old index within old parent
            evt.newIndex;  // element's new index within new parent
            evt.clone // the clone element
            evt.pullMode;  // when item is in another sortable: `"clone"` if cloning, `true` if moving
            const currentAxis = d3.select(itemEl).datum();
            const chosenAxis = svg.selectAll(".dimension").filter(d => d == currentAxis.arr);
            _.bind(dragend, chosenAxis.node(), chosenAxis.datum())();
        },
        onMove: function (/**Event*/evt, /**Event*/originalEvent) {

            // Example: https://jsbin.com/nawahef/edit?js,output
            evt.dragged; // dragged HTMLElement
            evt.draggedRect; // DOMRect {left, top, right, bottom}
            evt.related; // HTMLElement on which have guided
            evt.relatedRect; // DOMRect
            evt.willInsertAfter; // Boolean that is true if Sortable will insert drag element after target by default
            originalEvent.clientY; // mouse position
            // return false; — for cancel
            // return -1; — insert before target
            // return 1; — insert after target
            // console.log(originalEvent);
            // console.log(d3.event);
            const currentAxis = d3.select(evt.dragged).datum();
            const relatedtAxis = d3.select(evt.related).datum();
            const chosenAxis = svg.selectAll(".dimension").filter(d => d === currentAxis.arr);


            d3.event = {};
            // d3.event.dx = originalEvent.clientY - this.pre; // simulate the drag behavior
            d3.event.dx = position(relatedtAxis.arr) - position(currentAxis.arr); // simulate the drag behavior
            d3.event.dx = d3.event.dx + ((d3.event.dx > 0) ? 1 : -1);
            if (!isNaN(d3.event.dx))
                _.bind(dragged, chosenAxis.node(), chosenAxis.datum())();

        }
    });
}
let shuffled_data = [];
$( document ).ready(function() {
    console.log('ready');
    $('.tabs').tabs();
    $('.dropdown-trigger').dropdown();
    $('.sidenav').sidenav();
    $('#leftpanel.collapsible').collapsible({onOpenStart: function(evt){
            console.log(evt)
            if(d3.select(evt).classed('searchPanel')&&complex_data_table_render){
                complex_data_table(shuffled_data,true)
            }
        }});
    discovery('#sideNavbtn');
    d3.select("#DarkTheme").on("click",switchTheme).dispatch("click");

    // data
    let tipopt= {position: {
            x: 'right',
            y: 'center'
        },
        outside: 'x',
        adjustPosition: true,
        adjustTracker: true,
        theme: 'TooltipBorderThick',
        addClass:'informationDetail',
        getTitle:'data-title'
    };
    d3.selectAll('.information, .toolTip').each(function() {
        const hasTarget = d3.select(this).attr('data-target');
        const hasImage = d3.select(this).attr('data-image');
        let positiont = d3.select(this).attr('tooltip-pos');
        if (hasTarget||hasImage){
            tipopt.addClass ='informationDetail';
            tipopt.position = {
                x: 'right',
                y: 'center'
            }
            tipopt.outside= 'x';
            delete tipopt.offset;
        }else{
            tipopt.addClass = 'informationDetail mini';
            if (!positiont) {
                tipopt.offset = {y: -15};
                delete tipopt.position;
                tipopt.outside = "y";
            }else{
                tipopt.position = {
                    x: 'right',
                    y: 'center'
                }
                tipopt.outside= 'x';
                delete tipopt.offset;
            }
        }
        let tip = $(this).jBox('Tooltip',_.defaults({
            pointer: (hasTarget||hasImage)?"top:20":(positiont?false:"center")
        }, tipopt));
        if (hasTarget)
            tip.setContent($('#datainformation'));
        else if(hasImage)
            tip.setContent(`<img src="src/images/${hasImage}" width="100%"></img>`);

    });
    d3.select('#enableVariableCorrelation').on('click',function(){
        getcorrelation();
    });
    d3.select('#majorGroupDisplay_control').on('change',function() {
        switch ($(this).val()) {
            case "0":
                radarChartclusteropt.boxplot = false;
                d3.selectAll('#clusterDisplay .radarPlot').style('opacity',null);
                cluster_map(cluster_info);
                break;
            case "1":
                radarChartclusteropt.boxplot = true;
                d3.selectAll('#clusterDisplay .radarPlot').style('opacity',null);
                cluster_map(cluster_info);
                break;
            case "2":
                d3.selectAll('#clusterDisplay .radarPlot').style('opacity',0.2);
                onClusterHistogram();
                break;
        }
    });
    initClusterUi();
    // init();
});

function realTimesetting (option,db,init){
    isRealtime = option;
    // getDataWorker.postMessage({action:'isRealtime',value:option,db: db});
    if (option){
        processData = eval('processData_'+db);
    }else{
        processData = db?eval('processData_'+db):processData_old;
    }
    // if(!init)
    //     resetRequest();
}

function getBrush(d) {
    return d3.brushY(yscale[d])
        .extent([[-10, 0], [10, h]])
        .on("brush end", brush);
}
function dragstart (d) {
    dragging[d] = this.__origin__ = xscale(d);
    this.__dragged__ = false;
    d3.select("#foreground").style("opacity", "0.35");
}
function dragged (d) {
    dragging[d] = Math.min(w, Math.max(0, this.__origin__ += d3.event.dx));

    dimensions.sort(function (a, b) {

        return position(a) - position(b);
    });
    xscale.domain(dimensions);
    reorderDimlist();
    svg.selectAll(".dimension").attr("transform", function (d) {
        return "translate(" + position(d) + ")";
    });
    this.__dragged__ = true;
    //brush();
    // Feedback for axis deletion if dropped
    if (dragging[d] < 12 || dragging[d] > w - 12) {
        d3.select(this).select(".background").style("fill", "#b00");
    } else {
        d3.select(this).select(".background").style("fill", null);
    }
}

function reorderDimlist() {
// reorder list
    let pre = 0;
    let next = 0;
    dimensions.find(dim => {
        const pos = _.indexOf(listMetric.toArray(), dim);
        next = pos != -1 ? pos : next;
        if (next < pre)
            return true;
        else
            pre = next;
        return false;
    });
    if (next < pre) {
        let order_list = listMetric.toArray();
        swap(order_list, pre, next);
        listMetric.sort(order_list);
    }
    d3.selectAll('#axisSetting tbody input[type="checkbox"]').dispatch('adjustValue')
}

function dragend(d) {
    if (!this.__dragged__) {
        // no movement, invert axis
        var extent = invert_axis(d, this);
    } else {
        // reorder axes
        d3.select(this).transition().attr("transform", "translate(" + xscale(d) + ")");

        // var extent = yscale[d].brush.extent();
        var extent = d3.brushSelection(this);
        if (extent)
            extent = extent.map(yscale[d].invert).sort((a,b)=>a-b);
    }

    // remove axis if dragged all the way left
    if (dragging[d] < 12 || dragging[d] > w - 12) {
        remove_axis(d, g);
    }

    // TODO required to avoid a bug
    xscale.domain(dimensions);
    update_ticks(d, extent);

    reorderDimlist();
    // rerender
    d3.select("#foreground").style("opacity", foreground_opacity);
    brush();
    delete this.__dragged__;
    delete this.__origin__;
    delete dragging[d];
}
let variableCorrelation
function getcorrelation(){
    variableCorrelation = correlationCal(serviceFullList.map(d=>d.enable));
    orderByCorrelation();
    let temp_dimensions = []
    serviceFullList.forEach(s=>{
        if(dimensions.find(d=>d===s.text))
            temp_dimensions.push({key:s.text,value:s.angle});
    });
    temp_dimensions.sort((a,b)=>a.value-b.value);
    dimensions = temp_dimensions.map(d=>d.key)
    xscale.domain(dimensions);
    listMetric.sort(temp_dimensions.map(d=>d.key));
    // svg.selectAll(".dimension").each(function(d){
    //     if (d!==stickKey) {
    //         var extent = d3.brushSelection(d3.select(this));
    //         if (extent)
    //             extent = extent.map(yscale[d].invert).sort((a, b) => a - b);
    //         update_ticks(d, extent);
    //     }
    // });
    updateDimension();
    // reorderDimlist();
    brush()
}
function correlationCal(serviceEnable){
    let data = _.unzip(_.flatten(_.keys(tsnedata).map(e=>tsnedata[e].map(e=>e)),1));
    let indexActiveService =[];
    const activeservice = serviceFullList.filter((s,si)=>{
        if(serviceEnable[si])
            indexActiveService.push(si);
        return serviceEnable[si]});
    const n = activeservice.length;
    let simMatrix = [];
    for (let i = 0;i<n; i++){
        let temp_arr = [];
        // temp_arr.total = 0;
        for (let j=i+1; j<n; j++){
            let tempval = pearsonCorcoef(data[indexActiveService[i]],data[indexActiveService[j]]);
            // temp_arr.total += tempval;
            temp_arr.push(tempval)
        }
        // for (let j=0;j<i;j++)
        //     temp_arr.total += simMatrix[j][i-1-j];
        temp_arr.name = serviceFullList[indexActiveService[i]].text;
        temp_arr.index = i;
        temp_arr.index_s = indexActiveService[i];
        simMatrix.push(temp_arr)
    }
    return simMatrix;
}
function swap (a,indexa,indexb){
    const temp = a[indexa];
    a[indexa] = a[indexb];
    a[indexb] = temp;
}
// Establish the desired formatting options using locale.format():
// https://github.com/d3/d3-time-format/blob/master/README.md#locale_format
var formatMillisecond = d3.timeFormat(".%L"),
    formatSecond = d3.timeFormat(":%S"),
    formatMinute = d3.timeFormat("%I:%M"),
    formatHour = d3.timeFormat("%I %p"),
    formatDay = d3.timeFormat("%a %d"),
    formatWeek = d3.timeFormat("%b %d"),
    formatMonth = d3.timeFormat("%B"),
    formatYear = d3.timeFormat("%Y");

// Define filter conditions
function multiFormat(date) {
    return (d3.timeSecond(date) < date ? formatMillisecond
        : d3.timeMinute(date) < date ? formatSecond
            : d3.timeHour(date) < date ? formatMinute
                : d3.timeDay(date) < date ? formatHour
                    : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
                        : d3.timeYear(date) < date ? formatMonth
                            : formatYear)(date);
}

function getScale(d) {
    let axisrender =  axis.scale(yscale[d]);
    if(yscale[d].axisCustom) {
        if (yscale[d].axisCustom.ticks)
            axisrender = axisrender.ticks(yscale[d].axisCustom.ticks)
        if (yscale[d].axisCustom.tickFormat)
            axisrender = axisrender.tickFormat(yscale[d].axisCustom.tickFormat)
    }else{
        axisrender = axisrender.ticks(1 + height / 50);
        axisrender = axisrender.tickFormat(undefined)
    }
    return axisrender;
}

function updateDimension() {
    g = svg.selectAll(".dimension")
        .data(dimensions,d=>d).join(enter => {
            const new_dim = enter.append("svg:g")
                .attr("class", "dimension")
                .attr("transform", function (d) {
                    return "translate(" + xscale(d) + ")";
                })
                .call(d3.drag()
                    .on("start", dragstart)
                    .on("drag", dragged)
                    .on("end", dragend));
                // Add an axis and title.
                new_dim.append("svg:g")
                .attr("class", "axis")
                .attr("transform", "translate(0,0)")
                .each(function (d) {
                    return d3.select(this).call(getScale(d));
                })
                .append("svg:text")
                    .attr("text-anchor", "start")
                    .style('transform','rotate(-15deg) translate(-5px,-6px)')
                // .attr("y", function(d,i) { return i%2 == 0 ? -14 : -30 } )
                .attr("y", -14)
                .attr("x", 0)
                .attr("class", "label")
                .text(String)
                .append("title")
                .text("Click to invert. Drag to reorder");
            // Add violinplot holder
                new_dim.append("svg:g")
                    .attr("class", "plotHolder")
                    .attr("transform", "translate(0,0)")

                    // .append('rect')
                    // .attr('class','background')
                    // .style('fill','rgba(255,255,255,0.38)')
                    // .style('transform','translate(-50%,0)')
                    // .attrs({width:violiin_chart.graphicopt().width,height:violiin_chart.graphicopt().height});
            // Add and store a brush for each axis.
                new_dim.append("svg:g")
                .attr("class", "brush")
                .each(function (d) {
                    d3.select(this).call(yscale[d].brush = getBrush(d));
                })
                .selectAll("rect")
                .style("visibility", null)
                .attr("x", -23)
                .attr("width", 36)
                .append("title")
                .text("Drag up or down to brush along this axis");

                new_dim.selectAll(".extent")
                .append("title")
                .text("Drag or resize this filter");
                return new_dim;
            },
            update =>{
                isChangeData = true;
                // Add an axis and title.
                update.select(".axis")
                    .attr("transform", "translate(0,0)")
                    .each(function (d) {
                        return d3.select(this).call(getScale(d));
                    });
                // update.select().select('.background')
            return  update.attr("transform", function (d) {
                return "translate(" + xscale(d) + ")";});
            },exit => exit.remove());
}
function initFunc() {
    calculateServiceRange();
    dimensions=[]
    handle_clusterinfo ();
    if(timel)
        timel.stop();
    width = $("#Maincontent").width()-10;
    height = d3.max([document.body.clientHeight-150, 300]);
    w = width - m[1] - m[3];
    h = height - m[0] - m[2];
    xscale = d3.scalePoint().range([0, w]).padding(0.3);
    axis = d3.axisLeft().ticks(1+height/50);
    // Scale chart and canvas height
    let chart = d3.select("#chart")
        .style("height", (h + m[0] + m[2]) + "px");

    chart.selectAll("canvas")
        .attr("width", w)
        .attr("height", h)
        .style("padding", m.join("px ") + "px");


// Foreground canvas for primary view
    foreground = document.getElementById('foreground').getContext('2d');
    foreground.globalCompositeOperation = "destination-over";
    foreground.strokeStyle = "rgba(0,100,160,0.1)";
    foreground.lineWidth = 1.7;
    foreground.fillText("Loading...",w/2,h/2);

// Highlight canvas for temporary interactions
    highlighted = document.getElementById('highlight').getContext('2d');
    highlighted.strokeStyle = "rgba(0,100,160,1)";
    highlighted.lineWidth = 4;

// Background canvas
    background = document.getElementById('background').getContext('2d');
    background.strokeStyle = "rgba(0,100,160,0.1)";
    background.lineWidth = 1.7;

    // svgLengend = d3.select('#colorContinuos').append('div').append('svg')
    //     .attr("class", "legendView")
    //     .attr("width", 0)
    //     .attr("height", 0)
    //     .style('display','none');
// SVG for ticks, labels, and interactions
    svg = d3.select("#chart").select("svg")
        .attr("width", width)
        .attr("height", height)
        .append("svg:g")
        .attr("transform", "translate(" + m[3] + "," + m[0] + ")");
    svg.selectAll('*').remove()
    // Load the data and visualization
    isinit = false;
// Load the data and visualization

    // Convert quantitative scales to floats
    data = object2DataPrallel(sampleS);
    // Extract the list of numerical dimensions and create a scale for each.
    xscale.domain(dimensions =serviceFullList_withExtra.filter(function (s) {
        let k = s.text;
        let xtempscale = (((_.isDate(data[0][k])) && (yscale[k] = d3.scaleTime()
            .domain(d3.extent(data, function (d) {
                return d[k];
            }))
            .range([h, 0])) || (_.isNumber(data[0][k])) && (yscale[k] = d3.scaleLinear()
            // .domain(d3.extent(data, function (d) {
            //     return +d[k];
            // }))
            .domain(serviceFullList_withExtra.find(d=>d.text===k).range||[0,0])
            .range([h, 0]))));
        if(s.axisCustom)
            xtempscale.axisCustom = s.axisCustom;
        return s.enable?xtempscale:false;
    }).map(s=>s.text));
    d3.select('#search').attr('placeholder',`Search host e.g ${data[0].compute}`);
    // Add a group element for each dimension.
    setColorsAndThresholds_full();
    updateDimension();


    // legend = create_legend(colors, brush);
    if (!serviceFullList.find(d=>d.text===selectedService))
        selectedService = serviceFullList[0].text;
    const selecteds = d3.select("#axisSetting")
        .select('tbody')
        .selectAll('tr')
        .filter(d=>d.arr===selectedService).select('input[type="radio"]').property("checked", true);
    _.bind(selecteds.on("change"),selecteds.node())();

    // changeVar(d3.select("#axisSetting").selectAll('tr').data().find(d=>d.arr==selectedService));
    // Render full foreground
    // brush();
    brush();
    console.log('---init---');
}

function resetRequest() {
    calculateServiceRange();
    // Convert quantitative scales to floats
    // animationtime = false;
    handle_clusterinfo ()
    unhighlight()
    data = object2DataPrallel(sampleS);
    yscale = {};
    xscale.domain(dimensions = serviceFullList_withExtra.filter(function (s) {
        let k = s.text;
        let xtempscale = (((_.isDate(data[0][k])) && (yscale[k] = d3.scaleTime()
            .domain(d3.extent(data, function (d) {
                return d[k];
            }))
            .range([h, 0])) || (_.isNumber(data[0][k])) && (yscale[k] = d3.scaleLinear()
            // .domain(d3.extent(data, function (d) {
            //     return +d[k];
            // }))
            .domain(serviceFullList_withExtra.find(d=>d.text===k).range||[0,0])
            .range([h, 0]))));
        if(s.axisCustom)
            xtempscale.axisCustom = s.axisCustom;
        return s.enable?xtempscale:false;
    }).map(s=>s.text));
    d3.select('#search').attr('placeholder',`Search host e.g ${data[0].compute}`);
    // Add a group element for each dimension.
    updateDimension();
    setColorsAndThresholds_full();
    if (!serviceFullList.find(d=>d.text===selectedService))
        selectedService = serviceFullList[0].text;
    const selecteds = d3.select("#axisSetting")
        .select('tbody')
        .selectAll('tr')
        .filter(d=>d.arr==selectedService).select('input[type="radio"]').property("checked", true);
    _.bind(selecteds.on("change"),selecteds.node())();
    brush();
}
let coloraxis ={};
let opaaxis ={};
function setColorsAndThresholds_full() {
    coloraxis ={};
    opaaxis ={};
    serviceFullList_withExtra.forEach(s=> {
        if (s.idroot===undefined){
            s.range = stickKey!==TIMEKEY?[yscale[stickKey].domain()[1],yscale[stickKey].domain()[0]]:yscale[stickKey].domain();
            const dif = (s.range[1] - s.range[0]) / levelStep;
            const mid = +s.range[0] + (s.range[1] - s.range[0]) / 2;
            let left = +s.range[0] - dif;
            if (stickKey===TIMEKEY) {
                arrThresholds = [new Date(left), s.range[0], new Date(+s.range[0] + dif), new Date(+s.range[0] + 2 * dif), new Date(+s.range[0] + 3 * dif), s.range[1], new Date(+s.range[1] + dif)];
                opaaxis[s.text] = d3.scaleTime()
                    .domain([new Date(left),s.range[0],new Date(mid), s.range[1], new Date(s.range[1]+dif)])
                    .range([1,1,0.1,1,1]);
            }else {
                arrThresholds = [left, s.range[0], s.range[0] + dif, s.range[0] + 2 * dif, s.range[0] + 3 * dif, s.range[1], s.range[1] + dif];
                opaaxis[s.text] = d3.scaleLinear()
                    .domain([left,s.range[0],mid, s.range[1], s.range[1]+dif])
                    .range([1,1,0.1,1,1]);
            }
        }else
        {
            const dif = (s.range[1] - s.range[0]) / levelStep;
            const mid = s.range[0] + (s.range[1] - s.range[0]) / 2;
            let left = s.range[0] - dif;
            arrThresholds = [left, s.range[0], s.range[0] + dif, s.range[0] + 2 * dif, s.range[0] + 3 * dif, s.range[1], s.range[1] + dif];
            // opaaxis[s.text] = d3.scaleLinear()
            //     .domain([left,s.range[0],mid, s.range[1], s.range[1]+dif])
            //     .range([1,1,0.1,1,1]);
            // if(!s.isString)
            opaaxis[s.text]=()=>0.4;
            // else
            //     opaaxis[s.text]=()=>1;
        }
        if(s.color) {
            coloraxis[s.text] = s.color.copy();
            coloraxis[s.text].domain(s.color.domain().map(c=>s.axisCustom.tickInvert(c)))
        }else
            coloraxis[s.text] = d3.scaleLinear()
                .domain(arrThresholds)
                .range(arrColor)
                .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
    })
}
function updateColorsAndThresholds(sin){
    let s = serviceFullList_withExtra.find(d=>d.text===sin);
    if (s.idroot===undefined){
        s.range = stickKey!==TIMEKEY?[yscale[stickKey].domain()[1],yscale[stickKey].domain()[0]]:yscale[stickKey].domain();
        const dif = (s.range[1] - s.range[0]) / levelStep;
        const mid = +s.range[0] + (s.range[1] - s.range[0]) / 2;
        let left = +s.range[0] - dif;
        if (stickKey===TIMEKEY) {
            arrThresholds = [new Date(left), s.range[0], new Date(+s.range[0] + dif), new Date(+s.range[0] + 2 * dif), new Date(+s.range[0] + 3 * dif), s.range[1], new Date(+s.range[1] + dif)];
            opaaxis[s.text] = d3.scaleTime()
                .domain([new Date(left),s.range[0],new Date(mid), s.range[1], new Date(s.range[1]+dif)])
                .range([1,1,0.1,1,1]);
        }else {
            arrThresholds = [left, s.range[0], s.range[0] + dif, s.range[0] + 2 * dif, s.range[0] + 3 * dif, s.range[1], s.range[1] + dif];
            opaaxis[s.text] = d3.scaleLinear()
                .domain([left,s.range[0],mid, s.range[1], s.range[1]+dif])
                .range([1,1,0.1,1,1]);
        }
    }else
    {
        const dif = (s.range[1] - s.range[0]) / levelStep;
        const mid = s.range[0] + (s.range[1] - s.range[0]) / 2;
        let left = s.range[0] - dif;
        arrThresholds = [left, s.range[0], s.range[0] + dif, s.range[0] + 2 * dif, s.range[0] + 3 * dif, s.range[1], s.range[1] + dif];
        opaaxis[s.text] = d3.scaleLinear()
            .domain([left,s.range[0],mid, s.range[1], s.range[1]+dif])
            .range([1,1,0.1,1,1]);
    }
    if(s.color) {
        coloraxis[s.text] = s.color.copy();
        coloraxis[s.text].domain(s.color.domain().map(c=>s.axisCustom.tickInvert(c)))
    }else
        coloraxis[s.text] = d3.scaleLinear()
            .domain(arrThresholds)
            .range(arrColor)
            .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
}
function setColorsAndThresholds(sin) {
    color = coloraxis[sin];
    opa = opaaxis[sin];
}

// copy one canvas to another, grayscale
function gray_copy(source, target) {
    var pixels = source.getImageData(0,0,w,h);
    target.putImageData(grayscale(pixels),0,0);
}

// http://www.html5rocks.com/en/tutorials/canvas/imagefilters/
function grayscale(pixels, args) {
    var d = pixels.data;
    for (var i=0; i<d.length; i+=4) {
        var r = d[i];
        var g = d[i+1];
        var b = d[i+2];
        // CIE luminance for the RGB
        // The human eye is bad at seeing red and blue, so we de-emphasize them.
        var v = 0.2126*r + 0.7152*g + 0.0722*b;
        d[i] = d[i+1] = d[i+2] = v
    }
    return pixels;
};

function create_legend(colors,brush) {
    if (selectedService) {
        colorbyValue(orderLegend);
    }else{
        colorbyCategory(data,"group");
    }
    barScale.range([0,Math.max(svgLengend.node().parentElement.offsetWidth,400)]);
    // create legend
    var legend_data = d3.select("#legend")
        .html("")
        .selectAll(".row")
        .data( colors.domain() );
    var legendAll = legend_data.join(
        enter=>{
            let legend = enter.append("div")
                .attr("title", "Hide group");
            legend
                .append("span")
                .attr("class","col s3")
                .text(function(d,i) { return " " + d});
            legend
                .append("span")
                .style("opacity",0.85)
                .attr("class", "color-bar");

            legend
                .append("span")
                .attr("class", "tally")
                .text(function(d,i) { return 0});

            return legend;
        }
    ).on("click", function(d) {
        // toggle food group
        if (_.contains(excluded_groups, d)) {
            d3.select(this).attr("title", "Hide group")
            excluded_groups = _.difference(excluded_groups,[d]);
            brush();
        } else {
            d3.select(this).attr("title", "Show group")
            excluded_groups.push(d);
            brush();
        }
    });
    legendAll.selectAll(".color-bar").style("background", function(d,i) { return colors(d)});
    return legendAll;
}

// render polylines i to i+render_speed
function render_range(selection, i, max, opacity) {
    selection.slice(i,max).forEach(function(d) {
        path(d, foreground, colorCanvas(selectedService==null?d.group:d[selectedService],opacity));
        // if (animationtime){
        //     timel.stop();
        //     animationtime = false;
        //     return true
        // }
    });
};

// simple data table
function data_table(sample) {
    // sort by first column
    // var sample = sample.sort(function(a,b) {
    //     var col = d3.keys(a)[0];
    //     return a[col] < b[col] ? -1 : 1;
    // });
    // sort by Name
    var sample = sample.naturalSort("name");

    var table = d3.select("#compute-list")
        .html("")
        .selectAll("li")
        .data(sample)
        .enter().append("li")
        .on("mouseover", highlight)
        .on("mouseout", unhighlight);

    table
        .append("span")
        .attr("class", "color-block")
        .style("background", function(d) { return color(selectedService==null?d.group:d[selectedService]) })
        .style("opacity",0.85);

    table
        .append("span")
        .text(function(d) { return d.name; })
}
// complex data table
let complex_data_table_render = false;
function complex_data_table(sample,render) {
    if(complex_data_table_render && (render||!d3.select('.searchPanel.active').empty())) {
        var samplenest = d3.nest()
            .key(d => d.rack).sortKeys(collator.compare)
            .key(d => d.compute).sortKeys(collator.compare)
            .sortValues((a, b) => a.Time - b.Time)
            .entries(sample);
        d3.select("#compute-list").html('');
        var table = d3.select("#compute-list")
            .attr('class', 'collapsible rack')
            .selectAll("li")
            .data(samplenest, d => d.value);
        var ulAll = table.join(
            enter => {
                let lir = enter.append("li").attr('class', 'rack');
                lir.append('div')
                    .attr('class', 'collapsible-header')
                    .text(d => d.key);
                const lic = lir.append('div')
                    .attr('class', 'collapsible-body')
                    .append('div')
                    .attr('class', 'row marginBottom0')
                    .append('div')
                    .attr('class', 'col s12 m12')
                    .append('ul')
                    .attr('class', 'collapsible compute')
                    .datum(d => d.values)
                    .selectAll('li').data(d => d)
                    .enter()
                    .append('li').attr('class', 'compute');
                lic.append('div')
                    .attr('class', 'collapsible-header')
                    .text(d => d.key);
                const lit = lic
                    .append('div')
                    .attr('class', 'collapsible-body')
                    .append('div')
                    .attr('class', 'row marginBottom0')
                    .append('div')
                    .attr('class', 'col s12 m12')
                    .append('ul')
                    .datum(d => d.values)
                    .selectAll('li').data(d => d)
                    .enter()
                    .append('li').attr('class', 'comtime')
                    .on("mouseover", highlight)
                    .on("mouseout", unhighlight);

                lit.append("span")
                    .attr("class", "color-block")
                    .style("background", function (d) {
                        return color(selectedService == null ? d.group : d[selectedService])
                    })
                    .style("opacity", 0.85);
                lit.append("span")
                    .text(function (d) {
                        return stickKeyFormat(d[stickKey]);
                    });

                return lir;
            }
        )
        $('.collapsible').collapsible();
        complex_data_table_render = false;
    }
}
// Adjusts rendering speed
function optimize(timer) {
    var delta = (new Date()).getTime() - timer;
    render_speed = Math.max(Math.ceil(render_speed * 30 / delta), 8);
    render_speed = Math.min(render_speed, 300);
    return (new Date()).getTime();
}

// Feedback on rendering progress
function render_stats(i,n,render_speed) {
    d3.select("#rendered-count").text(i);
    d3.select("#rendered-bar")
        .style("width", (100*i/n) + "%");
    d3.select("#render-speed").text(render_speed);
}

// Feedback on selection
function selection_stats(opacity, n, total) {
    d3.select("#data-count").text(total);
    d3.select("#selected-count").text(n);
    d3.select("#selected-bar").style("width", (100*n/total) + "%");
    d3.select("#opacity").text((""+(opacity*100)).slice(0,4) + "%");
}

// Highlight single polyline
function highlight(d) {
    d3.select("#foreground").style("opacity", "0.25");
    if (selectedService){
        const val = d[selectedService];
        const gourpBeloing = orderLegend.find(dv=>val>=dv.minvalue && val<dv.value)||{text:undefined};

        d3.select("#colorContinuos").selectAll(".row").style("opacity", function(p) { return (gourpBeloing.text === p) ? null : "0.3" });
    }else {
        d3.select("#legend").selectAll(".row").style("opacity", function (p) {
            return (d.group == p) ? null : "0.3"
        });
    }
    path(d, highlighted, colorCanvas(selectedService==null?d.group:d[selectedService],1));
}

// Remove highlight
function unhighlight() {
    d3.select("#foreground").style("opacity", foreground_opacity);
    d3.select("#legend").selectAll(".row").style("opacity", null);
    if (selectedService){
        d3.select("#colorContinuos").selectAll(".row").style("opacity", null);
    }else {
        d3.select("#legend").selectAll(".row").style("opacity", null);
    }
    highlighted.clearRect(0,0,w,h);
}

function invert_axis(d) {
    // save extent before inverting
    var extent;
    svg.selectAll(".brush")
        .filter(ds=>ds===d)
        .filter(function(ds) {
            yscale[ds].brushSelectionValue = d3.brushSelection(this);
            return d3.brushSelection(this);
        })
        .each(function(d) {
            // Get extents of brush along each active selection axis (the Y axes)
            extent = d3.brushSelection(this).map(yscale[d].invert);
        });


    if (yscale[d].inverted == true) {
        yscale[d].range([h, 0]);
        d3.selectAll('.label')
            .filter(function(p) { return p == d; })
            .style("text-decoration", null);
        yscale[d].inverted = false;
    } else {
        yscale[d].range([0, h]);
        d3.selectAll('.label')
            .filter(function(p) { return p == d; })
            .style("text-decoration", "underline");
        yscale[d].inverted = true;
    }
    return extent;
}

// Draw a single polyline
/*
function path(d, ctx, color) {
  if (color) ctx.strokeStyle = color;
  var x = xscale(0)-15;
      y = yscale[dimensions[0]](d[dimensions[0]]);   // left edge
  ctx.beginPath();
  ctx.moveTo(x,y);
  dimensions.map(function(p,i) {
    x = xscale(p),
    y = yscale[p](d[p]);
    ctx.lineTo(x, y);
  });
  ctx.lineTo(x+15, y);                               // right edge
  ctx.stroke();
}
*/

function path(d, ctx, color) {
    if (color) ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.setLineDash([]);
    var x0 = xscale(dimensions[0])-15,
        y0 = yscale[dimensions[0]](d[dimensions[0]]);   // left edge
    ctx.moveTo(x0,y0);
    let valid = true;
    dimensions.map(function(p,i) {
        var x = xscale(p),
            y = yscale[p](d[p]);
        if (y===undefined) {
            if (valid) {
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x0,y0);
                ctx.setLineDash([5, 15]);
            }
            valid = false;
        }else if (valid) {
            var cp1x = x - 0.5 * (x - x0);
            var cp1y = y0;
            var cp2x = x - 0.5 * (x - x0);
            var cp2y = y;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
            x0 = x;
            y0 = y;
        }else {
            var cp1x = x - 0.5 * (x - x0);
            var cp1y = y0;
            var cp2x = x - 0.5 * (x - x0);
            var cp2y = y;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.moveTo(x,y);
            valid = true;
            x0 = x;
            y0 = y;
        }
    });
    ctx.lineTo(x0+15, y0);                               // right edge
    ctx.stroke();
};

function colorCanvas(d,a) {
    var c = d3.hsl(color(d));
    c.opacity=a;
    return c;
}
function changeGroupTarget(key) {
    if (key === 'rack' )
        data.forEach(d=>d.group = d.rack)
    else {
        var thresholdScale = function(scale,d) {
            if(d) return d3.bisector(function(d) { return d; }).right(scale,d);
            return undefined};
        let nameLegend = rangeToString(arrThresholds);
        let arrmidle = arrThresholds.slice(1);
        orderLegend = d3.merge([nameLegend.map((d,i)=>{
            return{text: d, value: arrmidle[i], minvalue: arrThresholds[i]}}).reverse(),[{text: undefined, value: arrThresholds[1]+arrmidle[0]-arrmidle[1], minvalue: -Infinity}]]);
        data.forEach(d => d.group = nameLegend[thresholdScale(arrmidle,d[key])]);
    }
}
function rangeToString(arr){
    let midleRange = arr.slice(1,this.length-1);
    let mapRangeName = ["(<"+midleRange[0]+")"];
    midleRange.slice(1).forEach((d,i)=>mapRangeName.push("("+midleRange[i]+'-'+d+")"));
    mapRangeName.push("(>"+midleRange[midleRange.length-1]+")");
    return mapRangeName;
}
function position(d) {
    var v = dragging[d];
    return v == null ? xscale(d) : v;
}

// Handles a brush event, toggling the display of foreground lines.
function redraw(selected) {
    if (selected.length < data.length && selected.length > 0) {
        d3.select("#keep-data").attr("disabled", null);
        d3.select("#exclude-data").attr("disabled", null);
    } else {
        d3.select("#keep-data").attr("disabled", "disabled");
        d3.select("#exclude-data").attr("disabled", "disabled");
    }
    ;

    // total by food group
    var tallies = _(selected)
        .groupBy(function (d) {
            return d.group;
        });

    // include empty groups
    _(colors.domain()).each(function (v, k) {
        tallies[v] = tallies[v] || [];
    });


    // Render selected lines
    paths(selected, foreground, brush_count, true);
}

// TODO refactor
function brush() {
    var actives = [],
        extents = [];

    svg.selectAll(".brush")
        .filter(function(d) {
            yscale[d].brushSelectionValue = d3.brushSelection(this);
            return d3.brushSelection(this);
        })
        .each(function(d) {
            // Get extents of brush along each active selection axis (the Y axes)
            actives.push(d);
            extents.push(d3.brushSelection(this).map(yscale[d].invert).sort((a,b)=>a-b));
        });
    // hack to hide ticks beyond extent
    var b = d3.selectAll('.dimension').nodes()
        .forEach(function(element, i) {
            var dimension = d3.select(element).data()[0];
            if (_.includes(actives, dimension)) {
                var extent = extents[actives.indexOf(dimension)];
                d3.select(element)
                    .selectAll('text')
                    .style('font-weight', 'bold')
                    .style('font-size', '13px')
                    .style('display', function() {
                        var value = d3.select(this).data()[0];
                        return extent[0] <= value && value <= extent[1] ? null : "none"
                    });
            } else {
                d3.select(element)
                    .selectAll('text')
                    .style('font-size', null)
                    .style('font-weight', null)
                    .style('display', null);
            }
            d3.select(element)
                .selectAll('.label')
                .style('display', null);
        });
    ;

    // bold dimensions with label
    d3.selectAll('.label')
        .style("font-weight", function(dimension) {
            if (_.includes(actives, dimension)) return "bold";
            return null;
        });

    // Get lines within extents
    var selected = [];
    data.forEach(function(d) {
            if(!excluded_groups.find(e=>e===d.group))
                !actives.find(function(p, dimension) {
                    return extents[dimension][0] > d[p] || d[p] > extents[dimension][1];
                }) ? selected.push(d) : null;
        });
    // free text search
    var query = d3.select("#search").node().value;
    if (query.length > 0) {
        selected = search(selected, query);
    }

    if (selected.length < data.length && selected.length > 0) {
        d3.select("#keep-data").attr("disabled", null);
        d3.select("#exclude-data").attr("disabled", null);
    } else {
        d3.select("#keep-data").attr("disabled", "disabled");
        d3.select("#exclude-data").attr("disabled", "disabled");
    };

    // total by food group
    var tallies = _(selected)
        .groupBy(function(d) { return d.group; });

    // include empty groups
        _(colors.domain()).each(function(v,k) {tallies[v] = tallies[v] || []; });
    complex_data_table_render = true;
    redraw(selected);
    // Loadtostore();
}

// render a set of polylines on a canvas
let isChangeData=false;

function plotViolin() {
    selected = shuffled_data;
    let violin_w = Math.min(w/dimensions.length/(cluster_info.length||1),50);
    violiin_chart.graphicopt({width:violin_w*(cluster_info.length||1),height:h, single_w: Math.max(violin_w,50)});
    setTimeout(() => {
        let dimGlobal = [0, 0];
        let dimensiondata = {};
        dimensions.forEach(d => {
            let s = serviceFullList.find(s => s.text === d);
            let color = () => "#ffffff";
            if (s) {
                let value = [];
                if (cluster_info.length) {
                    let cs = {};
                    cluster_info.forEach((c, ci) => cs[ci] = []);
                    selected.forEach(e => cs[e.Cluster].push(e[d]));
                    value = cluster_info.map((c, ci) => axisHistogram(c.name, s.range, cs[ci]));
                    vMax = d3.max(value, d => d[1]);
                    dimGlobal[1] = Math.max(vMax, dimGlobal[1]);
                    color = colorCluster;
                } else {
                    value = [axisHistogram(s.text, s.range, selected.map(e => e[d]))];
                    vMax = d3.max(value[0], d => d[1]);
                    dimGlobal[1] = Math.max(vMax, dimGlobal[1]);
                }
                dimensiondata[d] = {key: s, value: value, color: color};

            }
        });
        d3.selectAll('.dimension').select('.plotHolder')
            .each(function (d) {
                if (dimensiondata[d]) {
                    let s = dimensiondata[d].key;
                    violiin_chart.graphicopt({
                        customrange: s.range,
                        rangeY: dimGlobal,
                        color: dimensiondata[d].color
                    }).data(dimensiondata[d].value).draw(d3.select(this))
                }
            })
    }, 0)
}

function paths(selectedRaw, ctx, count){
    shuffled_data = selectedRaw;
    let freeze = false;
    let selectData = selectedRaw;
    hide_ticks();
    width = Math.max(height/800*600/10*dimensions.length,$("#Maincontent").width());
    adjustsize();
    let keys = dimensions;
    let services = {};
    let serviceScale = {};
    const selecteds = serviceFullList_withExtra.find(e=>e.text===dimensions[0]);
    dimensions.forEach(d=>{
        services[d] = serviceFullList_withExtra.find(e=>e.text===d);
        if (!services[d].range)
            services[d].range = yscale[d].domain();
        if(services[d].color) {
            serviceScale[d] = services[d].color.copy();
            let range = serviceScale[d].domain();
            serviceScale[d].range(range).domain(d3.range(0,range.length))
        }else
            if (services[d].isString)
                serviceScale[d]= d3.scaleOrdinal().domain(d3.range(0,services[d].collection.length)).range(services[d].collection);
            else
                serviceScale[d]= d3.scaleQuantize().domain(services[d].range).range(d3.scaleLinear().domain(services[d].range).ticks(sankeyResolution));
    });
    let selected = selectedRaw.map(d=>{
        let temp = {};
        dimensions.forEach((k,i)=>{
            temp[k] = serviceScale[k](d[k]);
        });
        return temp;
    });
    let graph = (()=> {
        let index = -1;
        const nodes = [];
        const nodeByKey = new Map;
        const indexByKey = new Map;
        const links = [];

        for (const k of dimensions) {
            let nodes_key =[];
            for (const d of selected) {
                const key = JSON.stringify([k, d[k]]);
                if (nodeByKey.has(key)) continue;
                const node = {name: d[k]};
                nodes_key.push(node);
                nodeByKey.set(key, node);
            }
            nodes_key.sort((a,b)=>-a.name+b.name)
                .forEach(node=>{
                    const key = JSON.stringify([k, node.name]);
                    indexByKey.set(key, ++index);
                    nodes.push(node)
                })

        }
        for (let i = 1; i < keys.length; ++i) {
            const a = keys[i - 1];
            const b = keys[i];
            const prefix = keys.slice(0, i + 1);
            const linkByKey = new Map;
            for (const d of selected) {
                const names = prefix.map(k => d[k]);
                let nameIndex= indexByKey.get(JSON.stringify([keys[0], d[keys[0]]]))
                const key = [a,b].map(k=>d[k]).join('|')+nameIndex;
                const value = d.value || 1;
                let link = linkByKey.get(key);
                if (link) { link.value += value; continue; }
                link = {
                    source: indexByKey.get(JSON.stringify([a, d[a]])),
                    target:indexByKey.get(JSON.stringify([b, d[b]])),
                    nameIndex,
                    names,
                    value
                };
                links.push(link);
                linkByKey.set(key, link);
            }
        }
        links.sort((a,b)=>a.source-b.source);
        links.sort((a,b)=>a.target-b.target);
        links.sort((a,b)=>a.nameIndex-b.nameIndex);
        return {nodes, links};
    })();
    sankey = sankey
        // .nodeSort(null)
        .linkSort(null)
        .extent([[xscale(dimensions[0]), 0], [xscale(_.last(dimensions)), yscale[dimensions[0]].range()[0]]]);;
    const {nodes, links} = sankey({
        nodes: graph.nodes.map(d => Object.assign({}, d)),
        links: graph.links.map(d => Object.assign({}, d))
    });
    svg_paraset = svg.select('.paraset');
    if(svg_paraset.empty()){
        svg_paraset = svg.append('g').classed('paraset',true);
    }
    let node_g = svg_paraset.select('.nodes');
    if(node_g.empty()){
        node_g = svg_paraset.append('g').classed('nodes',true);
    }
    let node_p = node_g
        .selectAll("g")
        .data(nodes,d=>d.name)
        .join(
            enter => (e=enter.append("g"),e.append("title"),e.append("rect"),e.append("text"),e),
        ).attr('transform',d=>`translate(${d.x0},${d.y0})`).attr('class',d=>_.uniq(d.targetLinks.map(e=>`a${e.nameIndex}`)).join(' ')+' '+_.uniq(d.sourceLinks.map(e=>`a${e.nameIndex}`)).join(' '));
    node_p.select('rect')
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .style('fill',d=>d3.hsl(getColor(d.name,services[dimensions[d.layer]])).darker(2));
    node_p.select("title")
        .text(d => `${d.name}\n${d.value.toLocaleString()}`);
    node_p.select('text')
        .attr("x", d => d.x0 < width / 2 ? 6 :- 6)
        .attr("y", d => (d.y1 + d.y0) / 2-d.y0)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .text(d => d.name)
    let link_g = svg_paraset.select('.links');
    if(link_g.empty()){
        link_g = svg_paraset.append('g').classed('links',true);
    }

    let link_p = link_g
        .attr("fill", "none")
        .attr("opacity", 0.5)
        .selectAll("g")
        .data(links,d=>d)
        .join(
            enter => (e=enter.append("g").style("mix-blend-mode", "multiply"),e.append("path"),e.append("title"),e),
        );
    link_p.select('path')
        .attr('class',d=>'a'+d.nameIndex)
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d =>
        {
            return getColor(d.names[0]);
        })
        .attr("stroke-width", d => d.width)
        .call(action)
        .on('click',function(d){
            freeze = !freeze;
            if(freeze)
            {
                selectData = selectedRaw.filter((e,i)=>selected[i][dimensions[0]]===nodes[d.nameIndex].name);
                shuffled_data = selectData;
                complex_data_table_render = true;
                ctx.clearRect(0,0,w+1,h+1);
                // updateDataTableFiltered(shuffled_data);
            }else{
                selectData = selectedRaw;
                shuffled_data = selectData;
                complex_data_table_render = true;
                ctx.clearRect(0,0,w+1,h+1);
                // updateDataTableFiltered(shuffled_data);
            }
        })
        .each(function(d){d.dom=d3.select(this)});
    function getColor(d,s){
        s= s||selecteds;
        if(serviceScale[s.text].invert)
            return coloraxis[s.text](serviceScale[s.text].invert(d));
        else if(serviceScale[s.text].invertExtent){
            let r = serviceScale[s.text].invertExtent(d);
            return coloraxis[s.text]((r[0]+r[1])/2);
        }else{
            return coloraxis[s.text](d3.scaleOrdinal(serviceScale[s.text].range(),serviceScale[s.text].domain())(d));
        }
    }
    function action(p){
        return p.on('mouseover',d=>{
            if(!freeze) {
                link_p.select('path').classed('fade', true);
                node_g.selectAll("g").classed('fade', true);
                link_p.select(`path.a${d.nameIndex}`).classed('fade', false);
                node_g.selectAll(`g.a${d.nameIndex}`).classed('fade', false);
            }
        }).on('mouseleave',d=>!freeze?(link_p.select('path').classed('fade',false),node_g.selectAll("g").classed('fade', false)):null)
    }
    link_p
        .select("title")
        .text(d => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);
    shuffled_data = selectData;
    complex_data_table_render = true;
    ctx.clearRect(0,0,w+1,h+1);
    // updateDataTableFiltered(shuffled_data);
}

let isTick = true;
let axisPlot =  d3.select('#overlayPlot').on('change',function(){
    switch ($(this).val()){
        case 'none':
            d3.selectAll('.dimension .plotHolder').selectAll('*').remove();
            d3.select(this).on('plot',()=>{});
            hide_ticks();
            foreground_opacity = 1;
            break;
        case 'tick':
            d3.selectAll('.dimension .plotHolder').selectAll('*').remove();
            d3.select(this).on('plot',()=>{});
            show_ticks();
            foreground_opacity = 1;
            break;
        case 'violin':
            violiin_chart.graphicopt({isStack: false});
            d3.select(this).on('plot',plotViolin);
            hide_ticks();
            foreground_opacity=0.5;
            break;
        case 'violin+tick':
            violiin_chart.graphicopt({isStack: false});
            d3.select(this).on('plot',plotViolin);
            show_ticks();
            foreground_opacity=0.5;
            break;
        case 'stack':
            violiin_chart.graphicopt({isStack: true});
            d3.select(this).on('plot',plotViolin);
            hide_ticks();
            foreground_opacity=0.5;
            break;
        case 'stack+tick':
            violiin_chart.graphicopt({isStack: true});
            d3.select(this).on('plot',plotViolin);
            show_ticks();
            foreground_opacity=0.5;
            break;
    }
    d3.select(this).dispatch('plot');
    d3.select("#foreground").style("opacity", foreground_opacity);
});
let sankeyResolution = 5;
d3.select('#resolution').on('change',function(){
    sankeyResolution = +$(this).val();
    brush();
});
let timel
// transition ticks for reordering, rescaling and inverting
function update_ticks(d, extent) {
    // update brushes
    if (d) {
        var brush_el = d3.selectAll(".brush")
            .filter(function(key) { return key == d; });
        // single tick
        if (extent) {
            // restore previous extent
            console.log(extent);
            brush_el.call(yscale[d].brush = getBrush(d)).call(yscale[d].brush.move, extent.map(yscale[d]).sort((a,b)=>a-b));
        } else {
            brush_el.call(yscale[d].brush = getBrush(d));
        }
    } else {
        // all ticks
        d3.selectAll(".brush")
            .each(function(d) { d3.select(this).call(yscale[d].brush = getBrush(d)); })
    }
    if(isTick)
        show_ticks();

    // update axes
    d3.selectAll(".dimension .axis")
        .each(function(d,i) {
            // hide lines for better performance
            d3.select(this).selectAll('line').style("display", "none");

            // transition axis numbers
            d3.select(this)
                .transition()
                .duration(720)
                .call(getScale(d));

            // bring lines back
            d3.select(this).selectAll('line').transition().delay(800).style("display", null);

            d3.select(this)
                .selectAll('text')
                .style('font-weight', null)
                .style('font-size', null)
                .style('display', null);
        });
}

// Rescale to new dataset domain
function rescale() {
    // adjustRange(data);
    xscale.domain(dimensions = serviceFullList.filter(function (s) {
        let k = s.text;
        let xtempscale = (((_.isDate(data[0][k])) && (yscale[k] = d3.scaleTime()
            .domain(d3.extent(data, function (d) {
                return d[k];
            }))
            .range([h, 0])) || (_.isNumber(data[0][k])) && (yscale[k] = d3.scaleLinear()
            .domain(serviceFullList.find(d=>d.text===k).range)
            .range([h, 0]))));
        return s.enable?xtempscale:false;
    }).map(s=>s.text));
    update_ticks();
    // Render selected data
    paths(data, foreground, brush_count);
}

// Get polylines within extents
function actives() {
    var actives = [],
        extents = [];
    svg.selectAll(".brush")
        .filter(function(d) {
            yscale[d].brushSelectionValue = d3.brushSelection(this);
            return d3.brushSelection(this);
        })
        .each(function(d) {
            // Get extents of brush along each active selection axis (the Y axes)
            actives.push(d);
            extents.push(d3.brushSelection(this).map(yscale[d].invert).sort((a,b)=>a-b));
        });
    // filter extents and excluded groups
    var selected = [];
    data
        .forEach(function(d) {
            if(!excluded_groups.find(e=>e===d.group))
                !actives.find(function(p, dimension) {
                    return extents[dimension][0] > d[p] || d[p] > extents[dimension][1];
                }) ? selected.push(d) : null;
        });

    // free text search
    var query = d3.select("#search").node().value;
    if (query > 0) {
        selected = search(selected, query);
    }

    return selected;
}

// Export data
function export_csv() {
    var keys =  _.flatten([['id'],serviceFullList.map(s=>s.text)]);
    var rows = actives().map(function(row) {
        return keys.map(function(k) { return row[k]; })
    });
    keys[0]=IDkey;
    var csv = [keys].concat(rows).join('\n');
    download_csv($('#exportname').val(),csv)
}

function adjustsize() {
    w = width - m[1] - m[3];
    h = height - m[0] - m[2];
    sankey.extent([[m[1], m[0]], [w + m[1], h + m[0]]]);
    let chart = d3.select("#chart")
        .style("height", (h + m[0] + m[2]) + "px")

    chart.selectAll("canvas")
        .attr("width", w)
        .attr("height", h)
        .style("padding", m.join("px ") + "px");

    chart.select("svg")
        .attr("width", w + m[1] + m[3])
        .attr("height", h + m[0] + m[2])
        .select("g")
        .attr("transform", "translate(" + m[3] + "," + m[0] + ")");
    // Foreground canvas for primary view
    foreground.lineWidth = 1.7;
// Highlight canvas for temporary interactions
    highlighted.lineWidth = 4;

// Background canvas
    background.lineWidth = 1.7;

    xscale = d3.scalePoint().range([0, w]).padding(0.3).domain(dimensions);
    dimensions.forEach(function (d) {
        yscale[d].range([h, 0]);
    });

    d3.selectAll(".dimension")
        .attr("transform", function (d) {
            return "translate(" + xscale(d) + ")";
        });

    // update axis placement
    axis = axis.ticks(1 + height / 50),
        d3.selectAll(".dimension .axis")
            .each(function (d) {
                d3.select(this).call(getScale(d));
            });
}

function resetSize() {
    width = $("#Maincontent").width();
    height = d3.max([document.body.clientHeight-150, 300]);
    adjustsize();
    // update brush placement
    d3.selectAll(".brush")
        .each(function (d) {
            d3.select(this).call(yscale[d].brush = d3.brushY(yscale[d])
                .extent([[-10, 0], [10, h]])
                .on("brush", function(){isChangeData = true; brush(true);})
                .on("end", function(){isChangeData = true; brush();})
            );
        });


    // render data
    brush();
}

// scale to window size
window.onresize = function() {
    // animationtime = false;
    try {
        resetSize();
    }catch(e){}
};

// Remove all but selected from the dataset
function keep_data() {
    new_data = actives();
    if (new_data.length == 0) {
        alert("I don't mean to be rude, but I can't let you remove all the data.\n\nTry removing some brushes to get your data back. Then click 'Keep' when you've selected data you want to look closer at.");
        return false;
    }
    data = new_data;
    rescale();
}

// Exclude selected from the dataset
function exclude_data() {
    let new_data = _.difference(data, actives());
    if (new_data.length == 0) {
        alert("I don't mean to be rude, but I can't let you remove all the data.\n\nTry selecting just a few data points then clicking 'Exclude'.");
        return false;
    }
    data = new_data;
    rescale();
}
function adjustRange(data){
    let globalRange = [0,0];
    primaxis.forEach(p=>{
        let range = d3.extent(data,d=>d[p]);
        if (range[0]>=0 && range[1]>1&&range[1]>globalRange[1])
            globalRange[1]=range[1];
    });
    primaxis.forEach((p,pi)=>{
        if (range[0]>=0 && range[1])
            serviceFullList[pi].range = globalRange;
    })
}
function add_axis(d,g) {
    const target = serviceFullList_withExtra.find(e=>e.text===d)
    if(target) {
        // dimensions.splice(dimensions.length-1, 0, d);
        target.enable = true;
        dimensions.push(d);
        dimensions = _.intersection(listMetric.toArray(), dimensions);
        xscale.domain(dimensions);
        // g.attr("transform", function(p) { return "translate(" + position(p) + ")"; });
        updateDimension();
        update_ticks();
    }
}

function remove_axis(d,g) {
    const target = serviceFullList_withExtra.find(e=>e.text===d)

    target.enable = false;
    dimensions = _.difference(dimensions, [d]);
    xscale.domain(dimensions);
    g = g.data(dimensions, d => d);
    g.attr("transform", function (p) {return "translate(" + position(p) + ")";});
    g.exit().remove();
    update_ticks();
}

d3.select("#keep-data").on("click", keep_data);
d3.select("#exclude-data").on("click", exclude_data);
d3.select("#export-data").on("click", export_csv);
d3.select("#search").on("keyup", brush);


// Appearance toggles
d3.select("#hide-ticks").on("click", hide_ticks);
d3.select("#show-ticks").on("click", show_ticks);


function hide_ticks() {
    d3.selectAll(".dimension .axis g").style("display", "none");
    //d3.selectAll(".axis path").style("display", "none");
    d3.selectAll(".background").style("visibility", "hidden");
    d3.selectAll("#hide-ticks").attr("disabled", "disabled");
    d3.selectAll("#show-ticks").attr("disabled", null);
    isTick  =false;
};

function show_ticks() {
    d3.selectAll(".dimension .axis g").style("display", null);
    //d3.selectAll(".axis path").style("display", null);
    d3.selectAll(".background").style("visibility", null);
    d3.selectAll("#show-ticks").attr("disabled", "disabled");
    d3.selectAll("#hide-ticks").attr("disabled", null);
    isTick = true;
};

function search(selection,str) {
    const pattern = new RegExp(str,"i")
    return _(selection).filter(function(d) { return pattern.exec(d.name); });
}

function changeVar(d){
    // $('#groupName').text(d.text);
    if (d.arr==='rack'){
        selectedService = null;
        // svgLengend.style('display','none');
        d3.selectAll('.dimension.axisActive').classed('axisActive',false);
        changeGroupTarget(d.arr);
        //legend = create_legend(colors,brush);
    }else {
        try {
            legend.remove();
        }catch(e){}
        selectedService = d.arr;
        setColorsAndThresholds(d.service);
        changeGroupTarget(d.arr);
        //legend = drawLegend(d.service, arrThresholds, arrColor, dif);
        // svgLengend.style('display',null);
        d3.selectAll('.dimension.axisActive').classed('axisActive',false);
        d3.selectAll('.dimension').filter(e=>e===selectedService).classed('axisActive',true);
    }
}
function exit_warp (){
    if(timel){
        timel.stop();
        cluster_info = [];
        d3.select('#clusterDisplay').selectAll('*').remove();
    }
}

let clustercalWorker;
function recalculateCluster (option,calback,customCluster) {
    preloader(true,10,'Process grouping...','#clusterLoading');
    group_opt = option;
    distance = group_opt.normMethod==='l1'?distanceL1:distanceL2;
    if (clustercalWorker)
        clustercalWorker.terminate();
    clustercalWorker = new Worker ('../TimeRadar/src/script/worker/clustercal.js');
    clustercalWorker.postMessage({
        binopt:group_opt,
        sampleS:tsnedata,
        timeMax:sampleS.timespan.length,
        hosts:hosts,
        serviceFullList: serviceFullList,
        serviceLists:serviceLists,
        serviceList_selected:serviceList_selected,
        serviceListattr:serviceListattr,
        customCluster: customCluster // 1 25 2020 - Ngan
    });
    clustercalWorker.addEventListener('message',({data})=>{
        if (data.action==='done') {
            try {
                M.Toast.dismissAll();
            }catch(e){}
            cluster_info = data.result;
            if (!customCluster) {
                clusterDescription = {};
                recomendName(cluster_info);
            }else{
                let new_clusterDescription = {};
                cluster_info.forEach((d,i)=>{
                    new_clusterDescription[`group_${i+1}`] = {id:`group_${i+1}`,text:clusterDescription[d.name].text};
                    d.index = i;
                    d.labels = ''+i;
                    d.name = `group_${i+1}`;
                });
                clusterDescription = new_clusterDescription;
                updateclusterDescription();
            }
            recomendColor (cluster_info);
            updateColorsAndThresholds('Cluster')
            if (!calback) {
                cluster_map(cluster_info);
                handle_clusterinfo();
            }
            preloader(false, undefined, undefined, '#clusterLoading');
            clustercalWorker.terminate();
            if (calback)
                calback();
        }
        if (data.action==='returnData'){
            onloaddetermire({process:data.result.process,message:data.result.message},'#clusterLoading');
        }
    }, false);

}

function onchangeCluster() {
    unhighlight();
    cluster_info.forEach(d => (d.total=0,d.__metrics.forEach(e => (e.minval = undefined, e.maxval = undefined))));
    // tsnedata = {};
    hosts.forEach(h => {
        // tsnedata[h.name] = [];
        sampleS[h.name].arrcluster = sampleS.timespan.map((t, i) => {
            let nullkey = false;
            // let axis_arr = _.flatten(serviceLists.map(a => d3.range(0, a.sub.length).map(vi => (v = sampleS[h.name][serviceListattr[a.id]][i][vi], d3.scaleLinear().domain(a.sub[0].range)(v === null ? (nullkey = true, undefined) : v) || 0))));
            let axis_arr = tsnedata[h.name][i];
            // axis_arr.name = h.name;
            // axis_arr.timestep = i;
            // reduce time step
            if(axis_arr.outlier) {
                let outlierinstance = outlyingList.pointObject[h.name + '_' + i];
                if (outlierinstance) {
                    return outlierinstance.cluster;
                }
            }

            let index = 0;
            let minval = Infinity;
            cluster_info.forEach((c, i) => {
                const val = distance(c.__metrics.normalize, axis_arr);
                if (minval > val) {
                    index = i;
                    minval = val;
                }
            });
            cluster_info[index].total = 1 + cluster_info[index].total || 0;
            cluster_info[index].__metrics.forEach((m, i) => {
                if (m.minval === undefined || m.minval > axis_arr[i])
                    m.minval = axis_arr[i];
                if (m.maxval === undefined || m.maxval < axis_arr[i])
                    m.maxval = axis_arr[i];
            });
            // axis_arr.cluster = index;

            // timeline precalculate
            tsnedata[h.name][i].cluster = index;
            return index;
            // return cluster_info.findIndex(c=>distance(c.__metrics.normalize,axis_arr)<=c.radius);
        })
    });
    cluster_info.forEach(c => c.mse = ss.sum(c.__metrics.map(e => (e.maxval - e.minval) * (e.maxval - e.minval))));
    data = object2DataPrallel(sampleS);
    cluster_map(cluster_info);
    handle_clusterinfo();
    enableClusterAxis();
    axisPlot.dispatch('plot');
}
function enableClusterAxis(){
    let p = d3.select('#axisSetting tbody tr[data-id="Cluster"]').selectAll('td').filter(d => d.type === "checkbox").select('input');
    p.node().checked = true;
    selectedService = 'Cluster';
    const selecteds = d3.select("#axisSetting")
        .select('tbody')
        .selectAll('tr')
        .filter(d=>d.arr===selectedService).select('input[type="radio"]').property("checked", true);
    _.bind(selecteds.on("change"),selecteds.node())();
    p.dispatch('change');
}
let radarChartclusteropt  = {
    margin: {top: 0, right: 0, bottom: 0, left: 0},
    w: 180,
    h: 180,
    radiuschange: false,
    levels:6,
    dotRadius:2,
    strokeWidth:1,
    maxValue: 0.5,
    isNormalize:true,
    showHelperPoint: false,
    roundStrokes: true,
    ringStroke_width: 0.15,
    ringColor:'black',
    fillin:0.5,
    boxplot:true,
    animationDuration:1000,
    events:{
        axis: {
            mouseover: function(){
                try {
                    const d = d3.select(d3.event.detail || this).datum();
                    d3.selectAll('#clusterDisplay .axis' + d.idroot + '_' + d.id).classed('highlight', true);
                    d3.selectAll('#clusterDisplay .axisText').remove();
                    if (d3.select(this.parentNode).select('.axisText').empty())
                        d3.select(this.parentNode).append('text').attr('class','axisText').attr('transform','rotate(-90) translate(5,-5)');
                    d3.select(this.parentNode).select('.axisText').text(d.text);
                    $('.tablesvg').scrollTop($('table .axis' + d.idroot + '_' + d.id)[0].offsetTop);
                }catch(e){}
            },
            mouseleave: function(){
                const d = d3.select(d3.event.detail||this).datum();
                d3.selectAll('#clusterDisplay .axis'+d.idroot+'_'+d.id).classed('highlight',false);
                d3.selectAll('#clusterDisplay .axisText').remove();
            },
        },
    },
    showText: false};
function cluster_map (dataRaw) {
    radarChartclusteropt.schema = serviceFullList;
    let data = dataRaw.map((c,i)=>{
        let temp = c.__metrics.slice();
        temp.name = c.labels;
        temp.text = c.text;
        temp.total = c.total;
        temp.mse = c.mse;
        let temp_b = [temp];
        temp_b.id = c.name;
        temp_b.order = i;
        return temp_b;
    });
    let orderSimilarity = similarityCal(data);
    data.sort((a,b)=>( orderSimilarity.indexOf(a.order)-orderSimilarity.indexOf(b.order))).forEach((d,i)=>{
        d.order = i;
        dataRaw.find(c=>c.name===d.id).orderG = i;
    });
    //--shoudn't here
    dataRaw.forEach(c=>{
        let matchitem = data.find(d=>d.id===c.name);
        // c.text = c.text.replace(`Group ${c.index+1}`,`Group ${matchitem.order+1}`);
        matchitem[0].text =  c.text;
    });
    data.forEach(d=>d[0].name = dataRaw.find(c=>d.id===c.name).text);
    //--end
    let dir = d3.select('#clusterDisplay');
    setTimeout(()=>{
        let r_old = dir.selectAll('.radarCluster').data(data,d=>d.id).order();
        r_old.exit().remove();
        let r_new = r_old.enter().append('div').attr('class','radarCluster')
            .on('mouseover',function(d){
                // if (!jobMap.runopt().mouse.disable) {
                //     mainviz.highlight(d.id);
                // }
                d3.select(this).classed('focus',true);
            }).on('mouseleave',function(d){
                // if (!jobMap.runopt().mouse.disable) {
                //     mainviz.unhighlight(d.id);
                // }
                d3.select(this).classed('focus',false);
            })
            .append('div')
            .attr('class','label')
            .styles({'position':'absolute',
                'color':'black',
                'width': radarChartclusteropt.w+'px',
                height: '1rem',
                padding: '10px'
                // overflow: 'hidden',
            });
        // r_new.append('span').attr('class','clusterlabel truncate center-align col s12');
        r_new.append('i').attr('class','editbtn material-icons tiny col s1').style('cursor', 'Pointer').text('edit').on('click',function(){
            let active = d3.select(this).classed('clicked');
            active = !active;
            d3.select(this).classed('clicked',active);
            const parent = d3.select(this.parentNode);
            parent.select('span.clusterlabel').classed('hide',active);
            parent.select('input.clusterlabel').classed('hide',!active);
        });
        r_new.append('span').attrs({'class':'clusterlabel truncate left-align col s11','type':'text'});
        r_new.append('input').attrs({'class':'clusterlabel browser-default hide truncate center-align col s11','type':'text'}).on('change',function(d){
            clusterDescription[d.id].text = $(this).val();
            d3.select(this).classed('hide',true);
            const parent = d3.select(this.parentNode);
            parent.select('.editbtn').classed('clicked',false);
            parent.select('span.clusterlabel').text(clusterDescription[d.id].text).classed('hide',false);
            updateclusterDescription(d.id,clusterDescription[d.id].text);
        });
        r_new.append('span').attr('class','clusternum center-align col s12');
        r_new.append('span').attr('class','clusterMSE center-align col s12');
        dir.selectAll('.radarCluster')
            .attr('class',(d,i)=>'flex_col valign-wrapper radarCluster radarh'+d.id)
            .style('position','relative')
            .each(function(d,i){
                radarChartclusteropt.color = function(){return colorCluster(d.id)};
                RadarChart(".radarh"+d.id, d, radarChartclusteropt,"").classed('no-absolute',true).select('.axisWrapper .gridCircle').classed('hide',true);
            });
        d3.selectAll('.radarCluster').classed('first',(d,i)=>!i);
        d3.selectAll('.radarCluster').select('span.clusterlabel').attr('data-order',d=>d.order+1).text(d=>d[0].text);
        d3.selectAll('.radarCluster').select('input.clusterlabel').attr('value',d=>d[0].text).each(function(d){$(this).val(d[0].text)});
        d3.selectAll('.radarCluster').select('span.clusternum').text(d=>(d[0].total||0).toLocaleString());
        d3.selectAll('.radarCluster').select('span.clusterMSE').classed('hide',!radarChartclusteropt.boxplot).text(d=>d3.format(".2")(d[0].mse||0));

        listOption.find(d=>d.text==='Cluster').tableObj.classed('hide',false);
        yscale["Cluster"].domain([0,cluster_info.length-1]);
        yscale["Cluster"].axisCustom.ticks = cluster_info.length;
    }, 0);
    // outlier_map(outlyingList)
}

// violin
let violiin_chart = d3.viiolinChart().graphicopt({width:160,height:25,opt:{dataformated:true},stroke:'white',isStack:false,midleTick:false,tick:false,showOutlier:false,direction:'v',margin: {top: 0, right: 0, bottom: 0, left: 0},middleAxis:{'stroke-width':0},ticks:{'stroke-width':0.5},tick:{visibile:false}});;
