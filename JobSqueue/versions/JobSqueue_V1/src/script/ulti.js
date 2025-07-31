//


function checkConf(namekey) {
    var retrievedObject = localStorage.getItem(namekey);
    if (retrievedObject!=null&&retrievedObject!==undefined&&retrievedObject!=="undefined") {
        conf[namekey] = JSON.parse(retrievedObject);
        // console.log('retrievedObject: ', JSON.parse(retrievedObject));
    } else {
        saveConf(namekey);
    }
}

function saveConf(namekey) {
    localStorage.setItem(namekey, JSON.stringify(conf[namekey]));
}

function openNav() {
    d3.select("#mySidenav").classed("sideIn",true);
    d3.select("#Maincontent").classed("sideIn",true);
    // _.delay(resetSize, 500);
}

function closeNav() {
    d3.select("#mySidenav").classed("sideIn",false);
    d3.select("#Maincontent").classed("sideIn",false);
    // _.delay(resetSize, 500);
}

function drawLegend(s,arrThresholds, arrColor, dif){
    colorbyValue(orderLegend);
    legendw =400;
    legendh =arrThresholds.length*20;
    let m = {l:40,r:0,t:10,b:10}; // magrin
    let lh = legendh - m.t -m.b;
    var r = 20;
    barw = legendw - m.l -m.r -r ;
    barScale.range([0,barw]);
    let lg = svgLengend.select('g');
    if (lg.empty())
        lg = svgLengend.append('g').attr('transform', "translate(" + m.l + "," + m.t + ")");
    var xStep = dif/10.;
    var xStepLength = (arrThresholds[arrThresholds.length-1]-arrThresholds[0])/xStep;

    var pct = linspace(0, 100, xStepLength).map(function(d) {
        return Math.round(d);
    });
    let yScale = d3.scaleLinear().range([0,lh]).domain(d3.extent(arrThresholds).reverse());
    let gap = d3.scaleLinear()
        .domain([0, 100]) // input
        .range(d3.extent(arrThresholds)); // output
    let yAxis = lg.call(d3.axisLeft(yScale)
        .tickValues(arrThresholds));
    var gradient = svgLengend.select('#gradient');
    if (gradient.empty())
        gradient = svgLengend.append('defs')
        .append('linearGradient')
        .attr('id', 'gradient')
        .attr('x1', '0%') // bottom
        .attr('y1', '100%')
        .attr('x2', '0%') // to top
        .attr('y2', '0%')
        .attr('spreadMethod', 'pad');
    gradient.selectAll('stop').data(pct)
        .join('stop')
            .attr('offset',d=> d+"%")
            .attr('stop-color',d=> color(gap(d)))
            .attr('stop-opacity',d=> opa(gap(d)));
    if (svgLengend.select('#colorBarlegend').empty())
        lg.append('rect')
            .attr('id','colorBarlegend')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('width', r)
            .attr('height', lh)
            .style('fill', 'url(#gradient)');

    svgLengend.attr("height", legendh).attr("width", legendw);
    /*
    var legend_data = lg
        .selectAll(".row")
        .data( colors.domain(),d=>d);
    let arr = arrThresholds.slice();
    let smallarr = arr[0] - arr[1]+arr[0];
        arr = arr.reverse();
    let revertThreshold = arr.slice(1);
    revertThreshold.push(smallarr);
    var legendAll = legend_data.join(
        enter=>{
            let legend = enter.append("g")
                .attr("title", "Hide group")
                .attr('class','row')
                .attr('transform',(d,i)=> "translate(" + r + "," + yScale(orderLegend[i].value) + ")");
            legend
                .append("rect")
                .style("opacity",0.85)
                .style('width',0)
                .style('height',(d,i)=>yScale(revertThreshold[i])-yScale(orderLegend[i].value))
                .attr('fill',d=>colors(d))
                .attr("class", "color-bar");

            legend
                .append("text")
                .attr("class", "tally")
                .style("text-anchor","start")
                .attr("y",(d,i)=>(yScale(revertThreshold[i])-yScale(orderLegend[i].value))/2)
                .attr("dx",'1em')
                .text(function(d,i) { return 0});

            legend
                .append("rect")
                .attr("class", "invisibleRect")
                .style("fill","#ffffff")
                .style("opacity",0)
                .style('width',barw)
                .style('height',(d,i)=>yScale(revertThreshold[i])-yScale(orderLegend[i].value));

            return legend;
        },update =>{
            let legend = update.selectAll(".row");
            legend
                .selectAll(".color-bar")
                .style("opacity",0.85)
                .style('width',0)
                .attr('fill',d=>colors(d));

            legend
                .selectAll(".tally")
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

    return lg.selectAll(".row");
    */
}

function linspace(start, end, n) {
    var out = [];
    var delta = (end - start) / (n - 1);

    var i = 0;
    while(i < (n - 1)) {
        out.push(start + (i * delta));
        i++;
    }

    out.push(end);
    return out;
}

function switchTheme(){
    if (this.value==="light"){
        this.value = "dark";
        this.text = "Light";
        d3.select('body').classed('light',false);
        d3.select('.logoLink').select('img').attr('src',"https://idatavisualizationlab.github.io/HPCC/HiperView/images/TTUlogoWhite.png");
        return;
    }
    this.value = "light";
    this.text = "Dark";
    d3.select('body').classed('light',true);
    d3.select('.logoLink').select('img').attr('src',"https://idatavisualizationlab.github.io/HPCC/HPCViz/images/TTUlogo.png");
    return;
}
function discovery(d){
    d3.select(d).style('left','20px')
        .classed("pulse",true)
        .transition().delay(5000).duration(1000)
        .style('left',null).on('end',function() {
        d3.select(d).classed("pulse",false);
    });

}