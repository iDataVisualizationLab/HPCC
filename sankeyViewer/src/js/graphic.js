// plugin
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};
//general function
let vizservice=[];
function serviceControl(){
    vizservice =serviceFullList.slice();
    vizservice.push({text:'User',range:[]});
    vizservice.push({text:'Radar',range:[]});
    d3.selectAll('.serviceName').text(vizservice[serviceSelected].text)
    d3.select('#serviceSelection')
        .on('change',function(){
            serviceSelected = +$(this).val();
            d3.selectAll('.serviceName').text(vizservice[serviceSelected].text);
            createdata();
            currentDraw();
        })
        .selectAll('option')
        .data(vizservice)
        .enter()
        .append('option')
        .attr('value',(d,i)=>i)
        .attr('class',d=>d.text==='User'?'innerName':null)
        .attr('data-value',(d,i)=>d)
        .attr('selected',(d,i)=>i===serviceSelected?'':null)
        .text(d=>d.text)
}
function initdraw(){
    $('.informationHolder').draggable({ handle: ".card-header" ,scroll: false });

    d3.select('#sort_apply').on('click',function(){
        sortData();
        currentDraw()
    });

    d3.select('#userSort').on('change',function(){
        const val = $(this).val();
        subObject.sankeyOpt({nodeSort:val}).draw();
    })
    serviceControl();
    userPie.init();
    d3.select('#hideStable').on('change',function(){
        updateProcess({percentage:5,text:'Recalculate Sankey...'})
        subObject.sankeyOpt({hideStable:this.checked}).draw();
    });

    d3.select('#showShareUser').on('change',function(){
        updateProcess({percentage:5,text:'Recalculate Sankey...'})
        subObject.sankeyOpt({showShareUser:this.checked}).draw();
    });

    d3.select('#showOverLimitUser').on('change',function(){
        updateProcess({percentage:5,text:'Recalculate Sankey...'})
        subObject.sankeyOpt({showOverLimitUser:this.checked}).draw();
    });

    d3.select('#flowType').on('change',function(){
        const val = $(this).val();
        handleDataComputeByUser.mode=val;
        d3.select('#ganttLayoutLabel').text(val==='core'?'#Cores':'#CPU Nodes')
        Layout.userTimeline = handleDataComputeByUser(handleDataComputeByUser.data);
        subObject.graphicopt({maxLimit:val=='core'?32:1}).data(Layout.userTimeline).draw();
    })
    MetricController.axisSchema(serviceFullList, true).update()
}
function userTable(d,type){
    highlight2Stack = [];
    if (subObject.isFreeze()) {
        d3.select('.informationHolder').classed('hide',false);
        const contain = d3.select('.informationHolder').datum(d);
        contain.select('.card-header p').text(d => type.toUpperCase()+': ' + (type==='compute'?d.data.name:d.key));
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
            </table>`);
        let jobData = [];
        if (type==='user')
            jobData = d.value.job.map(j=>{
                const jobID = j.split('.');
                const job=_.clone(jobs[j]);
                job['id']=jobID[0];
                job['duration']=Layout.currentTime - job['start_time'];
                job['task_id'] = jobID[1]||'n/a';
                return job});
        else{
            debugger
            if(Layout.computers_old[d.key])
                jobData = Layout.computers_old[d.key].job_id[0].map(j=>{
                const jobID = j.split('.');
                const job=_.clone(Layout.jobs[j]);
                if (job.node_list.indexOf(d.data.name)===-1)
                    return false;
                job['id']=jobID[0];
                job['duration']=Layout.currentTime - job['start_time'];
                job['task_id'] = jobID[1]||'n/a';
                debugger
                return job}).filter(d=>d);
        }
        var table = $('#informationTable').DataTable( {
            "data": jobData,
            "scrollX": true,
            "columns": [
                { "data": "id" },
                { "data": "job_name" },
                { "data": "user_name" },
                { "data": "start_time" ,
                    "render": function ( data, type, row ) {
                        if(type!=='ordering')
                            return d3.timeFormat('%m/%d/%Y %H:%M')(new Date(data));
                        return data;
                    }},
                { "data": "duration",
                    "render": function ( data, type, row ) {
                        if(type!=='ordering')
                            return millisecondsToStr_axproximate(data);
                        return data;
                    }},
                { "data": "cpu_cores" },
                { "data": "node_list" ,"className":'details-control text-wrap',
                    "render": function ( data, type, row ) {
                        if(type==='ordering')
                            return data.length;
                        if (type==='display')
                            if (data.length>2)
                                return `<span>${(row.isexpand?data: data.slice(0,2)).map(e=>`<span class="tableCompute">${e}</span>`).join('\n')}</span>
                                        <button type="button" class="btn btn-block morebtn" value="open">${data.length-2} more</button>
                                        <button type="button" class="btn btn-block morebtn" value="close">
                                        <img src="src/style/icon/caret-up-fill.svg" style="height: 10px"></img>
                                        </button>`;
                            else
                                return data.map(e=>`<span class="tableCompute">${e}</span>`).join('\n');
                        return data;
                    }},
                { "data": "task_id" },
            ],
            "order": [[0, 'asc']],
            "drawCallback": function( settings ) {
                // Add event listener for opening and closing details
                $('#informationTable tbody').on('mouseover', 'tr, .tableCompute', function (event) {
                    event.stopPropagation();
                    highlight2Stack.forEach(n=>n.classed('highlight2',false))
                    highlight2Stack = [];
                    let tr = $(this).closest('tr');
                    let row = table.row( tr );
                    d3.select(tr[0]).style('font-weight','unset');
                    d3.select(this).style('font-weight','bold');
                    const isSingle =  d3.select(event.target).classed('tableCompute')
                    if (row.data()) {
                        const currentData = row.data();
                        subObject.highlight2(isSingle? [d3.select(event.target).text()]:currentData.node_list);
                    }
                }).on('mouseleave', 'tr, .tableCompute', function () {
                    let tr = $(this).closest('tr');
                    d3.select(this).style('font-weight','unset');
                    subObject.releasehighlight2();
                });
            }
        } );

        $('#informationTable tbody').on('click', 'td button.morebtn', function () {
            var tr = $(this).closest('tr');
            var row = table.row( tr );

            if ( d3.select(this).attr('value')==='open' ) {
                row.data().isexpand = true;
                d3.select(tr[0]).classed('shown',true)
                    .select('span').html(row.data().node_list.map(e=>`<span class="tableCompute">${e}</span>`).join('\n'));
            }
            else {
                // Open this row
                row.data().isexpand = false;
                d3.select(tr[0]).classed('shown',false)
                    .select('span').html(row.data().node_list.slice(0,2).map(e=>`<span class="tableCompute">${e}</span>`).join('\n'));
            }
        });
    }else
        d3.select('.informationHolder').classed('hide',true);
}
function getColorScale(){
    if (drawObject.graphicopt().colorMode!=='rack'){
        serviceName = vizservice[serviceSelected].text;
        let _colorItem = d3.scaleSequential()
            .interpolator(d3.interpolateSpectral);
        if(serviceName==='User') {
            vizservice[serviceSelected].range = d3.keys(innerObj);
            debugger
            _colorItem = userColor;
        } else if (serviceName==='Radar') {
            debugger
            _colorItem = colorCluster;
        }
        const range_cal = (vizservice[serviceSelected].filter||vizservice[serviceSelected].range).slice();
        if(serviceName!=='User'){
            if(serviceName!=='Radar')
                _colorItem.domain(range_cal.slice().reverse());
        }else if(serviceName==='Radar')
            _colorItem.domain(range_cal.slice());
        return _colorItem;
    }else{
        let colorbyRack = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.keys(Layout.data));
        let _colorItem = (value,d)=>d?colorbyRack(Layout.compute_layout[d.key]):null;
        _colorItem.domain = ()=>colorbyRack.domain();
        _colorItem.range = ()=>colorbyRack.range();
        return _colorItem;
    }
}
function closeToolTip(){
    d3.select('.informationHolder').classed('hide',true);
}
function makelegend(){
    let graphicopt = drawObject.graphicopt();
    if (vizservice[serviceSelected].text==='User'){
        d3.select('.legendView').classed('hide',true);
        d3.select('.clusterView').classed('hide',true);
    }else if (vizservice[serviceSelected].text==='Radar'){
        d3.select('.legendView').classed('hide',true);
        d3.select('.clusterView').classed('hide',false);
    }else{
        d3.select('.clusterView').classed('hide',true);
        const color = drawObject.color();
        const marginTop = 10;
        const marginBottom = 10;
        const marginLeft = 40;
        const marginRight = 0;
        const width = 10;
        const height = 200;
        const legendHolder = d3.select('.legendView').classed('hide',false);
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

function getRenderFunc(d){
    let serviceName = vizservice[serviceSelected].text;
    if (serviceName!=='Radar'|| !d.isRadar)
        return d3.arc()
            .innerRadius(0)
            .outerRadius(d.r )(d);
    // else
    //     return _.partial(createRadar)
}
function getDrawData(e) {
    let serviceName = vizservice[serviceSelected].text;
    if (serviceName === 'Radar'){
        if (!e.children) {
            let radarvalue = [serviceFullList.map(d=>({axis:d.text,value:Math.max(d3.scaleLinear().domain(d.range)(e.data.metrics[d.text])??0,0)}))];
            radarvalue[0].name = e.data.metrics['Radar']
            radarvalue.isRadar = true;
            radarvalue.r = e.r*2;
            radarvalue.type = 'radar';
            return radarvalue
        }
        const radarvalue = [{startAngle:0,endAngle:360,r:e.r}];
        radarvalue.type = 'radar';
        return radarvalue
    }else if (serviceName ==='User'){
        if (e.data.relatedNodes.length>1) {
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
            r:e.r,
            color: e.data.relatedNodes[0]?e.data.relatedNodes[0].data.color:'unset'
        }]
    }else{
        const dataout =  [{startAngle:0,endAngle:360,r:e.r,invalid: e.data.invalid}];
        return dataout;
    }
}
function openPopup(d,svg){
    // if (drawObject.isFreeze()) {
    //     debugger
    //     const cloned = svg.clone(true);
    //     cloned.attr('id',null).attr('class','svgClone').style('position','relative');
    //     const parent = d3.select(svg.node().parentNode).append('div');
    //     parent.node().appendChild(cloned.node());
    //     parent.append('span').style('position','absolute')
    //         .style('top',0).style('left','50%').text(timelineControl.currentValue.toLocaleString()+" | "+vizservice[serviceSelected].text+' | '+d.key)
    //         .style('text-align','center')
    //         .style('transform','translateX(-50%)');
    //     parent.append('div')
    //         .attr('class','closeButton')
    //         .style('position','absolute')
    //         .style('top',0).style('right','0')
    //         .html(' <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-x" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\n' +
    //         '                                    <path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708-.708l7-7a.5.5 0 0 1 .708 0z"></path>\n' +
    //         '                                    <path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708l-7-7a.5.5 0 0 0-.708 0z"></path>\n' +
    //         '                                </svg>')
    //         .on('click',function(){
    //             drawObject.removeSubgraph(parent);
    //         });
    //
    //     drawObject.addSubgraph(parent);
    // }
}
function drawUserList(){
    let user_info = d3.select('#UserList table tbody')
        .selectAll('tr').data(d3.entries(Layout.usersStatic).sort((a,b)=>b.value.node.length-a.value.node.length))
        .join('tr')
        .on('mouseover',function(d){
            if(!subObject.isFreeze()){
                d3.select(this).classed('highlight',true);
                subObject.highlight([d.key])
            }
        }).on('mouseout',function(d){
            if(!subObject.isFreeze()){
                d3.select('#UserList table tbody').selectAll('.highlight').classed('highlight',false);
                subObject.releasehighlight();
            }
        }).on('click',function(d){
            subObject.freezeHandle.bind(this)();
        });
    user_info
        .selectAll('td').data(d=>[{key:'username',value:d.key},{key:'job',value:d.value.job.length},{key:'compute',value:d.value.node.length},{key:'core',value:d.value.totalCore}])
        .join('td')
        .style('text-align',d=>(d.key==='job'||d.key==='compute'||d.key==='core')?'end':null)
        .style('background-color',d=>d.key==='job'?'rgba(166,86,40,0.5)': (d.key ==='compute'?'rgba(55,126,184,0.5)':null))
        .text(d=>d.value);
    subObject.mouseoverAdd('userlist',function(d){
        user_info.filter(u=>d.source.element.find(e=>e.key===u.key)||d.target.element.find(e=>e.key===u.key)).classed('highlight',true);
    });
    subObject.mouseoutAdd('userlist',function(d){
        user_info.classed('highlight',false);
    });
}
function getColorGant(){

    let colorGantt =d3.scaleSequential()
        .interpolator(d3.interpolateSpectral);
    let _colorItem = (value,d)=>d?colorGantt(d.names.length):null;
    _colorItem.domain = ()=>colorGantt.domain();
    _colorItem.range = ()=>colorGantt.range();
    return _colorItem;
}
function initdrawGantt(){
    timearc.init();
    subObject.init().getColorScale(getColorGant).graphicopt({range:Layout.timeRange}).loadingFunc(updateProcess)
        .onFinishDraw(()=>{
            timearc.getColorScale(subObject.getColorScale()).times(subObject.times()).data(subObject.graph()).times(subObject.times()).draw();
        });
    subObject.loadingFunc(updateProcess)

    subObject.mouseoverAdd('gantt',function(d){
        debugger
        const time = d.source.time;
        const _data = {};
        _data[JOB] = {};
        Layout.userTimeline.forEach(comp=>{
            if (comp[time]){
                comp[time].jobs[0].forEach((jid,ji)=>{
                    _data[JOB][jid] = comp[time].jobs[1][ji];
                })
            }
        });
        d3.select('#pieChartTime').text(time.toLocaleString());
        userPie.data(getUsers(_data)).draw();
        userPie.highlight(d.source.element.map(e=>e.key));
    });
    subObject.mouseoutAdd('gantt',function(d){
        d3.select('#pieChartTime').text('');
        userPie.data(Layout.usersStatic).draw();
        userPie.releasehighlight();
    });
    subObject.clickAdd('jobsankey',function(d) {
        window.open('../sankeyJobViewer/index.html?file=' + '922020-932020-145000' + '&user=' + d.source.element.map(e => e.key), "_blank");
    });
    userPie.mouseoverAdd('gantt',function(d){
        subObject.highlight([d.data.key]);
    });
    userPie.mouseoutAdd('gantt',function(d){
        subObject.releasehighlight();
    });
}
function drawGantt(){
    if (userPie){
        if (userPie.data().length)
            userPie.draw();
        subObject.color(userPie.color());
    }
    subObject.data(Layout.userTimeline).draw();
}
// setting
let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `<span>${d}</span>`})
// let subObject = new Gantt();
let subObject = new Sankey();
let timearc = new TimeArc();
