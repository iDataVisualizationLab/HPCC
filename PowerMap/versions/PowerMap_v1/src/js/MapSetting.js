var Mapopt = {
    offset: {top: 0}, preLinkText: 'Computes have', postLinkText: ' same job(s)'
};
// var timeArJobcopt = {width:1400,height:700, margin: {top: 10, right: 10, bottom: 0, left: 350},contain: '#Jobcontent',
//     containHolder:'#chart__job_holder',
//     offset: {top: 0},preLinkText:'Jobs run on',postLinkText:' same compute(s)'};
let MapSetting = function () {
    let graphicopt = {
        svg: '#Chartcontent',
        margin: {top: 40, right: 10, bottom: 0, left: 100},
        offset: {top: 0},
        width: 1500,
        height: 700,
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
        userPos: function () {
            return this.widthG() - 420;
        },
        jobPos: function () {
            return this.userPos() - 120;
        },
        computePos: function () {
            return this.jobPos() - 120;
        },
        display: {
            links: {
                'stroke-opacity': 0.7
            },
            stream: {
                yScale: d3.scaleLinear().range([0, 20]),
                yScaleUp: d3.scaleLinear().domain([0, 1 - 650 / 800]).range([0, 20]),
                yScaleDown: d3.scaleLinear().domain([-650 / 800, 0]).range([-15, 0]),
            }
        },
        user: {
            r: 10,
        },
        job: {
            r: 10,
            r_inside: 2,
        },
        radaropt: {
            // summary:{quantile:true},
            mini: true,
            levels: 6,
            gradient: true,
            w: 20,
            h: 20,
            showText: false,
            margin: {top: 0, right: 0, bottom: 0, left: 0},
        },
        userStreamMode: 'Power'
    };
    let runopt = {mouse: {}, highlightStream: 'none'};
    let scheme = {}, filterTerm = [];
    let animation_time = 2000;
    let svg = d3.select(graphicopt.svg), g, zoomFunc, linkg, nodeg, table_headerNode, freezing = false, textWarp = 200;

    let yscale = d3.scaleLinear().range([0, graphicopt.heightG()]), linkscale = d3.scaleSqrt().range([0.3, 2]);
    let xScale = d3.scaleLinear();
    let drawThreshold = 650 / 700;
    let fisheye_scale = {x: fisheye.scale(d3.scaleLinear), y: fisheye.scale(d3.scaleLinear)};
    let scaleJob = d3.scaleLinear();
    let scaleNode_y_middle;
    let Jobscale = d3.scaleSqrt().range([0.5, 3]);
    let tableData = {}, tableHeader = [], tableFooter = [];
    let tableLayout = {
        row: {
            width: 500,
            height: 20,//deltey,
            'graph-width': 75,
        },
        column: {
            'UserID': {id: 'UserID', type: 'text', x: 10, y: 20, width: 60},
            'Hosts': {id: 'Hosts', text: '#Computes', type: 'num', x: 120, y: 20, width: 60},
            'Jobs': {id: 'Jobs', text: '#Jobs', type: 'num', x: 170, y: 20, width: 52},
        }
    };
    let computers = [],
        _computers = [],
        users = [], jobs = [], jobsObj = {},
        computersObj = {},
        usersObj = {},
        linkob = {}, jobEmpty = false;
    let master = {};
    let isFirst = true;
    let catergogryList = [{key: 'user', value: {colororder: 0}}, {key: 'compute', value: {colororder: 1}}, {
        key: 'rack',
        value: {colororder: 2}
    }];
    let layout = {};
    let onmouseOver = () => {
    }, onmouseLeave = () => {
    }, onmouseClick = () => {
    };
    master.reset = function () {
        // reset option
        return master;
    };

    master.mouseover = [];
    master.mouseover.dict = {};
    master.mouseout = [];
    master.mouseout.dict = {};
    master.click = [];
    master.click.dict = {};
    master.mouseoverAdd = function (id, func) {
        if (master.mouseover.dict[id] !== undefined)
            master.mouseover[master.mouseover.dict[id]] = func;
        else {
            master.mouseover.push(func)
            master.mouseover.dict[id] = master.mouseover.length - 1;
        }
    }
    master.mouseoutAdd = function (id, func) {
        if (master.mouseout.dict[id] !== undefined)
            master.mouseout[master.mouseout.dict[id]] = func;
        else {
            master.mouseout.push(func)
            master.mouseout.dict[id] = master.mouseout.length - 1;
        }
    }
    master.clickAdd = function (id, func) {
        if (master.click.dict[id] !== undefined)
            master.click[master.click.dict[id]] = func;
        else {
            master.click.push(func)
            master.click.dict[id] = master.click.length - 1;
        }
    }
    master.init = function () {
        svg.attrs({
            width: graphicopt.width,
            height: graphicopt.height,

        });
        let svdefs = svg.select('#defsmain');
        if (svdefs.empty())
            svdefs = svg.append('defs').attr('id', 'defsmain');
        if (svdefs.select('#userpic').empty()) {
            svdefs.append('pattern')
                .attrs({'id': 'userpic', width: '100%', height: '100%', 'patternContentUnits': 'objectBoundingBox'})
                .append('image')
                .attrs({
                    'height': 1, width: 1, preserveAspectRatio: 'none',
                    'xmlns:xlink': 'http://www.w3.org/1999/xlink', 'xlink:href': 'src/images/u.png'
                });
            svdefs.append('pattern')
                .attrs({
                    'id': 'userpicNoBorder',
                    width: '100%',
                    height: '100%',
                    'patternContentUnits': 'objectBoundingBox'
                })
                .append('image')
                .attrs({
                    'height': 1, width: 1, preserveAspectRatio: 'none',
                    'xmlns:xlink': 'http://www.w3.org/1999/xlink', 'xlink:href': 'src/images/uNoBorder.png'
                });
        }
        zoomFunc = d3.zoom().on("zoom", () => {
            g.attr("transform", d3.event.transform);
        });
        try {
            zoomFunc.touchable(navigator.maxTouchPoints)
        } catch (e) {
            console.log('Your device not support navigator.maxTouchPoints')
        }
        if (svg.select('rect.pantarget').empty()) {
            svg.append('rect').attr('class', 'pantarget')
        }
        svg.select('rect.pantarget')
            .attrs({
                'opacity': 0,
                width: graphicopt.width,
                height: graphicopt.height,
            }).on('click', function (d) {
            if (freezing) {
                g.selectAll('.node').style('pointer-events', 'auto').classed('fade', false).classed('hide', false).classed('highlight', false);
                linkg.selectAll('.links').classed('hide', false).classed('highlight', false);
                freezing = !freezing;
            }
        }).call(zoomFunc);

        g = svg.select('g.pannel');
        if (g.empty()) {
            g = svg.append("g")
                .attr('class', 'pannel')
            // .attr('transform',`translate(${graphicopt.margin.left},${graphicopt.margin.top})`);
            svg.select('.pantarget').call(zoomFunc.transform, d3.zoomIdentity.translate(graphicopt.margin.left, graphicopt.margin.top));
            g.append('text').attr('class', 'job_title hide').style('font-weight', 'bold').attrs({
                'text-anchor': "middle",
                'x': graphicopt.jobPos(),
                'dy': -20
            }).datum('Jobs').text(d => d);
            g.append('text').attr('class', 'host_title').style('font-weight', 'bold').attrs({
                'text-anchor': "middle",
                'x': graphicopt.computePos(),
                'dy': -20
            }).text('Hosts');

            const gNodeaxis = g.append('g').attr('class', 'gNodeaxis hide').attr('transform', `translate(200,0)`);
            gNodeaxis.append('g').attr('class', 'gMainaxis');
            gNodeaxis.append('g').attr('class', 'gSubaxis');

            let annotation_back = g.append("g")
                .attr('class', 'annotation_back annotation');
            annotation_back
                .append("g")
                .attr('class', 'majorbar');
            annotation_back.append('text').attrs({x: 400, y: 0, class: 'tablemessage hide'}).text('LOADING TABLE DATA');


            linkg = g.append("g")
                .attr('class', 'linkg');
            nodeg = g.append("g")
                .attr('class', 'nodeg');
            // g.append("rect")
            //     .attr('class','fisheyeLayer')
            //     .style('opacity',0)
            //     .style('pointer-events', runopt.mouse.lensing?'auto':'none');

            table_headerNode = g.append('g').attr('class', 'table header').attr('transform', `translate(${graphicopt.userPos()},${-15})`);
            table_headerNode.append('g').attr('class', 'back').append('path').styles({'fill': '#ddd'});

            g.append('rect')
                .attr('class', 'fisheyeLayer')
                .style('display', 'none')
                .style('opacity', 0);
            fisheye_scale.y = d => d;
            d3.select('#jobMapLensing').on('click', function () {
                runopt.lensing = !runopt.lensing;
                let lensingLayer = d3.select('rect.fisheyeLayer')
                    .style('display', runopt.lensing ? 'block' : 'none');
                if (!runopt.lensing) {
                    fisheye_scale.y = d => d;
                    d3.select(this).classed('btn-secondary',true).classed('btn-primary',false);
                }else{
                    d3.select(this).classed('btn-secondary',false).classed('btn-primary',true);
                }
                if (!lensingLayer.on("mousemove"))
                    lensingLayer.on("mousemove", function () {
                        let mouse = d3.mouse(this);
                        requestAnimationFrame(() => {
                            animation_time = 0;
                            svg.selectAll('.computeSig').transition().selectAll("*").transition();
                            fisheye_scale.y = fisheye.scale(d3.scaleIdentity).domain([scaleNode_y_middle.range()[0], scaleNode_y_middle.range()[1]]).focus(mouse[1]);
                            computers.forEach(d => {
                                d.y2 = fisheye_scale.y(scaleNode_y_middle(d.order));
                            });
                            linkg.selectAll('.links').transition().duration(animation_time)
                                .call(updatelink);
                            drawEmbedding_timeline();
                        });
                    }).on("mouseleave", function () {
                        animation_time = 2000;
                        fisheye_scale.y = d => d;
                        computers.forEach(d => {
                            d.y2 = scaleNode_y_middle(d.order);
                        });
                        linkg.selectAll('.links').transition().duration(animation_time)
                            .call(updatelink);
                        drawEmbedding_timeline();
                    });
            });

            registEvent(zoomFunc);

        }
        try {
            yscale.range([0, graphicopt.heightG()])
        } catch (e) {

        }
        return master;
    };

    function registEvent() {
        // d3.select('#mouseAction').on("change", function () {
        //     const selected_value = $("input[name='mouseAction']:checked").val();
        //     if (selected_value === "auto" || selected_value === "disable") {
        //         runopt.mouse.auto = selected_value === "auto";
        //         runopt.mouse.disable = selected_value === "disable";
        //         runopt.mouse.lensing = false;
        //     } else {
        //         runopt.mouse.auto = false;
        //         runopt.mouse.disable = false;
        //         runopt.mouse.lensing = selected_value === "lensing";
        //         runopt.mouse.showseries = selected_value === "showseries";
        //         runopt.mouse.showmetric = selected_value === "showmetric";
        //     }
        //     if (runopt.mouse.lensing) {
        //         g.select('.fisheyeLayer').style('pointer-events', 'auto');
        //     } else {
        //         g.select('.fisheyeLayer').style('pointer-events', 'none');
        //         fisheye_scale.x = d => d;
        //     }
        // });
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

    master.drawColorLegend = (_) => {
        drawColorLegend = _;
        return master
    };

    master.stop = function () {

    };

    master.draw = function () {
        scheme.filterTerm = filterTerm;
        handleData();
        draw();
        isFirst = false
    };

    function handleData() {
        console.log(scheme.data)
        jobsObj = {};
        computersObj = {};
        usersObj = {};
        linkob = {};
        tableData = {};
        if (scheme.filterTerm && scheme.filterTerm.length) {
            scheme.filterTerm.forEach(j => {
                if (scheme.data.jobs[j] && !scheme.data.jobs[j].isJobarray) {
                    const user_name = scheme.data.jobs[j].user_name;
                    if (!usersObj[user_name]) {
                        usersObj[user_name] = scheme.data.users[scheme.data.jobs[j].user_name];
                        usersObj[user_name].key = user_name;
                        usersObj[user_name].type = 'user';
                        usersObj[user_name]._currentjobs = [];
                        usersObj[user_name].links = {};
                        usersObj[user_name].timePoints = {};
                    }
                    usersObj[user_name]._currentjobs.push(j);

                    jobsObj[j] = scheme.data.jobs[j];
                    jobsObj[j].key = j;
                    jobsObj[j].type = 'job';
                    jobsObj[j].timePoints = {};
                    scheme.data.jobArr[j].forEach((d, ti) => {
                        if (d) {
                            usersObj[user_name].timePoints[ti] = 1;
                            jobsObj[j].timePoints[ti] = 1;
                        }
                    });
                    linkob[j + '|' + user_name] = {source: jobsObj[j], target: usersObj[user_name]};

                    if (!jobsObj[j].links)
                        jobsObj[j].links = {};
                    jobsObj[j].links[user_name] = j + '|' + user_name;
                    usersObj[user_name].links[j] = j + '|' + user_name;

                    scheme.data.jobs[j].node_list.forEach(comp => {
                        computersObj[comp] = scheme.data.computers[comp];
                        computersObj[comp].key = comp;
                        linkob[comp + '|' + j] = {source: computersObj[comp], target: jobsObj[j]};
                        if (!computersObj[comp].links)
                            computersObj[comp].links = {};
                        computersObj[comp].links[j] = comp + '|' + j;
                        jobsObj[j].links[comp] = comp + '|' + j;
                    })
                }
            })
        }
        _computers = d3.keys(computersObj);
        debugger
        //group jobs
        users = d3.values(usersObj);
        users.forEach(u => {
            if (u._currentjobs.length > 10) {
                u.isOpen = false;
                handleCollapseJobs(u);
            } else {
                u.isOpen = true;
            }
        });

        jobs = d3.values(jobsObj);
        computers = d3.values(computersObj);

        linkdata = d3.values(linkob);
        users.forEach((d, i) => {
            tableData[d.key] = tableData[d.key] || [{key: 'Hosts', value: 0},
                {key: 'Jobs', value: 0}];
            tableData[d.key][0].value = d.node.length;
            tableData[d.key][1].value = d.job.length;
            d.summary.forEach((s, i) => {
                tableData[d.key][i + 2] = {
                    key: serviceFullList[i].text,
                    value: Math.round((serviceFullList[i].range[1] - serviceFullList[i].range[0]) * s.mean + serviceFullList[i].range[0])
                };
            });
            tableData[d.key].id = d.key;
            d.order = i
        })
        console.log(_computers,jobsObj,computersObj,usersObj,linkob,tableData,users,jobs,computers,linkdata)
    }

    function handleCollapseJobs(u) {
        let user_name = u.key;
        if (u.isOpen) {
            u._currentjobs.forEach(j => {
                jobsObj[j] = scheme.data.jobs[j];
                jobsObj[j].key = j;
                jobsObj[j].type = 'job';
                if (!jobsObj[j].links)
                    jobsObj[j].links = {};
                jobsObj[j].type = 'job';
                linkob[j + '|' + user_name] = {source: jobsObj[j], target: usersObj[user_name]};
                jobsObj[j].links[user_name] = j + '|' + user_name;
                u.links[j] = j + '|' + user_name;

                scheme.data.jobs[j].node_list.forEach(comp => {
                    // if compute collapse
                    if (!computersObj[comp]) {
                        computersObj[comp] = scheme.data.computers[comp];
                        computersObj[comp].key = comp;
                        computersObj[comp].links = {};
                    } else {
                        if (!computersObj[comp].links)
                            computersObj[comp].links = {};
                    }
                    computersObj[comp].links[j] = comp + '|' + j;

                    linkob[comp + '|' + j] = {source: computersObj[comp], target: jobsObj[j]};
                    jobsObj[j].links[comp] = comp + '|' + j;

                });
            });
            const jobKey = u.key + 'jobColapse';

            jobsObj[jobKey].node_list.forEach(comp => {
                delete linkob[comp + '|' + jobKey];
            });
            delete jobsObj[jobKey];
            delete linkob[jobKey + '|' + user_name];

            const compKey = u.key + ' summary';
            delete computersObj[compKey];
            delete linkob[compKey + '|' + jobKey];

        } else {
            let node_listO = {};
            let job_ids = {};
            let timePoints = {};
            let compute_ids = {};
            let compute_tsnedata = [];
            u._currentjobs.forEach(j => {
                delete jobsObj[j];
                delete linkob[j + '|' + user_name];
                if (scheme.data.jobs[j].isJobarray) {
                    Object.keys(scheme.data.jobs[j].job_ids)
                        .forEach(k => job_ids[k] = scheme.data.jobs[k]);
                } else
                    job_ids[j] = scheme.data.jobs[j];
                scheme.data.jobs[j].node_list.forEach(comp => {
                    node_listO[comp] = true;
                    delete linkob[comp + '|' + j];

                    // handle for compute collapse
                    compute_ids[comp] = scheme.data.computers[comp];
                    delete computersObj[comp].links[j];
                    if (!Object.keys(computersObj[comp].links).length) {
                        delete computersObj[comp];
                    }
                    scheme.data.jobArr[j].forEach((d, ti) => {
                        if (d) {
                            timePoints[ti] = 1;
                            if (scheme.data.tsnedata[comp][ti]) {
                                if (!compute_tsnedata[ti])
                                    compute_tsnedata[ti] = [];
                                compute_tsnedata[ti].push(scheme.data.tsnedata[comp][ti])
                            }
                        }
                    });

                });
            });
            console.log('compute_tsnedata',compute_tsnedata)
            let summary = serviceFullList.map((s, si) => {
                let min = Infinity;
                let max = -Infinity;
                let mean = 0;
                let num = 0;
                Object.values(job_ids).forEach(j => {
                    min = Math.min(j.summary[si].min, min);
                    max = Math.max(j.summary[si].min, max);
                    if (j.summary[si].mean) {
                        mean += (j.summary[si].mean * j.summary[si].num);
                        num += j.summary[si].num;
                    }
                });
                return {min, max, mean: mean / num, num};
            });
            const jobKey = u.key + 'jobColapse';
            jobsObj[jobKey] = {};
            jobsObj[jobKey].user_name = u.key;
            jobsObj[jobKey].node_list = Object.keys(node_listO);
            jobsObj[jobKey].key = jobKey;
            jobsObj[jobKey].type = 'job';
            jobsObj[jobKey].job_ids = job_ids;
            jobsObj[jobKey].summary = summary;
            jobsObj[jobKey].isjobColapse = true;
            jobsObj[jobKey].links = {};
            jobsObj[jobKey].timePoints = timePoints;

            linkob[jobKey + '|' + user_name] = {source: jobsObj[jobKey], target: usersObj[u.key]};
            jobsObj[jobKey].links[user_name] = linkob[jobKey + '|' + user_name];

            // if compute not collapse
            // jobsObj[jobKey].node_list.forEach(comp => {
            //     linkob[comp + '|' + jobKey] = {source: computersObj[comp], target: jobsObj[jobKey]};
            // })

            const compKey = u.key + ' summary';
            let comptsnedata = compute_tsnedata.map((t, ti) => {
                const d = serviceFullList.map((s, si) => {
                    return d3.mean(t, f => f[si]);
                });
                d.name = compKey;
                d.timestep = ti;
                return d;
            });

            let compSummary = serviceFullList.map((s, si) => {
                let min = Infinity;
                let max = -Infinity;
                let mean = 0;
                let num = 0;
                Object.values(compute_ids).forEach(j => {
                    min = Math.min(j.summary[si].min, min);
                    max = Math.max(j.summary[si].min, max);
                    if (j.summary[si].mean) {
                        mean += (j.summary[si].mean * j.summary[si].num);
                        num += j.summary[si].num;
                    }
                });
                return {min, max, mean: mean / num, num};
            });

            computersObj[compKey] = {};
            computersObj[compKey].user = [u.key];
            computersObj[compKey].key = compKey;
            computersObj[compKey].compute_ids = compute_ids;
            computersObj[compKey].summary = compSummary;
            computersObj[compKey].tsnedata = comptsnedata;
            computersObj[compKey].iscomputeCollapse = true;
            computersObj[compKey].links = {};
            linkob[compKey + '|' + jobKey] = {source: computersObj[compKey], target: jobsObj[jobKey]};
            computersObj[compKey].links[jobKey] = compKey + '|' + jobKey;
            // add link to job
            jobsObj[jobKey]._node_list = jobsObj[jobKey].node_list.slice();
            jobsObj[jobKey].node_list = [compKey];
            jobsObj[jobKey].links[compKey] = compKey + '|' + jobKey;
        }
        jobs = d3.values(jobsObj);
        computers = d3.values(computersObj);
        linkdata = d3.values(linkob);
    }

    let createRadar = (datapoint, bg, data, customopt) => createRadar_func(datapoint, bg, data, customopt, undefined, graphicopt.radaropt, () => 'gray');

    function getradarData(a, name) {
        let temp = a.map((d, i) => {
            return {
                axis: serviceFullList[i].text,
                value: d,
                enable: serviceFullList[i].enable,
                angle: serviceFullList[i].angle
            };
        });
        temp.sort((a, b) => a.angle - b.angle);
        temp.name = name;
        return temp;
    }

    function drawJobNode() {
        debugger
        if (jobs.length) {
            g.select('.job_title').classed('hide', false);
        } else {
            g.select('.job_title').classed('hide', true);
        }
        let jobNode = nodeg.selectAll('.jobNode').data(jobs, function (d) {
            return d.key
        });
        jobNode.exit().remove();
        let jobNode_n = jobNode.enter().append('g').attr('class', d => 'node jobNode new ' + fixName2Class(fixstr(d.key)));

        jobNode_n.append('circle')
            .attrs(
                {
                    'class': 'computeSig_b',
                    // 'd': d=>spiral([new Date(d.submitTime),new Date(d.start_time),timeStep]),
                    // 'd': d=>spiral(backdround_spiral),
                    'r': graphicopt.radaropt.w / 2,
                    'fill': '#dddddd',
                    'opacity': 0.2,
                    'stroke-width': 0,
                });
        jobNode_n.append('g')
            .attrs(
                {
                    'class': 'jobradar',
                    'fill': 'none'
                });

        jobNode_n.append('text').attr('class', 'lelftext label').attrs({'x': -graphicopt.job.r}).style('text-anchor', 'end');
        jobNode_n.append('text').attr('class', 'righttext label').attrs({'x': graphicopt.job.r});
        jobNode = nodeg.selectAll('.jobNode');
        jobNode.select('.computeSig_b').attr('r', graphicopt.radaropt.w / 2);
        jobNode.select('.jobradar').each(function (d) {
            if (d.summary && !d.radarData)
                d.radarData = getradarData(d.summary.map(d => d.mean), d.key);
            if (d.radarData) {
                d.radarData.color = d.job_ids ? 'black' : 'gray';
                setTimeout(() => {
                    createRadar(d3.select(this).select('.linkLineg'), d3.select(this), d.radarData, {colorfill: 'gray'});
                }, 1);
            }
        });
        jobNode.select('.lelftext').text(d => `#Computes: ${d.node_list.length}`)
        jobNode.select('.righttext').text(d => d.values ? `#Jobs: ${d.values.length}` : '')

        jobNode.selectAll('path').style('stroke', 'black').style('stroke-width', d => d.values ? Jobscale(d.values.length) : 1.5);
        return jobNode;
    }

    function draw() {
        updateProcess({percentage: 50, text: 'Rendering...'})
        yUpperScale = graphicopt.display.stream.yScaleUp;
        yDownerScale = graphicopt.display.stream.yScaleDown;
        yscale = d3.scaleLinear().domain([-1, Object.keys(scheme.data.users).length]).range([0, graphicopt.heightG()]);
        // yscale = d3.scaleLinear().domain([-1,user.length]).range([0,Math.min(graphicopt.heightG(),30*(user.length))]);
        let deltey = yscale(1) - yscale(0);

        scaleJob.domain([0, Object.keys(scheme.data.users).length - 1]).range(yscale.range());

        tableLayout.row.height = Math.min(deltey, 30);

        // compute pie
        if (isFirst) {
            table_header(table_headerNode);
        }

        // hosts/compute
        let computersNode = nodeg.selectAll('.computeNode').data(computers, d => d.key);
        computersNode.select('.computeSig').datum(d => d);
        computersNode.exit().remove();
        let computersNode_n = computersNode.enter().append('g').attr('class', d => 'node computeNode new ' + fixName2Class(fixstr(d.key)));

        computersNode_n.append('g').attrs(
            {
                'class': 'computeSig',
            });
        computersNode_n.append('text').attrs(
            {
                'class': 'computeSig_label',
                'text-anchor': 'end',
                'dx': -10,
                'dy': '0.5rem',
                'fill': 'black',
                'width': textWarp
            }).merge(computersNode.select('.computeSig_label')).text(d => d.key)
        // .call(wrap,true)
        ;

        computersNode = nodeg.selectAll('.computeNode');
        computersNode.select('.label');

        computersNode.classed('statics', true);

        computersNode.select('.computeSig_label')
        // .call(wrap, true);


        computeUsermetric();
        handle_summary();
        debugger

        //job node
        let jobNode = drawJobNode();

        // user node
        let userNode = nodeg.selectAll('.userNode').data(users, d => d.key);
        userNode.exit().remove();
        let userNode_n = userNode.enter().append('g').attr('class', d => 'node userNode new ' + fixName2Class(fixstr(d.key)));

        userNode_n.append('circle').attrs(
            {
                'class': 'userNodeSig',
                'r': graphicopt.user.r,
            });
        userNode_n.append('circle').attrs(
            {
                'class': 'userNodeImg',
                'r': graphicopt.user.r,
                'fill': "url(#userpic)"
            });

        userNode_n.append('text').attrs(
            {
                'class': 'userNodeSig_label',
                'dy': '0.25rem',
                'x': graphicopt.user.r + 4,
                // 'text-anchor':'middle',
            }).style('pointer-events', 'all');
        // userNode_n.append('text').attrs(
        //     {
        //         'class': 'userNodeSig_CollapseMode',
        //         'dy': '0.25rem',
        //         'x': -graphicopt.user.r - 10,
        //         // 'text-anchor':'middle',
        //     });


        userNode = nodeg.selectAll('.userNode');
        userNode.select('.userNodeSig').styles(
            {
                'fill-opacity': 0.5,
                'fill': d => {
                    // const color = colorFunc(runopt.graphic.colorBy === 'group' ? d.cluster : d.key);
                    const color = 'black';
                    return color === 'black' ? 'white' : color;
                }
            });
        userNode.select('.userNodeSig_label')
            .text(d => d.key);

        userNode.select('.userNodeImg')
            .attr('fill', d => d.isOpen ? "url(#userpicNoBorder)" : "url(#userpic)")
            .style('pointer-events', 'all')
            .on('click', (u) => {
                event.stopPropagation();
                if (u._currentjobs.length > 1) {
                    u.isOpen = !u.isOpen;
                    handleCollapseJobs(u);
                    draw();
                }
            });

        // table
        handle_sort(true, true);
        updaterow(userNode);
        // table_header(table_headerNode);
        // // make table footer
        // let table_footerNode = nodeg.select('.table.footer');
        // if (table_footerNode.empty())
        //     table_footerNode = nodeg.append('g').attr('class', 'table footer');
        // table_footerNode.append('g').attr('class', 'back').append('path').styles({'fill': '#ddd'});
        //
        // table_footerNode.attr('transform', `translate(${graphicopt.userPos()},${yscale(Object.keys(scheme.data.users).length + 1)})`);
        // table_footer(table_footerNode);


        let node = nodeg.selectAll('.node');


        function getGradID(d) {
            return 'links' + d.index;
        }

        // simulation
        //     .nodes(node.data()).stop();
        // simulation.force("link")
        //     .links(linkdata);
        debugger
        let link = linkg.selectAll('.links').data(linkdata, d => d.source.key + "-" + d.target.key);
        link.exit().remove();
        let link_n = link.enter()
            .append('g')
            .attr("class", "links")
            .attr('stroke', 'black')
            .attr('fill', 'none');
        link_n
            .append('path');
        link_n
            .append('text').attr("text-anchor", "middle");


        link = linkg.selectAll('.links');
        link.select('text').text(function (d) {
            return d.links ? d.links : ''
        });
        link.select('path')
            // .attr("stroke", d => colorFunc(getLinkKeyColor(d)))
            .style("stroke-width", function (d) {
                return .3;
            }).style("stroke-opacity", 0.7)
        // .style("stroke-width", function (d) {
        //     return d.links === undefined ? 1 : linkscale(d.links);
        // });

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
                g.selectAll('.computeNode').filter(f => {
                    let link = samesource.filter(e => e.source === f);
                    if (link.length) {
                        f.timePoints = {};
                        link.forEach(l => {
                            Object.keys(l.target.timePoints).forEach(t => f.timePoints[t] = 1);
                        });
                        return true;
                    }
                    return false;
                }).classed('highlight', true)
                    .each(function (d) {
                        onFilterComputeHighlight(d3.select(this).select('g.computeSig'), Object.keys(d.timePoints))
                    });
                // table_footerNode.classed('fade', true);
            }, null
            ], [function (d) {
                // g.selectAll('.userNode').classed('fade', false);
                // d3.select(this).classed('highlight', false);
                // g.selectAll('.jobNode').classed('hide', false).classed('highlight', false).selectAll('.label').classed('hide', false);
                // g.selectAll('.computeNode').classed('fade', false).classed('highlight', false);
                // link.classed('hide', false).classed('highlight', false);
                //
                // g.selectAll('.computeNode').selectAll('path.durationHighlight').remove();
                releaseSelection();
                // table_footerNode.classed('fade', false);
            }, null
            ]));
        g.selectAll('.computeNode')
            .call(path => freezinghandle(path, [function (d) {
                d3.select(this).each(function (d) {

                    onFilterComputeHighlight(d3.select(this).select('g.computeSig'), undefined, true);
                });
                d3.select(this).classed('highlight', true).select('.computeSig_label').text(d => d.orderG !== undefined ? `Group ${d.orderG + 1}${d.text !== '' ? `: ${d.text}` : ''}` : trimNameArray(d.key))//.call(wrap, false);
                const samesource = link.filter(f => d === f.source).classed('hide', jobEmpty).classed('highlight', true).data();
                const sametarget = link.filter(f => samesource.find(e => e.target === f.source)).classed('hide', jobEmpty).classed('highlight', !jobEmpty).data();
                g.selectAll('.jobNode').filter(f => samesource.find(e => e.target === f)).classed('hide', jobEmpty).classed('highlight', !jobEmpty).selectAll('.label').classed('hide', !jobEmpty);
                g.selectAll('.userNode').filter(f => sametarget.find(e => e.target === f)).classed('highlight', !jobEmpty);

                g.selectAll('.computeNode:not(.highlight)').classed('fade', true);
                linkg.selectAll('.links:not(.highlight)').classed('hide', true);
                g.selectAll('.jobNode:not(.highlight)').classed('hide', true);
                g.selectAll('.userNode:not(.highlight)').classed('fade', true);
                // table_footerNode.classed('fade', true);
                master.mouseover.forEach(f => f(d.values_name));
            }, null], [function (d) {
                // d3.select(this).select('.computeSig_label').text(d => d.orderG !== undefined ? `Group ${d.orderG + 1}${d.text !== '' ? `: ${d.text}` : ''}` : trimNameArray(d.key))//.call(wrap, true);
                // g.selectAll('.computeNode').classed('fade', false).classed('highlight', false);
                // g.selectAll('.jobNode').classed('hide', jobEmpty).classed('highlight', false).selectAll('.label').classed('hide', jobEmpty);
                // g.selectAll('.userNode').classed('fade', false).classed('highlight', false);
                // link.classed('hide', false).classed('highlight', false);
                releaseSelection();
                // table_footerNode.classed('fade', false);
                master.mouseout.forEach(f => f(d.values_name));
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
                d3.selectAll('.computeNode')
                g.selectAll('.computeNode').filter(f => {
                    let link = sametarget.filter(e => e.source === f);
                    if (link.length) {
                        f.timePoints = {};
                        link.forEach(l => {
                            Object.keys(l.target.timePoints).forEach(t => f.timePoints[t] = 1);
                        });
                        return true;
                    }
                    return false;
                }).classed('highlight', true)
                    .each(function (d) {
                        onFilterComputeHighlight(d3.select(this).select('g.computeSig'), Object.keys(d.timePoints))
                    });
                // table_footerNode.classed('fade', true);
            }, null], [function (d) {
                releaseSelection();
            }, null]));


        renderManual(computersNode, jobNode, link);

        link.call(updatelink, true);
        toggleComponent(jobEmpty);


        master.drawComp();
        isFirst = false;
        drawColorLegend();
        updateProcess();
        return master;
    }

    function freezinghandle(path, mouseOver, mouseLeave) {
        path.on('click', function (d) {
            if (runopt.mouse.disable) {
                if (!freezing)
                    _.bind(mouseOver[0], this)(d);
                else
                    _.bind(mouseLeave[0], this)(d);
            }
            freezing = !freezing;
            if (freezing)
                g.selectAll('.node:not(.highlight)').style('pointer-events', 'none'); // disable all click event
            else
                g.selectAll('.node:not(.highlight)').style('pointer-events', 'auto');
            d3.select('.tippannel').select('.freezing').text(freezing ? 'unfreeze' : 'freeze')
        });
        if (!freezing) {
            path.on('mouseover', function (d) {
                if (!freezing && !runopt.mouse.disable)
                    _.bind(mouseOver[0], this)(d);
            }).on('mouseleave', function (d) {
                if (!freezing && !runopt.mouse.disable)
                    _.bind(mouseLeave[0], this)(d);
            });
        }
        return path;
    }

    function renderManual(computers, jobNode, link) {
        // if (runopt.compute.type==='timeline' &&  !runopt.compute.bundle && runopt.overlayjob)
        //     jobNode.data().sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).forEach((d, i) => d.order = i);
        // else
        jobs.sort((a, b) => usersObj[a.user_name].order - usersObj[b.user_name].order);
        let jobCount = 0;
        let jobNum = jobs.length;
        jobs.forEach((d, i) => {
            d.order = jobCount;
            jobCount += 0.5;
            if (i < jobNum - 2) {
                if (jobs[i + 1].user_name !== d.user_name)
                    jobCount += 1;
            }
        });
        scaleJob.domain([0, jobCount])
        g.selectAll('.jobNode.new').classed('new', false).attr('transform', d => {
            d.x2 = graphicopt.jobPos();
            d.y = scaleJob(d.order);
            return `translate(${d.x2},${d.y})`
        }).style('opacity', 0);
        jobNode.transition().duration(animation_time).attr('transform', d => {
            d.x2 = graphicopt.jobPos();
            d.y = scaleJob(d.order);
            return `translate(${d.x2},${d.y})`
        }).style('opacity', undefined);


        let temp_link = link.data().filter(d => d.target.type === 'job');

        debugger
        // computers.data().forEach(d => d.y = d3.mean(temp_link.filter(e => e.source.key === d.key), f => f.target.y));
        computers.data().forEach(d => d.y = d3.min(temp_link.filter(e => e.source.key === d.key), f => f.target.y));
        let comps = computers.data().sort((a, b) => a.y - b.y);
        comps.forEach((d, i) => d.order = i);

        let checkComp = {};
        let checkCompNum = 0;
        let computerNum = comps.length;
        let computeCount = 0;
        let seperatemark = {};
        jobs.find(j => {
            let node_list = j.node_list.filter(comp => !checkComp[comp]);
            if (node_list.length > 2) {
                let nodeo = {};
                let min = {value: Infinity, key: undefined};

                for (let i = 0; i < node_list.length; i++) {

                    nodeo[node_list[i]] = {
                        el: computersObj[node_list[i]],
                        mse: {},
                        min: {value: Infinity, key: undefined}
                    };
                    checkComp[node_list[i]] = true;
                    checkCompNum++;
                }

                for (let i = 0; i < node_list.length - 1; i++) {
                    for (let z = i + 1; z < node_list.length; z++) {
                        let mse = d3.mean(scheme.data.tsnedata[node_list[i]].map((d, ti) => Math.pow(d[serviceSelected] - scheme.data.tsnedata[node_list[z]][ti][serviceSelected], 2)));
                        nodeo[node_list[i]].mse[node_list[z]] = {key: computersObj[node_list[z]], value: mse};
                        if (mse < nodeo[node_list[i]].min.value) {
                            nodeo[node_list[i]].min.value = mse;
                            nodeo[node_list[i]].min.key = computersObj[node_list[z]];
                            if (mse < min.value) {
                                min.value = mse;
                                min.key = computersObj[node_list[i]];
                            }
                        }
                        nodeo[node_list[z]].mse[node_list[i]] = {key: computersObj[node_list[i]], value: mse};
                        if (mse < nodeo[node_list[i]].min.value) {
                            nodeo[node_list[z]].min.value = mse;
                            nodeo[node_list[z]].min.key = computersObj[node_list[i]];
                            if (mse < min.value) {
                                min.value = mse;
                                min.key = computersObj[node_list[z]];
                            }
                        }
                    }
                }
                if (!min.key)
                    min.key = computersObj[node_list[0]]
                let current = min.key;
                let count = 0;
                current.order = computeCount;
                computeCount += 0.5;
                count++;
                while (count < node_list.length) {
                    // find the lowest mse
                    let min = {value: Infinity, key: undefined};
                    Object.values(nodeo[current.key].mse).forEach(d => {
                        if (d.value < min.value) {
                            min = {...d};
                        }
                        delete nodeo[d.key.key].mse[current.key];
                    });
                    if (min.key === undefined)
                        min = {...Object.values(nodeo[current.key].mse)[0]}
                    current = min.key;
                    current.order = computeCount;
                    computeCount += 0.5;
                    count++;
                }
                computeCount += 1;
            } else if (node_list.length) {
                node_list.forEach(n => {
                    computersObj[n].order = computeCount;
                    computeCount += 0.5;
                    checkComp[n] = true;
                    checkCompNum++;
                });
                computeCount += 1;
            }
            return checkCompNum === computerNum;
        });


        g.select('.host_title').attrs({
            'text-anchor': "end",
            'x': graphicopt.computePos(),
            'dy': -20
        }).text("Hosts's timeline");
        scaleNode_y_middle = d3.scaleLinear().range(yscale.range()).domain([0, computeCount]);

        g.selectAll('.computeNode.new')
            // .classed('new', false)
            .attr('transform', d => {
            d.x2 = graphicopt.computePos();
            d.y2 = scaleNode_y_middle(d.order);
            // return `translate(${d.x2},${d.y2 || d.y})`
            return `translate(${d.x2},0)`
        }).style('opacity', 0);
        computers.transition().duration(animation_time).attr('transform', d => {
            d.x2 = graphicopt.computePos();
            d.y2 = scaleNode_y_middle(d.order);
            // return `translate(${d.x2},${d.y2 || d.y})`
            return `translate(${d.x2},0)`
        }).style('opacity', undefined);

        link.transition().duration(animation_time)
            .call(updatelink);
    }

    let linkHorizontal = d3.linkHorizontal()
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        });

    function updatelink(path, transition) {
        (transition ? path.select('path').transition().duration(animation_time) : path.select('path'))
            .attr("d", d => {
                return linkHorizontal({
                    source: {
                        x: (d.source.x2 === undefined ? d.source.y : d.source.x2) + (d.source.type === 'job' ? graphicopt.job.r : 0),
                        y: d.source.y2 === undefined ? d.source.y : d.source.y2,
                    },
                    target: {
                        x: (d.target.x2 === undefined ? d.target.x : d.target.x2) - ((d.target.type === 'job' || (d.source.type === 'job')) ? graphicopt.job.r : 0),
                        y: d.target.y2 === undefined ? d.target.y : d.target.y2,
                    }
                });
            });
        path.select('text').attr("transform", function (d) {
            return "translate(" +
                (((d.source.x2 || d.source.x) + (d.target.x2 || d.target.x)) / 2) + "," +
                (((d.source.y2 === undefined ? d.source.y : d.source.y2) + (d.target.y2 === undefined ? d.target.y : d.target.y2)) / 2) + ")";
        })
        return path;
    }

    function releaseSelection() {
        g.selectAll('.jobNode').classed('hide', false).classed('highlight', false);
        g.selectAll('.userNode').classed('fade', false).classed('highlight', false);
        g.selectAll('.computeNode').classed('fade', false).classed('highlight', false)
            .selectAll('path.durationHighlight').remove();
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

    function releasehighlight() {
        g.selectAll('.node').style('pointer-events', 'auto').classed('fade', false).classed('hide', false).classed('highlight', false);
        g.selectAll('.node .jobNode').classed('hide', jobEmpty);
        g.selectAll('.links').classed('hide', false).classed('highlight', false);
        g.select('.table.footer').classed('fade', false);
    }

    function updaterow(path) {
        var delta_h = Math.max(tableLayout.row.height / 2, 15)
        let rows = path.selectAll('.row').data(d => [tableData[d.key]]).join('g').attr('class', 'row')
            .attr('transform', `translate(0,${-delta_h})`);
        // rows_n.append('rect').attrs({'class':'back-row','width':tableLayout.row.width,'height':tableLayout.row.height});
        let cells = rows.selectAll('.cell').data(d => d, d => d.key);
        cells.exit().remove();

        let cellsText = cells
        let cells_n = cells.enter().append('g').attr('class', d => 'cell ' + tableLayout.column[d.key].type).attr('transform', d => `translate(${tableLayout.column[d.key].x + (d.key !== 'UserID' ? tableLayout.column[d.key].width / 2 : 0)},${tableLayout.column[d.key].y})`);
        let cellsText_n = cells_n//.filter(d => tableLayout.column[d.key].type !== 'graph');
        cellsText_n.append('text')
            .style('text-anchor', d => d.key !== 'UserID' ? 'middle' : 'start');
        cellsText = cellsText_n.merge(cellsText).select('text').text(d => {
            let custom = tableLayout.column[d.key].format;
            if (custom)
                return d3.format(custom)(d.value);
            else
                return d.value;
        });


    }

    function handle_summary(data, render) {

        // let user_update,rangechange;
        // if (isanimation) {
        //     user.forEach(d=>d.needRender=(render))
        //     schema.forEach((s, i) => {
        //         let r = getViolinData(tableFooter, i, s);
        //         tableFooter[i + 3] = {key: r.axis, value: r};
        //     });
        //     user_update = user.filter(d => d.needRender);
        //     rangechange = false;
        //
        //     user_update.forEach(d => {
        //         schema.forEach((s, i) => {
        //             let r = getViolinData(d, i, s);
        //             tableData[d.key][i + 2] = {key: r.axis, value: r};
        //         })
        //         tableData[d.key][schema.length + 2] = {key: 'PowerUsage', value: d.PowerUsage.kwh};
        //         // tableData[d.key] =[{key:'Hosts', value:d.unqinode.length}
        //     });
        //     user_update = g.selectAll('.userNode').filter(d => d.needRender);
        //     user_update.selectAll('text').interrupt().selectAll("*").interrupt();
        //     user_update.selectAll('text').styles({
        //         'stroke': 'yellow',
        //         'stroke-opacity': 1
        //     }).transition().duration(3000).styles({'stroke-opacity': 0});
        // }
        // if (tableHeader.currentsort)
        //     handle_sort(true);
        // if (isanimation) {
        //     updaterow(rangechange ? g.selectAll('.userNode') : user_update);
        //     table_footer(nodeg.select('.table.footer'));
        // }
    }

    function handle_sort(disableLinkSort, skiprender) {
        if (tableHeader.currentsort !== undefined)
            //     users.sort((a, b) => b.values.length - a.values.length);
            // else
            switch (tableHeader.currentsort) {
                case 'Job_startTime':
                    user.forEach(u => u.jobStart_order = []);
                    let temp_link = linkdata.filter(d => d.target.type === 'job');
                    g.selectAll('.computeNode').data().forEach(d => {
                        let temp = temp_link.filter(e => e.source.key === d.key);
                        d.order = d3.max(temp, e => +new Date(e.target.startTime)) || 0;
                        if (temp.length) {
                            temp.forEach(t => user.find(u => u.key === t.target.user).jobStart_order.push(d.order));
                        }
                    });
                    g.selectAll('.computeNode').data().sort((a, b) => a.order - b.order).forEach((d, i) => (d.order = i, d.values_name.forEach(h => hostOb[h].order = i)));
                    // user.sort((a, b) => );
                    user.forEach(u => u.jobStart_order = _.mean(u.jobStart_order));
                    user.sort((a, b) => a.jobStart_order - b.jobStart_order);
                    break;
                case 'UserID':
                    users.sort((a, b) => a.key.localeCompare(b.key) * (-1 + 2 * tableHeader.direction));
                    break;
                // case 'Hosts':
                //     users.sort((a, b) => (b.unqinode.length - a.unqinode.length) * (-1 + 2 * tableHeader.direction));
                //     break;
                // case 'Jobs':
                //     users.sort((a, b) => (b.values.length - a.values.length) * (-1 + 2 * tableHeader.direction));
                //     break;
                // case 'PowerUsage':
                //     var indexf = tableHeader.findIndex(d => d.key === tableHeader.currentsort) - 1;
                //     user.sort((a, b) => ((tableData[b.key][indexf] || {value: -Infinity}).value - (tableData[a.key][indexf] || {value: -Infinity}).value) * (-1 + 2 * tableHeader.direction));
                //     break;
                default:
                    var indexf = tableHeader.findIndex(d => d.key === tableHeader.currentsort) - 1;
                    users.sort((a, b) => (tableData[b.key][indexf].value - tableData[a.key][indexf].value) * (-1 + 2 * tableHeader.direction));
                    break;
            }
        users.forEach((d, i) => {
            delete d.jobStart_order;
            d.order = i;
            d.orderlink = i;
        });
        if (!disableLinkSort) {
            computers.forEach(d => {
                let n = d.user.length;
                if (n > 1) {
                    const linkoorder = d3.min(d.user, e => e.order);
                    for (let i = 0; i < n; i++) {
                        d.user[i].orderlink = Math.min(linkoorder, d.user[i].orderlink);
                    }
                }
            });
            // order by links
            users.sort((a, b) => a.orderlink - b.orderlink).forEach((d, i) => d.order = i);
        }
        g.selectAll('.userNode.new').classed('new', false).attr('transform', d => {
            d.fy = yscale(d.order);
            d.fx = graphicopt.userPos();
            d.y = d.fy;
            d.x = d.fx;
            return `translate(${d.fx},${d.fy})`
        });
        g.selectAll('.userNode').transition().duration(animation_time)
            .attr('transform', d => {
                d.fy = yscale(d.order);
                d.fx = graphicopt.userPos();
                d.y = d.fy;
                d.x = d.fx;
                return `translate(${d.fx},${d.fy})`
            });
        if (!skiprender) {
            renderManual(d3.selectAll('.node.computeNode'), d3.selectAll('.node.jobNode'), d3.selectAll('.links'))
            master.drawComp();
        }
    }

    master.highlightStream = function (__) {
        runopt.highlightStream = __;
        drawEmbedding_timeline()
    }

    master.drawThreshold = function (_) {
        // return arguments.length ? (drawThreshold = _, timeArc.updateDrawData(), timeArc) : drawThreshold;
        return arguments.length ? (drawThreshold = _, master) : drawThreshold;
    };

    function gettsnedata(d) {
        return d.tsnedata ?? scheme.data.tsnedata[d.key];
    }

    master.drawComp = function () {
        computers.map(d => {
            d.drawData = getDrawData(gettsnedata(d))
        });
        drawEmbedding_timeline();
        return master;
    }
    var area_compute_up = d3.area()
        .curve(d3.curveCatmullRom)
        .x(function (d) {
            return xScale(d.timestep);
        })
        .y0(function (d) {
            return -yUpperScale(d.value[0]);
        })
        .y1(function (d) {
            return -yUpperScale(d.value[1]);
        })
        .defined(function (d) {
            return d && d.value[0] !== undefined
        });
    var area_compute_down = d3.area()
        .curve(d3.curveCatmullRom)
        .x(function (d) {
            return xScale(d.timestep);
        })
        .y0(function (d) {
            return -yDownerScale(d.value[0]);
        })
        .y1(function (d) {
            return -yDownerScale(d.value[1]);
        })
        .defined(function (d) {
            return d && d.value[0] !== undefined
        });

    function getDrawData(n) {
        n.noneSymetric = true;
        const drawData = [{
            value: n.map((d, ti) => {
                if (scheme.data.emptyMap[n.name] && scheme.data.emptyMap[n.name][ti] || d[serviceSelected] === undefined)
                    return {...d, value: [undefined, undefined]}
                if ((d[serviceSelected] - drawThreshold) > 0) {
                    return {...d, value: [0, d[serviceSelected] - drawThreshold]};
                }
                const mon = new Object();
                mon.value = [0, 0];
                mon.timestep = d.timestep;
                return mon;
            }), color: "rgba(252, 141, 89, 0.7)",
            up: true
        },
            {
                value: n.map((d, ti) => {
                    if (scheme.data.emptyMap[n.name] && scheme.data.emptyMap[n.name][ti] || d[serviceSelected] === undefined)
                        return {...d, value: [undefined, undefined]}
                    if ((d[serviceSelected] - drawThreshold) < 0)
                        return {...d, value: [d[serviceSelected] - drawThreshold, 0]};
                    const mon = new Object();
                    mon.value = [0, 0];
                    mon.timestep = d.timestep;
                    return mon;
                }), color: "#4682b482",
                up: false
            }];
        if (scheme.data.emptyMap[n.name]) {
            drawData.push({
                    value: n.map((d, ti) => {
                        if (!scheme.data.emptyMap[n.name][ti] || d[serviceSelected] === undefined)
                            return {...d, value: [undefined, undefined]}
                        if ((d[serviceSelected] - drawThreshold) > 0) {
                            return {...d, value: [0, d[serviceSelected] - drawThreshold]};
                        }
                        const mon = new Object();
                        mon.value = [0, 0];
                        mon.timestep = d.timestep;
                        return mon;
                    }), color: "rgb(221,221,221)",
                    up: true
                },
                {
                    value: n.map((d, ti) => {
                        if (!scheme.data.emptyMap[n.name][ti] || d[serviceSelected] === undefined)
                            return {...d, value: [undefined, undefined]}
                        if ((d[serviceSelected] - drawThreshold) < 0)
                            return {...d, value: [d[serviceSelected] - drawThreshold, 0]};
                        const mon = new Object();
                        mon.value = [0, 0];
                        mon.timestep = d.timestep;
                        return mon;
                    }), color: "rgb(221,221,221)",
                    up: false
                })
        }
        // n.drawData = drawData;
        return drawData;
    }

    function onFilterComputeHighlight(compute, timePoint, isall) {
        if (isall) {
            const d = compute.datum();
            d.highlightRange = d.drawData.map(d => {
                const color = d3.color(d.color);
                color.opacity = 1;
                return {value: d.value, color: color.toString(), up: d.up}
            });
            compute.selectAll('path.durationHighlight')
                .data(d => d.highlightRange)
                .join('path')
                .attr('class', 'durationHighlight')
                .call(updatelayerpath);
        } else {
            if (timePoint) {
                const d = compute.datum();
                d.highlightRange = d.drawData.map(d => {
                    const color = d3.color(d.color);
                    color.opacity = 1;
                    return {value: [], color: color.toString(), up: d.up}
                });
                timePoint.forEach(t => {
                    d.highlightRange.forEach((h, i) => {
                        // if (d.drawData[i].value[t][serviceSelected] !== undefined) {
                        h.value[t] = d.drawData[i].value[t];
                        // }
                    })
                });
                d.highlightRange.forEach((h, i) => {
                    if (h.value.length) {
                        let last = h.value[h.value.length - 1];
                        if (!last.sub) {
                            if (!h.value[h.value.length - 2]) {
                                debugger
                                const t = last.timestep + 1;
                                if (d.drawData[i].value[t]) {
                                    const sub = {...d.drawData[i].value[t]};
                                    sub.name = d.drawData[i].value[t].name;
                                    sub.timestep = d.drawData[i].value[t].timestep - 0.5;
                                    sub.value = sub.value.map((v, j) => (d.drawData[i].value[t - 1].value[j] + v) / 2);
                                    sub.sub = true;
                                    h.value.push(sub)
                                }
                            }
                        }
                    }
                })
                compute.selectAll('path.durationHighlight')
                    .data(d => d.highlightRange)
                    .join('path')
                    .attr('class', 'durationHighlight')
                    .call(updatelayerpath);
            } else {
                delete compute.datum().highlightRange;
                compute.selectAll('path.durationHighlight').remove();
            }
        }
    }

    function handleHightlight() {
        let listCompHighlight = {};
        if (runopt.highlightStream === 'highValue') {
            // find top 10
            let alldataPoint = [];
            computers.forEach(d => {
                d.highlightData = d.drawData.map(d => {
                    const color = d3.color(d.color);
                    color.opacity = 1;
                    return {value: [], color: color.toString(), up: d.up}
                });
                d.highlightData.displayText = [];
                d.highlightData.displayLine = [];
                d.highlightData.timesteps = [];
                gettsnedata(d).forEach(e => {
                    alldataPoint.push(e)
                })
            });
            alldataPoint.sort((a, b) => b[serviceSelected] - a[serviceSelected]);
            for (let i = 0; i < 10; i++) {
                const step = alldataPoint[i].timestep;
                computersObj[alldataPoint[i].name].highlightData.notEmpty = true;
                listCompHighlight[alldataPoint[i].name] = true;
                computersObj[alldataPoint[i].name].highlightData.forEach((d, j) => {
                    const up = computersObj[alldataPoint[i].name].drawData[j].up;
                    if (computersObj[alldataPoint[i].name].drawData[j].value[step - 1]) {
                        d.value[step - 1] = computersObj[alldataPoint[i].name].drawData[j].value[step - 1];
                        if (computersObj[alldataPoint[i].name].drawData[j].value[step - 1][serviceSelected] !== undefined) {
                            computersObj[alldataPoint[i].name].highlightData.displayLine[step - 1] = {
                                ...d.value[step - 1],
                                up
                            };
                        }
                    }
                    if (computersObj[alldataPoint[i].name].drawData[j].value[step][serviceSelected] !== undefined) {
                        d.value[step] = computersObj[alldataPoint[i].name].drawData[j].value[step];
                        computersObj[alldataPoint[i].name].highlightData.displayLine[step] = {
                            ...d.value[step],
                            up
                        };
                        computersObj[alldataPoint[i].name].highlightData.displayText.push({
                            ...computersObj[alldataPoint[i].name].drawData[j].value[step],
                            up: computersObj[alldataPoint[i].name].drawData[j].up,
                            text: Math.round(scaleService[serviceSelected].invert(d.value[step][serviceSelected]))
                        });
                        computersObj[alldataPoint[i].name].highlightData.timesteps.push(step);
                    }
                    if (computersObj[alldataPoint[i].name].drawData[j].value[step + 1]) {
                        d.value[step + 1] = computersObj[alldataPoint[i].name].drawData[j].value[step + 1];
                        if (computersObj[alldataPoint[i].name].drawData[j].value[step + 1][serviceSelected] !== undefined) {
                            computersObj[alldataPoint[i].name].highlightData.displayLine[step + 1] = {
                                ...d.value[step + 1],
                                up
                            };
                        }
                    }
                });
                // computersObj[alldataPoint[i].name].highlightData.displayLine.sort((a,b)=>a.timestep-b.timestep)
            }
        } else if (runopt.highlightStream === 'suddenChange') {
            // find top 10
            let alldataPoint = [];
            computers.forEach(d => {
                d.highlightData = d.drawData.map(d => {
                    const color = d3.color(d.color);
                    color.opacity = 1;
                    return {value: [], color: color.toString(), up: d.up}
                });
                d.highlightData.displayText = [];
                d.highlightData.displayLine = [];
                d.highlightData.timesteps = [];
                const arr = gettsnedata(d);
                for (let i = 1; i < arr.length; i++) {
                    if ((arr[i - 1] !== undefined) && (arr[i] !== undefined)) {
                        const pre = (arr[i - 1][serviceSelected] === 0) ? 0 : (arr[i - 1][serviceSelected] - 1);
                        const current = (arr[i][serviceSelected] === 0) ? 0 : (arr[i][serviceSelected] - 1);
                        const sudden = (current + 1) / (pre + 1);
                        alldataPoint.push({
                            name: d.key,
                            timestep: i,
                            value: sudden,
                            valueRaw: arr[i][serviceSelected] - arr[i - 1][serviceSelected]
                        })
                    }
                }
            });
            alldataPoint.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
            console.log(alldataPoint)
            for (let i = 0; i < 10; i++) {
                const step = alldataPoint[i].timestep;
                computersObj[alldataPoint[i].name].highlightData.notEmpty = true;
                listCompHighlight[alldataPoint[i].name] = true;
                computersObj[alldataPoint[i].name].highlightData.forEach((d, j) => {

                    const up = computersObj[alldataPoint[i].name].drawData[j].up;
                    if (computersObj[alldataPoint[i].name].drawData[j].value[step - 1]) {
                        d.value[step - 1] = computersObj[alldataPoint[i].name].drawData[j].value[step - 1];
                        if (computersObj[alldataPoint[i].name].drawData[j].value[step - 1][serviceSelected] !== undefined) {
                            computersObj[alldataPoint[i].name].highlightData.displayLine[step - 1] = {
                                ...d.value[step - 1],
                                up
                            };
                        }
                    }
                    if (computersObj[alldataPoint[i].name].drawData[j].value[step][serviceSelected] !== undefined) {
                        d.value[step] = computersObj[alldataPoint[i].name].drawData[j].value[step];
                        computersObj[alldataPoint[i].name].highlightData.displayLine[step] = {
                            ...d.value[step],
                            up
                        };
                        computersObj[alldataPoint[i].name].highlightData.displayText.push({
                            ...computersObj[alldataPoint[i].name].drawData[j].value[step],
                            up: computersObj[alldataPoint[i].name].drawData[j].up,
                            text: Math.round(scaleService[serviceSelected].invert(alldataPoint[i].valueRaw))
                        });
                        computersObj[alldataPoint[i].name].highlightData.timesteps.push(step);
                    }

                });
                // computersObj[alldataPoint[i].name].highlightData.displayLine.sort((a,b)=>a.timestep-b.timestep)
            }
        } else {
            computers.forEach(d => d.highlightData = undefined);
        }
        if (runopt.highlightStream !== 'none') {
            let listUserHighlight = {};
            let listJobHighlight = {};
            let link = linkg.selectAll('.links').classed('highlight2', false);
            g.classed('onhighlight2', true);
            g.selectAll('.computeNode').filter(d => !listCompHighlight[d.key])
                .classed('highlight2', false)

            g.selectAll('.computeNode').filter(d => listCompHighlight[d.key])
                .classed('highlight2', true)
                .each(function (d) {
                    d3.select(this).moveToFront();
                    debugger
                    const joblist = {};
                    d.highlightData.timesteps.forEach(i => d.job_id[i].forEach(j => joblist[j] = true))
                    const joblists = Object.keys(joblist);
                    const samesource = link.filter(f => (d === f.source) && (f.target.job_ids ? joblists.find(j => f.target.job_ids[j]) : joblist[f.target.key])).classed('hide', jobEmpty).classed('highlight2', !jobEmpty).data();
                    const sametarget = link.filter(f => samesource.find(e => e.target === f.source)).classed('hide', jobEmpty).classed('highlight2', !jobEmpty).data();
                    samesource.forEach(l => {
                        listJobHighlight[l.target.key] = true;
                    });
                    sametarget.forEach(l => {
                        listUserHighlight[l.target.key] = true;
                    });
                });
            g.selectAll('.jobNode').classed('hide', jobEmpty).classed('highlight2', d => listJobHighlight[d.key] ? (!jobEmpty) : false);
            g.selectAll('.userNode').classed('highlight2', d => listUserHighlight[d.key] ? (!jobEmpty) : false);
        } else {
            g.classed('onhighlight2', false);
            g.selectAll('.highlight2').classed('highlight2', false);
        }
    }

    d3.selection.prototype.moveToFront = function () {
        return this.each(function () {
            this.parentNode.appendChild(this);
        });
    };

    function drawEmbedding_timeline() {
        handleHightlight();
        let bg = svg.selectAll('.computeSig');
        let newnode = svg.selectAll('.computeNode.new')
            .classed('new',false);
        newnode
            .select('.computeSig').attr('transform', d => {
            return `translate(${-xScale.range()[1]},${d.y2})`
        });
        newnode
            .select('.computeSig_label').attr('transform', d => {
            return `translate(${-xScale.range()[1]},${fisheye_scale.y(scaleNode_y_middle(d.order))})`
        });
        bg.transition().duration(animation_time).attr('transform', d => {
            return `translate(${-xScale.range()[1]},${d.y2})`
        });

        bg.selectAll('path.linegg')
            .data(d => d.drawData)
            .join('path')
            .attr('class', 'linegg')
            .call(updatelayerpath);
        let nothighlight = bg.filter(d => !d.highlightData);
        nothighlight.selectAll('path.highightedLinegg').remove();
        nothighlight.selectAll('text.highightedText').remove();
        nothighlight.selectAll('path.highightedLine').remove();
        nothighlight.selectAll('path.linegg');

        let highighted = bg.filter(d => d.highlightData);
        highighted.filter(d => d.highlightData.notEmpty).selectAll('path.linegg').transition().duration(animation_time).style('opacity', 1);

        nothighlight = highighted.filter(d => !d.highlightData.notEmpty);
        nothighlight.selectAll('path.highightedLinegg').remove();
        nothighlight.selectAll('path.highightedLine').remove();
        nothighlight.selectAll('text.highightedText').remove();
        nothighlight.selectAll('path.linegg');

        highighted.selectAll('path.highightedLinegg')
            .data(d => d.highlightData)
            .join('path')
            .attr('class', 'highightedLinegg')
            .call(updatelayerpath);
        highighted.selectAll('path.highightedLine')
            .data(d => [d.highlightData.displayLine])
            .join('path')
            .attr('class', 'highightedLine')
            .call(updatelayerline);
        highighted.selectAll('text.highightedText')
            .data(d => d.highlightData.displayText)
            .join('text')
            .attr('class', 'highightedText')
            .call(updatelayerText);

        svg.selectAll('.computeSig_label').transition().duration(animation_time).attr('transform', d => {
            return `translate(${-xScale.range()[1]},${fisheye_scale.y(scaleNode_y_middle(d.order))})`
        });

        updateaxis();
        let lensingLayer = g.select('.fisheyeLayer');
        lensingLayer.attrs({
            'width': xScale.range()[1] - xScale.range()[0],
        }).attr('height', yscale.range()[1] - yscale.range()[0]);
        lensingLayer.attr('transform', `translate(${-graphicopt.computePos() + (+lensingLayer.attr('width'))},${yscale.range()[0]})`)
    }

    function updateaxis() {
        let bg = svg.selectAll('.computeSig');
        if (bg.data().length) {
            let rangey = d3.extent(bg.data(), d => d.y2 === undefined ? d.y : d.y2);
            let scale = d3.scaleTime().range(xScale.domain()).domain(scheme.limitTime);

            let axis = svg.select('.gNodeaxis')
                .classed('hide', false)
                .attr('transform', `translate(${(bg.datum().x2 || bg.datum().x) - graphicopt.computePos()},${rangey[0]})`);
            let Maxis = axis.select('.gMainaxis')
                .call(d3.axisTop(scale).tickSize(rangey[0] - rangey[1]).tickFormat(multiFormat));
            Maxis.select('.domain').remove();
            let mticks = Maxis.selectAll('.tick');
            mticks
                // .transition().duration(animation_time).attr('transform',d=>`translate(${fisheye_scale.x(scale(d))},0)`);
                // .transition().duration(animation_time)
                .attr('transform', d => `translate(${xScale(scale(d))},0)`);
            mticks.select('text').attr('dy', '-0.5rem');
            mticks.select('line').attr("vector-effect", "non-scaling-stroke").style('stroke-width', 0.1).styles({
                'stroke': 'black',
                'stroke-width': 0.2,
                'stroke-dasharray': '1'
            })

            let Saxis = axis.select('.gSubaxis').classed('hide', true);
            // if (fisheye_scale.x.focus) {
            //     const timearray = scale.ticks();
            //     Saxis.classed('hide',false);
            //     let pos2time = scale.invert(fisheye_scale.x.focus());
            //     let timesubarray = [new Date(+pos2time - (timearray[1] - timearray[0])), new Date(+pos2time + (timearray[1] - timearray[0]))];
            //     if (timesubarray[0]<first__timestep){
            //         timesubarray[0] = first__timestep;
            //         timesubarray[1] = new Date(+timesubarray[0] + (timearray[1] - timearray[0])*2)
            //     }else if(timesubarray[1]>last_timestep) {
            //         timesubarray[1] = last_timestep;
            //         timesubarray[0] = new Date(+timesubarray[1] - (timearray[1] - timearray[0])*2)
            //     }
            //     let subaxis = d3.scaleTime().range(timesubarray.map(t=>scale(t))).domain(timesubarray);
            //
            //     let timearray_sub = _.differenceBy(subaxis.ticks(),timearray,multiFormat)
            //
            //     Saxis.call(d3.axisTop(subaxis).tickSize(rangey[0]-rangey[1]).tickFormat(multiFormat).tickValues(timearray_sub));
            //     Saxis.select('.domain').remove();
            //     // let sticks = Saxis.selectAll('.tick').attr('transform',d=>`translate(${fisheye_scale.x(subaxis(d))},0)`);
            //     let sticks = Saxis.selectAll('.tick').attr('transform',d=>`translate(${xScale(subaxis(d))},0)`);
            //     sticks.select('line').attr("vector-effect","non-scaling-stroke").style('stroke-width',0.1).style('stroke-dasharray','1 3')
            //     sticks.select('text').style('font-size',8)
            // }
        }
    }

    function updatelayerpath(p) {
        return p
            .style('fill', d => d.color || 'unset')
            .attr("d", function (d) {
                return d.up ? area_compute_up(d.value) : area_compute_down(d.value);
            });
    }

    function updatelayerline(p) {
        return p
            .style('stroke', 'black')
            .style('fill', 'none')
            .attr("d", function (v) {
                var linecompute = d3.line()
                    .curve(d3.curveCatmullRom)
                    .x(function (d) {
                        return xScale(d.timestep);
                    }).y(function (d) {
                        return d.up ? -yUpperScale(d.value[1]) : -yDownerScale(d.value[0]);
                    })
                    .defined(function (d) {
                        return d && ((d.up ? d.value[0] : d.value[1]) !== undefined)
                    });
                return linecompute(v);
            });
    }

    function updatelayerText(p) {
        return p
            .style('fill', 'black')
            .style('text-anchor', 'middle')
            .attr('x', d => xScale(d.timestep))
            .attr('y', d => d.up ? -yUpperScale(d.value[1]) : -yDownerScale(d.value[0]))
            .attr('dy', d => d.up ? -3 : 3)
            .text(d => d.text);
    }

    master.currentSelected = function () {
        return {computers: _computers, users, jobs: filterTerm.map(j => scheme.data.jobs[j])}
    }

    function computeUsermetric() {
        // let timescale = d3.scaleTime().range([0,maxTimestep-1]).domain([first__timestep,last_timestep]);
        // let index_power = schema.indexOf(schema.find(d=>d.text==="Power consumption"));
        // let scaleBack;
        // if (index_power!==-1)
        //     scaleBack = d3.scaleLinear().domain([0,1]).range(schema[index_power].range);
        // user.forEach(u=>{
        //     u.dataRaw = [];
        //     u.unqinode.forEach(c=>{
        //         let timerange=[];
        //         timerange[0] = d3.min(u.unqinode_ob[c],e=>Math.min(maxTimestep-1,Math.max(0,Math.ceil(timescale(new Date(e.start_time))))));
        //         if (u.unqinode_ob[c].find(e=>!e.endTime))
        //             timerange[1] = maxTimestep-1;
        //         else
        //             timerange[1] = d3.max(u.unqinode_ob[c],e=>Math.min(maxTimestep-1,Math.max(0,Math.ceil(timescale(new Date(e.endTime))))));
        //         if (index_power!==-1)
        //             for (let t =timerange[0];t<=timerange[1];t++) {
        //                 let numbArray = tsnedata[c][t].slice();
        //                 u.dataRaw.push(numbArray);
        //                 if (!u.PowerUsage)
        //                     u.PowerUsage = {};
        //                 u.PowerUsage.sum = (u.PowerUsage.sum || 0) + Math.round(scaleBack(numbArray[index_power] || 0));
        //                 u.PowerUsage.time = Math.max(u.PowerUsage.time||0,(timerange[1]-timerange[0])*deltaTime/1000);
        //                 u.PowerUsage.kwh = Math.round(u.PowerUsage.sum / 1000 / u.PowerUsage.time * 3600);
        //                 tableFooter.dataRaw.push(numbArray)
        //             }
        //     })
        // });
        // triggerCal_Usermetric=false
    }

    function pathRound(path, opt) {
        opt.ctl = opt.ctl || 0;
        opt.ctr = opt.ctr || 0;
        opt.cbl = opt.cbl || 0;
        opt.cbr = opt.cbr || 0;
        let bpath = '';
        if (opt.ctl)
            bpath += `M0,-${opt.ctl} q0,-${opt.ctl} ${opt.ctl},-${opt.ctl}`;
        else
            bpath += `M0,0`;
        bpath += ` h${opt.width - opt.ctr - opt.ctl}`;
        if (opt.ctr)
            bpath += `q${opt.ctr},0 ${opt.ctr},${opt.ctr}`;
        bpath += `v${opt.height - opt.ctr - opt.cbr}`;
        if (opt.cbr)
            bpath += `q0,${opt.cbr} -${opt.cbr},${opt.cbr}`;
        bpath += `h-${opt.width - opt.cbr - opt.cbl}`;
        if (opt.cbl)
            bpath += `q-${opt.cbl},0 -${opt.cbl},-${opt.cbl}`;
        bpath += `z`;

        path.attr('d', bpath)
    }

    function table_header(path) {
        // let headerData = isFull ? tableHeader : tableHeader.filter(d => tableLayout.column[d.key].type !== 'graph');
        let headerData = tableHeader;
        path.select('.back').attr('transform', `translate(0,${10})`);
        pathRound(path.select('.back').select('path'), {width: tableLayout.row.width, height: 25, ctl: 10, ctr: 10});
        let rows = path.selectAll('.row').data([headerData]);
        rows.exit().remove();
        let rows_n = rows.enter().append('g').attr('class', 'row')
            .attr('transform', `translate(0,${-tableLayout.row.height / 2})`);

        let cells = rows_n.merge(rows).selectAll('.cell').data(d => d);
        cells.exit().remove();

        let cells_n = cells.enter().append('g').attr('class', d => 'cell ' + tableLayout.column[d.key].type).attr('transform', d => `translate(${tableLayout.column[d.key].x + (d.key !== 'UserID' ? tableLayout.column[d.key].width / 2 : 0)},20)`);
        cells_n.append('text')
            .styles({'font-weight': 'bold', 'text-anchor': d => d.key !== 'UserID' ? 'middle' : 'start'}).attrs(d => {
            return {width: tableLayout.column[d.key].width}
        });
        cells = cells_n.merge(cells);
        cells.select('text').style('pointer-events', 'all').text(d => d.value)
            .call(d => {
                const dir = d.datum().direction;
                if (dir)
                    truncate(d, '▲');
                else if (dir === undefined)
                    truncate(d, '↕');
                else
                    truncate(d, '▼');
            });
        cells.on('click', function (d) {
            tableHeader.el = this;
            if (d.key !== tableHeader.currentsort)
                cells.filter(e => e.key === tableHeader.currentsort)
                    .each(function (e) {
                        e.direction = undefined;
                        d3.select(this).select('text').text(d => d.value).call(d => truncate(d, '↕'));
                    });
            tableHeader.currentsort = d.key;
            tableHeader.direction = (d.direction = !d.direction);
            handle_sort(true);
            d3.select(this).select('text').text(d => d.value).call(d => {
                const dir = d.datum().direction;
                if (dir)
                    truncate(d, '▲');
                else if (dir === undefined)
                    truncate(d, '↕');
                else
                    truncate(d, '▼');
            });
        })

    }

    function updateLayout() {
        let currentsort = tableHeader.currentsort;
        let currentdirection = tableHeader.direction;
        tableHeader = [{key: 'UserID', value: 'UserID'}, {key: 'Hosts', value: '#Computes'}, {
            key: 'Jobs',
            value: '#Jobs'
        }];
        tableLayout.column = {
            'UserID': {id: 'UserID', type: 'text', x: 10, y: 20, width: 60},
            'Hosts': {id: 'Hosts', text: '#Computes', type: 'num', x: 60, y: 20, width: 90},
            'Jobs': {id: 'Jobs', text: '#Jobs', type: 'num', x: 165, y: 20, width: 60},
        }
        let offset = tableLayout.column['Jobs'].x + tableLayout.column['Jobs'].width;
        let padding = 15;
        // if (showtable)
        serviceFullList.forEach((d, i) => {
            tableLayout.column[d.text] = {
                id: d.text,
                type: 'graph',
                x: offset + (i) * tableLayout.row["graph-width"] + padding,
                y: 20,
                width: tableLayout.row["graph-width"]
            };
            tableLayout.row.width = offset + (i) * (tableLayout.row["graph-width"] + padding);
            tableHeader.push({key: d.text, value: d.text});
        });
        // else
        //     tableLayout.row.width = offset+tableLayout.row["graph-width"]+padding;
        tableLayout.row.width += tableLayout.row["graph-width"];
        // tableLayout.column['PowerUsage'] = {id:'PowerUsage',type: 'num',format:'.1f' ,x: tableLayout.row.width,y:20,width:70};
        // tableHeader.push({key:'PowerUsage', value:'power'});
        tableHeader.currentsort = currentsort;
        tableHeader.direction = currentdirection;

        table_header(table_headerNode);
    }

    master.filterTerms = function (_) {
        return arguments.length ? (filterTerm = _, master) : filterTerm;
    };

    master.graphicopt = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    graphicopt[i] = __[i];
                }
            }
            svg = d3.select(graphicopt.svg);
            return master;
        } else {
            return graphicopt;
        }

    };
    let isNeedRender = true;
    master.scheme = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    scheme[i] = __[i];
                }
            }
            xScale = d3.scaleLinear().domain([0, __.data.timespan.length - 1]).range([0, graphicopt.computePos()]);
            updateLayout();
            return master;
        } else {
            return scheme;
        }

    };
    master.getColorScale = function (_data) {
        return arguments.length ? (getColorScale = _data ? _data : function () {
            return color
        }, master) : getColorScale;
    };
    master.onmouseOver = function (_data) {
        return arguments.length ? (onmouseOver = _data, master) : onmouseOver;
    };
    master.onmouseLeave = function (_data) {
        return arguments.length ? (onmouseLeave = _data, master) : onmouseLeave;
    };
    master.onmouseClick = function (_data) {
        return arguments.length ? (onmouseClick = _data, master) : onmouseClick;
    };
    master.catergogryList = function (_data) {
        return arguments.length ? (catergogryList = _data, master) : catergogryList;
    };

    master.schema = function () {
        isNeedRender = true;
    };
    master.layout = function (d) {
        layout = {};
        d.forEach(k => layout[k.key] = _.flatten(k.value).filter(d => d))
        TimeArc.classMap(layout)
    };
    return master;
};

function handle_data_timeArc() {
    const keys = Layout.timespan//.slice(0,10);
    let scheme = {
        limitColums: [0, 10],
        limitTime: [keys[0], keys[keys.length - 1]],
        time: {rate: 1, unit: 'Minute'},
        // timeLink: {rate:5,unit:'Minute'},
        timeformat: d3.timeDay.every(1),
    };
    scheme.data = {};
    scheme.data.timespan = keys;

    scheme.data.timespan = keys;
    scheme.data.users = Layout.usersStatic;
    scheme.data.jobs = Layout.jobsStatic;
    scheme.data.computers = Layout.computesStatic;
    scheme.data.userArr = Layout.userarrdata;
    scheme.data.jobArr = Layout.jobarrdata;
    scheme.data.tsnedata = tsnedata;
    scheme.data.minMaxData = Layout.minMaxDataComp;
    scheme.data.emptyMap = Layout.noJobMap
    Mapopt.selectedService = 0;
    Mapopt.removeList = {};
    Object.keys(Layout.jobsStatic).forEach(j => {
        if (Layout.jobsStatic[j].job_array_id)
            Mapopt.removeList[j] = 1;
    });
    subObject.graphicopt(Mapopt).scheme(scheme).draw();
}
