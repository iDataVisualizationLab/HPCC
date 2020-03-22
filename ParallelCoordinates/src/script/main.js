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
    background,
    highlighted,
    dimensions,
    legend,
    render_speed = 50,
    brush_count = 0,
    excluded_groups = [],
    svg,g,listMetric;


//legend prt
var arrColor = ['#000066','#0000ff', '#1a9850', '#ddee00','#ffcc44', '#ff0000', '#660000'];
var levelStep = 4;
var arrThresholds;
var selectedService = "CPU1 Temp";
var orderLegend;
var svgLengend;
//read file
// var serviceList = ["Temperature","Job_load","Memory_usage","Fans_speed","Power_consum"];
// var serviceLists = [{text: "Temperature", id: 0, enable:true,
//     sub:[{text: 'CPU1 Temp', id: 0, enable:true},{text: 'CPU2 Temp', id: 1, enable:true},{text: 'Inlet Temp', id: 2, enable:true}]},
//     {text: "Job_load", id: 1, enable:true ,sub:[{text: 'Job load', id: 0, enable:true}]},
//     {text: "Memory_usage", id: 2 , enable:true ,sub:[{text: 'Memory usage', id: 0, enable:true}]},
//     {text: "Fans_speed", id: 3 , enable:true ,sub:[{text: 'Fan1 speed', id: 0, enable:true},{text: 'Fan2 speed', id: 1, enable:true},{text: 'Fan3 speed', id: 2, enable:true},{text: 'Fan4 speed', id: 3, enable:true}]},
//     {text: "Power_consum", id: 4 , enable:true ,sub:[{text: 'Power consumption', id: 0, enable:true}]}];
// var serviceListattr = ["arrTemperature","arrCPU_load","arrMemory_usage","arrFans_health","arrPower_usage"];
// var serviceListattrnest = [
//     {key:"arrTemperature", sub:["CPU1 Temp","CPU2 Temp","Inlet Temp"]},
//     {key:"arrCPU_load", sub:["Job load"]},
//     {key:"arrMemory_usage", sub:["Memory usage"]},
//     {key:"arrFans_health", sub:["Fan1 speed","Fan2 speed","Fan3 speed","Fan4 speed"]},
//     {key:"arrPower_usage", sub:["Power consumption"]}];
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

function drawFiltertable() {
    let listOption = d3.merge(conf.serviceLists.map(d => d.sub.map(e => {
        return {service: e.text, arr: conf.serviceListattrnest[d.id].sub[e.id], text: e.text, enable: e.enable}
    })));
    // listOption.push({service: 'Rack', arr:'rack', text:'Rack'});
    let table = d3.select("#axisSetting").select('tbody');
    table
        .selectAll('tr').data(listOption)
        .join(enter => {
            const tr = enter.append("tr");
            tr.attr('data-id', d => d.arr);
            const alltr = tr.selectAll('td')
                .data(d => [{key: 'enable', value: d.enable, type: "checkbox"}, {
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
                changeVar(d3.select(this.parentElement.parentElement).datum())
            });
            alltr.filter(d => d.type === "checkbox")
                .append("input")
                .attrs(function (d, i) {
                    return {
                        type: "checkbox",
                        checked: d.value ? "checked" : null
                    }
                }).on('change', function (d) {
                filterAxisbyDom.call(this, d);


                xscale.domain(dimensions);

                // reorder list
                // const disable_dims = _.difference(listMetric.toArray(),dimensions);
                // listMetric.sort(_.union(dimensions,disable_dims));

                // rerender
                d3.select("#foreground").style("opacity", null);
                brush();
            });
            alltr.filter(d => d.type === undefined)
                .text(d => d.value);
        }, update =>{
                const tr = update;
                tr.attr('data-id', d => d.arr);
                const alltr = tr.selectAll('td')
                    .data(d => [{key: 'enable', value: d.enable, type: "checkbox"}, {
                        key: 'colorBy',
                        value: false,
                        type: "radio"
                    }, {key: 'text', value: d.text}]);
                alltr.filter(d => d.type === undefined)
                    .text(d => d.value);
            }
            );
    // comboBox
    //     .selectAll('li').data(listOption)
    //     .join(enter => enter.append("li") .attr('tabindex','0').append("a")
    //         .attr('href',"#"))
    //     .text(d=>{return d.text})
    //     .on('click',changeVar);
    // $('tbody').sortable();
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
            const chosenAxis = svg.selectAll(".dimension").filter(d => d == currentAxis.arr);


            d3.event = {};
            // d3.event.dx = originalEvent.clientY - this.pre; // simulate the drag behavior
            d3.event.dx = position(relatedtAxis.arr) - position(currentAxis.arr); // simulate the drag behavior
            d3.event.dx = d3.event.dx + ((d3.event.dx > 0) ? 1 : -1);
            if (!isNaN(d3.event.dx))
                _.bind(dragged, chosenAxis.node(), chosenAxis.datum())();

        }
    });
}
function filterAxisbyDom(d) {
    const pdata = d3.select(this.parentElement.parentElement).datum();
    d.value = this.checked;
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
$( document ).ready(function() {
    console.log('ready');
    $('.tabs').tabs();
    $('.dropdown-trigger').dropdown();
    $('.sidenav').sidenav();
    $('.collapsible').collapsible();
    discovery('#sideNavbtn');
    //$('.tap-target').tapTarget({onOpen: discovery});

    // let comboBox = d3.select("#listvar");
    d3.select("#DarkTheme").on("click",switchTheme);

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
    d3.select("#foreground").style("opacity", null);
    brush();
    delete this.__dragged__;
    delete this.__origin__;
    delete dragging[d];
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

function update_Dimension() {
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
                    return d3.select(this).call(axis.scale(yscale[d]));
                })
                .append("svg:text")
                .attr("text-anchor", "middle")
                // .attr("y", function(d,i) { return i%2 == 0 ? -14 : -30 } )
                .attr("y", -14)
                .attr("x", 0)
                .attr("class", "label")
                .text(String)
                .append("title")
                .text("Click to invert. Drag to reorder");

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
                // Add an axis and title.
                update.select(".axis")
                    .attr("transform", "translate(0,0)")
                    .each(function (d) {
                        return d3.select(this).call(axis.scale(yscale[d]));
                    });
            return  update.attr("transform", function (d) {
                return "translate(" + xscale(d) + ")";});
            });
}

function init() {
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

// Load the data and visualization

    // Convert quantitative scales to floats
    data = object2DataPrallel(sampleS);

    // Extract the list of numerical dimensions and create a scale for each.
    xscale.domain(dimensions =_.flatten([{text:'Time',enable:true},serviceFullList]).filter(function (s) {
        let k = s.text;
        let xtempscale = (((_.isDate(data[0][k])) && (yscale[k] = d3.scaleTime()
            .domain(d3.extent(data, function (d) {
                return d[k];
            }))
            .range([h, 0])) || (_.isNumber(data[0][k])) && (yscale[k] = d3.scaleLinear()
            .domain(d3.extent(data, function (d) {
                return +d[k];
            }))
            .range([h, 0]))));
        return s.enable?xtempscale:false;
    }).map(s=>s.text));

    d3.select('#search').attr('placeholder',`Search host e.g ${data[0].compute}`);
    // Add a group element for each dimension.
    update_Dimension();


    // legend = create_legend(colors, brush);
    if (!serviceFullList.find(d=>d.text===selectedService))
        selectedService = serviceFullList[0].text;
    const selecteds = d3.select("#axisSetting")
        .select('tbody')
        .selectAll('tr')
        .filter(d=>d.arr==selectedService).select('input[type="radio"]').property("checked", true);
    _.bind(selecteds.on("change"),selecteds.node())();

    // changeVar(d3.select("#axisSetting").selectAll('tr').data().find(d=>d.arr==selectedService));
    // Render full foreground
    // brush();
    console.log('---init---');
}

function resetRequest() {
    // Convert quantitative scales to floats
    // animationtime = false;
    data = object2DataPrallel(sampleS);
    xscale.domain(dimensions = _.flatten([{text:'Time',enable:true},serviceFullList]).filter(function (s) {
        let k = s.text;
        let xtempscale = (((_.isDate(data[0][k])) && (yscale[k] = d3.scaleTime()
            .domain(d3.extent(data, function (d) {
                return d[k];
            }))
            .range([h, 0])) || (_.isNumber(data[0][k])) && (yscale[k] = d3.scaleLinear()
            .domain(d3.extent(data, function (d) {
                return +d[k];
            }))
            .range([h, 0]))));
        return s.enable?xtempscale:false;
    }).map(s=>s.text));

    d3.select('#search').attr('placeholder',`Search host e.g ${data[0].compute}`);

    // Add a group element for each dimension.
    update_Dimension();
    if (!serviceFullList.find(d=>d.text===selectedService))
        selectedService = serviceFullList[0].text();
    const selecteds = d3.select("#axisSetting")
        .select('tbody')
        .selectAll('tr')
        .filter(d=>d.arr==selectedService).select('input[type="radio"]').property("checked", true);
    _.bind(selecteds.on("change"),selecteds.node())();
}
function setColorsAndThresholds(sin) {
    let s = serviceFullList.find(d=>d.text===sin)
    const dif = (s.range[1]-s.range[0])/levelStep;
    const mid = s.range[0]+(s.range[1]-s.range[0])/2;
    let left = s.range[0]-dif;
    arrThresholds = [left,s.range[0], s.range[0]+dif, s.range[0]+2*dif, s.range[0]+3*dif, s.range[1], s.range[1]+dif];
    color = d3.scaleLinear()
        .domain(arrThresholds)
        .range(arrColor)
        .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
    opa = d3.scaleLinear()
        .domain([left,s.range[0],mid, s.range[1], s.range[1]+dif])
        .range([1,1,0.1,1,1]);

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
function complex_data_table(sample) {
    var samplenest = d3.nest()
        .key(d=>d.rack).sortKeys(collator.compare)
        .key(d=>d.compute).sortKeys(collator.compare)
        .sortValues((a,b)=>a.Time-b.Time)
        .entries(sample);
    d3.select("#compute-list").html('');
    var table = d3.select("#compute-list")
        .attr('class','collapsible rack')
        .selectAll("li")
        .data(samplenest,d=>d.value);
    var ulAll = table.join(
        enter=>{
            let lir = enter.append("li") .attr('class','rack');
            lir.append('div')
                .attr('class','collapsible-header')
                .text(d=>d.key);
            const lic =  lir.append('div')
                .attr('class','collapsible-body')
                .append('div')
                .attr('class','row marginBottom0')
                .append('div')
                .attr('class','col s12 m12')
                .append('ul')
                .attr('class','collapsible compute')
                .datum(d=> d.values)
                .selectAll('li').data(d=>d)
                .enter()
                .append('li').attr('class','compute');
            lic.append('div')
                .attr('class','collapsible-header')
                .text(d=>d.key);
            const lit = lic
                .append('div')
                .attr('class','collapsible-body')
                .append('div')
                .attr('class','row marginBottom0')
                .append('div')
                .attr('class','col s12 m12')
                .append('ul')
                .datum(d=> d.values)
                .selectAll('li').data(d=>d)
                .enter()
                .append('li').attr('class','comtime')
                .on("mouseover", highlight)
                .on("mouseout", unhighlight);

            lit.append("span")
                .attr("class", "color-block")
                .style("background", function(d) { return color(selectedService==null?d.group:d[selectedService]) })
                .style("opacity",0.85);
            lit.append("span")
                .text(function(d) { return d3.timeFormat("%B %d %Y %H:%M")(d.Time); });

            return lir;
        }
    )
    $('.collapsible').collapsible();

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
    d3.select("#foreground").style("opacity", null);
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
            if (_.include(actives, dimension)) {
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
            if (_.include(actives, dimension)) return "bold";
            return null;
        });

    // Get lines within extents
    var selected = [];
    data
        .filter(function(d) {
            return !_.contains(excluded_groups, d.group);
        })
        .map(function(d) {
            return actives.every(function(p, dimension) {
                return extents[dimension][0] <= d[p] && d[p] <= extents[dimension][1];
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

    /*
    legend
        .style("text-decoration", function(d) { return _.contains(excluded_groups,d) ? "line-through" : null; })
        .attr("class", function(d) {
            return (tallies[d].length > 0)
                ? "row"
                : "row off";
        });
    barScale.domain([0,data.length]);
    if (selectedService){
        legend.selectAll(".color-bar")
            .style("width", function(d) {
                return Math.ceil((barScale(tallies[d].length)));
            });

        legend.selectAll(".tally")
            .text(function(d,i) { return tallies[d].length });
    }else {
        legend.selectAll(".color-bar")
            .style("width", function(d) {
                return Math.ceil((barScale(tallies[d].length))) + "px";
            });

        legend.selectAll(".tally")
            .text(function(d,i) { return tallies[d].length });
    }*/

    // Render selected lines
    paths(selected, foreground, brush_count, true);
    // Loadtostore();
}

// render a set of polylines on a canvas
function paths(selected, ctx, count) {
    setTimeout(function(){
        var n = selected.length,
            i = 0,
            opacity = d3.min([2/Math.pow(n,0.3),1]),
            timer = (new Date()).getTime();

        selection_stats(opacity, n, data.length);

        //shuffled_data = _.shuffle(selected);

        // complex_data_table(shuffled_data.slice(0,20));
        shuffled_data = selected;
        complex_data_table(shuffled_data);

        ctx.clearRect(0,0,w+1,h+1);

        // render all lines until finished or a new brush event
        function animloop(){
            if (i >= n || count < brush_count) {
                timel.stop();
                return true;
            }
            var max = d3.min([i+render_speed, n]);
            render_range(shuffled_data, i, max, opacity);
            render_stats(max,n,render_speed);
            i = max;
            timer = optimize(timer);  // adjusts render_speed
        };
        if (timel)
            timel.stop();
        timel = d3.timer(animloop);
    },0);
}
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

    show_ticks();

    // update axes
    d3.selectAll(".axis")
        .each(function(d,i) {
            // hide lines for better performance
            d3.select(this).selectAll('line').style("display", "none");

            // transition axis numbers
            d3.select(this)
                .transition()
                .duration(720)
                .call(axis.scale(yscale[d]));

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
    // reset yscales, preserving inverted state
    dimensions.forEach(function(d,i) {
        if (yscale[d].inverted) {
            yscale[d] = d3.scaleLinear()
                .domain(d3.extent(data, function(p) { return +p[d]; }))
                .range([0, h]);
            yscale[d].inverted = true;
        } else {
            yscale[d] = d3.scaleLinear()
                .domain(d3.extent(data, function(p) { return +p[d]; }))
                .range([h, 0]);
        }
    });

    update_ticks();

    // Render selected data
    paths(data, foreground, brush_count);
}

// Get polylines within extents
function actives() {
    // var actives = dimensions.filter(function(p) { return !yscale[p].brush.empty(); }),
    //     extents = actives.map(function(p) { return yscale[p].brush.extent(); });
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
            extents.push(d3.brushSelection(this).map(yscale[d].invert));
        });
    // filter extents and excluded groups
    var selected = [];
    data
        .filter(function(d) {
            return !_.contains(excluded_groups, d.group);
        })
        .map(function(d) {
            return actives.every(function(p, i) {
                return extents[i][0] <= d[p] && d[p] <= extents[i][1];
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
    var keys = d3.keys(data[0]);
    var rows = actives().map(function(row) {
        return keys.map(function(k) { return row[k]; })
    });
    var csv = d3.csv.format([keys].concat(rows)).replace(/\n/g,"<br/>\n");
    var styles = "<style>body { font-family: sans-serif; font-size: 12px; }</style>";
    window.open("text/csv").document.write(styles + csv);
}

function resetSize() {
    width = $("#Maincontent").width();
    height = d3.max([document.body.clientHeight-150, 300]);
    w = width - m[1] - m[3];
    h = height - m[0] - m[2];

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
    // update brush placement
    d3.selectAll(".brush")
        .each(function (d) {
            d3.select(this).call(yscale[d].brush = d3.brushY(yscale[d])
                .extent([[-10, 0], [10, h]])
                .on("brush end", brush));
        });

    // update axis placement
    axis = axis.ticks(1 + height / 50),
        d3.selectAll(".axis")
            .each(function (d) {
                d3.select(this).call(axis.scale(yscale[d]));
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
    new_data = _.difference(data, actives());
    if (new_data.length == 0) {
        alert("I don't mean to be rude, but I can't let you remove all the data.\n\nTry selecting just a few data points then clicking 'Exclude'.");
        return false;
    }
    data = new_data;
    rescale();
}

function add_axis(d,g) {
    // dimensions.splice(dimensions.length-1, 0, d);
    dimensions.push(d);
    dimensions = _.intersection(_.union(['Time'],listMetric.toArray()),dimensions)    ;
    xscale.domain(dimensions);
    // g.attr("transform", function(p) { return "translate(" + position(p) + ")"; });
    update_Dimension();
    // update_ticks();
}

function remove_axis(d,g) {
    dimensions = _.difference(dimensions, [d]);
    xscale.domain(dimensions);
    g = g.data(dimensions,d=>d);
    g.attr("transform", function(p) { return "translate(" + position(p) + ")"; });
    g.exit().remove();
    // update_ticks();
}

d3.select("#keep-data").on("click", keep_data);
d3.select("#exclude-data").on("click", exclude_data);
d3.select("#export-data").on("click", export_csv);
d3.select("#search").on("keyup", brush);


// Appearance toggles
d3.select("#hide-ticks").on("click", hide_ticks);
d3.select("#show-ticks").on("click", show_ticks);


function hide_ticks() {
    d3.selectAll(".axis g").style("display", "none");
    //d3.selectAll(".axis path").style("display", "none");
    d3.selectAll(".background").style("visibility", "hidden");
    d3.selectAll("#hide-ticks").attr("disabled", "disabled");
    d3.selectAll("#show-ticks").attr("disabled", null);
};

function show_ticks() {
    d3.selectAll(".axis g").style("display", null);
    //d3.selectAll(".axis path").style("display", null);
    d3.selectAll(".background").style("visibility", null);
    d3.selectAll("#show-ticks").attr("disabled", "disabled");
    d3.selectAll("#hide-ticks").attr("disabled", null);
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
    brush();
}
function exit_warp (){}