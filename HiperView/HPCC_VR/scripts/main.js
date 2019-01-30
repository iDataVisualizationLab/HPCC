var container, camera, scene, renderer_css3d, effect, clock, controls;
var raycaster, mouse, pointer;
var cameraHolder;
var json;
var color_funct;
var hostObj = {};
var timeObj = {};

var ROOM_SIZE = 1;
var RACK_NUM = 10;
var HOST_NUM = 60;
var CPU_NUM = 2;
var TS_NUM = null;
var color,opa;
var arrColor = ['#110066','#4400ff', '#00cccc', '#00dd00','#ffcc44', '#ff0000', '#660000'];
var selectedTimestamp = 1;
var INTERSECTED;
var isInit = true;
var niceOffset = false;
// D3
var oldhostclicked;
var svg;
var rectip;
var maxstack = 7;

var updateHost;
var updateTimestamp;
var move_timer;

var CP_SPEED = 0.01;

var quanah;
var cpu_marker;
var tooltip;
var tooltip_png;
var service_control_panel;
var time_control_panel;
var scatter_plot;

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


//***********************
var undefinedValue = undefined;

var charType = "Heatmap";
//***********************
var serviceList = ["Temperature","CPU_load","Memory_usage","Fans_speed","Power_consumption"];
var serviceListattr = {arrTemperature: {key: "Temperature", val: ["arrTemperatureCPU1","arrTemperatureCPU2"]},
    arrCPU_load: {key: "CPU_load", val: ["arrCPU_load"]},
    arrMemory_usage: {key: "Memory_usage", val: ["arrMemory_usage"]},
    arrFans_health: {key: "Fans_speed", val: ["arrFans_speed1","arrFans_speed2"]},
    arrPower_usage:{key: "Power_consumption", val: ["arrPower_usage"]}};
var serviceQuery =["temperature","cpu+load" ,"memory+usage" ,"fans+health" ,"power+usage"];
var thresholds = [[3,98], [0,10], [0,99], [1050,17850],[0,200] ];
var initialService = "Temperature";
var selectedService = "Temperature";



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
    // initLight();
    initInteractions();

    initRoom();
    initControlPanel();
    initQuanah();
    // initHPCC();
    // initScatterPlotTest();

    window.addEventListener( 'mousedown', onMouseDown, false );
    window.addEventListener( 'touchstart', onDocTouch, false );
    window.addEventListener( 'touchend', onDocRelease, false );
    window.addEventListener( 'mousemove', onMouseMove, false );

}

function initScatterPlotTest()
{

    // console.log(json);

    var selectedHost = "compute-1-1";
    var selectedServices = ["arrTemperatureCPU1","arrMemory_usage","arrFans_speed1"]
    var points = extractPoints(selectedHost,selectedServices);

    // var points = [];
    // for( var i=0; i<300; i++ )
    // {
    //     points.push([Math.floor(Math.random() * 10),Math.floor(Math.random() * 10),Math.floor(Math.random() * 10)])
    // }

    scatter_plot = new ScatterPlot(selectedServices,points,null,0.25);
    scene.add( scatter_plot.graph );

    function extractPoints( host, service )
    {
        var p = [], tmp;

        for( var i=0; i<json[host][service[0]].length; i++ )
        {
            tmp = []

            // if no service exists put 0
            tmp.push( json[host][service[0]] ? json[host][service[0]][i] : 0 );
            tmp.push( json[host][service[1]] ? json[host][service[1]][i] : 0 );
            tmp.push( json[host][service[2]] ? json[host][service[2]][i] : 0 );

            p.push( tmp )
        }

        return p;
    }

}


// ngan
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
            // console.log(requestRT(iteration,count));

            //console.log(hosts[count].name+" "+hostResults[name]);
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

// ngan
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
    document.querySelector('a-light').object3D.name = "hpcc_light_group";
    light = document.querySelector('a-light').object3D.children[0];
    light.name = "hpcc_light";
    light.intensity = 5;
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
        materials[i] = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.BackSide, map: texture } );
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

// Animate & Render

function animate()
{
    requestAnimationFrame( animate );
    animateControlPanel();
    // animateTooltip();
}

function render()
{
    renderer_css3d.render( scene, camera );
}