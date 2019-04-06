// config
let widthSvg = 1000;//document.getElementById("mainPlot").clientWidth-101;
let heightSvg = 1000;
let margin = ({top: 20, right: 50, bottom: 50, left: 50});



//dataprt

let service_part =0;

let currentColor ="black";
const mainsvg = d3.select("#content"),
    netsvg = d3.select("#networkcontent");
let x,y,color,brush,legendScale,scaleX,scaleY;

let isColorMatchCategory = false;

let dataRaw = [];
let data,nestbyKey, sumnet=[];
// mainsvg.attrs({
//     width: widthSvg,
//     height: heightSvg,
// });
mainsvg.attrs({
    ViewBox:"0 0 "+widthSvg+" " +heightSvg,
    preserveAspectRatio:"xMidYMid meet"
}).styles({
    overflow: "visible",

});
let netConfig ={
    g:{},
    margin: {top: 0, right: 0, bottom: 0, left: 0},
    scalezoom: 1,
    width: widthSvg,
    height: heightSvg,
    widthView: function(){return this.width*this.scalezoom},
    heightView: function(){return this.height*this.scalezoom},
    widthG: function(){return this.widthView()-this.margin.left-this.margin.right},
    heightG: function(){return this.heightView()-this.margin.top-this.margin.bottom},
    colider: function() {return this.smallgrapSize()/3},
    ratiograph: 12,
    smallgrapSize: function(d){return this.width/this.ratiograph},
    fontRange:[10,15]
};
/* Initialize tooltip */
let tip = d3.tip().attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
        console.log(d);
        if (d.values[0].connect===undefined)return d.values[0].key;
        return ([d.values[0].key,d.values[0].connect.map(e=> {
        if (e.source.key !== d.values[0].key)
            return e.source.key;
        return  e.target.key;
    }).join(', ')]).join(': '); });









function init(){
    dataRaw = object2Data(readData());
    data = calData(UnzipData(dataRaw));
    nodenLink = callgapsall(data);
    drawSumgap();
    initNetgap ();
    drawNetgap(nodenLink,isColorMatchCategory);

}

$( document ).ready(function(){
    $('.dropdown-trigger').dropdown();
    $('.sidenav').sidenav();
    // $('.dropdown-button2').dropdown({
    //         inDuration: 300,
    //         outDuration: 225,
    //         constrain_width: false, // Does not change width of dropdown to that of the activator
    //         hover: true, // Activate on hover
    //         gutter: ($('.dropdown-content').width()*3)/2.5 + 2, // Spacing from edge
    //         belowOrigin: false, // Displays dropdown below the button
    //         alignment: 'left' // Displays dropdown with edge aligned to the left of button
    //     }
    // );
    // let submenu = d3.select('#sublistvar')
    //     .selectAll('li')
    //     .data(serviceLists[chosenService].sub,d=>d.id)
    //     .join(enter => enter.append("li") .attr('tabindex','1')
    //             .append("a")
    //             .attr('href',"#!")
    //             .text(d=>d.text),
    //         update => update.select("a")
    //             .text(d=>d.text));

    serviceLists.forEach(d=>d.sub.forEach(e=>e.mainService=d.id));
    d3.select("#listvar")
        .selectAll('li').remove();
    let menucombo = d3.select("#listvar")
        .selectAll('li')
        .data(serviceLists,d=>d.id)
        .join(enter => enter.append("li") .attr('tabindex','0').selectAll('a')
                .data(d=>d.sub).enter()
                .append("a")
                .attr('href',"#").text(d=>{console.log(d);return d.text}),
            update => update.select("a")
                .text(d=>d.text))
        .on('click',changeVar);

    // menucombo.select('.collapsible-header')
    //     .join('div')
    //     .attr('class','collapsible-header')
    //     .text(d=>d.text);
    //     .join("a").on('click',changeVar)
    //     .text(d=>d.text);
    widthSvg = $('#network').width();
    heightSvg = widthSvg;
    d3.select("#DarkTheme").on("click",switchTheme);
    init();

});
function changeVar(d){
    chosenService =d.mainService;
    service_part = d.id;
    $('#labelSum').text('Phase Space of '+serviceLists[chosenService].text);
    reset();
    $('#currentservice').text(d.text);
}

function reset(){
    mainsvg.selectAll('*').remove();
    d3.select('#legend-svg').selectAll('*').remove();
    //netsvg.selectAll('*').remove();

    data = calData(UnzipData(dataRaw));
    nodenLink = callgapsall(data);
    drawSumgap();
    drawNetgap(nodenLink);
}
function mouseoverHandel(datain){
    tip.show(datain);
    let timestep = datain.key;
    let datapoint = datain.values[0];
    let cpoint = mainsvg.selectAll(".gCategory").filter(f=>f.key!==datapoint.key);
    cpoint.transition().duration(500)
        .call(deactivepoint);
    let currentHost = mainsvg.select("#"+datapoint.key);

    netsvg.selectAll(".linkLineg").style('opacity',0.2);
    d3.select('#mini'+datapoint.key).style('opacity',1);
    d3.selectAll(".linkGap").style('stroke-opacity',0.1);
    d3.selectAll(".linkGap").filter(d=>d.source.key===datapoint.key||d.target.key===datapoint.key).style('stroke-opacity',1);

    if (!currentHost.select('.linkLine').empty())
        currentHost.select('.linkLine').datum(d=>d.values).call(lineConnect)
            .style('stroke',color(currentHost.datum().gap))
            .transition()
            .duration(2000)
            .attrTween("stroke-dasharray", tweenDash);
    else
        currentHost
            .append('path').datum(d=>d.values).call(lineConnect)
            .style('stroke',color(currentHost.datum().gap))
            .transition()
            .duration(2000)
            .attrTween("stroke-dasharray", tweenDash);
    function tweenDash() {
        var l = this.getTotalLength(),
            i = d3.interpolateString("0," + l, l + "," + l);
        return function (t) { return i(t); };
    }
}
function mouseleaveHandel(datain){
    tip.hide();
    // let timestep = datain.key;
    // let datapoint = datain.values;
    let cpoint = mainsvg.selectAll(".gCategory")
        .transition().duration(200)
        .call(activepoint);
    mainsvg.selectAll(".linkLine").style("opacity",0.5);
    netsvg.selectAll(".linkLineg").style('opacity',1);
    netsvg.selectAll(".linkGap").style('stroke-opacity',0.3);
}