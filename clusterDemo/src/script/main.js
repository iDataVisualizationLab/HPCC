/* Copyright 2019 Tommy Dang and Ngan V.T. Nguyen
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var TsnePlotopt  = {

    radaropt : {
        // summary:{quantile:true},
        mini:true,
        levels:6,
        gradient:true,
        w:30,
        h:30,
        showText:false,
        margin: {top: 0, right: 0, bottom: 0, left: 0},
    },
    top10:{
        details :{
            circle: {
                attr: {
                    r : 2,
                },
                style: {
                    opacity: 0.2
                }
            },
            path: {
                style: {
                    'stroke': 'black',
                    'stroke-width': 0.5,
                }
            },
            clulster: {
                attr: {
                }
                ,
                style: {
                    stroke: 'white'
                }
            }
        }
    },
    runopt:{
        zoom:30,
        simDuration: 1000,
        clusterDisplay: 'alpha',
        clusterProject: 'bin',
        displayMode: 'tsne',

    }
};
let graphicControl ={
    charType : "Area Chart",
    sumType : "Radar",
    table: true,
    mode:'label',
    modes:['label','maxValue','similarity','pca','pca2D'],
},
    colorScaleList = {
    n: 7,
    rainbow: ["#000066", "#4400ff", "#00ddff", "#00ddaa", "#00dd00", "#aadd00", "#ffcc00", "#ff8800", "#ff0000", "#660000"],
    soil: ["#2244AA","#4A8FC2", "#76A5B1", "#9DBCA2", "#C3D392", "#F8E571", "#F2B659", "#eb6424", "#D63128", "#660000"],
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
            if (typeof (d3[`scheme${name}`][0]) != 'string') {
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
        {val: 'soil',type:'custom',label: 'RedYelBlu'},],
    Cluster: [{val: 'Category10',type:'d3',label: 'D3'},{val: 'Paired',type:'d3',label: 'Blue2Red'}]};
var MetricController = radarController();
let svg;
let MainOpt  = {
    margin: {top: 5, right: 0, bottom: 10, left: 0},
    width: 1000,
    height: 600,
    scalezoom: 1,
    widthView: function(){return this.width*this.scalezoom},
    heightView: function(){return this.height*this.scalezoom},
    widthG: function(){return this.widthView()-this.margin.left-this.margin.right},
    heightG: function(){return this.heightView()-this.margin.top-this.margin.bottom},
};
// START: loader spinner settings ****************************
let spinnerOb = {
    spinner:undefined,
    opts : {
        lines: 25, // The number of lines to draw
        length: 15, // The length of each line
        width: 5, // The line thickness
        radius: 25, // The radius of the inner circle
        color: '#f00', // #rgb or #rrggbb or array of colors
        speed: 2, // Rounds per second
        trail: 50, // Afterglow percentage
        className: 'spinner', // The CSS class to assign to the spinner
    },
    target: document.getElementById('loadingSpinner')
}
// END: loader spinner settings ****************************
let initialService;


$( document ).ready(function() {
    console.log('ready');
    $('.fixed-action-btn').floatingActionButton({
        direction: 'left',
        hoverEnabled: false
    });
    var array_of_dom_elements = document.querySelectorAll("input[type=range]");
    M.Range.init(array_of_dom_elements);
    $('#radarzoom').on('change',function(){updateRdarSize(this)}).on('input',function(){
        $('#radarzoomdisplay').text(this.value)})
    $('.collapsible').collapsible();
    $('.modal:not("#radar_Des_div")').modal();
    $("#radar_Des_div").modal({
        onOpenEnd:  radarDes.update,
    });
    $('.dropdown-trigger').dropdown();
    $('.tabs').tabs();
    $('.sidenav').sidenav();
    initgraphic ();
    $('#radarzoom').val(radarChartclusteropt.w);
    $('#radarzoomdisplay').text(Math.round(radarChartclusteropt.w));

    d3.select('#dragChart').call(d3.drag().container(function(){return this.parentNode.parentNode;}).on("drag", function () {
        d3.select('.sumdrag')
            .styles({"left": d3.event.x+'px',"top": d3.event.y+'px'});
    }));
    discovery('#sideNavbtn');
    //$('.tap-target').tapTarget({onOpen: discovery});

    d3.select("#DarkTheme").on("click",switchTheme);
    changeRadarColor(colorArr.Radar[0]);
    // color scale create
    creatContain(d3.select('#RadarColor').select('.collapsible-body>.pickercontain'), colorScaleList, colorArr.Radar, onClickRadarColor);

    d3.select('#datacom').on("change", function () {
        firstTime = true
        d3.select('.cover').classed('hidden', false);
        spinnerOb.spinner.spin(spinnerOb.target);
        const choice = this.value;
        const choicetext = d3.select('#datacom').node().selectedOptions[0].text;
        d3.select('#sortorder').interrupt();
        if (choice!=='csv') {
            oldchoose=$('#datacom').val();
            setTimeout(() => {
                d3.csv("src/data/" + choice + ".csv", function (error, data) {
                    if (error) {
                        M.toast({html: 'Local data does not exist, try to query from the internet!'})
                        d3.csv("src/data/" + d3.select('#datacom').node().value + ".csv", function (error, data) {
                            if (error) {

                            }
                            loadata1(data)
                        });
                        return;
                    }
                    loadata1(data)
                });
            }, 0);
        }else{
            d3.select('.cover').classed('hidden', true);
            spinnerOb.spinner.stop();
            $('#datacom').val(oldchoose);
            $('#data_input_file').trigger('click');
        }
        function loadata1(data){
              newdatatoFormat_cluster(data);
            radarChartclusteropt.boxplot = false;

            processResult = processResult_csv;
            db = "csv";
            // addDatasetsOptions();
            MetricController.axisSchema(serviceFullList, true).update();
            main();
            // d3.select(".currentDate")
            //     .text("" + new Date(data[0].timestamp).toDateString());
            // resetRequest();
            d3.select('.cover').classed('hidden', true);
            spinnerOb.spinner.stop();

        }
    });
    $('#description_input_file').on('input',(evt)=>{
        let f = evt.target.files[0];
        var reader = new FileReader();
        reader.onload = (function (theFile) {
            return function (e) {
                d3.json(e.target.result, function (error, data) {
                    if (error) {
                    } else {
                        clusterDescription = data;
                        d3.selectAll('.desciptionText').text(function(d){return clusterDescription[d.id].text})
                    }
                });
            };
        })(f);

        reader.readAsDataURL(f);
    });
    $('#saveDescriptionbtn').on('click',()=>$('#description_input_file').trigger('click'));
    $('#data_input_file').on('click',()=>{d3.select('.cover').classed('hidden', true);
        spinnerOb.spinner.stop();})
    $('#data_input_file').on('input', (evt) => {
        firstTime = true;
        let f,fq1,fq3,fmin,fmax;
        let n = evt.target.files.length;
        d3.range(0,n).forEach(i=>{
            let d = evt.target.files[i];
            if (new RegExp(filename_pattern[0].value).test(d.name))
                f = d;
            else if (new RegExp(filename_pattern[1].value).test(d.name))
                fq1 = d;
            else if (new RegExp(filename_pattern[2].value).test(d.name))
                fq3 = d;
            else if (new RegExp(filename_pattern[3].value).test(d.name))
                fmax = d;
            else if (new RegExp(filename_pattern[4].value).test(d.name))
                fmin = d;
        });
        // let f = evt.target.files.find(d=>new RegExp(filename_pattern[0].value).test(d.name));
        // let fq1 = evt.target.files.find(d=>new RegExp(filename_pattern[1].value).test(d.name));
        // let fq3 = evt.target.files.find(d=>new RegExp(filename_pattern[2].value).test(d.name));
        // let fmax = evt.target.files.find(d=>new RegExp(filename_pattern[3].value).test(d.name));
        // let fmin = evt.target.files.find(d=>new RegExp(filename_pattern[4].value).test(d.name));
        if(evt.target.files.length===1)
            f = evt.target.files[0];


        readf(f,filreadFunc,'value');

        function readf(f,callback,type,callbacknext) {
            var reader = new FileReader();
            reader.onload = (function (theFile) {
                return function (e) {
                    // Render thumbnail.
                    d3.select('.cover').classed('hidden', false);
                    spinnerOb.spinner.spin(spinnerOb.target);
                    callback(e,type,callbacknext);
                };
            })(f);

            reader.readAsDataURL(f);
        }
        function filreadFunc(e,type,callbacknext) {
            setTimeout(() => {
                d3.csv(e.target.result, function (error, data) {
                    if (error) {
                        d3.select('.cover').classed('hidden', true);
                        spinnerOb.spinner.stop();
                    } else {
                        loadata1(data);
                        if(callbacknext)
                            callbacknext(true);
                        function loadata1(data) {
                            newdatatoFormat_cluster(data);
                            let q = d3.queue();
                            if (n>1) {
                                radarChartclusteropt.boxplot = true;
                                if (fmin)
                                    q.defer(readf,fq1,filreadAlternative,'q1');
                                if (fmax)
                                    q.defer(readf,fq3,filreadAlternative,'q3');
                                if (fq1)
                                    q.defer(readf,fmin,filreadAlternative,'minval');
                                if (fq3)
                                    q.defer(readf,fmax,filreadAlternative,'maxval');
                            }else{
                                radarChartclusteropt.boxplot = false;
                            }
                            q.awaitAll(function (error, data) {
                                if (error) throw error;
                                console.log('done read batch file');
                                processResult = processResult_csv;
                                db = "csv";
                                // addDatasetsOptions();
                                MetricController.axisSchema(serviceFullList, true).update();
                                main();
                                // d3.select(".currentDate")
                                //     .text("" + new Date(data[0].timestamp).toDateString());
                                // resetRequest();
                                d3.select('.cover').classed('hidden', true);
                                spinnerOb.spinner.stop();
                            });

                        }
                    }
                })
            }, 0);
        }

        function filreadAlternative(e,type,callbacknext){
            d3.csv(e.target.result, function (error, data) {
                if (error) {
                    d3.select('.cover').classed('hidden', true);
                    spinnerOb.spinner.stop();
                } else {
                    loadata1(data,type);
                    callbacknext(null)
                    function loadata1(data,type) {
                        updateDataType(data,type);
                    }
                }
            })
        }
    })
    spinnerOb.spinner = new Spinner(spinnerOb.opts).spin(spinnerOb.target);
    let oldchoose=$('#datacom').val();
    setTimeout(() => {
        //load data
        // graphicControl.charType =  d3.select('#chartType_control').node().value;
        // graphicControl.sumType =  d3.select('#summaryType_control').node().value;
        let choiceinit = d3.select('#datacom').node().value;

        d3.csv("src/data/" + d3.select('#datacom').node().value + ".csv", function (error, data) {
            if (error) {
            }
            loadata(data);
        });
        MetricController.graphicopt({width:365,height:365})
            .div(d3.select('#RadarController'))
            .tablediv(d3.select('#RadarController_Table'))
            .axisSchema(serviceFullList)
            .onChangeValue(onSchemaUpdate)
            .onChangeFilterFunc(onfilterdata)
            .init();
        function loadata(data){
            d3.select(".cover").select('h5').text('drawLegend...');
            newdatatoFormat_cluster(data);
            // inithostResults();
            processResult = processResult_csv;
            db = "csv";
            // addDatasetsOptions();
            MetricController.axisSchema(serviceFullList,true).update();

            main();
            // d3.select(".cover").select('h5').text('loading data...');
            // addDatasetsOptions(); // Add these dataset to the select dropdown, at the end of this files
            d3.select('.cover').classed('hidden',true);
            spinnerOb.spinner.stop();
        }
    },0);
    // Spinner Stop ********************************************************************

});

function onSchemaUpdate(schema){
    serviceFullList.forEach(ser=>{
        ser.angle = schema.axis[ser.text].angle();
        ser.enable = schema.axis[ser.text].data.enable;
    });
    radarChartclusteropt.schema = serviceFullList;
    radarChartclusterSumopt.schema = serviceFullList;
    // radarChartOptions.schema = serviceFullList;
    // if (graphicControl.charType === "T-sne Chart")
    // TSneplot.schema(serviceFullList,firstTime);
    // if (graphicControl.sumType === "Radar" || graphicControl.sumType === "RadarSummary") {
    // Radarplot.schema(serviceFullList,firstTime);
    if (!firstTime) {
        cluster_map(data);
        MetricController.drawSummary(data.length);
    }

    // }
    if (db!=='csv')
        SaveStore();
}
function onfilterdata(schema) {}

function initgraphic () {
    svg = d3.select(".mainsvg").attr('class','mainmap'),
        MainOpt.width = +document.getElementById("mainBody").offsetWidth,
        heightdevice = + document.getElementById("mainBody").offsetHeight,
        MainOpt.height = heightdevice;
        svg = svg
            .attrs({
                width: MainOpt.width,
                height: MainOpt.height,
            })
            .append("g")
            .attr("transform",
                "translate(" + MainOpt.margin.left + "," + MainOpt.margin.top + ")");
    clustermap_opt.w_t = Math.min(Math.max(MainOpt.widthG()/5,50),400);
    radarChartclusteropt.w = clustermap_opt.w_t - radarChartclusteropt.margin.right-radarChartclusteropt.margin.left;
    radarChartclusteropt.h = radarChartclusteropt.w;
    clustermap_opt.h_t = radarChartclusteropt.h+radarChartclusteropt.margin.top+radarChartclusteropt.margin.bottom;

}
function main (){
    reset ();
    firstTime = false;
    data = [];
    dataSum =[];
    d3.select('.sumdragsvg').selectAll('*').remove();
    d3.select('#sortorder').on('change',function(){
        d3.select(this).interrupt();
        graphicControl.mode = this.value;
        handledata(graphicControl.mode);
        cluster_map(data);

    });
    serviceFull_selected =[];
    serviceList_selected.forEach(s=>serviceLists[s.index].sub.forEach(sub=>serviceFull_selected.push(sub)));
    // triggersortPlay();
    handledata(graphicControl.mode);
    handledata_sumary();
    MetricController.datasummary(getsummaryservice())
    orderSimilarity= similarityCal();
    cluster_map(data);
}
let data;
let orderSimilarity;
function onload_render(per){
    if(per&&per<1){
        d3.select('#load_render').classed('hidden',false).select('.determinate').style('width',per*100+'%');
    }else {
        d3.select('#load_render').classed('hidden', true);
    }
}
function handledata_sumary(){
    let dataSum = data.map(d=>d[0].map(e=>e.value))
    MetricController.data(dataSum).drawSummary(data.length)
}
function handledata(mode){
    data = Object.keys(clusterS).map((d,i)=>{
        let temp = serviceFullList.map(s=> {
            let temp_item =  {
                axis: s.text,
                // value: d3.scaleLinear().domain(s.range) (clusterS[d][s.text]),
                value_o: clusterS[d][s.text],
            };
            Object.keys(clusterS[d][s.text])
                .forEach(k=>temp_item[k] = d3.scaleLinear().domain(s.range) (clusterS[d][s.text][k]));
            return temp_item;
        });
        temp.name = d;
        let temparr = [temp];
        temparr.order = i;
        temparr.id = d;
        return temparr;
    });
    clustermap_opt.xScale.range([0,clustermap_opt.w_t]);
    clustermap_opt.yScale.range([0,clustermap_opt.h_t]);
    switch (mode) {
        case 'label':
            data.sort((a,b)=>(+a[0].name) - (+b[0].name)).forEach((d,i)=>d.order = i);
            break;
        case 'maxValue':
            data.sort((a,b)=>(d3.sum(a[0],e=>e.value)) - (d3.sum(b[0],e=>e.value))).forEach((d,i)=>d.order = i);;
            break;
        case 'similarity':
            data.sort((a,b)=>(orderSimilarity[a.order]-orderSimilarity[b.order])).forEach((d,i)=>d.order = i);
            break;
        case 'pca':
            var pcadata = data.map(d=>d[0].map(e=>e.value));
            var vectors = PCA.getEigenVectors(pcadata);
            var adData = PCA.computeAdjustedData(pcadata,vectors[0]);
            clustermap_opt.xScale.range([0,MainOpt.widthG()-clustermap_opt.w_t]);
            let temp_scale = d3.scaleLinear().domain(d3.extent(adData.adjustedData[0]));
            data.sort((a,b)=>(adData.adjustedData[0][a.order]-adData.adjustedData[0][b.order])).forEach((d,i)=>{
                d.position = {x:temp_scale(adData.adjustedData[0][d.order]),y:0};
                d.order = i;
            });
            break;
        case 'pca2d':
            var pcadata = data.map(d=>d[0].map(e=>e.value));
            var vectors = PCA.getEigenVectors(pcadata);
            var adData = PCA.computeAdjustedData(pcadata,vectors[0],vectors[1]);
            clustermap_opt.xScale.range([0,MainOpt.widthG()-clustermap_opt.w_t]);
            clustermap_opt.yScale.range([0,MainOpt.heightG()-clustermap_opt.h_t]);
            let temp_scalex = d3.scaleLinear().domain(d3.extent(adData.adjustedData[0]));
            let temp_scaley = d3.scaleLinear().domain(d3.extent(adData.adjustedData[1]));
            data.sort((a,b)=>(adData.adjustedData[0][a.order]-adData.adjustedData[0][b.order])).forEach((d,i)=>{
                d.position = {x:temp_scalex(adData.adjustedData[0][d.order]),y:temp_scaley(adData.adjustedData[1][d.order])};
                d.order = i;
            });
            break;
        default:
            data.forEach((d,i)=>d.order = i);
            break;
    }
    onload_render(0.1);
}
function loadNewData(d) {
    selectedService = d;
    const trig = d3.select("#datasetsSelectTrigger");
    trig.select('img').attr('src',srcpath+"images/"+selectedService+".png").on('error',function(){handlemissingimage(this,selectedService)});
    trig.select('span').text(selectedService);
}
let radarChartclusteropt  = {
    margin: {top: 20, right: 20, bottom: 20, left: 20},
    w: 300,
    h: 300,
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
    boxplot:false,
    events:{
        axis: {
            mouseover: function(){
                try {
                    d3.selectAll('.highlight').classed('highlight',false);
                    const d = d3.select(d3.event.detail || this).datum();
                    d3.selectAll('.axis' + d.idroot + '_' + d.id).classed('highlight', true);
                    $('.tablesvg').scrollTop($('table .axis' + d.idroot + '_' + d.id)[0].offsetTop);
                }catch(e){}
            },
            mouseleave: function(){
                const d = d3.select(d3.event.detail||this).datum();
                d3.selectAll('.highlight').classed('highlight',false);
            },
        },
    },
    showText: false};
let clustermap_opt = {
    w_t: radarChartclusteropt.w+radarChartclusteropt.margin.left+radarChartclusteropt.margin.right,
    h_t: radarChartclusteropt.h+radarChartclusteropt.margin.top+radarChartclusteropt.margin.bottom,
}
clustermap_opt.xScale = d3.scaleLinear().range([0,clustermap_opt.w_t]);
clustermap_opt.yScale = d3.scaleLinear().range([0,clustermap_opt.h_t]);
let categoryScale = d3.scaleOrdinal(d3.schemeCategory10);
let numg;
function updateRdarSize (event) {
    radarChartclusteropt.w = +event.value;
    radarChartclusteropt.h = +event.value;
    clustermap_opt.w_t = radarChartclusteropt.w+radarChartclusteropt.margin.left+radarChartclusteropt.margin.right;
    clustermap_opt.h_t = radarChartclusteropt.h+radarChartclusteropt.margin.top+radarChartclusteropt.margin.bottom;
    if (!firstTime) {
        handledata(graphicControl.mode);
        cluster_map(data);
    }
}
function cluster_map (data) {

    // loading bar
    let loaded = 0;
    var load = function () {
        loaded += 10;
        onload_render(loaded/100);
        if (loaded >= 100) {
            clearInterval(beginLoad);
        }
    };
    var beginLoad = setInterval(function () {
        load();
    }, 100);
    setTimeout(()=>{
        svg.selectAll('.radarCluster_sum').remove();
        let r_old = svg.selectAll('.radarCluster').data(data,d=>d[0].name);
        r_old.exit().remove();
        r_old.enter().append('g').attr('class','radarCluster').call(d3.drag().container(function () {
            return d3.select('body').node();
        }).on('start',ondragstart).on('drag',ondragged).on('end',ondragend))        ;
        numg = Math.floor(MainOpt.widthG()/clustermap_opt.w_t);
        svg.selectAll('.radarCluster')
            .attr('class',(d,i)=>'radarCluster radarh'+d.id)
            .each(function(d,i){
                radarChartclusteropt.color = function(){return categoryScale(d.id)};
                RadarChart(".radarh"+d.id, d, radarChartclusteropt,"");
            }).transition().duration(1000)
            .attr('transform',(d,i)=>'translate('+clustermap_opt.xScale(d.position&&d.position.x||d.order%numg)+','+clustermap_opt.yScale(d.position&&d.position.y||Math.floor(d.order/numg))+')');
        if (data[0].position || !graphicControl.table){
            d3.selectAll('.tablesvg').remove();
        }else
            tableCreate_svg(data)
    }, 0);
    function ondragstart(){
        let node_clone = d3.select(this).node().cloneNode(true);
        const s = d3.select('body') .append('svg')
            .styles({
                'position':'absolute',
                'z-index':10,
                // 'transform': 'translate(-50%, -50%)',
                'top': d3.event.y,
                'left': d3.event.x,})
            .attrs({
                'class': 'clone_svg',
                'width':clustermap_opt.w_t,
                'height':clustermap_opt.h_t,
            });
        d3.select(s.node().appendChild(node_clone))
            .attr('class','clone_radar').datum(d3.select(this).datum());

        d3.select('.clone_radar').attr('transform','translate(0,0)');
    }
    function ondragged() {
        d3.select('.clone_svg').styles({
            'top': d3.event.y,
            'left': d3.event.x,})
    }
    function ondragend() {
        // Define boundary
        const targetsize = $('.sumdrag')[0].getBoundingClientRect();
        const thissize = $('.clone_svg')[0].getBoundingClientRect();
        if ((thissize.x>=(targetsize.x)&&thissize.x<=(targetsize.x+targetsize.width))&&(thissize.y>=(targetsize.y)&&thissize.y<=(targetsize.y+targetsize.height))){
            const newData = d3.select('.clone_radar').datum()[0]
            if (dataSum.find(d=>d.name===newData.name)===undefined)
                dataSum.push(d3.select('.clone_radar').datum()[0]);
            clusterSum ()
        }
        d3.select('.clone_svg').remove();
    }

}

let dataSum=[];
let radarChartclusterSumopt  = {
    margin: {top: 50, right: 50, bottom: 50, left: 50},
    w: 500,
    h: 500,
    radiuschange: false,
    levels:6,
    dotRadius:2,
    strokeWidth:2,
    maxValue: 0.5,
    isNormalize:true,
    showHelperPoint: false,
    roundStrokes: true,
    ringStroke_width: 0.15,
    ringColor:'black',
    showText: false};

function clusterSum (){
    radarChartclusterSumopt.color = (i,d)=>categoryScale(d.name);
    RadarChart(".sumdragsvg", dataSum, radarChartclusterSumopt,"");
    d3.select('#deselectChart').on('click',function(){dataSum=[];d3.select('.sumdragsvg').selectAll('*').remove()})
}

function allowDrop(ev) {
    ev.preventDefault();
}
function drop(ev) {
    console.log('here');
    ev.preventDefault();
    // var data = ev.dataTransfer.getData("text");
    // ev.target.appendChild(document.getElementById(data));
}

function similarityCal(){
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
    mapIndex.sort((a,b)=>
        simMatrix[b].total-simMatrix[a].total
    );
    let current_index = mapIndex.pop();
    let orderIndex = [simMatrix[current_index].index];

    do{
    let maxL = 0;
    let maxI = 0;
    mapIndex.forEach((d)=>{
        let temp;
        if (d>simMatrix[current_index].index ){
            temp = simMatrix[current_index][d-current_index-1];
        }else{
            temp = simMatrix[current_index-d-1]
        }
        if (maxL<temp){
            maxL = temp;
            maxI = d;
        }
    });
    orderIndex.push(simMatrix[maxI].index);
    current_index = maxI;
    mapIndex = mapIndex.filter(d=>d!=maxI);} while(mapIndex.length);
    return orderIndex;
    function similarity (a,b){
        return Math.sqrt(d3.mean(a,(d,i)=>(d.value-b[i].value)*(d.value-b[i].value)));
    }
}

function tableCreate_svg(data){
    let divt = d3.select(svg.node().parentNode.parentNode);
    let table = divt.selectAll('.tablesvg').data(data,d=>d[0].name);
    table.exit().remove();
    let div_n = table.enter().append('div').attr('class','tablesvg mCustomScrollbar');

    let descrip_n = div_n.append('div').attr('class','clusterDescription').on('click',function(d){
        let self = this;

        $('#nameNode').val(clusterDescription[d.id].text);
        d3.select('#saveNode').on('click',()=>{
            clusterDescription[d.id].text = $('#nameNode').val();
            clusterDescription[d.id].axis = radarDes.description();
            d3.select(self).select('.desciptionText').text(function(e){return clusterDescription[e.id].text})
        });
        $('#radar_Des_div').modal('open');
        radarDes.div(d3.select('.radarHolder')).description(clusterDescription[d.id].axis).draw(d3.select(".radarh"+d.id));
    });
    descrip_n.append('span').attrs({
        type: 'text',
        class: 'desciptionText'
    }).text(function(d){return clusterDescription[d.id].text})
    descrip_n.append('i').attrs({
        class: 'material-icons tiny'
    }).style('color','white').text('edit')

    let table_n = div_n.append('table');
    table_n.append('col');
    table_n.append('col').attr('class','num');
    table_n.append('thead').append('tr');
    table_n.append('tbody');

    table = divt.selectAll('.tablesvg table');
    divt.selectAll('.tablesvg').styles({
        'width': clustermap_opt.w_t+'px',
        // 'margin-left': radarChartclusteropt.margin.left+'px',
        top: d=>(clustermap_opt.yScale((d.position&&d.position.y||Math.floor(d.order/numg))+1))+'px',
        left: d=>clustermap_opt.xScale(d.position&&d.position.x||d.order%numg)+'px',
    }).on('scroll',function(){
        $('.tablesvg').scrollTop(this.scrollTop);
        $(".tablesvg").mCustomScrollbar("scrollTo",this.scrollTop);
    });

    let thead = table.select('thead tr').selectAll('th').data(['Service name','Value']);
    thead.exit().remove();
    thead.enter().append('th').text(d=>d);

    let tr = table.select('tbody').selectAll('tr').data(d=>d[0]);
    tr.exit().remove();
    let td = tr.enter().append('tr')
        .merge(tr)
        .attr('class',dd=>{let d = serviceFullList.find(e=>e.text===dd.axis); return 'axis'+d.idroot+'_'+d.id;})
        .on('mouseover',function(dd){
            d3.selectAll('.highlight').classed('highlight',false);
            let d = serviceFullList.find(e=>e.text===dd.axis); d3.selectAll('.axis'+d.idroot+'_'+d.id).classed('highlight',true);
        })
        .on('mouseleave',function(dd){
            let d = serviceFullList.find(e=>e.text===dd.axis); d3.selectAll('.axis'+d.idroot+'_'+d.id).classed('highlight',false);
        })
        .selectAll('td').data(d=>[d.axis,d.value_o.value]);
    td.exit().remove();
    td.enter().append('td').text(d=>typeof(d)==='string'?d:d.toFixed(2));

    // $(".tablesvg").mCustomScrollbar({
    //     axis:"y", // horizontal scrollbar,
    //     callbacks:{
    //         onScrollStart: function(){
    //             $(this).addClass('ScrollActive');
    //         },
    //         whileScrolling: function(){
    //             $(".tablesvg").not('.ScrollActive').mCustomScrollbar("disable",true);
    //             $(".tablesvg").not('.ScrollActive').mCustomScrollbar("scrollTo",
    //                 this.mcs.draggerTop);
    //         },
    //         onScroll: function(){
    //             $(".tablesvg").not('.ScrollActive').mCustomScrollbar("disable",false);
    //             $(this).removeClass('ScrollActive');
    //         }
    //     }
    // });
}
function triggersortPlay(){
    d3.select('#sortorder').transition().duration(5000).on("end", function repeat() {
        this.options.selectedIndex = (this.options.selectedIndex+1)%this.options.length;
        graphicControl.mode = this.value;
        handledata(graphicControl.mode);
        cluster_map(data);
        d3.active(this)
            .transition()
            .on("start", repeat);
    });
}
function sortplay(event){
    if(event.value=='pause'){
        d3.select('#sortorder').interrupt();
        $('#sortorder').removeClass('pulse_custom');
        event.value='play';
        event.classList.remove('pause');
    }else{
        triggersortPlay();
        $('#sortorder').addClass('pulse_custom');
        event.value='pause';
        event.classList.add('pause');
    }
}

function getsummaryservice(){
    let histodram = {
        resolution:20,
    };
    let h = d3.scaleLinear();
    let dataf = serviceFull_selected.map(s=>Object.keys(clusterS).map(d=>d3.scaleLinear().domain(s.range)(clusterS[d][s.text].value)));
    let ob = {}
    dataf.forEach((d,i)=>{
        d=d.filter(e=>e!=undefined).sort((a,b)=>a-b);
        let r;
        if (d.length>20){

            // kde = kernelDensityEstimator(kernelEpanechnikov(.2), h.ticks(histodram.resolution));
            // let sumstat = kde(d);
            var x = d3.scaleLinear()
                .domain(d3.extent(d));
            var histogram = d3.histogram()
                .domain(x.domain())
                .thresholds(x.ticks(histodram.resolution))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
                .value(d => d);
            let hisdata = histogram(d);
            // let y = d3.scaleLinear()
            //     .domain([0,d3.max(hisdata,d=>(d||[]).length)]);

            let sumstat = hisdata.map((d,i)=>[d.x0+(d.x1-d.x0)/2,(d||[]).length]);
            r = {
                axis: serviceFull_selected[i].text,
                q1: ss.quantileSorted(d,0.25) ,
                q3: ss.quantileSorted(d,0.75),
                median: ss.medianSorted(d) ,
                // outlier: ,
                arr: sumstat};

                const iqr = r.q3-r.q1;
                r.outlier = d.filter(e=>e>(r.q3+2.5*iqr)||e<(r.q1-2.5*iqr));

        }else{
            r = {
                axis: serviceFull_selected[i].text,
                q1: undefined ,
                q3: undefined,
                median: undefined ,
                outlier: d,
                arr: []};
        }
        if(r.outlier.length)
        {
            let h = d3.scaleLinear().range([0, 80]);
            const circledata =  r.outlier.map(d=>{return{val:d}});
            var simulation = d3.forceSimulation(circledata)
                .force("x", d3.forceX(function(d) { return h(d.val); }).strength(1))
                .force("y", d3.forceY(0))
                .force("collide", d3.forceCollide(2))
                .stop();
            for (var i = 0; i < 120; ++i) simulation.tick();
            r.outlier =  circledata;
        }
        ob[r.axis] = r;

    });
    return ob;
}
function reset () {
    d3.selectAll('.tablesvg').remove();
}
graphicControl.tableEnable = (e)=>{
    graphicControl.table = e;
    cluster_map(data);
}