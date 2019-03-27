function initQuanah()
{
    height = ROOM_SIZE*0.75;
    depth = ROOM_SIZE*0.1;
    width = ROOM_SIZE*0.4;
    separation = width + width*0.3;

    quanah = new THREE.Group();
    quanah.name = "quanah";

    for( var rack_num=1; rack_num<=RACK_NUM; rack_num++ )
    {
        quanah.add(addRack( rack_num, -1*separation*RACK_NUM/2 + separation*rack_num - ROOM_SIZE/2, -height/8, ROOM_SIZE * -0.8 ));
    }

    scene.add(quanah);
    quanah.position.x = ROOM_SIZE * 2;

    addCPUMarker();
    // addTooltip();
    resetService();
    reset();


    // functions

    function addRack( rack_num, x, y, z)
    {
        hostObj[rack_num] = {};

        var rack = new THREE.Group();
        rack.name = "rack_"+rack_num;
        rack.type = "rack";

        for( var host_num=1; host_num<=HOST_NUM; host_num++ )
        {
            key = "compute-"+rack_num+"-"+host_num;
            if( json[key] )
            {
                hostObj[rack_num][host_num] = {};
                rack.add(addHost(rack_num,host_num));
            }
        }

        addQuanahLabel( "RACK " + rack_num, "rack", rack );

        rack.position.set( x, y, z );
        return rack;
    }

    function addHost( rack_num, host_num )
    {
        var host_height = height/30;

        var host_geometry = new THREE.BoxLineGeometry( width/2, host_height, depth, 1, 1, 1 );
        var host_material = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 0.5 } );
        var host = new THREE.LineSegments( host_geometry, host_material );
        // var host = new THREE.Group();
        host.name = "compute-"+rack_num+"-"+host_num;
        host.type = "host";

        host.position.set( 0, 0, 0 );

        for( var cpu_num=1; cpu_num<=CPU_NUM; cpu_num++ )
        {
            hostObj[rack_num][host_num][cpu_num] = addCPU(rack_num,host_num,cpu_num);
            host.add(hostObj[rack_num][host_num][cpu_num]);
        }

        var x,y;

        if( host_num%2 == 1 )
        {
            y = host_height*15-(host_num)*height/60;
        }
        else
        {
            y = host_height*15-(host_num-1)*height/60;
        }

        x = (!(host_num%2))*width/2;
        // addQuanahLabel( "Host " + host_num, "host", host );
        host.position.set( x, y, 0 );

        return host;

    }

    function addCPU( rack_num, host_num, cpu_num )
    {
        var cpu_height = height/60;

        var cpu_geometry = new THREE.BoxGeometry( width/2, cpu_height, depth );
        var cpu_material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
        var cpu = new THREE.Mesh( cpu_geometry, cpu_material );
        cpu.name = "rack_"+rack_num+"_host_"+host_num+"_cpu_"+cpu_num;
        cpu.type = "cpu";

        var y = ( cpu_num%2 ) ? cpu_height/2 : -cpu_height/2;
        cpu.position.set( 0, y, 0 );

        return cpu;
    }

    function addQuanahLabel( text, type, obj )
    {
        var loader = new THREE.FontLoader();
        var material_text = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        var size, x, y, z;

        if( type == "rack" )
        {
            size = height/16, x = 0, y = height/1.75, z = 0;
        }
        else if( type == "host" )
        {
            size = height/60, x = -0.09, y = -0.005, z = depth/2+0.001;
        }
        else
        {
            size = height/10, x = 2.51, y = 20, z = -6;
        }

        loader.load( 'media/fonts/helvetiker_regular.typeface.json', function ( font ) {

            var geometry = new THREE.TextGeometry( text, {
                font: font,
                size: size,
                height: 0,
                curveSegments: 12,
                bevelEnabled: false
            } );

            var textMesh = new THREE.Mesh( geometry, material_text );
            textMesh.position.set( x, y, z );
            // textMesh.rotation.y = Math.PI/-2;

            textMesh.name = "quanah_label_"+text;
            textMesh.type = "quanah_label";

            obj.add( textMesh );
        } );

    }

    function addCPUMarker()
    {
        var cpu_marker_geometry = new THREE.BoxLineGeometry( width/2, height/60, depth, 1, 1, 1 );
        var cpu_marker_material = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 5 } );
        cpu_marker = new THREE.LineSegments( cpu_marker_geometry, cpu_marker_material );
        cpu_marker.name = "hpcc_cpu_marker";
        cpu_marker.type = "cpu_marker";
        scene.add(cpu_marker);
    }

    // ngan
    function addTooltip()
    {
        tooltip = d3.select("#tipgroup").node().object3D;
    }
}

// ngan
function animateTooltip()
{
    var pos = new THREE.Vector3().setFromMatrixPosition( camera.matrixWorld );
    tooltip.rotation.y = Math.atan2( ( pos.x - tooltip.position.x ), ( pos.z - tooltip.position.z ) );
}