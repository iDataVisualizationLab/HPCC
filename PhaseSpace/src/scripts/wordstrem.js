
var categoriesgroup ={
    "term": ["term"]};

//var colorsw = d3.scaleOrdinal(d3.schemeCategory10);
var categories=[];
var outputFormat = d3.timeFormat('%Y');
var parseTime = (d => Date.parse(d));
var termscollection_org,
    svg;
var lineColor = d3.scaleLinear()
    .domain([0,120])
    .range(['#558', '#000']);
// var x = d3.scalePoint();
var wscale = 0.01;
var timeline;
var svgHeight = 200;
var nodes2,links2;
var mainconfig = {
    subcategory:true,
    renderpic: false,
    wstep: 30,
    numberOfTopics: 50,
    rateOfTopics: 0.005,
    Isweekly: false,
    seperate: false,
    minfreq: 5,
    minlink:10,
};
var daystep = 365;
var startDate;
var endDate;
var wordTip = function (d) {
        var str = '';
        str += "<div class = headertip>"
        str += "<b>Term:";
        str +=  (d.text||d.key) +" "+'</b>';
        str += "<br/>  Frequency: ";
        str += (d.f||d.value.articlenum);
        str += "<br/>  Year: ";
        str += outputFormat(d.data[0].time);

        str += "</div>"
        str += "<table class ='headertable'>";
        str += "<tr>";
        str += '<th >Source(s)</th>';
        str += '<th >Title</th>';
        str + "</tr>";

        (d.data||d.value.data).forEach(t => {
            var ar = (t.source==undefined)?ArticleDay.filter(f=> f.key == outputFormat(t.time))[0].value.data.find(f=> f.title == t.title):t;
            //var ar =t;
            str += "<tr>";
            str += "<td>" + ar.source + "</td>";
            str += "<td class=pct>" + ar.title + "</td>";
            str + "</tr>";
        });

        str += "</table>";

        return str;
    };

var navbar;


var target;


function wordCloud(selector,config) {
    function draw(data) {
        var dataWidth;
        var width;
        var font = "Arial";
        var interpolation = d3.curveCardinal;
        var bias = 200;
        var offsetLegend = 50;
        var axisPadding = 10;
        var margins = {top: 0, right: 0, bottom: 10, left: 0};
        var min = 10;
        var max = 15;
        lineColor.domain([min, max]);
        width = config.width;
        var height = config.height;
        margin = config.margin||margin;
        height = height - margins.top - margins.bottom;



        var area = d3.area()
            .curve(interpolation)
            .x(function (d) {
                return (d.x);
            })
            .y0(function (d) {
                return d.y0;
            })
            .y1(function (d) {
                return (d.y0 + d.y);
            });

        //Draw the word cloud

        var mainGroup = d3.select(selector).append('g')
            .attr('class','cloud')
            .attr('transform', 'translate(' + margins.left + ',' + (margins.top) + ')');
        var wordStreamG = mainGroup.append('g');
        var k = 0;
        // if (pop) {
        //     dataWidth = data.length * 20
        // }
        // else {
        //     dataWidth = data.length * 100;
        // }

        //Layout data
        var ws = d3.wordStream()
            .size([width - margins.left - margins.right, height])
            .interpolate(interpolation)
            .fontScale(d3.scaleLinear())
            .frequencyScale(d3.scaleLinear())
            .minFontSize(min)
            .maxFontSize(max)
            .data(data)
            .font(font)
            .suddenmode(true)
            .seperate(mainconfig.seperate);
        const cal1 = new Date();
        var boxes = ws.boxes(),
            minFreq = ws.minFreq(),
            maxFreq = ws.maxFreq();
        const cal2 = new Date();
        console.log('---- Analyzing Word Stream ----: '+(cal2-cal1));
        //Display data




        // var xrange = x.range();
        var boxwidth = ~~(width/data.length);
        // x.range([xrange[0] + boxwidth, width - boxwidth])
        mainGroup.attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');
        var overclick = wordStreamG.append('rect')
            .attr('class','wsoverlay').attrs({width:width, height:height})
            .style("fill", "none")
            // .style("pointer-events", "all");

        // =============== Get BOUNDARY and LAYERPATH ===============
        var lineCardinal = d3.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .curve(interpolation);

        var boundary = [];
        for (var i = 0; i < boxes.layers[0].length; i ++){
            var tempPoint = Object.assign({}, boxes.layers[0][i]);
            tempPoint.y = tempPoint.y0;
            boundary.push(tempPoint);
        }

        for (var i = boxes.layers[boxes.layers.length-1].length-1; i >= 0; i --){
            var tempPoint2 = Object.assign({}, boxes.layers[boxes.layers.length-1][i]);
            tempPoint2.y = tempPoint2.y + tempPoint2.y0;
            boundary.push(tempPoint2);
        }       // Add next (8) elements

        var lenb = boundary.length;



        var combined = lineCardinal( boundary.slice(0,lenb/2))
            + "L"
            + lineCardinal( boundary.slice(lenb/2, lenb))
                .substring(1,lineCardinal( boundary.slice(lenb/2, lenb)).length)
            + "Z";


        // ============== DRAW CURVES =================

        var topics = boxes.topics;
        var stokepath = mainGroup.selectAll('.stokepath')
            .data(boxes.layers)
            .attr('d', area)
            .style('fill', function (d, i) {
                return color(boxes.topics[i]);
            })

            .attrs({
                'fill-opacity': 0.05,      // = 1 if full color
                // stroke: 'black',
                'stroke-width': 0.5,
                topic: function(d, i){return topics[i];}
            });
        stokepath.exit().remove();
        stokepath
            .enter()
            .append('path')
            .attr('class','stokepath')
            .attr('d', area)
            .style('fill', function (d, i) {
                return color(boxes.topics[i]);
            })
            .attrs({
                'fill-opacity': 0.05,      // = 1 if full color
                // stroke: 'black',
                'stroke-width': 0.5,
                topic: function(d, i){return topics[i];}
            });
        // ARRAY OF ALL WORDS
        var allWords = [];
        d3.map(boxes.data, function(row){
            boxes.topics.forEach(topic=>{
                allWords = allWords.concat(row.words[topic]);
            });
        });



        var opacity = d3.scaleLog()
            .domain([minFreq, maxFreq])
            .range([0.7,1]);

        // Add moi chu la 1 element <g>, xoay g dung d.rotate
        var placed = true; // = false de hien thi nhung tu ko dc dien

        var gtext = mainGroup.selectAll('.gtext')
            .data(allWords)
            .attrs({transform: function(d){return 'translate('+d.x+', '+d.y+')rotate('+d.rotate+')';}});

        var stext = gtext.selectAll('.stext')
            .transition()
            .duration(600)
            .text(function(d){return d.text;})
            .attr('font-size', function(d){return d.fontSize + "px";} )// add text vao g
            .attrs({
                'font-family': font,
                'font-size': function(d){return d.fontSize + "px";},
                topic: function(d){return d.topic;},
                visibility: function(d){ return d.placed ? (placed? "visible": "hidden"): (placed? "hidden": "visible");}
            })
            .styles({
                'font-family': font,
                'font-size': function(d){return d.fontSize + "px";},
                'fill': function(d){return color(boxes.topics[d.topicIndex])},//function(d){return color(d.topicIndex);},
                'fill-opacity': function(d){return opacity(d.frequency)},
                'text-anchor': 'middle',
                'alignment-baseline': 'middle'
            })
            .duration(1000);
        gtext.exit().remove();
        gtext.enter()
            .append('g')
            .attr('class','gtext')
            .attrs({transform: function(d){return 'translate('+d.x+', '+d.y+') rotate('+d.rotate+')';}})
            .append('text')
            .attr("class",'stext')
            .transition().duration(600).styleTween('font-size', function(d){return d.fontSize + "px";} )// add text vao g
            .text(function(d){return d.text;})
            .attrs({
                'font-family': font,
                'font-size': function(d){return d.fontSize + "px";},
                topic: function(d){return d.topic;},
                visibility: function(d){ return d.placed ? (placed? "visible": "hidden"): (placed? "hidden": "visible");}
            })
            .styles({
                'font-family': font,
                'font-size': function(d){return d.fontSize + "px";},
                'fill': function(d){return color(boxes.topics[d.topicIndex])},//function(d){return color(d.topicIndex);},
                'fill-opacity': function(d){return opacity(d.frequency)},
                'text-anchor': 'middle',
                'alignment-baseline': 'middle'
            });
        gtext.exit().selectAll('*').remove();
        gtext.exit().remove();
        // When click a term
        //Try
        var prevColor;
        //Highlight
        mainGroup.selectAll('.stext').on('mouseenter', function(d){
            var thisText = d3.select(this);
            thisText.style('cursor', 'pointer');
            prevColor = thisText.attr('fill')||thisText.style('fill');

            var text = thisText.text();
            var topic = thisText.attr('topic');
            mainGroup.selectAll('.stext').style('fill-opacity', 0.2);
            var allTexts = mainGroup.selectAll('.stext').filter(t =>{
                var sameTerm = t && t.text === text &&  t.topic === topic;
                var sameArticle = false;
                //t.data.forEach(tt=>(sameArticle = sameArticle || (d.data.find(e=>e.title===tt.title)!==undefined)));
                return sameTerm || sameArticle;
            });
            allTexts.style('fill-opacity', 1);
            // var allSubjects = allTexts.filter(t=> t && t.text === text &&  t.topic === topic);
            // allSubjects.attrs({
            //     stroke: prevColor,
            //     'stroke-width': 1.5
            // });

            //showTip(d,wordTip);
        });

        mainGroup.selectAll('.stext').on('mouseleave', function(d){
            var thisText = d3.select(this);
            thisText.style('cursor', 'default');
            var text = thisText.text();
            var topic = thisText.attr('topic');
            var allTexts = mainGroup.selectAll('.stext').filter(t =>
                t && !t.cloned
            );

            allTexts
                .style('fill-opacity', function(d){return opacity(d.frequency)});
            //hidetip();
        });
        //Click

    }
    return {
        update: function (words) {
            draw(words);
        }
    }
}
function readyWordStream (error, data){

    if (error) throw error;
    //data = dataf;
    // format the data
    //data =data.filter(d=>d.source=="reuters");

    data.sort((a,b)=> a.time-b.time);

    //data = data.filter(d=> d.time> parseTime('Apr 15 2018'));
    termscollection_org = blacklist(data,"category");
    forcegraph(".networkDiv");
    var listjson = {};
    d3.map(termscollection_org, function(d){return d.term;}).keys().forEach(d=>listjson[d]=null);

    setTimeout(function () {

        renderWordStream(data);
    }, 0);
}

function renderWordStream (data){
    d3.selectAll(".wordStreamDiv").selectAll('svg').remove();
    handledata(data);

    var margin = {top: 20, right: 0, bottom: 0, left: 0};
    var width = $(".wordStreamDiv").width() - margin.left - margin.right;
    var numDays = endDate-startDate;
    mainconfig.wstep = width/numDays;
    //width = Math.max(width,mainconfig.wstep*(numDays));
    var height = svgHeight - margin.bottom - margin.top;

    // parse the date / time


    timeline = d3.select(".wordStreamDiv")
        .append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var rc = 1;
// set the ranges

    var startDatedis = new Date (startDate);
    startDatedis["setDate"](startDatedis.getDate() - daystep);
    var endDatedis = new Date (endDate);
    endDatedis["setDate"](endDatedis.getDate() + daystep);
    x.range([0, width])
        .domain([new Date (startDatedis),new Date (endDatedis)]);
    let gridlineNodes = d3.axisTop()
        .tickFormat("")
        .tickSize(-height)
        .scale(x);
    //.ticks(d3.timeMonday.every(1));
    var y = d3.scaleLinear().range([height/2, 0]);
    var simulation = d3.forceSimulation()
        .force("y", d3.forceY(height*wscale/2).strength(0.05));
    svg = timeline.append("g")
        .attr("transform", "translate(" + 0 + "," + height*wscale + ")")
        .attr("id","tagCloud")
        .append("svg")
        .attr("width", width)
        .attr("height", height*(1-wscale));
    svg.append("g")
        .attr("class", "grid")
        .call(gridlineNodes);
    var configwc = {width: width,height: height*(1-wscale)};
    myWordCloud = wordCloud('#tagCloud',configwc);

    myWordCloud.update(TermwDay);
    timeline.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height*wscale + ")")
        .call(d3.axisTop(x)
            .tickFormat(d3.timeFormat("%Y")))
        .selectAll("text")
        .style("text-anchor", "start")
        .attr("dx", ".8em")
        .attr("dy", "-.15em");

    //bubbles
    var defs = d3.select(".wordStreamDiv").select('g').append("defs");
    var filter = defs.append("filter")
        .attr("id","glow");
    filter.append("feGaussianBlur")
        .attr("stdDeviation","3.5")
        .attr("result","coloredBlur");
    var feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode")
        .attr("in","coloredBlur");
    feMerge.append("feMergeNode")
        .attr("in","SourceGraphic");



    timeline.select('.sublegend')
        .attr("transform", "translate(" + 0 + "," + height*wscale + ")");


    d3.selectAll("toogle").property("disabled",false);
}
function handledata(data){
    var termscollection = [];
    outputFormat =  d3.timeFormat('%Y');
    daystep = 365;
    svgHeight = $(".wordStreamDiv").height();

    var nested_data;
    nested_data = d3.nest()
        .key(function (d) {
            return d.title;
        })
        .key(function (d) {
            return d.term;
        })
        .rollup(function (words) {
            return {frequency: words.length, data: words[0]};
        })
        .entries(termscollection_org);
    termscollection.length = 0;
    nested_data.forEach(d=> d.values.forEach(e=> termscollection.push(e.value.data)));
    //sudden
    var nestedByTerm = d3.nest()
        .key(function(d) { return d.category; })
        .key(function(d) { return d.term; })
        .key(function(d) { return outputFormat(d.time); })
        .entries(termscollection);
    nestedByTerm.forEach(c=>
        c.values.forEach(term=> {
                var pre = 0;
                var preday = new Date(term.values[0].key);
                term.values.forEach(day => {
                    preday["setDate"](preday.getDate() + daystep);
                    if (preday.getFullYear() != new Date(day.key).getFullYear())
                        pre = pre==0?0:pre-1;
                    var sudden  = (day.values.length+1)/(pre+1);
                    day.values.forEach(e=> e.sudden = sudden);
                    pre = day.values.length;
                    preday = new Date(day.key);
                })
            }
        )
    );
    termscollection.length = 0;
    nestedByTerm.forEach(c=>
        c.values.forEach(term=> {
                term.values.forEach(day => {
                    day.values.forEach(e=> termscollection.push(e))
                })
            }
        )
    );
    nestedByTerm = d3.nest()
        .key(function(d) { return d.category; })
        .key(function(d) { return outputFormat(d.time); })
        .key(function(d) { return d.term; })
        .entries(termscollection);
    nestedByTerm.forEach(c=> c.values.forEach( day=>
        day.values.sort((a,b)=>b.values[0].sudden-a.values[0].sudden)));
    nestedByTerm.forEach(c=> c.values.forEach( day=>{
        // var numtake = Math.max(mainconfig.numberOfTopics,day.values.length*mainconfig.rateOfTopics);
        var numtake = mainconfig.numberOfTopics;
        day.values = day.values.slice(0,numtake)}));

    termscollection.length = 0;
    nestedByTerm.forEach(c=>
        c.values.forEach(term=> {
                term.values.forEach(day => {
                    day.values.forEach(e=> termscollection.push(e))
                })
            }
        )
    );
    console.log('cut by sudden: '+ termscollection.length);
    // done -sort
    termscollection.sort((a,b)=>a.time-b.time);
    nested_data = d3.nest()
        .key(function(d) { return outputFormat(d.time); })
        .key(function(d) { return d.category; })
        .key(function(d) { return d.term; })
        .rollup(function(words) { return {frequency: words.length,sudden: words[0].sudden,data:words}; })
        .entries(termscollection);


    // ArticleByDay
    ArticleDay = d3.nest()
        .key(function(d) { return outputFormat(d.time); })
        .rollup(function(words) { return {articlenum: words.length,data:words}; })
        .entries(data);
    ArticleDay=ArticleDay.filter(d=> nested_data.find(e=> e.key === d.key));
    TermwDay = nested_data.map(d=>{
        var words = {};
        categories.forEach( topic =>
        {
            var w = d.values.filter(wf => wf.key === topic)[0];
            if (w !== undefined) {
                words[w.key] = w.values.map(
                    text => {
                        return {
                            text: text.key,
                            sudden: text.value.sudden,
                            topic: w.key,
                            frequency: text.value.frequency,
                            data: text.value.data,
                        };
                    })
            }else{
                words[topic] =[];
            }
        });
        return {'date': d.key,
            'words': words};});
    startDate = TermwDay[0].date;
    endDate = TermwDay[TermwDay.length-1].date;
    console.log(startDate +" - "+endDate);
}


function blacklist(data,category){
    var numterm =0;
    categories = Object.keys(categoriesgroup);
    var categoriesmap = {};
    for ( k in categoriesgroup)
        categoriesgroup[k].forEach(kk=> categoriesmap[kk]= k);
    var blackw = ["texas","(usgs)","usgs","1)","collected","study","data","water","texa"];
    termscollection_org =[];
    data.forEach(d=>{
        d.keywords.filter(w => {
            numterm++;
            var key = false;
            //categories.forEach(c=> key = key || ((w.category==c)&&(blackw.find(d=>d==w.term)== undefined)));
            key = key || ((blackw.find(d=>d===w.term)== undefined)) && categoriesmap[w[category]]!= undefined ;
            return key;}).forEach( w => {
            w.maincategory = w[category];
            w.term = w.term.trim();
            w.category = categoriesmap[w[category]]||w[category];
            var e = w;
            e.time = d.time;
            e.title = d.title;
            if (e.term!="")
                termscollection_org.push(e)});
    });
    console.log("#org terms: " +numterm);
    console.log("#terms: " +termscollection_org.length);
    return termscollection_org;
}