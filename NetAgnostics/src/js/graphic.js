;// plugin
d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};
//general function
let vizservice = [];

function serviceControl() {
    vizservice = serviceFullList.slice();
    const customAxis ={};
    vizservice.forEach((s, si) => {
        s._id = si;
        s.thresholdFilter = Math.round((s.range[1] - s.range[0]) * 0.9 + s.range[0]);
        s.thresholdFilterNormalize = 0.9;
        customAxis[s.text]={range:[0,1],displayRange:s.range}
    });

    d3.select('#serviceSelectionSelection')
        .on('change',function(){
            serviceSelected = +$(this).val();
            currentDraw(serviceSelected);
        })
        .selectAll('option')
        .data(vizservice)
        .join('option')
        .attr('value',(d,i)=>i)
        .attr('class',d=>d.text==='User'?'innerName':null)
        .attr('data-value',(d,i)=>d)
        .attr('selected',(d,i)=>i===serviceSelected?'':null)
        .text(d=>d.text)

    drawObject.service(vizservice);

    d3.selectAll('.serviceName').text(vizservice[serviceSelected]?vizservice[serviceSelected].text:'')
    const tr = d3.select('#serviceSelection')
        .selectAll('tr')
        .data(vizservice)
        .join('tr');
    tr.selectAll('td.input').data(d => [d])
        .join('td').attr('class', 'input')
        .html(d => `<input type="checkbox" value="${d._id}">`)
        .each(function (d) {
            d3.select(this).select('input')
                .on('change', function () {
                    d._filter = this.checked;
                    d3.select(this.parentNode.parentNode).select('.silderHolder').attr('disabled',this.checked?null:'')
                })
        });
    tr.selectAll('td.title').data(d => [d])
        .join('td').attr('class', 'title')
        .text(d => d.text);
    tr.selectAll('td.rangeLow').data(d => [d])
        .join('td').attr('class', 'rangeLow')
        .style('text-align', 'right')
        .text(d => d.range[0]);
    tr.selectAll('td.range').data(d => [d])
        .join('td').attr('class', 'range')
        .html(d => `<div class="silderHolder" style="width:60px"></div>`).each(function (d) {
        const div = d3.select(this).select('.silderHolder').attr('disabled','').node();
        try {
            noUiSlider.create(div, {
                start: d.thresholdFilter,
                tooltips: {
                    to: function (value) {
                        return d3.format('.1f')(value)
                    }, from: function (value) {
                        return +value.split('1e')[1];
                    }
                },
                step: 0.5,
                orientation: 'horizontal', // 'horizontal' or 'vertical'
                range: {
                    'min': d.range[0],
                    'max': d.range[1],
                },
            });
            div.noUiSlider.on("change", function () { // control panel update method
                d.thresholdFilter = +this.get();
                d.thresholdFilterNormalize = (+this.get() - d.range[0]) / (d.range[1] - d.range[0]);
            });
        }catch(e){}
    });
    tr.selectAll('td.rangeHigh').data(d => [d])
        .join('td').attr('class', 'rangeHigh')
        .style('text-align', 'left')
        .text(d => d.range[1]);

    const dataLine = [{text:'--none--',_index:false},...vizservice];
    d3.select('#lineChartOption').selectAll('option')
        .data([{text:'--none--',_id:false},...vizservice])
        .join('option')
        .attr('value',d=>d._id)
        .text(d=>d.text)
    d3.select('#lineChartOption').on('change',function(){
           drawObject.onShowLineChart(dataLine[this.selectedIndex]._id)
        });


    d3.select('#paraDimColtrol').selectAll('option')
        .data([...serviceFullList.map(s=>s.text),'Duration','#Computes'])
        .join('option')
        .attr('value',d=>d)
        .attr('selected','selected')
        .text(d=>d);

}

function initdraw() {
    $('.informationHolder').draggable({handle: ".card-header", scroll: false});

    d3.select('#innerDisplay').on('change', function () {
        d3.selectAll('.innerName').text(getInnerNodeAttr())
        currentDraw(serviceSelected);
    });
    d3.select('#sort_apply').on('click', function () {
        sortData();
        currentDraw()
    });
    d3.select('#nodeColor').on('change', function () {
        const val = $(this).val();
        drawObject.graphicopt({colorMode: val});
        if (val === '') {
            d3.select('.MetricsLegend').classed('hide', false);
            d3.select('.RackLegend').classed('hide', true);
        } else {
            d3.select('.MetricsLegend').classed('hide', true);
            let svg = d3.select('.RackLegend').classed('hide', false)
                .select('svg');
            let g = svg.select('g.content');
            let color = getColorScale();
            let padding = 16;
            let margin = {top: 10, left: 70, right: 0, bottom: 0};
            let w = 280;
            let h = (color.domain().length + 1) * padding;
            svg.attr('width', w + margin.left + margin.right).attr('height', h + margin.top + margin.bottom);
            g.attr('transform', `translate(${margin.left},${margin.top})`)
            let rackel = g.selectAll('.rackEl').data(color.domain().map((d, i) => ({key: d, value: color.range()[i]})))
                .join('g')
                .attr('class', 'rackEl').attr('transform', (d, i) => `translate(0,${i * padding})`);
            rackel.selectAll('circle.dot').data(d => [d]).join('circle').attr('class', 'dot')
                .style('r', 3)
                .style('fill', d => d.value);
            rackel.selectAll('text.dot').data(d => [d]).join('text').attr('class', 'dot')
                .attr('x', 5).attr('dy', 5)
                .text(d => d.key)
                .style('fill', d => d.value);
        }
        currentDraw()
    });
    serviceControl();
    const outlyingCoefficient = d3.select('#outlyingCoefficient').node();
    noUiSlider.create(outlyingCoefficient, {
        start: 1.5,
        tooltips: {
            to: function (value) {
                return d3.format('.1f')(value)
            }, from: function (value) {
                return +value.split('1e')[1];
            }
        },
        step: 0.1,
        orientation: 'horizontal', // 'horizontal' or 'vertical'
        range: {
            'min': 1.1,
            'max': 4,
        },
    });


    d3.select('#jobShow').on('change', function () {
        Layout.jobShow = this.checked;
        createdata();
        currentDraw();
    });

    drawObject.init().getColorScale(getColorScale);
        // .onFinishDraw(makelegend)
    // .onFinishDraw(updateNarration);
    // initDragItems('#ForceByMetrics','metric');

    d3.select('#modelFilterToolBtn').on('click', function () {
        const choice = $('#modelFilterToolInput').val();
        d3.select(this).text('Applied')
        Layout.userTimeline = filterData(choice, Layout.netFull);
        getChanged(Layout.userTimeline);
        // drawObject.graphicopt({plotMetric: choice.length !== 0})
        drawGantt();
    });
    d3.select('#filter_apply').on('click', function () {
        onFilter();
    });

    d3.select('#minMaxScale').on('change',function(){

    })
}

function onFilter() {
    const nodes = $('#modelFilterToolInput').val();
    let noFilter = !nodes.length;
    let hasResult = false;
    const lists = vizservice.filter(s => s._filter);
    let nodeobj = {};
    nodes.forEach(d => nodeobj[d]=true);
    if (lists.length) {
        Layout.netFull.root_nodes.forEach(d => {
            if (Layout.netFull.datamap[d.id] && !nodeobj[d.id]) {
                let condition = false;
                Layout.netFull.datamap[d.id].find(e => {
                    let con = true;
                    lists.forEach(f =>{
                        con = con && e[f._id] >= f.thresholdFilterNormalize
                    });
                    condition = con;
                    return condition;
                });
                if (condition){
                    nodes.push(d.id);
                    nodeobj[d.id]=true;
                }
            }
        });
    }
    const clusterLists = d3.select('#clusterFilterDisplay').selectAll('.radarCluster').select('.label').select('.filterCheck').filter(function(d){return this.checked}).data()
        .map(d=>d.data);
    if (clusterLists.length){
        clusterLists.forEach(c=>c.arr.forEach(t=>{
            t.forEach(n=>{
                if (!nodeobj[n]){
                    nodes.push(n);
                    nodeobj[n]=true;
                }
            });
        }))

    }
    const notFound = noFilter&&!nodes.length&&(lists.length||clusterLists.length);
    if (notFound)
        d3.select('#filter_results').text('No results!');
    else
        d3.select('#filter_results').text('');
    Layout.userTimeline = filterData(notFound?undefined:nodes, Layout.netFull);
    getChanged(Layout.userTimeline);
    // drawObject.graphicopt({plotMetric: nodes.length !== 0})
    drawGantt();
}

function drawClusterFilter(){
    cluster_map(cluster_info,'#clusterFilterDisplay',{w:88,h:88,events:undefined,className:'radarhMini'},()=>{
        const holder =  d3.select('#clusterFilterDisplay').selectAll('.label');
        holder.select('.clusternum').style('display','none');
        holder.selectAll('input.filterCheck').data(d=>d)
            .join(enter=>{
                enter.insert("input",":first-child")
                    .attr("class","filterCheck")
                    .attr("type","checkbox");
            })
    });
}

function userTable(d, type) {
    if (drawObject.isFreeze()) {
        d3.select('.informationHolder').classed('hide', false);
        const contain = d3.select('.informationHolder').datum(d);
        contain.select('.card-header p').text(d => type.toUpperCase() + ': ' + (type === 'compute' ? d.data.name : d.id));
        contain.select('.card-body').html(`<table id="informationTable" class="display table-striped table-bordered" style="width:100%">
                <thead>
                    <tr>
                        <th>JobID</th>
                        <th>JobName</th>
                        <th>User</th>
                        <th>StartTime</th>
                        <th>Duration</th>
                        <th>Cores</th>
                        <th>Nodes</th>
                        <th>TaskID</th>
                    </tr>
                </thead>
            </table>
            <svg id="tooltipLineChart" style="width:100%;background-color:white;">
            <defs><marker id="arrow" viewBox="0 -5 10 10" refX="5" refY="0" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,-5L10,0L0,5" class="arrowHead" fill="black"></path></marker>
            <marker id="endTick" viewBox="-5 -5 10 10" refX="5" refY="0" markerWidth="4" markerHeight="4" orient="auto"><circle r=5 fill="black"></circle></marker></defs>
            <g class="content"><rect class="background"></rect><rect class="highlight hide"></rect><g class="timeMark"><line></line></g>
            <g class="lineChart"></g><g class="xaxis"></g><g class="yaxis"></g><g class="jobs"></g></g></svg>`);
        let jobData = [];
        let nodelist = [];
        let colorMap = {};
        if (type === 'user' || type === 'job') {
            debugger
            jobData = d.data.job.map(j => {
                const jobID = j.split('.');
                const job = _.clone(Layout.jobs[j]);
                job['id'] = jobID[0];
                job['_id'] = j;
                job['duration'] = Layout.currentTime - job['start_time'];
                job['task_id'] = jobID[1] || 'n/a';
                return job
            });
            nodelist = _.isArray(d.data.node) ? d.data.node : Object.keys(d.data.node);
            if (d.relatedNodes[0].type === 'job')
                d.relatedNodes.forEach(f => f.relatedNodes.forEach(e => colorMap[e.key] = e.color));
            else
                d.relatedNodes.forEach(e => colorMap[e.key] = e.color);
        } else {
            jobData = d.data.jobId.map(j => {
                const jobID = j.split('.');
                const job = _.clone(Layout.jobs[j]);
                if (job.node_list.indexOf(d.data.name) === -1)
                    return false;
                job['id'] = jobID[0];
                job['_id'] = j;
                job['duration'] = Layout.currentTime - job['start_time'];
                job['task_id'] = jobID[1] || 'n/a';
                return job
            }).filter(d => d);
            nodelist = [d.data.name];
            colorMap[d.data.name] = d.color
        }
        var table = $('#informationTable').DataTable({
            "data": jobData,
            "scrollX": true,
            "columns": [
                {"data": "id"},
                {"data": "job_name"},
                {"data": "user_name"},
                {
                    "data": "start_time",
                    "render": function (data, type, row) {
                        if (type !== 'ordering')
                            return d3.timeFormat('%m/%d/%Y %H:%M')(new Date(data));
                        return data;
                    }
                },
                {
                    "data": "duration",
                    "render": function (data, type, row) {
                        if (type !== 'ordering')
                            return millisecondsToStr_axproximate(data);
                        return data;
                    }
                },
                {"data": "cpu_cores"},
                {
                    "data": "node_list", "className": 'details-control text-wrap',
                    "render": function (data, type, row) {
                        if (type === 'ordering')
                            return data.length;
                        if (type === 'display')
                            if (data.length > 2)
                                return `<span>${(row.isexpand ? data : data.slice(0, 2)).map(e => `<span class="tableCompute">${e}</span>`).join('\n')}</span>
                                        <button type="button" class="btn btn-block morebtn" value="open">${data.length - 2} more</button>
                                        <button type="button" class="btn btn-block morebtn" value="close">
                                        <img src="src/style/icon/caret-up-fill.svg" style="height: 10px"></img>
                                        </button>`;
                            else
                                return data.map(e => `<span class="tableCompute">${e}</span>`).join('\n');
                        return data;
                    }
                },
                {"data": "task_id"},
            ],
            "order": [[0, 'asc']],
            "drawCallback": function (settings) {
                // Add event listener for opening and closing details
                // $('#informationTable tbody').on('mouseover', 'tr, .tableCompute', function (event) {
                //     event.stopPropagation();
                //     highlight2Stack.forEach(n=>n.classed('highlight2',false))
                //     highlight2Stack = [];
                //     let tr = $(this).closest('tr');
                //     let row = table.row( tr );
                //     d3.select(tr[0]).style('font-weight','unset');
                //     d3.select(this).style('font-weight','bold');
                //     const isSingle =  d3.select(event.target).classed('tableCompute')
                //     if (row.data()) {
                //         const currentData = row.data();
                //         svg.classed('onhighlight2', true);
                //         (isSingle? [d3.select(event.target).text()]:currentData.node_list).forEach(c => {
                //             rack_arr.find(r => {
                //                 if (r.childrenNode[c]) {
                //                     highlight2Stack.push(r.childrenNode[c]);
                //                     highlight2Stack.push(r.childrenNode[c].datum().data.tooltip);
                //                     r.childrenNode[c].datum().data.tooltip.classed('highlight2', true);
                //
                //                     r.childrenNode[c].classed('highlight2', true);
                //                     r.childrenNode[c].datum().data.relatedLinks.forEach(d=>{
                //                         if (d.datum().source===currentData[innerKey]){
                //                             highlight2Stack.push(d);
                //                             d.classed('highlight2',true);
                //                         }
                //                     });
                //                     return true;
                //                 }
                //             });
                //         });
                //         users_arr.find(u => {
                //             if (u.key===currentData[innerKey]) {
                //                 highlight2Stack.push(u.node);
                //                 u.node.classed('highlight2', true);
                //                 return true;
                //             }
                //         });
                //         if (currentData.highlight){
                //             const obj = {};
                //             currentData.node_list.forEach(n=>obj[n]=true)
                //             currentData.highlight(obj);
                //         }
                //     }
                // }).on('mouseleave', 'tr, .tableCompute', function () {
                //     let tr = $(this).closest('tr');
                //     d3.select(this).style('font-weight','unset');
                //     // svg.classed('onhighlight2',false);
                //     highlight2Stack.forEach(n=>n.classed('highlight2',false));
                //     highlight2Stack = [];
                //     table.row( tr ).data().highlight();
                // });
            }
        });

        $('#informationTable tbody').on('click', 'td button.morebtn', function () {
            var tr = $(this).closest('tr');
            var row = table.row(tr);

            if (d3.select(this).attr('value') === 'open') {
                row.data().isexpand = true;
                d3.select(tr[0]).classed('shown', true)
                    .select('span').html(row.data().node_list.map(e => `<span class="tableCompute">${e}</span>`).join('\n'));
            } else {
                // Open this row
                row.data().isexpand = false;
                d3.select(tr[0]).classed('shown', false)
                    .select('span').html(row.data().node_list.slice(0, 2).map(e => `<span class="tableCompute">${e}</span>`).join('\n'));
            }
        });

        if (vizservice[serviceSelected])
            drawLineChart(nodelist);

        function drawLineChart(nodes) {
            let graphicopt = {
                margin: {top: 10, right: 20, bottom: 50, left: 50},
                width: $('#tooltipLineChart').width(),
                height: $('#tooltipLineChart').width() * 0.5,
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
            }

            const rootID = vizservice[serviceSelected].idroot;
            const scale = alternative_scale[rootID];
            const id = vizservice[serviceSelected].id;
            const _data = nodes.map(nname => ({
                key: nname,
                value: request.data.nodes_info[nname][alternative_service[rootID]]
            }));
            let arr = [];
            if (_.isArray(_data[0].value[0])) {
                if (scale !== 1) {
                    arr = _data.map(e => ({key: e.key, value: e.value.map(d => d[id] * scale)}));
                } else {
                    arr = _data.map(e => ({key: e.key, value: e.value.map(d => d[id])}));
                }
            } else {
                if (scale !== 1)
                    arr = _data.map(e => ({key: e.key, value: e.value.map(d => d * scale)}));
                else
                    arr = _data.map(e => ({key: e.key, value: e.value.slice()}));
            }
            let height = graphicopt.height + 10 * jobData.length;
            let h = height - graphicopt.margin.top - graphicopt.margin.bottom;
            if (arr.length === 0) {
                height = 10 * jobData.length;
                h = height - graphicopt.margin.top - graphicopt.margin.bottom;
            }
            const svg = d3.select('#tooltipLineChart')
                .attr('width', graphicopt.width)
                .attr('height', height);
            const g = svg.select('g.content')
                .attr('transform', `translate(${graphicopt.margin.left},${graphicopt.margin.top})`);
            g.select('rect.background').attr('width', graphicopt.widthG())
                .attr('height', graphicopt.heightG())
                .attr('fill', '#9c9c9c');
            const timeScale = d3.scaleTime().domain([request.data.time_stamp[0], _.last(request.data.time_stamp)])
                .range([0, graphicopt.widthG()]);
            const valueScale = d3.scaleLinear().domain(vizservice[serviceSelected].range)
                .range([graphicopt.heightG(), 0]);

            g.select('.timeMark')
                .attr('transform', `translate(${timeScale(Layout.currentTime)},0)`)
                .select('line')
                .attr('y2', height)
                .attr('stroke-dasharray', '4 2')
                .style('stroke', '#444444');

            const path = d3.line().y(d => valueScale(d)).x((d, i) => timeScale(request.data.time_stamp[i])).defined(d => d > 0);

            const lines = g.select('.lineChart')
                .selectAll('path.line')
                .data(arr)
                .join('path')
                .attr('class', d => 'line ' + str2class(d.key))
                .attr('d', d => path(d.value))
                .style('stroke', d => colorMap[d.key] ?? 'black')
                .style('fill', 'none');
            jobData.forEach((d, i) => {
                d.highlight = (enable) => {
                    if (enable) {
                        const x0 = Math.max(-graphicopt.margin.left, timeScale(new Date(d.start_time)));
                        const x1 = d.finish_time ? timeScale(new Date(d.finish_time)) : graphicopt.width;
                        g.select('rect.highlight')
                            .classed('hide', false)
                            .attr('x', x0)
                            .attr('width', x1 - x0)
                            .attr('height', jobScale(i))
                            .attr('fill', '#6b6b6b');
                        lines.filter(d => !enable[d.key])
                            .classed('hide', true);
                        g.select('g.jobs')
                            .selectAll('.timelineJob').filter((_d, _i) => _i !== i)
                            .style('opacity', 0.5)
                    } else {
                        g.select('rect.highlight').classed('hide', true);
                        lines.classed('hide', false);
                        g.select('g.jobs')
                            .selectAll('.timelineJob').filter((_d, _i) => _i !== i)
                            .style('opacity', null)
                    }
                }
            });
            const jobScale = d3.scaleLinear().domain([0, 1]).range([graphicopt.heightG() + graphicopt.margin.bottom, graphicopt.heightG() + graphicopt.margin.bottom + 10])
            g.select('g.jobs')
                .selectAll('line.timelineJob')
                .data(jobData)
                .join('line')
                .attr('class', 'timelineJob ' + d._id)
                .attr("marker-start", "url(#arrow)")
                .attr("marker-end", "url(#endTick)")
                .attr('x1', d => timeScale(new Date(d.start_time)))
                .attr('x2', d => d.finish_time ? timeScale(new Date(d.finish_time)) : graphicopt.width)
                .attr('y1', (d, i) => jobScale(i))
                .attr('y2', (d, i) => jobScale(i))
                .style('stroke', 'black');
            g.select('g.jobs')
                .selectAll('text.timelineJob')
                .data(jobData)
                .join('text')
                .attr('class', 'timelineJob ' + d._id)
                .attr('x', d => Math.max(-graphicopt.margin.left, timeScale(new Date(d.start_time))))
                .attr('y', (d, i) => jobScale(i))
                .attr('dy', -2)
                .attr('font-size', 10)
                .attr('fill', 'black')
                .text(d => d.id);

            const xaxis = g.select('g.xaxis').attr('transform', `translate(0,${graphicopt.heightG()})`)
                .call(d3.axisBottom(timeScale));
            xaxis
                .selectAll('line, path').style('stroke', 'black');
            xaxis
                .selectAll('text').style('fill', 'black')
                .attr('text-anchor', 'start')
                .attr('transform', 'rotate(45)');
            const yaxis = g.select('g.yaxis')
                .call(d3.axisLeft(valueScale));
            yaxis
                .selectAll('line')
                .attr('x2', graphicopt.widthG())
                .attr('stroke-dasharray', '2 1')
                .style('stroke-width', 0.2)
                .style('stroke', 'black');
            yaxis
                .selectAll('text').style('fill', 'black')
        }
    } else
        d3.select('.informationHolder').classed('hide', true);

    function str2class(str) {
        return str.replace(/ |,|./g, '_');
    }
}

function getColorScale() {
    if (drawObject.graphicopt().colorMode !== 'rack') {
        serviceName = vizservice[serviceSelected].text;
        let _colorItem = d3.scaleSequential()
            .interpolator(d3.interpolateSpectral);
        if (serviceName === 'User') {
            vizservice[serviceSelected].range = Object.keys(innerObj);
            _colorItem = userColor;
        } else if (serviceName === 'Radar') {
            _colorItem = colorCluster;
        }
        const range_cal = (vizservice[serviceSelected].filter || vizservice[serviceSelected].range).slice();
        if (serviceName !== 'User') {
            if (serviceName !== 'Radar')
                _colorItem.domain(range_cal.slice().reverse());
        } else if (serviceName === 'Radar')
            _colorItem.domain(range_cal.slice());
        return _colorItem;
    } else {
        let colorbyRack = d3.scaleOrdinal(d3.schemeCategory10).domain(Object.keys(Layout.data));
        let _colorItem = (value, d) => d ? colorbyRack(Layout.compute_layout[d.key]) : null;
        _colorItem.domain = () => colorbyRack.domain();
        _colorItem.range = () => colorbyRack.range();
        return _colorItem;
    }
}

function closeToolTip() {
    d3.select('.informationHolder').classed('hide', true);
}

function makelegend() {
    let graphicopt = drawObject.graphicopt();
    if (vizservice[serviceSelected].text === 'User') {
        d3.select('.legendView').classed('hide', true);
        d3.select('.clusterView').classed('hide', true);
    } else if (vizservice[serviceSelected].text === 'Radar') {
        d3.select('.legendView').classed('hide', true);
        d3.select('.clusterView').classed('hide', false);
    } else {
        d3.select('.clusterView').classed('hide', true);
        const color = drawObject.color();
        const marginTop = 10;
        const marginBottom = 10;
        const marginLeft = 40;
        const marginRight = 0;
        const width = 10;
        const height = 200;
        const legendHolder = d3.select('.legendView').classed('hide', false);
        // legendHolder.style('left', Math.min(d3.zoomIdentity.x + graphicopt.diameter() / 2 + 80, graphicopt.width - graphicopt.margin.right) + 'px');
        // legendHolder.select('.legendView').classed('hide',false);
        const svg = legendHolder.select('svg.legend')
            .attr('width', width + marginLeft + marginRight)
            .attr('height', height + marginTop + marginBottom);
        svg.select('g.legend').remove();
        let legend = svg.append('g').attr('class', 'legend')
            .attr('transform', `translate(${marginLeft},${marginTop})`);
        // .attr('transform',`translate(${Math.min(graphicopt.diameter()+max_radius+40+graphicopt.margin.left,graphicopt.width-graphicopt.margin.right)},${graphicopt.margin.top+30})`);

        if (color.interpolate) {
            const n = Math.min(color.domain().length, color.range().length);

            let y = color.copy().rangeRound(d3.quantize(d3.interpolate(0, height), n));

            legend.append("image")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", height)
                .attr("preserveAspectRatio", "none")
                .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
        }// Sequential
        else if (color.interpolator) {
            let y = Object.assign(color.copy()
                    .interpolator(d3.interpolateRound(0, height)),
                {
                    range() {
                        return [0, height];
                    }
                });

            legend.append("image")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", height)
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
            } else {
                graphicopt.legend = {scale: y};
                legend.append('g').attr('class', 'legendTick').call(d3.axisLeft(y));
            }
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

        // make custom input button
        let legendRange = vizservice[serviceSelected].range;
        let customRange = legendRange.slice();
        const groupbtn = legendHolder.select('.btn-group')
        let applybtn = legendHolder.select('#range_apply')
            .on('click', function () {
                legendRange = customRange.slice();
                serviceFullList[serviceSelected].filter = customRange.slice();
                currentDraw(serviceSelected);
                groupbtn.classed('hide', true);
            });
        let canclebtn = legendHolder.select('#range_reset')
            .on('click', function () {
                customRange = serviceFullList[serviceSelected].range.slice();
                rangeo.each(function (d) {
                    $(this).val(customRange[+(d.key === 'upLimit')]);
                });
                currentDraw(serviceSelected);
                groupbtn.classed('hide', true);
            });
        let rangeo = legendHolder.selectAll('input.range')
            .data([{key: 'upLimit', value: legendRange[1]},
                {key: 'lowLimit', value: legendRange[0]}])
            .attr('value', d => d.value)
            .on('input', function (d) {
                let index = +(d.key === 'upLimit');
                customRange[index] = +$(this).val();
                // if (_.isEqual(customRange, legendRange)) {
                //     groupbtn.classed('hide', true);
                // } else {
                groupbtn.classed('hide', false);
                if ((index * 2 - 1) * (-customRange[index] + legendRange[index]) < 0) {
                    // wrong input
                    applybtn.attr('disabled', '');
                } else {
                    if (!(((!index) * 2 - 1) * (-customRange[+!index] + legendRange[+!index]) < 0)) {
                        applybtn.attr('disabled', null);
                    }
                }
                // }
            });
    }
}


function getDrawData(e) {
    let serviceName = vizservice[serviceSelected]?vizservice[serviceSelected].text:'';
    if (serviceName === 'Radar') {
        if (!e.children) {
            let radarvalue = [serviceFullList.map(d => ({
                axis: d.text,
                value: Math.max(d3.scaleLinear().domain(d.range)(e.data.metrics[d.text]) ?? 0, 0)
            }))];
            radarvalue[0].name = e.data.metrics['Radar']
            radarvalue.isRadar = true;
            radarvalue.r = e.r * 2;
            radarvalue.type = 'radar';
            return radarvalue
        }
        const radarvalue = [{startAngle: 0, endAngle: 360, r: e.r}];
        radarvalue.type = 'radar';
        return radarvalue
    } else if (serviceName === 'User') {
        if (e.data.relatedNodes.length > 1) {
            const data = d3.pie().value(1)(e.data.relatedNodes);
            data.forEach(d => {
                d.r = e.r;
                d.color = d.data.data.color;
            });

            return data;
        }
        return [{
            data: {},
            endAngle: 360,
            index: 0,
            padAngle: 0,
            startAngle: 0,
            value: 1,
            r: e.r,
            color: e.data.relatedNodes[0] ? e.data.relatedNodes[0].data.color : 'unset'
        }]
    } else {
        const dataout = [{startAngle: 0, endAngle: 360, r: e.r ?? 3, invalid: e.invalid}];
        return dataout;
    }
}

function openPopup(d, svg) {
    if (drawObject.isFreeze()) {
        const cloned = svg.clone(true);
        cloned.attr('id', null).attr('class', 'svgClone').style('position', 'relative');
        const parent = d3.select(svg.node().parentNode).append('div');
        parent.node().appendChild(cloned.node());
        parent.append('span').style('position', 'absolute')
            .style('top', 0).style('left', '50%').text(timelineControl.currentValue.toLocaleString() + " | " + vizservice[serviceSelected].text + ' | ' + d.key)
            .style('text-align', 'center')
            .style('transform', 'translateX(-50%)');
        parent.append('div')
            .attr('class', 'closeButton')
            .style('position', 'absolute')
            .style('top', 0).style('right', '0')
            .html(' <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-x" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\n' +
                '                                    <path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708-.708l7-7a.5.5 0 0 1 .708 0z"></path>\n' +
                '                                    <path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708l-7-7a.5.5 0 0 0-.708 0z"></path>\n' +
                '                                </svg>')
            .on('click', function () {
                drawObject.removeSubgraph(parent);
            });

        drawObject.addSubgraph(parent);
    }
}

function drawUserList() {
    let user_info = d3.select('#UserList table tbody')
        .selectAll('tr').data(Object.entries(Layout.usersStatic).sort((a, b) => b[1].node.length - a[1].node.length))
        .join('tr')
        .on('mouseover', function (d) {
            if (!drawObject.isFreeze()) {
                drawObject.drawTrajectory(d, Object.entries(Layout.ranking.byUser[d.key][vizservice[serviceSelected].text]).map(d => {
                    d.value.key = d.key;
                    return d.value;
                }));
                d3.select(this).classed('highlight', true);
                drawObject.highlight(Object.entries(Layout.ranking.byUser[d.key][vizservice[serviceSelected].text]).filter(d => d.value[request.index - 1] != undefined).map(d => d.key))
                // subObject.highlight([d.key])
            }
        }).on('mouseout', function (d) {
            if (!drawObject.isFreeze()) {
                drawObject.g().selectAll('path.trajectory').remove();
                drawObject.g().select('.TrajectoryLegend').remove();
                drawObject.current_trajectory_data = undefined;
                d3.select('#UserList table tbody').selectAll('.highlight').classed('highlight', false);
                drawObject.releasehighlight();
                // subObject.releasehighlight();
            }
        }).on('click', function (d) {
            drawObject.freezeHandle.bind(this)();
            // openPopup(d,drawObject.main_svg());
            // subObject.freezeHandle.bind(this)();
        });
    user_info
        .selectAll('td').data(d => [{key: 'username', value: d.key}, {
        key: 'job',
        value: d[1].job.length
    }, {key: 'compute', value: d[1].node.length}])
        .join('td')
        .style('text-align', d => (d.key === 'job' || d.key === 'compute') ? 'end' : null)
        .style('background-color', d => d.key === 'job' ? 'rgba(166,86,40,0.5)' : (d.key === 'compute' ? 'rgba(55,126,184,0.5)' : null))
        .text(d => d.value);
    drawObject.mouseoverAdd('userlist', function (d) {
        user_info.filter(u => d.user.indexOf(u.key) !== -1).classed('highlight', true);
    });
    drawObject.mouseoutAdd('userlist', function (d) {
        user_info.classed('highlight', false);
    });
}

function getColorGant() {

    let colorGantt = d3.scaleSequential()
        .interpolator(d3.interpolateSpectral);
    let _colorItem = (value, d) => d ? colorGantt(d.names.length) : null;
    _colorItem.domain = () => colorGantt.domain();
    _colorItem.range = () => colorGantt.range();
    return _colorItem;
}

// function initdrawGantt(){
//     subObject.init().getColorScale(getColorGant).graphicopt({range:Layout.timeRange});
//     drawObject.mouseoverAdd('gantt',function(d){
//         subObject.highlight(d.user);
//     });
//     drawObject.mouseoutAdd('gantt',function(d){
//         subObject.releasehighlight();
//     });
//     drawObject.clickAdd('gantt',function(d){
//         subObject.freezeHandle.bind(this)();
//     });
//     drawObject.onBrushAdd('gantt',function(d){
//         subObject.freezeHandleTrigger.bind(this)(true);
//         // subObject.highlight2(d.user);
//     });
//     drawObject.offBrushAdd('gantt',function(d){
//         subObject.freezeHandleTrigger.bind(this)(false);
//         // subObject.releasehighlight2();
//     });
//     subObject.mouseoverAdd('gantt',function(d){
//         drawObject.highlight((d.value2.find(e=>(e[1]>=Layout.currentTime)&&(e[0]<=Layout.currentTime))||{names:[]}).names);
//     });
//     subObject.mouseoutAdd('gantt',function(d){
//         drawObject.releasehighlight();
//     });
//     subObject.clickAdd('gantt',function(d){
//         drawObject.freezeHandle.bind(this)();
//     });
//
// }
function drawGantt() {
    drawObject.data({
        timeRange:Layout.timerange,
        node:Layout.nodeFilter,
        serviceSelected:0,
        metrics:Layout.tsnedata,
        dimensions:serviceFullList,
        time:Layout.time_stamp
    });

    let _byUser=undefined;
    $('#search').on('input', searchHandler); // register for oninput
    $('#search').on('propertychange', searchHandler); // for IE8
    function searchHandler(e) {
        if (e.target.value !== "") {
            const byUser = Layout.users[e.target.value]?e.target.value:undefined;
            // let results = datain.filter(h => h.name.includes(e.target.value)).map(h => ({index: path[h.name][0].index}));
            const dimensions = serviceFullList;
            if(dimensions) {
                if (!byUser) {
                    if (_byUser!==byUser) {
                        Layout.nodeFilter = {...Layout.computers};
                        drawObject.data({node: Layout.nodeFilter}).draw();
                    }
                } else {
                    const nodes = {};
                    [byUser].forEach(u=>{
                        debugger
                        Layout.users[u].node.forEach(n=>{
                            nodes[n] = {};
                            dimensions.forEach(d=>{
                                if (Layout.computers[n][d.text]){
                                    nodes[n][d.text] = Layout.computers[n][d.text].map(()=>null);
                                    nodes[n][d.text].sudden = Layout.computers[n][d.text].sudden;
                                }
                            })
                            Layout.computers[n].users.forEach((t,i)=>{
                                if (t.indexOf(u)){
                                    dimensions.forEach(d=>{
                                        if (Layout.computers[n][d.text]){
                                            nodes[n][d.text][i] = Layout.computers[n][d.text][i];
                                        }
                                    })
                                }
                            })
                        })
                    })
                    drawObject.data({node:nodes}).draw();
                }
            }
            _byUser = byUser
        }
    }
}

// setting
let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d) {
    return `<span>${d}</span>`
})
let drawObject = new NetAgnostics();
// let drawObject = new DynamicNet();
// let PCAmapObject = new PCAmap();
