function stopUpdate()
{
    clearInterval(fillHost);
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
    fillHost = setInterval(function ()
    {

        if( hostObj[rack][host] )
        {
            updateHost( service, [rack,host,cpu,time], hostObj[rack][host][cpu] );

            // update scatterplot point per host (i.e. not per cpu)
            if( cpu == 1 )
                updateScatterPlotMatrix( "compute-"+rack+"-"+host, timestamp );
        }

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

function updateHost( service, keys, obj )
{
    var rack = keys[0];
    var host = keys[1];
    var cpu = keys[2];
    var time = keys[3];

    var key1 = "compute-"+rack+"-"+host;
    var key2 = service.includes("1") ? service.replace("1",cpu) : service;

    if( json[key1][key2][time] !=null )
    {
        obj.visible = true;
        obj.material.color = new THREE.Color( color(json[key1][key2][time]) );
        updateCPUMarker( obj );
    }
    else
    {
        obj.visible = false;
    }

}

function updateColorRange( service )
{
    setColorsAndThresholdsTooltip( service.replace("arr","")
                                        .replace("CPU1","")
                                        .replace("CPU2","")
                                        .replace("1","")
                                        .replace("2","")
                                        .replace("Power_usage","Power_consumption") );

    // var min = SERVICE[service]["dom"][0];
    // var max = SERVICE[service]["dom"][1];

    // var arrDom = [min,null,null,max];
    // arrDom[1] = min + (max-min)/3;
    // arrDom[2] = min + 2*(max-min)/3;
}

function updateCPUMarker( obj )
{
    var pos = new THREE.Vector3().setFromMatrixPosition( obj.matrixWorld )

    cpu_marker.position.x = pos.x;
    cpu_marker.position.y = pos.y + 0.005;
    cpu_marker.position.z = pos.z;
}

// scatterplot update
function updateScatterPlotMatrix( host, timestamp )
{
    // check if host exists
    if( json[host] == undefined )
        return 0;

    for( var sp=0; sp<scatter_plot_matrix.length; sp++ )
    {
        var plot = scatter_plot_matrix.matrix[sp];

        // get host raw new coordinates
        var services = plot.axes;
        var x = json[host][services[0]][timestamp-1] ? json[host][services[0]][timestamp-1] : 0;
        var y = json[host][services[1]][timestamp-1] ? json[host][services[1]][timestamp-1] : 0;
        var z = json[host][services[2]][timestamp-1] ? json[host][services[2]][timestamp-1] : 0;

        // update matrix data & scagnostic
        plot.updateData( plot.datakey[host], x, y, z );

        // update matrix content
        if( scatter_plot_matrix.isBinned )
            updateScatterPlotBins( host, x, y, z, plot );
        else
        {
            var c =  color( json[host][selectedService][timestamp-1] );
            updateScatterPlotPoints( host, x, y, z, c, plot );
        }
    }
}

function updateScatterPlotPoints( host, x, y, z, color, sp )
{
    var point = sp.points.obj[host];

    x = sp.x.fit(x);
    y = sp.y.fit(y);
    z = sp.z.fit(z);

    point.material.color = new THREE.Color( color );

    point.position.x = x;
    point.position.y = y;
    point.position.z = z;

    // var intervals = 20;
    // var xinterval = (x - point.position.x)/intervals;
    // var yinterval = (y - point.position.y)/intervals;
    // var zinterval = (z - point.position.z)/intervals;
    // var count = 0;

    // var movePoint = setInterval( function()
    // {
    //     point.position.x += xinterval;
    //     point.position.y += yinterval;
    //     point.position.z += zinterval;
    //     count++;

    //     if( count == intervals )
    //         clearInterval( movePoint );

    // }, 20 );

}

function updateScatterPlotBins( host, x, y, z, sp )
{
    // get old host bin coordinates
    var o_xb = sp.bins.getBinOf[host][0];
    var o_yb = sp.bins.getBinOf[host][1];
    var o_zb = sp.bins.getBinOf[host][2];

    // get new host bin coordinates
    var n_xb = sp.x.bin(x);
    var n_yb = sp.y.bin(y);
    var n_zb = sp.z.bin(z);

    // update current host bin coordinates
    sp.bins.getBinOf[host][0] = n_xb;
    sp.bins.getBinOf[host][1] = n_yb;
    sp.bins.getBinOf[host][2] = n_zb;

    // update binCount
    var o_new_op = ( --sp.bins.binCount[o_xb][o_yb][o_zb] ) * sp.bins.oneElement;   // increase one to count
    var n_new_op = ( ++sp.bins.binCount[n_xb][n_yb][n_zb] ) * sp.bins.oneElement;   // decrease one to count

    // update bin size
    sp.bins.bin[o_xb][o_yb][o_zb].material.opacity = o_new_op;                      // decrease old bin
    sp.bins.bin[n_xb][n_yb][n_zb].material.opacity = n_new_op;                      // increase new bin

    // dont show if empty
    sp.bins.bin[o_xb][o_yb][o_zb].visible = sp.bins.binCount[o_xb][o_yb][o_zb] != 0;
    sp.bins.bin[n_xb][n_yb][n_zb].visible = sp.bins.binCount[n_xb][n_yb][n_zb] != 0;
}

function moveScatterPlot( obj, x, y, z )
{
    var intervals = 20;
    // var xinterval = (x - obj.position.x)/intervals;
    var yinterval = (y - obj.position.y)/intervals;
    var zinterval = (z - obj.position.z)/intervals;
    var count = 0;

    var move = setInterval( function()
    {
        // obj.position.x -= xinterval;
        obj.position.y += yinterval;
        obj.position.z += zinterval;
        count++;

        if( count == intervals )
            clearInterval( move );

    }, 20 );
}

function highlightScatterPlot( hitbox, on )
{
    // skip highlight process if hitbox does not change
    if( hitbox.highlighted == on ) return 0;

    hitbox.highlighted = on;
    var sp = hitbox.children[0];
    if( on ) sp.visible = true;

    var intervals = 20;
    var z = on ? 0 : scatter_plot_matrix.scale * -1;
    var zinterval = ( z-sp.position.z ) /intervals;
    var count = 0;

    var move = setInterval( function()
    {
        sp.position.z += zinterval;
        count++;

        if( count == intervals )
        {
            if( !on ) sp.visible = false;
            hitbox.material.visible = !on;
            clearInterval( move );
        }

    }, 20 );
}

// lever update
function updateLever( start, end )
{
    var intervals = 10;
    var interval = (start - end)/intervals;
    var count = 0;

    var rotateLever = setInterval( function()
    {
        lever.pivot.rotation.x -= interval;
        count++;

        if( count == intervals )
            clearInterval( rotateLever );

    }, 20 );
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
    oldhostclicked = host;

    // highligh clickedhost

    // constructing tooltip
    var tmp = host.name.split("_");
    var host_name = host.name;
    // var pos = new THREE.Vector3().setFromMatrixPosition( camera.matrixWorld );

    tooltip.position.set(ROOM_SIZE*4,0,0);

    rectip.datum({className:{baseVal:host_name}});
    $('#placetip').triggerSVGEvent('click');
    d3.select('#d3-tip').attr("position", "absolute")
        .style("top", "0px")
        .style("left","10px");
    requestupdatetooltiip();

}

function setColorsAndThresholdsTooltip(s)
{
    for (var i=0; i<serviceList.length;i++)
    {
        dif = (thresholds[i][1]-thresholds[i][0])/4;
        mid = thresholds[i][0]+(thresholds[i][1]-thresholds[i][0])/2;
        if (s == serviceList[i] && i==1) // CPU_load
        {
            left=0;
            arrThresholds = [left,thresholds[i][0], 0, thresholds[i][0]+2*dif, 10, thresholds[i][1], thresholds[i][1]];
        }
        else if (s == serviceList[i] && i==2) // Memory_usage
        {  
            left=0;
            arrThresholds = [left,thresholds[i][0], 0, thresholds[i][0]+2*dif, 98, thresholds[i][1], thresholds[i][1]];
        }
        else if (s == serviceList[i])
        {
            left = thresholds[i][0]-dif;
            if (left<0 && i!=0) // Temperature can be less than 0
                left=0;
            arrThresholds = [left,thresholds[i][0], thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif];
        }


        color = d3.scaleLinear()
                    .domain(arrThresholds)
                    .range(arrColor)
                    .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb

        opa = d3.scaleLinear()
                .domain([left,thresholds[i][0],thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif])
                .range([1,1,0.3,0.06,0.3,1,1]);
    }
}

function requestupdatetooltiip()
{
        d3.select('#tip').attr('material',{fps:1.5});
        $('#tip')[0].components.material.shader.__render();
        $('#tip')[0].components.material.shader.__height=1024;
    var material = Object.assign({}, document.querySelector('#tip').getAttribute('material'))
    material.debug = '#debug';
    document.querySelector('#tip').setAttribute('material', material)
        // setTimeout(()=>{d3.select('#tip').attr('material',{fps:0});}, 100);
}
