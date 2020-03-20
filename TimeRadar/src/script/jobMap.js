let JobMap = function() {
    let graphicopt = {
            margin: {top: 20, right: 0, bottom: 0, left: 0},
            width: 250,
            height: 50,
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
            },
        },runopt={compute:{setting:'pie'},graphic:{colorBy:'user'},mouse:{auto:true}},radarcreate,tableData={},tableHeader=[],tableFooter = [],colorscale,
        svg, g, table_headerNode,first = true,
        dataRaw=[],listallJobs=[],data = [],arr=[],
        Hosts = []
    ;
    tableFooter.dataRaw =[];
    let jobMap = {};
    let simulation;
    let timebox,linkg,nodeg,schema=[];
    let fisheye_scale = {x:fisheye.scale(d3.scaleLinear),y:fisheye.scale(d3.scaleLinear)};
    let freezing=false,textWarp=200;
    //slider control
    let suddenGroupslider,stepSizeslider;
    // dummyJob
    let jobEmpty = false;
    //event
    let callback ={
        mouseover:function(){},
        mouseleave:function(){},
    };
    let zoomFunc;
    function freezinghandle(path,mouseOver,mouseLeave){
        path.on('click',function(d){
            if(runopt.mouse.disable){
                if(!freezing)
                    _.bind(mouseOver[0],this)(d);
                else
                    _.bind(mouseLeave[0],this)(d);
            }
            freezing = !freezing;
            if (freezing)
                g.selectAll('.node:not(.highlight)').style('pointer-events','none'); // disable all click event
            else
                g.selectAll('.node:not(.highlight)').style('pointer-events','auto');
            d3.select('.tippannel').select('.freezing').text(freezing?'unfreeze':'freeze')
        });
        if (!freezing) {
            path.on('mouseover', function(d){
                if(!freezing && !runopt.mouse.disable)
                    _.bind(mouseOver[0],this)(d);
            }).on('mouseleave',function(d){
                if(!freezing && !runopt.mouse.disable)
                    _.bind(mouseLeave[0],this)(d);
            });
        }
        return path;
    }

    function registEvent() {
        d3.select('#mouseAction').on("change", function () {
            const selected_value = $("input[name='mouseAction']:checked").val();
            if (selected_value === "auto" || selected_value === "disable") {
                runopt.mouse.auto = selected_value === "auto";
                runopt.mouse.disable = selected_value === "disable";
                runopt.mouse.lensing = false;
            } else {
                runopt.mouse.auto = false;
                runopt.mouse.disable = false;
                runopt.mouse.lensing = selected_value === "lensing";
                runopt.mouse.showseries = selected_value === "showseries";
                runopt.mouse.showmetric = selected_value === "showmetric";
            }
            if (runopt.mouse.lensing) {
                g.select('.fisheyeLayer').style('pointer-events', 'auto');
            } else {
                g.select('.fisheyeLayer').style('pointer-events', 'none');
                fisheye_scale.x = d => d;
            }
        });
        d3.select('#resetScreen').on('click', () => {
            svg.select('.pantarget').transition().duration(750)
                .call(zoomFunc.transform, d3.zoomIdentity.translate(graphicopt.margin.left, graphicopt.margin.top).scale(1)); // updated for d3 v4
        });
        d3.select('#zoomOut').on('click', () => {
            zoomFunc.scaleBy(svg.select('.pantarget'), 0.5); // updated for d3 v4
        });
        d3.select('#zoomIn').on('click', () => {
            zoomFunc.scaleBy(svg.select('.pantarget'), 2); // updated for d3 v4
        });
    }

    jobMap.show = function() {
        registEvent();
    };

    jobMap.init = function () {
        // fisheye_scale.x= fisheye.scale(d3.scaleIdentity).domain([0,graphicopt.widthG()]).focus(graphicopt.widthG()/2);
        fisheye_scale.y= fisheye.scale(d3.scaleIdentity).domain([0,graphicopt.heightG()]).focus(graphicopt.heightG()/2);

        svg.attrs({
            width: graphicopt.width,
            height: graphicopt.height,

        });
        let svdefs = svg.select('defsmain');
        if ( svdefs.empty())
            svdefs = svg.append('defs').attr('id','defsmain');
        if(svdefs.select('#userpic').empty())
            svdefs.append('pattern')
                .attrs({'id':'userpic',width:'100%',height:'100%','patternContentUnits':'objectBoundingBox'})
                .append('image')
                .attrs({'height':1,width:1,preserveAspectRatio:'none',
                    'xmlns:xlink':'http://www.w3.org/1999/xlink','xlink:href':'src/images/u.png'});
        zoomFunc = d3.zoom().on("zoom",  () =>{
            g.attr("transform", d3.event.transform);
        });
        try{
            zoomFunc.touchable(navigator.maxTouchPoints)
        }catch(e){
            console.log('Your device not support navigator.maxTouchPoints')
        }
        svg.append('rect').attr('class','pantarget')
            .attrs({
                'opacity':0,
                width: graphicopt.width,
                height: graphicopt.height,
            }).on('click',function(d){
            if (freezing) {
                g.selectAll('.node').style('pointer-events', 'auto').classed('fade',false).classed('hide',false).classed('highlight',false);
                linkg.selectAll('.links').classed('hide',false).classed('highlight',false);
                freezing = !freezing;
            }
        }).call(zoomFunc);

        g = svg.append("g")
            .attr('class','pannel')
            // .attr('transform',`translate(${graphicopt.margin.left},${graphicopt.margin.top})`);
        svg.select('.pantarget').call(zoomFunc.transform, d3.zoomIdentity.translate(graphicopt.margin.left,graphicopt.margin.top));
        g.append('text').attr('class','job_title hide').style('font-weight','bold').attrs({'text-anchor':"middle",'x':430,'dy':-20}).datum('Running jobs').text(d=>d);
        g.append('text').attr('class','host_title').style('font-weight','bold').attrs({'text-anchor':"middle",'x':300,'dy':-20}).text('Hosts');

        const gNodeaxis = g.append('g').attr('class','gNodeaxis hide').attr('transform',`translate(200,0)`);
        gNodeaxis.append('g').attr('class','gMainaxis');
        gNodeaxis.append('g').attr('class','gSubaxis');
        let annotation_back = g.append("g")
            .attr('class','annotation_back annotation');
        annotation_back
            .append("g")
            .attr('class','majorbar');
        annotation_back.append('text').attrs({x:400,y:0,class:'tablemessage hide'}).text('LOADING TABLE DATA');
        
        
        linkg = g.append("g")
            .attr('class','linkg');
        nodeg = g.append("g")
            .attr('class','nodeg');
        g.append("rect")
            .attr('class','fisheyeLayer')
            .style('opacity',0)
            .style('pointer-events', runopt.mouse.lensing?'auto':'none');

        table_headerNode = g.append('g').attr('class', 'table header').attr('transform', `translate(600,${0})`);
        table_headerNode.append('g').attr('class','back').append('path').styles({'fill':'#ddd'});

        timebox = svg.append('g').attr('class','timebox')
            .attr('transform','translate(40,20)')
            .style('font-size','16px').attr('dy','1rem');
        initTimebox();
        tippannel = d3.tip()
            .attr("class", "tippannel d3-tip")
            .attr("id", "tippannel")
            .direction('e')
            .offset([0, 5])
            .html('<button class="closeBTN" onclick="d3.select(\'#tippannel\').dispatch(\'hide\')"></button><div>' +
                '<p class="title"></p>' +
                `<button class="btn-small radarFullTime">Show ${viztype} series</button>` +
                '<button class="btn-small metricFullTime">Show metrics time series</button>' +
                '<button class="btn-small freezing">freeze</button></div>');
        svg.append('circle').attr('id', 'tipfollowscursor');
        svg.call(tippannel);
        d3.select('#tippannel').on('hide',tippannel.hide);
        d3.select('.tippannel').on('mouseover',function(){d3.select(this).classed('hover',true);  clearTimeout(tiptimer)})
            .on('mouseleave',function(){
                d3.select(this).classed('hover',false);
                if(!freezing)
                    setTimeout( ()=> {releasehighlight(); tippannel.hide();},500)
            });

        d3.select('#jobTable_control').on("change", function () {
            showtable = $(this).prop('checked');
            updateLayout(schema);
            makeheader();
            if (showtable&&triggerCal_Usermetric)
                computeUsermetric();
            handle_summary([],true);
        });
        registEvent(zoomFunc);

        d3.select('#hideUnchange_control').on("change", function () {
            runopt.hideUnchange = $(this).prop('checked');
            jobMap.data().draw();
        });


        d3.select('#jobOverlay').on("change", function () {
            runopt.overlayjob = $(this).prop('checked');
            if (runopt.compute.type==='timeline'){
                // drawOverlayJob (runopt.overlayjob);
                if (runopt.overlayjob ) {
                    tableHeader.currentsort = "Job_startTime";
                    d3.select(tableHeader.el).each(function(e){
                        e.direction=undefined;
                        d3.select(this).select('text').text(d=>d.value).call(d=>truncate(d,'↕'));
                    });
                }else
                    tableHeader.currentsort = undefined;
                // handle_sort(true);
                jobMap.draw();
            }else if (tableHeader.currentsort==="Job_startTime")
                tableHeader.currentsort = undefined;
        });

        suddenGroupslider = document.getElementById('suddenGroup_control');


        stepSizeslider = document.getElementById('stepSize_control');
        noUiSlider.create(stepSizeslider, {
            start: 1.5,
            connect: 'lower',
            tooltips: {to: function(value){return 'x'+value.toFixed(1)}, from:function(value){return Number(value.replace('x', ''));}},
            step: 0.5,
            orientation: 'horizontal', // 'horizontal' or 'vertical'
            range: {
                'min': 1,
                'max': 5,
            },
        });

        stepSizeslider.noUiSlider.on("change", function () {
            timelineStep = +this.get() * (yscale.range()[1]/maxTimestep);
            timelineScale.range([-timelineStep,0]);
            jobMap.drawComp();
        });

        let annotation_front = g.append("g")
            .attr('class','annotation_front annotation');
        annotation_front
            .append("g")
            .attr('class','majorbar');

        try {
            yscale.range([0, graphicopt.heightG()])
        }catch(e){

        }
        return jobMap;
    };

    function updateMaxTimestep(){
        stepSizeslider.noUiSlider.set(1.5);
        timelineStep = (yscale.range()[1]*1.5/maxTimestep);
        timelineScale.range([-timelineStep,0]);
        try {
            jobMap.drawComp();
        }catch(e){

        }
    }

    let tippannel, tiptimer;
    jobMap.remove = function (){
        if (simulation) simulation.stop();
        // UI reset
        $('#jobTable_control').prop('checked',false);
        $('#jobOverlay').prop('checked',false);
        d3.select('#jobTable_control').dispatch('change');
        nodeg.selectAll('*').remove();
        linkg.selectAll('*').remove();
        timebox.selectAll('*').remove();
        initTimebox();
        g.selectAll('.annotation .majorbar').selectAll('*').remove();
        g.selectAll('.annotation path.jobCover').remove();
        violinRange = [0,0];
        first = true;
        runopt.overlayjob = false;
        triggerCal_Usermetric = true;
        triggerCal_Cluster = true;
        lastIndex = 0;
        first__timestep = new Date();
        last_timestep = new Date();
        user =[];
        data=[];
        tableFooter=[];
        tableFooter.dataRaw =[];
        tableHeader.currentsort = undefined;
        return jobMap;
    };
    //----------------------color----------------------
    let colorCategory  = d3.scaleOrdinal().range(d3.schemeCategory20);
    let colorCluster  = d3.scaleOrdinal().range(d3.schemeCategory10);
    function pathRound(path,opt){
        opt.ctl = opt.ctl||0;
        opt.ctr = opt.ctr||0;
        opt.cbl = opt.cbl||0;
        opt.cbr = opt.cbr||0;
        let bpath ='';
        if(opt.ctl)
            bpath+=`M0,-${opt.ctl} q0,-${opt.ctl} ${opt.ctl},-${opt.ctl}`;
        else
            bpath+=`M0,0`;
        bpath+=` h${opt.width-opt.ctr-opt.ctl}`;
        if(opt.ctr)
            bpath+=`q${opt.ctr},0 ${opt.ctr},${opt.ctr}`;
        bpath+=`v${opt.height-opt.ctr-opt.cbr}`;
        if(opt.cbr)
            bpath+=`q0,${opt.cbr} -${opt.cbr},${opt.cbr}`;
        bpath+=`h-${opt.width-opt.cbr-opt.cbl}`;
        if(opt.cbl)
            bpath+=`q-${opt.cbl},0 -${opt.cbl},-${opt.cbl}`;
        bpath+=`z`;

        path.attr('d',bpath)
    }
    function getLinkKeyColor(d){
        switch (runopt.graphic.colorBy) {
            case 'user':
                return (_.isString(d.source.user)&&d.source.user)||d.target.user;
            case 'group':
                if (d.target.type==='job') {
                    if (d.source.__metrics)// cluster group
                        return d.source.name;
                    else
                        return _.last(d.source.timeline.clusterarr).cluster
                }
                return d.source.cluster;
            default:
                return (_.isString(d.source.user)&&d.source.user)||d.target.user;
        }
    }
    function colorFunc (key,other){
        switch (runopt.graphic.colorBy+(other||'')) {
            case 'user':
                return colorCategory(key);
            case 'group':
                return key===undefined?'black':colorCluster(key);
            default:
                return 'black';
        }
    }
    let createRadar = _.partialRight(createRadar_func,undefined,graphicopt.radaropt,colorFunc)
    // function createRadar(datapoint, bg, newdata, customopt) {
    //     let size_w = customopt?(customopt.size?customopt.size:graphicopt.radaropt.w):graphicopt.radaropt.w;
    //     let size_h = customopt?(customopt.size?customopt.size:graphicopt.radaropt.h):graphicopt.radaropt.h;
    //     let colorfill = (customopt&&customopt.colorfill)?0.5:false;
    //     let radar_opt = {
    //         w: size_w,
    //         h: size_h,
    //         schema: schema,
    //         margin: {left:0,right:0,top:0,bottom:0},
    //         levels: 6,
    //         mini:true,
    //         radiuschange: false,
    //         isNormalize: true,
    //         maxValue: 0.5,
    //         fillin: colorfill,
    //     };
    //
    //
    //     if (datapoint.empty()) {
    //         datapoint = bg
    //             .append("g")
    //             .datum(d => newdata.find(n => n.name === d.name))
    //             .attr("class", d => "compute linkLineg " + fixName2Class(d.name));
    //
    //     }
    //
    //     // replace thumnail with radar mini
    //     datapoint.each(function(d){
    //         d3.select(this).attr('transform',`translate(${-radar_opt.w/2},${-radar_opt.h/2})`)
    //         if (colorfill)
    //             radar_opt.color = function(){return colorFunc(d.name)};
    //         RadarChart(this, [d], radar_opt,"");
    //     });
    //     return datapoint;
    // }

    function drawHistogramMHosts (dataR) {
        let scale = d3.scaleLinear().domain(d3.extent(dataR,d=>(d.arr[lastIndex]||[]).length)).range([0,100]);
        let heightbar = graphicopt.radaropt.h/2;
        nodeg.selectAll('.computeNode').each(function(d){
            let value = (d.arr[lastIndex]||[]).length;
            let parentn = g.select('.annotation_back .majorbar').select(`g.${d.name}`);
            let parent_front = g.select('.annotation_front .majorbar').select(`g.${d.name}`);

            let vi = parentn.select('g.his');
            let vi_front = parent_front.select('g.his');
            if(vi.empty()) {
                vi = parentn.append('g').attr('class', 'his statics').attrs({
                    'transform': `translate(${graphicopt.radaropt.w / 2*0.75},0)`
                });
                vi_front = parent_front.append('g').attr('class', 'his statics').attrs({
                    'transform': `translate(${graphicopt.radaropt.w / 2*0.75},0)`
                });
                vi.append('rect').attrs({
                    height: heightbar,
                    'transform': `translate(0,${-heightbar / 2})`
                });
                vi_front.append('text').attrs({'class':'label',dy:'0.5em'});
            }
            vi.select('rect').attrs({
                width: scale(value),})
                .styles({'fill':d3.hsl(colorFunc(d.name)).brighter(1),'stroke':'none'});
            vi_front.select('text').text(value)
        });
    }

    function drawEmbedding(data,colorfill) {
        let newdata =handledata(data);
        let bg = svg.selectAll('.computeSig');
        bg.each(function (){
            let path = d3.select(this);
            if (path.select(".radar").empty()) {
                path.append('g').attr('class', 'radar');
            }
        });

            bg.select(".radar")
                .datum(d=>newdata.find(n=>n.name === d.name))
                .each(function(d){

                    createRadar(d3.select(this).select('.linkLineg'), d3.select(this), newdata.find(n => n.name === d.name), {colorfill:colorfill});
                });

    }
    let timelineStep = 10;
    let timelineScale = d3.scaleLinear().range([-timelineStep,0]);
    function updateClusterLabel(){
        try {
            if (clusterNode_data)
                nodeg.selectAll('.computeNode').select('.label').text(d => `Group ${d.orderG + 1}: ` + clusterdata.find(c => c.name === d.name).text).call(wrap, true);
        }catch(e){}
    }
    function drawOverlayJob(isoverlay){
        if(isoverlay){
            // let listCurrentJob = g.selectAll('.jobNode').data();
            let temp_link = g.selectAll('.links').data().filter(d => d.target.type === 'job');

            let scale = d3.scaleTime().range([timelineScale(0),timelineScale(timelineScale.domain()[1])]).domain([first__timestep,last_timestep]);
            let bg = svg.selectAll('.computeNode').select('.computeSig');
            let jobpatharr_sub = [];
            let jobpatharr_sta = [];
            let jobover = bg.selectAll('.joboverg').data(d=>{
                let temp = temp_link.filter(e => e.source.name === d.name);
                if (temp.length) {
                    let recentjob = _.maxBy(temp, t => +new Date(t.target.startTime)).target;
                    jobpatharr_sub.push({
                        x: fisheye_scale.x(scale(new Date(recentjob.submitTime))),
                        y: scaleNode_y_middle(d.order)
                    });
                    jobpatharr_sta.push({
                        x: fisheye_scale.x(scale(new Date(recentjob.startTime))),
                        y: scaleNode_y_middle(d.order)
                    });
                }
                return temp;
            },d=>d);
            jobover.exit().remove();
            jobover.enter().append('g').attr('class','joboverg').selectAll('.timemark').data(d=>{
                d = d.target;
                let temp = [
                    {key:'submit',value:d.submitTime},
                    {key:'start',value:d.startTime}];
                if(d.endTime)
                    temp.push({key:'end',value:d.endTime});
                return temp})
                .enter().append('path').attr('class',d=>`timemark ${d.key}`).style('stroke-width',2);
            bg.selectAll('.timemark').datum(d=>d).attr('d',d=>{
                let size = 3;
                switch (d.key) {
                    case 'submit':
                        return `M 0 -${size} L 0 0 L 0 ${size}`;
                    case 'start':
                        return `M -${size} -${size} L 0 0 L -${size} ${size}`;
                    default:
                        return `M ${size} -${size} L 0 0 L ${size} ${size}`;
                }
            }).attr('transform',function(d){return`translate(${d.value!==undefined?fisheye_scale.x(scale(new Date(d.value))):0},${scaleNode_y_middle(d3.select(this.parentNode.parentNode).datum().order)})`});
            // job path
            jobpatharr_sub.sort((a,b)=>a.y-b.y);
            jobpatharr_sta.sort((a,b)=>b.y-a.y);
            let jobpath = g.select('.annotation_back').select('path.jobCover');
            if (jobpath.empty())
                jobpath = g.select('.annotation_back').append('path').attr('class','jobCover');
            jobpath.attr('transform',`translate(${g.select('.computeNode').datum().x2},0)`).datum(_.concat(jobpatharr_sub,jobpatharr_sta)).attr('d',d3.line()
                .curve(d3.curveStepAfter)
                .x(d=>d.x)
                .y(d=>d.y)).style('fill','#ccc')
        }else {
            svg.selectAll('.computeSig').selectAll('.joboverg').remove();
            g.select('.annotation_back').select('path.jobCover').remove();
        }
        // d3.select('#legend').classed('hide',!isoverlay)
    }
    let animation_time = 2000;
    function drawEmbedding_timeline(data,colorfill) {
        // console.timeEnd('from compute to draw timeline');
        console.log('animation_time:',animation_time)
        // xscale
        let newdata = handledata(data);
        let bg = svg.selectAll('.computeSig');
        let lensingLayer=  g.select('.fisheyeLayer');
        if (!lensingLayer.on("mousemove"))
            lensingLayer.on("mousemove", function() {
                let mouse = d3.mouse(this);
                if(runopt.compute.type==="timeline"){
                    animation_time = 0;
                    bg.transition().selectAll("*").transition();
                    fisheye_scale.x= fisheye.scale(d3.scaleIdentity).domain([-timelineStep*timelineScale.domain()[1],0]).focus(mouse[0]-(+lensingLayer.attr('width')));
                    drawEmbedding_timeline(data,colorfill);
                }
            }).on("mouseleave",function () {
                animation_time = 2000;
                if(runopt.compute.type==="timeline"){
                    fisheye_scale.x = d=>d;
                    drawEmbedding_timeline(data,colorfill);
                }
            });


        if (!runopt.compute.bundle) {
            const radaropt = {colorfill: colorfill, size: Math.min(Math.max((scaleNode_y_middle(1) - scaleNode_y_middle(0)) * 2,12),50)};
            let datapoint;
            if (!runopt.suddenGroup) {
                datapoint= bg.selectAll(".linkLinegg").interrupt().data(d => d.timeline.clusterarr.map((e,i) => {
                    temp = _.cloneDeep(newdata.find(n => n.name === e.cluster));
                    temp.name = e.cluster;
                    temp.timestep = e.timestep;
                    if(!i)
                        temp.hide = true;
                    return temp;
                }),d=>d.name+d.timestep);
            }else{
                datapoint = bg.selectAll(".linkLinegg").data(d => d.timeline.clusterarr_sudden.map(e => {
                    temp = _.cloneDeep(newdata.find(n => n.name === e.cluster));
                    temp.name = e.cluster;
                    temp.timestep = e.timestep;
                    return temp;
                }),d=>d.name+d.timestep);
            }
            // datapoint.exit().remove();
            if (animation_time) {
                datapoint.exit().transition().duration(animation_time).style('opacity', 0).on('end', function () {
                    d3.select(this).remove();
                });
            }else
                datapoint.exit().remove();
            let datapoint_n = datapoint.enter().append('g')
                .attr('class', 'linkLinegg timeline');
            // datapoint.exit().remove();
            if (animation_time) {
                datapoint_n.style('opacity', 0)
                    .transition().duration(animation_time).style('opacity', 1);
            }else{
                datapoint_n.style('opacity', 0).style('opacity', 1);
            }
            datapoint_n.attr('transform', function (d) {
                return `translate(${fisheye_scale.x(timelineScale(d.timestep))},${scaleNode_y_middle(d3.select(this.parentNode).datum().order)})`
            }).each(function (d, i) {
                createRadar(d3.select(this).select('.linkLineg'), d3.select(this), newdata.find(n => n.name === d.name), radaropt).classed('hide', d.hide);// hide 1st radar
            });
            datapoint.style('opacity',1).transition().duration(animation_time)
                .attr('transform', function (d) {
                    return `translate(${fisheye_scale.x(timelineScale(d.timestep))},${scaleNode_y_middle(d3.select(this.parentNode).datum().order)})`
                }).each(function (d, i) {
                createRadar(d3.select(this).select('.linkLineg'), d3.select(this), newdata.find(n => n.name === d.name), radaropt).classed('hide', d.hide);// hide 1st radar
            });
            bg.style('stroke-width', d => linkscale(d.values_name.length));

            // bg.selectAll("path.linegg").remove();
            let dataline = bg.selectAll(".linegg").interrupt().data(d => d.timeline.line,d=>d.cluster+'_'+d.start).attr('class', d => `linegg timeline ${fixName2Class(d.cluster)}`);
            dataline.interrupt().transition().duration(animation_time)
                .attr('d',function(d){
                    return d3.line().curve(d3.curveMonotoneX).x(function(d){return fisheye_scale.x(timelineScale(d))}).y(()=> scaleNode_y_middle(d3.select(this.parentNode).datum().order))(d3.range(d.start,d.end+1))});;
            dataline.exit().remove();
            dataline.enter().append('path')
                .attr('class', d => `linegg timeline ${fixName2Class(d.cluster)}`)
                .attr('d',function(d){
                    return d3.line().curve(d3.curveMonotoneX).x(function(d){return fisheye_scale.x(timelineScale(d))}).y(()=> scaleNode_y_middle(d3.select(this.parentNode).datum().order))(d3.range(d.start,d.end+1))})
                .merge(dataline)
                .styles({
                    stroke: d => colorFunc(d.cluster),
                    'stroke-width': function (d) {
                        return linkscale(d3.select(this.parentNode).datum().values_name.length)
                    }
                });

            if (runopt.compute.jobOverlay) {
                let jobtick = bg.selectAll(".jobtickg").data(d => linkdata);
            } else {
                bg.selectAll(".jobtickg").remove();
            }
            drawOverlayJob(runopt.overlayjob);
        }
        else {
            let curveBundle = d3.line()
                .curve(d3.curveMonotoneX)
                .x(function(d) { return d[0]; })
                .y(function(d) { return d[1]; });

            bg.selectAll(".linkLinegg.timeline").interrupt().remove();
            let datacurve = bg.selectAll(".linegg").interrupt().data(d => d.timeline.lineFull,d=>d.cluster+'_'+d.start).attr('class', d => `linegg timeline ${fixName2Class(d.cluster)}`) ;
            datacurve.interrupt().transition().duration(animation_time)
                .attr("d", function(d,i){
                    const datap = d3.select(d3.select(this).node().parentNode).datum();
                    let supportp=false;
                    let data_path = d3.range(d.start,(d.end+1)===maxTimestep?(d.end+1):(d.end+2)).map(e=>
                        e>d.end?(supportp=true,[fisheye_scale.x(timelineScale(e)-timelineStep*0.5),scaleNode_y_middle(d.cluster,e,datap.name)]):[fisheye_scale.x(timelineScale(e)),scaleNode_y_middle(d.cluster,e,datap.name)]
                    );
                    if (supportp)
                        data_path.push([fisheye_scale.x(timelineScale(d.end+1)),scaleNode_y_middle(datap.timeline.lineFull[i+1].cluster,d.end+1,datap.name)]);
                    return curveBundle(data_path);
                    // linkHorizontal({
                    //     source: {
                    //         x: fisheye_scale.x(timelineScale(d.end)),
                    //         y: scaleNode_y_middle(d.cluster,d.end,datap.values_name[0]),
                    //     },
                    //     target: {
                    //         x: fisheye_scale.x(timelineScale(d.start)),
                    //         y: scaleNode_y_middle(datap[i+1].cluster,datap[i+1].end,datap.values_name[0]),
                    //     }});
                })
            datacurve.exit().remove();
            datacurve.enter()
                .append('path')
                .attr('class', d => `linegg timeline ${fixName2Class(d.cluster)}`)
                .attr("d", function(d,i){
                    const datap = d3.select(d3.select(this).node().parentNode).datum();
                    let supportp=false;
                    let data_path = d3.range(d.start,(d.end+1)===maxTimestep?(d.end+1):(d.end+2)).map(e=>
                        e>d.end?(supportp=true,[fisheye_scale.x(timelineScale(e)-timelineStep*0.5),scaleNode_y_middle(d.cluster,e,datap.name)]):[fisheye_scale.x(timelineScale(e)),scaleNode_y_middle(d.cluster,e,datap.name)]
                    );
                    if (supportp)
                        data_path.push([fisheye_scale.x(timelineScale(d.end+1)),scaleNode_y_middle(datap.timeline.lineFull[i+1].cluster,d.end+1,datap.name)]);
                    return curveBundle(data_path);
                    // linkHorizontal({
                    //     source: {
                    //         x: fisheye_scale.x(timelineScale(d.end)),
                    //         y: scaleNode_y_middle(d.cluster,d.end,datap.values_name[0]),
                    //     },
                    //     target: {
                    //         x: fisheye_scale.x(timelineScale(d.start)),
                    //         y: scaleNode_y_middle(datap[i+1].cluster,datap[i+1].end,datap.values_name[0]),
                    //     }});
                })
                .merge(datacurve)
                .styles({
                stroke: d => colorFunc(d.cluster),
                'stroke-width': function (d) {
                    return linkscale(d3.select(this.parentNode).datum().values_name.length)
                }
            });
        }
        bg.on('mouseover',function(d){
            if (!freezing)
                releasehighlight();
            clearTimeout(tiptimer);
            d3.selectAll('.d3-tip').styles({'pointer-events':'none','opacity':0})

            function showSymbolSeries() {
                let maxstep = d3.max(clusterdata, c => c.arr.length) - 1;
                let layout = tooltip_lib.layout();
                layout.axis.x.domain = [[first__timestep, last_timestep]];
                const scaletime = d3.scaleTime().domain(layout.axis.x.domain[0]).range([0, maxstep]);
                layout.axis.y.label = [];
                layout.axis.y.domain = [];
                layout.axis.y.tickFormat = [];
                layout.background = undefined;
                layout.drawFunc = createRadar;
                layout.drawopt = {colorfill: true, size: 50};
                // layout.background.value[layout.background.value.length - 1].x1 = last_timestep;
                const data_in = d.values_name.map(name => {
                    let data_temp = hostOb[name].data.map((o, i) => {
                        temp = schema.map((s,si)=>({axis:s.text,value:o[si]}));
                        temp.name = hostOb[name].arrcluster[i];
                        temp.timestep = scaletime.invert(i);
                        return temp;
                    });
                    layout.axis.y.label.push(name);
                    return data_temp;
                });

                layout.title = '';
                layout.title2 = ``;

                tooltip_lib.graphicopt({
                    width: tooltip_opt.width,
                    height: 50,
                    margin: {top: 0, bottom: 0, left: 0, right: 0}
                }).data(data_in, true).layout(layout).show($('#tipfollowscursorDiv')[0]);
            }

            function showMetrics() {
                let maxstep = d3.max(clusterdata, c => c.arr.length) - 1;
                let layout = tooltip_lib.layout();
                layout.axis.x.domain = [[first__timestep, last_timestep]];
                layout.axis.x.tickFormat = [multiFormat];
                const scaletime = d3.scaleTime().domain(layout.axis.x.domain[0]).range([0, maxstep]);
                layout.axis.y.label = [];
                layout.axis.y.domain = [];
                layout.axis.y.tickFormat = [];
                layout.background = {
                    type: 'discrete',
                    value: d.timeline.clusterarr.map((v, i) => {
                        return {
                            x0: scaletime.invert(v.timestep),
                            x1: d.timeline.clusterarr[i + 1] ? scaletime.invert(d.timeline.clusterarr[i + 1].timestep) : undefined,
                            color: colorFunc(v.cluster)
                        }
                    })
                };
                layout.background.value[layout.background.value.length - 1].x1 = last_timestep;
                const data_in = schema.map((s,si) => {
                    let scaleY = d3.scaleLinear().range(s.range);
                    let data_temp = d.values_name.map(h => {
                        let temp = hostOb[h].data.map(e => {
                            return {
                                y: scaleY(e[si]),
                                x: e.time,
                            }
                        });
                        temp.label = h;
                        return temp;
                    });
                    layout.axis.y.label.push(s.text);
                    layout.axis.y.domain.push(s.range);
                    if (s.range[1] > 1000)
                        layout.axis.y.tickFormat.push(d3.format('~s'));
                    else
                        layout.axis.y.tickFormat.push(null);
                    return data_temp;
                });
                layout.title = '';
                layout.title2 = `#host: ${d.values_name.length}`;
                tooltip_lib.graphicopt({
                    width: tooltip_opt.width,
                    height: 100,
                    margin: tooltip_opt.margin
                }).data(data_in).layout(layout).show($('#tipfollowscursorDiv')[0]);
            }

            if(runopt.mouse.auto) {
                var target = d3.select('#tipfollowscursor')
                    .attr('cx', d3.event.offsetX)
                    .attr('cy', d3.event.offsetY - 5) // 5 pixels above the cursor
                    .node();
                tippannel.show(d, target);
                let tipdiv = d3.select('.tippannel');
                tipdiv.select('.title').html(`<b>Selected ${d.values_name.length} host${(d.values_name.length > 1 ? 's' : '')}</b>`)
                tipdiv.select('.radarFullTime').text(`Show ${viztype} series`).on('click', () => {
                    showSymbolSeries();
                    tippannel.hide();
                });
                tipdiv.select('.metricFullTime').on('click', () => {
                    showMetrics();
                    tippannel.hide();
                });
                tipdiv.select('.freezing').text(freezing ? 'Unfreeze' : 'freeze').on('click', () => {
                    d3.select(this.parentNode).dispatch('click');
                })
            }else{
                if (!runopt.mouse.disable) {
                    if (runopt.mouse.showseries)
                        showSymbolSeries();
                    else if (runopt.mouse.showmetric)
                        showMetrics();
                }
            }
        }).on('mouseleave',function(d){
            if(!freezing) {
                tiptimer = setTimeout(() => {
                    releasehighlight();
                    tippannel.hide();
                }, 500);
                tooltip_lib.hide();
            }
        });

        updateaxis();
    }

    function updateaxis() {
        let bg = svg.selectAll('.computeSig');
        let rangey = d3.extent(bg.data(),d=>d.y2===undefined?d.y:d.y2);
        let scale = d3.scaleTime().range([timelineScale(0),timelineScale(timelineScale.domain()[1])]).domain([first__timestep,last_timestep]);

        let axis = svg.select('.gNodeaxis')
            .classed('hide',false)
            .attr('transform',`translate(${bg.datum().x2||bg.datum().x},${rangey[0]})`);
        let Maxis = axis.select('.gMainaxis')
            .call(d3.axisTop(scale).tickSize(rangey[0]-rangey[1]).tickFormat(multiFormat));
        Maxis.select('.domain').remove();
        let mticks =Maxis.selectAll('.tick');
        mticks
            .transition().duration(animation_time).attr('transform',d=>`translate(${fisheye_scale.x(scale(d))},0)`);
        mticks.select('text').attr('dy','-0.5rem');
        mticks.select('line').attr("vector-effect","non-scaling-stroke").style('stroke-width',0.1).styles({'stroke':'black','stroke-width':0.2,'stroke-dasharray':'1'})

        let Saxis = axis.select('.gSubaxis').classed('hide',true);
        if (fisheye_scale.x.focus) {
            const timearray = scale.ticks();
            Saxis.classed('hide',false);
            let pos2time = scale.invert(fisheye_scale.x.focus());
            let timesubarray = [new Date(+pos2time - (timearray[1] - timearray[0])), new Date(+pos2time + (timearray[1] - timearray[0]))];
            if (timesubarray[0]<first__timestep){
                timesubarray[0] = first__timestep;
                timesubarray[1] = new Date(+timesubarray[0] + (timearray[1] - timearray[0])*2)
            }else if(timesubarray[1]>last_timestep) {
                timesubarray[1] = last_timestep;
                timesubarray[0] = new Date(+timesubarray[1] - (timearray[1] - timearray[0])*2)
            }
            let subaxis = d3.scaleTime().range(timesubarray.map(t=>scale(t))).domain(timesubarray);

            let timearray_sub = _.differenceBy(subaxis.ticks(),timearray,multiFormat)

            Saxis.call(d3.axisTop(subaxis).tickSize(rangey[0]-rangey[1]).tickFormat(multiFormat).tickValues(timearray_sub));
            Saxis.select('.domain').remove();
            let sticks = Saxis.selectAll('.tick').attr('transform',d=>`translate(${fisheye_scale.x(subaxis(d))},0)`);
            sticks.select('line').attr("vector-effect","non-scaling-stroke").style('stroke-width',0.1).style('stroke-dasharray','1 3')
            sticks.select('text').style('font-size',8)
        }
    }

    jobMap.drawComp = function (){
        g.selectAll('.majorbar').classed('hide',true);
        switch(runopt.compute.type){
            case "radar":
                svg.selectAll('.computeNode').selectAll('.piePath').remove();
                svg.selectAll('.computeNode').selectAll('.timeline').remove();
                svg.select('.gNodeaxis').classed('hide',true);
                if (clusterNode_data){
                    drawEmbedding(clusterNode_data.map(d=>{let temp = d.__metrics.normalize;temp.name = d.name; return temp;}),runopt.graphic.colorBy==='group');
                    g.selectAll('.majorbar').classed('hide',false);
                    drawHistogramMHosts(clusterNode_data);
                }else {
                    if (arr.length)
                        drawEmbedding(arr)
                }
                break;
            case "timeline":
                svg.selectAll('.computeNode').selectAll('.piePath').remove();
                svg.selectAll('.computeNode').selectAll('.radar').remove();
                drawEmbedding_timeline(clusterdata.map(d=>{let temp = d.__metrics.normalize;temp.name = d.name; return temp;}),true);
                break;
            case "pie":
            default:
                svg.select('.gNodeaxis').classed('hide',true);
                svg.selectAll('.computeNode').selectAll('.timeline').remove();
                svg.selectAll('.computeNode').selectAll('.radar').remove();
                drawPie(svg.selectAll('.computeNode'));
                break;
        }
        return jobMap;
    };

    function handledata(data){
        let objectarr = data.map(a=>{
            let temp = a.map((d,i)=>{return {axis: schema[i].text, value: d, enable: schema[i].enable};});
            temp = _.sortBy(temp,d=>schema.find(e=>e.text===d.axis).angle);
            temp.name = a.name;
            return temp;
        });
        return objectarr;
    }

    function drawPie(computers) {
        computers.select('.computeSig').select('.linkLineg').remove();
        var arc = d3.arc()
            .outerRadius(graphicopt.node.r)
            .innerRadius(0);
        let pie = d3.pie()
            .value(function (d) {
                return d.value;
            })
            .sort(function (a, b) {
                return d3.ascending(a.order, b.order);
            })

        let piePath = computers
            .select('.computeSig')
            .selectAll('.piePath').data(d => {
                let tempdata = d.user.map(e => {
                    return {
                        value: e.unqinode_ob[d.name].length,
                        order: e.order,
                        user: e.name,

                    }
                });
                return pie(tempdata)
            });
        piePath.exit().remove();
        piePath.enter().append('path').attr('class', 'piePath')
            .attr('d', arc).style('fill', d => colorFunc(d.data.user,getsubfixcolormode()));
    }
    function getsubfixcolormode(){
        return runopt.graphic.colorBy==='group'?'_no':undefined;
    }
    let yscale=d3.scaleLinear().range([0,graphicopt.heightG()]),linkscale = d3.scaleSqrt().range([0.3,2]);
    let scaleNode = d3.scaleLinear();
    let scaleNode_y = d3.scaleLinear();
    let scaleJob = d3.scaleLinear();
    let Jobscale = d3.scaleSqrt().range([0.5,3]);
    let intersectionWorker;
    function renderManual(computers, jobNode, link) {
        if (runopt.compute.type==='timeline' &&  !runopt.compute.bundle && runopt.overlayjob)
            jobNode.data().sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).forEach((d, i) => d.order = i);
        else
            jobNode.data().sort((a, b) => user.find(e => e.key === a.user).order - user.find(e => e.key === b.user).order).forEach((d, i) => d.order = i);
        g.selectAll('.jobNode.new').classed('new',false).attr('transform', d => {
            d.x2 = 430;
            d.y = scaleJob(d.order);
            return `translate(${d.x2},${d.y})`
        }).style('opacity',0);
        jobNode.transition().duration(animation_time).attr('transform', d => {
            d.x2 = 430;
            d.y = scaleJob(d.order);
            return `translate(${d.x2},${d.y})`
        }).style('opacity',undefined);

        if (runopt.compute.type==='timeline') {
            if (!runopt.compute.bundle) {
                let temp_link = link.data().filter(d => d.target.type === 'job');
                if (!runopt.overlayjob){
                //     computers.data().forEach(d => {
                //         d.order = d3.max(temp_link.filter(e => e.source.name === d.name),e=>+new Date(e.target.startTime))||0});
                //     computers.data().sort((a, b) => a.order - b.order).forEach((d, i) => d.order = i);
                // }else{
                    computers.data().forEach(d => d.y = d3.mean(temp_link.filter(e => e.source.name === d.name), f => f.target.y));
                    if (!jobEmpty)
                        computers.data().sort((a, b) => a.y - b.y).forEach((d, i) => d.order = i);
                    else
                        computers.data().forEach((d, i) => d.order = i);
                }
                g.select('.host_title').attrs({'text-anchor': "end", 'x': 300, 'dy': -20}).text("Hosts's timeline");
                scaleNode_y_middle = d3.scaleLinear().range(yscale.range()).domain([0, computers.data().length - 1]);

                g.selectAll('.computeNode.new').classed('new',false).attr('transform', d => {
                    d.x2 = 300;
                    d.y2 = scaleNode_y_middle(d.order);
                    // return `translate(${d.x2},${d.y2 || d.y})`
                    return `translate(${d.x2},0)`
                }).style('opacity',0);
                computers.transition().duration(animation_time).attr('transform', d => {
                    d.x2 = 300;
                    d.y2 = scaleNode_y_middle(d.order);
                    // return `translate(${d.x2},${d.y2 || d.y})`
                    return `translate(${d.x2},0)`
                }).style('opacity',undefined);
            }else{
                let bundle_cluster = clusterdata.map(c=>{return {cluster:c.name,maxinstance:d3.max(c.arr,e=>e?e.length:0),arr:d3.range(0,maxTimestep).map(()=>[]),orderscale:{_last:0},crossing:{},totalcrossing:0}});
                let bundle_cluster_ob = {};
                bundle_cluster.forEach((b,i)=>(b.bid=i,bundle_cluster_ob[b.cluster] = b));
                //
                let clusterkey = runopt.suddenGroup?"clusterarr_sudden":"clusterarr";
                // arrange group for avoid crossing
                //<editor-fold desc="Arrange group">
                computers.data().forEach(c=> {
                    for (let i = 0;i<c.timeline[clusterkey].length-1;i++) {
                        bundle_cluster_ob[c.timeline[clusterkey][i].cluster].crossing[c.timeline[clusterkey][i+1].cluster] = (bundle_cluster_ob[c.timeline[clusterkey][i].cluster].crossing[c.timeline[clusterkey][i+1].cluster]||0) +1;
                        bundle_cluster_ob[c.timeline[clusterkey][i+1].cluster].crossing[c.timeline[clusterkey][i].cluster] = (bundle_cluster_ob[c.timeline[clusterkey][i+1].cluster].crossing[c.timeline[clusterkey][i].cluster]||0) +1;
                        bundle_cluster_ob[c.timeline[clusterkey][i].cluster].totalcrossing++;
                        bundle_cluster_ob[c.timeline[clusterkey][i+1].cluster].totalcrossing++;
                    }
                });

                bundle_cluster.sort((a,b)=>b.totalcrossing-a.totalcrossing);

                let list = bundle_cluster.map(b=>b.cluster);
                let headB = list.pop();
                bundle_cluster_ob[headB].orderbycross = 0;
                let count = 1;

                //<editor-fold desc="Arrange group base on newest element">
                while(count<bundle_cluster.length){
                    let max_n=0;
                    let headB_temp =undefined;
                    list.forEach(l=>{if(bundle_cluster_ob[headB].crossing[l]>max_n){
                        max_n = bundle_cluster_ob[headB].crossing[l];
                        headB_temp = l;
                    }});
                    if (!headB_temp)
                        headB_temp = list.pop();
                    bundle_cluster_ob[headB_temp].orderbycross = count;
                    _.pull(list,headB_temp);
                    headB = headB_temp;
                    count++;
                }
                //</editor-fold>

                //<editor-fold desc="Arrange group base on maximum connection">
                while(count<bundle_cluster.length){
                    let max_n=0;
                    let headB_temp =undefined;
                    list.forEach(l=>{if(bundle_cluster_ob[headB].crossing[l]>max_n){
                        max_n = bundle_cluster_ob[headB].crossing[l];
                        headB_temp = l;
                    }});
                    if (!headB_temp)
                        headB_temp = list.pop();
                    bundle_cluster_ob[headB_temp].orderbycross = count;
                    _.pull(list,headB_temp);
                    headB = headB_temp;
                    count++;
                }
                //</editor-fold>

                bundle_cluster.sort((a,b)=>a.orderbycross-b.orderbycross).forEach((b,i)=>b.bid = i);
                //</editor-fold>


                // max instance stay top
               // bundle_cluster.sort((a,b)=>b.maxinstance-a.maxinstance).forEach((b,i)=>b.bid = i);

                computers.data().forEach(c=>{
                    c.order=0;
                    c.bundle={};
                    c.arr.forEach((t,i)=>{
                        const bi = bundle_cluster_ob[t].bid;
                        c.order+=bi;
                        const old = c.bundle[bundle_cluster[bi].cluster];
                        c.bundle[bundle_cluster[bi].cluster] = Math.min(old===undefined?Infinity:old,i);
                    });
                });
                computers.data().sort((a,b)=>a.order-b.order)
                    .forEach(c=>{
                    c.arr.forEach((t,i)=>{
                        const bi = bundle_cluster.findIndex(b=>b.cluster===t);
                        if (!bundle_cluster[bi].orderscale[c.name]){
                            bundle_cluster[bi].orderscale[c.name] = bundle_cluster[bi].orderscale._last;
                            bundle_cluster[bi].orderscale._last++;
                        }
                        // bundle_cluster[bi].arr[i][c.name] = bundle_cluster[bi].orderscale(i);

                    });
                });
                const maxBundle = bundle_cluster.map((d,i)=>(d.totalc = d.orderscale._last||1,d.offset= i?(bundle_cluster[i-1].offset+bundle_cluster[i-1].totalc):0,d.totalc));
                // const maxBundle = bundle_cluster.map((d,i)=>(d.totalc = d3.max(d.lastindex_arr),d.offset= i?(bundle_cluster[i-1].offset+bundle_cluster[i-1].totalc):0,d.totalc));
                const fullScaleB =  d3.scaleLinear().range(yscale.range()).domain([0, d3.sum(maxBundle)-1]);
                scaleNode_y_middle = function(clustername,ti,computeID){
                    const masteb = bundle_cluster_ob[clustername];
                    return fullScaleB(masteb.orderscale[computeID]+masteb.offset);
                    // return fullScaleB(masteb.arr[ti][computeID]+masteb.offset);
                };
                computers.transition().duration(animation_time).attr('transform', d => {
                    d.x2 = 300;
                    const lastItem = _.last(d.timeline.lineFull);
                    d.y2 = scaleNode_y_middle(lastItem.cluster,lastItem.end,d.name);
                    d.y = 0;
                    return `translate(${d.x2},0)`
                });

                // calculate intersection
                if (intersectionWorker)
                    intersectionWorker.terminate();
                intersectionWorker = new Worker ('src/script/worker/intersetion_worker.js');
                intersectionWorker.postMessage({
                    maxTimestep:maxTimestep,
                    clusterdata_timeline:clusterdata_timeline,
                    bundle_cluster_ob:bundle_cluster_ob,
                    range: yscale.range(),
                    domain: [0, d3.sum(maxBundle)-1],
                });
                intersectionWorker.addEventListener('message',({data})=>{
                    if (data.action==='done') {
                        console.log(`#Intersection: ${data.result}`)
                        // preloader(false,undefined,undefined,'#clusterLoading');
                        intersectionWorker.terminate();
                    }
                    if (data.action==='returnData'){
                        // onloaddetermire({process:data.result.process,message:`# iterations: ${data.result.iteration}`},'#clusterLoading');
                    }
                }, false);
            }
            updateaxis();
            let lensingLayer=  g.select('.fisheyeLayer');
            lensingLayer.attrs({
                'width':timelineScale(timelineScale.domain()[1])-timelineScale(0),
            }).attr('height',yscale.range()[1]-yscale.range()[0]);
            lensingLayer.attr('transform',`translate(${300-(+lensingLayer.attr('width'))},${yscale.range()[0]})`)
        }else{
            computers.data().sort((a, b) => (b.arr[lastIndex]||[]).length - (a.arr[lastIndex]||[]).length).forEach((d, i) => d.order = i);// sort by temperal instance
            g.select('.host_title').attrs({'text-anchor':"middle",'x':300,'dy':-20}).text("Major host groups");
            // computers.data().sort((a, b) => b.arr ? b.arr[b.arr.length - 1].length : -1 - a.arr ? a.arr[a.arr.length - 1].length : -1).forEach((d, i) => d.order = i);
            g.selectAll('.computeNode.new');
            computers.transition().duration(animation_time).attr('transform', d => {
                d.x = 300;
                d.x2 = 300;
                d.y = scaleNode_y(d.order);
                return `translate(${d.x2},${d.y})`
            });
            let barhis = g.selectAll('.majorbar').selectAll('g.m').data(computers.data(),d=>d.name);
            barhis.exit().remove();
            barhis. enter().append('g').attr('class',d=>`${d.name} m`);
            barhis.attr('class',d=>`${d.name} m`);
            g.selectAll('.majorbar').selectAll('g.m').transition().duration(animation_time).attr('transform',d=>`translate(${d.x2},${d.y})`);

        }
        link.transition().duration(animation_time)
            .call(updatelink);
    }
    let last_timestep = new Date();
    function trimNameArray(text){
        let namearr = text.split(' ');
        if (namearr.length<3)
            return namearr.join(', ');
        else{
            nametr = namearr.slice(0,2).join(', ');
            nametr += `, +${namearr.length-2} more`;
            return nametr;
        }
    }


    let linkHorizontal = d3.linkHorizontal()
        .x(function(d) {
            return d.x;
        })
        .y(function(d) {
            return d.y;
        });

    function updatelink (path,transition){
        (transition?path.select('path').transition().duration(animation_time):path.select('path'))
            .attr("d", d=>{
                return linkHorizontal({
                    source: {
                        x: (d.source.x2===undefined?d.source.y: d.source.x2)+ (d.source.type==='job'?graphicopt.job.r:(clusterNode_data&&d.source.type===undefined?graphicopt.radaropt.w/2:0)),
                        y: d.source.y2===undefined?d.source.y: d.source.y2,
                    },
                    target: {
                        x: (d.target.x2===undefined?d.target.x: d.target.x2) - ((d.source.type==='job')||(d.target.type==='job')?graphicopt.user.r:0),
                        y: d.target.y2===undefined?d.target.y: d.target.y2,
                    }});
            });
        path.select('text').attr("transform", function(d) {
            return "translate(" +
                (((d.source.x2 || d.source.x) + (d.target.x2 || d.target.x))/2) + "," +
                (((d.source.y2===undefined?d.source.y: d.source.y2) + (d.target.y2===undefined?d.target.y: d.target.y2))/2) + ")";
        })
        return path;
    }
    function initTimebox(){
        timebox.append('rect').attrs({width:200,height:10,fill:'#e1e0e2'});
        timebox.append('rect').attrs({class:'timebox_range',width:0,height:10,fill:'#6f0000'});
        timebox.append('g').attrs({class:'timebox_axis'});
        const handle = timebox.append('g').attrs({class:'timebox_handle'}).attr('transform',`translate(0,10)`);
        handle.append('polygon').attr("points","0,0 -6,10 6,10");
        handle.append('text').attrs({y:20,dy:'.1rem','font-size':'12','fill':'#6f0000','text-anchor':"middle","font-weight":"bold"});
    }
    function updateTimebox(index,limit){
        limit = limit||index;
        let scale = d3.scaleLinear().domain([0,limit-1]).range([0,200]);
        let scaleT = d3.scaleTime().range([0,scale(index)]).domain([first__timestep,last_timestep]);
        timebox.select('.timebox_range').attr('width',scale(index));
        timebox.select('.timebox_axis')
            .call(d3.axisTop(d3.scaleTime().range(scale.range()).domain([first__timestep,scaleT.invert(200)])).tickSize(-10).ticks(5).tickFormat(multiFormat));
        timebox.select('.timebox_handle').attr('transform',`translate(${scale(index)},10)`).select('text').text(multiFormat(last_timestep));
    }
    let maxTimestep;

    function releaseSelection() {
        g.selectAll('.jobNode').classed('hide', false).classed('highlight', false);
        g.selectAll('.userNode').classed('fade', false).classed('highlight', false);
        g.selectAll('.computeNode').classed('fade', false).classed('highlight', false);
        linkg.selectAll('.links').classed('hide', false).classed('highlight', false);
        nodeg.select('.table.footer').classed('fade', false);
    }

    function toggleComponent(jobEmpty) {
        linkg.classed('hide', jobEmpty);
        g.selectAll('.jobNode').classed('hide', jobEmpty);
        g.selectAll('.table').classed('hide', jobEmpty);
        g.selectAll('.userNode').classed('hide', jobEmpty);
        g.selectAll('.pannel .job_title').classed('hide', jobEmpty);
    }

    jobMap.draw = function (islight){
        let timeStep = new Date(last_timestep.toString());
        let timeStep_r = last_timestep.toString();
        // timebox.html(`<tspan x="10" dy="1.2em">${timeStep.toLocaleTimeString()}</tspan>
        //                 <tspan x="10" dy="1.2em">Timestep: ${lastIndex+1}/${(maxTimestep===undefined?'_':maxTimestep)}</tspan>`);
        updateTimebox(lastIndex,maxTimestep);
        timebox.classed('hide',runopt.compute.type==='timeline');
        yscale = d3.scaleLinear().domain([-1,user.length]).range([0,graphicopt.heightG()]);
        // yscale = d3.scaleLinear().domain([-1,user.length]).range([0,Math.min(graphicopt.heightG(),30*(user.length))]);
        let deltey = yscale(1)-yscale(0);
        if (runopt.compute.clusterNode&&clusterNode_data)
            scaleNode_y.domain([0,clusterNode_data.length-1]).range(yscale.range());
        scaleJob.domain([0,data.length-1]).range(yscale.range());

        tableLayout.row.height = Math.min(deltey,30);
        violiin_chart.graphicopt({height:tableLayout.row.height,color:(i)=>'black'});
        // compute pie
        if(first) {
            makeheader();
        }
        if(!islight&&animation_time===0){
            nodeg.selectAll('.computeNode').remove();
        }
        let computers = nodeg.selectAll('.computeNode').data(clusterdata_timeline||clusterNode_data||Hosts,d=> d.name);
        computers.select('.computeSig').datum(d=>d);
        computers.exit().remove();
        let computers_n = computers.enter().append('g').attr('class',d=>'node computeNode new '+fixName2Class(fixstr(d.name)));

        computers_n.append('g').attrs(
            {'class':'computeSig',
                'stroke':'black',
            });
        computers_n.append('text').attrs(
            {'class':'computeSig_label label',
                'opacity':0,
                'text-anchor':'end',
                'dx':-graphicopt.node.r,
                'dy':'0.5rem',
                'fill':'black',
                'width': textWarp
            }).merge(computers.select('.computeSig_label')).text(d=>d.orderG!==undefined?`Group ${d.orderG+1}${d.text!==''?`: ${d.text}`:''}`:trimNameArray(d.name))
            // .call(wrap,true)
        ;

        computers = nodeg.selectAll('.computeNode');
        computers.select('.label').classed('hide',runopt.compute.type==='timeline');

        computers.classed('statics', true);
        if(!islight){
            computers.select('.computeSig_label').call(wrap,true);
            if(isLastTrigger) {
                setTimeout(() => {
                    computeUsermetric();
                    handle_summary([], true);
                }, 0);
                isLastTrigger = false;
            }
            //job node
            if (data.length) {
                g.select('.job_title').classed('hide', false);
                let timerange = [d3.min(data, d => new Date(d.submitTime)), timeStep];
                timerange[0] = new Date(timerange[0].toDateString());
                timerange[1].setDate(timerange[1].getDate() + 1);
                timerange[1] = new Date(timerange[1].toDateString());
                let time_daynum = d3.timeDay.every(1).range(timerange[0], timerange[1]).length;
                var radius = d3.scaleTime()
                    .domain(timerange)
                    .range([graphicopt.job.r_inside, graphicopt.job.r]);

                var theta = d3.scaleTime()
                    .domain(timerange)
                    .range([0, Math.PI * 2 * (time_daynum - 1)]);

                var spiral = d3.radialLine()
                    .curve(d3.curveCardinal)
                    .angle(theta)
                    .radius(radius);

                let backdround_spiral = d3.timeHour.every(1).range(timerange[0], timerange[1]);
            } else {
                g.select('.job_title').classed('hide', true);
            }
            let jobNode = nodeg.selectAll('.jobNode').data(data, function (d) {
                return d.name
            });
            jobNode.exit().remove();
            let jobNode_n = jobNode.enter().append('g').attr('class', d => 'node jobNode new ' + fixName2Class(fixstr(d.name)));

            jobNode_n.append('circle')
                .attrs(
                    {
                        'class': 'computeSig_b',
                        // 'd': d=>spiral([new Date(d.submitTime),new Date(d.startTime),timeStep]),
                        // 'd': d=>spiral(backdround_spiral),
                        'r': graphicopt.job.r,
                        'fill': '#dddddd',
                        'opacity': 0.2,
                        'stroke-width': 0,
                    });
            jobNode_n.append('path')
                .attrs(
                    {
                        'class': 'computeSig_sub submitTime',
                    });
            jobNode_n.append('path')
                .attrs(
                    {
                        'class': 'computeSig_start timeBoxRunning',
                    })
            ;
            jobNode_n.append('text').attr('class', 'lelftext label').attrs({'x': -graphicopt.job.r}).style('text-anchor', 'end');
            jobNode_n.append('text').attr('class', 'righttext label').attrs({'x': graphicopt.job.r});
            jobNode = nodeg.selectAll('.jobNode');
            jobNode.select('.computeSig_b').attr('r', graphicopt.job.r);
            jobNode.select('.computeSig_sub.submitTime').attr('d', function (d) {
                let temp = d3.timeHour.every(1).range(new Date(d.submitTime), new Date(d.startTime));
                temp.pop();
                temp.push(new Date(d.startTime));
                return spiral(temp);
            })
            ;
            jobNode.select('.computeSig_start.timeBoxRunning').attr('d', function (d) {
                let temp = d3.timeHour.every(1).range(new Date(d.startTime), new Date(timeStep_r.toString()));
                temp.pop();
                temp.push(new Date(timeStep_r.toString()));
                return spiral(temp);
            });
            jobNode.select('.lelftext').text(d => `#Hosts: ${d.nodes.length}`)
            jobNode.select('.righttext').text(d => d.values ? `#Jobs: ${d.values.length}` : '')

            jobNode.selectAll('path').style('stroke-width', d => d.values ? Jobscale(d.values.length) : 1.5);


            let userNode = nodeg.selectAll('.userNode').data(user, d => d.name);
            userNode.exit().remove();
            let userNode_n = userNode.enter().append('g').attr('class', d => 'node userNode new ' + fixName2Class(fixstr(d.name)));

            userNode_n.append('circle').attrs(
                {
                    'class': 'userNodeSig',
                    'r': graphicopt.user.r,
                });
            userNode_n.append('circle').attrs(
                {
                    'class': 'userNodeImg',
                    'r': graphicopt.user.r,
                    'fill': d => "url(#userpic)"
                });

            userNode_n.append('text').attrs(
                // {'class':'userNodeSig_label',
                //     'y': -graphicopt.user.r,
                //     'text-anchor':'middle',
                // });
                {
                    'class': 'userNodeSig_label',
                    'dy': '0.25rem',
                    'x': graphicopt.user.r + 4,
                    // 'text-anchor':'middle',
                });


            userNode = nodeg.selectAll('.userNode');
            userNode.select('.userNodeSig').styles(
                {
                    'fill-opacity': 0.5,
                    'fill': d => {
                        const color = colorFunc(runopt.graphic.colorBy === 'group' ? d.cluster : d.name);
                        return color === 'black' ? 'white' : color;
                    }
                });
            userNode.select('.userNodeSig_label')
                .text(d => d.name);

            handle_sort(true, true);
            updaterow(userNode);
            // table_header(table_headerNode);
            // make table footer
            let table_footerNode = nodeg.select('.table.footer');
            if (table_footerNode.empty())
                table_footerNode = nodeg.append('g').attr('class', 'table footer');
            table_footerNode.append('g').attr('class', 'back').append('path').styles({'fill': '#ddd'});

            table_footerNode.attr('transform', `translate(600,${yscale(user.length)})`);
            table_footer(table_footerNode);


            let node = nodeg.selectAll('.node');

            let ticked = function () {
                node.each(d => {
                    d.x = Math.max(graphicopt.node.r, Math.min(d.x, graphicopt.widthG() - graphicopt.node.r));
                });
                // if(this.alpha()<0.69) {
                let range_com = d3.extent(computers.data(), d => d.x);
                scaleNode.domain(range_com).range([50, 120]);
                g.select('.host_title').attrs({
                    'text-anchor': "start",
                    'x': 100,
                    'dy': scaleNode_y(0) - 20
                }).text("Hosts");
                computers.data().sort((a, b) => a.y - b.y).forEach((d, i) => d.order = i);
                if (runopt.compute.type === 'timeline') {
                    // scaleNode_y_middle = d3.scaleLinear().range([yscale.range()[1]/2,yscale.range()[1]/2+10]).domain([computers.data().length/2,computers.data().length/2+1])
                    scaleNode_y_middle = d3.scaleLinear().range(yscale.range()).domain([0, computers.data().length - 1])
                }
                computers.transition().attr('transform', d => {
                    if (runopt.compute.type === 'timeline') {
                        d.x2 = 200;
                        d.y2 = scaleNode_y_middle(d.order);
                    } else if (runopt.compute.clusterNode) {
                        d.x = 200;
                        d.x2 = 200;
                    } else
                        d.x2 = scaleNode(d.x);
                    if (runopt.compute.clusterNode && this.alpha() < 0.6)
                        d.y = scaleNode_y(d.order);
                    return `translate(${d.x2},${d.y2 || d.y})`
                });
                let range_job = d3.extent(jobNode.data(), d => d.x);
                scaleNode.domain(range_job).range([370, 450]);
                jobNode.data().sort((a, b) => a.y - b.y).forEach((d, i) => d.order = i);
                jobNode.transition().attr('transform', d => {
                    d.x2 = scaleNode(d.x);
                    if (runopt.compute.clusterNode && this.alpha() < 0.6)
                        d.y = scaleJob(d.order);
                    return `translate(${d.x2},${d.y})`
                });

                link.transition()
                    .call(updatelink)
                if (runopt.compute.type === 'timeline')
                    updateaxis();
            };

            initForce();

            function getGradID(d) {
                return 'links' + d.index;
            }

            simulation
                .nodes(node.data()).stop();
            simulation.force("link")
                .links(linkdata);
            let link = linkg.selectAll('.links').data(linkdata.filter(d => d.type === undefined), d => d.source.name + "-" + d.target.name);
            link.exit().remove();
            let link_n = link.enter()
                .append('g')
                .attr("class", "links");
            link_n
                .append('path');
            link_n
                .append('text').attr("text-anchor", "middle");


            link = linkg.selectAll('.links');
            link.select('text').text(function (d) {
                return d.links ? d.links : ''
            });
            link.select('path')
                .attr("stroke", d => colorFunc(getLinkKeyColor(d)))
                .style("stroke-width", function (d) {
                    return d.links === undefined ? 1 : linkscale(d.links);
                });

            // reset freezing action
            freezing = false;
            releasehighlight();
            g.selectAll('.userNode')
                .call(path => freezinghandle(path, [function (d) {
                    g.selectAll('.userNode').classed('fade', true);
                    d3.select(this).classed('highlight', true);
                    link.classed('hide', true);
                    const sametarget = link.filter(f => d === f.target).classed('hide', false).classed('highlight', true).data();
                    const samesource = link.filter(f => sametarget.find(e => e.source === f.target)).classed('hide', false).classed('highlight', true).data();
                    g.selectAll('.jobNode').classed('hide', true);
                    g.selectAll('.jobNode').filter(f => sametarget.find(e => e.source === f)).classed('hide', false).classed('highlight', true).selectAll('.label').classed('hide', true);
                    g.selectAll('.computeNode').classed('fade', true);
                    g.selectAll('.computeNode').filter(f => samesource.find(e => e.source === f)).classed('highlight', true);
                    table_footerNode.classed('fade', true);
                }, null
                ], [function (d) {
                    g.selectAll('.userNode').classed('fade', false);
                    d3.select(this).classed('highlight', false);
                    g.selectAll('.jobNode').classed('hide', false).classed('highlight', false).selectAll('.label').classed('hide', false);
                    g.selectAll('.computeNode').classed('fade', false).classed('highlight', false);
                    link.classed('hide', false).classed('highlight', false);
                    table_footerNode.classed('fade', false);
                }, null
                ]));
            g.selectAll('.computeNode')
                .call(path => freezinghandle(path, [function (d) {
                    d3.select(this).classed('highlight', true).select('.computeSig_label').text(d => d.orderG !== undefined ? `Group ${d.orderG + 1}${d.text !== '' ? `: ${d.text}` : ''}` : trimNameArray(d.name)).call(wrap, false);
                    const samesource = link.filter(f => d === f.source).classed('hide', jobEmpty).classed('highlight', true).data();
                    const sametarget = link.filter(f => samesource.find(e => e.target === f.source)).classed('hide', jobEmpty).classed('highlight', !jobEmpty).data();
                    g.selectAll('.jobNode').filter(f => samesource.find(e => e.target === f)).classed('hide', jobEmpty).classed('highlight', !jobEmpty).selectAll('.label').classed('hide', !jobEmpty);
                    g.selectAll('.userNode').filter(f => sametarget.find(e => e.target === f)).classed('highlight', !jobEmpty);

                    g.selectAll('.computeNode:not(.highlight)').classed('fade', true);
                    linkg.selectAll('.links:not(.highlight)').classed('hide', true);
                    g.selectAll('.jobNode:not(.highlight)').classed('hide', true);
                    g.selectAll('.userNode:not(.highlight)').classed('fade', true);
                    table_footerNode.classed('fade', true);
                    callback.mouseover(d.values_name)
                }, null], [function (d) {
                    if (runopt.compute.type !== 'timeline') {
                        d3.select(this).select('.computeSig_label').text(d => d.orderG !== undefined ? `Group ${d.orderG + 1}${d.text !== '' ? `: ${d.text}` : ''}` : trimNameArray(d.name)).call(wrap, true);
                        g.selectAll('.computeNode').classed('fade', false).classed('highlight', false);
                        g.selectAll('.jobNode').classed('hide', jobEmpty).classed('highlight', false).selectAll('.label').classed('hide', jobEmpty);
                        g.selectAll('.userNode').classed('fade', false).classed('highlight', false);
                        link.classed('hide', false).classed('highlight', false);
                        table_footerNode.classed('fade', false);
                    }
                    callback.mouseleave()
                }, null]));
            g.selectAll('.jobNode')
                .call(path => freezinghandle(path, [function (d) {
                    g.selectAll('.jobNode').classed('hide', true);
                    d3.select(this).classed('hide', false).classed('highlight', true);
                    link.classed('hide', true);
                    const samesource = link.filter(f => d === f.source).classed('hide', false).classed('highlight', true).data();
                    const sametarget = link.filter(f => d === f.target).classed('hide', false).classed('highlight', true).data();
                    d3.selectAll('.userNode').classed('fade', true);
                    d3.selectAll('.userNode').filter(f => samesource.find(e => e.target === f)).classed('highlight', true);
                    d3.selectAll('.computeNode').classed('fade', true);
                    d3.selectAll('.computeNode').filter(f => sametarget.find(e => e.source === f)).classed('highlight', true);
                    table_footerNode.classed('fade', true);
                }, null], [function (d) {
                    releaseSelection();
                }, null]));

            if (!runopt.compute.clusterNode && runopt.compute.type !== 'timeline')
                simulation.alphaTarget(0.3).on("tick", ticked).restart();
            else {
                renderManual(computers, jobNode, link);
            }
            link.call(updatelink, true);
            toggleComponent(jobEmpty);
            function initForce(){
                if (!simulation) {
                    let repelForce = d3.forceManyBody().strength(d=> (d.type==='job')?0:-150);
                    let attractForce = d3.forceManyBody().strength(d=> (d.type==='job')?0:100);
                    simulation = d3.forceSimulation()
                        .force("link", d3.forceLink().id(function (d) {
                            return d.name;
                        }).distance(200).strength(d => d.type ? 1 : 0.9))
                        .force("collide", d3.forceCollide(d =>
                            (d.type === 'job') ? 0.001 : graphicopt.node.r).strength(0.8))
                        .force("charge1", attractForce)
                        .force("charge2", repelForce)
                        .force("x", d3.forceX(function (
                            d) {
                            return (d.type === 'job') ? 400 : ((d.type === 'user') ? 600 : 0)
                        }).strength(function (d) {
                            return d.type === 'job' ? 0.8 : 0.8
                        })).alphaTarget(1)
                        .on("tick", ticked);
                    simulation.fistTime = true;
                }else {
                }
            }
        }
        jobMap.drawComp();
        first = false;

        return jobMap;
    };
    function releasehighlight(){
        g.selectAll('.node').style('pointer-events','auto').classed('fade',false).classed('hide',false).classed('highlight',false);
        g.selectAll('.node .jobNode').classed('hide',jobEmpty);
        g.selectAll( '.links').classed('hide',false).classed('highlight',false);
        g.select('.table.footer').classed('fade',false);
    }
    function getstrokearray (self){
        return (self||this).getTotalLength()-graphicopt.job.r
    }
    function getstrokearray_offset (d){
        return d.source.type==='job'?-graphicopt.job.r:0;
    }
    function table_header(path,isFull){
        let headerData = isFull?tableHeader:tableHeader.filter(d=>tableLayout.column[d.key].type!=='graph');
        path.select('.back').attr('transform',`translate(0,${10})`);
        pathRound(path.select('.back').select('path'),{width:tableLayout.row.width,height:25,ctl:10,ctr:10});
        let rows = path.selectAll('.row').data([headerData]);
        rows.exit().remove();
        let rows_n = rows.enter().append('g').attr('class', 'row')
            .attr('transform',`translate(0,${-tableLayout.row.height/2})`);
        // rows_n.append('rect').attrs({'class':'back-row','width':tableLayout.row.width,'height':tableLayout.row.height});
        let cells = rows_n.merge(rows).selectAll('.cell').data(d=>d);
        cells.exit().remove();

        let cells_n = cells.enter().append('g').attr('class',d=>'cell '+tableLayout.column[d.key].type).attr('transform',d=>`translate(${tableLayout.column[d.key].x},20)`);
        cells_n.append('text').styles({'font-weight':'bold'}).attrs(d=>{return {width:tableLayout.column[d.key].width}});
        cells = cells_n.merge(cells);
        cells.select('text').text(d=>d.value).call(d=>{
            const dir = d.datum().direction;
            if (dir)
                truncate(d,'▲');
            else if (dir===undefined)
                truncate(d,'↕');
            else
                truncate(d,'▼');
        });
        cells.on('click',function(d){
            tableHeader.el = this;
            if (d.key!==tableHeader.currentsort)
                cells.filter(e=>e.key===tableHeader.currentsort)
                    .each(function(e){
                        e.direction=undefined;
                        d3.select(this).select('text').text(d=>d.value).call(d=>truncate(d,'↕'));
                    });
            if(tableHeader.currentsort==='Job_startTime'){
                runopt.overlayjob = false;
                $('#jobOverlay').prop('checked',false);
            }
            tableHeader.currentsort = d.key;
            tableHeader.direction = (d.direction=!d.direction);
            handle_sort(true);
            d3.select(this).select('text').text(d=>d.value).call(d=>{
                const dir = d.datum().direction;
                if (dir)
                    truncate(d,'▲');
                else if (dir===undefined)
                    truncate(d,'↕');
                else
                    truncate(d,'▼');
            });
        })

    }
    function table_footer(path){
        path.select('.back').attr('transform',`translate(0,${-tableLayout.row.height/2})`);
        pathRound(path.select('.back').select('path'),{width:tableLayout.row.width,height:tableLayout.row.height,cbl:10,cbr:10});
        let customrange = showtable?[0,d3.max(tableFooter.filter(d=>tableLayout.column[d.key].type==='graph'),e=>d3.max(e.value.arr,d=>d[1]))]:[0,0];
        let rows = path.selectAll('.row').data([showtable?tableFooter:tableFooter.filter(e=>tableLayout.column[e.key])]);
        rows.exit().remove();
        let rows_n = rows.enter().append('g').attr('class', 'row')
            .attr('transform',`translate(0,${-tableLayout.row.height/2})`);
        // rows_n.append('rect').attrs({'class':'back-row','width':tableLayout.row.width,'height':tableLayout.row.height});
        let cells = rows_n.merge(rows).selectAll('.cell').data(d=>d);
        cells.exit().remove();

        let cellsText = cells.filter(d=>d&&tableLayout.column[d.key].type!=='graph');
        let cells_n = cells.enter().append('g').attr('class',d=>'cell '+tableLayout.column[d.key].type).attr('transform',d=>`translate(${tableLayout.column[d.key].x},${tableLayout.column[d.key].y})`);
        let cellsText_n = cells_n.filter(d=>d&&tableLayout.column[d.key].type!=='graph');
        cellsText_n.append('text');
        cellsText_n.merge(cellsText).select('text').text(d=>d.value);

        let cellsGraph = cells.filter(d=>d&&tableLayout.column[d.key].type==='graph');
        let cellsGraph_n = cells_n.filter(d=>d&&tableLayout.column[d.key].type==='graph');
        cellsGraph_n.append('g').attr('class','violing');
        path.selectAll('.row .graph').select('g.violing').each(function(d){
            violiin_chart.rangeY(customrange).data([d.value]).draw(d3.select(this))
        })
    }
    function updaterow(path){
        let rows = path.selectAll('.row').data(d=>[showtable?tableData[d.name]:tableData[d.name].filter(e=>tableLayout.column[e.key])],e=>e.id);
        rows.exit().remove();
        let rows_n = rows.enter().append('g').attr('class', 'row')
            .attr('transform',`translate(0,${-tableLayout.row.height/2})`);
        // rows_n.append('rect').attrs({'class':'back-row','width':tableLayout.row.width,'height':tableLayout.row.height});
        let cells = rows_n.merge(rows).selectAll('.cell').data(d=>d,d=>d.key);
        cells.exit().remove();

        let cellsText = cells.filter(d=>tableLayout.column[d.key].type!=='graph');
        let cells_n = cells.enter().append('g').attr('class',d=>'cell '+tableLayout.column[d.key].type).attr('transform',d=>`translate(${tableLayout.column[d.key].x},${tableLayout.column[d.key].y})`);
        let cellsText_n = cells_n.filter(d=>tableLayout.column[d.key].type!=='graph');
        cellsText_n.append('text');
        cellsText=cellsText_n.merge(cellsText).select('text').text(d=>{
            let custom = tableLayout.column[d.key].format;
            if (custom)
                return d3.format(custom)(d.value);
            else
                return d.value;
        });

        let cellsGraph = cells.filter(d=>tableLayout.column[d.key].type==='graph');
        let cellsGraph_n = cells_n.filter(d=>tableLayout.column[d.key].type==='graph');
        cellsGraph_n.append('g').attr('class','violing');
        cellsGraph_n.merge(cellsGraph).on('mouseover',function(d){
            if (freezing) {
                let username = d3.select(this.parentNode).datum().id;
                let data_temp = user.find(u => u.key === username).dataRaw;
                let scaleY = d3.scaleLinear().range(schema.find(s => s.text === d.key).range);
                let data = d3.nest().key(e => e.name).rollup(f => {
                    let temp = f.map((e, i) => {
                        return {
                            y: scaleY(e.find(a => a.axis === d.key).value),
                            x: e.time,
                        };
                    });
                    temp.label = f[0].name;
                    return temp;
                }).entries(data_temp).map(e => e.value);
                let layout = tooltip_lib.layout();
                layout.background = undefined;
                layout.axis.y.label = [d.key];
                layout.axis.x.domain = [[first__timestep, last_timestep]];
                layout.axis.x.tickFormat = [multiFormat];
                layout.axis.y.domain = [scaleY.range()];
                layout.title = `User: ${username}`;
                layout.title2 = `#host(s): ${data.length}`;
                if (layout.axis.y.domain[0][1] > 1000)
                    layout.axis.y.tickFormat = [d3.format('~s')];
                tooltip_lib.graphicopt(tooltip_opt).data([data]).layout(layout).show();
            }
        });
        path.selectAll('.row .graph').select('g.violing').each(function(d){
            violiin_chart.rangeY(violinRange).data([d.value]).draw(d3.select(this))
        })
    }
    let tableLayout = {
        row:{
            width: 500,
            height: 20,//deltey,
            'graph-width': 70,
        },
        column:{
            'UserID': {id:'UserID',type:'text',x: 10,y:20,width:60},
            'Hosts': {id:'Hosts',text:'#Hosts',type:'num',x: 120,y:20,width:60},
            'Jobs': {id:'Jobs',text:'#Jobs',type:'num',x: 170,y:20,width:52},
        }
    };
    // let violiin_chart = d3.viiolinChart().graphicopt({width:tableLayout.row["graph-width"],height:20,opt:{dataformated:true},tick:{visibile:false},middleAxis:{'stroke-width':0.5}});
    let violiin_chart = d3.histChart().graphicopt({width:tableLayout.row["graph-width"],height:20,opt:{dataformated:true},tick:{visibile:false},middleAxis:{'stroke-width':0.5},symmetric: true});
    let linkdata = [];
    let user = [];
    let hostOb={};
    let hiddenlink = [];

    function handle_sort(disableLinkSort,skiprender) {
        if(tableHeader.currentsort===undefined)
            user.sort((a, b) => b.values.length - a.values.length);
        else
            switch (tableHeader.currentsort) {
                case 'Job_startTime':
                    user.forEach(u=>u.jobStart_order=[]);
                    let temp_link = linkdata.filter(d => d.target.type === 'job');
                    g.selectAll('.computeNode').data().forEach(d => {
                        let temp = temp_link.filter(e => e.source.name === d.name);
                        d.order = d3.max(temp,e=>+new Date(e.target.startTime))||0;
                        if (temp.length){
                            temp.forEach(t=>user.find(u=>u.name===t.target.user).jobStart_order.push(d.order));
                        }
                    });
                    g.selectAll('.computeNode').data().sort((a, b) => a.order - b.order).forEach((d, i) => (d.order = i,d.values_name.forEach(h=>hostOb[h].order=i)));
                    // user.sort((a, b) => );
                    user.forEach(u=>u.jobStart_order=_.mean(u.jobStart_order));
                    user.sort((a,b)=>a.jobStart_order-b.jobStart_order);
                    break;
                case 'UserID':
                    user.sort((a, b) => a.name.localeCompare(b.name)*(-1+2*tableHeader.direction));
                    break;
                case 'Hosts':
                    user.sort((a, b) => (b.unqinode.length - a.unqinode.length)*(-1+2*tableHeader.direction));
                    break;
                case 'Jobs':
                    user.sort((a, b) => (b.values.length - a.values.length)*(-1+2*tableHeader.direction));
                    break;
                case 'PowerUsage':
                    var indexf = tableHeader.findIndex(d=>d.key===tableHeader.currentsort)-1;
                    user.sort((a, b) => ((tableData[b.name][indexf]||{value:-Infinity}).value - (tableData[a.name][indexf]||{value:-Infinity}).value)*(-1+2*tableHeader.direction));
                    break;
                default:
                    var indexf = tableHeader.findIndex(d=>d.key===tableHeader.currentsort)-1;
                    user.sort((a, b) => ((tableData[b.name][indexf]||{value:{median:-Infinity}}).value.median - (tableData[a.name][indexf]||{value:{median:-Infinity}}).value.median)*(-1+2*tableHeader.direction));
                    break;
            }
        user.forEach((d, i) => {
            delete d.jobStart_order;
            d.order = i;
            d.orderlink = i;
        });
        if (!disableLinkSort) {
            Hosts.forEach(d => {
                let n = d.user.length;
                if (n > 1) {
                    const linkoorder = d3.min(d.user, e => e.order);
                    for (let i = 0; i < n; i++) {
                        d.user[i].orderlink = Math.min(linkoorder, d.user[i].orderlink);
                    }
                }
            });
            // order by links
            user.sort((a, b) => a.orderlink - b.orderlink).forEach((d, i) => d.order = i);
        }
        g.selectAll('.userNode.new').classed('new',false).attr('transform',d=>{
            d.fy=yscale(d.order);
            d.fx=600;
            d.y=d.fy;
            d.x=d.fx;
            return `translate(${d.fx},${d.fy})`
        });
        g.selectAll('.userNode').transition().duration(animation_time)
            .attr('transform',d=>{
                d.fy=yscale(d.order);
                d.fx=600;
                d.y=d.fy;
                d.x=d.fx;
                return `translate(${d.fx},${d.fy})`
            });
        if ((runopt.compute.type==='timeline' || runopt.compute.clusterNode)&&!skiprender) {
            renderManual(d3.selectAll('.node.computeNode'), d3.selectAll('.node.jobNode'), d3.selectAll('.links'))
            jobMap.drawComp();
        }
    }
    let clusterNode_data,clusterdata,clusterdata_timeline;
    let clusterlineScale = d3.scaleLinear().range([0,400]);
    function cluster_line(path){ //timelinescale
        let clineg = path.selectAll('.cline_g').data(d=>d.cvalues);
        clineg.exit().remove();
        let clineg_n = clineg.enter().append(g).attr('class','cline_g');
        clineg_n.append('path').attr('class')
    }
    let estimateRadar = 0;
    function updateClusterTimeline() {
        try {
            estimateRadar = 0;
            let maxstep = d3.max(clusterdata, c => c.arr.length) - 1;
            for (let ts = 0; ts < maxstep + 1; ts++) {
                clusterdata.forEach(c => {
                    ct = c.arr[ts];
                    if (ct)
                        ct.forEach(h => {
                            hostOb[h].arrcluster[ts] = c.name;
                            let currentarr = hostOb[h].timeline.clusterarr;
                            if (runopt.suddenGroup && ts > 0 && ts < maxstep && calculateMSE_array(hostOb[h].data[ts - 1], hostOb[h].data[ts]) > clusterdata.find(c => c.name === hostOb[h].arrcluster[ts - 1]).mse * runopt.suddenGroup) {
                                hostOb[h].timeline.clusterarr_sudden.push({cluster: c.name, timestep: ts});
                            }
                            if (currentarr.length && c.name === hostOb[h].timeline.clusterarr[currentarr.length - 1].cluster) {
                                hostOb[h].timeline.clusterarr.stack++;
                                hostOb[h].timeline.lineFull[hostOb[h].timeline.lineFull.length - 1].end = ts;
                                if (hostOb[h].timeline.clusterarr.stack === 1)
                                    hostOb[h].timeline.line.push({cluster: c.name, start: ts - 1, end: ts});
                                else if (hostOb[h].timeline.clusterarr.stack > 1)
                                    hostOb[h].timeline.line[hostOb[h].timeline.line.length - 1].end = ts;
                            } else {
                                hostOb[h].timeline.clusterarr.push({cluster: c.name, timestep: ts});
                                hostOb[h].timeline.lineFull.push({cluster: c.name, start: ts, end: ts});
                                hostOb[h].timeline.clusterarr.stack = 0;
                                estimateRadar++;
                            }
                        });

                });
            }
            timelineScale.domain([maxstep - 1, maxstep]);
            if(estimateRadar>1000)
                animation_time = 0;
            // fisheye_scale.x.domain([-maxstep*timelineScale.range()[0],0]);
        }catch (e) {
            animation_time = 0;
        }
    }
    let first__timestep = new Date();
    let lastIndex = 0;
    let deltaTime = 0;
    let triggerCal_Cluster = true;
    let isLastTrigger = false;
    function handle_links (timeStep_r,lastIndex_r,triggerCluster){
        // console.time('jobmap compute')
        triggerCal_Cluster = triggerCluster||triggerCal_Cluster;
        if (timeStep_r) {
            last_timestep = new Date(timeStep_r.toString());
            lastIndex = lastIndex_r
            if (first__timestep>last_timestep)
                first__timestep = last_timestep;
            deltaTime = (last_timestep - first__timestep)/maxTimestep;
        }
        harr_old = [];
        if (simulation)
            simulation.stop();
        linkdata = [];
        Hosts.forEach(h=>{
            h.user=[];
            h.arrcluster = [];
            if (triggerCal_Cluster) {
                h.timeline = {clusterarr: [], line: [], lineFull: [], clusterarr_sudden: []};
            }
        });
        isLastTrigger = lastIndex===(maxTimestep-1);
        if (isLastTrigger) {
            animation_time = 2000;
            if (triggerCal_Cluster) {
                updateClusterTimeline();
                // triggerCal_Cluster = false; // optimise speed here TODO
            }
            let user_n = current_userData();
            // .sort((a,b)=>b.values.length-a.values.length).filter((d,i)=>i<12);
            // tableData = {}
            Object.keys(tableData).forEach(k => tableData[k].keep = false);
            data = dataRaw.filter(d => user_n.findIndex(e => e.key === d.user) !== -1);
            // data=dataRaw;
            // _.differenceBy(listallJobs.filter(l=>!l.endTime),dataRaw,'jobID').forEach(f=>f.endTime=last_timestep.toString()); //job has been ended
            listallJobs = _.unionBy(listallJobs, dataRaw, 'jobID');
            data.forEach(d => {
                d.name = d.jobID + '';
                d.type = 'job';
                d.nodes.forEach(n => {
                    let temp = {source: n, target: d.jobID + ''};
                    let temp2 = {source: d.jobID + '', target: d.user};

                    linkdata.push(temp);
                    if (linkdata.indexOf(temp2) === -1)
                        linkdata.push(temp2);
                });
                let oldData = nodeg.selectAll('.node.jobNode').data().find(e => e.name === d.name || (e.values ? e.values.findIndex(v => v.name === d.name) !== -1 : false));
                if (oldData) {
                    d.x = oldData.x;
                    d.x2 = oldData.x2;
                    d.y = oldData.y;
                    d.fx = oldData.fx;
                    d.fy = oldData.fy;
                    d.vx = oldData.vx;
                    d.vy = oldData.vy;
                }
            });

            let newdata = [];
            jobEmpty = user_n.length===0||user_n[0].key ==="dummyJob";

            user = user_n.map((d, i) => {
                d.name = d.key;
                d.order = i;
                d.orderlink = i;
                d.type = 'user';
                d.unqinode_ob = {};
                d.unqinode.forEach(n => {
                    d.unqinode_ob[n] = d.values.filter(e => e.nodes.find(f => f === n));
                    hostOb[n].user.push(d);
                });
                if (runopt.compute.clusterJobID) {
                    const range_temp_sub = d3.extent(d.values, e => +new Date(e.submitTime));
                    const range_temp_st = d3.extent(d.values, e => +new Date(e.startTime));
                    const scale_temp_sub = d3.scaleLinear().domain([range_temp_sub[0], range_temp_sub[0] + runopt.compute.clusterJobID_info.groupBy]);
                    const scale_temp_st = d3.scaleLinear().domain([range_temp_st[0], range_temp_st[0] + runopt.compute.clusterJobID_info.groupBy]);
                    let group_temp_ob = _.groupBy(d.values, function (d) {
                        return '' + Math.floor(scale_temp_sub(+new Date(d.submitTime))) + Math.floor(scale_temp_st(+new Date(d.startTime)))
                    });
                    for (var k in group_temp_ob) {
                        let temp = _.cloneDeep(group_temp_ob[k][0]);
                        temp.x = d3.mean(group_temp_ob[k], e => e.x);
                        temp.x2 = d3.mean(group_temp_ob[k], e => e.x2);
                        temp.y = d3.mean(group_temp_ob[k], e => e.y);
                        temp.fx = d3.mean(group_temp_ob[k], e => e.fx);
                        temp.fy = d3.mean(group_temp_ob[k], e => e.fy);
                        temp.vx = d3.mean(group_temp_ob[k], e => e.vx);
                        temp.vy = d3.mean(group_temp_ob[k], e => e.vy);
                        temp.values = group_temp_ob[k];
                        temp.nodes = _.uniq(_.flatten(group_temp_ob[k].map(g => g.nodes)));
                        let namearr = group_temp_ob[k].map(d => d.name);
                        temp.name = namearr.join(' ');
                        let sameSource = linkdata.filter(e => namearr.find(f => f === e.source + ''));

                        let temp_g = _.groupBy(sameSource, function (e) {
                            return e.target
                        });
                        Object.keys(temp_g).forEach(k => {
                            temp_g[k].forEach((e, i) => {
                                if (i === 0) {
                                    e.source = temp.name;
                                    e.links = temp_g[k].length;
                                } else {
                                    e.del = true;
                                }
                            });
                        });

                        sameSource = linkdata.filter(e => namearr.find(f => f === e.target + ''));
                        temp_g = _.groupBy(sameSource, function (e) {
                            return e.source
                        });
                        Object.keys(temp_g).forEach(k => {
                            temp_g[k].forEach((e, i) => {
                                if (i === 0) {
                                    e.target = temp.name;
                                    e.links = temp_g[k].length;
                                } else {
                                    e.del = true;
                                }
                            });
                        });
                        newdata.push(temp)
                    }
                    d3.extent(d.values, e => +new Date(e.submitTime))
                }
                d.dataRaw = (user.find(e => e.name === d.name) || {dataRaw: []}).dataRaw || [];
                d.PowerUsage = (user.find(e => e.name === d.name) || {PowerUsage: 0}).PowerUsage || 0;
                tableData[d.name] = tableData[d.name] || [{key: 'Hosts', value: 0},
                    {key: 'Jobs', value: 0}];
                tableData[d.name][0].value = d.unqinode.length;
                tableData[d.name][1].value = d.values.length;
                tableData[d.name].id = d.name;
                tableData[d.name].keep = true;
                return d
            });
            if (runopt.compute.clusterJobID) {
                linkdata = linkdata.filter(d => !d.del);
                linkscale.domain(d3.extent(linkdata, d => d.links));
                data = newdata;
                Jobscale.domain(d3.extent(data, d => d.values.length));
            }
        }else{
            toggleComponent(true);
            triggerCal_Cluster=true;
            animation_time = 0;
        }

        if (runopt.compute.clusterNode) {
            clusterdata.forEach(c =>{
                let namearr = c.arr[lastIndex];
                if (namearr) {
                    let sameSource = linkdata.filter(e => namearr.find(f => f === e.source + ''));
                    let temp_g = _.groupBy(sameSource,function(e){return e.target});
                    Object.keys(temp_g).forEach(k=>{
                        temp_g[k].forEach((e,i)=>{
                            if(i===0) {
                                e.source = c.name;
                                e.links = temp_g[k].length;
                            }else{
                                e.del = true;
                            }
                        });
                    });
                }
            });
            if (isLastTrigger)
                clusterNode_data = clusterdata.filter(d=>d.arr.length&&d.arr[lastIndex]);
            else
                clusterNode_data = clusterdata;
            linkdata = linkdata.filter(d => !d.del);
            linkscale.domain(d3.extent(linkdata,d=>d.links));
        }else
            clusterNode_data = undefined;
        if (lastIndex===(maxTimestep-1)){
            if (runopt.compute.type==='timeline') {
                clusterdata_timeline = [];
                let similarity_queeue = [];
                switch (runopt.timelineGroupMode) {
                    case 'group':
                        let listcomp = hosts.map(h=>{
                            let e = h.name;
                            return hostOb[e];
                        });
                        let temp_g = _.groupBy(listcomp,function(e){return JSON.stringify(e.timeline.lineFull)});
                        Object.keys(temp_g).forEach(k=>{
                            let temp_h = {};
                            temp_h.values_name = temp_g[k].map(e=>e.name);
                            temp_h.name = temp_h.values_name.join(' ');
                            if ((temp_g[k][0].timeline.lineFull.length>1 || !runopt.hideUnchange)) {
                                temp_g[k].forEach((n) => {
                                    linkdata.filter(f => f.source === n.name).forEach((e, i) => {
                                        e.source = temp_h.name;
                                    });
                                });

                                temp_h.timeline = JSON.parse(JSON.stringify(temp_g[k][0].timeline)); // clone timeline
                                if (runopt.suddenGroup){
                                    temp_h.timeline.clusterarr_sudden = [];
                                    temp_g[k].forEach(e=>temp_h.timeline.clusterarr_sudden=_.unionWith(e.timeline.clusterarr_sudden,temp_h.timeline.clusterarr_sudden, _.isEqual));
                                }

                                temp_h.arr = temp_g[k][0].arrcluster;
                                temp_h.similarity = temp_h.timeline.clusterarr.length;
                                // clusterdata_timeline.push(temp_h);
                                similarity_queeue.push(temp_h);
                            }else{
                                temp_g[k].forEach((n) => {
                                    _.pullAll(linkdata, linkdata.filter(f => f.source === n.name));
                                });
                            }
                        });
                        temp_g = _.groupBy(linkdata,function(e){return e.source+'_'+e.target});
                        Object.keys(temp_g).forEach(k=> {
                            temp_g[k].forEach((t,i)=>{
                                if (!i)
                                    t.links = temp_g[k][0].links;
                                else
                                    t.del = true;
                            })
                        });
                        let cluster_len = similarity_queeue.length;
                        similarity_queeue.sort((a,b)=>a.similarity-b.similarity);
                        let currenttarget;
                        let next_target = similarity_queeue.shift();
                        clusterdata_timeline = d3.range(0,cluster_len).map((i)=>{
                            currenttarget = next_target;
                            let sim_index = 0;
                            let pen_min = +Infinity;
                            for (let j = 0;j<similarity_queeue.length;j++) {
                                let pen = 0;
                                similarity_queeue[j].arr.forEach((c,i)=>{
                                   pen+= (c===currenttarget.arr[i]);
                                });
                                if (pen<pen_min)
                                {
                                    sim_index = j;
                                    if (pen===0) // stop when find the exactlly the same
                                        break;
                                }
                            }
                            next_target = _.pullAt(similarity_queeue,[sim_index])[0]
                            return currenttarget;
                        });

                        break;
                    case 'single':
                        clusterdata_timeline = hosts.filter(f=>{
                            if ((hostOb[f.name].timeline.lineFull.length>1 || !runopt.hideUnchange))
                                return true;
                            else{
                                _.pullAllBy(linkdata, [linkdata.find(l => l.source === f.name )], 'source');
                                return false;
                            }
                        }).map(h=>{
                            let e = h.name;
                            let temp = linkdata.filter(f=>f.source===e);
                            temp.forEach(d=>d.links=1);
                            return {
                                name: e,
                                values_name: [e],
                                timeline: hostOb[e].timeline,
                                arr: hostOb[e].arrcluster,
                            }});
                        break;
                    case 'groupWithJob':
                    default:
                        data.forEach(d=>{
                            let listcomp = d.nodes.filter(e=>{
                                let temp = linkdata.filter(f=>f.source===e);
                                if (temp.length===1)
                                    return true;
                                else if(temp.length>1){
                                    if (!clusterdata_timeline.find(c=>c.name===e)) {
                                        clusterdata_timeline.push({
                                            name: e,
                                            values_name: [e],
                                            timeline: hostOb[e].timeline,
                                            arr: hostOb[e].arrcluster
                                        });
                                        temp.forEach(d=>d.links=1);
                                    }
                                }
                                return false;
                            });
                            let temp_g = _.groupBy(listcomp.map(e=>hostOb[e]),function(e){return JSON.stringify(e.timeline.lineFull)});
                            Object.keys(temp_g).forEach(k=>{
                                let temp_h = {};
                                temp_h.values_name = temp_g[k].map(e=>e.name);
                                temp_h.name = temp_h.values_name.join(' ');
                                if (temp_g[k][0].timeline.lineFull.length>1 || !runopt.hideUnchange) {
                                    temp_g[k].forEach((n) => {
                                        linkdata.filter(f => f.source === n.name).forEach((e, i) => {
                                            e.source = temp_h.name;
                                            e.links = temp_g[k].length;
                                        });
                                    });

                                    temp_h.timeline = JSON.parse(JSON.stringify(temp_g[k][0].timeline)); // clone timeline
                                    if (runopt.suddenGroup){
                                        temp_h.timeline.clusterarr_sudden = [];
                                        temp_g[k].forEach(e=>temp_h.timeline.clusterarr_sudden=_.unionWith(e.timeline.clusterarr_sudden,temp_h.timeline.clusterarr_sudden, _.isEqual));
                                    }
                                    temp_h.arr = temp_g[k][0].arrcluster;
                                    clusterdata_timeline.push(temp_h);
                                }else{
                                    temp_g[k].forEach((n) => {
                                        linkdata.filter(f => f.source === n.name).forEach((e, i) => {
                                            e.del = true;
                                        });
                                    });
                                }
                            });
                        });
                        reducelink();
                        function reducelink() {
                            let temp_g = _.groupBy(linkdata, function (e) {
                                return e.source + '_' + e.target
                            });
                            Object.keys(temp_g).forEach(k => {
                                temp_g[k].forEach((t, i) => {
                                    if (!i)
                                        t.links = temp_g[k][0].links;
                                    else
                                        t.del = true;
                                })
                            });
                        }
                        break;
                }
                linkdata = linkdata.filter(d => !d.del);
                linkscale.domain(d3.extent(linkdata,d=>d.links));
            }else
                clusterdata_timeline = undefined;

            data.forEach(d=>{
                let clust=_.last(hostOb[d.nodes[0]].timeline.clusterarr).cluster;
                let key = true;
                for (let i=1;i<d.nodes.length;i++) {
                     if (clust!==_.last(hostOb[d.nodes[i]].timeline.clusterarr).cluster) {
                         key = false;
                         break;
                     }
                }
                if (key)
                    d.cluster = clust;
                else
                    d.cluster = undefined;
            });
            user.forEach(d=>{
                let clust=_.last(hostOb[d.unqinode[0]].timeline.clusterarr).cluster;
                let key = true;
                for (let i=1;i<d.unqinode.length;i++) {
                    if (clust!==_.last(hostOb[d.unqinode[i]].timeline.clusterarr).cluster) {
                        key = false;
                        break;
                    }
                }
                if (key)
                    d.cluster = clust;
                else
                    d.cluster = undefined;
            });
            Object.keys(tableData).forEach(k=>{
                if (!tableData[k].keep)
                    delete tableData[k];
            });

            tableFooter[0] = {key:'UserID',value:'Summary'}
            tableFooter[1] = {key:'Hosts', value:Hosts.filter(d=>d.user.length).length}
            tableFooter[2] = {key:'Jobs', value:d3.sum(user,d=>d.values.length)};

        } else
            clusterdata_timeline = undefined;
        // console.timeEnd('jobmap compute');
        // console.time('from compute to draw timeline');
        return linkdata
    };
    let harr_old=[];
    function handle_harr (harr) {
        _.pullAll(harr,harr_old);
        harr_old = harr.slice();
        return harr;
    }
    let triggerCal_Usermetric=true;
    function computeUsermetric(){
        let timescale = d3.scaleTime().range([0,maxTimestep-1]).domain([first__timestep,last_timestep]);
        let index_power = schema.indexOf(schema.find(d=>d.text==="Power consumption"));
        let scaleBack;
        if (index_power!==-1)
         scaleBack = d3.scaleLinear().domain([0,1]).range(schema[index_power].range);
        user.forEach(u=>{
            u.dataRaw = [];
            u.unqinode.forEach(c=>{
                let timerange=[];
                timerange[0] = d3.min(u.unqinode_ob[c],e=>Math.min(maxTimestep-1,Math.max(0,Math.ceil(timescale(new Date(e.startTime))))));
                if (u.unqinode_ob[c].find(e=>!e.endTime))
                    timerange[1] = maxTimestep-1;
                else
                    timerange[1] = d3.max(u.unqinode_ob[c],e=>Math.min(maxTimestep-1,Math.max(0,Math.ceil(timescale(new Date(e.endTime))))));
                if (index_power!==-1)
                    for (let t =timerange[0];t<=timerange[1];t++) {
                        let numbArray = tsnedata[c][t].slice();
                        u.dataRaw.push(numbArray);
                        if (!u.PowerUsage)
                            u.PowerUsage = {};
                        u.PowerUsage.sum = (u.PowerUsage.sum || 0) + Math.round(scaleBack(numbArray[index_power] || 0));
                        u.PowerUsage.time = Math.max(u.PowerUsage.time||0,(timerange[1]-timerange[0])*deltaTime/1000);
                        u.PowerUsage.kwh = Math.round(u.PowerUsage.sum / 1000 / u.PowerUsage.time * 3600);
                        tableFooter.dataRaw.push(numbArray)
                    }
            })
        });
        triggerCal_Usermetric=false
    }
    let violinRange = [0,0];
    function handle_summary (data,render){
        if(data.length){
            triggerCal_Usermetric=true;
        }
        data.forEach(d=>{
            hostOb[d.name].data.push(d); // add new data
        });
        let user_update,rangechange;
        if (isanimation) {
            user.forEach(d=>d.needRender=(render))
            schema.forEach((s, i) => {
                let r = getViolinData(tableFooter, i, s);
                tableFooter[i + 3] = {key: r.axis, value: r};
            });
            user_update = user.filter(d => d.needRender);
            rangechange = false;

            user_update.forEach(d => {
                schema.forEach((s, i) => {
                    let r = getViolinData(d, i, s);
                    tableData[d.name][i + 2] = {key: r.axis, value: r};
                })
                tableData[d.name][schema.length + 2] = {key: 'PowerUsage', value: d.PowerUsage.kwh};
                // tableData[d.name] =[{key:'Hosts', value:d.unqinode.length}
            });
            user_update = g.selectAll('.userNode').filter(d => d.needRender);
            user_update.selectAll('text').interrupt().selectAll("*").interrupt();
            user_update.selectAll('text').styles({
                'stroke': 'yellow',
                'stroke-opacity': 1
            }).transition().duration(3000).styles({'stroke-opacity': 0});
        }
        if (tableHeader.currentsort)
            handle_sort(true);
        if (isanimation) {
            updaterow(rangechange ? g.selectAll('.userNode') : user_update);
            table_footer(nodeg.select('.table.footer'));
        }
    }
    function getViolinData(d, i, s) {
        let v = (d.dataRaw?d.dataRaw.map(e => e[i]):d).filter(e => e !== undefined).sort((a, b) => a - b);
        let r;
        if (v.length) {
            let sumstat = [];
            r = {
                axis: s.text,
                q1: ss.quantileSorted(v, 0.25),
                q3: ss.quantileSorted(v, 0.75),
                median: ss.medianSorted(v),
                mean: ss.mean(v),
            };
            var x = d3.scaleLinear()
                .domain([0, 1]);
            let x_change = d3.scaleLinear()
                .domain([0, runopt.histodram.resolution - 1]).range(x.domain());

            var histogram = d3.histogram()
                .domain(x.domain())
                .thresholds(d3.range(0, runopt.histodram.resolution).map(e => x_change(e)))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
                // .thresholds(x.ticks(runopt.histodram.resolution))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
                .value(d => d);
            let hisdata = histogram(v);
            r.point = [];
            r.outlier = [];
            sumstat = hisdata.map((d, i) => [d.x0 + (d.x1 - d.x0) / 2, (d || []).length]);
            const localmax = d3.max(sumstat, e => e[1]);
            if (d.type && localmax > violinRange [1]) {
                violinRange [1] = localmax;
                rangechange = true;
            }
            r.arr = sumstat;
        } else {
            r = {
                axis: s.text,
                q1: undefined,
                q3: undefined,
                median: undefined,
                mean: undefined,
                outlier: [],
                point: [],
                arr: []
            };
        }
        return r;
    }
    let zoom_toogle=true,showtable =false;
    function zoom_func(val){
        zoom_toogle = val;
        d3.select('.pantarget').classed('lock',zoom_toogle);
    };
    function makeOb (){
        hostOb={};
        Hosts.forEach(h=>{h.data=[]; hostOb[h.name]=h;});
    }

    function makeheader() {
// make table header
        table_header(table_headerNode,showtable);
    }

    function updateLayout(data){
        let currentsort = tableHeader.currentsort;
        let currentdirection = tableHeader.direction;
        tableHeader = [{key:'UserID', value:'UserID'},{key:'Hosts', value:'#Hosts'}, {key:'Jobs',value: '#Jobs'}];
        tableLayout.column={
            'UserID': {id:'UserID',type:'text',x: 10,y:20,width:60},
            'Hosts': {id:'Hosts',text:'#Hosts',type:'num',x: 120,y:20,width:60},
            'Jobs': {id:'Jobs',text:'#Jobs',type:'num',x: 170,y:20,width:52},
        }
        let offset = tableLayout.column['Jobs'].x;
        let padding = 15;
        if (showtable)
            data.forEach((d,i)=>{
                tableLayout.column[d.text] = {id:d.text,type: 'graph' ,x: offset+(i)*tableLayout.row["graph-width"]+padding,y:0,width:tableLayout.row["graph-width"]};
                tableLayout.row.width = offset+(i)*(tableLayout.row["graph-width"]+padding);
                tableHeader.push({key:d.text, value:d.text});
            })
        else
            tableLayout.row.width = offset+tableLayout.row["graph-width"]+padding;
        // tableLayout.row.width +=70;
        tableLayout.column['PowerUsage'] = {id:'PowerUsage',type: 'num',format:'.1f' ,x: tableLayout.row.width,y:20,width:70};
        tableHeader.push({key:'PowerUsage', value:'kWh'});
        tableHeader.currentsort = currentsort;
        tableHeader.direction = currentdirection;

        makeheader();
    }



    let filter = []
    jobMap.highlight = function (name) {
        filter.push(name);
        filter = _.uniq(filter);
        if (runopt.compute.type==='timeline')
            g.selectAll(`.computeNode${freezing?'.highlight':':not(.fade)'} .linkLineg, .computeNode${freezing?'.highlight':':not(.fade)'}  .linegg`).classed('fade2',true);
        else
            g.selectAll(`.computeNode${freezing?'.highlight':':not(.fade)'} `).classed('fade2',true);
        g.selectAll('.computeNode').selectAll(`${filter.map(d=>'.'+fixName2Class(d))}`).classed('fade2',false)
            .each(function(){
                (d3.select(this.parentNode.parentNode).classed('computeNode')?d3.select(this.parentNode.parentNode):d3.select(this.parentNode.parentNode.parentNode)).dispatch('mouseover')});
    }
    jobMap.unhighlight = function (name) {
        _.pull(filter,name);
        if (filter.length) {
            if (runopt.compute.type==='timeline')
                g.selectAll(`.computeNode${freezing?'.highlight':':not(.fade)'}  .linkLineg, .computeNode${freezing?'.highlight':':not(.fade)'}  .linegg`).classed('fade2',true);
            else
                g.selectAll(`.computeNode${freezing?'.highlight':':not(.fade)'} `).classed('fade2',true);
            g.selectAll(`${filter.map(d => '.' + fixName2Class(d))}`).classed('fade2', false);
        }else{
            g.selectAll(`.fade2`).classed('fade2', false);
        }
        releaseSelection();
    }
    jobMap.callback = function (_) {
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    callback[i] = _[i];
                }
            }
            return jobMap;
        }else {
            return callback;
        }

    };

    jobMap.graphicopt = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    graphicopt[i] = __[i];
                }
            }
            if (graphicopt.radaropt)
                graphicopt.radaropt.schema = schema;
            createRadar = _.partialRight(createRadar_func,undefined,graphicopt.radaropt,colorFunc)
            return jobMap;
        }else {
            return graphicopt;
        }

    };

    jobMap.runopt = function (_) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    runopt[i] = _[i];
                }
            }
            if (g) {
                if (runopt.mouse.lensing) {
                    g.select('.fisheyeLayer').style('pointer-events', 'auto');
                } else {
                    g.select('.fisheyeLayer').style('pointer-events', 'none');
                    fisheye_scale.x = d=>d;
                }
            }
            return jobMap;
        }else {
            return runopt;
        }

    };

    jobMap.svg = function (_) {
        return arguments.length ? (svg = _, jobMap) : svg;
    };

    jobMap.data = function (_) {
        return dataRaw = _?_:dataRaw, handle_links (arguments[1],arguments[2],arguments[3]), jobMap;
    };

    jobMap.clusterData = function (v) {
        return arguments.length ? (clusterdata = v,updateClusterTimeline(), jobMap) : clusterdata;
    };

    jobMap.clusterDataLabel = function (v) {
        return arguments.length ? (clusterdata = v,updateClusterLabel(), jobMap) : clusterdata;
    };

    jobMap.zoomtoogle = function (_) {
        return arguments.length ? (zoom_func(_), jobMap) : zoom_toogle;
    };

    jobMap.hosts = function (a) {
        return arguments.length ? (Hosts = _.cloneDeep( a),makeOb(), jobMap) : Hosts;
        // return arguments.length ? (Hosts = a,makeOb(), jobMap) : Hosts;
    };

    jobMap.maxTimestep = function (_) {
        return arguments.length ? (maxTimestep=_,updateMaxTimestep(),jobMap):maxTimestep;
    };

    jobMap.dataComp = function (_) {
        return arguments.length ? (arr = _, jobMap) : arr;
    };

    jobMap.getharr = function (_) {
        return (handle_harr(_),jobMap);
    };

    jobMap.setharr = function (_) {
        return arguments.length ? (harr_old=_,jobMap):jobMap;
    };

    jobMap.color = function (_) {
        return arguments.length ? (colorscale=_,jobMap):colorscale;
    };

    jobMap.dataComp_points = function (_) {
        return (handle_summary(_),jobMap);
    };
    jobMap.schema = function (_) {
        return arguments.length ? (graphicopt.radaropt.schema = _,schema = _,updateLayout(_), jobMap) : schema;
    };
    jobMap.colorCluster = function (_) {
        return arguments.length ? (colorCluster = _,jobMap) : colorCluster;
    };
    return jobMap;
};

function calculateMSE(a,b){
    return ss.sum(a.map((d,i)=>(d.value-b[i].value)*(d.value-b[i].value)));
}
function calculateMSE_array(a,b){
    return ss.sum(a.map((d,i)=>(d-b[i])*(d-b[i])));
}
// Establish the desired formatting options using locale.format():
// https://github.com/d3/d3-time-format/blob/master/README.md#locale_format
var formatMillisecond = d3.timeFormat(".%L"),
    formatSecond = d3.timeFormat(":%S"),
    formatMinute = function(d){return d3.timeFormat("%I:%M")(d).replace(/^0/,'')}
formatHour = function(d){return d3.timeFormat("%I %p")(d).toLowerCase().replace(/^0/,'')},
    formatDay = d3.timeFormat("%a %d"),
    formatWeek = d3.timeFormat("%b %d"),
    formatMonth = d3.timeFormat("%B"),
    formatYear = d3.timeFormat("%Y");
// Define filter conditions
function multiFormat(date) {
    return (d3.timeSecond(date) < date ? formatMillisecond
        : d3.timeMinute(date) < date ? formatMinute
            : d3.timeHour(date) < date ? formatMinute
                : d3.timeDay(date) < date ? formatHour
                    : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
                        : d3.timeYear(date) < date ? formatMonth
                            : formatYear)(date);
}