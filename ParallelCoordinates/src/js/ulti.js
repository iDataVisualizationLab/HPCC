/// drawLegend *****************************************************************
function drawLegend(s,arrThresholds, arrColor, dif){
    var r = 20;

    var xStep = dif/10.;
    var xStepLength = (arrThresholds[arrThresholds.length-1]-arrThresholds[0])/xStep;

    var pct = linspace(0, 100, xStepLength).map(function(d) {
        return Math.round(d);
    });
    let gap = d3.scaleLinear()
        .domain([0, 100]) // input
        .range(d3.extent(arrThresholds)); // output
    var gradient = svgLengend.select('#gradient');
    if (gradient.empty())
        gradient = svgLengend.append('defs')
        .append('linearGradient')
        .attr('id', 'gradient')
        .attr('x1', '0%') // bottom
        .attr('y1', '0%')
        .attr('x2', '0%') // to top
        .attr('y2', '100%')
        .attr('spreadMethod', 'pad');
    gradient.selectAll('stop').data(pct)
        .join('stop')
            .attr('offset',d=> d+"%")
            .attr('stop-color',d=> color(gap(d)))
            .attr('stop-opacity',d=> opa(gap(d)));
    if (svgLengend.select('#colorBarlegend').empty())
        svgLengend.append('rect')
            .attr('id','colorBarlegend')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('width', r)
            .attr('height', arrThresholds.length*16)
            .style('fill', 'url(#gradient)');

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