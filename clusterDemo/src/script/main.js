let graphicControl ={
    charType : "Area Chart",
    sumType : "Radar",
    mode:'seperate',
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
    $('.collapsible').collapsible();
    $('.modal').modal();
    $('.dropdown-trigger').dropdown();
    $('.tabs').tabs();
    $('.sidenav').sidenav();
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

    // d3.select('#chartType_control').on("change", function () {
    //     var sect = document.getElementById("chartType_control");
    //     graphicControl.charType = sect.options[sect.selectedIndex].value;
    // });
    //
    // d3.select('#summaryType_control').on("change", function () {
    //     var sect = document.getElementById("summaryType_control");
    //     graphicControl.sumType = sect.options[sect.selectedIndex].value;
    //     svg.select(".graphsum").remove();
    //     pannelselection(false);
    //     updateSummaryChartAll();
    // });
    d3.select('#datacom').on("change", function () {
        d3.select('.cover').classed('hidden', false);
        exit_warp();
        spinnerOb.spinner.spin(target);
        const choice = this.value;
        const choicetext = d3.select('#datacom').node().selectedOptions[0].text;

        setTimeout(() => {
            d3.json("data/" + choice + ".json", function (error, data) {
                if (error){
                    M.toast({html: 'Local data does not exist, try to query from the internet!'})
                    d3.json("https://media.githubusercontent.com/media/iDataVisualizationLab/HPCC/master/HiperView/data/" + choice + ".json", function (error, data) {
                        if (error){

                        }
                        loadata1(data)
                    });
                    return;
                }
                loadata1(data)
            });
        },0);
        function loadata1(data){
            sampleS = data;
            if (choice.includes('influxdb')){
                processResult = processResult_influxdb;
                db = "influxdb";
                realTimesetting(false,"influxdb",true);
            }else {
                db = "nagios";
                processResult = processResult_old;
                realTimesetting(false,undefined,true);
            }
            d3.select(".currentDate")
                .text("" + d3.timeParse("%d %b %Y")(choicetext).toDateString());
            resetRequest();
            d3.select('.cover').classed('hidden', true);
            spinnerOb.spinner.stop();
        }
    });
    $('#data_input_file').on('change', (evt) => {
        var f = evt.target.files[0];
        var reader = new FileReader();
        reader.onload = (function(theFile) {
            return function(e) {
                // Render thumbnail.
                d3.select('.cover').classed('hidden', false);
                exit_warp();
                spinnerOb.spinner.spin(spinnerOb.target);
                setTimeout(() => {
                    d3.csv(e.target.result,function (error, data) {
                        if (error){
                        }else{
                            loadata1(data);
                            function loadata1(data){
                                newdatatoFormat_cluster(data);

                                inithostResults();
                                processResult = processResult_csv;
                                db = "csv";
                                addDatasetsOptions()
                                MetricController.axisSchema(serviceFullList,true).update();
                                realTimesetting(false,"csv",true,data);
                                d3.select(".currentDate")
                                    .text("" + new Date(data[0].timestamp).toDateString());
                                resetRequest();
                                d3.select('.cover').classed('hidden', true);
                                spinnerOb.spinner.stop();
                            }
                        }
                    })
                },0);
                // span.innerHTML = ['<img class="thumb" src="', e.target.result,
                //     '" title="', escape(theFile.name), '"/>'].join('');
                // document.getElementById('list').insertBefore(span, null);
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
    })
    spinnerOb.spinner = new Spinner(spinnerOb.opts).spin(spinnerOb.target);
    setTimeout(() => {
        //load data
        graphicControl.charType =  d3.select('#chartType_control').node().value;
        graphicControl.sumType =  d3.select('#summaryType_control').node().value;
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
            addDatasetsOptions();
            MetricController.axisSchema(serviceFullList,true).update();

            main();
            d3.select(".cover").select('h5').text('loading data...');
            addDatasetsOptions(); // Add these dataset to the select dropdown, at the end of this files
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
        cluster_map(data,graphicControl.mode);
    }
    // }
    if (db!=='csv')
        SaveStore();
}
function onfilterdata(schema) {}
initgraphic ();
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
}
function main (){
    firstTime = false;
    hadledata(graphicControl.mode);
    cluster_map(data,graphicControl.mode);
}
let data;
function hadledata(mode){
    if (mode==='seperate'){
        data = Object.keys(clusterS).map((d,i)=>{
            let temp = serviceFullList.map(s=> {
                return {
                    axis: s.text,
                    value: d3.scaleLinear().domain(s.range) (clusterS[d][s.text]),
                };
            });
            temp.name = d;
            return [temp];
        });
    }else{
        data = Object.keys(clusterS).map((d,i)=>{
            let temp = serviceFullList.map(s=> {
                return {
                    axis: s.text,
                    value: d3.scaleLinear().domain(s.range) (clusterS[d][s.text]),
                };
            });
            temp.name = d;
            return temp;
        });
    }
}
function loadNewData(d) {
    //alert(this.options[this.selectedIndex].text + " this.selectedIndex="+this.selectedIndex);
    //svg.selectAll("*").remove();
    selectedService = d;
    const trig = d3.select("#datasetsSelectTrigger");
    trig.select('img').attr('src',srcpath+"images/"+selectedService+".png").on('error',function(){handlemissingimage(this,selectedService)});
    trig.select('span').text(selectedService);
}
let radarChartclusteropt  = {
    margin: {top: 10, right: 10, bottom: 10, left: 10},
    w: 200,
    h: 200,
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
    showText: false};
let clustermap_opt = {
    w_t: radarChartclusteropt.w+radarChartclusteropt.margin.left+radarChartclusteropt.margin.right,
    h_t: radarChartclusteropt.h+radarChartclusteropt.margin.top+radarChartclusteropt.margin.bottom,
}
clustermap_opt.xScale = d3.scaleLinear().range([clustermap_opt.w_t/2,3*clustermap_opt.w_t/2]);
clustermap_opt.yScale = d3.scaleLinear().range([0,2*clustermap_opt.h_t/2]);
let categoryScale = d3.scaleOrdinal(d3.schemeCategory10);
function cluster_map (data,mode) {

    let w_t = radarChartclusteropt.w+radarChartclusteropt.margin.left+radarChartclusteropt.margin.right;
    let h_t = radarChartclusteropt.h+radarChartclusteropt.margin.top+radarChartclusteropt.margin.bottom;
    svg.selectAll('.radarCluster_sum').remove();
    let r_old = svg.selectAll('.radarCluster').data(data);
    r_old.exit().remove();
    r_old.enter().append('g').attr('class','radarCluster').call(d3.drag().container(function () {
        return d3.select('body').node();
    }).on('start',ondragstart).on('drag',ondragged).on('end',ondragend));
    let numg = Math.floor(MainOpt.widthG()/w_t);
    svg.selectAll('.radarCluster')
        .attr('class',(d,i)=>'radarCluster radarh'+i)
        .attr('transform',(d,i)=>'translate('+clustermap_opt.xScale(i%numg)+','+clustermap_opt.yScale(Math.floor(i/numg))+')')
        .each((d,i)=>{
            radarChartclusteropt.color = function(){return categoryScale(d[0].name)};
            RadarChart(".radarh"+i, d, radarChartclusteropt,"");
        });

    function ondragstart(){
        let node_clone = d3.select(this).node().cloneNode(true);
        const s = d3.select('body') .append('svg')
            .styles({
                'position':'absolute',
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
