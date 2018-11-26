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
        case "Power_consumption":
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
    return 0;
}

function updateColorRange( service )
{
    setColorsAndThresholds( service );

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
        case "Power_consumption":
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

    // constructing tooltip
    var tmp = host.name.split("_")
    var host_name = "compute-"+tmp[1]+"-"+tmp[3]
    rectip.datum(host_name);
    $('#placetip').triggerSVGEvent('click');

    var tooltip_html = document.getElementsByClassName("radarChart")[0];
    tooltip_html.style.backgroundColor = "gray";
    domtoimage.toJpeg( tooltip_html ).then( function(url) { tooltip_png.src = url; tooltip_html.style.display = "none";} );
       
    tooltip.visible = true;
    var pos = new THREE.Vector3().setFromMatrixPosition( camera.matrixWorld )

    tooltip.position.x = pos.x;
    tooltip.position.y = pos.y;
    tooltip.position.z = pos.z - 0.3;
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
