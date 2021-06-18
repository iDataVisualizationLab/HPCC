// plugin
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};
//general function
let vizservice=[];
function serviceControl(){
    vizservice = [];
    serviceFullList.forEach((s,i)=>{
        vizservice.push(s);
    });


    d3.select('#flowType')
        .on('change',function(){
            const selectedSers = $(this).val();
            serviceSelected = +selectedSers;

            updateProcess({percentage:50,text:'filtering...'});
            setTimeout(()=>{
                subObject.graphicopt({selectedService:serviceSelected}).draw();
                drawColorLegend();
            },0)
        })
            .selectAll('option')
            .data(vizservice)
            .join('option')
            .attr('value',(d)=>d.idroot)
            .attr('class',d=>d.text==='User'?'innerName':null)
            .attr('data-value',(d)=>d)
            .attr('selected',(d)=>d.idroot===serviceSelected?'':null)
            .text(d=>d.text);
    d3.select('#jobValueName')
        .selectAll('option')
        .data(serviceFullList)
        .join('option')
        .attr('value',d=>d.idroot)
        .text(d=>d.text);
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

    // serviceControl();
    // userPie.init();
    d3.select('#hideStable').on('change',function(){
        subObject.sankeyOpt({hideStable:this.checked}).draw();
    });

    d3.select('#showShareUser').on('change',function(){
        subObject.sankeyOpt({showShareUser:this.checked}).draw();
    });

    d3.select('#highlightType').on('change',function(){
        subObject.highlightStream($(this).val());
    })

    searchControl.init();
    initFilterMode();
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
            if(Layout.computers_old[d.key])
                jobData = Layout.computers_old[d.key].job_id[0].map(j=>{
                const jobID = j.split('.');
                const job=_.clone(Layout.jobs[j]);
                if (job.node_list.indexOf(d.data.name)===-1)
                    return false;
                job['id']=jobID[0];
                job['duration']=Layout.currentTime - job['start_time'];
                job['task_id'] = jobID[1]||'n/a';
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
            
            _colorItem = userColor;
        } else if (serviceName==='Radar') {
            
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
    //     
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


function resetFilter(to) {
    if (to!=='search'){
        searchControl.reset();
        filterMode = to;
    }
    drawJobList();
    drawUserList();
    drawComputeList();
}
let renderTable = {
    job:_.partial(_renderTable,{numTotal:'#jobNumTotal',currentNum:'#currentJobNum',holder:'#JobList',mainKey:'jobid',subInfo:[{key:'compute',value:'total_nodes'},{key:'user',value:'user_name'}]}),
    user:_.partial(_renderTable,{numTotal:'#userNumTotal',currentNum:'#currentUserNum',holder:'#UserList',mainKey:'username',subInfo:[{key:'compute',value:'total_nodes'},{key:'name',func:(d)=>request.userReverseDict[d.key]}]}),
    compute:_.partial(_renderTable,{numTotal:'#computeNumTotal',currentNum:'#currentComputeNum',holder:'#ComputeList',mainKey:'compute',subInfo:[{key:'jobs',func:(d)=>d.value.job_id.length}]})}
function _renderTable({numTotal,currentNum,holder,mainKey,subInfo},data, _data, _jobValueType, _jobValueName) {
    d3.select(currentNum).text(data.length);
    d3.select(numTotal).text(_data.length);

    let job_info = d3.select(holder+' table tbody')
        .selectAll('tr').data(data)
        .join('tr');
    const column = serviceFullList.map(s => s.text);

    d3.select(holder+' table .jobValType').attr('colspan', serviceFullList.length).text(_jobValueType);
    d3.select(holder+' table .header').selectAll('th').data(column)
        .join('th')
        .style('background-color', d => d === serviceFullList[_jobValueName].text ? '#b0ff6b' : null)
        .text(d => d);
    function rendercell(d){
        const _cell = [{key: mainKey, value: d.key}];
        serviceFullList.forEach(s => {
            if (d.value===undefined)
                debugger
            _cell.push({
                key: s.text,
                value: Math.round(scaleService[s.idroot].invert(d.value.summary[s.idroot][_jobValueType]))
            })
        });
        subInfo.forEach(s=>{
            let value = s.value?d.value[s.value]:s.func(d);
            _cell.push({key:s.key,value})
        });
        return _cell;
    }
    job_info
        .selectAll('td').data(rendercell)
        .join('td')
        .style('text-align', d => (d.key === 'averagePower' || d.key === 'compute' || d.key === 'core') ? 'end' : null)
        .style('min-width', '50px')
        // .style('background-color',d=>d.key==='job'?'rgba(166,86,40,0.5)': (d.key ==='compute'?'rgba(55,126,184,0.5)':null))
        .text(d => d.value);
    // subObject.mouseoverAdd('joblist',function(d){
    //     job_info.filter(u=>d.source.element.find(e=>e.key===u.key)||d.target.element.find(e=>e.key===u.key)).classed('highlight',true);
    // });
    // subObject.mouseoutAdd('joblist',function(d){
    //     job_info.classed('highlight',false);
    // });
}


function initFilterMode(){
    d3.select('#JobListFilter').on('click', () => {
        const mode = d3.select('.filterTab.active').attr('data');
        resetFilter(mode)
        updateProcess({percentage: 50, text: 'filtering...'});
        
        setTimeout(() => {
            subObject._filter = subObject.filterTerms();
            subObject.draw();
        }, 0)
    });
    d3.select('#jobValueType').on('change', () => {
        d3.select('.JobFilterType').text(() => $(d3.select('#jobValueType').node()).val())
        const mode = d3.select('.filterTab.active').attr('data');
        resetFilter(mode)
        updateProcess({percentage: 50, text: 'filtering...'});
        setTimeout(() => {
            subObject.draw();
        }, 0)
    });
    d3.select('#jobValueName').on('change', () => {
        const mode = d3.select('.filterTab.active').attr('data');
        resetFilter(mode)
        updateProcess({percentage: 50, text: 'filtering...'});
        setTimeout(() => {
            subObject.draw();
        }, 0)
    });
}
function drawUserList(){
    const _jobValueType = $(d3.select('#jobValueType').node()).val();
    const _jobFilterType = 'top'//$(d3.select('#jobFilterType').node()).val();
    const _jobValueName = $(d3.select('#jobValueName').node()).val();
    const _JobFilterThreshold = +d3.select('#JobFilterThreshold').node().value;
    const _data = d3.entries(Layout.usersStatic);
    if (filterMode!=='userList')
    {
        const data = [];
        subObject.currentSelected().users
            .forEach(d=>{
                data.push({key:d.key,value:Layout.usersStatic[d.key]})
            });
        renderTable['user'](data, _data, _jobValueType, _jobValueName);
    }else {
        _data.sort((a, b) => b.value.summary[_jobValueName][_jobValueType] - a.value.summary[_jobValueName][_jobValueType])
        let data = [];
        if (_jobFilterType === 'top') {
            data = _data.slice(0, _JobFilterThreshold);
        } else {
            data = _data.filter(d => d.value[_jobValueType] >= _JobFilterThreshold / 800)
        }
        renderTable['user'](data, _data, _jobValueType, _jobValueName);
        const jobList = [];
        data.forEach(d => {
            d.value.job.forEach(j=>{
                jobList.push(j);
            })
        });
        subObject.filterTerms(jobList)
    }
}
function drawJobList(){
    const _jobValueType = $(d3.select('#jobValueType').node()).val();
    const _jobFilterType = 'top'//$(d3.select('#jobFilterType').node()).val();
    const _jobValueName = $(d3.select('#jobValueName').node()).val();
    const _JobFilterThreshold = +d3.select('#JobFilterThreshold').node().value;
    const _data = d3.entries(Layout.jobsStatic);
    if (filterMode!=='jobList')
    {
        const data = [];
        subObject.currentSelected().jobs
            .forEach(d=>{
                data.push({key:d.key,value:Layout.jobsStatic[d.key]})
            });
        renderTable['job'](data, _data, _jobValueType, _jobValueName);
    }else {
        let data = _data.filter(j => !j.value.job_array_id).sort((a, b) => b.value.summary[_jobValueName][_jobValueType] - a.value.summary[_jobValueName][_jobValueType]).slice(0, _JobFilterThreshold);

        renderTable['job'](data, _data, _jobValueType, _jobValueName);
        const jobList = [];
        data.forEach(d => {
            jobList.push(d.key);
        });
        
        subObject.filterTerms(jobList)
    }
}
function drawComputeList(){
    const _jobValueType = $(d3.select('#jobValueType').node()).val();
    const _jobFilterType = 'top'//$(d3.select('#jobFilterType').node()).val();
    const _jobValueName = $(d3.select('#jobValueName').node()).val();
    const _JobFilterThreshold = +d3.select('#JobFilterThreshold').node().value;
    const _data = d3.entries(Layout.computesStatic);
    if (filterMode!=='computeList')
    {
        const data = [];
        subObject.currentSelected().computers
            .forEach(d=>{
                data.push({key:d,value:Layout.computesStatic[d]})
            });
        renderTable['compute'](data, _data, _jobValueType, _jobValueName);
    }else {
        let data = _data.sort((a, b) => b.value.summary[_jobValueName][_jobValueType] - a.value.summary[_jobValueName][_jobValueType]).slice(0, _JobFilterThreshold);
        renderTable['compute'](data, _data, _jobValueType, _jobValueName);
        const jobList = [];
        data.forEach(d => {
            d.value.job_id.forEach(j=>jobList.push(j));
        });
        subObject.filterTerms(jobList)
    }
}
function drawColorLegend() {
    let width=300;
    const contain =  d3.select('#legendTimeArc');
    const svg = contain.select('svg').attr('width',width).attr('height',100);


    if (!subObject.graphicopt().minMaxStream){
        // stream legend
        svg.select('.streamlegendtext').classed('hide',false).attr('y',20);
        let upScale= subObject.graphicopt().display.stream.yScaleUp;
        let downScale= subObject.graphicopt().display.stream.yScaleDown;
        let streamPos =+20+10+upScale.range()[1];
        let streamxOffset = 80;
        contain.select('#thresholdTimeArc').classed('hide',false).style('top',''+(streamPos-27)+'px').style('width',`${streamxOffset-20}px`);
        let streamxScale = d3.scaleLinear().range([streamxOffset,width-30]);

        let area_up = d3.area()
            .curve(d3.curveCatmullRom)
            .x(function (d) {
                return streamxScale(d.x);
            })
            .y0(function (d) {
                return -upScale(d.y[0]);
            })
            .y1(function (d) {
                return -upScale(d.y[1]);
            });
        let area_down = d3.area()
            .curve(d3.curveCatmullRom)
            .x(function (d) {
                return streamxScale(d.x);
            })
            .y0(function (d) {
                return -downScale(d.y[0]);
            })
            .y1(function (d) {
                return -downScale(d.y[1]);
            });
        let threshold = subObject.drawThreshold();
        function getUpdtream(range) {
            let upStream = range.map(d => ({x: d , y: [0, Math.random() * (1 - threshold)]}));
            upStream.push({x: range[range.length-1], y: [0, 0]});
            upStream[0].y[1] = 1 - threshold;
            upStream[1].y[1] = 1 - threshold;
            return upStream;
        }
        function getDowndtream(range) {
            let downStream = range.map(d=>({x:d,y:[Math.random()*(-threshold),0]}));
            downStream.push({x:range[range.length-1],y:[-threshold,0]});
            downStream[downStream.length-2].y[0] =-threshold;
            return downStream;
        }
        let marker = svg.selectAll('g.streamMarker').data([1-threshold,-threshold]).join('g').attr('class','streamMarker streamlegendItem')
            .attr('transform',d=>`translate(0,${streamPos-(d>0?upScale:downScale)(d)})`);
        marker.selectAll('line.threshold').data(d=>[d]).join('line').attr('stroke-dasharray','2 1')
            .attr('class','threshold streamlegendItem')
            .attr('stroke','black')
            .attr('stroke-width',0.5)
            .attr('x1',streamxScale(0))
            .attr('x2',streamxScale(1));
        marker.selectAll('text').data(d=>[d]).join('text')
            .attr('class','streamlegendItem')
            .attr('x',streamxScale(0.5))
            .attr('dy',d=>d<0?'1rem':0)
            .attr('text-anchor','middle')
            .text(d=>scaleService[serviceSelected].invert(d+threshold))
        svg.selectAll('path.stream').data([{values:getUpdtream(d3.range(0,21).map(d=>d/50)),render:area_up,color:'rgb(252, 141, 89)'},
                {values:getDowndtream(d3.range(20,41).map(d=>d/50)),render:area_down,color:'steelblue'},
            {values:getUpdtream(d3.range(40,46).map(d=>d/50)),render:area_up,color:'rgb(221,221,221)'},
            {values:getDowndtream(d3.range(45,51).map(d=>d/50)),render:area_down,color:'rgb(221,221,221)'}
                ])
            .join('path')
            .attr('class','stream streamlegendItem')
            .attr('fill',d=>d.color)
            .attr('transform',`translate(0,${streamPos})`)
            .attr('d',d=>d.render(d.values));
        if (svg.select('line.streamMid').empty()){
            svg.append('line').attr('class','streamMid streamlegendItem').attr('transform',`translate(${streamxOffset-20},${streamPos})`)
                .attr('x2',20)
                .attr('stroke','black')
                .attr('marker-end',"url(#arrowhead)");
            svg.append('line').attr('class','nojob streamlegendItem').attr('transform',`translate(0,${streamPos})`)
                .attr('x1',streamxScale(40/50))
                .attr('x2',streamxScale(40/50))
                .attr('y1', downScale(0))
                .attr('y2', downScale(1)+12)
                .attr('stroke-dasharray','2 1')
                .attr('stroke','black');
            svg.append('line').attr('class','nojob streamlegendItem').attr('transform',`translate(0,${streamPos})`)
                .attr('x1',streamxScale(1))
                .attr('x2',streamxScale(1))
                .attr('y1', downScale(0))
                .attr('y2', downScale(1)+12)
                .attr('stroke-dasharray','2 1')
                .attr('stroke','black');
            svg.append('line').attr('class','nojob streamlegendItem').attr('transform',`translate(0,${streamPos+downScale(1)+5})`)
                .attr('x1',streamxScale(40/50))
                .attr('x2',streamxScale(1))
                .attr('stroke','black')
                .attr('marker-start',"url(#arrowhead)")
                .attr('marker-end',"url(#arrowhead)");
            svg.append('text').attr('class','nojob streamlegendItem').attr('transform',`translate(0,${streamPos+downScale(1)+5})`)
                .attr('dy',14)
                .attr('x',streamxScale(45/50))
                .attr('stroke','black')
                .attr('text-anchor','middle')
                .text('no running jobs');
        }

        contain.select('#thresholdTimeArc input').node().value = scaleService[serviceSelected].invert(threshold);
        contain.select('#thresholdTimeArc input').on('change',function(){
            updateProcess({percentage:50,text:'filtering...'});
            setTimeout(()=>{
                const newThreshold = scaleService[serviceSelected](+this.value);
                subObject.graphicopt().display.stream.yScaleUp.domain([0,1-newThreshold]);
                subObject.graphicopt().display.stream.yScaleDown.domain([-newThreshold,0]);
                subObject.drawThreshold(newThreshold);
                subObject.drawComp();
                drawColorLegend();
                updateProcess();
            },1);
        })
    }else{
        contain.select('#thresholdTimeArc').classed('hide',true);
        svg.select('.streamlegendtext').classed('hide',false);
        svg.selectAll('.streamlegendItem').remove();
    }
    function getColor(category, count) {
        if (catergogryObject[category].customcolor)
            return catergogryObject[category].customcolor;
        return  colorCatergory(category)

    }
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
    subObject.graphicopt({width:$('#chart_holder').width(),height:$('#chart_holder').height()}).init();

    subObject.mouseoverAdd('gantt',function(d){
        // userPie.highlight(d.source.element.map(e=>e.key));
    });
    subObject.mouseoutAdd('gantt',function(d){
        // userPie.releasehighlight();
    });
}
function drawGantt(){
    subObject.drawColorLegend(drawColorLegend);
    handle_data_timeArc();
    // handle_data_timeArc_job();
    // subObject.data(Layout.jobCompTimeline).draw();
    // if (userPie){
    //     userPie.color(subObject.color());
    //     if (userPie.data().length)
    //         userPie.draw();
    // }
}
// setting
let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `<span>${d}</span>`})
// let subObject = new Gantt();
let subObject = new MapSetting();

let filterMode = 'jobList'; // joblist | searchBox
let searchControl = SearchControl();

searchControl.onSearch(function(searchInput,searchType){
    setTimeout(()=>{
        if(searchType==='job') {
            subObject.filterTerms([searchInput]);
        }
        if(searchType==='compute') {
            subObject.filterTerms([searchInput]);
        }
        if(searchType==='user') {
            subObject.filterTerms((Layout.usersStatic[searchInput]??{job:[]}).job);
        }
        subObject._filter = subObject.filterTerms();
        subObject.draw();
        resetFilter('search');
    },0)
});
