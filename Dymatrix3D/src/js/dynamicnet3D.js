let DynamicNet3D = function () {
    self.workerPath = 'src/js/worker/forceworker.js'
    self.outputSelection = [{label: "Total time", content: '_', variable: 'totalTime'}, {
        label: "Apha",
        content: '_',
        variable: 'alpha'
    }];
    let master = {};
    let simulations;
    let graphicopt = {
            margin: {top: 0, right: 0, bottom: 0, left: 0},
            width: 1500,
            height: 800,
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
            animationTime: 1000,
            color: {},
            // range:[0,1],
            radaropt: {
                // summary:{quantile:true},
                mini: true,
                levels: 6,
                gradient: true,
                w: 40,
                h: 40,
                showText: false,
                margin: {top: 0, right: 0, bottom: 0, left: 0},
                isNormalize: false,
                schema: serviceFullList
            },
            type1:'compute',
            curveSegment: 20,
            linkConnect: 'straight',
            showUser: true,
            showNode: true,
            showChanged: true,
            showLineConnect: true,
            linePlot: false,
            plotMetric: false,
            isSelectionMode: false,
            label_enable: true,
            filter: {distance: 0.5},
            timeResolution: 1,
            component: {
                dot: {size: 5, opacity: 0.5, filter: {size: 5, opacity: 0.1}, 'user': {size: 10}},
                link: {size: 1, opacity: 0.5, highlight: {opacity: 1}},
                label: {enable: false}
            },
            expand: {xy: 1},
            opt: {
                dim: 2.5
            },
            service: [],
            tableLimit: 1500,
            iscompareMode: true
        },
        controlPanelGeneral = {
            showChanged: {
                text: "Show Variations",
                type: "checkbox",
                variable: 'showChanged',
                values: true,
                width: '100px',
                callback: () => {
                    const v = graphicopt.showChanged;
                    onShowChanged = (v) => {
                        if (v) {
                            visibleNode();
                            dynamicVizs.forEach(n => {
                                n.links.forEach(l => {
                                    l._visible_old = l.visible;
                                    l.visible = l._visible && l.visible;
                                })
                            });
                        } else {
                            visibleNode();
                            dynamicVizs.forEach(n => {
                                n.links.forEach(l => l.visible = l._visible_old);
                            });
                        }
                    };
                    onShowChanged(v);
                    isneedrender = true;
                }
            },
            showLineConnect: {
                text: "Show User timelines",
                type: "checkbox",
                variable: 'showLineConnect',
                values: true,
                width: '100px',
                callback: () => {
                    const v = graphicopt.showLineConnect;
                    onShowLineConnectChanged = (v) => {
                        if (v) {
                            Object.keys(dynamicVizs.links).forEach(k => {
                                const d = dynamicVizs.links[k];
                                d.el.visible = d._visible;
                                if (d._visible) {
                                    const points = d.data.map(source => new THREE.Vector3(source.x, source.y, source.z));
                                    // if (d.data.length<data.net.length)
                                    //     debugger
                                    // d.parent.timeArr[soli]
                                    d.el.geometry.setFromPoints(points);
                                    d.el.geometry.attributes.position.needsUpdate = true;
                                    d.el.geometry.computeBoundingBox();
                                }
                            });
                        } else {
                            Object.keys(dynamicVizs.links).forEach(k => dynamicVizs.links[k].el.visible = false);
                        }
                    };
                    onShowLineConnectChanged(v);
                    isneedrender = true;
                }
            },
            showUserIcon: {
                text: "Show Users",
                type: "checkbox",
                variable: 'showUser',
                values: true,
                width: '100px',
                callback: () => {
                    visibleNode();
                    render(!isBusy);
                    isneedrender = true;
                }
            },
            showNodeIcon: {
                text: "Show Nodes",
                type: "checkbox",
                variable: 'showNode',
                values: true,
                width: '100px',
                callback: () => {
                    visibleNode();
                    render(!isBusy);
                    isneedrender = true;
                }
            },
            labelMarker: {
                text: "Show Labels",
                type: "checkbox",
                variableRoot: graphicopt.component.label,
                variable: 'label_enable',
                values: true,
                width: '100px',
                callback: updatelabelCluster
            },
            linkConnect: {
                text: "Link type",
                type: "selection",
                variable: 'linkConnect',
                labels: ['--none--', 'Straight'],
                values: [false, 'straight'],
                width: '100px',
                callback: () => {
                    visibleLine(graphicopt.linkConnect);
                    toggleLine();
                    render(!isBusy);
                    isneedrender = true;
                }
            },
            linkOpacity: {
                text: "Link opacity",
                range: [0.1, 1],
                id: 'Link_opacity',
                type: "slider",
                variableRoot: graphicopt.component.link,
                variable: 'opacity',
                width: '100px',
                step: 0.1,
                callback: onlinkopacity
            },
            networkExpand: {
                text: "Network Expand",
                range: [0.1, 5],
                id: 'Network_Expand',
                type: "slider",
                variableRoot: graphicopt.expand,
                variable: 'xy',
                width: '100px',
                step: 0.1,
                callback: onNetworkExpandXY
            },
            timeResolution: {
                text: "Time Resolution",
                type: "selection",
                variable: 'timeResolution',
                labels: ['5 minutes', '30 minutes', '1 hour', '2 hours', '3 hours'],
                values: [1, 30 / 5, 60 / 5, 120 / 5, 180 / 5],
                width: '100px',
                callback: () => {
                    debugger
                    isneedCompute = true;
                    render(!isBusy);
                    isneedrender = true;
                }
            }
        },
        formatTable = {
            'opacity': function (d) {
                return d3.format('.1f')(d)
            },
            'radarRatio': function (d) {
                return d3.format('.1f')(d)
            },
            'minDist': function (d) {
                return d3.format('.1f')(d)
            },
            'alpha': function (d) {
                return d3.format('.3f')(d)
            },
            'time': function (d) {
                return millisecondsToStr(d)
            },
            'totalTime': function (d) {
                return millisecondsToStr(d)
            },
            'iteration': function (d) {
                return d
            },
            'stopCondition': function (d) {
                return '1e' + Math.round(d)
            }
        },
        renderQueue_link = {line: false, curve: false},
        isneedCompute = true,
        runopt = {},
        isBusy = false,
        stop = false;
    let xScale,yScale, colorscale, reset;
    let solution, datain = [], filterbyClustername = [], visibledata, table_info, path, cluster = [], scaleTime;
    let scaleNormalTimestep = d3.scaleLinear();
    // grahic
    let camera, isOrthographic = true, scene, axesHelper, axesTime, gridHelper, controls, raycaster, INTERSECTED = [],
        mouse,
        points, lines,
        scatterPlot, metricPlot, netPlot, colorarr, renderer, view, zoom, background_canvas, background_ctx,
        front_canvas,
        front_ctx, svg, clusterMarker;
    let fov = 100,
        near = 0.1,
        far = 7000;
    let animateTrigger = false;

    //----------------------drag-----------------------
    let allSelected_Data;
    var lassoTool, mouseoverTrigger = true, iscameraMove = false;
    let drag = () => {
        function dragstarted(d) {
            isneedrender = true;
            mouseoverTrigger = false;
            let coordinator = d3.mouse(this);
            mouse.x = (coordinator[0] / graphicopt.width) * 2 - 1;
            mouse.y = -(coordinator[1] / graphicopt.height) * 2 + 1;
            lassoTool.lassoPolygon = [coordinator];
            lassoTool.start();
            lassoTool.isend = false;
            lassoTool.needRender = true;
        }

        function dragged(d) {
            let coordinator = d3.mouse(this);
            mouse.x = (coordinator[0] / graphicopt.width) * 2 - 1;
            mouse.y = -(coordinator[1] / graphicopt.height) * 2 + 1;
            lassoTool.lassoPolygon.push(coordinator);
            lassoTool.needRender = true;
            isneedrender = true;

        }

        function dragended(d) {
            disableMouseover = false;
            mouseoverTrigger = true;
            lassoTool.end();
        }

        return d3.drag().touchable(navigator.maxTouchPoints)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    };

    function handle_selection_switch(trigger) {
        controls.enabled = !trigger;
        if (trigger) {
            if (reset)
                lassoTool = new THREE.LassoTool(camera, points, graphicopt, svg.select('#modelWorkerScreen_lassotool'));
            reset = false;
            disableMouseover = true;
            d3.select('#modelWorkerScreen').call(drag());
        } else {
            if (lassoTool)
                lassoTool.reset();
            disableMouseover = false;
            d3.select('#modelWorkerScreen').on('mousedown.drag', null);
            d3.select('#modelWorkerScreen')
                .on('mousedown', () => isMousemove = false)
                .on('mouseover', () => {
                    isneedrender = true;
                    mouseoverTrigger = true
                })
                .on('mousemove', function () {
                    let coordinator = d3.mouse(this);
                    mouse.x = (coordinator[0] / graphicopt.width) * 2 - 1;
                    mouse.y = -(coordinator[1] / graphicopt.height) * 2 + 1;
                    mouseoverTrigger = true;
                    isneedrender = true;
                    isMousemove = true;
                }).on('mouseleave', () => {
                mouseoverTrigger = false;
                isMousemove = false;
            })
                .on('click', onClick);
        }
    }

    let isMousemove = false;

    let obitTrigger = true;
    let linkConnect_old;

    function onShowLineChart() {
        scene.remove(metricPlot);
        if (graphicopt.plotMetric !== false) {
            updatePlot();
        } else {
            isneedrender = true;
        }
    }
    function reduceRenderWeight(isResume) {
        if (isResume) {
            graphicopt.linkConnect = linkConnect_old;
        } else {
            linkConnect_old = graphicopt.linkConnect;
            graphicopt.linkConnect = false;
        }
        controlPanelGeneral.linkConnect.callback();
    }

    let maindiv = '#dynamicHolder';
    var color = d3.scaleSequential()
        .interpolator(d3.interpolateSpectral);
    let getColorScale = function () {
        return color
    };
    let isFreeze = false;
    let data = [], dynamicVizs = [];
    let onFinishDraw = [];
    let getRenderFunc = function (d) {
        if (d.d) {
            return d.d;
        } else
            return d3.arc()
                .innerRadius(0)
    };


    function start(skipRecalculate) {
        isneedCompute = true;
        renderQueue_link = {line: false, curve: false};

        axesHelper.toggleDimension(graphicopt.opt.dim);
        gridHelper.parent.visible = (graphicopt.opt.dim === 2.5);

        controls.enableRotate = true;
        controls.screenSpacePanning = false;
        controls.target.set(0, 0, 0);
        controls.enableZoom = true;
        controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
        controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
        // enableRadarView(false);
        d3.select('#modelSetting').selectAll('.dim3').attr('disabled', null).select('select, input').attr('disabled', null);

        if (obitTrigger) {
            setUpZoom();
            obitTrigger = false;
        }
        controll_metrics.zoom_or = controls.target.distanceTo(controls.object.position);
        svg.select('#modelWorkerScreen_svg_g').selectAll('*').remove();
        if (skipRecalculate) {
            render(true);
            reduceRenderWeight(true);
            updateProcess()
            return;
        }
        reduceRenderWeight();
        mouseoverTrigger = false;
        terminateWorker();
        updateProcess({percentage: 10, text: 'Transfer data to projection function'})
        let firstReturn = true;
        render();
        // modelWorker = new Worker(self.workerPath);
        // workerList[0] = modelWorker;
        // console.log(`----inint ${self.workerPath} with: `, graphicopt.opt)
        //
        // // modelWorker.postMessage({action: "initDataRaw", value: data.net});
        // forceFunc(data.net,(data) => {
        //     switch (data.action) {
        //         case "updateHighlight":
        //             if (dynamicVizs[0]) {
        //                 disableMouseover = true;
        //                 // if (graphicopt.showChanged) {
        //                 //     dynamicVizs[0].nodes._array_old = dynamicVizs[0].nodes.geometry.attributes.alpha.array.slice();
        //                 // }
        //                 for (let i = 1; i < data.sol.length; i++) {
        //                     data.sol[i].links.forEach((l, li) => {
        //                         if (l.isNew) {
        //                             l.source.timeArr[i].filtered = true;
        //                             l.target.timeArr[i].filtered = true;
        //                             dynamicVizs.links[l.target.id]._visible = true;
        //                         }else{
        //                             l.source.filtered = false;
        //                             l.target.filtered = false;
        //                             dynamicVizs.links[l.target.id]._visible = false;
        //                         }
        //                     });
        //                     data.sol[i].deletedLinks.forEach(l => {
        //                         (l.source.timeArr[i]??l.source.timeArr[i-1]).filtered = true;
        //                         (l.target.timeArr[i]??l.target.timeArr[i-1]).filtered = true;
        //                         dynamicVizs.links[l.target.id]._visible = true;
        //                     });
        //                     data.sol[i].nodes.forEach((n, ni) => {
        //                         if (n.filtered) {
        //                             dynamicVizs[i].nodes._alpha[ni] = graphicopt.component.dot.opacity;
        //                             // dynamicVizs.links[n.id]._visible = true;
        //                         } else
        //                             dynamicVizs[i].nodes._alpha[ni] = 0;
        //                     });
        //                     if (graphicopt.showChanged) {
        //                         // dynamicVizs[i].nodes._array_old = dynamicVizs[i].nodes.geometry.attributes.alpha.array.slice();
        //                         dynamicVizs[i].nodes.geometry.attributes.alpha.array = dynamicVizs[i].nodes._alpha.slice();
        //                         dynamicVizs[i].nodes.geometry.attributes.alpha.needsUpdate = true;
        //                     }
        //                 }
        //                 debugger
        //                 isneedrender=true;
        //             }
        //             break;
        //         case "render":
        //             disableMouseover = true;
        //             if (firstReturn) {
        //                 updateProcess();
        //                 firstReturn = false;
        //             }
        //             if (!isBusy) {
        //                 isBusy = true;
        //                 solution = data.sol;
        //                 updateTableOutput(data.value);
        //                 // console.log('From:', data.source," alpha: ",data.value.alpha)
        //                 isneedCompute = true;
        //                 render();
        //                 isBusy = false;
        //             }
        //             break;
        //         case "stable":
        //             if (firstReturn) {
        //                 updateProcess()
        //                 firstReturn = false;
        //             }
        //             modelWorker.terminate();
        //             disableMouseover = false;
        //             if (data.value) {
        //                 updateTableOutput(data.value);
        //             }
        //             solution = data.sol;
        //             isneedCompute = true;
        //             render(true);
        //             reduceRenderWeight(true);
        //             break;
        //         default:
        //             updateProcess({percentage: data.value.percentage, text: data.value.message});
        //             break;
        //     }
        // })
    }

    let controll_metrics = {old: {zoom: undefined}};
    master.init = function (arr) {
        updateProcess({percentage: 1, text: 'Prepare rendering ...'});

        graphicopt.height = $('#dynamicHolder').height();
        graphicopt.width = $('#dynamicHolder').width();

        master.generateTable();

        $('#search').on('input', searchHandler); // register for oninput
        $('#search').on('propertychange', searchHandler); // for IE8
        // makeDataTableFiltered()

        // prepare data
        needRecalculate = true;
        reset = true;
        mouseoverTrigger = false;
        solution = [];


        path = {};

        scaleNormalTimestep.range([-graphicopt.widthG() / 2, graphicopt.widthG() / 2]);

        // prepare screen
        setTimeout(function () {
            dynamicVizs = [];
            simulations = [];
            isneedrender = false;
            // far = graphicopt.width / 2 / Math.tan(fov / 180 * Math.PI / 2) * 10;
            // camera = new THREE.PerspectiveCamera(fov, graphicopt.width / graphicopt.height, near, far + 1);
            far = graphicopt.width / 2 * 100;
            near = 1;
            camera = new THREE.OrthographicCamera(graphicopt.width / -2, graphicopt.width / 2, graphicopt.height / 2, graphicopt.height / -2, near, far + 1);
            scene = new THREE.Scene();
            axesHelper = createAxes(graphicopt.widthG() / 4);
            scene.background = new THREE.Color(0xffffff);
            scatterPlot = new THREE.Object3D();
            scatterPlot.add(axesHelper);
            scatterPlot.rotation.y = 0;

            netPlot = new THREE.Object3D();
            scatterPlot.add(netPlot);

            gridHelper = new THREE.GridHelper(graphicopt.heightG(), 10);
            gridHelper.position.z = scaleNormalTimestep.range()[0];
            gridHelper.rotation.x = -Math.PI / 2;
            scene.add(new THREE.Object3D().add(gridHelper));
            scene.add(scatterPlot);

            // Add plot
            metricPlot = new THREE.Object3D();
            scene.add(metricPlot);

            // Add canvas
            renderer = new THREE.WebGLRenderer({canvas: document.getElementById("modelWorkerScreen")});
            renderer.setSize(graphicopt.width, graphicopt.height);
            renderer.render(scene, camera);
            // zoom set up
            view = d3.select(renderer.domElement);
            axesHelper.toggleDimension(graphicopt.opt.dim);

            raycaster = new THREE.Raycaster();
            raycaster.params.Points.threshold = graphicopt.component.dot.size;
            mouse = new THREE.Vector2();

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            // disable the tabIndex to avoid jump element
            view.attr('tabindex', null);
            let mouseoverTrigger_time;
            controls.addEventListener("change", function (d) {
                controll_metrics.x = controls.target.x;
                controll_metrics.y = controls.target.y;
                controll_metrics.zoom = controls.target.distanceTo(controls.object.position);
                controll_metrics.scale = controll_metrics.zoom_or / controll_metrics.zoom;
                isneedrender = true;
                iscameraMove = true;
            });
            setUpZoom();
            stop = false;

            svg = d3.select('#modelWorkerScreen_svg')
                .attr("width", graphicopt.width)
                .attr("height", graphicopt.height);
            svg.select("#modelWorkerScreen_svg_g").selectAll("*").remove();

            d3.select('.modelHeader .title').text(self.name);
            handle_selection_switch(graphicopt.isSelectionMode);


            animate();
            needRecalculate = false;
        }, 1);
        return master;
    };

    function visibleNode() {
        dynamicVizs.forEach((n, ni) => {
            if (graphicopt.showChanged)
                n.nodes.geometry.attributes.alpha.array = n.nodes._alpha.slice();
            else
                n.nodes.geometry.attributes.alpha.array = n.nodes.geometry.attributes.alpha.array.map(d => graphicopt.component.dot.opacity)
            if (!graphicopt.showUser)
                data.net[ni].nodes.forEach((d, i) => {
                    if (d.type === 'user') {
                        n.nodes.geometry.attributes.alpha.array[i] = 0;
                    }
                });
            if (!graphicopt.showNode)
                data.net[ni].nodes.forEach((d, i) => {
                    if (d.type === 'compute') {
                        n.nodes.geometry.attributes.alpha.array[i] = 0;
                    }
                });
            n.nodes.geometry.attributes.alpha.needsUpdate = true;
            n.links.forEach(l => {
                l._visible_old = l.visible;
                l.visible = l._visible && l.visible;
            })
        });

        // dynamicVizs.forEach(n=>{
        //     n.nodes.geometry.attributes.alpha.array= n.nodes._array_old;
        //     n.nodes.geometry.attributes.alpha.needsUpdate = true;
        //     n.links.forEach(l=>l.visible = l._visible_old);
        // });
    }

    function visibleLine(isvisiable) {
        dynamicVizs.forEach(d => {
            d.links.forEach(lk => {
                    lk.visible = graphicopt.showChanged ? (lk._visible && isvisiable) : isvisiable;
                }
            )
        });
        d3.select('#Link_opacity').classed('hide', !isvisiable);
    }

    function toggleLine() {
        visibleLine(graphicopt.linkConnect);
        isneedCompute = (!renderQueue_link.line);
        renderQueue_link.line = true;
    }

    // zoom
    function setUpZoom() {
        let initial_scale = 1;
        camera.position.set(0, 0, getZFromScale(initial_scale));
    }

    function getZFromScale(scale) {
        let half_fov = fov / 2;
        let half_fov_radians = toRadians(half_fov);
        let scale_height = graphicopt.height / scale;
        let camera_z_position = scale_height;
        console.log('camera_z_position', camera_z_position)
        return camera_z_position;
    }

    // function getZFromScale(scale) {
    //     let half_fov = fov / 2;
    //     let half_fov_radians = toRadians(half_fov);
    //     let scale_height = graphicopt.height / scale;
    //     let camera_z_position = scale_height / (2 * Math.tan(half_fov_radians));
    //     return camera_z_position;
    // }

    function toRadians(angle) {
        return angle * (Math.PI / 180);
    }

    //creat point
    function createLines(g, links, color) {
        return links.map(k => {
            const el = createLine(k, color);
            g.add(el);
            return el;
        });
    }

    function createLine(path, color) {
        const points = [];
        points.push(new THREE.Vector3(0, 0, 0));
        points.push(new THREE.Vector3(0, 0, 0));

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        let color_ = path.color ?? color;
        let _visible = !!color_;
        var material = new THREE.LineBasicMaterial({
            opacity: graphicopt.component.link.opacity,
            linewidth: graphicopt.component.link.size,
            color: color_ ? (new THREE.Color(d3.color(color_) + '')) : 0x000000,
            transparent: true
        });
        let lineObj = new THREE.Line(geometry, material);
        // lineObj.frustumCulled = false;
        lineObj.data = path;
        lineObj._visible = _visible;
        return lineObj;
    }

    function createLineSegment(path, color) {
        const points = path.data.map(d => new THREE.Vector3(0, 0, 0));

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        let color_ = path.color ?? color;
        var material = new THREE.LineBasicMaterial({
            opacity: graphicopt.component.link.opacity,
            linewidth: graphicopt.component.link.size,
            color: color_ ? (new THREE.Color(d3.color(color_) + '')) : 0x000000,
            transparent: true
        });
        let lineObj = new THREE.Line(geometry, material);
        // lineObj.frustumCulled = false;
        lineObj.data = path;
        lineObj.name = 'connected ' + path.id;
        lineObj.id = 'connected ' + path.id;
        lineObj.visible = false;
        return lineObj;
    }

    function createpoints(g, datafiltered, ti) {
        let pointsGeometry = new THREE.BufferGeometry();

        let colors = new Float32Array(datafiltered.length * 3);
        let pos = new Float32Array(datafiltered.length * 3);
        let alpha = new Float32Array(datafiltered.length);
        let _alpha = new Float32Array(datafiltered.length);
        let sizes = new Float32Array(datafiltered.length);
        let texIndex = new Float32Array(datafiltered.length);
        for (let i = 0; i < datafiltered.length; i++) {
            let target = datafiltered[i];
            // Set vector coordinates from data
            // let vertex = new THREE.Vector3(0, 0, 0);
            pos[i * 3 + 0] = 0;
            pos[i * 3 + 1] = 0;
            pos[i * 3 + 2] = 0;
            // let color = new THREE.Color(d3.color(colorarr[target.cluster].value)+'');
            let color = d3.color(target.drawData[0].color ?? 'black');
            colors[i * 3 + 0] = color.r / 255;
            colors[i * 3 + 1] = color.g / 255;
            colors[i * 3 + 2] = color.b / 255;
            alpha[i] = target.filterd ? graphicopt.component.dot.filter.opacity : graphicopt.component.dot.opacity;
            _alpha[i] = 0;
            texIndex[i] = 0//target.type === 'user' ? 1 : 0;
            sizes[i] = (graphicopt.component.dot[target.type] ?? graphicopt.component.dot).size;
        }
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        pointsGeometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
        pointsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        pointsGeometry.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
        pointsGeometry.setAttribute('texIndex', new THREE.BufferAttribute(texIndex, 1));
        pointsGeometry.boundingBox = null;
        pointsGeometry.computeBoundingSphere();

        let pointsMaterial = new THREE.ShaderMaterial({

            uniforms: {
                color: {value: new THREE.Color(0xffffff)},
                // pointTexture: {value: new THREE.TextureLoader().load("src/images/circle.png")}
                textures: {
                    type: "t",
                    value: [new THREE.TextureLoader().load("src/images/circle.png")]
                }

            },
            vertexShader: document.getElementById('vertexshader').textContent,
            fragmentShader: document.getElementById('fragmentshader').textContent,
            depthTest: false
        });
        pointsMaterial.transparent = true;
        let p = new THREE.Points(pointsGeometry, pointsMaterial);
        p.frustumCulled = false;
        p._alpha = _alpha;
        p.data = {arr: datafiltered, index: ti};
        g.add(p);
        return p;
    }

    function searchHandler(e) {
        if (e.target.value !== "") {
            // let results = datain.filter(h => h.name.includes(e.target.value)).map(h => ({index: path[h.name][0].index}));
            let target = data.root_nodes.find(d => d.id.includes(e.target.value));
            if (target) {
                let resultIndex = target.timeArr.findIndex(d => d);
                if (resultIndex !== -1) {
                    return highlightNode([{index: target.timeArr[resultIndex]._index, netIndex: resultIndex}]);
                }
            }
        }
        return highlightNode([]);
    }

    function updatelabelCluster() {
        svg.select('#modelNodeLabel').selectAll('.name').remove();
        if (dynamicVizs[0]) {
            if (graphicopt.label_enable) {
                let orient = ({
                    top: text => text.attr("text-anchor", "middle").attr("y", -3),
                    right: text => text.attr("text-anchor", "start").attr("dy", "0.35em").attr("x", 3),
                    bottom: text => text.attr("text-anchor", "middle").attr("dy", "0.71em").attr("y", 3),
                    left: text => text.attr("text-anchor", "end").attr("dy", "0.35em").attr("x", -3)
                });
                let pointData = [];
                dynamicVizs.forEach((net, ni) => {
                    net.nodes._alpha.forEach((d, i) => {
                        if (data.net[ni].nodes[i].inscreen) {
                            let temp = getpos(net.nodes.geometry.attributes.position.array[i * 3], net.nodes.geometry.attributes.position.array[i * 3 + 1], net.nodes.geometry.attributes.position.array[i * 3 + 2]);
                            temp = [temp.x, temp.y];
                            temp.index = '' + ni + ' ' + i;
                            temp.name = data.net[ni].nodes[i].name;
                            pointData.push(temp);
                        }
                    })
                });
                let voronoi = d3.Delaunay.from(pointData)
                    .voronoi([0, 0, graphicopt.widthG(), graphicopt.heightG()]);

                let dataLabel = [];
                pointData.forEach((d, i) => {
                    const cell = voronoi.cellPolygon(i);
                    if (cell && -d3.polygonArea(cell) > 2000)
                        dataLabel.push([d, cell, d.name])
                });
                svg.select('#modelNodeLabel').selectAll('.name').data(dataLabel).enter()
                    .append('text').attr('class', 'name')
                    .each(function ([[x, y], cell]) {
                        const [cx, cy] = d3.polygonCentroid(cell);
                        const angle = (Math.round(Math.atan2(cy - y, cx - x) / Math.PI * 2) + 4) % 4;
                        d3.select(this).call(angle === 0 ? orient.right
                            : angle === 3 ? orient.top
                                : angle === 1 ? orient.bottom
                                    : orient.left);
                    })
                    .attr("transform", ([d]) => `translate(${d})`)
                    .style('opacity', 0.6)
                    .text(([, , name]) => name);
            };
        }
    }

    function getpos(x, y, z, index) {
        var width = graphicopt.widthG(), height = graphicopt.heightG();
        var widthHalf = width / 2, heightHalf = height / 2;
        camera.updateMatrixWorld();
        var vector = new THREE.Vector3(x, y, z);
        vector.project(camera);

        vector.x = (vector.x * widthHalf) + widthHalf;
        vector.y = -(vector.y * heightHalf) + heightHalf;
        vector.index = index;
        return vector;
    }

    // Three.js render loop
    let onrendercalled = false;

    function render(islast) {
        if (isneedCompute) {
            try {
                if (islast) {
                    debugger
                } else {

                }
            } catch (e) {
                console.log(e)
            }
            isneedCompute = false;
        }
    }


    function createAxes(length) {
        var material = new THREE.LineBasicMaterial({color: 0x000000});
        var geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0),
            new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0),
            new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, length)]);
        let axesHelper = new THREE.LineSegments(geometry, material);
        axesHelper.toggleDimension = function (dim) {
            if (axesTime)
                axesTime.visible = false;
            if (dim === 2.5) {
                axesHelper.visible = false;
                if (axesTime)
                    axesTime.visible = true;
            } else if (dim === 3) {
                axesHelper.visible = true;
                axesHelper.geometry.dispose();
                axesHelper.geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0),
                    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0),
                    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, length)]);
            } else if (dim === 2) {
                // axesHelper.geometry.dispose();
                axesHelper.visible = false;
                // axesHelper.geometry = new THREE.BufferGeometry().setFromPoints( [
                //     new THREE.Vector3( 0, 0, 0), new THREE.Vector3( length, 0, 0),
                //     new THREE.Vector3( 0, 0, 0), new THREE.Vector3( 0, length, 0)]);
            }
        };
        return axesHelper;
    }

    function createTimeaxis() {
        var dir = new THREE.Vector3(0, 0, 1);
        dir.normalize();
        var origin = new THREE.Vector3(graphicopt.heightG() / 2, graphicopt.heightG() / 2, scaleNormalTimestep.range()[0]);
        var length = scaleNormalTimestep.range()[1] - scaleNormalTimestep.range()[0];
        var hex = 0x0000ff;
        var arrowGroup = new THREE.Object3D();
        var arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex, 30, 10);
        arrowHelper.line.material.linewidth = 4;
        arrowGroup.add(arrowHelper);
        let timeScale = d3.scaleTime().range(scaleNormalTimestep.range());
        timeScale.domain([data.time_stamp[0], data.time_stamp[data.time_stamp.length - 1]]);
        var loader = new THREE.FontLoader();

        loader.load('../TimeRadar/src/fonts/optimer_regular.typeface.json', function (font) {
            timeScale.ticks(5).forEach(t => {

                var textGeo = new THREE.TextGeometry(timeScale.tickFormat()(t).replace(' AM', ' am').replace(' PM', ' pm'), {
                    font: font,
                    size: 20,
                    height: 1,
                    curveSegments: 12,
                    bevelEnabled: false
                });
                textGeo.computeBoundingBox();
                textGeo.computeVertexNormals();
                textGeo = new THREE.BufferGeometry().fromGeometry(textGeo);

                // let textMesh1 = new THREE.Mesh(textGeo, new THREE.MeshPhongMaterial({color: 0x0000ff, flatShading: true}));
                let textMesh1 = new THREE.Mesh(textGeo, new THREE.MeshBasicMaterial({color: 0x0000ff}));
                textMesh1.name = 'TimeText';
                textMesh1.position.x = graphicopt.heightG() / 2;
                textMesh1.position.y = graphicopt.heightG() / 2;
                textMesh1.position.z = timeScale(t);
                // textMesh1.rotation.x = 0;
                // textMesh1.rotation.y = Math.PI / 2;
                textMesh1.quaternion.copy(camera.quaternion);
                arrowGroup.add(textMesh1)
            });
        });
        scene.add(arrowGroup);
        arrowGroup.visible = false;
        return arrowGroup;
    }

    let ishighlightUpdate = false;

    //interacction
    function highlightNode(intersects) { // INTERSECTED
        var targetfilter;
        if (intersects.length > 0 && (!visibledata || visibledata && (targetfilter = intersects.find(d => visibledata.indexOf(d.index) !== -1)))) {
            // var geometry = points.geometry;
            // var attributes = geometry.attributes;
            let targetIndex = intersects[0].index;
            let netIndex = intersects[0].netIndex;
            if (visibledata)
                targetIndex = targetfilter.index;
            // if (INTERSECTED.indexOf(intersects[0].index) === -1) {
            if (true) {
                let target = data.net[netIndex].nodes[targetIndex];
                let rootTarget = data.root_nodes.find(d => d.id === target.id);
                INTERSECTED = [target.id];
                visibleNode();
                data.net.forEach((net, ni) => {
                    const n = rootTarget.timeArr[ni];
                    let attribute = dynamicVizs[ni].nodes.geometry.attributes;
                    attribute.alpha.array = attribute.alpha.array.map(d => d ? graphicopt.component.dot.filter.opacity : d);
                    if (n) {
                        attribute.alpha.array[n._index] = attribute.alpha.array[n._index] ? graphicopt.component.dot.opacity : attribute.alpha.array[n._index];
                    }
                    attribute.alpha.needsUpdate = true;
                });
                dynamicVizs.forEach(d => {
                    d.links.forEach((lk, li) => {
                        let isvisiable = false;
                        let connected = {};
                        if (lk.data.source !== undefined && lk.data.target !== undefined) {
                            if (lk.data.source.id === target.id) {
                                isvisiable = true;
                                connected = lk.data.target;
                            } else if (lk.data.target.id === target.id) {
                                isvisiable = true;
                                connected = lk.data.source;
                            }

                            lk.visible = graphicopt.showChanged ? (lk._visible && isvisiable) : isvisiable;
                            if (lk.visible) {
                                const old = dynamicVizs[connected.ti].nodes.geometry.attributes.alpha.array[connected._index];
                                dynamicVizs[connected.ti].nodes.geometry.attributes.alpha.array[connected._index] = old ? graphicopt.component.dot.opacity : old;
                            }
                        } else {
                            debugger
                        }
                    })
                });
                d3.select('#selectedItem').html(`${target.id} at ${data.time_stamp[netIndex]}`);
                onSelectLine(target.type === 'compute' ? target.id : undefined, netIndex);
            }
        } else if (INTERSECTED.length || ishighlightUpdate) {
            // var geometry = points.geometry;
            // var attributes = geometry.attributes;
            ishighlightUpdate = false;
            // tooltip_lib.hide(); // hide tooltip
            if (visibledata) {
                // if (visibledata.length<graphicopt.tableLimit*2)
                datain.forEach((d, i) => {
                    if (visibledata.indexOf(i) !== -1 || (filterGroupsetting.timestep !== undefined && filterGroupsetting.timestep === d.__timestep)) {
                        INTERSECTED.push(i);
                        attributes.alpha.array[i] = d.filtered ? graphicopt.component.dot.filter.opacity : graphicopt.component.dot.opacity;
                        attributes.size.array[i] = d.filtered ? graphicopt.component.dot.filter.size : graphicopt.component.dot.size;
                        lines[d.name].visible = filterGroupsetting.timestep === undefined;
                        lines[d.name].material.opacity = graphicopt.component.link.opacity;
                        lines[d.name].material.linewidth = graphicopt.component.link.highlight.opacity;
                        if (d.__metrics.radar)
                            d.__metrics.radar.dispatch('highlight')
                    } else {
                        attributes.alpha.array[i] = 0;
                        lines[d.name].visible = false;
                        lines[d.name].material.opacity = graphicopt.component.link.opacity;
                        lines[d.name].material.linewidth = graphicopt.component.link.size;
                    }
                });
            } else {
                // datain.forEach((d, i) => {
                //     attributes.alpha.array[i] = d.filtered ? graphicopt.component.dot.filter.opacity : graphicopt.component.dot.opacity;
                //     attributes.size.array[i] = d.filtered ? graphicopt.component.dot.filter.size : graphicopt.component.dot.size;
                //     lines[d.name].visible = true;
                //     lines[d.name].material.opacity = graphicopt.component.link.opacity;
                //     lines[d.name].material.linewidth = graphicopt.component.link.size;
                // });
                visibleNode();
                visibleLine(graphicopt.linkConnect);
                dynamicVizs.forEach(net => {
                    net.nodes.geometry.attributes.alpha.needsUpdate = true;
                })
            }
            // attributes.size.needsUpdate = true;
            // attributes.alpha.needsUpdate = true;
            INTERSECTED = [];
            onSelectLine();
            d3.select('#selectedItem').html('');
        }
        isneedrender = true;
    }

    function highlightGroupNode(intersects, timestep) { // INTERSECTED
        svgData = undefined;
        d3.select('#modelWorkerScreen_svg_g').style('pointer-events', 'none').attr('transform', `translate(0,0) scale(1)`).selectAll('*').remove();
        controll_metrics.old = {
            x: controll_metrics.x,
            y: controll_metrics.y,
            zoom: controll_metrics.zoom,
            scale: controll_metrics.scale || 1
        };
        if (intersects.length) {
            if (intersects.length < graphicopt.tableLimit) {
                // isdrawradar = true;
                d3.selectAll(".filterLimit, #filterTable_wrapper").classed('hide', false);
                // try {
                //     updateDataTableFiltered(intersects);
                // }catch(e){}
                d3.select("p#filterList").classed('hide', true);
            } else {
                d3.selectAll(".filterLimit, #filterTable_wrapper").classed('hide', true);
                d3.select("p#filterList").classed('hide', false);
                d3.select("p#filterList").text(intersects.join(', '));
                // d3.select("p#filterList+.copybtn").classed('hide', false);
            }
        } else {
            d3.selectAll(".filterLimit, #filterTable_wrapper").classed('hide', true)
            d3.select("p#filterList").text('');
            d3.select("p#filterList").classed('hide', true);
            // d3.select("p#filterList+.copybtn").classed('hide',true);
        }
        filterGroupsetting.timestep = timestep;
        var geometry = points.geometry;
        var attributes = geometry.attributes;
        if (intersects.length > 0 || !(timestep === undefined)) {
            let radarData = [];
            let posArr = [];
            visibledata = [];
            datain.forEach((d, i) => {
                if (intersects.indexOf(d.name) !== -1 || (timestep !== undefined && timestep === d.__timestep)) {
                    attributes.alpha.array[i] = d.filtered ? graphicopt.component.dot.filter.opacity : graphicopt.component.dot.opacity;
                    lines[d.name].visible = timestep === undefined;
                    lines[d.name].material.opacity = graphicopt.component.link.opacity;
                    lines[d.name].material.linewidth = graphicopt.component.link.highlight.opacity;
                    visibledata.push(i);
                    radarData.push(d);
                    posArr.push(getpos(attributes.position.array[i * 3], attributes.position.array[i * 3 + 1], attributes.position.array[i * 3 + 2], i));
                } else {
                    attributes.alpha.array[i] = 0;
                    lines[d.name].visible = false;
                    lines[d.name].material.opacity = graphicopt.component.link.opacity;
                    lines[d.name].material.linewidth = graphicopt.component.link.size;
                }
            });

            attributes.alpha.needsUpdate = true;
        } else if (visibledata && visibledata.length || ishighlightUpdate) {
            visibledata = undefined;
            ishighlightUpdate = false;
            tooltip_lib.hide(); // hide tooltip
            datain.forEach((d, i) => {
                attributes.alpha.array[i] = d.filtered ? graphicopt.component.dot.filter.opacity : graphicopt.component.dot.opacity;
                lines[d.name].visible = true;
                lines[d.name].material.opacity = graphicopt.component.link.opacity;
                lines[d.name].material.linewidth = graphicopt.component.link.size;
            });
            forceColider.stop();
            attributes.alpha.needsUpdate = true;

        }
        isneedrender = true;
    }

    let disableMouseover = false, isneedrender = false;
    let mouseclick = false;

    function onClick() {
        if (!isMousemove) {
            mouseclick = true;
            isneedrender = true;
            console.log('click!')
        }
    }

    let overwrite;

    function checkInScreen() {
        var frustum = new THREE.Frustum();
        frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
        dynamicVizs.forEach((net, ni) => {
            net.nodes._alpha.forEach((d, i) => {
                if (d > 0.1) {
                    data.net[ni].nodes[i].inscreen = frustum.containsPoint(new THREE.Vector3(net.nodes.geometry.attributes.position.array[i * 3], net.nodes.geometry.attributes.position.array[i * 3 + 1], net.nodes.geometry.attributes.position.array[i * 3 + 2]))
                } else {
                    data.net[ni].nodes[i].inscreen = false;
                }
            })
        });
    }

    function animate() {
        if (!stop) {
            animateTrigger = true;
            if (isneedrender) {
                // visibleLine(graphicopt.linkConnect);
                //update raycaster with mouse movement
                try {
                    if (axesTime.visible) {
                        axesTime.traverse(function (child) {
                            if (child.name === "TimeText")
                                child.quaternion.copy(camera.quaternion)
                        });
                    }
                    if (metricPlot && metricPlot.visible) {
                        metricPlot.traverse(function (child) {
                            if (child.name === "TimeText")
                                child.quaternion.copy(camera.quaternion)
                        });
                    }
                } catch (e) {
                }
                if (mouseoverTrigger && !iscameraMove && !disableMouseover || mouseclick) { // not have filter
                    camera.updateMatrixWorld();
                    // if (!svgData) {
                    raycaster.setFromCamera(mouse, camera);
                    if (!filterbyClustername.length) {
                        let intersects = overwrite;
                        if (!intersects) {
                            intersects = dynamicVizs.map(net => {
                                return raycaster.intersectObject(net.nodes).filter(e => e.object.geometry.attributes.alpha.array[e.index]);
                            });
                            intersects = intersects.filter(f => f && f.length);
                            if (intersects.length) {
                                let choice = {
                                    index: intersects[0][0].index,
                                    netIndex: intersects[0][0].object.data.index,
                                    ray: intersects[0][0]
                                };
                                intersects.forEach(d => {
                                    d.forEach(e => {
                                        if (choice.ray.distanceToRay < e.distanceToRay) {
                                            choice = {index: e.index, netIndex: e.object.data.index, ray: e};
                                        }
                                    })
                                })
                                intersects = [choice]
                            } else
                                intersects = [];
                        }
                        // // //count and look after all objects in the diamonds group
                        // debugger
                        highlightNode(intersects);
                    } else { // mouse over group
                        var geometry = points.geometry;
                        var attributes = geometry.attributes;
                        datain.forEach((d, i) => {
                            if (filterbyClustername.indexOf(d.clusterName) !== -1) {
                                attributes.alpha.array[i] = 1;
                                // lines[d.name].visible = true;
                            } else {
                                attributes.alpha.array[i] = 0.1;
                                // lines[d.name].visible = false;
                            }
                            lines[d.name].visible = false;
                        });
                        attributes.alpha.needsUpdate = true;
                    }
                    // }
                    if (mouseclick) {
                        disableMouseover = !!(!disableMouseover && INTERSECTED.length);
                        mouseclick = false;
                        // if (svgData && !disableMouseover && svgData.clickedOb) {
                        //     svgData.clickedOb.dispatch('mouseleave')
                        // }
                    }
                } else if (lassoTool && lassoTool.needRender) {
                    let newClustercolor = d3.color('#000000');
                    try {
                        for (var i = 0; i < lassoTool.collection.length; i++) {
                            let currentIndex = lassoTool.collection[i];
                            let currentData = datain[mapIndex[currentIndex]];
                            let currentColor = d3.color(colorarr[currentData.cluster].value);
                            points.geometry.attributes.customColor.array[currentIndex * 3] = currentColor.r / 255;
                            points.geometry.attributes.customColor.array[currentIndex * 3 + 1] = currentColor.g / 255;
                            points.geometry.attributes.customColor.array[currentIndex * 3 + 2] = currentColor.b / 255;
                            points.geometry.attributes.customColor.needsUpdate = true;
                        }


                        var allSelected = lassoTool.select();
                        allSelected_Data = [];
                        for (var i = 0; i < allSelected.length; i++) {
                            allSelected_Data.push(datain[mapIndex[allSelected[i]]]);
                            let currentIndex = lassoTool.collection[i];
                            points.geometry.attributes.customColor.array[currentIndex * 3] = newClustercolor.r / 255;
                            points.geometry.attributes.customColor.array[currentIndex * 3 + 1] = newClustercolor.g / 255;
                            points.geometry.attributes.customColor.array[currentIndex * 3 + 2] = newClustercolor.b / 255;
                            points.geometry.attributes.customColor.needsUpdate = true;
                        }

                    } catch (e) {

                    }
                    lassoTool.needRender = false;
                }
                // visibleLine(graphicopt.linkConnect);
                controls.update();
                renderer.render(scene, camera);
                checkInScreen();
                // if ((graphicopt.component.label.enable == 1) && solution&& solution.length)
                //     cluster.forEach(c => {
                //         if (datain[c.__metrics.indexLeader]) {
                //             const pos = position2Vector(datain[c.__metrics.indexLeader].__metrics.position);
                //             c.__metrics.projection = getpos(pos.x, pos.y, pos.z);
                //         }
                //     });
                updatelabelCluster();
                // console.log(controll_metrics.zoom)
                if (iscameraMove || onrendercalled) {
                    onrendercalled = false;
                }
            }
            iscameraMove = false;
            isneedrender = false;
            requestAnimationFrame(animate);
        } else {
            if (forceColider)
                forceColider.stop();
        }
    }

    let getDrawData = function () {
        return [];
    }

    createEventHandle('onBrush');
    createEventHandle('offBrush');
    createEventHandle('mouseover');
    createEventHandle('mouseout');
    createEventHandle('click');

    function createEventHandle(key) {
        master[key] = [];
        master[key].dict = {};
        master[key + 'Add'] = function (id, func) {
            if (master[key].dict[id] !== undefined)
                master[key][master[key].dict[id]] = func;
            else {
                master[key].push(func)
                master[key].dict[id] = master[key].length - 1;
            }
        }
    }

    const compareMode = true;
    master.draw = function () {
        solution = undefined;
        terminateWorker();
        // handle_data();
        updateTableInput();
        // remove all timeslice
        netPlot.remove(...netPlot.children);
        scaleNormalTimestep.domain([0, data.net.length]);
        if (!axesTime)
            axesTime = createTimeaxis();
        // create time slices
        points = [];
        dynamicVizs = [];
        dynamicVizs.links = {};
        debugger
        const type2List = [];
        const type1List = data.root_nodes.filter(d=>{
            if (d.type===graphicopt.type1)
                return true;
            type2List.push();
            return false;
        });

        xScale = d3.scaleOrdinal().domain(type1List.map(d=>d.id)).range([0,graphicopt.heightG()]);
        yScale = d3.scaleOrdinal().domain(type2List.map(d=>d.id)).range([0,graphicopt.heightG()]);

        data.net.forEach((net, ni) => {
            // time slice generate
            let sliceHolder = new THREE.Object3D();
            const netControl = {nodes: undefined, links: undefined, deletedLinks: undefined};
            netControl.nodes = createpoints(sliceHolder, net.links, ni);
            // netControl._links = createLines(sliceHolder, net.links);
            // netControl.deletedLinks = createLines(sliceHolder, net.deletedLinks ?? [], 'rgb(255,0,0)');
            // netControl.links = [...netControl._links, ...netControl.deletedLinks];
            // add to the control
            dynamicVizs.push(netControl);
            netPlot.add(sliceHolder);
            // net.nodes.forEach(n => {
            //     if (!dynamicVizs.links[n.id]) {
            //         dynamicVizs.links[n.id] = {data: [], _visible: false};
            //         dynamicVizs.links[n.id].id = n.id;
            //     }
            //     dynamicVizs.links[n.id].data.push(n);
            // });
        });
        // if (dynamicVizs[0]) {
        //     dynamicVizs[0].links.forEach(d => d._visible = true)
        //     dynamicVizs[0].nodes._alpha = dynamicVizs[0].nodes._alpha.map(d => graphicopt.component.dot.opacity);
        // }
        // let connectedLinks = new THREE.Object3D();
        // Object.keys(dynamicVizs.links).forEach(k => {
        //     const el = createLineSegment(dynamicVizs.links[k], '#007');
        //     dynamicVizs.links[k].el = el;
        //     connectedLinks.add(el);
        // });
        // netPlot.add(connectedLinks);

        start();
    };

    function onlinkopacity() {
        setTimeout(() => {
            dynamicVizs.forEach(d => {
                d.links.forEach(lk => {
                        if (lk.visible && lk.material.opacity) {
                            lk.material.opacity = graphicopt.component.link.opacity;
                        }
                    }
                )
            })
            isneedrender = true;
        });
    }

    function onNetworkExpandXY() {
        setTimeout(() => {
            isneedCompute = true;
            render(true);
            isneedrender = true;
        });
    }

    master.generateTable = function () {
        $("#modelWorkerInformation").draggable({containment: "parent", scroll: false});
        needRecalculate = true;
        $('#modelSelectionInformation .tabs').tabs({
            onShow: function () {
                graphicopt.isSelectionMode = this.index === 1;
                handle_selection_switch(graphicopt.isSelectionMode);
            }
        });
        d3.select('#modelWorkerInformation table').selectAll('*').remove();
        table_info = d3.select('#modelWorkerInformation table')
            .html(` <colgroup><col span="1"><col span="1" style="width: 100px;"></colgroup>`);
        // .styles({'width':tableWidth+'px'});
        let tableData = [
            [
                {text: "Input", type: "title"},
                {label: '#Time-steps', content: (data.net ?? []).length, variable: 'datain'},
            ],
            [
                {text: "Settings", type: "title"},
            ],
            [
                {text: "Output", type: "title"},
            ]
        ];
        d3.values(self.controlPanel).forEach(d => {
            tableData[1].push({label: d.text, type: d.type, content: d, variable: d.variable, class: d.class})
        });
        d3.values(controlPanelGeneral).forEach(d => {
            tableData[1].push({
                label: d.text,
                type: d.type,
                content: d,
                variable: d.variable,
                variableRoot: d.variableRoot,
                id: d.id,
                class: d.class
            })
        });
        d3.keys(self.formatTable).forEach(k => formatTable[k] = self.formatTable[k]);
        tableData[2] = [...tableData[2], ...self.outputSelection];
        let tbodys = table_info.selectAll('tbody').data(tableData);
        tbodys
            .enter().append('tbody')
            .selectAll('tr').data(d => d)
            .enter().append('tr')
            .attr('id', d => d.id ? d.id : null)
            .attr('class', d => d.class ? d.class : null)
            .selectAll('td').data(d => d.type === "title" ? [d] : [{text: d.label}, d.type ? {
            content: d.content,
            variable: d.variable,
            variableRoor: d.variableRoot
        } : {text: d.content, variable: d.variable}])
            .enter().append('td')
            .attr('colspan', d => d.type ? "2" : null)
            .style('text-align', (d, i) => d.type === "title" ? "center" : (i ? "right" : "left"))
            .attr('class', d => d.variable)
            .each(updateTableControl);
    };

    function updateTableControl(d) {
        if (d.text !== undefined) // value display only
            d3.select(this).text(d.text);
        else { // other component display
            let formatvalue = formatTable[d.content.variable] || (e => Math.round(e));
            if (d.content.type === "slider") {
                let div = d3.select(this).append('div').attr('class', 'valign-wrapper').style('width', '' + d.content.width).style('margin-top', '7px');
                noUiSlider.create(div.node(), {
                    start: (graphicopt.opt[d.content.variable] || (d.content.variableRoot ? d.content.variableRoot[d.content.variable] : undefined)) || d.content.range[0],
                    connect: 'lower',
                    tooltips: {
                        to: function (value) {
                            return formatvalue(value)
                        }, from: function (value) {
                            return +value.split('1e')[1];
                        }
                    },
                    step: d.content.step || 1,
                    orientation: 'horizontal', // 'horizontal' or 'vertical'
                    range: {
                        'min': d.content.range[0],
                        'max': d.content.range[1],
                    },
                });
                div.node().noUiSlider.on("change", function () { // control panel update method
                    if (!d.content.variableRoot) {
                        graphicopt.opt[d.content.variable] = +this.get();
                    } else
                        d.content.variableRoot[d.content.variable] = +this.get();
                    if (d.content.callback)
                        d.content.callback();
                    else {
                        obitTrigger = true;
                        start();
                    }
                });
            } else if (d.content.type === "checkbox") {
                let div = d3.select(this).style('width', d.content.width).append('label').attr('class', 'valign-wrapper left-align');
                div.append('input')
                    .attr("type", "checkbox")
                    .attr("class", "filled-in")
                    .on('change', function () {
                        graphicopt[d.content.variable] = this.checked;
                        if (d.content.callback)
                            d.content.callback();
                    }).node().checked = graphicopt[d.content.variable];
                div.append('span')
            } else if (d.content.type === "switch") {
                let div = d3.select(this).style('width', d.content.width).classed('switch', true)
                    .append('label').attr('class', 'valign-wrapper')
                    .html(`${d.content.labels[0]}<input type="checkbox"><span class="lever"></span>${d.content.labels[1]}`)
                div.select('input').node().checked = (graphicopt.opt[d.content.variable] + "") === d.content.labels[1];
                div.select('input').on('change', function () {
                    graphicopt.opt[d.content.variable] = d.content.values[+this.checked];
                    if (d.content.callback)
                        d.content.callback();
                    else {
                        obitTrigger = true;
                        start();
                    }
                })
            } else if (d.content.type === "selection") {
                let label = _.isFunction(d.content.labels) ? d.content.labels() : d.content.labels;
                let values = _.isFunction(d.content.values) ? d.content.values() : d.content.values;
                let div = d3.select(this)
                    .append('select')
                    .style('width', d.content.width)
                    .on('change', function () {
                        setValue(d.content, values[this.value])
                        // if (!d.content.variableRoot) {
                        //     graphicopt[d.content.variable]  =  d.content.values[this.value];
                        // }else
                        //     graphicopt[d.content.variableRoot][d.content.variable] = d.content.values[this.value];
                        if (d.content.callback)
                            d.content.callback();
                        else {
                            obitTrigger = true;
                            start();
                        }
                    });
                div
                    .selectAll('option').data(label)
                    .enter().append('option')
                    .attr('value', (e, i) => i).text((e, i) => e);
                // let default_val = graphicopt[d.content.variable];
                // // if (d.content.variableRoot)
                // //     default_val = graphicopt[d.content.variableRoot][d.content.variable];
                // console.log(getValue(d.content))
                $(div.node()).val(values.indexOf(getValue(d.content)));
            }
        }
    }

    function updateTableInput() {
        table_info.select(`.datain`).text(e => data.net.length);
        d3.select('#modelCompareMode').property('checked', graphicopt.iscompareMode)
        d3.values(self.controlPanel).forEach((d) => {
            if (graphicopt.opt[d.variable] !== undefined) {
                try {
                    d3.select(`#modelWorkerInformation .${d.variable} div`).node().noUiSlider.set(graphicopt.opt[d.variable]);
                } catch (e) {
                    switch (d.type) {
                        case 'switch':
                            d3.select(`#modelWorkerInformation .${d.variable} input`).node().checked = graphicopt.opt[d.variable];
                            break;
                        case "selection":
                            // if (d.variable==='var1')
                            //     values = _.isFunction(d.values)?d.values():d.values;
                            $(d3.select(`#modelWorkerInformation .${d.variable} select`).node()).val(getValue(d));
                            break;
                    }
                }
            }
        });
    }

    function setValue(content, value) {
        if (_.isString(content.variableRoot))
            graphicopt[content.variableRoot][content.variable] = value;
        else {
            if (content.variableRoot === undefined)
                graphicopt[content.variable] = value;
            else
                content.variableRoot[content.variable] = value;
        }
    }

    function getValue(content) {
        if (_.isString(content.variableRoot))
            return graphicopt[content.variableRoot][content.variable];
        else {
            if (content.variableRoot === undefined)
                return graphicopt[content.variable];
            else
                return content.variableRoot[content.variable];
        }
    }

    function updateTableOutput(output) {
        d3.entries(output).forEach(d => {
            table_info.select(`.${d.key}`).text(e => d.value ? formatTable[e.variable] ? formatTable[e.variable](d.value) : d3.format('.4s')(d.value) : '_');
        });

    }

    function onSelectLine(id, time) {
        if (metricPlot) {
            const holder = metricPlot.getObjectByName('lineChartHolder');
            const timeMarker = metricPlot.getObjectByName('timeMarker');
            if (id !== undefined) {
                console.log(holder)
                if (holder) {
                    holder.children.forEach(c => {
                        if (c.name === 'lineChart' + id) {
                            c.visible = true;
                        } else {
                            c.visible = false;
                        }
                    });
                }
                if (timeMarker) {
                    timeMarker.visible = true;
                    timeMarker.position.z = scaleNormalTimestep(time);
                }
            } else {
                if (holder) {
                    holder.children.forEach(c => c.visible = true);
                }
                if (timeMarker)
                    timeMarker.visible = false;
            }
        }
    }

    function updatePlot() {
        scene.remove(metricPlot);
        const origin = [graphicopt.heightG() / 2, graphicopt.heightG() / 2, 0];
        metricPlot = new THREE.Object3D();
        metricPlot.position.x = origin[0];
        metricPlot.position.y = origin[1];
        metricPlot.position.z = origin[2];

        const yscale = d3.scaleLinear().domain([0, 1]).range([0, graphicopt.heightG() / 3]);
        const holderPlot = new THREE.Object3D();
        holderPlot.name = "lineChartHolder";
        metricPlot.add(holderPlot);
        data.root_nodes.forEach(d => {
            if (d.type === 'compute') {
                holderPlot.add(lineChart(data.datamap[d.id].map(d => d[graphicopt.plotMetric]), d.id));
            }
        });
        metricPlot.add(makeaxis());
        metricPlot.add(makeMarker());
        scene.add(metricPlot);


        isneedrender = true;

        function lineChart(path, name) {
            const points = path.map((d, i) => new THREE.Vector3(0, yscale(d), scaleNormalTimestep(i)));

            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            var material = new THREE.LineBasicMaterial({
                opacity: 1,
                linewidth: 1,
                color: 0x000000
            });
            let lineObj = new THREE.Line(geometry, material);
            lineObj.name = 'lineChart' + name;
            return lineObj;
        }

        function makeMarker() {
            const holder = new THREE.Object3D();
            holder.name = 'timeMarker';
            holder.visible = false;
            const material = new THREE.LineDashedMaterial({
                color: 0xff0000,
                dashSize: 1, gapSize: 0.5
            });

            const geometry = new THREE.Geometry();
            geometry.vertices.push(
                new THREE.Vector3(0, yscale.range()[0], 0),
                new THREE.Vector3(0, yscale.range()[1], 0)
            );
            const line = new THREE.Line(geometry, material);
            line.computeLineDistances();
            holder.add(line);
            return holder;
        }

        function makeaxis() {
            var dir = new THREE.Vector3(0, 1, 0);
            dir.normalize();
            var length = yscale.range()[1] - yscale.range()[0];
            var hex = 0x000000;
            var yaxisGroup = new THREE.Object3D();
            var arrowHelper = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, scaleNormalTimestep(0)), length, hex, 30, 10);
            arrowHelper.line.material.linewidth = 4;
            yaxisGroup.add(arrowHelper);
            let axis = yscale.copy();
            axis.domain(graphicopt.service[graphicopt.plotMetric].range);
            var loader = new THREE.FontLoader();

            loader.load('../TimeRadar/src/fonts/optimer_regular.typeface.json', function (font) {
                axis.ticks(5).forEach(t => {

                    var textGeo = new THREE.TextGeometry(axis.tickFormat()(t), {
                        font: font,
                        size: 20,
                        height: 1,
                        curveSegments: 12,
                        bevelEnabled: false
                    });
                    textGeo.computeBoundingBox();
                    textGeo.computeVertexNormals();
                    textGeo = new THREE.BufferGeometry().fromGeometry(textGeo);

                    // let textMesh1 = new THREE.Mesh(textGeo, new THREE.MeshPhongMaterial({color: 0x0000ff, flatShading: true}));
                    let textMesh1 = new THREE.Mesh(textGeo, new THREE.MeshBasicMaterial({color: 0x000000}));
                    textMesh1.name = 'TimeText';
                    textMesh1.position.x = -Math.log10(axis.domain()[1]) * 20;
                    textMesh1.position.y = axis(t);
                    textMesh1.position.z = scaleNormalTimestep(0);
                    // textMesh1.rotation.x = 0;
                    // textMesh1.rotation.y = Math.PI / 2;
                    textMesh1.quaternion.copy(camera.quaternion);
                    yaxisGroup.add(textMesh1)
                });
            });
            return yaxisGroup;
        }
    }

    master.controlPanelGeneral = function (_data) {
        if (arguments.length) {
            Object.keys(_data).forEach(k => {
                Object.keys(_data[k]).forEach(conf => {
                    controlPanelGeneral[k][conf] = _data[k][conf];
                })
            });
            if (table_info)
                table_info.selectAll('tbody').selectAll('tr').selectAll('td').each(updateTableControl);
            return master
        }
        return controlPanelGeneral;
    };

    master.stop = function () {
        terminateWorker();
        stop = true;
    };

    function terminateWorker() {
        workerList.forEach(w => {
            w.terminate();
        });
        workerList.length = 0;
    }

    master.onShowLineChart = function (choice) {
        graphicopt.plotMetric = choice;
        onShowLineChart();
    }
    master.data = function (_data) {
        if (arguments.length) {
            terminateWorker();
            data = _data;
            return master
        }
        return data;
    };
    master.color = function (_data) {
        return arguments.length ? (color = _data, master) : color;
    };
    master.service = function (_data) {
        return arguments.length ? (graphicopt.service = _data, master) : graphicopt.service;
    };
    master.getColorScale = function (_data) {
        return arguments.length ? (getColorScale = _data ? _data : function () {
            return color
        }, master) : getColorScale;
    };
    master.graphicopt = function (_data) {
        if (arguments.length) {
            d3.keys(_data).forEach(k => graphicopt[k] = _data[k]);
            return master;
        } else
            return graphicopt;
    };
    master.getRenderFunc = function (_data) {
        return arguments.length ? (getRenderFunc = _data, master) : getRenderFunc;
    };
    master.getDrawData = function (_data) {
        return arguments.length ? (getDrawData = _data, master) : getDrawData;
    };
    master.onFinishDraw = function (_data) {
        onFinishDraw.push(_data)
        return master;
    };

    master.g = function () {
        return g
    };
    master.isFreeze = function () {
        return isFreeze
    };

    return master;
};

function forceFunc(data,postMessage) {
    let canSend = false;
    let minAlpha = 1;
    let totalTime_marker;
    postMessage({action: 'message', value: {'percentage': 20, 'message': 'Data received. Process data...'}});
    totalTime_marker = performance.now();

    const net = data;
    const forces = [];
    const root_nodes = {};
    if (net.length) {
        net.forEach(function (n, ni) {
            const nodes = n.nodes;
            const links = n.links;
            const force = d3.forceSimulation()
                .force("charge", d3.forceManyBody().strength(-10))
                .force("link", d3.forceLink().id(d => d.id))
            // .force("x", d3.forceX())
            // .force("y", d3.forceY())
            // .on("tick", ticked);
            force.stop();
            force.nodes(nodes);
            force.force("link").links(n.links);
            force.stop();
            if (ni) {
                const filtered_nodes = {};
                n.filtered_links = [];
                links.forEach(l => {
                        if (l.isNew) {
                            n.filtered_links.push(l);
                            filtered_nodes[l.source.id] = l.source;
                            filtered_nodes[l.target.id] = l.target;
                        }
                    }
                );
                n.filtered_nodes = Object.values(filtered_nodes);
                nodes.forEach(n => {
                    if (!filtered_nodes[n.id]) {
                        n.x = undefined;
                        n.y = undefined;
                    }
                    root_nodes[n.id] = n.parent;
                })
            } else {
                n.filtered_nodes = nodes;
                n.filtered_links = links;
                nodes.forEach(n => {
                    root_nodes[n.id] = n.parent;
                });
            }
            if (n.deletedLinks) {
                n.deletedLinks = n.deletedLinks.map(l => {
                    return {
                        source: l.source.parent.timeArr[ni] ?? l.source,
                        target: l.target.parent.timeArr[ni] ?? l.target,
                        value: l.value,
                        color: 'rgb(255,0,0)',
                        isDelete: true
                    };
                });
            }
            if (n.filtered_nodes.length) {
                console.log('Net t=', ni);
                console.log('#nodes :', n.filtered_nodes.length);
                console.log('#links :', n.filtered_links.length);
                force.nodes(n.filtered_nodes);
                force.force("link").links(n.filtered_links);
                force.stop();
                // force.on("tick", ticked)
                forces.push(force);
            } else {
                console.log('skip t=', ni);
            }
        });
        console.log('#skip: ', net.length - forces.length);
        postMessage({action: 'updateHighlight', sol: net, totalForces: forces.length});
        setInterval(function () {
            canSend = true;
        }, 1000 / 24);
        forces.forEach(function (force) {
            force.alpha(1);
        });
        while (minAlpha > 0.001) {
            forces.forEach(function (force) {
                force.tick();
                minAlpha = Math.min(minAlpha, force.alpha());
            });
            Object.values(root_nodes).forEach(n => {
                n.x = d3.mean(n.timeArr, e => e ? e.x : undefined);
                n.y = d3.mean(n.timeArr, e => e ? e.y : undefined);
            });
            forces.forEach(function (force) {
                force.nodes().forEach(d => {
                    d.x += (d.parent.x - d.x) * 0.4;
                    d.y += (d.parent.y - d.y) * 0.4;
                });
            });
        }
        net.forEach((n,ni)=>{
            n.nodes.forEach(target=>{
                target._x = target.x?? target.parent.x;
                target._y = target.y?? target.parent.y;
            })
        })
        postMessage({
            action: 'stable',
            value: {totalTime: performance.now() - totalTime_marker, alpha: minAlpha},
            status: "done",
            sol: net
        });

    } else {
        postMessage({
            action: 'stable',
            value: {totalTime: performance.now() - totalTime_marker},
            status: "done",
            sol: undefined
        });
    }
}
