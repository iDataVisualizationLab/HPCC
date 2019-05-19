var container, camera, scene, renderer_css3d, effect, clock, controls;
var raycaster, mouse, pointer;
var cameraHolder;

var json;
var hostObj = {};
var timeObj = {};

// selected
var selectedTimestamp = 1;

var ROOM_SIZE = 1;
var RACK_NUM = 10;
var HOST_NUM = 60;
var CPU_NUM = 2;
var TS_NUM;
var INTERSECTED;
var CP_SPEED = 0.01;

var color, opa;
var arrColor = ['#110066','#4400ff', '#00cccc', '#00dd00','#ffcc44', '#ff0000', '#660000'];
// var arrDom;
var isInit = true;
var fillHost;
var updateTimestamp;
var move_timer;

var SERVICE = { arrTemperatureCPU1: { key: "arrTemperatureCPU1", value: "Temperature1", dom: [0,98], sp_pos: 5 },
                arrTemperatureCPU2: { key: "arrTemperatureCPU2", value: "Temperature2", dom: [0,98], sp_pos: 6 },
                arrCPU_load: { key: "arrCPU_load", value: "CPU_load", dom: [0,10], sp_pos: 0 },
                arrMemory_usage: { key: "arrMemory_usage", value: "Memory_usage", dom: [0,99], sp_pos: 3 },
                arrFans_speed1: { key: "arrFans_speed1", value: "Fans_speed1", dom: [1050,17850], sp_pos: 1 },
                arrFans_speed2: { key: "arrFans_speed2", value: "Fans_speed2", dom: [1050,17850], sp_pos: 2 },
                arrPower_usage: { key: "arrPower_usage", value: "Power_usage", dom: [0,200], sp_pos: 4 },
            };

var SCORE = { outlyingScore: 0.4,
                clumpyScore: 0,
                convexScore: 0,
                monotonicScore: 0,
                skewedScore: 0,
                skinnyScore: 0,
                sparseScore: 0,
                striatedScore: 0,
                stringyScore: 0
            };


var niceOffset = false;

// D3
var oldhostclicked;
var svg;
var rectip;
var maxstack = 7;

var quanah;
var cpu_marker;
var tooltip;
var service_control_panel;
var time_control_panel;
var score_control_panel;
var scatter_plot_matrix;
var foo;
var parallel_set;
var lever;
var FONT = 'media/fonts/helvetiker_regular.typeface.json';

// HPCC
var hosts = [];
var hostResults = {};
var links =[];
var node,link;

var simulation, link, node;
var dur = 400;  // animation duration
var startDate = new Date("4/1/2018");
var endtDate = new Date("1/1/2019");
var today = new Date();

var maxHostinRack= 60;
var h_rack = 950;
var width = 200;
var w_rack = (width-23)/10-1;
var w_gap =0;
var node_size = 6;
var sHeight=200;  // Summary panel height
var top_margin = sHeight+80;  // Start rack spiatial layout


var users = [];
var racks = [];

var xTimeScale;
var baseTemperature = 60;

var interval2;
var simDuration = 1;
var numberOfMinutes = 6*60;
var isRealtime = false;
if (isRealtime){
    simDuration = 1000;
    numberOfMinutes = 6*60;
}

var charType = "Heatmap";
var undefinedValue = undefined;
//***********************
var serviceList = ["Temperature","CPU_load","Memory_usage","Fans_speed","Power_consumption"];
var serviceList_selected = ["Temperature","CPU_load","Memory_usage","Fans_speed","Power_consumption"];
var serviceListattr = {arrTemperature: {key: "Temperature", val: ["arrTemperatureCPU1","arrTemperatureCPU2"]},
    arrCPU_load: {key: "CPU_load", val: ["arrCPU_load"]},
    arrMemory_usage: {key: "Memory_usage", val: ["arrMemory_usage"]},
    arrFans_health: {key: "Fans_speed", val: ["arrFans_speed1","arrFans_speed2"]},
    arrPower_usage:{key: "Power_consumption", val: ["arrPower_usage"]}};
var serviceQuery = ["temperature","cpu+load" ,"memory+usage" ,"fans+health" ,"power+usage"];
var thresholds = [[3,98], [0,10], [0,99], [1050,17850],[0,200] ];
var initialService = "Temperature";
var selectedService = "arrTemperatureCPU1";



// Controls
var objects = [];
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();

init();
animate();

function init()
{
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    initD3();
    loadJSON();

    TS_NUM = json["compute-1-1"]["arrCPU_load"].length;

    initScene();
    initCamera();
    initLight();
    initInteractions();

    initRoom();
    initControlPanel();
    initQuanah();
    initParallelSet();

    initScatterPlotMatrix();

    window.addEventListener( 'mousedown', onMouseDown, false );
    window.addEventListener( 'touchstart', onDocTouch, false );
    window.addEventListener( 'touchend', onDocRelease, false );
    window.addEventListener( 'mousemove', onMouseMove, false );

}

function loadJSON()
{
    json = {};

    // loading data
    for (var att in hostList.data.hostlist)
    {
        var h = {};
        h.name = att;
        h.hpcc_rack = +att.split("-")[1];
        h.hpcc_node = +att.split("-")[2].split(".")[0];
        h.index = hosts.length;

        // to contain the historical query results
        hostResults[h.name] = {};
        hostResults[h.name].index = h.index;
        hostResults[h.name].arr = [];
        hostResults[h.name].arrTemperature = [];
        hostResults[h.name].arrCPU_load = [];
        hostResults[h.name].arrMemory_usage = [];
        hostResults[h.name].arrFans_health= [];
        hostResults[h.name].arrPower_usage= [];
        hosts.push(h);
        // console.log(att+" "+h.hpcc_rack+" "+h.hpcc_node);

        // Compute RACK list
        var rackIndex = isContainRack(racks, h.hpcc_rack);
        if (rackIndex >= 0) {  // found the user in the users list
            racks[rackIndex].hosts.push(h);
        }
        else {
            var obj = {};
            obj.id = h.hpcc_rack;
            obj.hosts = [];
            obj.hosts.push(h);
            racks.push(obj);
        }
        // Sort RACK list
        racks = racks.sort(function (a, b) {
            if (a.id > b.id) {
                return 1;
            }
            else return -1;
        })
    }

    for (var i = 0; i < racks.length; i++)
    {
        racks[i].hosts.sort(function (a, b) {
            if (a.hpcc_node > b.hpcc_node) {
                return 1;
            }
            else return -1;
        })

    }

    for (count = 0; count < hosts.length; count++)
    {
        var name = hosts[count].name;
        json[name] = {};
        d3.keys(serviceListattr).forEach(d=>serviceListattr[d].val.forEach(e=>json[name][e]=[]));
        for (iteration = 0; iteration<sampleS[name].arrTemperature.length; iteration++){
            step(iteration, count);
            for (key in serviceListattr){
                var attrkey = serviceListattr[key];
                var result = processData(hostResults[name][key][iteration].data.service.plugin_output, attrkey.key);
                attrkey.val.forEach((d,i)=>{
                    json[name][d].push(result[i]);
                });
            }
        }
    }

    // ngan
    function step(iteration, count)
    {
        if( isRealtime )
        {
            return requestRT(iteration,count);
        }
        else
        {
            var selectedService = serviceList[0];

            var result = simulateResults2(hosts[count].name,iteration, selectedService);
            var name =  result.data.service.host_name;
            hostResults[name].arr.push(result);
            var result = simulateResults2(hosts[count].name,iteration, serviceList[0]);
            hostResults[name].arrTemperature.push(result);

            var result = simulateResults2(hosts[count].name,iteration, serviceList[1]);
            hostResults[name].arrCPU_load.push(result);

            var result = simulateResults2(hosts[count].name,iteration, serviceList[2]);
            hostResults[name].arrMemory_usage.push(result);

            var result = simulateResults2(hosts[count].name,iteration, serviceList[3]);
            hostResults[name].arrFans_health.push(result);

            var result = simulateResults2(hosts[count].name,iteration, serviceList[4]);
            hostResults[name].arrPower_usage.push(result);
        }
    }

    function simulateResults2(hostname,iter, s)
    {
        var newService;
        if (s == serviceList[0])
            newService = sampleS[hostname].arrTemperature[iter];
        else if (s == serviceList[1])
            newService = sampleS[hostname].arrCPU_load[iter];
        else if (s == serviceList[2])
            newService = sampleS[hostname].arrMemory_usage[iter];
        else if (s == serviceList[3])
            newService = sampleS[hostname].arrFans_health[iter];
        else if (s == serviceList[4]) {
            if (sampleS[hostname]["arrPower_usage"]== undefined) {
                var simisval = handlemissingdata(hostname,iter);
                sampleS[hostname]["arrPower_usage"] = [simisval];
            }else if (sampleS[hostname]["arrPower_usage"][iter]== undefined){
                var simisval = handlemissingdata(hostname,iter);
                sampleS[hostname]["arrPower_usage"][iter] = simisval;
            }
            newService = sampleS[hostname]["arrPower_usage"][iter];
        }

        return newService;
    }

    function handlemissingdata(hostname,iter)
    {
        var simisval = jQuery.extend(true, {}, sampleS[hostname]["arrTemperature"][iter]);
        var simval = processData(simisval.data.service.plugin_output, serviceList[0]);
        // simval = (simval[0]+simval[1])/2;
        simval = (simval[0]+simval[1]+20);
        var tempscale = d3.scaleLinear().domain([thresholds[0][0],thresholds[0][1]]).range([thresholds[4][0],thresholds[4][1]]);
        if (simval!==undefinedValue && !isNaN(simval) )
        //simisval.data.service.plugin_output = "OK - The average power consumed in the last one minute = "+Math.round(tempscale(simval)*3.2)+" W";
            simisval.data.service.plugin_output = "OK - The average power consumed in the last one minute = "+Math.floor(simval*3.2)+" W";
        else
            simisval.data.service.plugin_output = "UNKNOWN";
        return simisval;
    }
}

// INITS

function initD3()
{
    svg = d3.select("#svgplace").append("svg").attr("width", 2).attr("height",2);
    rectip = svg.append('rect').attr('id','placetip').attr('x',0).attr('y',0).attr('width',2).attr('height',2)
        .style('opacity',0)
        .on("click",function(d,i){
            mouseoverNode(d)});
}

function initCamera()
{
    cameraHolder = document.querySelector('a-entity').object3D;
    cameraHolder.name = "cameraHolder";

    document.querySelector('a-camera').object3D.name = "hppc_camera_group";
    camera = document.querySelector('a-camera').object3D.children[1];
    camera.type = "hpcc_camera"
    camera.name = "camera";

    pointer = camera.el.lastElementChild.object3D.children[0];

    pointer.material.depthTest = false;
    pointer.name = "pointer";
}

function initScene()
{
    scene = document.querySelector('a-scene').object3D;
    scene.name = "hpcc";
}

function initLight()
{
    var light1 = document.getElementById("light1").object3D;
    var light2 = document.getElementById("light2").object3D;
    var light3 = document.getElementById("light3").object3D;

    var height = ROOM_SIZE*2;

    light1.position.set( ROOM_SIZE*-1, ROOM_SIZE, ROOM_SIZE );
    light2.position.set( ROOM_SIZE*3, ROOM_SIZE, ROOM_SIZE );
    light3.position.set( ROOM_SIZE*7, ROOM_SIZE, ROOM_SIZE );
    
}

function initInteractions()
{
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
}

function initRoom()
{
    var height = ROOM_SIZE * 2.5;
    var width = ROOM_SIZE * 12;
    var depth = ROOM_SIZE * 4;
    var geometry = new THREE.BoxGeometry( width, height, depth );

    var textures = ["whiteblockwall","whiteblockwall","whiteceiling","silvermetalmeshfloor","whiteblockwall","whiteblockwall"];
    
    var repeats = [ [width,height],
                    [width,height],
                    [width*2,width],
                    [width*2,width],
                    [width*2,height],
                    [width*2,height]];

    var materials = [null,null,null,null,null,null];

    for( var i=0; i<6; i++ )
    {
        var texture = new THREE.TextureLoader().load( "media/textures/" + textures[i] + ".jpg" );
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeats[i][0],repeats[i][1]);
        materials[i] = new THREE.MeshPhongMaterial( { color: 0xffffff, side: THREE.BackSide, map: texture } );
    }

    var room = new THREE.Mesh( geometry, materials );
    room.position.set( ROOM_SIZE*3, ROOM_SIZE/1.25, ROOM_SIZE );
    room.name = "hpcc_room";
    room.type = "room";
    scene.add( room );

    initLever();
}

function initLever()
{
    lever = new THREE.Group();
    lever.name = "hpcc_lever";

    // lever case
    var back_geometry = new THREE.BoxGeometry( ROOM_SIZE/20, ROOM_SIZE/10, ROOM_SIZE/80 );
    var back_material = new THREE.MeshPhongMaterial( { color: 0x555555 } );
    var back = new THREE.Mesh( back_geometry, back_material );
    back.name = "lever-case";
    lever.add( back );

    // rotation pivot
    var pivot = new THREE.Object3D();
    pivot.name = "lever-pivot";

    // lever tube
    var tube_geometry = new THREE.CylinderGeometry( ROOM_SIZE/200, ROOM_SIZE/200, ROOM_SIZE/15, 16 );
    var tube_material = new THREE.MeshPhongMaterial( { color: 0xaaaaaa } );
    var tube = new THREE.Mesh( tube_geometry, tube_material );
    tube.name = "lever-tube";
    tube.position.set( 0, 0, ROOM_SIZE/30 );
    tube.rotation.set( Math.PI/2, 0, 0 );
    pivot.add( tube );

    // lever handle
    var handle_geometry = new THREE.SphereGeometry( ROOM_SIZE/70, 16, 16 );
    var handle_material = new THREE.MeshPhongMaterial( { color: 0xff0000 } );
    var handle = new THREE.Mesh( handle_geometry, handle_material );
    handle.position.set( 0, 0, ROOM_SIZE/15 );
    handle.name = "lever-handle";
    pivot.add( handle );

    addLeverLabel( "Scatter Plot", ROOM_SIZE/10, lever );
    addLeverLabel( "Parallel Set", ROOM_SIZE/-8, lever );


    // set rotation and position
    lever.add( pivot );
    lever.pivot = pivot;
    pivot.rotation.set( Math.PI/-4, 0, 0 );
    lever.position.set( ROOM_SIZE * 4.75, ROOM_SIZE / 10, ROOM_SIZE*-1 );
    scene.add( lever );

    function addLeverLabel( text, y, obj )
    {
        var loader = new THREE.FontLoader();
        var material_text = new THREE.MeshBasicMaterial( { color: 0x000000 } );

        loader.load( 'media/fonts/helvetiker_regular.typeface.json', function ( font ) {

            var geometry = new THREE.TextGeometry( text, {
                font: font,
                size: ROOM_SIZE/30,
                height: 0,
                curveSegments: 12,
                bevelEnabled: false
            } );

            var textMesh = new THREE.Mesh( geometry, material_text );
            textMesh.position.set( ROOM_SIZE/-9, y, ROOM_SIZE/100 );
            textMesh.name = "lever-label-"+text;
            obj.add( textMesh );
        } );

    }

}

function initHPCC()
{
    for (var att in hostList.data.hostlist)
    {
        var h = {};
        h.name = att;
        h.hpcc_rack = +att.split("-")[1];
        h.hpcc_node = +att.split("-")[2].split(".")[0];
        h.index = hosts.length;

        // to contain the historical query results
        hostResults[h.name] = {};
        hostResults[h.name].index = h.index;
        hostResults[h.name].arr = [];
        hostResults[h.name].arrTemperature = [];  
        hostResults[h.name].arrCPU_load = [];
        hostResults[h.name].arrMemory_usage = [];
        hostResults[h.name].arrFans_health= [];
        hostResults[h.name].arrPower_usage= [];
        hosts.push(h);
        // console.log(att+" "+h.hpcc_rack+" "+h.hpcc_node);

        // Compute RACK list
        var rackIndex = isContainRack(racks, h.hpcc_rack);
        if (rackIndex >= 0) {  // found the user in the users list
            racks[rackIndex].hosts.push(h);
        }
        else {
            var obj = {};
            obj.id = h.hpcc_rack;
            obj.hosts = [];
            obj.hosts.push(h);
            racks.push(obj);
        }
        // Sort RACK list
        racks = racks.sort(function (a, b) {
            if (a.id > b.id) {
                return 1;
            }
            else return -1;
        })
    }

    for (var i = 0; i < racks.length; i++) {
        racks[i].hosts.sort(function (a, b) {
            if (a.hpcc_node > b.hpcc_node) {
                return 1;
            }
            else return -1;
        })

    }

    hosts.sort(function (a, b) {
        if (a.hpcc_rack*1000+a.hpcc_node > b.hpcc_rack*1000+b.hpcc_node) {
            return 1;
        }
        else return -1;
    });

    function isContainRack(array, id)
    {
        var foundIndex = -1;
        for(var i = 0; i < array.length; i++) {
            if (array[i].id == id) {
                foundIndex = i;
                break;
            }
        }
        return foundIndex;
    }
}

function initScatterPlotMatrix()
{
    var hostkeys = Object.keys(json);
    var datas = [], s, ranges = [], selectedSPServices = [], datakeys = [];
    var element = Object.keys( SERVICE );
    element.pop();
    element.pop();
    // element.pop();
    // element.pop();

    var slist = [];

    for( x in element )
    {
        for( y in element )
        {
            for( z in element )
            {
                var s = [ element[x], element[y], element[z] ].sort();

                if( isRepeated( s, slist ) )
                    continue;
                else
                    slist.push( s.toString() );

                selectedSPServices.push(s);
                var data = [];
                var datakey = {};

                for( var h=0; h<hostkeys.length; h++ )
                {
                    datakey[hostkeys[h]] = h;
                    data.push( [0,0,0] );
                }

                datakeys.push( datakey );
                datas.push( data );
                ranges.push([SERVICE[s[0]]["dom"],
                            SERVICE[s[1]]["dom"],
                            SERVICE[s[2]]["dom"]] );
            }
        }
    }

    // building scatter plot matrix ----------------------------------------------------
    scatter_plot_matrix = new ScatterPlotMatrix( selectedSPServices, ranges, 6, hostkeys, datas, 0.25, false, datakeys );
    scatter_plot_matrix.graph.position.set( ROOM_SIZE * 7, ROOM_SIZE * -0.9, ROOM_SIZE * 2.99 );
    scatter_plot_matrix.graph.rotation.set( 0, Math.PI, 0 );
    scene.add( scatter_plot_matrix.graph );
    scatter_plot_matrix.graph.visible = true;

    function isRepeated( a, A )
    {
        if( a[0] == a[1] | a[0] == a[2] | a[1] == a[2] )
            return true;

        a = a.toString();
        for( var r=0; r<A.length; r++ )
        {
            if( a == A[r] )
                return true;
        }
        return false;
    }
}

function initParallelSet()
{
    var table = [Object.keys(SERVICE)];
    var tmp = [];

    // building data
    for( var host in json )
    {
        tmp = [];
        for( var s=0; s<table[0].length; s++ )
        {
            if( json[host][table[0][s]] )
                tmp.push(json[host][table[0][s]][0]);
            else
                tmp.push(undefined);
        }
        table.push(tmp);
    }

    parallel_set = new ParallelSet( 0.25, FONT, table, "arrTemperatureCPU1", [], table[0] );
    parallel_set.graph.position.set( ROOM_SIZE * 4.75, -0.15, -0.65 );
    parallel_set.graph.rotation.set( 0, -Math.PI/2, 0 );
    scene.add( parallel_set.graph );
    parallel_set.graph.visible = false;
}

// Extra

function geAllIdsByName( parent, name )
{
    var match = [];
    for( var c=0; c<parent.children.length; c++ )
        if( parent.children[c].name == name )
            match.push(parent.children[c].id);

    return match;
}

// Animate & Render

function animate()
{
    requestAnimationFrame( animate );
    // animateControlPanel();
    // animateTooltip();
}

function render()
{
    renderer_css3d.render( scene, camera );
}