function AsynChart(){
    // init
    let graphicopt = {
        contain: '#heatmap',
        margin: {top: 0, right: 0, bottom: 0, left: 0},
        width: 1500,
        height: 1000,
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
        }
    };
    // local parameter
    let master={};
    let render_stats = ()=>{};
    let selection_stats = ()=>{};
    let timel;
    let scheme = {
        __color: {key:"color",type:'Linear'},
        __data: [],
        __x: {key:"",type:"Band"},
        __y: {key:"",type:"Band"},
        mark: {type:"rect"},
        get x(){return this.__x},
        set x(value){this.__x = value; onChangeVairableX(scheme.__x);},
        get y(){return this.__y},
        set y(value){this.__y = value; onChangeVairableY(scheme.__y);},
        get color(){return this.__color},
        set color(value){this.__color = value; onChangeColor();},
        get data() { return this.__data; },
        set data(value) {
            this.__data = value; onChangedata(); }
    };
    let foreground,
        foreground_opacity=1,
        background,
        highlighted,
        legend,
        tooltip,
        render_speed = 50,
        svg,g;
    let container;
    function initscreen(){
        container = d3.select(graphicopt.contain)
            .style('width',graphicopt.width+'px')
            .style('height',graphicopt.height+'px');
        // Foreground canvas for primary view
        let foreground_obj = container.select('canvas.foreground');
        if (foreground_obj.empty()) {
            foreground_obj = container.append('canvas')
                .attr('class','foreground')
                .style('position','absolute')
                .style('top',0)
                .style('left',0);
        }
        foreground = foreground_obj.node().getContext('2d');
        foreground.globalCompositeOperation = "destination-over";
        foreground_obj.attr('width',graphicopt.width).attr('height',graphicopt.height);
        foreground.strokeStyle = "rgba(0,100,160,0.1)";
        foreground.lineWidth = 1.7;
        foreground.fillText("Loading...", graphicopt.width / 2, graphicopt.height / 2);
        foreground_obj.on('mouseover',null);
        // Highlight canvas for temporary interactions
        let highlighted_obj = container.select('canvas.highlighted');
        if (container.select('canvas.highlighted').empty()) {
            highlighted_obj = container.append('canvas').attr('class','highlighted')
                .style('position','absolute')
                .style('top',0)
                .style('left',0);
        }
        highlighted = highlighted_obj.classed('hide',true).node().getContext('2d');
        highlighted_obj.attr('width',graphicopt.width).attr('height',graphicopt.height);
        highlighted.strokeStyle = "rgba(0,100,160,1)";
        highlighted.lineWidth = 4;
        // Background canvas
        let background_obj = container.select('canvas.background');
        if (background_obj.empty()) {
            background_obj = container.append('canvas').attr('class','background')
                .style('position','absolute')
                .style('top',0)
                .style('left',0);
        }
        background_obj.attr('width',graphicopt.width).attr('height',graphicopt.height).classed('hide',true);
        background = background_obj.node().getContext('2d');
        background.strokeStyle = "rgba(0,100,160,0.1)";
        background.lineWidth = 1.7;

        svg = container.select("svg.chart");
        if (svg.empty()) {
            svg = container.append('svg')
                .attr('class','chart')
                .attr("width", graphicopt.width)
                .attr("height", graphicopt.height);
        }
        svg.selectAll('*').remove();
        g = svg.append("svg:g")
        // .attr("transform", "translate(" + graphicopt.margin.left + "," + graphicopt.margin.top + ")");
        let axis_g = g.append('g').attr('class','axis');
        axis_g.append('g').attr('class','xaxis');
        axis_g.append('g').attr('class','yaxis');
        axis_g.append('g').attr('class','title').attr('transform',`translate(${graphicopt.margin.left+graphicopt.widthG()/2},${graphicopt.margin.top/3*2})`);
        makelegend();

        tooltip = container.select('div.tooltip');
        if (tooltip.empty()){
            tooltip = container.append('div').attr('class','tooltip')
                .style('opacity',0)
                .styles({
                    position: 'absolute',
                    display: 'inline-block',
                    padding: '10px',
                    color: '#000',
                    'background-color': '#fff',
                    border: '1px solid #999',
                    'border-radius': '2px',
                    'pointer-events': 'none',
                    opacity: 0,
                    'z-index': 1,
                });
        }
    }
    function make_axis(){
        setTimeout(function(){
            let axisx = d3.axisBottom(scheme.x.scale);
            const ticksx = (scheme.x.scale.ticks||scheme.x.scale.domain)().length;
            if (ticksx > 100) {
                if (scheme.x.axis && scheme.x.axis.tickValues) {
                    let filterFunc = new Function('datum', 'index', scheme.x.axis.tickValues)
                    axisx.tickValues(scheme.x.scale.domain().filter(filterFunc))
                }else
                    axisx.tickValues(scheme.x.scale.domain().filter((d, i) => !(i % Math.round(ticksx / 20))));
            }

            if (scheme.x.axis && scheme.x.axis.tickFormat){
                let formatFunc = new Function('datum','index',scheme.x.axis.tickFormat);
                axisx.tickFormat(formatFunc);
            }
            g.select('.xaxis').attr('transform',`translate(${0},${graphicopt.heightG()+graphicopt.margin.top})`)
                .call(axisx);
            if (scheme.y.visible===undefined|| scheme.y.visible===true) {
                let axisy = d3.axisLeft(scheme.y.scale);
                const ticksy = (scheme.y.scale.ticks||scheme.y.scale.domain)().length;
                if (ticksy > 100) {
                    if (scheme.y.axis && scheme.y.axis.tickValues) {
                        const ticksy = (scheme.y.scale.ticks || scheme.y.scale.domain)();
                        let filterFunc = new Function('datum', 'index', scheme.y.axis.tickValues);
                        axisy.tickValues(ticksy.filter(filterFunc))
                    }
                }

                g.select('.yaxis').attr('transform', `translate(${graphicopt.margin.left},${0})`)
                    .call(axisy).selectAll('.domain, line').style('display', 'none');
            }

            if (scheme.title){
                g.select('g.title').append('text').text(scheme.title.text)
                    .style('text-anchor','middle')
                    .attr('dy','0.5rem')
                    .attrs(scheme.title)
            }
        },1);
    }
    let quadTree;

    master.draw = function (){
        initscreen();
        make_axis();
        if (scheme.mark.type==="rect") {
            render_item = RECT_draw;
            const filteredData = scheme.data.value.filter(d=>d[scheme.color.key]!==undefined&&d[scheme.color.key]!==null);
            quadTree = d3.quadtree()
                .x((d)=>scheme.x.scale(d[scheme.x.key]))
                .y(d=>scheme.y.scale(d[scheme.y.key]))
                .extent([[graphicopt.margin.left, graphicopt.margin.top], [graphicopt.margin.left+graphicopt.widthG(), graphicopt.margin.top+graphicopt.heightG()]])
                .addAll(filteredData);
            const foreground_obj = container.select('canvas.foreground');
            foreground_obj.on('mousemove',function(){
                var mouse = d3.mouse(this),
                    closest = quadTree.find(mouse[0],mouse[1]);
                if(closest){
                    tooltip
                        .style('opacity', 0.8)
                        .style('top', mouse[1] + 'px')
                        .style('left', mouse[0] + 'px')
                        .html(scheme.x.key+': ' + closest[scheme.x.key] + '<br>' + scheme.y.key+': ' + closest[scheme.y.key] + '<br>' + scheme.color.key+': ' + closest[scheme.color.key]);
                } else {
                    tooltip
                        .style('opacity', 0);
                }

                // container.select('canvas.highlight').attr("cx", x(closest[0]))
                //     .attr("cy", y(closest[1]));
            }).on('mouseout',function(){
                tooltip
                    .style('opacity', 0);
            });
            // foreground_obj.on("mouseover",function(){
            //     container.select('canvas.highlight').classed("hidden", false);
            // });
            //
            // foreground_obj.on("mouseout",function(){
            //     container.select('canvas.highlight').classed("hidden", true);
            // });
            render_items(filteredData, foreground, 0);
        }else if(scheme.mark.type==="area"){
            if (scheme.mark.key) {
                scheme.mark.scale = d3.scaleLinear().domain(d3.extent(scheme.data.value,d=>d[scheme.mark.value])).range([0, -scheme.y.scale.bandwidth()*2])
                scheme.mark.path = d3.area()
                    .x(function(d) {
                        return scheme.x.scale(d[scheme.x.key]); })
                    .y0(function(d) {
                        return scheme.y.scale(d[scheme.y.key])+scheme.y.scale.bandwidth() +scheme.mark.scale(0)})
                    .y1(function(d) {
                        return scheme.y.scale(d[scheme.y.key])+scheme.y.scale.bandwidth() +scheme.mark.scale(d[scheme.mark.value]); })
                    .curve(d3.curveMonotoneX)
                    .context(foreground);
                render_item = AREA;
                let tranformedData = d3.nest().key(d => d[scheme[scheme.mark.key].key]).entries(scheme.data.value);
                tranformedData.sort((a,b)=>scheme[scheme.mark.key].scale(a.key)-scheme[scheme.mark.key].scale(b.key))
                render_items(tranformedData, foreground, 0);
            }
        }
    };

    // render code-----------
    function onChangedata(){
        onChangeVairableX(scheme.x);
        onChangeVairableY(scheme.y);
    }
    // Adjusts rendering speed
    function render_items(selected, ctx) {

        var n = selected.length,
            i = 0,
            // opacity = d3.min([2/Math.pow(n,0.3),1]),
            timer = (new Date()).getTime();

        selection_stats(n, scheme.data.value.length);
        let shuffled_data = selected;
        ctx.clearRect(0,0,graphicopt.width+1,graphicopt.height+1);

        let opacity = scheme.color.opacity;
        if(opacity===undefined)
            opacity = 1;
        // render all lines until finished or a new brush event
        function animloop(){
            if (i >= n ) {
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
        // if(isChangeData)
        //     axisPlot.dispatch('plot',selected);
    }
    // render item i to i+render_speed
    function render_range(selection, i, max, opacity) {
        selection.slice(i,max).forEach(function(d) {
            render_item(d, foreground, colorCanvas(d[scheme.color.key],opacity));
        });
    };
    function colorCanvas(d,a) {
        var c = d3.hsl(scheme.color.scale(d));
        c.opacity=a;
        return c;
    }
    const RECT_draw = function(d, ctx, color) {
        if (color) {
            ctx.fillStyle = color;
        }
        ctx.fillRect(scheme.x.scale(d[scheme.x.key]),scheme.y.scale(d[scheme.y.key]),scheme.x.scale(d[scheme.x.keyNext])-scheme.x.scale(d[scheme.x.key]),scheme.y.scale.bandwidth());
        // ctx.fillRect(scheme.x.scale(d[scheme.x.key]),scheme.y.scale(d[scheme.y.key]),1,scheme.y.scale.bandwidth());
        if (color){
            ctx.fill()
        }
    };
    let render_item = RECT_draw;
    const AREA = function(d, ctx, color) {
        ctx.beginPath();
        scheme.mark.path(d.values);
        if (color){
            ctx.fillStyle = color;
            ctx.fill()
        }
        ctx.beginPath();
        ctx.moveTo(scheme.x.scale.range()[0], scheme.y.scale(d.values[0][scheme.y.key])+scheme.y.scale.bandwidth());
        ctx.lineTo(scheme.x.scale.range()[1], scheme.y.scale(d.values[0][scheme.y.key])+scheme.y.scale.bandwidth());
        ctx.strokeStyle = '#ddd';
        ctx.stroke();
    };
    function optimize(timer) {
        var delta = (new Date()).getTime() - timer;
        render_speed = Math.max(Math.ceil(render_speed * 30 / delta), 1);
        render_speed = Math.min(render_speed, 300);
        return (new Date()).getTime();
    }

    // end render code-------
    function init_scheme(){

    }
    function onChangeColor(){
        switch (scheme.color.type) {
            case "Linear":
                scheme.__color.scale = d3.scaleSequential()
                    .interpolator(d3.interpolateSpectral);
                if (scheme.__color.domain)
                    scheme.__color.scale.domain(scheme.__color.domain.reverse());
                else
                    scheme.__color.scale.domain(d3.extent(scheme.data.value,d=>d[scheme.color.key]).reverse());
                break;
            case "Category":
                scheme.__color.scale = d3.scaleOrdinal(d3.schemeCategory10)
                // .interpolate(d3.interpolateTurbo)
                // .domain(d3.extent(scheme.data.value,d=>d[scheme.color.key]));
                break;
        }
    }
    function onChangeVairableX(variable_prop){
        if (variable_prop.key!=="") {
            variable_prop.scale = d3[`scale${variable_prop.type}`]().range([graphicopt.margin.left, graphicopt.widthG()]);
            switch (variable_prop.type) {
                case 'Band':
                    let uniqueV = _.uniq(scheme.data.value.map(d=>d[variable_prop.key]));
                    variable_prop.scale.domain(uniqueV);
                    break;
                case 'Time':
                    variable_prop.scale.domain(d3.extent(scheme.data.value,d=>d[variable_prop.key]));
                    break;
            }
        }
    }
    function onChangeVairableY(variable_prop){
        if (variable_prop.key!=="") {
            variable_prop.scale = d3[`scale${variable_prop.type}`]().range([graphicopt.heightG() + graphicopt.margin.top, graphicopt.margin.top]);
            switch (variable_prop.type) {
                case 'Band':
                    let uniqueV = _.uniq(scheme.data.value.map(d=>d[variable_prop.key]));
                    variable_prop.scale.domain(uniqueV);
                    variable_prop.scale.invert = function(value){
                        var domain = variable_prop.scale.domain();
                        var paddingOuter = variable_prop.scale(domain[0]);
                        var eachBand = variable_prop.scale.step();
                        var index = Math.floor(((value - paddingOuter) / eachBand));
                        return domain[Math.max(0,Math.min(index, domain.length-1))];
                    };
                    break;
            }
        }
    }

    function makelegend(){
        svg.select('g.legend').remove();
        let legend = svg.append('g').attr('class','legend').attr('transform',`translate(${graphicopt.width-graphicopt.margin.right},${graphicopt.margin.top})`);
        const color = scheme.color.scale;
        const marginTop = 20;
        const marginBottom = 0;
        const marginLeft = 0;
        const marginRight = 0;
        const width = 10;
        const height = 200;

        if (color.interpolate) {
            const n = Math.min(color.domain().length, color.range().length);

            let y = color.copy().rangeRound(d3.quantize(d3.interpolate(marginTop, height - marginBottom), n));

            legend.append("image")
                .attr("x", marginLeft)
                .attr("y", marginTop)
                .attr("width", width - marginLeft - marginRight)
                .attr("height", height - marginTop - marginBottom)
                .attr("preserveAspectRatio", "none")
                .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
        }// Sequential
        else if (color.interpolator) {
            let y = Object.assign(color.copy()
                    .interpolator(d3.interpolateRound(marginTop, height - marginBottom)),
                {range() { return [marginTop, height - marginBottom]; }});

            legend.append("image")
                .attr("x", marginLeft)
                .attr("y", marginTop)
                .attr("width", width - marginLeft - marginRight)
                .attr("height", height - marginTop - marginBottom)
                .attr("preserveAspectRatio", "none")
                .attr("xlink:href", ramp(color.interpolator()).toDataURL());

            // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
            if (!y.ticks) {
                if (tickValues === undefined) {
                    const n = Math.round(ticks + 1);
                    tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
                }
                if (typeof tickFormat !== "function") {
                    tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
                }
            }else{
                scheme.legend = {scale:y};
                legend.append('g').attr('class','legendTick').call(d3.axisLeft(y));
            }
        }
        if (scheme.color.title){
            legend.append('text').text(scheme.color.title).attr('y',marginTop -34).style('text-anchor','middle')
        }
        function ramp(color, n = 256) {
            const canvas = createContext(1, n);
            const context = canvas.getContext("2d");
            for (let i = 0; i < n; ++i) {
                context.fillStyle = color(i / (n - 1));
                context.fillRect(0, i, 1, 1);
            }
            return canvas;
        }
        function createContext(width, height) {
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            return canvas;
        }
    }
    // functions
    master.destroy = function(){
        if(timel)
            timel.stop;
        render_speed = 0;
    };
    master.render_stats = function (_) {
        return arguments.length ? (render_stats = _, master) : render_stats;
    };
    master.selection_stats = function (_) {
        return arguments.length ? (selection_stats = _, master) : selection_stats;
    };
    master.graphicopt = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    graphicopt[i] = __[i];
                }
            }
            return master;
        }else {
            return graphicopt;
        }

    };
    master.container = ()=>container;
    master.scheme = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    scheme[i] = __[i];
                }
            }
            init_scheme();
            return master;
        }else {
            return scheme;
        }

    };
    return master;
}

