d3.TimeSpace = function () {
    let graphicopt = {
            margin: {top: 40, right: 40, bottom: 40, left: 40},
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
            },

            opt: {
                // dim: 2, // dimensionality of the embedding (2 = default)
                windowsSize: 1,
            },radaropt : {
                // summary:{quantile:true},
                mini:true,
                levels:6,
                gradient:true,
                w:40,
                h:40,
                showText:false,
                margin: {top: 0, right: 0, bottom: 0, left: 0},
            },
            linkConnect: true,
            isSelectionMode: false,
            component:{
                dot:{size:5,opacity:0.2},
                link:{size:0.8,opacity:0.1},
            }
        },
        controlPanelGeneral = {
            isSelectionMode: {text: "Selection", type: "checkbox", variable: 'isSelectionMode', width: '100px',callback:()=>{handle_selection_switch(graphicopt.isSelectionMode);}},
            linkConnect: {text: "Draw link", type: "checkbox", variable: 'linkConnect', width: '100px',callback:()=>render(!isBusy)},
            dim: {text: "Dim", type: "switch", variable: 'dim',labels:['2D','3D'],values:[2,3], width: '100px',callback:()=>{obitTrigger=true;start();}},
            windowsSize: {
                text: "Windows size",
                range: [1, 21],
                type: "slider",
                variable: 'windowsSize',
                width: '100px',callback:()=>{master.stop(); windowsSize = graphicopt.opt.windowsSize; handle_data_TimeSpace(tsnedata);}
            },
        },
        formatTable = {
            'time': function(d){return millisecondsToStr(d)},
            'totalTime': function(d){return millisecondsToStr(d)},
            'iteration': function(d){return d},
            'stopCondition': function(d) {return '1e'+Math.round(d)}
        },tableWidth = 200
        ,
        runopt = {},
        isBusy = false,
        stop = false;
    let modelWorker,colorscale;
    let master={},solution,datain=[],filter_by_name=[],table_info,path,cluster=[];
    let xscale=d3.scaleLinear(),yscale=d3.scaleLinear();
    // grahic 
    let camera,scene,axesHelper,controls,raycaster,INTERSECTED =[] ,mouse ,points,lines,scatterPlot,colorarr,renderer,view,zoom,background_canvas,background_ctx,front_canvas,front_ctx,svg;
    
    let fov = 100,
    near = 0.1,
    far = 7000;
    //----------------------color----------------------
    let createRadar = _.partialRight(createRadar_func,graphicopt.radaropt,colorscale);
    //----------------------drag-----------------------
    var lassoTool,mouseoverTrigger = true;
    let drag = ()=>{
        function dragstarted(d) {
            // do something
            mouseoverTrigger = false;
            let coordinator = d3.mouse(this);
            mouse.x = (coordinator[0]/graphicopt.width)*2- 1;
            mouse.y = -(coordinator[1]/graphicopt.height)*2+ 1;
            lassoTool.lassoPolygon = [coordinator];
            lassoTool.start();
            lassoTool.needRender = true;
        }

        function dragged(d) {
            let coordinator = d3.mouse(this);
            mouse.x = (coordinator[0]/graphicopt.width)*2- 1;
            mouse.y = -(coordinator[1]/graphicopt.height)*2+ 1;
            lassoTool.lassoPolygon.push(coordinator);
            lassoTool.needRender = true;


        }

        function dragended(d) {
            mouseoverTrigger = true;
            lassoTool.end();
            // var allSelected = lassoTool.select();
            //
            // for ( var i = 0; i < allSelected.length; i ++ ) {
            //
            //     allSelected[ i ].material.emissive.set( 0xffffff );
            //
            // }

        }

        return d3.drag().touchable(navigator.maxTouchPoints)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    };
    function handle_selection_switch(trigger){
        controls.enabled = !trigger;
        if (trigger){
            lassoTool = new THREE.LassoTool( camera, points, graphicopt ,svg);
            d3.select('#modelWorkerScreen').call(drag());
            d3.select('#modelSelectionInformation').classed('hide',false);
            // selection tool
        }else{
            if(lassoTool)
                lassoTool.reset();
            d3.select('#modelWorkerScreen').on('mousedown.drag', null);
            d3.select('#modelSelectionInformation').classed('hide',true);
            // d3.select('#modelWorkerScreen').on('touchstart.drag', null);
        }
    }
    function renderSvgRadar() {
        let datapoint = svg.selectAll(".linkLinegg").interrupt().data(d => datain.map(e => e.__metrics), d => d.name + d.timestep);
        datapoint.exit().remove();
        let datapoint_n = datapoint.enter().append('g')
            .attr('class', 'linkLinegg timeline');
        datapoint_n.each(function (d, i) {
            createRadar(d3.select(this).select('.linkLineg'), d3.select(this), d, {colorfill: true}).classed('hide', d.hide);// hide 1st radar
        });

        datapoint_n.merge(datapoint).attr('transform', function (d) {
            return `translate(${xscale(d.position[0])},${yscale(d.position[1])})`
        })
            .on('mouseover', d => {
                master.hightlight([d.name_or])
                svg.selectAll('.linkLinegg').filter(e => d.name_or !== e.name_or).classed('hide', true)
                // d3.selectAll('.h'+d[0].name).dispatch('mouseover');
            }).on('mouseleave', d => {
            master.unhightlight(d.name_or)
            svg.selectAll('.linkLinegg.hide').classed('hide', false)
            // d3.selectAll('.h'+d[0].name).dispatch('mouseleave');
        })
    }
    let obitTrigger= true;
    function start() {
        axesHelper.toggleDimension(graphicopt.opt.dim);
        // handle_selection_switch(graphicopt.isSelectionMode);
        if (graphicopt.opt.dim===2) {
            controls.enableRotate = false;
            controls.screenSpacePanning  = true;

            controls.target.set( 0, 0, 0 );
            controls.enableZoom = true;
            controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
            controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
        }else{
            controls.enableRotate = true;
            controls.screenSpacePanning  = false;
            controls.target.set( 0, 0, 0 );
            controls.enableZoom = true;
            controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
            controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
        }
        if (obitTrigger) {
            setUpZoom();
            obitTrigger = false;
        }

        svg.selectAll('*').remove();
        if (modelWorker)
            modelWorker.terminate();
        modelWorker = new Worker(self.workerPath);
        // modelWorker.postMessage({action:"initcanvas", canvas: offscreen, canvasopt: {width: graphicopt.widthG(), height: graphicopt.heightG()}}, [offscreen]);
        modelWorker.postMessage({action: "initcanvas", canvasopt: {width: graphicopt.widthG(), height: graphicopt.heightG()}});
        console.log(`----inint ${self.workerPath} with: `, graphicopt.opt)


        modelWorker.postMessage({action: "colorscale", value: colorarr});
        // modelWorker.postMessage({action: "initmodelWorker", value: graphicopt.opt});
        modelWorker.postMessage({action: "initDataRaw",opt:graphicopt.opt, value: datain, clusterarr: cluster});
        modelWorker.addEventListener('message', ({data}) => {
            switch (data.action) {
                case "render":
                    isBusy = true;
                    xscale.domain(data.xscale.domain);
                    yscale.domain(data.yscale.domain);
                    solution = data.sol;
                    updateTableOutput(data.value);
                    render();
                    isBusy = false;
                    break;
                case "stable":
                    modelWorker.terminate();
                    render(true);
                    break;
                default:
                    break;
            }
        })
    }

    master.init = function(arr,clusterin) {
        datain = arr;
        datain.sort((a,b)=>a.timestep-b.timestep);
        mapIndex = [];
        datain.forEach((d,i)=>d.show?mapIndex.push(i):undefined);
        cluster = clusterin
        handle_data(datain);
        updateTableInput();
        xscale.range([-graphicopt.widthG()/2,graphicopt.widthG()/2]);
        yscale.range([-graphicopt.heightG()/2,graphicopt.heightG()/2]);
        colorarr = colorscale.domain().map((d, i) => ({name: d, order: +d.split('_')[1], value: colorscale.range()[i]}))
        colorarr.sort((a, b) => a.order - b.order);

        far = graphicopt.width/2 /Math.tan(fov/180*Math.PI/2)*10;
        camera = new THREE.PerspectiveCamera(fov, graphicopt.width/graphicopt.height, near, far + 1);
        scene = new THREE.Scene();
        axesHelper = createAxes( graphicopt.widthG()/4 );
        scene.background = new THREE.Color(0xffffff);
        scatterPlot = new THREE.Object3D();
        scatterPlot.add( axesHelper );
        scatterPlot.rotation.y = 0;
        points = createpoints(scatterPlot);
        path = {};
        datain.forEach(function (target, i) {
            target.__metrics.position = [0,0,0];
            if (!path[target.name])
                path[target.name] = [];
            path[target.name].push({name: target.name, timestep: target.timestep, value: [0,0,0], cluster: target.cluster});
        });
        lines = createLines(scatterPlot);
        scene.add(scatterPlot);

        // Add canvas
        renderer = new THREE.WebGLRenderer({canvas: document.getElementById("modelWorkerScreen")});
        renderer.setSize(graphicopt.width, graphicopt.height);
        renderer.render(scene, camera);
        // zoom set up
        view = d3.select(renderer.domElement);
        axesHelper.toggleDimension(graphicopt.opt.dim);
        zoom = d3.zoom()
            .scaleExtent([getScaleFromZ(far), getScaleFromZ(10)])
            .on('zoom', () =>  {
                let d3_transform = d3.event.transform;
                zoomHandler(d3_transform);
            });
        raycaster = new THREE.Raycaster();
        raycaster.params.Points.threshold = 1;
        mouse = new THREE.Vector2();

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.addEventListener("change", () => renderer.render(scene, camera));
        setUpZoom();
        stop = false;


        animate();
        // background_canvas = document.getElementById("modelWorkerScreen");
        // background_canvas.width  = graphicopt.width;
        // background_canvas.height = graphicopt.height;
        // background_ctx = background_canvas.getContext('2d');
        // front_canvas = document.getElementById("modelWorkerScreen_fornt");
        // front_canvas.width  =  graphicopt.width;
        // front_canvas.height = graphicopt.height;
        // front_ctx = front_canvas.getContext('2d');
        svg = d3.select('#modelWorkerScreen_svg').attrs({width: graphicopt.width,height:graphicopt.height});

        d3.select('#modelWorkerInformation+.title').text(self.name);
        handle_selection_switch(graphicopt.isSelectionMode);
        start();

        return master;
    };
    // Three.js render loop
    function createAxes(length){
        var material = new THREE.LineBasicMaterial( { color: 0x000000 } );
        var geometry = new THREE.BufferGeometry().setFromPoints(  [
            new THREE.Vector3( 0, 0, 0), new THREE.Vector3( length, 0, 0),
            new THREE.Vector3( 0, 0, 0), new THREE.Vector3( 0, length, 0),
            new THREE.Vector3( 0, 0, 0), new THREE.Vector3( 0, 0, length)]);
        let axesHelper = new THREE.LineSegments( geometry, material );
        axesHelper.toggleDimension = function (dim){
            if (dim===3){
                axesHelper.geometry.dispose();
                axesHelper.geometry = new THREE.BufferGeometry().setFromPoints( [
                    new THREE.Vector3( 0, 0, 0), new THREE.Vector3( length, 0, 0),
                    new THREE.Vector3( 0, 0, 0), new THREE.Vector3( 0, length, 0),
                    new THREE.Vector3( 0, 0, 0), new THREE.Vector3( 0, 0, length)]);
            }else if(dim===2){
                axesHelper.geometry.dispose();
                axesHelper.geometry = new THREE.BufferGeometry().setFromPoints( [
                    new THREE.Vector3( 0, 0, 0), new THREE.Vector3( length, 0, 0),
                    new THREE.Vector3( 0, 0, 0), new THREE.Vector3( 0, length, 0)]);
            }
        };
        return axesHelper;
    }
    let radarChartclusteropt = {
        margin: {top: 0, right: 0, bottom: 0, left: 0},
        w: 200,
        h: 200,
        radiuschange: false,
        levels:6,
        dotRadius:2,
        strokeWidth:1,
        maxValue: 0.5,
        isNormalize:true,
        showHelperPoint: false,
        roundStrokes: true,
        ringStroke_width: 0.15,
        ringColor:'black',
        fillin:0.5,
        boxplot:true,
        animationDuration:100,
        showText: false};
    function animate() {
        if (!stop) {
            //update raycaster with mouse movement
            raycaster.setFromCamera(mouse, camera);
            // calculate objects intersecting the picking ray
            // console.log(mouse)
            if (mouseoverTrigger) {
                var intersects = raycaster.intersectObject(points);
                //count and look after all objects in the diamonds group
                var geometry = points.geometry;
                var attributes = geometry.attributes;
                if (intersects.length > 0) {
                    if (INTERSECTED.indexOf(intersects[0].index) === -1) {
                        let target = datain[intersects[0].index];
                        INTERSECTED = [];
                        datain.forEach((d, i) => {
                            if (d.name === target.name) {
                                INTERSECTED.push(i);
                                attributes.alpha.array[i] = 1;
                                lines[d.name].material.opacity = 1;
                            } else {
                                attributes.alpha.array[i] = 0.1;
                                lines[datain[i].name].material.opacity = 0;
                            }
                        });
                        let rScale = d3.scaleLinear().range([graphicopt.component.dot.size, graphicopt.component.dot.size * 2])
                            .domain([INTERSECTED.length, 0]);
                        INTERSECTED.forEach((d, i) => {
                            attributes.size.array[d] = rScale(i);
                        });
                        attributes.size.needsUpdate = true;
                        attributes.alpha.needsUpdate = true;
                        console.log(target.name);
                        showMetrics(target.name);
                    }
                } else if (INTERSECTED.length) {
                    datain.forEach((d, i) => {
                        if (d.name !== target.name) {
                            attributes.alpha.array[i] = 1;
                            lines[datain[i].name].material.opacity = 1;
                        }
                    });
                    INTERSECTED.forEach((d, i) => {
                        attributes.size.array[d] = graphicopt.component.dot.size;
                    });
                    attributes.size.needsUpdate = true;
                    attributes.alpha.needsUpdate = true;
                    INTERSECTED = [];
                }
            }else if (lassoTool.needRender) {
                let newClustercolor = d3.color('#000000');
                for ( var i = 0; i < lassoTool.collection.length; i ++ ) {
                    let currentIndex = lassoTool.collection[ i ];
                    let currentData = datain[mapIndex[currentIndex]];
                    let currentColor = d3.color(colorarr[currentData.cluster].value);
                    points.geometry.attributes.customColor.array[currentIndex*3]= currentColor.r/255;
                    points.geometry.attributes.customColor.array[currentIndex*3+1]= currentColor.g/255;
                    points.geometry.attributes.customColor.array[currentIndex*3+2]= currentColor.b/255;

                }


                var allSelected = lassoTool.select();
                var allSelected_Data = [];
                for ( var i = 0; i < allSelected.length; i ++ ) {
                    allSelected_Data.push(datain[mapIndex[allSelected[i]]])
                    let currentIndex = lassoTool.collection[ i ];
                    points.geometry.attributes.customColor.array[currentIndex*3]= newClustercolor.r/255;
                    points.geometry.attributes.customColor.array[currentIndex*3+1]= newClustercolor.g/255;
                    points.geometry.attributes.customColor.array[currentIndex*3+2]= newClustercolor.b/255;
                    points.geometry.attributes.customColor.needsUpdate = true;
                }
                const allSelected_Metric = graphicopt.radaropt.schema.map((s,i)=>{
                    let d = allSelected_Data.map(e=>e[i]);
                    if(d.length)
                        return {axis: s.text, value: ss.mean(d),minval:ss.min(d),maxval:ss.max(d)}
                    else
                        return {axis: s.text, value: 0,minval:0,maxval:0}
                });

                radarChartclusteropt.schema = graphicopt.radaropt.schema
                radarChartclusteropt.color = function(){return newClustercolor};
                d3.select('.radarTimeSpace .selectionNum').text(allSelected.length)
                RadarChart(".radarTimeSpace", [allSelected_Metric], radarChartclusteropt,"").select('.axisWrapper .gridCircle').classed('hide',true);
                lassoTool.needRender = false;
            }
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
    }
    // function triggerInformationWindow(active){
    //     d3.select('#modelWorkerInformation').classed('hide',active);
    //     if (active)
    //
    // }
    function showMetrics(name) {
        let maxstep = sampleS.timespan.length - 1;
        let last_timestep = sampleS.timespan[maxstep];
        let layout = tooltip_lib.layout();
        layout.axis.x.domain = [[sampleS.timespan[0], last_timestep]]; // TODO replace this!
        layout.axis.x.tickFormat = [multiFormat];
        const scaletime = d3.scaleTime().domain(layout.axis.x.domain[0]).range([0, maxstep]);
        layout.axis.y.label = [];
        layout.axis.y.domain = [];
        layout.axis.y.tickFormat = [];
        layout.background = {
            type: 'discrete',
            value: path[name].map((v, i) => {
                return {
                    x0: scaletime.invert(v.timestep),
                    x1: path[name][i + 1] ? scaletime.invert(path[name][i + 1].timestep) : undefined,
                    color: colorarr[v.cluster].value
                }
            })
        };
        layout.background.value[layout.background.value.length - 1].x1 = last_timestep;
        let cdata = datain.filter(d=>d.name===name);

        const data_in = graphicopt.radaropt.schema.map((s,si) => {
            let temp = hostResults[name][serviceListattr[s.idroot]].map((e,ti) => {
                return {
                    y: e[s.id],
                    x: scaletime.invert(ti),
                }
            });
            temp.label = h;
            let data_temp = [temp];
            layout.axis.y.label.push(s.text);
            layout.axis.y.domain.push(s.range);
            if (s.range[1] > 1000)
                layout.axis.y.tickFormat.push(d3.format('~s'));
            else
                layout.axis.y.tickFormat.push(null);
            return data_temp;
        });

        layout.title = "";
        layout.title2 = name;
        var target = d3.select('#tipfollowscursorDiv')
            .node();
        console.log(data_in)
        tooltip_lib.graphicopt({
            width: tooltip_opt.width,
            height: 100,
            margin: tooltip_opt.margin
        }).data(data_in).layout(layout).show(target);
    }
    function setUpZoom() {
        // view.call(zoom);
        let initial_scale = 1;
        // var initial_transform = d3.zoomIdentity.translate(graphicopt.width/2, graphicopt.height/2).scale(initial_scale);
        // zoom.transform(view, initial_transform);
        camera.position.set(0, 0, getZFromScale(1));
    }
    function zoomHandler(d3_transform) {
        let scale = d3_transform.k;
        let x = -(d3_transform.x - graphicopt.width / 2) / scale;
        let y = (d3_transform.y - graphicopt.height / 2) / scale;
        let z = getZFromScale(scale);
        if (graphicopt.dim===2) {
            camera.position.set(x, y, z);
        }else{
            if (z===camera.position.z) {
                scatterPlot.rotation.y = x * 0.01;
                scatterPlot.rotation.x = y * 0.01;
            }
            // camera.position.z = z;
            camera.position.set(x, y, z);
        }
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
    function getScaleFromZ (camera_z_position) {
        let half_fov = fov/2;
        let half_fov_radians = toRadians(half_fov);
        let half_fov_height = Math.tan(half_fov_radians) * camera_z_position;
        let fov_height = half_fov_height * 2;
        let scale = graphicopt.height / fov_height; // Divide visualization height by height derived from field of view
        return scale;
    }

    function getZFromScale(scale) {
        let half_fov = fov/2;
        let half_fov_radians = toRadians(half_fov);
        let scale_height = graphicopt.height / scale;
        let camera_z_position = scale_height / (2 * Math.tan(half_fov_radians));
        return camera_z_position;
    }

    function toRadians (angle) {
        return angle * (Math.PI / 180);
    }

    function createpoints(g){
        let pointsGeometry = new THREE.BufferGeometry();

        let datafiltered = mapIndex.map(i=>datain[i]);
        let colors =  new Float32Array( datafiltered.length * 3 );
        let pos =  new Float32Array( datafiltered.length * 3 );
        let alpha =  new Float32Array( datafiltered.length );
        let sizes =  new Float32Array( datafiltered.length);
        for (let i=0; i< datafiltered.length;i++) {
            let target = datafiltered[i];
            // Set vector coordinates from data
            // let vertex = new THREE.Vector3(0, 0, 0);
            pos[i*3+0]= 0;
            pos[i*3+1]= 0;
            pos[i*3+2]= 0;
            // let color = new THREE.Color(d3.color(colorarr[target.cluster].value)+'');
            let color = d3.color(colorarr[target.cluster].value);
            colors[i*3+0]= color.r/255;
            colors[i*3+1]= color.g/255;
            colors[i*3+2]= color.b/255;
            alpha[i]= 1;
            sizes[i] = graphicopt.component.dot.size;
        }
        pointsGeometry.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
        pointsGeometry.setAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
        pointsGeometry.setAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
        pointsGeometry.setAttribute( 'alpha', new THREE.BufferAttribute( alpha, 1 ) );
        pointsGeometry.boundingBox = null;
        pointsGeometry.computeBoundingSphere();
        // pointsGeometry.colors = colors;

        // let pointsMaterial = new THREE.PointsMaterial({
        //     size: graphicopt.component.dot.size,
        //     sizeAttenuation: false,
        //     map: new THREE.TextureLoader().load("src/images/circle.png"),
        //     vertexColors: THREE.VertexColors,
        //     transparent: true
        // });
        let pointsMaterial = new THREE.ShaderMaterial( {

            uniforms:       {
                color: { value: new THREE.Color( 0xffffff ) },
                pointTexture: { value: new THREE.TextureLoader().load( "src/images/circle.png" ) }

            },
            vertexShader:   document.getElementById( 'vertexshader' ).textContent,
            fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
            transparent:    true

        });

        let p = new THREE.Points(pointsGeometry, pointsMaterial);
        p.frustumCulled = false;
        g.add(p);
        return p;
    }
    let mapIndex =[];
    function render (isradar){
        if(solution) {
            createRadar = _.partialRight(createRadar_func, graphicopt.radaropt, colorscale);
            solution.forEach(function (d, i) {
            // mapIndex.forEach(function (i) {
                const target = datain[i];
                target.__metrics.position = d;
                let pointIndex = mapIndex.indexOf(i);
                if (pointIndex!==undefined){
                    let p = points.geometry.attributes.position.array;
                    p[pointIndex*3+0] = xscale(d[0]);
                    p[pointIndex*3+1] = yscale(d[1]);
                    p[pointIndex*3+2] = xscale(d[2])||0;
                }
                    // points.geometry.vertices[pointIndex] = new THREE.Vector3(xscale(d[0]), yscale(d[1]), xscale(d[2])||0);

                const posPath = path[target.name].findIndex(e=>e.timestep===target.timestep);
                path[target.name][posPath].value = d;
                lines[target.name].geometry.vertices[posPath*2] = new THREE.Vector3(xscale(d[0]), yscale(d[1]), xscale(d[2])||0);
                if (posPath)
                    lines[target.name].geometry.vertices[posPath*2-1] = new THREE.Vector3(xscale(d[0]), yscale(d[1]), xscale(d[2])||0);
                lines[target.name].geometry.verticesNeedUpdate = true;
            });
            points.geometry.attributes.position.needsUpdate = true;
            points.geometry.boundingBox = null;
            points.geometry.computeBoundingSphere();

            visiableLine(graphicopt.linkConnect)


            // if (isradar && datain.length < 5000) {
            //     renderSvgRadar();
            // }
        }
    }

    function handle_data(data){
        data.forEach(d=>{
            d.__metrics = graphicopt.radaropt.schema.map((s,i)=>{
                return {axis: s.text, value: data[i]}
            });
            d.__metrics.name = d.clusterName;
            d.__metrics.name_or = d.name;
            d.__metrics.timestep = d.timestep;
        })
    }

    master.stop = function(){
        if (modelWorker) {
            modelWorker.terminate();
            stop = true;
            // renderSvgRadar();
        }
    };



    function positionLink_canvas(path, ctx) { //path 4 element
        // return p = new Path2D(positionLink(a,b));
        d3.line()
            .x(function (d) {
                return xscale(d[0]);
            })
            .y(function (d) {
                return yscale(d[1]);
            })
            .curve(d3.curveCardinalOpen.tension(0.75))
            .context(ctx)(path);
        return ctx.toShapes(true);
    }
    function createLine(path){
        let pointsGeometry = new THREE.Geometry();

        for (let i=0;i <path.length-1;i++){
            let vertex = new THREE.Vector3(0, 0, 0);
            let color = new THREE.Color(d3.color(colorarr[path[i].cluster].value)+'');
            pointsGeometry.vertices.push(vertex);
            pointsGeometry.colors.push(color);
            pointsGeometry.vertices.push(vertex);
            pointsGeometry.colors.push(color);
        }
        pointsGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        pointsGeometry.colors.push( new THREE.Color(d3.color(colorarr[path[path.length-1].cluster].value)+''));


        var material = new THREE.LineBasicMaterial( {
            opacity:1,
            color: 0xffffff,
            vertexColors: THREE.VertexColors,
            transparent: true
        } );
        let lineObj = new THREE.LineSegments( pointsGeometry, material );
        lineObj.frustumCulled = false;
        return lineObj;
    }
    function createLines(g){
        let lines = {};
        Object.keys(path).forEach(k=>{
            lines[k] = createLine(path[k]);
            g.add(lines[k]);
        });
        return lines;
    }
    function visiableLine(isvisiable){
        Object.keys(lines).forEach(l=>{
            lines[l].visible = isvisiable;
        })
    }
    function drawline(ctx,path,cluster) {
        positionLink_canvas(path,new THREE.ShapePath());
        let fillColor = d3.color(colorarr[cluster].value);
        fillColor.opacity = graphicopt.component.link.opacity;
        ctx.strokeStyle = fillColor+'';
        ctx.stroke();
    }



    master.hightlight = function(namearr){
        filter_by_name = namearr||[];
        if (filter_by_name.length) {
            front_ctx.clearRect(0, 0, graphicopt.width, graphicopt.height);
            d3.values(path).filter(d=>(filter_by_name.find(n => n === d[0].name)&& d.length)>1?d.sort((a,b)=>a.t-b.t):false).forEach(path=>{
                // make the combination of 0->4 [0,0,1,2] , [0,1,2,3], [1,2,3,4],[2,3,4,4]
                for (let i=0;i<path.length-1;i++){
                    let a =( path[i-1]||path[i]).value;
                    let b = path[i].value;
                    let c = path[i+1].value;
                    let d = (path[i+2]||path[i+1]).value;
                    drawline(front_ctx,[a,b,c,d],path[i].cluster);
                }
            })

            d3.select(background_canvas).style('opacity', 0.1);
            d3.select(front_canvas).style('opacity', 1);


        }
    };
    master.unhightlight = function() {
        filter_by_name = [];
        d3.select(background_canvas).style('opacity',1);
        d3.select(front_canvas).style('opacity',0);
    };
    let self = this;
    master.generateTable = function(){
        d3.select('#modelWorkerInformation table').selectAll('*').remove();
        table_info = d3.select('#modelWorkerInformation table').styles({'width':tableWidth+'px'});
        let tableData = [
            [
                {text:"Input",type:"title"},
                {label:'#Radars',content:datain.length,variable: 'datain'}
            ],
            [
                {text:"Settings",type:"title"},
            ],
            [
                {text:"Output",type:"title"},
            ]
        ];
        d3.values(self.controlPanel).forEach(d=>{
            tableData[1].push({label:d.text,type:d.type,content:d,variable: d.variable})
        });
        d3.values(controlPanelGeneral).forEach(d=>{
            tableData[1].push({label:d.text,type:d.type,content:d,variable: d.variable})
        });
        tableData[2] = _.concat(tableData[2],self.outputSelection);
        let tbodys = table_info.selectAll('tbody').data(tableData);
        tbodys
            .enter().append('tbody')
            .selectAll('tr').data(d=>d)
            .enter().append('tr')
            .selectAll('td').data(d=>d.type==="title"?[d]:[{text:d.label},d.type?{content:d.content,variable:d.variable}:{text:d.content,variable:d.variable}])
            .enter().append('td')
            .attr('colspan',d=>d.type?"2":null)
            .style('text-align',(d,i)=>d.type==="title"?"center":(i?"right":"left"))
            .attr('class',d=>d.variable)
            .each(function(d){
                if (d.text!==undefined) // value display only
                    d3.select(this).text(d.text);
                else{ // other component display
                    let formatvalue = formatTable[d.content.variable]||(e=>Math.round(e));
                    if (d.content.type==="slider"){
                        let div = d3.select(this).style('width',d.content.width).append('div').attr('class','valign-wrapper');
                        noUiSlider.create(div.node(), {
                            start: (graphicopt.opt[d.content.variable])|| d.content.range[0],
                            connect: 'lower',
                            tooltips: {to: function(value){return formatvalue(value)}, from:function(value){return +value.split('1e')[1];}},
                            step: d.content.step||1,
                            orientation: 'horizontal', // 'horizontal' or 'vertical'
                            range: {
                                'min': d.content.range[0],
                                'max': d.content.range[1],
                            },
                        });
                        div.node().noUiSlider.on("change", function () { // control panel update method
                            graphicopt.opt[d.content.variable] = + this.get();
                            if (d.content.callback)
                                d.content.callback();
                            else
                                start();
                        });
                    }else if (d.content.type === "checkbox") {
                        let div = d3.select(this).style('width', d.content.width).append('label').attr('class', 'valign-wrapper left-align');
                        div.append('input')
                            .attrs({
                                type: "checkbox",
                                class: "filled-in"
                            }).on('change',function(){
                            graphicopt[d.content.variable]  =  this.checked;
                            if (d.content.callback)
                                d.content.callback();
                        }).node().checked = graphicopt[d.content.variable];
                        div.append('span')
                    }else if (d.content.type === "switch") {
                        let div = d3.select(this).style('width', d.content.width).classed('switch',true)
                            .append('label').attr('class', 'valign-wrapper')
                            .html(`${d.content.labels[0]}<input type="checkbox"><span class="lever"></span>${d.content.labels[1]}`)
                        div.select('input').node().checked = (graphicopt.opt[d.content.variable]+"") ===d.content.labels[1];
                        div.select('input').on('change',function(){
                            graphicopt.opt[d.content.variable]  =  d.content.values[+this.checked];
                            if (d.content.callback)
                                d.content.callback();
                            else
                                start();
                        })
                            // .node().checked = graphicopt[d.content.variable];
                    }
                }
            });
    }
    function updateTableInput(){
        table_info.select(`.datain`).text(e=>datain.length);
        try {
            d3.values(self.controlPanel).forEach((d)=>{
                if (graphicopt.opt[d.variable]) {
                    // d3.select('.nNeighbors div').node().noUiSlider.updateOptions({
                    //     range: {
                    //         'min': 1,
                    //         'max': Math.round(datain.length / 2),
                    //     }
                    // });
                    d3.select(`.${d.variable} div`).node().noUiSlider.set(graphicopt.opt[d.variable]);
                }
            });
        }catch(e){

        }
    }
    function updateTableOutput(output){
        d3.entries(output).forEach(d=>{
            table_info.select(`.${d.key}`).text(e=>d.value? formatTable[e.variable]? formatTable[e.variable](d.value):d3.format('.4s')(d.value) :'_');
        });

    }



    master.runopt = function (_) {
        //Put all of the options into a variable called runopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    runopt[i] = _[i];
                }
            }
            return master;
        }else {
            return runopt;
        }

    };
    master.graphicopt = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    graphicopt[i] = __[i];
                }
            }
            if (graphicopt.radaropt)
                graphicopt.radaropt.schema = serviceFullList;
            createRadar = _.partialRight(createRadar_func,graphicopt.radaropt,colorscale)
            return master;
        }else {
            return graphicopt;
        }

    };

    master.solution = function (_) {
        return solution;
    };

    master.color = function (_) {
        return arguments.length ? (colorscale = _, master) : colorscale;
    };

    master.schema = function (_) {
        return arguments.length ? (graphicopt.radaropt.schema = _,radarChartclusteropt.schema=_,schema = _, master) : schema;
    };
    master.dispatch = function (_) {
        return arguments.length ? (returnEvent = _, master) : returnEvent;
    };

    return master;
}

function calculateMSE_num(a,b){
    return ss.sum(a.map((d,i)=>(d-b[i])*(d-b[i])));
}

d3.pcaTimeSpace = _.bind(d3.TimeSpace,{name:'PCA',controlPanel: {},workerPath:'src/script/worker/PCAworker.js',outputSelection:[{label:"Total time",content:'_',variable:'totalTime'}]});
d3.tsneTimeSpace = _.bind(d3.TimeSpace,
    {name:'t-SNE',controlPanel: {
        epsilon: {text: "Epsilon", range: [1, 40], type: "slider", variable: 'epsilon', width: '100px'},
        perplexity: {text: "Perplexity", range: [1, 1000], type: "slider", variable: 'perplexity', width: '100px'},
        stopCondition: {
            text: "Limit \u0394 cost",
            range: [-12, -3],
            type: "slider",
            variable: 'stopCondition',
            width: '100px'
        },
    },workerPath:'src/script/worker/tSNETimeSpaceworker.js',outputSelection:[ {label: "#Iterations", content: '_', variable: 'iteration'},
        {label: "Cost", content: '_', variable: 'cost'},
        {label: "\u0394 cost", content: '_', variable: 'deltacost'},
        {label: "Time per step", content: '_', variable: 'time'},
        {label: "Total time", content: '_', variable: 'totalTime'}]});
d3.umapTimeSpace  = _.bind(d3.TimeSpace,
    {name:'UMAP',controlPanel: {
            minDist:{text:"Minimum distance", range:[0,1], type:"slider", variable: 'minDist',width:'100px',step:0.1},
            nNeighbors:{text:"#Neighbors", range:[1,200], type:"slider", variable: 'nNeighbors',width:'100px'},
        },workerPath:'src/script/worker/umapworker.js',outputSelection:[ {label:"#Iterations",content:'_',variable: 'iteration'},
            {label:"Time per step",content:'_',variable:'time'},
            {label:"Total time",content:'_',variable:'totalTime'},]});


// function handle_data_model(tsnedata) {
//     let dataIn = [];
//     d3.values(tsnedata).forEach(axis_arr => {
//         let lastcluster;
//         let lastdataarr;
//         let count = 0;
//         sampleS.timespan.forEach((t, i) => {
//             let index = axis_arr[i].cluster;
//             axis_arr[i].clusterName = cluster_info[index].name
//             // timeline precalculate
//             if (!(lastcluster !== undefined && index === lastcluster) || runopt.suddenGroup && calculateMSE_num(lastdataarr, axis_arr[i]) > cluster_info[axis_arr[i].cluster].mse * runopt.suddenGroup) {
//                 lastcluster = index;
//                 lastdataarr = axis_arr[i];
//                 axis_arr[i].timestep = count; // TODO temperal timestep
//                 count++;
//                 dataIn.push(axis_arr[i])
//             }
//             return index;
//             // return cluster_info.findIndex(c=>distance(c.__metrics.normalize,axis_arr)<=c.radius);
//         })
//     });
//     return dataIn;
// }
let windowsSize = 1;
function handle_data_model(tsnedata,isKeepUndefined) {
    windowsSize = windowsSize||1;
    console.log(windowsSize);
    // get windown surrounding
    let windowSurrounding =  (windowsSize - 1)/2;
    let dataIn = [];
    d3.values(tsnedata).forEach(axis_arr => {
        let lastcluster;
        let lastdataarr;
        let count = 0;
        let timeLength = sampleS.timespan.length;
        sampleS.timespan.forEach((t, i) => {
            let currentData = axis_arr[i].slice();
            currentData.cluster = axis_arr[i].cluster;
            currentData.name = axis_arr[i].name;
            currentData.timestep = axis_arr[i].timestep;
            let index = currentData.cluster;
            currentData.clusterName = cluster_info[index].name;
            if (!(lastcluster !== undefined && index === lastcluster) || runopt.suddenGroup && calculateMSE_num(lastdataarr, currentData) > cluster_info[currentData.cluster].mse * runopt.suddenGroup) {
                currentData.show = true;
            // // add all points
            // }
            // // timeline precalculate
            // if (true) {
                lastcluster = index;
                lastdataarr = currentData.slice();
                currentData.timestep = count; // TODO temperal timestep
                count++;
                // make copy of axis data
                currentData.data = currentData.slice();
                // adding window
                for (let w = 0; w<windowSurrounding; w++)
                {
                    let currentIndex = i -w;
                    let currentWData;
                    if (currentIndex<0) // bounder problem
                        currentIndex = 0;
                    currentWData = axis_arr[currentIndex];
                    currentWData.forEach(d=>{
                        currentData.push(d);
                    });
                }
                for (let w = 0; w<windowSurrounding; w++)
                {
                    let currentIndex = i + w;
                    let currentWData;
                    if (currentIndex > timeLength-1) // bounder problem
                        currentIndex = timeLength-1;
                    currentWData = axis_arr[currentIndex];
                    currentWData.forEach(d=>{
                        currentData.push(d);
                    });
                }
                if (isKeepUndefined)
                {
                    for (let i = 0; i< currentData.length; i++){
                        if (currentData[i]===0)
                            currentData[i] = -1;
                    }
                }
                dataIn.push(currentData);
            }
            return index;
            // return cluster_info.findIndex(c=>distance(c.__metrics.normalize,axis_arr)<=c.radius);
        })
    });
    // console.log(dataIn);
    return dataIn;
}

function handle_data_umap(tsnedata) {
    const dataIn = handle_data_model(tsnedata,true);
    if (!umapopt.opt)
        umapopt.opt = {
            // nEpochs: 20, // The number of epochs to optimize embeddings via SGD (computed automatically = default)
            nNeighbors:  Math.round(dataIn.length/cluster_info.length/5)+2, // The number of nearest neighbors to construct the fuzzy manifold (15 = default)
            // nNeighbors: 15, // The number of nearest neighbors to construct the fuzzy manifold (15 = default)
            dim: 2, // The number of components (dimensions) to project the data to (2 = default)
            minDist: 1, // The effective minimum distance between embedded points, used with spread to control the clumped/dispersed nature of the embedding (0.1 = default)
        };
    umapTS.graphicopt(umapopt).color(colorCluster).init(dataIn, cluster_info.map(c => c.__metrics.normalize));
}
function handle_data_tsne(tsnedata) {
    const dataIn = handle_data_model(tsnedata);
    if (!TsneTSopt.opt)
        TsneTSopt.opt = {
            epsilon: 20, // epsilon is learning rate (10 = default)
            perplexity: Math.round(dataIn.length / cluster_info.length), // roughly how many neighbors each point influences (30 = default)
            dim: 2, // dimensionality of the embedding (2 = default)
        }
    tsneTS.graphicopt(TsneTSopt).color(colorCluster).init(dataIn, cluster_info.map(c => c.__metrics.normalize));
}
function handle_data_pca(tsnedata) {
    const dataIn = handle_data_model(tsnedata);
    if (!PCAopt.opt)
        PCAopt.opt = {
            dim: 2, // dimensionality of the embedding (2 = default)
        };
    pcaTS.graphicopt(PCAopt).color(colorCluster).init(dataIn, cluster_info.map(c => c.__metrics.normalize));
}