var container, camera, scene, renderer_css3d, effect, clock, controls;
var raycaster, mouse, pointer;
var cameraHolder;

var json;
var color_funct;
var hostObj = {};
var timeObj = {};

// selected
var selectedTimestamp = 1;
var selectedSPService = ["arrTemperatureCPU1","arrFans_speed1","arrPower_usage"];

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

var SERVICE = { arrTemperatureCPU1: { key: "arrTemperatureCPU1", value: "Temperature1", dom: [null,null] },
                arrTemperatureCPU2: { key: "arrTemperatureCPU2", value: "Temperature2", dom: [null,null] },
                arrCPU_load: { key: "arrCPU_load", value: "CPU_load", dom: [null,null] },
                arrMemory_usage: { key: "arrMemory_usage", value: "Memory_usage", dom: [null,null] },
                arrFans_speed1: { key: "arrFans_speed1", value: "Fans_speed1", dom: [null,null] },
                arrFans_speed2: { key: "arrFans_speed2", value: "Fans_speed2", dom: [null,null] },
                arrPower_usage: { key: "arrPower_usage", value: "Power_usage", dom: [null,null] },
            };


var niceOffset = false;

// D3
var oldhostclicked;
var svg;
var rectip;
var maxstack = 7;

// var serviceValues = ["Temperature1","Temperature2","CPU_load","Memory_usage","Fans_speed1","Fans_speed2","Power_usage"];
// var serviceKeys = ["arrTemperatureCPU1", "arrTemperatureCPU2", "arrCPU_load", "arrMemory_usage", "arrFans_speed1", "arrFans_speed2", "arrPower_usage"];

var quanah;
var cpu_marker;
var tooltip;
var tooltip_png;
var service_control_panel;
var time_control_panel;
var scatter_plot;
var parallel_set;
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
    for( var host in json )
    {
        if(!json.hasOwnProperty(host)) continue;
        for( var service in json[host] )
        {
            if(!json[host].hasOwnProperty(service)) continue;

            if( SERVICE[service]["dom"][0] == null )
            {
                SERVICE[service]["dom"][0] = Math.min(...json[host][service]);
                SERVICE[service]["dom"][1] = Math.max(...json[host][service]);
            }

            if( SERVICE[service]["dom"][0] > Math.min(...json[host][service]) )
                SERVICE[service]["dom"][0] = Math.min(...json[host][service]);

            if( SERVICE[service]["dom"][1] < Math.max(...json[host][service]) )
                SERVICE[service]["dom"][1] = Math.max(...json[host][service]);
        }
    }

    for( var i=0; i<serviceList.length; i++ )
    {
        var dif, mid, left, service;
        dif = (thresholds[i][1]-thresholds[i][0])/4;
        mid = thresholds[i][0]+(thresholds[i][1]-thresholds[i][0])/2;
        if( i == 1 )
        {
            left=0;
            SERVICE["arrCPU_load"].threshold = [left,thresholds[i][0], 0, thresholds[i][0]+2*dif, 10, thresholds[i][1], thresholds[i][1]];
        }
        else if( i == 2 )
        {
            left=0;
            SERVICE["arrMemory_usage"].threshold = [left,thresholds[i][0], 0, thresholds[i][0]+2*dif, 98, thresholds[i][1], thresholds[i][1]];
        }
        else if( i == 0 )
        {
            left = thresholds[i][0]-dif;
            SERVICE["arrTemperatureCPU1"].threshold = [left,thresholds[i][0], thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif];
            SERVICE["arrTemperatureCPU2"].threshold = [left,thresholds[i][0], thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif];
        }
        else if( i == 3 )
        {
            left = 0;
            SERVICE["arrPower_usage"].threshold = [left,thresholds[i][0], thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif];
        }
        else if( i == 4 )
        {
            left = 0;
            SERVICE["arrFans_speed1"].threshold = [left,thresholds[i][0], thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif];
            SERVICE["arrFans_speed2"].threshold = [left,thresholds[i][0], thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif];
        }
    }

    initScene();
    initCamera();
    initLight();
    initInteractions();

    initRoom();
    initControlPanel();
    initQuanah();
    initScatterPlot();
    initParallelSet();

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

    var height = ROOM_SIZE/2-ROOM_SIZE/5

    light1.position.set( ROOM_SIZE * 2, height, 0 );
    light2.position.set( 0, height, 0 );
    light3.position.set( ROOM_SIZE * -2, height, 0 );
    
}

function initInteractions()
{
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
}

function initRoom()
{
    var height = ROOM_SIZE;
    var width = ROOM_SIZE * 6;
    var depth = ROOM_SIZE * 2;
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
    room.name = "hpcc_room";
    room.type = "room";
    scene.add( room );
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

function initScatterPlot()
{
    var hostkeys = Object.keys(json);
    var data = [], tmp;

    // building data
    for( var h=0; h<hostkeys.length; h++ )
    {
        tmp = [];
        tmp.push( json[hostkeys[h]][selectedSPService[0]][selectedTimestamp] );
        tmp.push( json[hostkeys[h]][selectedSPService[1]][selectedTimestamp] );
        tmp.push( json[hostkeys[h]][selectedSPService[2]][selectedTimestamp] );
        data.push( tmp )
    }

    var ranges = [  SERVICE[selectedSPService[0]]["dom"],
                    SERVICE[selectedSPService[1]]["dom"],
                    SERVICE[selectedSPService[2]]["dom"]];

    scatter_plot = new ScatterPlot( selectedSPService, ranges, 5, hostkeys, data, null, 0.25 );
    scatter_plot.graph.position.set( ROOM_SIZE * -2.5, 0, 0.5 );
    scatter_plot.graph.rotation.set( 0, Math.PI, 0 );
    scene.add( scatter_plot.graph );
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
                tmp.push(json[host][table[0][s]][19]);
            else
                tmp.push(undefined);
        }
        table.push(tmp);
    }

    parallel_set = new ParallelSet( 0.25, FONT, table, "arrTemperatureCPU1", [], table[0] );
    parallel_set.graph.position.set( 0.8, -0.15, 0.9 );
    parallel_set.graph.rotation.set( 0, Math.PI, 0 );
    scene.add( parallel_set.graph );
}

// Animate & Render

function animate()
{
    requestAnimationFrame( animate );
    animateControlPanel();
    animateTooltip();
}

function render()
{
    renderer_css3d.render( scene, camera );
}