d3.TimeArc = function () {
//Constants for the SVG
    let timeArc = {};
    let graphicopt = {
        margin: {top: 15, right: 0, bottom: 5, left: 5},
        width: 1000,
        height: 600,
        scalezoom: 10,
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
        min_height: 100,
        dotRadius: 2,
        containHolder: '',
        summary: {size: 30},
        removeList: {},
    };
    let arr;
    let runopt = {
        limitTime: [],
        // time: {rate:1,unit:'Hour'},
        // timeformat: d3.timeHour.every(1),
        time: {rate: 1, unit: 'Year'},
        timeformat: d3.timeYear.every(1),
        stickyTerms: [],
        filterTerm: undefined,
        termGroup: {},
        groupTimeLineMode: 'onDisplay'//'onDisplay', //'summary'
    };
    let svg, force;
    let UnitArray = ['Minute', 'Hour', 'Day', 'Month', 'Year'];
    let drawThreshold = 650 / 800;
    let pNodes;
    var node_drag = d3.drag()
        .on("start", dragstart)
        .on("drag", dragmove)
        .on("end", dragend);

    function dragstart(d, i) {
        force.stop() // stops the force auto positioning before you start dragging
    }

    function dragmove(d, i) {
        d.px += d3.event.dx;
        d.py += d3.event.dy;
        d.x += d3.event.dx;
        d.y += d3.event.dy;
    }

    function dragend(d, i) {
        d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        force.resume();
    }

    function releasenode(d) {
        d.fixed = false; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        //force.resume();
    }


    var data, data2;
    let timeHigherUnit;
    // var firstDate = Date.parse("2005-01-01T00:00:00");
    var numSecondADay = 24 * 60 * 60;
    var numSecondAMonth = 30 * numSecondADay;
    var minYear = 2006;
    var maxYear = 2015;
    var timeScaleIndex

    let timeUnitMaster = 'Year';

    function updateTimeScale() {
        let timek = Object.keys(formatTimeUlti);
        timeUnitMaster = timek[timek.indexOf(runopt.time.unit) + 1];
        timeHigherUnit = UnitArray[UnitArray.indexOf(runopt.time.unit) + 1];
        runopt.timeformat = d3['time' + runopt.time.unit].every(runopt.time.rate);
        if (runopt.timeLink)
            runopt.timeLinkformat = d3['time' + runopt.timeLink.unit].every(runopt.timeLink.rate);
        timeScaleIndex = d3.scaleTime().domain(runopt.limitTime);
        totalTimeSteps = timeScaleIndex.ticks(runopt.timeformat).length;
        timeScaleIndex.range([0, totalTimeSteps - 1]);
        XGAP_ = graphicopt.widthG() / (totalTimeSteps - 1);
    }

    var totalTimeSteps = 12 * (maxYear - minYear);

    var sourceList = {};
    var numSource = {};
    var maxCount = {}; // contain the max frequency for 4 categories

    var nodes;
    var numNode, numNode2;

    var link;
    var links;
    var linkArcs;
    var termArray = [], termArray2, termArray3;
    var relationship;
    var termMaxMax, termMaxMax2;
    var terms;
    var nodeG;
    var xStep = 0;//100;
//var xScale = d3.time.scale().range([0, (width-xStep-100)/totalTimeSteps]);
    var yScale;
    var linkScale;
    var searchTerm = "";

    var nodeY_byName = {};

    var isLensing = false;
    var lensingMul = 5;
    var lMonth = -lensingMul * 2;
    var coordinate = [0, 0];
    var XGAP_ = 12; // gap between months on xAxis

    let minYdis = 10;

    let mouseover_dispath = () => {
    };
    let mouseout_dispath = () => {
    };
    let mouseclick_dispath = () => {
    };
    // let mouseover_dispath = ()=>{};
    // let mouseout_dispath = ()=>{};

    function xScale(m) {
        if (isLensing) {
            var numLens = 5;
            var maxM = Math.max(0, lMonth - numLens - 1);
            var numMonthInLense = (lMonth + numLens - maxM + 1);

            //compute the new xGap
            var total = totalTimeSteps + numMonthInLense * (lensingMul - 1);
            var xGap = (XGAP_ * totalTimeSteps) / total;

            if (m < lMonth - numLens)
                return m * xGap;
            else if (m > lMonth + numLens) {
                return maxM * xGap + numMonthInLense * xGap * lensingMul + (m - (lMonth + numLens + 1)) * xGap;
            } else {
                return maxM * xGap + (m - maxM) * xGap * lensingMul;
            }
        } else {
            return m * XGAP_;
        }
    }

    timeArc.init = function () {
//---End Insert------
//Append a SVG to the body of the html page. Assign this SVG as an object to svg
        svg.classed('timearc', true)
            .attr('width', graphicopt.width)
            .attr('height', graphicopt.height);
        if (svg.select('g.linkHolder').empty())
            svg.append('g').attr('class', 'linkHolder').style('fill', 'none').style('stroke', 'currentColor');
        if (svg.select('g.nodeHolder').empty())
            svg.append('g').attr('class', 'nodeHolder')
        let defs = svg.append("defs");

        defs.append("marker")
            .attr("id", "arrowHeadend")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 5)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("class", "arrowHead");
        defs.append("marker")
            .attr("id", "arrowHeadstart")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 5)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M10,-5L0,0L10,5")
            .attr("class", "arrowHead");
        xStep = graphicopt.margin.left;
        maxheight = graphicopt.heightG();
        d3.select('#rackDisplayControl').on('change', function () {
            if ($(this).prop('checked')) {
                runopt.groupTimeLineMode = "summary";
            } else {
                runopt.groupTimeLineMode = "onDisplay";
            }
            recompute();
        });
        // d3.select('#userDisplay_control').on('change',function(){
        //     d3.select(this).dispatch('changeVal');
        //     handledata(data);
        //     timeArc.draw();
        // }).on('changeVal',()=>{
        //     runopt.userStreamMode =  $('#userDisplay_control').val();
        //     switch (runopt.userStreamMode){
        //         case 'job':
        //             handleInfo = handleByJob;
        //             break;
        //         case 'compute':
        //             handleInfo = handleByCompute;
        //             break
        //     }
        // }).dispatch('changeVal')
//******************* Forced-directed layout

//Set up the force layout
        force = d3.forceSimulation()
            .force("charge", d3.forceManyBody().strength(-100))
            .force("link", d3.forceLink().distance(d => d.__maxLinkIndex__ ?? 0).strength(1))
            .force("center", d3.forceCenter(graphicopt.widthG() / 2, graphicopt.heightG() / 2))
            // .force('x', d3.forceX(0).strength(0.3))
            // .force('y', d3.forceY(0).strength(0.015))
            .force('x', d3.forceX().x(d => d.__maxLinkIndex__ ?? 0).strength(0.3))
            .on("end", function () {
                detactTimeSeries();
                drawStreamLegend();
            }).on("tick", function () {
                setTimeout(() => requestAnimationFrame(timeArc.update), 0)
            });
        force.stop();
        // .size([width, height]);
        catergogryList.forEach((d, i) => d.order = i);

        colorCatergory.domain(catergogryList.sort((a, b) => a.value.colororder - b.value.colororder).map(d => d.key));
        catergogryList.sort((a, b) => a.order - b.order);
//---Insert-------
    };

    var area = d3.area()
        .curve(d3.curveCatmullRomOpen)
        .x(function (d) {
            return xStep + xScale(d.monthId);
        })
        .y0(function (d) {
            return d.yNode - yScale(d.value);
        })
        .y1(function (d) {
            return d.yNode + yScale(d.value);
        }).defined(d => d.value !== null);
    let yUpperScale, yDownerScale;
    var area_compute = d3.area()
        .curve(d3.curveCatmullRom)
        .x(function (d) {
            return xStep + xScale(d.monthId);
        })
        .y0(function (d) {
            return d.yNode - yScale(d.value[0]);
        })
        .y1(function (d) {
            return d.yNode - yScale(d.value[1]);
        })
        .defined(function (d) {
            return d.value[0] !== undefined
        });
    var area_compute_up = d3.area()
        .curve(d3.curveCatmullRom)
        .x(function (d) {
            return xStep + xScale(d.monthId);
        })
        .y0(function (d) {
            return d.yNode - yUpperScale(d.value[0]);
        })
        .y1(function (d) {
            return d.yNode - yUpperScale(d.value[1]);
        })
        .defined(function (d) {
            return d.value[0] !== undefined
        });
    var area_compute_down = d3.area()
        .curve(d3.curveCatmullRom)
        .x(function (d) {
            return xStep + xScale(d.monthId);
        })
        .y0(function (d) {
            return d.yNode - yDownerScale(d.value[0]);
        })
        .y1(function (d) {
            return d.yNode - yDownerScale(d.value[1]);
        })
        .defined(function (d) {
            return d.value[0] !== undefined
        });
    var numberInputTerms = 0;
    var listMonth;


    var nodes2 = [];
    var links2 = [];
    var nodes2List = {};
    var links2List = {};
    let summary = {user: 0, compute: 0, rack: 0}; // todo auto detect group
    let catergogryObject = {};
    let catergogryList = [];
    let class2term = {};
    let term2class = {};

    function handleclassMap(classes) {
        class2term = classes;
        term2class = {};
        d3.keys(class2term).forEach(k => {
            class2term[k].forEach(t => term2class[t] = {key: k, value: class2term[k]})
        });
    }

    function upadateTerms(term, c, m, count) {
        if (!terms[term]) {
            terms[term] = new Object();
            terms[term].frequency = 0;
            terms[term].maxTimeIndex = -100;   // initialized negative
            terms[term].category = c;
            summary[c]++;
        }
        if (!terms[term][m]) {
            terms[term][m] = count;
        } else {
            terms[term][m] += count;
        }

        if ((terms[term][m] > terms[term].frequency)) {
            terms[term].frequency = terms[term][m];
            terms[term].maxTimeIndex = m;
            if (terms[term].frequency > termMaxMax)
                termMaxMax = terms[term].frequency;
        }
    }

    // let handleInfo = handleByUser;
    //
    // function handleByUser(e, arr, c, m) {
    //     let term = e.key;
    //     arr.userdata[term].current = d3.sum(e.values.map(it => d3.sum(it.values,e=>e.value)));
    //     e.values.filter(s=>s.key==='startTime').forEach(s => s.values.forEach(d => d.__terms__[term] = d.value)); //job
    //     upadateTerms(term, c, m, arr.userdata[term].current)
    // }
    //
    // function handleByJob(e, arr, c, m) {
    //     let term = e.key;
    //     arr.userdata[term].current += d3.sum(e.values.map(it => (it.key === "startTime" ? 1 : -1) * it.values.length));
    //     e.values.filter(s=>s.key==='startTime').forEach(s => s.values.forEach(d => d.__terms__[term] = 2)); //job
    //     upadateTerms(term, c, m, arr.userdata[term].current)
    // }
    //
    // function handleByCompute(e, arr, c, m) {
    //     let term = e.key;
    //     arr.userdata[term].current = arr.userdata[term].current||{};
    //
    //     e.values.forEach(s=>{
    //         if(s.key==='startTime'){
    //             s.values.forEach(d=>{
    //                 d.__terms__[term] = 2;
    //                 Object.keys(d.category['compute']).forEach(c=>{
    //                     if (!arr.userdata[term].current[c]){
    //                         arr.userdata[term].current[c] = 1;
    //                     }else
    //                         arr.userdata[term].current[c]++;
    //                 });
    //             })
    //         }else{
    //             s.values.forEach(d=>{
    //                 Object.keys(d.category['compute']).forEach(c=>{
    //                     arr.userdata[term].current[c] --;
    //                     if (arr.userdata[term][c]===0) // no job using this
    //                         delete arr.userdata[term][c];
    //                 });
    //             })
    //         }
    //     });
    //     upadateTerms(term, c, m, Object.keys(arr.userdata[term].current).length)
    // }
    function handledata(arr) {
        updateTimeScale();
        Object.keys(summary).forEach(k => summary[k] = 0);
        arr.sort((a, b) => a.date - b.date);
        terms = new Object();
        termMaxMax = 1;
        arr.forEach(function (d) {
            // Process date
            // d.date = new Date(d["time"]);
            var m = Math.round(timeScaleIndex(runopt.timeformat(d.date)));
            d.__timestep__ = m;
            d.__terms__ = {};
            for (let c in d.category) {
                for (let term in d.category[c]) {
                    d.__terms__[term] = d.category[c][term];
                    if (!terms[term]) {
                        terms[term] = new Object();
                        terms[term].frequency = 0;
                        terms[term].maxTimeIndex = -100;   // initialized negative
                        terms[term].category = c;
                        summary[c]++;
                    }
                    if (!terms[term][m])
                        terms[term][m] = d.__terms__[term];
                    else {
                        terms[term][m] += d.__terms__[term];
                        if (terms[term][m] > terms[term].frequency) {
                            terms[term].frequency = terms[term][m];
                            terms[term].maxTimeIndex = m;
                            if (terms[term].frequency > termMaxMax)
                                termMaxMax = terms[term].frequency;
                        }
                    }
                }
            }

        });
        data = arr;
        console.log("DONE reading the input file = " + data.length);
    }

    let first = true;
    timeArc.draw = function () {
        first = true;
        // setupSliderScale(svg);
        updateProcess({percentage: 70, text: 'TimeArc: compute relationship'});
        readTermsAndRelationships();

        drawColorLegend();
        drawTimeLegend();
        drawTimeBox(); // This box is for brushing
        updateTimeLegend();
        drawLensingButton();

        // $(function () {
        //     $("#search").autocomplete({
        //     // $(graphicopt.containHolder + " #search").autocomplete({
        //         source : Array2Object(termArray)
        //     });
        // });
        recompute(undefined,true);
        first = false;
    };

    function Array2Object(arr) {
        let temp = {};
        arr.forEach(d => temp[d.term] = null);
        return temp;
    }

    function recompute(isSkipforce,skipreadrelationship) {
        // var bar = d3.select('#progBar').node(),
        //     fallback = d3.select('#downloadProgress').node(),
        //     loaded = 0;
        //
        // var load = function () {
        //     loaded += 1;
        //     bar.value = loaded;
        //
        //     /* The below will be visible if the progress tag is not supported */
        //     $(fallback).empty().append("HTML5 progress tag not supported: ");
        //     $('#progUpdate').empty().append(loaded + "% loaded");
        //
        //     if (loaded == 90) {
        //         clearInterval(beginLoad);
        //         $('#progUpdate').empty().append("Compute position");
        //     }
        // };
        //
        // var beginLoad = setInterval(function () {
        //     load();
        // }, 10);
        setTimeout(alertFunc, 333);

        function alertFunc() {
            if (!skipreadrelationship){
                updateProcess({percentage: 70, text: 'TimeArc: compute relationship'});
                readTermsAndRelationships();
            }
            updateProcess({percentage: 75, text: 'TimeArc: compute Node and Link'});
            computeNodes();
            adjustStreamheight();
            computeLinks();
            updateProcess({percentage: 90, text: 'TimeArc: render with force'});
            drawStreamLegend();
            if (!isSkipforce) {
                force.force("center", d3.forceCenter(graphicopt.widthG() / 2, graphicopt.heightG() / 2))
                    .nodes(nodes)
                    .force('x', d3.forceX().x(d => d.__maxLinkIndex__ ?? 0).strength(0.3))
                    .force("link", d3.forceLink(links).distance(d => d.__maxLinkIndex__).strength(1))
                // .force('link').links(links);
                force.alpha(1);
                force.restart();
            } else {
                timeArc.update();
                updateProcess();
            }
        }
    }

    function readTermsAndRelationships() {
        const strickFilter = {};
        if (runopt.filterTerm) {
            runopt.filterTerm.forEach(t => strickFilter[t] = {isSelected: 1});
        }
        data2 = (runopt.filterTerm ? data.filter(d => runopt.filterTerm.find(e => d.__terms__[e])) : data).filter(function (d, i) {
            if (!searchTerm || searchTerm == "") {
                return d;
            } else if (d.__terms__[searchTerm] || runopt.stickyTerms.find(e => d.__terms__[e]))
                return d;
        });

        var selected = {};

        // if ((searchTerm && searchTerm != "")|| !runopt.filterTerm.length) {
        if ((searchTerm && searchTerm != "") || (runopt.filterTerm && runopt.filterTerm.length)) {
            data2.forEach(function (d) {
                for (var term1 in d.__terms__) {
                    if (!selected[term1])
                        selected[term1] = {};
                    else {
                        if (!selected[term1].isSelected)
                            selected[term1].isSelected = 1;
                        else
                            selected[term1].isSelected++;
                    }
                }
            });
        }
        // else if ((searchTerm && searchTerm != "")||runopt.filterTerm.length){
        //     selected = strickFilter;
        //     data2.forEach(function (d) {
        //         for (var term1 in d.__terms__) {
        //             if (selected[term1])
        //                 selected[term1].isSelected++;
        //         }
        //     });
        // }

        var removeList = graphicopt.removeList;   // remove list **************

        catergogryObjectReject = {}
        catergogryList.filter(e => e.disable).forEach(e => {
            catergogryObjectReject[e.key] = 1
        });


        termArray = [];
        for (var att in terms) {
            terms[att].sudden = {};
            var e = {};
            e.term = att;
            // if (catergogryObjectReject[terms[att].category]||removeList[e.term] || (searchTerm && searchTerm !== "" && !selected[e.term])) // remove list **************
            if (catergogryObjectReject[terms[att].category] || removeList[e.term] || (Object.keys(selected).length && !selected[e.term])) // remove list **************
                continue;

            var maxNet = 0;
            var maxTimeIndex = -1;
            for (var m = 0; m < totalTimeSteps; m++) {
                if (terms[att][m]) {
                    var previous = 0;
                    if (terms[att][m - 1])
                        previous = terms[att][m - 1];
                    var net = (terms[att][m] + 1) / (previous + 1); // compute sudden attention
                    terms[att].sudden[m] = net;
                    if (net > maxNet) {
                        maxNet = net;
                        maxTimeIndex = m;
                    }
                }
            }
            // e.frequency = terms[att].frequency;
            e.max = maxNet;
            e.maxTimeIndex = maxTimeIndex;
            e.category = terms[att].category;

            if (e.term == searchTerm) {
                e.max = 10000;
                e.isSearchTerm = 1;
            } else if ((Object.keys(selected).length && selected[e.term]) && selected[e.term].isSelected) {
                e.max = 5000 + selected[e.term].isSelected;
                //   console.log("e.term = "+e.term+" e.max =" +e.max );
            }

            termArray.push(e);
        }

        termArray.sort(function (a, b) {
            if (a.max < b.max) {
                return 1;
            }
            if (a.max > b.max) {
                return -1;
            }
            return 0;
        });

        //if (searchTerm)
        numberInputTerms = termArray.length;
        console.log("numberInputTerms=" + numberInputTerms);

        // Compute relationship **********************************************************
        // numNode = Math.min(1000, termArray.length);
        // numNode2 = Math.min(500, termArray.length);
        numNode = termArray.length;
        numNode2 = termArray.length;
        var selectedTerms = {};
        for (var i = 0; i < numNode2; i++) {
            selectedTerms[termArray[i].term] = termArray[i].max;
        }


        relationship = {};
        relationshipMaxMax = 0;
        data2.forEach(function (d) {
            var m = d.__timestep__;
            for (var term1 in d.__terms__) {
                if (selectedTerms[term1]) {   // if the term is in the selected 100 terms
                    for (var term2 in d.__terms__) {
                        if (selectedTerms[term2]) {   // if the term is in the selected 100 terms
                            if (!relationship[term1 + "__" + term2]) {
                                relationship[term1 + "__" + term2] = new Object();
                                relationship[term1 + "__" + term2].max = 1;
                                relationship[term1 + "__" + term2].maxTimeIndex = m;
                            }
                            if (!relationship[term1 + "__" + term2][m]) {
                                relationship[term1 + "__" + term2][m] = d.value;
                                if (relationship[term1 + "__" + term2][m] > relationship[term1 + "__" + term2].max) {
                                    relationship[term1 + "__" + term2].max = relationship[term1 + "__" + term2][m];
                                    relationship[term1 + "__" + term2].maxTimeIndex = m;

                                    if (relationship[term1 + "__" + term2].max > relationshipMaxMax) // max over time
                                        relationshipMaxMax = relationship[term1 + "__" + term2].max;
                                }
                            } else {
                                relationship[term1 + "__" + term2][m] += d.value;
                                if (relationship[term1 + "__" + term2][m] > relationship[term1 + "__" + term2].max) {
                                    relationship[term1 + "__" + term2].max = relationship[term1 + "__" + term2][m];
                                    relationship[term1 + "__" + term2].maxTimeIndex = m;

                                    if (relationship[term1 + "__" + term2].max > relationshipMaxMax) // max over time
                                        relationshipMaxMax = relationship[term1 + "__" + term2].max;
                                }
                            }
                        }
                    }
                }
            }
        });

        console.log("DONE computing realtionships relationshipMaxMax=" + relationshipMaxMax);
    }

    function computeConnectivity(a, num) {
        for (var i = 0; i < num; i++) {
            a[i].isConnected = 0;
            a[i].isConnectedmaxTimeIndex = a[i].maxTimeIndex;
        }

        for (var i = 0; i < num; i++) {
            var term1 = a[i].term;
            for (var j = i + 1; j < num; j++) {
                var term2 = a[j].term;
                if (relationship[term1 + "__" + term2] && relationship[term1 + "__" + term2].max >= Math.round(valueSlider)) {
                    if (relationship[term1 + "__" + term2].max > a[i].isConnected) {
                        a[i].isConnected = relationship[term1 + "__" + term2].max;
                        a[i].isConnectedmaxTimeIndex = relationship[term1 + "__" + term2].maxTimeIndex;
                    }
                    if (relationship[term1 + "__" + term2].max > a[j].isConnected) {
                        a[j].isConnected = relationship[term1 + "__" + term2].max;
                        a[j].isConnectedmaxTimeIndex = relationship[term1 + "__" + term2].maxTimeIndex;
                    }
                } else if (relationship[term2 + "__" + term1] && relationship[term2 + "__" + term1].max >= Math.round(valueSlider)) {
                    if (relationship[term2 + "__" + term1].max > a[i].isConnected) {
                        a[i].isConnected = relationship[term2 + "__" + term1].max;
                        a[i].isConnectedmaxTimeIndex = relationship[term1 + "__" + term2].maxTimeIndex;
                    }
                    if (relationship[term2 + "__" + term1].max > a[j].isConnected) {
                        a[j].isConnected = relationship[term2 + "__" + term1].max;
                        a[j].isConnectedmaxTimeIndex = relationship[term1 + "__" + term2].maxTimeIndex;
                    }
                }
                //if (term2=="beijing")
                //   console.log(term2+" "+a[j].isConnectedmaxTimeIndex);
            }

        }

    }

    let offsetYStream = 0;
    timeArc.updateDrawData = () => {
        if (force.alpha() === 0) {
            pNodes.forEach(d => {
                getDrawData(d);
            });
            let layerpath = svg.selectAll(".layer")
                .selectAll('path.layerpath')
                .data(d => d.drawData);
            layerpath.call(updatelayerpath);
            layerpath.exit().remove();
            layerpath.enter().append('path')
                .attr('class', 'layerpath')
                .call(updatelayerpath);
        }
    }
    timeArc.currentSelected = function () {
        return termArray;
    }

    function getDrawData(n) {
        if (graphicopt.minMaxStream) {
            n.noneSymetric = true;
            const drawData = [{
                node: n, value: n.monthly.map((d, ti) => {
                    if (data.emptyMap[n.name] && data.emptyMap[n.name][ti] || d.value[1] === undefined)
                        return {...d, value: [undefined, undefined]};
                    return {...d, value: [d.value[1], d.value[2]]};
                }), color: catergogryObject[n.group].upperColor ?? "rgb(252, 141, 89)",
                up: true
            },
                {
                    node: n, value: n.monthly.map((d, ti) => {
                        if (data.emptyMap[n.name] && data.emptyMap[n.name][ti] || d.value[1] === undefined)
                            return {...d, value: [undefined, undefined]}
                        return {...d, value: [d.value[0], d.value[1]]};
                    }), color: "#4682b482",
                    up: false
                }];
            if (data.emptyMap[n.name]) {
                drawData.push({
                        node: n, value: n.monthly.map((d, ti) => {
                            if (!data.emptyMap[n.name][ti] || d.value[1] === undefined)
                                return {...d, value: [undefined, undefined]}
                            return {...d, value: [d.value[1], d.value[2]]};
                        }), color: "rgb(221,221,221)",
                        up: true
                    },
                    {
                        node: n, value: n.monthly.map((d, ti) => {
                            if (!data.emptyMap[n.name][ti] || d.value[1] === undefined)
                                return {...d, value: [undefined, undefined]}
                            return {...d, value: [d.value[0], d.value[1]]};
                        }), color: "rgb(221,221,221)",
                        up: false
                    })
            }
            n.drawData = drawData;
        } else {
            n.noneSymetric = true;
            const drawData = [{
                node: n, value: n.monthly.map((d, ti) => {
                    if (data.emptyMap[n.name] && data.emptyMap[n.name][ti] || d.value[1] === undefined)
                        return {...d, value: [undefined, undefined]}
                    if ((d.value[1] - drawThreshold) > 0) {
                        return {...d, value: [0, d.value[1] - drawThreshold]};
                    }
                    const mon = new Object();
                    mon.value = [0, 0];
                    mon.monthId = d.monthId;
                    mon.yNode = d.y;
                    return mon;
                }), color: catergogryObject[n.group].upperColor ?? "rgb(252, 141, 89)",
                up: true
            },
                {
                    node: n, value: n.monthly.map((d, ti) => {
                        if (data.emptyMap[n.name] && data.emptyMap[n.name][ti] || d.value[1] === undefined)
                            return {...d, value: [undefined, undefined]}
                        if ((d.value[1] - drawThreshold) < 0)
                            return {...d, value: [d.value[1] - drawThreshold, 0]};
                        const mon = new Object();
                        mon.value = [0, 0];
                        mon.monthId = d.monthId;
                        mon.yNode = d.y;
                        return mon;
                    }), color: "#4682b482",
                    up: false
                }];
            if (data.emptyMap[n.name]) {
                drawData.push({
                        node: n, value: n.monthly.map((d, ti) => {
                            if (!data.emptyMap[n.name][ti] || d.value[1] === undefined)
                                return {...d, value: [undefined, undefined]}
                            if ((d.value[1] - drawThreshold) > 0) {
                                return {...d, value: [0, d.value[1] - drawThreshold]};
                            }
                            const mon = new Object();
                            mon.value = [0, 0];
                            mon.monthId = d.monthId;
                            mon.yNode = d.y;
                            return mon;
                        }), color: "rgb(221,221,221)",
                        up: true
                    },
                    {
                        node: n, value: n.monthly.map((d, ti) => {
                            if (!data.emptyMap[n.name][ti] || d.value[1] === undefined)
                                return {...d, value: [undefined, undefined]}
                            if ((d.value[1] - drawThreshold) < 0)
                                return {...d, value: [d.value[1] - drawThreshold, 0]};
                            const mon = new Object();
                            mon.value = [0, 0];
                            mon.monthId = d.monthId;
                            mon.yNode = d.y;
                            return mon;
                        }), color: "rgb(221,221,221)",
                        up: false
                    })
            }
            n.drawData = drawData;
        }
    }

    function computeNodes() {
        Object.keys(class2term).forEach(c => {
            class2term[c].obj = [];
            data.tsnedata[c].current = [];
            class2term[c].active = false;
        });
        // check substrings of 100 first terms
        console.log("termArray.length = " + termArray.length);
        termArray2 = [];
        for (var i = 0; i < termArray.length; i++) {
            // if (termArray[i].isSearchTerm || termArray[i].isConnected > 0)
            // if (class2term[termArray[i].term])
            //     if (!class2term[termArray[i].term].disable)
            //         termArray2.push(termArray[i]);
            // else
            termArray2.push(termArray[i]);
        }
        console.log("termArray2.length = " + termArray2.length);


        termArray2.sort(function (a, b) {
            if (a.max < b.max) {
                return 1;
            }
            if (a.max > b.max) {
                return -1;
            }
            return 0;
            // }
        });
        termArray3 = [];
        for (var i = 0; i < numNode; i++) {
            // if (termArray[i].isSearchTerm || termArray[i].isConnected > 0)
            termArray3.push(termArray2[i]);
        }
        console.log("termArray3.length = " + termArray3.length);


        computeConnectivity(termArray3, termArray3.length);

        nodes = [];
        activeRack = {};
        availableRack = {};
        catergogryList.forEach(d => d.value.current = 0);
        for (var i = 0; i < termArray3.length; i++) {
            var nod = new Object();
            nod.id = i;
            nod.group = termArray3[i].category;
            nod.name = termArray3[i].term;
            nod.max = termArray3[i].max;
            var maxTimeIndexRelationship = termArray3[i].maxTimeIndex;
            nod.isConnectedmaxTimeIndex = termArray3[i].isConnectedmaxTimeIndex;
            nod.maxTimeIndex = termArray3[i].isConnectedmaxTimeIndex;
            nod.month = termArray3[i].isConnectedmaxTimeIndex;
            nod.x = xStep + xScale(nod.month);   // 2016 initialize x position
            nod.y = graphicopt.heightG() / 2;
            if (nodeY_byName[nod.name] != undefined)
                nod.y = nodeY_byName[nod.name];

            if (termArray3[i].isSearchTerm) {
                nod.isSearchTerm = 1;
                if (!nod.month)
                    nod.month = termArray3[i].maxTimeIndex;
                if (!nod.isConnectedmaxTimeIndex)
                    nod.isConnectedmaxTimeIndex = termArray3[i].maxTimeIndex;
            }

            if (!maxCount[nod.group] || nod.max > maxCount[nod.group])
                maxCount[nod.group] = nod.max;
            if (class2term[nod.name]) { // is rack
                class2term[nod.name].classnode = nod;
            } else if (termArray3[i].isConnected >= Math.round(valueSlider))  // Only allow connected items
            {
                if (term2class[nod.name]) {
                    term2class[nod.name].value.obj.push(nod);
                    data.tsnedata[term2class[nod.name].key].current.push(data.tsnedata[nod.name]);
                    catergogryObject[nod.group].current++;
                    availableRack[term2class[nod.name].key] = 1;
                    if (!term2class[nod.name].value.disable) {
                        term2class[nod.name].value.active = true;
                        activeRack[term2class[nod.name].key] = data.tsnedata[term2class[nod.name].key];
                    } else {
                        nodes.push(nod);
                    }

                } else {
                    nodes.push(nod);
                    catergogryObject[nod.group].current++;
                }
            }

        }
        // catergogryObject['rack'].current=Object.keys(availableRack).length;
        // rack calculate
        if (runopt.groupTimeLineMode === 'onDisplay') {
            Object.keys(activeRack).forEach(k => {
                nodes.push(class2term[k].classnode);
                let r = activeRack[k];
                r.length = 0;
                r.current[0].forEach((t, ti) => {
                    r.push(r.current[0][0].map((s, si) => d3.mean(r.current, d => d[ti][si])))
                    r[ti].timestep = ti;
                })
            })
        } else {
            Object.keys(activeRack).forEach(k => {
                nodes.push(class2term[k].classnode);
                let r = activeRack[k];
                r.length = 0;
                if (r.total_s)
                    r.total_s.forEach((v, vi) => r.push((val = v.slice(), val.timestep = vi, val)));
                else {
                    r.total_s = [];
                    r.total[0].forEach((t, ti) => {
                        r.push(r.total[0][0].map((s, si) => d3.mean(r.total, d => d[ti][si])));
                        r[ti].timestep = ti;
                        r.total_s.push(r[ti]);
                    })
                }
            })
        }
        // calculate
        numNode = nodes.length;

        console.log("numNode=" + numNode);


        // compute the monthly data
        termMaxMax2 = 0;

        // for (var i = 0; i < numNode; i++) {
        //     nodes[i].monthly = [];
        //     // if (!data.tsnedata[nodes[i].name]){
        //         let finishStep = 0;
        //         let startStep = 0;
        //         let isStart = false;
        //         let current = 0;
        //         for (var m = 0; m < totalTimeSteps; m++) {
        //
        //             if (terms[nodes[i].name][m]!==undefined) {
        //                 if(!isStart)
        //                     startStep = m;
        //                 isStart = true;
        //                 var mon = new Object();
        //                 mon.value = terms[nodes[i].name][m];
        //                 current = mon.value;
        //                 if (mon.value > termMaxMax2)
        //                     termMaxMax2 = mon.value;
        //                 mon.monthId = m;
        //                 mon.yNode = nodes[i].y;
        //                 nodes[i].monthly.push(mon);
        //                 finishStep= m;
        //             }else if(isStart) {
        //                 var mon = new Object();
        //                 mon.value = null//current;
        //                 mon.monthId = m;
        //                 mon.yNode = nodes[i].y;
        //                 nodes[i].monthly.push(mon);
        //             }
        //         }
        //         nodes[i].monthly = nodes[i].monthly.slice(0,finishStep-startStep+1);
        //         // Add another item to first
        //         if (nodes[i].monthly.length > 0) {
        //             var firstObj = nodes[i].monthly[0];
        //             if (firstObj.monthId > 0) {
        //                 var mon = new Object();
        //                 mon.value = 0;
        //                 mon.monthId = firstObj.monthId - 1;
        //                 mon.yNode = firstObj.yNode;
        //                 nodes[i].monthly.unshift(mon);
        //             }
        //
        //             // Add another item
        //             var lastObj = nodes[i].monthly[nodes[i].monthly.length - 1];
        //             if (lastObj.monthId < totalTimeSteps - 1) {
        //                 var mon = new Object();
        //                 mon.value = 0;
        //                 mon.monthId = lastObj.monthId + 1;
        //                 mon.yNode = lastObj.yNode;
        //                 nodes[i].monthly.push(mon);
        //             }
        //         }
        //         nodes[i].drawData =[{node:nodes[i],value:nodes[i].monthly}];
        //     // }
        // }

        for (var i = 0; i < numNode; i++) {
            const n = nodes[i];
            n.monthly = [];
            if (data.minMaxData[n.name] && data.tsnedata[n.name]) {
                const selected = graphicopt.selectedService;
                data.tsnedata[n.name].forEach((d, ti) => {
                    var mon = new Object();
                    if (data.minMaxData[n.name][ti][1])
                        mon.value = [data.minMaxData[n.name][ti][0][selected], d[selected], data.minMaxData[n.name][ti][1][selected]];
                    else
                        mon.value = [undefined, undefined, undefined]
                    mon.monthId = timeScaleIndex(data.timespan[d.timestep]);
                    mon.yNode = n.y;
                    n.monthly.push(mon);
                });
                // Add another item to first
                if (n.monthly.length > 0) {
                    // Add another item
                    var lastObj = n.monthly[n.monthly.length - 1];
                    if (lastObj.monthId < totalTimeSteps - 1) {
                        n.monthly.push(lastObj);
                    }
                }
            }
            getDrawData(nodes[i])
        }
        // Construct an array of only parent nodes
        pNodes = new Array(numNode); //nodes;
        for (var i = 0; i < numNode; i++) {
            pNodes[i] = nodes[i];
        }

        //   drawStreamTerm(svg, pNodes, 100, 600) ;
        svg.selectAll(".layer").remove();
        svg.select('g.nodeHolder').selectAll(".layer")
            .data(pNodes)
            .enter().append("g")
            .attr("class", "layer")
            .style("stroke", function (d) {
                return "#000";
                // return d.isSearchTerm ? "#000" : "#fff";
            })
            .style("stroke-width", 0.1)
            .style("stroke-opacity", 0.8)
            .style("fill-opacity", 1)
            .style("fill", function (d, i) {
                return getColor(d.group, d.max);
            })
            .on('click', handleFreez)
        // .on('mouseover', mouseovered_Layer)
        // .on("mouseout", mouseouted_Layer);

    }

    function computeLinks() {
        links = [];
        relationshipMaxMax2 = 1;
        for (var i = 0; i < numNode; i++) {
            var term1 = nodes[i].name;
            for (var j = i + 1; j < numNode; j++) {
                var term2 = nodes[j].name;
                if (relationship[term1 + "__" + term2] && relationship[term1 + "__" + term2].max >= Math.round(valueSlider)) {
                    let linkstack = {};
                    let currentLinkstack;
                    for (var m = 0; m < totalTimeSteps; m++) {
                        if (relationship[term1 + "__" + term2][m] && relationship[term1 + "__" + term2][m] >= Math.round(valueSlider)) {
                            var sourceNodeId = i;
                            var targetNodeId = j;

                            if (!nodes[i].connect)
                                nodes[i].connect = new Array();
                            nodes[i].connect.push(j);
                            if (!nodes[j].connect)
                                nodes[j].connect = new Array();
                            nodes[j].connect.push(i);

                            if (m != nodes[i].maxTimeIndex) {
                                if (isContainedChild(nodes[i].childNodes, m) >= 0) {  // already have the child node for that month
                                    sourceNodeId = nodes[i].childNodes[isContainedChild(nodes[i].childNodes, m)];
                                } else {
                                    var nod = new Object();
                                    nod.id = nodes.length;
                                    nod.group = nodes[i].group;
                                    nod.name = nodes[i].name;
                                    nod.max = nodes[i].max;
                                    nod.maxTimeIndex = nodes[i].maxTimeIndex;
                                    nod.month = m;

                                    nod.classNode = term2class[nod.name];
                                    nod.parentNode = i;   // this is the new property to define the parent node
                                    if (!nodes[i].childNodes)
                                        nodes[i].childNodes = new Array();
                                    nodes[i].childNodes.push(nod.id);

                                    sourceNodeId = nod.id;
                                    nodes.push(nod);
                                }
                            }
                            if (m != nodes[j].maxTimeIndex) {
                                if (isContainedChild(nodes[j].childNodes, m) >= 0) {
                                    targetNodeId = nodes[j].childNodes[isContainedChild(nodes[j].childNodes, m)];
                                } else {
                                    var nod = new Object();
                                    nod.id = nodes.length;
                                    nod.group = nodes[j].group;
                                    nod.name = nodes[j].name;
                                    nod.max = nodes[j].max;
                                    nod.maxTimeIndex = nodes[j].maxTimeIndex;
                                    nod.month = m;
                                    nod.classNode = term2class[nod.name];
                                    nod.parentNode = j;   // this is the new property to define the parent node
                                    if (!nodes[j].childNodes)
                                        nodes[j].childNodes = new Array();
                                    nodes[j].childNodes.push(nod.id);

                                    targetNodeId = nod.id;
                                    nodes.push(nod);
                                }
                            }
                            var l = new Object();
                            l.source = sourceNodeId;
                            l.target = targetNodeId;
                            l.__maxLinkIndex__ = Math.max(nodes[i].monthly.findIndex(d => d.monthId >= m), nodes[j].monthly.findIndex(d => d.monthId >= m))

                            l.__timestep__ = m;
                            //l.value = linkScale(relationship[term1+"__"+term2][m]);
                            if (runopt.timeLink) {
                                const ml = Math.floor(timeScaleIndex(runopt.timeLinkformat(timeScaleIndex.invert(m))));
                                if (!linkstack[ml]) {
                                    l.__timestep__ = ml;
                                    l.__totalVal__ = 0;
                                    linkstack[ml] = [];
                                    links.push(l);
                                    currentLinkstack = l;
                                }
                                linkstack[ml].push(m);
                                currentLinkstack.__totalVal__ += relationship[term1 + "__" + term2][m];
                                currentLinkstack.__timestepList__ = linkstack[ml];
                                if (currentLinkstack.__totalVal__ > relationshipMaxMax2) {
                                    relationshipMaxMax2 = currentLinkstack.__totalVal__;
                                }
                            } else {
                                links.push(l);
                                if (relationship[term1 + "__" + term2][m] > relationshipMaxMax2) {
                                    relationshipMaxMax2 = relationship[term1 + "__" + term2][m];
                                }
                            }
                        }
                    }
                }
            }
        }

        // var linear = (150+numNode)/200;
        // var hhh = Math.min(Math.max(graphicopt.height / numNode,20), 30);
        var hhh = graphicopt.height / numNode;
        if (graphicopt.display && graphicopt.display.stream && graphicopt.display.stream.yScale) {
            yScale = graphicopt.display.stream.yScale;
            yUpperScale = yScale;
            yDownerScale = yScale;
        }
        if (graphicopt.display && graphicopt.display.stream && graphicopt.display.stream.yScaleUp && graphicopt.display.stream.yScaleDown) {
            yScale = d3.scaleLinear()
                .range([0, hhh * 0.6])
                .domain([0, termMaxMax2]);
            yUpperScale = graphicopt.display.stream.yScaleUp;
            yDownerScale = graphicopt.display.stream.yScaleDown;
        } else {
            yScale = d3.scaleLinear()
                .range([0, hhh * 0.6])
                .domain([0, termMaxMax2]);
        }
        if (graphicopt.display && graphicopt.display.stream && graphicopt.display.stream.yScale) {
            yScale = graphicopt.display.stream.yScale;
        }
        // linkScale = d3.scaleLinear()
        //     .range([0.5, 2])
        //     .domain([Math.round(valueSlider) - 0.4, Math.max(relationshipMaxMax2, 10)]);

        // FIXME : need to turn this into dynamic
        linkScale = d3.scaleLinear()
            .range([0.5, Math.min(4, relationshipMaxMax2 * 1)])
            .domain([1, relationshipMaxMax2]);
        // .domain([1,15]);
        links.forEach(function (l) {
            var term1 = nodes[l.source].name;
            var term2 = nodes[l.target].name;
            var month = l.__timestep__;

            l.value = linkScale(l.__totalVal__ ? l.__totalVal__ : relationship[term1 + "__" + term2][month]);
            l.message = data2.filter(d => (l.__timestepList__ || [month]).find(e => d.__timestep__ === e)).filter(d => d.__terms__[term1] && d.__terms__[term2]);
        });

        console.log("DONE links relationshipMaxMax2=" + relationshipMaxMax2);

        //Create all the line svgs but without locations yet
        svg.selectAll(".linkArc").remove();

        linkArcs = svg.select("g.linkHolder").selectAll("path")
            .data(links)
            .enter().append("path")
            .attr("class", "linkArc")
            .style("stroke-width", function (d) {
                return d.value;
            })
            .on('click', handleFreez)
            .on('mouseover', mouseovered_Link)
            .on("mouseout", mouseouted_Link);
        if (graphicopt.display && graphicopt.display.links) {
            Object.keys(graphicopt.display.links)
                .forEach(k => linkArcs.style(k, graphicopt.display.links[k]))
        }

        svg.selectAll(".nodeG").remove();
        nodeG = svg.select('g.nodeHolder').selectAll(".nodeG")
            .data(pNodes).enter().append("g")
            .attr("class", "nodeG")
            .attr("transform", function (d) {
                d.nodeTarget = d3.select(this);
                return "translate(" + d.x + "," + d.y + ")"
            });

        /*
       nodeG.append("circle")
           .attr("class", "node")
           .attr("r", function(d) { return Math.sqrt(d.max) })
           .style("fill", function (d) {return getColor(d.group, d.max);})
           .on('dblclick', releasenode)
           .call(node_drag); //Added
       */
        // console.log("  nodes.length="+nodes.length) ;

        svg.selectAll(".nodeText").remove();
        nodeG.append("text")
            .attr("class", "nodeText")
            .attr("dy", ".35em")
            // .attr('fill',d=>d.group==='user'?d3.color(colorCatergory(d.group)).darker(1):'unset')
            // .attr('fill',d=>d.group==='user'?colorCatergory(d.group):'unset')
            .attr('fill', d => getColor(d.group))
            .style("text-anchor", "end")
            .style("text-shadow", "1px 1px 0 rgba(255, 255, 255, 0.6")
            .style('pointer-events', 'all')
            .classed("SearchTerm", d => d.isSearchTerm)
            .attr("dy", ".21em")
            // .attr("font-family", "sans-serif")
            // .attr("font-size", function (d) {
            //     return d.isSearchTerm ? "12px" : "11px";
            // })
            .attr("font-size", '10px')
            .text(function (d) {
                return d.name
            });
        nodeG
            .on('click', handleFreez)
            .on('mouseover', mouseovered_Term)
            .on("mouseout", mouseouted_Term);

        // console.log("gggg**************************"+searchTerm);
        listMonth = [];
        links.forEach(function (l) {
            if (searchTerm != "") {
                if (nodes[l.source].name == searchTerm || nodes[l.target].name == searchTerm) {
                    if (isContainedInteger(listMonth, l.__timestep__) < 0)
                        listMonth.push(l.__timestep__);
                }
            }
        });
        listMonth.sort(function (a, b) {
            if (a > b) {
                return 1;
            } else if (a < b) {
                return -1;
            } else
                return 0;
        });

    }

    function handleFreez() {
        isFreez = !isFreez;
        mouseclick_dispath(isFreez);
    }


    function mouseovered_Term(d) {
        if (!isFreez) {
            if (force.alpha() == 0) {
                var list = new Object();
                list[d.name] = new Object();
                d.messagearr = [];
                svg.selectAll(".linkArc")
                    .style("stroke-opacity", function (l) {
                        let name;
                        if (l.source.name === d.name)
                            name = l.target.name;
                        else if (l.target.name === d.name)
                            name = l.source.name;
                        if (name) {
                            if (!list[name]) {
                                list[name] = new Object();
                                list[name].count = 1;
                                list[name].year = l.__timestep__;
                                list[name].linkcount = l.count;
                                d.messagearr = _.uniq(_.flatten([d.messagearr, l.message]));
                            } else {
                                list[name].count++;
                                // if (l.count > list[name].count) {
                                //     list[name].linkcount = l.count;
                                //     list[name].year = l.__timestep__;
                                d.messagearr = _.uniq(_.flatten([d.messagearr, l.message]));
                                // }
                            }
                            return 1;
                        } else
                            return 0.01;
                    });
                mouseover_dispath([d, d3.keys(list).map(l => {
                    let cat = termArray3.find(t => t.term === l).category;
                    return {color: getColor(cat), text: l, group: cat}
                })]);
                nodeG.style("fill-opacity", function (n) {
                    if (list[n.name])
                        return 1;
                    else
                        return 0.1;
                })
                    .style("font-weight", function (n) {
                        return d.name == n.name ? "bold" : "";
                    })
                ;

                nodeG.transition().duration(500).attr("transform", function (n) {
                    if (list[n.name] && n.name != d.name) {
                        var newX = xStep + xScale(list[n.name].year);
                        return "translate(" + newX + "," + n.y + ")"
                    } else {
                        return "translate(" + n.xConnected + "," + n.y + ")"
                    }
                })
                svg.selectAll(".layer")
                    .style("fill-opacity", function (n) {
                        if (list[n.name])
                            return 1;
                        else
                            return 0.1;
                    })
                    .style("stroke-opacity", function (n) {
                        if (list[n.name])
                            return 1;
                        else
                            return 0;
                    });
            }
        }
    }

    function mouseouted_Term(d) {
        if (!isFreez) {
            if (force.alpha() == 0) {
                nodeG.style("fill-opacity", 1);
                svg.selectAll(".layer")
                    .style("fill-opacity", 1)
                    .style("stroke-opacity", 0.5);
                linkArcs.style("stroke-opacity", 1);
                if (graphicopt.display && graphicopt.display.links) {
                    Object.keys(graphicopt.display.links)
                        .forEach(k => linkArcs.style(k, graphicopt.display.links[k]))
                }
                nodeG.transition().duration(500).attr("transform", function (n) {
                    return "translate(" + n.xConnected + "," + n.y + ")"
                })
            }
            mouseout_dispath(d);
        }
    }

    function mouseovered_Link(d) {
        if (!isFreez) {
            if (force.alpha() == 0) {
                d.messagearr = d.message;
                d3.select(this).style("stroke-opacity", 1);
                svg.selectAll(".linkArc").filter(e => e !== d)
                    .style("stroke-opacity", 0.01);
                nodeG.filter(n => n.name !== d.target.name && n.name !== d.source.name).style("fill-opacity", 0.1)
                    .style("font-weight", '').transition().duration(500).attr("transform", function (n) {
                    return "translate(" + n.xConnected + "," + n.y + ")"
                });
                nodeG.filter(n => n.name === d.target.name || n.name === d.source.name).style("fill-opacity", 1)
                    .style("font-weight", 'bold')
                    .transition().transition().duration(500).attr("transform", function (n) {
                    var newX = xStep + xScale(d.__timestep__);
                    return "translate(" + newX + "," + n.y + ")"
                });
                svg.selectAll(".layer").filter(n => n.name !== d.target.name && n.name !== d.source.name)
                    .style("fill-opacity", 0.1)
                    .style("stroke-opacity", 0);
                svg.selectAll(".layer").filter(n => n.name === d.target.name || n.name === d.source.name).style("fill-opacity", 1)
                    .style("stroke-opacity", 1);
                let cat_source = termArray3.find(t => t.term === d.source.name).category;
                let cat_target = termArray3.find(t => t.term === d.target.name).category;
                mouseover_dispath([d, [{
                    color: getColor(cat_source),
                    text: d.source.name,
                    group: cat_source
                }, {color: getColor(cat_target), text: d.target.name, group: cat_target}]]);
            }
        }
    }

    function mouseouted_Link(d) {
        if (!isFreez) {
            if (force.alpha() == 0) {
                nodeG.style("fill-opacity", 1);
                svg.selectAll(".layer")
                    .style("fill-opacity", 1)
                    .style("stroke-opacity", 0.5);
                linkArcs.style("stroke-opacity", 1);
                if (graphicopt.display && graphicopt.display.links) {
                    Object.keys(graphicopt.display.links)
                        .forEach(k => linkArcs.style(k, graphicopt.display.links[k]))
                }
                nodeG.transition().duration(500).attr("transform", function (n) {
                    return "translate(" + n.xConnected + "," + n.y + ")"
                })
            }
            mouseout_dispath(d);
        }
    }

    let isFreez = false;

    function mouseovered_Layer(d) {
        if (force.alpha() === 0 && !isFreez) {
            nodeG.style("fill-opacity", 0.1);
            nodeG.filter(n => n.name === d.name).style("fill-opacity", 1);
            svg.selectAll(".layer")
                .style("fill-opacity", 0.1)
                .style("stroke-opacity", 0);
            svg.selectAll(".layer").filter(n => n.name === d.name)
                .style("fill-opacity", 1)
                .style("stroke-opacity", 0.5);
            svg.selectAll(".linkArc")
                .style("stroke-opacity", 0.1);
            d.messagearr = data.filter(m => m.__terms__[d.name]);
            mouseover_dispath([d, [{color: getColor(d.group), text: d.name, group: d.group}]]);
        }
    }

    function mouseouted_Layer(d) {
        if (!isFreez) {
            if (force.alpha() == 0) {
                nodeG.style("fill-opacity", 1);
                svg.selectAll(".layer")
                    .style("fill-opacity", 1)
                    .style("stroke-opacity", 0.5);
                linkArcs.style("stroke-opacity", 1);
                if (graphicopt.display && graphicopt.display.links) {
                    Object.keys(graphicopt.display.links)
                        .forEach(k => linkArcs.style(k, graphicopt.display.links[k]))
                }
            }
            mouseout_dispath(d);
        }
    }

    function searchNode(value) {
        searchTerm = value;
        valueSlider = 1;
        if (searchTerm === '')
            valueSlider = 10;
        slider.call(brush.move, [0, valueSlider].map(xScaleSlider));
        svg.select('.sliderText').html(`${graphicopt.preLinkText}  ${'\u2265'} <tspan> ${Math.round(valueSlider)} </tspan> ${graphicopt.postLinkText}`);
        recompute();
    }


    // check if a node for a month m already exist.
    function isContainedChild(a, m) {
        if (a) {
            for (var i = 0; i < a.length; i++) {
                var index = a[i];
                if (nodes[index].month == m)
                    return i;
            }
        }
        return -1;
    }

    // check if a node for a month m already exist.
    function isContainedInteger(a, m) {
        if (a) {
            for (var i = 0; i < a.length; i++) {
                if (a[i] == m)
                    return i;
            }
        }
        return -1;
    }

    function linkArc(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy) / 2;
        if (d.source.y < d.target.y)
            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        else
            return "M" + d.target.x + "," + d.target.y + "A" + dr + "," + dr + " 0 0,1 " + d.source.x + "," + d.source.y;
    }

    timeArc.update = (isforce) => {
        if (force.alpha() !== 0) {
            let marker;
            nodes.forEach(function (d, i) {
                // d.x += (graphicopt.widthG() / 2 - d.x || 0) * 0.05;
                if (d.parentNode >= 0) {
                    d.y += (nodes[d.parentNode].y - d.y || 0) * 0.2;
                    // d.y = nodes[d.parentNode].y;
                } else if (d.childNodes) {
                    var yy = 0;
                    for (var i = 0; i < d.childNodes.length; i++) {
                        var child = d.childNodes[i];
                        yy += nodes[child].y;
                    }
                    if (d.childNodes.length > 0) {
                        yy = yy / d.childNodes.length; // average y coordinate
                        d.y += (yy - d.y) * 0.5;
                    }
                }

                if (runopt.termGroup[d.name]) {
                    if (marker)
                        d.y = marker
                    else
                        marker = d.y
                }
            });

            nodeG.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")"
            })
            linkArcs.style("stroke-width", function (d) {
                return d.value;
            });
            linkArcs.attr("d", linkArc);
        }
        if (!isforce) {
            let layerpath = svg.selectAll(".layer")
                .selectAll('path.layerpath')
                .data(d => d.drawData);
            layerpath.call(updatelayerpath);
            layerpath.exit().remove();
            layerpath.enter().append('path')
                .attr('class', 'layerpath')
                .call(updatelayerpath);
            // linkArcs.attr("d", linkArc);
        }
        // if (force.alpha()<0.03)
        //     force.stop();

        // updateTimeLegend();
    }

    function updatelayerpath(p) {
        return p
            .style('fill', d => d.color || 'unset')
            .attr("d", function (d) {
                for (var i = 0; i < d.value.length; i++) {
                    d.value[i].yNode = d.node.y;     // Copy node y coordinate
                }
                if (d.node.noneSymetric) {
                    if (graphicopt.minMaxStream)
                        return area_compute(d.value);
                    else
                        return d.up ? area_compute_up(d.value) : area_compute_down(d.value);
                }
                return area([d.value[0], ...d.value, d.value[d.value.length - 1]]);
            });
    }

    function updateTransition(durationTime) {
        nodes.forEach(function (d) {
            d.x = xStep + xScale(d.month);
            if (d.parentNode >= 0) {
                d.y = nodes[d.parentNode].y;
            }
            nodeY_byName[d.name] = d.y;
        });

        nodeG.transition().duration(durationTime).attr("transform", function (d) {
            d.xConnected = xStep + xScale(d.isConnectedmaxTimeIndex);
            return "translate(" + d.xConnected + "," + d.y + ")"
        })

        let layerpath = svg.selectAll(".layer")
            .selectAll('path.layerpath')
            .data(d => d.drawData);
        layerpath.transition().duration(durationTime).call(updatelayerpath);
        layerpath.exit().remove();
        layerpath.enter().append('path')
            .attr('class', 'layerpath')
            .call(updatelayerpath);

        linkArcs.transition().duration(250).attr("d", linkArc);
        updateTimeLegend();
        updateTimeBox(durationTime);
    }

    let maxheight;

    function adjustStreamheight() {
// var step = Math.min((graphicopt.heightG() - 25) / (numNode + 1), 15);

        const customNode = runopt.termGroup ? d3.keys(runopt.termGroup).length + numNode : numNode;
        if (graphicopt.fixscreence)
            step = (maxheight - 25) / (customNode + 1);
        else {
            // step = Math.min(Math.max((maxheight - 25) / (customNode + 1), minYdis),minYdis*2);
            step = minYdis;
            if (numNode > 10)
                graphicopt.height = customNode * step + 20 + graphicopt.margin.top + graphicopt.margin.bottom;
            else {
                graphicopt.height = 10 * step + 20 + graphicopt.margin.top + graphicopt.margin.bottom;
                if (numNode)
                    step = (step * 10 - 20) / customNode;
            }
        }
        // adjust grid
        timeLegend.selectAll(".timeLegendLine")
            .attr("y2", function (d) {
                return graphicopt.height;
            });
        // console.log('step: ',step)
        if (graphicopt.min_height) {
            graphicopt.height = Math.max(graphicopt.height, graphicopt.min_height + graphicopt.margin.top + graphicopt.margin.bottom);
        }
        // svg.attr('height', graphicopt.height);
        svg.attr('height', Math.max(maxheight, graphicopt.height));
        //var totalH = termArray.length*step;
        offsetYStream = step;
        return {step, step};
    }

    let step;

    function detactTimeSeries() {
        updateProcess({percentage: 99, text: 'TimeArc: detact TimeSeries'});
        // document.getElementById('progBar').value = 100;
        // $('#progUpdate').empty().append("Done");
        // console.log("DetactTimeSeries ************************************" +data);
        var termArray = [];
        var markedTerm = Object.keys(runopt.termGroup)[0];
        var markedy = undefined;
        var markedCollectionIndex = [];
        console.log(markedTerm)
        for (var i = 0; i < numNode; i++) {
            var e = {};
            if (markedTerm && runopt.termGroup[nodes[i].name]) {
                if (markedy === undefined)
                    markedy = nodes[i].y;
                else
                    markedCollectionIndex.push(i);
                e.customorder = runopt.termGroup[nodes[i].name];
            }
            e.y = nodes[i].y;
            e.nodeId = i;
            termArray.push(e);
        }
        markedCollectionIndex.forEach(i => {
            termArray[i].y = markedy;
        });
        termArray.sort(function (a, b) {
            if (a.customorder && b.customorder)
                return a.customorder - b.customorder;
            return a.y - b.y;
        });

        adjustStreamheight();
        let count = 0
        for (var i = 0; i < termArray.length; i++) {
            let currentNode = nodes[termArray[i].nodeId];
            if (graphicopt.display && graphicopt.display.customTerms && graphicopt.display.customTerms[currentNode.name]) {
                const customSetting = graphicopt.display.customTerms[currentNode.name];
                Object.keys(customSetting).forEach(e => currentNode[e] = _.isFunction(customSetting[e]) ? customSetting[e](currentNode, nodes) : customSetting[e])
            }
            if (runopt.termGroup[currentNode.name])
                count += 0.5
            currentNode.y = offsetYStream + 20 + count * step;
            count++;
            if (runopt.termGroup[currentNode.name])
                count += 0.5
        }
        force.alpha(0);
        force.stop();
        updateTransition(1000);
        updateProcess();
    }

    timeArc.searchNode = searchNode;

    timeArc.svg = function (_) {
        return arguments.length ? (svg = _, timeArc) : svg;

    };
    timeArc.summary = () => summary
    timeArc.totalTimeSteps = totalTimeSteps

    timeArc.stickyTerms = function (_) {
        return arguments.length ? (runopt.stickyTerms = _, timeArc) : runopt.stickyTerms;
    };

    timeArc.termGroup = function (_) {
        return arguments.length ? (runopt.termGroup = _, timeArc) : runopt.termGroup;
    };

    timeArc.drawThreshold = function (_) {
        return arguments.length ? (drawThreshold = _, timeArc.updateDrawData(), timeArc) : drawThreshold;
    };

    timeArc.classMap = function (_) {
        return arguments.length ? (handleclassMap(_), timeArc) : class2term;
    }

    timeArc.data = function (_) {
        return arguments.length ? (handledata(_), timeArc) : arr;
    };
    timeArc.termArray3 = function (_) {
        return arguments.length ? (timeArc) : termArray3;

    };
    timeArc.runopt = function (_) {
        if (arguments.length) {
            for (var i in _) {
                if ('undefined' !== typeof _[i]) {
                    runopt[i] = _[i];
                }
            }
            updateTimeScale();
            return timeArc
        } else
            return runopt;

    };
    timeArc.dispatch = function (_) {
        return arguments.length ? (returnEvent = _, timeArc) : returnEvent;
    };
    timeArc.mouseover = function (_) {
        return arguments.length ? (mouseover_dispath = _, timeArc) : mouseover_dispath;
    };
    timeArc.mouseclick = function (_) {
        return arguments.length ? (mouseclick_dispath = _, timeArc) : mouseclick_dispath;
    };
    timeArc.mouseout = function (_) {
        return arguments.length ? (mouseout_dispath = _, timeArc) : mouseout_dispath;
    };
    // timeArc.mouseoverTerm = function (_) {
    //     return arguments.length ? (mouseoverTerm = _, timeArc) : mouseoverTerm;
    // };
    // timeArc.mouseoutTerm = function (_) {
    //     return arguments.length ? (mouseoutTerm = _, timeArc) : mouseoutTerm;
    // };
    // timeArc.mouseover_dispath = function (_) {
    //     return arguments.length ? (mouseover_dispath = _, timeArc) : mouseover_dispath;
    // };
    // timeArc.mouseout_dispath = function (_) {
    //     return arguments.length ? (mouseout_dispath = _, timeArc) : mouseout_dispath;
    // };
    timeArc.catergogryList = function (_) {
        return arguments.length ? (catergogryList = _, catergogryObject = {}, summary = {}, catergogryList.forEach(c => {
            catergogryObject[c.key] = c.value;
            summary[c.key] = 0
        }), timeArc) : catergogryList;
    };
    timeArc.drawColorLegend = function (_) {
        return arguments.length ? (drawColorLegend = _, timeArc) : drawColorLegend;
    };
    timeArc.firstLink = function (node, nodes) {
        return d3.min(node.childNodes.map(d => nodes[d].month))
    };
    timeArc.graphicopt = function (_) {
        if (arguments.length) {
            const changeService = (_.selectedService !== graphicopt.selectedService);
            for (var i in _) {
                if ('undefined' !== typeof _[i]) {
                    graphicopt[i] = _[i];
                }
            }
            if (_.display && _.display.stream && _.display.stream.yScaleUp && _.display.stream.yScaleDown) {
                yUpperScale = graphicopt.display.stream.yScaleUp;
                yDownerScale = graphicopt.display.stream.yScaleDown;
            }
            if (changeService && pNodes) {
                pNodes.forEach(n => {
                    n.monthly = [];
                    if (data.minMaxData[n.name] && data.tsnedata[n.name]) {
                        const selected = graphicopt.selectedService;
                        data.tsnedata[n.name].forEach((d, ti) => {
                            var mon = new Object();
                            if (data.minMaxData[n.name][ti][1])
                                mon.value = [data.minMaxData[n.name][ti][0][selected], d[selected], data.minMaxData[n.name][ti][1][selected]];
                            else
                                mon.value = [undefined, undefined, undefined]
                            mon.monthId = timeScaleIndex(data.timespan[d.timestep]);
                            mon.yNode = n.y;
                            n.monthly.push(mon);
                        });
                        // Add another item to first
                        if (n.monthly.length > 0) {
                            // Add another item
                            var lastObj = n.monthly[n.monthly.length - 1];
                            if (lastObj.monthId < totalTimeSteps - 1) {
                                n.monthly.push(lastObj);
                            }
                        }
                    }
                });
            }
            return timeArc
        } else
            return graphicopt;
    };


    //<editor-fold decs = funcs>
    var diameter = 1000,
        radius = diameter / 2,
        innerRadius = radius - 120;
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    // Add color legend
    let drawColorLegend = _drawColorLegend;

    function _drawColorLegend() {
        var xx = 10;
        // var y1 = 20;
        // var y2 = 34;
        // var y3 = 48;
        // var y4 = 62;

        var rr = 6;
        var yoffset = ySlider + 60;
        let yscale = d3.scaleLinear().range([yoffset + 13, yoffset + 30]);
        if (catergogryList && (catergogryList.length > 1) && svg.select('.colorlegendtext').empty())
            svg.append('text').text('Color legend: ')
                .attr('class', 'colorlegendtext legendText')
                .attr('x', xx)
                .attr('y', yoffset);

        let legendg_o = svg.selectAll('g.nodeLegend')
            .data(catergogryList);
        legendg_o.exit().remove();
        const legendg = legendg_o.enter()
            .append('g')
            .attr('class', 'nodeLegend')
            .attr('transform', (d, i) => 'translate(' + xx + ',' + yscale(i) + ')')
            .on('click', onclickcategory);

        legendg.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", rr)
            .style("fill", d => getColor(d.key));

        legendg.append("text")
            .attr("x", xx + 10)
            .attr("y", 0)
            .attr("dy", ".21em")
            .style("text-anchor", "left")
            .style("fill", d => getColor(d.key));

        legendg.merge(legendg_o).select('text')
            .text(d => `${d.value.text || d.key} (${d.value.current !== undefined ? `showing ${d.value.current}/` : ''}${summary[d.key]})`);
    }

    function onclickcategory(d) {
        if (d.disable) {
            d.disable = false;
        } else {
            d.disable = true;
        }
        d3.select(this).classed('fade', d.disable);
        recompute();
    }

    function removeColorLegend() {
        svg.selectAll(".nodeLegend").remove();
    }

    let timeLegend;

    function drawTimeLegend() {
        let major = {};
        timeScaleIndex.ticks(d3['time' + timeUnitMaster].every(runopt.time.rate)).forEach(d => major[multiFormat(d)] = 1);
        listX = timeScaleIndex.ticks(runopt.timeformat).map((t, i) => {
                return {
                    x: xStep + xScale(i),
                    year: t,
                    major: major[multiFormat(t)]
                }
            }
        );

        timeLegend = svg.select('.timeLegend');
        if (timeLegend.empty()) {
            timeLegend = svg.append('g').attr('class', 'timeLegend');
            timeLegend.append('g').attr('class', 'timebrush');
        }

        timeLegend.selectAll(".timeLegendLine").data(listX)
            .enter().append("line")
            .attr("class", "timeLegendLine notselectable")
            .style("stroke", "000")
            .style("stroke-dasharray", "1, 2")
            .style("stroke-opacity", 1)
            .style("stroke-width", 0.2)
            .attr("x1", function (d) {
                return d.x;
            })
            .attr("x2", function (d) {
                return d.x;
            })
            .attr("y1", function (d) {
                return 0;
            })
            .attr("y2", function (d) {
                return graphicopt.heightG();
            });
        timeLegend.selectAll(".timeLegendText").data(listX)
            .enter().append("text")
            .attr("class", "timeLegendText notselectable fontBigger")
            .style("fill", "#000000")
            .style("text-anchor", "start")
            .style("text-shadow", "1px 1px 0 rgba(255, 255, 255, 0.6")
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d, i) {
                if (isMainGrid(d))
                    return 12;
                else
                    return 17;
            })
            .attr("dy", ".21em")
            // .attr("font-family", "sans-serif")
            // .attr("font-size", "12px")
            .text(function (d, i) {
                if (isMainGrid(d))
                    return multiFormat(d.year);
                else
                    return formatTimeUlti[runopt.time.unit](d.year);
            });
    }

    let listX;

    function isMainGrid(d) {
        // // let condition  = multiFormatUnit(d.year) == timeUnitMaster;
        // let condition  = multiFormat(d.year) !== formatTimeUlti[runopt.time.unit](d.year);
        // // console.log(timeUnitMaster)
        // if (timeUnitMaster)
        //     condition = condition && multiFormat(d.year)===formatTimeUlti[timeUnitMaster](d.year)
        // return condition;
        return d.major;
    }

    function updateTimeLegend() {
        console.log("updateTimeLegend");
        let major = {};
        timeScaleIndex.ticks(d3['time' + timeUnitMaster].every(runopt.time.rate)).forEach(d => major[multiFormat(d)] = 1);
        listX = timeScaleIndex.ticks(runopt.timeformat).map((t, i) => {
                return {
                    x: xStep + xScale(i),
                    year: t,
                    major: major[multiFormat(t)]
                }
            }
        );
        timeLegend.selectAll(".timeLegendLine").data(listX).transition().duration(250)
            .style("stroke-dasharray", function (d, i) {
                if (!isLensing)
                    return "1, 2";
                else
                    return (formatTimeUlti[runopt.time.unit](d.year) < d.year) ? "2, 1" : "1, 3"
            })
            .style("stroke-opacity", function (d, i) {
                if (isMainGrid(d))
                    return 1;
                else {
                    if (isLensing && lMonth - lensingMul <= i && i <= lMonth + lensingMul) {
                        return 1;
                    } else
                        return 0;
                }
            })
            .attr("x1", function (d) {
                return d.x;
            })
            .attr("x2", function (d) {
                return d.x;
            });
        timeLegend.selectAll(".timeLegendText").data(listX).transition().duration(250)
            .style("fill-opacity", function (d, i) {
                if (isMainGrid(d))
                    return 1;
                else {
                    if (isLensing && lMonth - lensingMul <= i && i <= lMonth + lensingMul)
                        return 1;
                    else
                        return 0;
                }
            })
            .attr("x", function (d, i) {
                return d.x;
            });
    }

    function drawTimeBox() {

        const timeLegendbox = timeLegend.select('g.timebrush');
        timeLegendbox.append("rect")
            .attr("class", "timeBox")
            // .style("fill", "#aaa")
            // .style("fill-opacity", 0.2)
            .attr("x", xStep)
            // .attr("y", graphicopt.heightG()-25)
            .attr("width", XGAP_ * listX.length)
            .attr("height", 17)
            .on("mouseout", function () {
                // isLensing = false;
                coordinate = d3.mouse(this);
                lMonth = Math.floor((coordinate[0] - xStep) / XGAP_);
                if (isLensing)
                    updateTransition(250);
            })
            .on("mousemove", function () {
                // isLensing = true;
                coordinate = d3.mouse(this);
                lMonth = Math.floor((coordinate[0] - xStep) / XGAP_);
                if (isLensing)
                    updateTransition(250);
            });
    }

    function updateTimeBox(durationTime) {
        var maxY = 0;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].y > maxY)
                maxY = nodes[i].y;
        }
        // timeLegend.selectAll(".timeBox").transition().duration(durationTime)
        //     .attr("y", maxY+12);
        timeLegend.selectAll(".timeLegendText").transition().duration(durationTime)
            .style("fill-opacity", function (d, i) {
                if (isMainGrid(d))
                    return 1;
                else {
                    // if (isLensing && lMonth-lensingMul<=i && i<=lMonth+lensingMul)
                    if (isLensing && lMonth == i)
                        return 1;
                    else
                        return 0;
                }
            })
            // .attr("y", function(d,i) {
            //     if (isMainGrid(d))
            //         return maxY+21;
            //     else
            //         return maxY+21;
            // })
            .attr("x", function (d, i) {
                return d.x;
            });
    }

    function drawClassCollection(yoffset, xoffset) {
        let classHolderg = d3.select('#rackCollection')
            .style('left', `${xoffset}px`)
            .style('top', `${yoffset}px`);
        let classdata = d3.entries(class2term);
        console.log(classdata)
        let classg = classHolderg
            .selectAll('li.className').data(classdata);
        classg.call(updateClassg);
        classg.exit().remove();
        let classNewg = classg.enter()
            .append('li')
            .attr('class', 'className');
        const header = classNewg.append('div').attr('class', 'collapsible-header');
        header.append('span');
        header.append('i').attr('class', 'material-icons expand').text('chevron_right');
        classNewg.append('ul').attr('class', 'collapsible-body');
        classNewg.call(updateClassg)


        M.Collapsible.init(classHolderg.node(), {
            accordion: false,
            onOpenStart: function (evt) {
                d3.select(evt).datum().value.disable = true;
                recompute();
            },
            onCloseStart: function (evt) {
                d3.select(evt).datum().value.disable = false;
                recompute();
            }
        });
        return yoffset;

        function updateClassg(p) {
            p.classed('active', d => d.value.disable);
            p.select('div.collapsible-header').select('span').text(d => `${d.key} (${d.value.obj.length}/${d.value.length})`);
            const span = p.select('.collapsible-body')
                .selectAll('li.classElement')
                .data(d => d.value.obj.sort((a, b) => d3.ascending(a.name, b.name))).text(d => d.name);
            span.exit().remove();
            span.enter().append('li')
                .text(d => d.name)
                .attr('class', 'classElement')
                .on('mouseover', function (d) {
                    d3.select(this).style('font-weight', 'bold');
                    nodes.find(e => e.id === d.id).nodeTarget.dispatch('mouseover')
                })
                .on('mouseout', function (d) {
                    d3.select(this).style('font-weight', null)
                    nodes.find(e => e.id === d.id).nodeTarget.dispatch('mouseout')
                });

        }
    }

    function drawStreamLegend() {
        drawColorLegend();
        // let yoffset = ySlider+60+90;
        // let yStreamoffset = 20;
        // let xoffset = xSlider;
        // let ticknum = 3;
        // let xScale = d3.scaleLinear().domain([0,1]).range([0,widthSlider]);
        // console.log("drawStreamLegend");
        // var area_min = d3.area()
        //     .curve(d3.curveCardinalOpen)
        //     .x(function (d,i) {
        //         return xScale(d.x);
        //     })
        //     .y0(function (d) {
        //         return yStreamoffset - yScale(d.y);
        //     })
        //     .y1(function (d) {
        //         return yStreamoffset + yScale(d.y);
        //     });
        //
        // // let measagelegendg = svg.select('g.measagelegendg');
        // // if (measagelegendg.empty()) {
        // //     measagelegendg = svg.append('g').attr('class', 'measagelegendg').attr('transform', `translate(${xoffset},${yoffset})`);
        // //     measagelegendg
        // //         .selectAll('text').data(Object.keys(summary).map(k=>({current:nodes[k+'Num'],type:k+'s',total:summary[k]})))
        // //         .enter()
        // //         .append('text')
        // //         .attr('y',(d,i)=>i*20).html(d=>`<tspan>${d.current}</tspan>/${d.total} ${d.type}`);
        // // }
        // // measagelegendg.selectAll('text').data(Object.keys(summary).map(k=>({current:nodes[k+'Num'],type:k+'s',total:summary[k]})))
        // //     .html(d=>`<tspan>${d.current}</tspan>/${d.total} ${d.type}`);
        // // yoffset += 60;
        // let streamlegendg = svg.select('g.streamlegendg');
        // if (streamlegendg.empty()) {
        //     streamlegendg = svg.append('g').attr('class', 'streamlegendg').attr('transform', `translate(${xoffset},${yoffset})`);
        //     streamlegendg.append('text').attr('class','legendText')
        // }
        // streamlegendg.select('text.legendText').text(`Stream height (by ${graphicopt.userStreamMode}):`);
        // let streampath = streamlegendg.select('path.pathlegend');
        // if (streampath.empty())
        //     streampath = streamlegendg.append('path')
        //         .attr('class','pathlegend');
        //
        // // let subscale = yScale.copy().domain([0,ticknum/2]).range(yScale.domain().map((d,i)=>i?d/2:d));
        // let subscale = yScale.copy().domain([0,2]).range(yScale.domain().map((d,i)=>i?d/2:d));
        // let streamdata = [{x:0,y:0}];
        //
        // d3.range(1,ticknum*4+2).forEach(d=>streamdata.push(d%4===0?{x:d/(ticknum*4),y:subscale(Math.ceil(d/4)+1),tick:true}:{x:d/(ticknum*4),y:subscale(Math.random()*1.5)}));
        //
        // streamdata.push({x:1,y:0});
        // streampath.datum(streamdata).attr('d',area_min).style('fill',colorCatergory('user'));
        //
        // let lineold = streamlegendg.selectAll('line.arrow').data(streamdata.filter(d=>d.tick));
        // lineold.exit().remove();
        // lineold.enter().append('line').attr('class','arrow')
        //     .merge(lineold)
        //     .attrs({
        //         "marker-start":"url(#arrowHeadstart)",
        //         "marker-end":"url(#arrowHeadend)",
        //         "x1":d=>xScale(d.x),
        //         "y1":d=>yStreamoffset - yScale(d.y)+2,
        //         "x2":d=>xScale(d.x),
        //         "y2":d=>yStreamoffset +yScale(d.y)-2
        //     }).styles({
        //     'stroke-width':1,
        //     'stroke': '#000'
        // });
        // let textold =streamlegendg.selectAll('text.tick').data(streamdata.filter(d=>d.tick));
        // textold.exit().remove();
        // textold.enter().append('text').attr('class','tick')
        //     .merge(textold)
        //     .attrs({
        //         "text-anchor":'start',
        //         "x":d=>xScale(d.x),
        //         "y":d=>yStreamoffset +yScale(0),
        //         "dy":'0.25rem',
        //         "dx":'2px',
        //     }).style('text-shadow', 'rgba(255, 255, 255, 0.6) 1px 1px 0px').text(d=>Math.round(d.y));
        //
        // yoffset += yStreamoffset + step*2+20;
        // // yoffset = drawClassCollection(yoffset, xoffset);
    }

    var buttonLensingWidth = 80;
    var buttonheight = 15;
    var roundConner = 4;
    var colorHighlight = "#fc8";
    var buttonColor = "#ddd";

    function drawLensingButton() {
        d3.select('#lensingbtn')
            .on('click', turnLensing);
    }

    function turnLensing() {
        isLensing = !isLensing;
        svg.selectAll('.lensingRect')
            .style("stroke-width", function () {
                return isLensing ? 1 : 0.1;
            });
        svg.selectAll('.lensingText')
            .style("font-weight", function () {
                return isLensing ? "bold" : "";
            });
        svg.append('rect')
            .attr("class", "lensingRect")
            .style("fill-opacity", 0)
            .attr("x", xStep)
            .attr("y", 0)
            .attr("width", graphicopt.widthG())
            .attr("height", graphicopt.heightG())
            .on('mousemove', function () {
                coordinate = d3.mouse(this);
                lMonth = Math.floor((coordinate[0] - xStep) / XGAP_);
                updateTransition(250);
                updateTimeLegend();
            });
        updateTransition(250);
        updateTimeLegend();
    }

    // let colorCatergory = d3.scaleOrdinal(d3.schemeCategory10);
    let colorCatergory = d3.scaleOrdinal().range(["#080", "steelblue", "#828282"]);

    function getColor(category, count) {
        if (catergogryObject[category].customcolor)
            return catergogryObject[category].customcolor;
        return colorCatergory(category)

    }

    function colorFaded(d) {
        var minSat = 80;
        var maxSat = 230;
        var step = (maxSat - minSat) / maxDepth;
        var sat = Math.round(maxSat - d.depth * step);

        //console.log("maxDepth = "+maxDepth+"  sat="+sat+" d.depth = "+d.depth+" step="+step);
        return d._children ? "rgb(" + sat + ", " + sat + ", " + sat + ")"  // collapsed package
            : d.children ? "rgb(" + sat + ", " + sat + ", " + sat + ")" // expanded package
                : "#aaaacc"; // leaf node
    }


    function getBranchingAngle1(radius3, numChild) {
        if (numChild <= 2) {
            return Math.pow(radius3, 2);
        } else
            return Math.pow(radius3, 1);
    }

    function getRadius(d) {
        // console.log("scaleCircle = "+scaleCircle +" scaleRadius="+scaleRadius);
        return d._children ? scaleCircle * Math.pow(d.childCount1, scaleRadius)// collapsed package
            : d.children ? scaleCircle * Math.pow(d.childCount1, scaleRadius) // expanded package
                : scaleCircle;
        // : 1; // leaf node
    }


    function childCount1(level, n) {
        count = 0;
        if (n.children && n.children.length > 0) {
            count += n.children.length;
            n.children.forEach(function (d) {
                count += childCount1(level + 1, d);
            });
            n.childCount1 = count;
        } else {
            n.childCount1 = 0;
        }
        return count;
    };

    function childCount2(level, n) {
        var arr = [];
        if (n.children && n.children.length > 0) {
            n.children.forEach(function (d) {
                arr.push(d);
            });
        }
        arr.sort(function (a, b) {
            return parseFloat(a.childCount1) - parseFloat(b.childCount1)
        });
        var arr2 = [];
        arr.forEach(function (d, i) {
            d.order1 = i;
            arr2.splice(arr2.length / 2, 0, d);
        });
        arr2.forEach(function (d, i) {
            d.order2 = i;
            childCount2(level + 1, d);
            d.idDFS = nodeDFSCount++;   // this set DFS id for nodes
        });

    };

    d3.select(self.frameElement).style("height", diameter + "px");
    // /===============================================
    var brush;
    var slider;
    var handle;
    var xScaleSlider;
    var xSlider = 10;
    var widthSlider = 180;
    var ySlider = 30;
    var valueSlider = 0;
    var valueMax = 11;

    function setupSliderScale(svg) {
        xScaleSlider = d3.scaleLinear()
            .domain([0, valueMax])
            .range([0, widthSlider]);

        brush = d3.brushX(xScaleSlider)
            .extent([[0, -5], [widthSlider, 5]])
            .on("brush", brushed)
            .on("end", brushend);

        let grang = svg.select('g.slider_range');

        let axisl = grang.select("g.x.axis");
        slider = grang.select("g.slider");
        if (grang.empty()) {
            grang = svg.append('g')
                .attr('class', 'slider_range')
                .attr('transform', "translate(" + xSlider + "," + ySlider + ")")

            axisl = grang.append("g")
                .attr("class", "x axis fontSmaller");
            grang.append("text")
                .attr("class", "sliderlabel legendText")
                .attr("y", -14)
                .attr("dy", ".21em")
                .text('Filter links:')
                .style("text-anchor", "start");
            grang.append("text")
                .attr("class", "sliderText fontSmaller")
                .attr("y", 26)
                .attr("dy", ".21em")
                .style("text-anchor", "start");
            slider = grang.append("g")
                .attr("class", "slider");
            slider.call(brush);

            slider.selectAll(".extent,.resize")
                .remove();

            slider.select(".background")
                .attr("y", -5)
                .attr("height", 10);
            handle = slider.append("circle")
                .attr("class", "handle--custom")
                .attr("stroke", "#000")
                .attr("cursor", "ew-resize")
                .style("pointer-events", "none")
                .attr("r", 5);
        }
        axisl.call(d3.axisBottom()
            .scale(xScaleSlider)
            .ticks(4)
            .tickFormat(function (d) {
                return d;
            })
            .tickSize(0)
            .tickPadding(5))
        axisl.select(".domain")
            .select(function () {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr("class", "halo");
        axisl.selectAll('.tick text')
            .attr('dy', '0.8em');

        grang.select("text.sliderText")
            .html(`${graphicopt.preLinkText}  ${'\u2265'} <tspan> ${Math.round(valueSlider)} </tspan> ${graphicopt.postLinkText}`);


        handle.attr("cx", xScaleSlider(valueSlider));
        slider.call(brush.move, [0, valueSlider].map(xScaleSlider));
    }

    function brushed() {
        if (d3.event.selection) {
            handle.attr("cx", xScaleSlider(valueSlider));
        }
        if (!d3.event.sourceEvent) return;
        //console.log("Slider brushed ************** valueSlider="+valueSlider);
        if (d3.event.sourceEvent) { // not a programmatic event
            if (d3.event.selection === null) return;
            if (xScaleSlider.invert(d3.event.selection[1]) === valueSlider && xScaleSlider.invert(d3.event.selection[0]) === 0) return;
            valueSlider = d3.max(d3.event.selection.map(xScaleSlider.invert));
            valueSlider = Math.min(valueSlider, valueMax);
            handle.attr("cx", xScaleSlider(valueSlider));
            svg.select('.sliderText').html(`${graphicopt.preLinkText}  ${'\u2265'} <tspan> ${Math.round(valueSlider)} </tspan> ${graphicopt.postLinkText}`);
            d3.select(this).call(d3.event.target.move, [0, valueSlider].map(xScaleSlider));
        }
    }

    function brushend() {
        if (!first)
            recompute();
    }

    //</funcs>
    return timeArc;
};


var formatTimeUlti = {
    Millisecond: d3.timeFormat(".%L"),
    Second: d3.timeFormat(":%S"),
    Minute: d3.timeFormat("%I:%M"),
    Hour: d3.timeFormat("%I %p"),
    Day: d3.timeFormat("%a %d"),
    Week: d3.timeFormat("%b %d"),
    Month: d3.timeFormat("%B"),
    Year: d3.timeFormat("%Y")
};
