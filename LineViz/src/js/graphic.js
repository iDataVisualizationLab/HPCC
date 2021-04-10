// plugin
d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};


// setting
let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d) {
    return `<span>${d}</span>`
})
let graphicopt = {
    margin: {top: 40, right: 40, bottom: 80, left: 80},
    width: window.innerWidth,
    height: window.innerHeight,
    scalezoom: 1,
    zoom: d3.zoom(),
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
    centerX: function () {
        return this.margin.left + this.widthG() / 2;
    },
    centerY: function () {
        return this.margin.top + this.heightG() / 2;
    },
    "diameter": function () {
        return Math.min(this.widthG(), this.heightG())
    },
    color: {},
    animationTime: 500,
    displayThreshold: 4000,
    radaropt: {
        r: 20,
        padding: 0.1
    }
};

let isFreeze = false;
let highlight2Stack = [];
let vizservice = [];

function initdraw() {
    $('.informationHolder').draggable({handle: ".card-header", scroll: false});
    d3.select('#userSort').on('change', function () {
        currentDraw(serviceSelected);
    });
    d3.select('#innerDisplay').on('change', function () {
        d3.selectAll('.innerName').text(getInnerNodeAttr())
        currentDraw(serviceSelected);
    });
    d3.select('#sort_apply').on('click', function () {
        sortData();
        currentDraw(serviceSelected)
    });

    try {
        noUiSlider.create(d3.select('.filterView').node(), {
            start: 0,
            step: 0.1,
            orientation: 'horizontal', // 'horizontal' or 'vertical'
            range: {
                'min': 0,
                'max': 1,
            },
        });
    } catch (e) {
    }
}

function closeToolTip() {
    d3.select('.informationHolder').classed('hide', true);
}

function getUsersort() {
    return $('#userSort').val()
}

function getInnerNodeAttr() {
    return $('#innerDisplay').val()
}

let userColor = d3.scaleOrdinal(d3.schemeCategory20);

function draw() {

    isFreeze = false;
    graphicopt.width = document.getElementById('circularLayoutHolder').getBoundingClientRect().width;
    graphicopt.height = 400//document.getElementById('circularLayoutHolder').getBoundingClientRect().height;
    graphicopt.displayThreshold = graphicopt.widthG() * graphicopt.heightG() / 100;

    //color
    const colorItem = d3.scaleOrdinal(d3.schemeCategory10).domain(Object.keys(jobs));
    const legend = d3.select('#joblegend').selectAll('div.legendI').data(colorItem.domain())
        .join('div')
        .attr('class','legendI col-12 row');
    legend.selectAll('div.line').data(d=>[d])
        .join('div')
        .attr('class','line col-4')
        .style('border-top',d=>`1px solid ${colorItem(d)}`)
        .style('width','100px')
        .style('margin','auto')
        .style('height',0);
    legend.selectAll('span').data(d=>[d])
        .join('span')
        .attr('class','line col-8')
        .text(d=>d);

    //symbol
    debugger

    xscale = d3.scaleTime().domain([sampleS.timespan[0],sampleS.timespan[sampleS.timespan.length-1]]).range([0,graphicopt.widthG()]);
    // init svg
    d3.select('#circularLayoutHolder').selectAll('svg.holder')
        .data(serviceFullList)
        .join('svg')
        .each(function (s,si) {
            setTimeout(()=> {
                drawService(s,si, d3.select(this));
            },0);
        });

    function drawService(s,si, svg_) {
        svg_ = svg_
            .attr("width", graphicopt.width)
            .attr("height", graphicopt.height)
            .style('overflow', 'visible');
        let svg = svg_
            .select("g.content");

        let isFirst = false;
        let gaxis = svg.select('g.axis');
        if (svg.empty()) {
            svg = svg_
                // .call(graphicopt.zoom.on("zoom", zoomed))
                .attr("width", graphicopt.width)
                .attr("height", graphicopt.height)
                .append("g")
                .attr('class', 'content')
                .attr("transform", "translate(" + (graphicopt.margin.left) + "," + graphicopt.margin.top + ")")
                .on('click', () => {
                    if (isFreeze) {
                        const func = isFreeze;
                        isFreeze = false;
                        func();
                    }
                });
            gaxis = svg.append('g').attr('class', 'axis');
            let gaxisx = gaxis.append('g').attr('class', 'axisXg');
            gaxisx.append('g').attr('class', 'axisX');
            gaxisx.append('text').attr('class', 'axisX');
            let gaxisy = gaxis.append('g').attr('class', 'axisYg');
            gaxisy.append('g').attr('class', 'axisY');
            gaxisy.append('text').attr('class', 'axisY');
            gaxis.append('g').attr('class', 'axisFeature');
            gaxis.append('defs');
            svg.call(tooltip);
        }
        let yscale = d3.scaleLinear().domain(s.range).range([graphicopt.heightG(),0]);
        const lineFunc = d3.line().x(d=>xscale(d.key)).y(d=>yscale(d.value)).defined(d=>d);
        gaxis.select('g.axisXg').attr('transform', `translate(0,${yscale.range()[0]})`).select('g.axisX').call(d3.axisBottom(xscale));
        gaxis.select('g.axisXg').select('text.axisX').text('Time')
            .style('font-weight', 'bold').style('text-anchor', 'middle')
            .attr('transform', `translate(${graphicopt.widthG()/2},${30})`);
        gaxis.select('g.axisYg').attr('transform', `translate(${xscale.range()[0]},0)`).select('g.axisY').call(d3.axisLeft(yscale));
        gaxis.select('g.axisYg').select('text.axisY').text(s.text).style('font-weight', 'bold').style('text-anchor', 'middle')
            .attr('transform', `translate(-30,${graphicopt.heightG()/2}) rotate(-90)`);
        const data = Object.keys(tsnedata).map(comp=>{
            return {key:comp,values:Object.keys(sampleS[comp].jobs).map((jid,ji)=>{
                return {key:jid,shift:ji, values:sampleS[comp].jobs[jid].map(d=>({key:d.key, value:d.values[si]}))};
            })}
        });

        svg.selectAll('g.lines')
            .data(data,d=>d.key)
            .join('g')
            .attr('class','lines')
            .selectAll('path.line')
            .data(d=>d.values)
            .join('path')
            .attr('class','line')
            .attr('transform',d=>`translate(0,${d.shift})`)
            .attr('stroke',d=>colorItem(d.key))
            .attr('stroke-width',1)
            .attr('fill','none')
            .attr('d',d=>lineFunc(d.values))
    }

    debugger

    // scale


    function freezeHandle() {
        if (isFreeze) {
            const func = isFreeze;
            isFreeze = false;
            func();
        } else {
            isFreeze = true;
            isFreeze = (function () {
                d3.select(this).dispatch('mouseout')
            }).bind(this);
            d3.event.stopPropagation();
        }
    }


    function hightlight(axisName) {
        svg.classed('onhighlight', true);
        d3.select('.legendView').classed('onhighlight', true);
        d3.selectAll('.' + fixName2Class(axisName)).classed('highlight', true);
    }

    function unhightlight() {
        svg.classed('onhighlight', false);
        d3.select('.legendView').classed('onhighlight', false);
        d3.selectAll('.highlight').classed('highlight', false);
    }

}

function textcolor(p) {
    return p.style('fill', d => {
        if (d.children)
            return '#ffffff';
        else
            return invertColor(d.color, true);
    }).style('text-shadow', function (d) {
        if (d.children)
            return '#000000' + ' 1px 1px 0px';
        else
            return invertColor(invertColor(d.color, true), true) + ' 1px 1px 0px';
    })
}

function invertColor(hex, bw) {
    try {
        const color = d3.color(hex)
        var r = color.r,
            g = color.g,
            b = color.b;
        if (bw) {
            // http://stackoverflow.com/a/3943023/112731
            return (r * 0.299 + g * 0.587 + b * 0.114) > 186
                ? '#000000'
                : '#FFFFFF';
        }
        // invert color components
        color.r = (255 - r);
        color.g = (255 - g);
        color.b = (255 - b);
        // pad each with zeros and return
    } catch (e) {
        return 'none'
    }
    return color.toString();
}


let nest = function (seq, keys) {
    if (!keys.length)
        return seq;
    let first = keys[0];
    let rest = keys.slice(1);
    return _.mapValues(_.groupBy(seq, first), function (value) {
        return nest(value, rest)
    });
};

function pack(data) {
    return d3.pack()
        .size([graphicopt.diameter() / 5 * 3, graphicopt.diameter() / 5 * 3])
        .padding(3)
        (d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value))
}

function mouseover(d, renderFunc) {
    renderFunc();
    if (!isFreeze) {     // Bring to front
        try {
            Object.values(d.user).forEach(e => {
                e.el.classed('highlight', true);
            });
        } catch (e) {

        }
        graphicopt.el.classed('onhighlight', true);
        d3.selectAll('.links .link').sort(function (a, b) {
            return d.relatedLinks.indexOf(a.node);
        });
        d3.select(this).classed('highlight', true);
        // renderFunc();
        if (d.node) {
            d.node.classed('highlight', true);
        }
        // for (let i = 0; i < d.relatedNodes.length; i++)
        // {
        //     if (d.relatedNodes[i].key)
        //         try {
        //             d.relatedNodes[i].childrenNode[d.relatedNodes[i].key].classed('highlight', true);
        //         }catch(e){
        //             console.log(d.relatedNodes[i].key)
        //         }
        //     else {
        //         d.relatedNodes[i].node.classed('highlight', true);
        //
        //     }
        //     // .attr("width", 18).attr("height", 18);
        // }
        //
        // for (let i = 0; i < d.relatedLinks.length; i++){
        //     d.relatedLinks[i].moveToFront().classed('highlight', true);
        // }
    } else {
        // if (d.comp)
        //     renderFunc(Object.values(d.comp)).classed('highlight',true);
    }
    if (d.tooltip) {
        // tooltip.show(`(${d3.format('.2f')(d[0])},${d3.format('.2f')(d[1])})`)
        tooltip.show(d.name)
    }
}

function getScale(sol) {
    let xrange = d3.extent(sol, d => d[0]);
    let yrange = d3.extent(sol, d => d[1]);
    let xscale = d3.scaleLinear().range([-graphicopt.widthG() / 2, graphicopt.widthG() / 2]);
    let yscale = d3.scaleLinear().range([graphicopt.heightG() / 2, -graphicopt.heightG() / 2]);
    const ratio = graphicopt.heightG() / graphicopt.widthG();
    if ((yrange[1] - yrange[0]) / (xrange[1] - xrange[0]) > graphicopt.heightG() / graphicopt.widthG()) {
        yscale.domain(yrange);
        let delta = ((yrange[1] - yrange[0]) / ratio - (xrange[1] - xrange[0])) / 2;
        xscale.domain([xrange[0] - delta, xrange[1] + delta])
    } else {
        xscale.domain(xrange);
        let delta = ((xrange[1] - xrange[0]) * ratio - (yrange[1] - yrange[0])) / 2;
        yscale.domain([yrange[0] - delta, yrange[1] + delta])
    }

    const extentX = xrange.map(xscale);
    extentX[0] = extentX[0] - graphicopt.radaropt.r / 2;
    extentX[1] = extentX[1] + graphicopt.radaropt.r / 2;
    const extentY = yrange.map(yscale);
    extentY[0] = extentY[0] + graphicopt.radaropt.r / 2;
    extentY[1] = extentY[1] - graphicopt.radaropt.r / 2;
    console.log(yrange, extentY)
    console.log(yrange, extentY.map(yscale.invert))
    xscale = xscale.copy().domain(extentX.map(xscale.invert)).range(extentX)
    yscale = yscale.copy().domain(extentY.map(yscale.invert)).range(extentY)
    return {xscale, yscale}
}

function mouseout(d, extra) {
    if (!isFreeze) {
        extra();
        // graphicopt.el.select('.extra_nodes').selectAll('*').remove();
        graphicopt.el.classed('onhighlight', false);
        d3.select(this).classed('highlight', false);
        graphicopt.el.selectAll('.highlight').classed('highlight', false);
        if (d.node) {
            d.node.classed('highlight', false).classed('highlightSummary', false);
        }
        // for (let i = 0; i < d.relatedNodes.length; i++)
        // {
        //     if (d.relatedNodes[i].key)
        //         try {
        //             d.relatedNodes[i].childrenNode[d.relatedNodes[i].key].classed('highlight', false);
        //         }catch(e){
        //
        //         }
        //     else
        //         d.relatedNodes[i].node.classed('highlight', false);
        //     // .attr("width", config.rect_width).attr("height", config.rect_height);
        // }
        //
        // for (let i = 0; i < d.relatedLinks.length; i++){
        //     d.relatedLinks[i].classed("highlight", false );
        // }
    } else {
        if (d.comp)
            extra();
    }
    if (d.tooltip) {
        tooltip.hide()
    }
}

function angle2position(angle, radius) {
    return [Math.sin(angle / 180 * Math.PI) * radius, -Math.cos(angle / 180 * Math.PI) * radius];
}

function circlePath(cx, cy, r) {
    return 'M ' + cx + ' ' + cy + ' m -' + r + ', 0 a ' + r + ',' + r + ' 0 1,0 ' + (r * 2) + ',0 a ' + r + ',' + r + ' 0 1,0 -' + (r * 2) + ',0';
}

