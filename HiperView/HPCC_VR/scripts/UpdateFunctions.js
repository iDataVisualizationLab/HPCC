function stopUpdate()
{
    clearInterval(updateHost);
}

function resetService()
{
    for( var rack=1; rack<=RACK_NUM; rack++ )
        for( var host=1; host<=HOST_NUM; host++ )
            for( var cpu=1; cpu<=CPU_NUM; cpu++ )
                if( hostObj[rack][host] )
                    hostObj[rack][host][cpu].material.color = new THREE.Color( 0x222222 );
}

function reset()
{

    // stop previous update service
    stopUpdate();

    // update service
    updateValues( selectedTimestamp );

}

function updateValues( timestamp )
{
    updateSelectedTimestamp( timestamp+"" );

    time = timestamp - 1;

    var service = selectedService;
    updateColorRange(service);

    var rack = 1, host = 1, cpu = 1;
    updateHost = setInterval(function ()
    {

        if( hostObj[rack][host] )
            updateService( service, [rack,host,cpu,time], hostObj[rack][host][cpu] );

        if( cpu+1 <= CPU_NUM )
            cpu++;
        else
            if( host+1 <= HOST_NUM )
            {
                host++;
                cpu = 1;
            }
            else
                if( rack+1 <= RACK_NUM )
                {
                    rack++;
                    host = 1;
                    cpu = 1;
                }
                else
                {
                    stopUpdate();
                    if( isInit )
                    {
                        timestamp++;
                        updateSelectedTimestamp( timestamp+"" );
                        updateValues( timestamp );

                        if( time == TS_NUM-1 )
                            isInit = false;
                    }
                }

    }, 1 );
}

function updateService( service, keys, obj )
{

    switch( service )
    {
        case "Temperature":
            updateTemperature( keys, obj );
            break;
        case "CPU_load":
            updateCPULoad( keys, obj );
            break;
        case "Memory_usage":
            updateMemoryUsage( keys, obj );
            break;
        case "Fans_speed":
            updateFansSpeed( keys, obj );
            break;
        case "Power_usage":
            updatePowerConsumption( keys, obj );
            break;
        default:
            break;
    }

}

function updateTemperature( keys, obj )
{
    var rack = keys[0];
    var host = keys[1];
    var cpu = keys[2];
    var time = keys[3];

    var key1 = "compute-"+rack+"-"+host;
    var key2 = "arrTemperatureCPU"+cpu;

    if( json[key1][key2][time] !=null )
        var temperature = color_funct(json[key1][key2][time]);
    else
        var temperature = 0x222222;

    updateCPUMarker( obj );
    obj.material.color = new THREE.Color( temperature );

}

function updateCPULoad( keys, obj )
{
    var rack = keys[0];
    var host = keys[1];
    var time = keys[3];

    var key1 = "compute-"+rack+"-"+host;
    var key2 = "arrCPU_load";

    if( json[key1][key2][time] !=null )
        var load = color_funct(json[key1][key2][time]);
    else
        var load = 0x222222;

    updateCPUMarker( obj );
    obj.material.color = new THREE.Color( load );

}

function updateMemoryUsage( keys, obj )
{
    var rack = keys[0];
    var host = keys[1];
    var time = keys[3];

    var key1 = "compute-"+rack+"-"+host;
    var key2 = "arrMemory_usage";

    if( json[key1][key2][time] !=null )
        var usage = color_funct(json[key1][key2][time]);
    else
        var usage = 0x222222;

    updateCPUMarker( obj );
    obj.material.color = new THREE.Color( usage );

}

function updateFansSpeed( keys, obj )
{
    var rack = keys[0];
    var host = keys[1];
    var cpu = keys[2];
    var time = keys[3];

    var key1 = "compute-"+rack+"-"+host;
    var key2 = "arrFans_speed"+cpu;

    if( json[key1][key2][time] !=null )
        var speed = color_funct(json[key1][key2][time]);
    else
        var speed = 0x222222;

    updateCPUMarker( obj );
    obj.material.color = new THREE.Color( speed );
}

function updatePowerConsumption( keys, obj )
{
    var rack = keys[0];
    var host = keys[1];
    var time = keys[3];

    var key1 = "compute-"+rack+"-"+host;
    var key2 = "arrPower_usage";

    if( json[key1][key2][time] !=null )
        var usage = color_funct(json[key1][key2][time]);
    else
        var usage = 0x222222;

    updateCPUMarker( obj );
    obj.material.color = new THREE.Color( usage );

}

function updateColorRange( service )
{
    setColorsAndThresholdsTooltip( service );

    var arrColor, arrDom;
    switch( service )
    {
        case "Temperature":
            arrDom = [20, 60, 80, 100];
            arrColor = ['#44f', '#1a9850','#fee08b', '#d73027'];
            break;
        case "CPU_load":
            arrDom = [0, 0.2, 0.3, 0.5];
            arrColor = ['#ffff00','#c8df00','#91bf00','#589f00','#008000'];
            break;
        case "Memory_usage":
            arrDom = [0, 25, 50, 75, 100];
            arrColor = ['#ffff00','#c8df00','#91bf00','#589f00','#008000'];
            break;
        case "Fans_speed":
            arrDom = [0, 5000, 9000, 10000, 12000];
            arrColor = ['#ff0000','#ffff00','#008000','#ffff00','#ff0000'];
            break;
        case "Power_usage":
            arrDom = [20, 60, 80, 100];
            arrColor = ['#44f', '#1a9850','#fee08b', '#d73027'];
            break;
        default:
            break;
    }
    
    color_funct = d3.scaleLinear()
        .domain(arrDom)
        .range(arrColor)
        .interpolate(d3.interpolateHcl);
}

function updateCPUMarker( obj )
{
    var pos = new THREE.Vector3().setFromMatrixPosition( obj.matrixWorld )

    cpu_marker.position.x = pos.x;
    cpu_marker.position.y = pos.y + 0.005;
    cpu_marker.position.z = pos.z;
}

// ngan
// tooltip update

function updateTooltip( host )
{
    // event function
    $.fn.triggerSVGEvent = function(eventName)
    {
        var event = document.createEvent('SVGEvents');
        event.initEvent(eventName,true,true);
        this[0].dispatchEvent(event);
        return $(this);
    };
    if (oldhostclicked)
        oldhostclicked.children[2].material.color.setHex(0x000000);
    oldhostclicked = host;
    oldhostclicked.children[2].material.color.setHex(0xff0000);

    // constructing tooltip
    var tmp = host.name.split("_");
    var host_name = "compute-"+tmp[1]+"-"+tmp[3];
    var pos = new THREE.Vector3().setFromMatrixPosition( camera.matrixWorld );
    tooltip.position.x = pos.x;
    tooltip.position.y = 0.1;
    tooltip.position.z = pos.z - 0.3;
    rectip.datum({className:{baseVal:host_name}});
    $('#placetip').triggerSVGEvent('click');
    d3.select('#d3-tip').attr("position", "absolute")
        .style("top", "0px")
        .style("left","246px");
    requestupdatetooltiip();

}

function setColorsAndThresholdsTooltip(s)
{
    for (var i=0; i<serviceList.length;i++){
        if (s == serviceList[i] && i==1){  // CPU_load
            dif = (thresholds[i][1]-thresholds[i][0])/4;
            mid = thresholds[i][0]+(thresholds[i][1]-thresholds[i][0])/2;
            left=0;
            arrThresholds = [left,thresholds[i][0], 0, thresholds[i][0]+2*dif, 10, thresholds[i][1], thresholds[i][1]];
            color = d3.scaleLinear()
                .domain(arrThresholds)
                .range(arrColor)
                .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
            opa = d3.scaleLinear()
                .domain([left,thresholds[i][0],thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif])
                .range([1,1,0.3,0.06,0.3,1,1]);

        }
        else if (s == serviceList[i] && i==2){  // Memory_usage
            dif = (thresholds[i][1]-thresholds[i][0])/4;
            mid = thresholds[i][0]+(thresholds[i][1]-thresholds[i][0])/2;
            left=0;
            arrThresholds = [left,thresholds[i][0], 0, thresholds[i][0]+2*dif, 98, thresholds[i][1], thresholds[i][1]];
            color = d3.scaleLinear()
                .domain(arrThresholds)
                .range(arrColor)
                .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
            opa = d3.scaleLinear()
                .domain([left,thresholds[i][0],thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif])
                .range([1,1,0.3,0.06,0.3,1,1]);

        }
        else if (s == serviceList[i]){
            dif = (thresholds[i][1]-thresholds[i][0])/4;
            mid = thresholds[i][0]+(thresholds[i][1]-thresholds[i][0])/2;
            left = thresholds[i][0]-dif;
            if (left<0 && i!=0) // Temperature can be less than 0
                left=0;
            arrThresholds = [left,thresholds[i][0], thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif];
            color = d3.scaleLinear()
                .domain(arrThresholds)
                .range(arrColor)
                .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
            opa = d3.scaleLinear()
                .domain([left,thresholds[i][0],thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif])
                .range([1,1,0.3,0.06,0.3,1,1]);
        }
    }
}

function requestupdatetooltiip()
{
        d3.select('#tip').attr('material',{fps:1.5});
        $('#tip')[0].components.material.shader.__render();
        setTimeout(()=>{d3.select('#tip').attr('material',{fps:0});}, 100);
}

function processData(str, serviceName)
{
    if (serviceName == serviceList[0]){
        var a = [];
        if (str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0 ){
            a[0] = undefinedValue;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
        }
        else{
            var arrString =  str.split(" ");
            a[0] = +arrString[2]||undefinedValue;
            a[1] = +arrString[6]||undefinedValue;
            a[2] = +arrString[10]||undefinedValue;
        }
        return a;
    }
    else if (serviceName == serviceList[1]){
        var a = [];
        if (str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0
            || str.indexOf("CPU Load: null")>=0){
            a[0] = undefinedValue;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
        }
        else{
            var arrString =  str.split("CPU Load: ")[1];
            a[0] = +arrString;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
        }
        return a;
    }
    else if (serviceName == serviceList[2]) {
        var a = [];
        if (str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0 ){
            a[0] = undefinedValue;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
        }
        else{
            var arrString =  str.split(" Usage Percentage = ")[1].split(" :: ")[0];
            a[0] = +arrString;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
        }
        return a;
    }
    else if (serviceName == serviceList[3]) {
        var a = [];
        if (str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0 ){
            a[0] = undefinedValue;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
            a[3] = undefinedValue;
        }
        else{
            var arr4 =  str.split(" RPM ");
            a[0] = +arr4[0].split("FAN_1 ")[1];
            a[1] = +arr4[1].split("FAN_2 ")[1];
            a[2] = +arr4[2].split("FAN_3 ")[1];
            a[3] = +arr4[3].split("FAN_4 ")[1];
        }
        return a;
    }
    else if (serviceName == serviceList[4]) {
        var a = [];
        if (str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0 ){
            a[0] = undefinedValue;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
        }
        else{
            var maxConsumtion = 3.2;  // over 100%
            var arr4 =  str.split(" ");
            a[0] = +arr4[arr4.length-2]/maxConsumtion;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
        }
        return a;
    }
}

function updateTooltip3D(host_name)
{
    var levels = 6;
    var currentval = [];
    d3.keys(serviceListattr).forEach(d => {
        serviceListattr[d].val.forEach(key2=>{
            currentval.push(json[host_name][key2][time]);
        })
    });

    // Standardize data for Radar chart
    for (var j=0; j<currentval.length;j++){
        if (currentval[j] == undefinedValue || isNaN(currentval[j]))
            currentval[j] = -15;
        else if (j==2){   ////  Job load ***********************
            var scale = d3.scaleLinear()
                .domain([thresholds[1][0],thresholds[1][1]])
                .range([thresholds[0][0],thresholds[0][1]]);

            currentval[j] =  scale(currentval[j]);
        }
        else if (j==4 || j==5 ){   ////  Fans SPEED ***********************
            var scale = d3.scaleLinear()
                .domain([thresholds[3][0],thresholds[3][1]])
                .range([thresholds[0][0],thresholds[0][1]]); //interpolateHsl interpolateHcl interpolateRgb

            currentval[j] =  scale(currentval[j]);
        }
        else if (j==6){   ////  Power Consumption ***********************
            var scale = d3.scaleLinear()
                .domain([thresholds[4][0],thresholds[4][1]])
                .range([thresholds[0][0],thresholds[0][1]]); //interpolateHsl interpolateHcl interpolateRgb
            currentval[j] =  scale(currentval[j]);
        }
    }
    // textures
    var loader = new THREE.TextureLoader();
    var texture = loader.load( 'media/textures/disc.png' );

    // points
    var vertices = new THREE.DodecahedronGeometry(1).vertices;
    vertices.forEach((p,i)=> {
        p.x = p.x*0.1*ROOM_SIZE*(currentval[i/2]||50)/200*levels;
        p.y = p.y*0.1*ROOM_SIZE*(currentval[i/2]||50)/200*levels;
        p.z = p.z*0.1*ROOM_SIZE*(currentval[i/2]||50)/200*levels;});
    //console.log(currentval);
    console.log(vertices);
    scene.remove(tooltip);
    tooltip = new THREE.Group();
    scene.add( tooltip );
    // renew
    var loader = new THREE.TextureLoader();
    var texture = loader.load( 'media/textures/disc.png' );
    // for ( var i = 0; i < vertices.length; i ++ ) {
    //     //vertices[ i ].add( randomPoint().multiplyScalar( 2 ) ); // wiggle the points
    // }
    var pointsMaterial = new THREE.PointsMaterial( {
        color: 0x0080ff,
        map: texture,
        size: 0.01,
        alphaTest: 0.5
    } );
    var pointsGeometry = new THREE.Geometry().setFromPoints( vertices );

    var points = new THREE.Points( pointsGeometry, pointsMaterial );
    tooltip.add( points );
    //convex hull
    var meshMaterial = new THREE.MeshPhongMaterial( {
        color: 0x0080ff,
        opacity: 0.5,
        wireframe: true,
        transparent: true
    } );
    var meshGeometry = new THREE.ConvexGeometry( vertices );
    var mesh = new THREE.Mesh( meshGeometry, meshMaterial );
    mesh.material.side = THREE.BackSide; // back faces
    mesh.renderOrder = 0;
    tooltip.add( mesh );
    var mesh = new THREE.Mesh( meshGeometry, meshMaterial.clone() );
    mesh.material.side = THREE.FrontSide; // front faces
    mesh.renderOrder = 1;
    tooltip.add( mesh );
    //tooltip = new THREE.Mesh( tt_geometry, tt_material );
    tooltip.visible = true;
}