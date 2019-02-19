function initControlPanel()
{
    initServiceControlPanel();
    initTimeControlPanel();
}

// service control panel init
function initServiceControlPanel()
{
    var serviceCP = ["arrTemperatureCPU1", "arrCPU_load", "arrMemory_usage", "arrFans_speed1", "arrPower_usage"];

    var num = serviceCP.length ;
    var s = ROOM_SIZE * 0.25
    var r = s/(2*Math.tan(Math.PI/num)) + s/15;

    service_control_panel = new THREE.Group();
    service_control_panel.name = "service_control_panel";

    for( var i=0; i<num; i++ )
    {
        var texture = new THREE.TextureLoader().load( "media/img/" + serviceCP[i] + ".png" );
        var geometry = new THREE.PlaneGeometry( s, s, s );
        var material = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: texture } );
        var plane = new THREE.Mesh( geometry, material );

        addServiceOutline( plane, serviceCP[i] );
        addServiceLabel( plane, serviceCP[i] );

        plane.type = "service_button";
        plane.name = serviceCP[i];

        plane.rotation.set( 0, i*2*Math.PI/num, 0 );
        plane.translateZ(r);

        service_control_panel.add( plane );
    }

    service_control_panel.position.set( ROOM_SIZE * -2.5, 0, 0.5 );
    scene.add( service_control_panel );


    // functions

    function addServiceLabel( obj, service )
    {
        var banner_geometry = new THREE.PlaneGeometry( s, s/4, s );
        var banner_material = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, color: 0x000000 } );
        var banner = new THREE.Mesh( banner_geometry, banner_material );

        var loader = new THREE.FontLoader();
        var text_material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
        var label = SERVICE[service]["value"].replace("1","");
        loader.load( 'media/fonts/helvetiker_regular.typeface.json', function ( font )
        {
            var text_geometry = new THREE.TextGeometry( label, {
                font: font,
                size: s/15,
                height: 0,
                curveSegments: 12,
                bevelEnabled: false
            } );

            var text = new THREE.Mesh( text_geometry, text_material );
            var x = ( service == serviceCP[4] ) ? -s/2.5 : -s/4;
            text.position.set( x, 0, 0.005 );

            text.name = "service_label_"+service;
            text.type = "service_label";

            banner.add( text );
        } );


        banner.position.set( 0, s - s/3 , 0 );
        addServiceOutline( banner, service );
        obj.add( banner );

    }

    function addServiceOutline( obj, service )
    {

        var outline_material = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.DoubleSide } );
        var outline = new THREE.Mesh( obj.geometry, outline_material );
        outline.position = obj.position;
        outline.translateZ(-0.005);
        outline.translateY(0.005);
        outline.scale.multiplyScalar(1.1);
        outline.type = "outline";
        outline.visible = ( service == selectedService ) ? true : false;
        obj.add( outline );

    }

}

// time control panel init
function initTimeControlPanel()
{
    time_control_panel = new THREE.Group();
    service_control_panel.name = "time_control_panel";

    var r = ROOM_SIZE * 0.25;
    var n = TS_NUM;

    var triangle = new THREE.Shape();
    triangle.moveTo(0,0);
    triangle.lineTo( r * Math.cos(0) , r * Math.sin(0) );
    triangle.lineTo( r * Math.cos(2 * Math.PI / n) , r * Math.sin(2 * Math.PI / n) );
    triangle.lineTo(0,0);

    var extrudeSettings = { depth: r/60, bevelEnabled: false };
    var pie_geometry = new THREE.ExtrudeGeometry( triangle, extrudeSettings );
    var pie_material = new THREE.MeshBasicMaterial( { color: 0xffffff } );

    for( var t=1; t<=n; t++ )
    {
        var pie = new THREE.Mesh( pie_geometry.clone(), pie_material.clone() );

        pie.rotateZ( Math.PI / 2 - ( 2*Math.PI/n / 2 * t ) - 2*Math.PI/n / 2 * (t-1) );

        pie.type = "timestamp";
        pie.name = t + "";

        // addTimeWire( pie );
        addTimeLabel( pie, t + "" );

        time_control_panel.add( pie );
        timeObj[pie.name] = pie;
    }

    addCover();
    addButton();

    time_control_panel.position.set( ROOM_SIZE * -3, 0, -0.5 );
    time_control_panel.rotation.y = Math.PI/2;
    scene.add(time_control_panel);

    // functions

    function addTimeWire( obj )
    {
        var wire_geometry = new THREE.EdgesGeometry( obj.geometry );
        var wire_material = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1 } )
        var wire = new THREE.LineSegments( wire_geometry, wire_material );
        wire.translateZ(1);
        wire.rotateX(Math.PI/2);
        obj.add( wire );
    }

    function addTimeLabel( obj, timestamp )
    {
        var loader = new THREE.FontLoader();
        var text_material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        loader.load( 'media/fonts/helvetiker_regular.typeface.json', function ( font )
        {
            var text_geometry = new THREE.TextGeometry( timestamp, {
                font: font,
                size: r/16,
                height: 0,
                curveSegments: 12,
                bevelEnabled: false
            } );

            var text = new THREE.Mesh( text_geometry, text_material );
            var y = ( TS_NUM > 20 ) ? r/10 : r/5 ;
            // console.log(r);
            text.position.set( r * 0.85, y, extrudeSettings.depth + 0.005 );
            text.rotateZ( -Math.PI/2 + 2*Math.PI/n / 2 );

            text.name = "time_label_"+timestamp;
            text.type = "time_label";

            obj.add( text );
        } );

    }

    function addCover()
    {
        var geometry = new THREE.CylinderGeometry( r*0.75, r*0.75, extrudeSettings.depth, 32 );
        var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        var cover = new THREE.Mesh( geometry, material );

        cover.type = "timestamp_cover";
        cover.name = "timestamp_cover";

        cover.translateZ( extrudeSettings.depth * 2 );
        cover.rotateX( Math.PI / 2 );
        addTimeWire( cover );
        time_control_panel.add( cover );
    }

    function addButton()
    {
        var geometry = new THREE.CylinderGeometry( r*0.3, r*0.3, extrudeSettings.depth, 32 );
        var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
        var button = new THREE.Mesh( geometry, material );
        button.translateZ( extrudeSettings.depth * 5 );
        button.rotateX( Math.PI / 2 );
        addTimeWire( button );

        var loader = new THREE.FontLoader();
        var text_material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        loader.load( 'media/fonts/helvetiker_regular.typeface.json', function ( font )
        {
            var text_geometry = new THREE.TextGeometry( "REAL\nTIME", {
                font: font,
                size: r/8,
                height: 0,
                curveSegments: 12,
                bevelEnabled: false
            } );

            var text = new THREE.Mesh( text_geometry, text_material );
            text.position.set( r/-5.5 , extrudeSettings.depth, r/-24 );
            text.rotateX( -Math.PI/2 );

            button.add( text );
        } );

        button.type = "REALTIME";
        button.name = "REALTIME";

        time_control_panel.add( button );
        timeObj[button.name] = button;

    }

}

// update service control panel colors
function updateSelectedService( obj )
{
    selectedService = INTERSECTED.name;

    var services = obj.parent.children;
    var children;

    // unhighlight non selected services
    for( var s=0; s<services.length; s++ )
    {
        children = services[s].children;
        for( var c=0; c<children.length; c++ )
            if( children[c].type == "outline" )
                children[c].visible = false;
            else
                for( var cc=0; cc<children[c].children.length; cc++ )
                    if( children[c].children[cc].type == "outline" )
                        children[c].children[cc].visible = false;
    }

    // highligh selected service
    children = obj.children;
    for( var c=0; c<children.length; c++ )
        if( children[c].type == "outline" )
            children[c].visible = true;
        else
            for( var cc=0; cc<children[c].children.length; cc++ )
                if( children[c].children[cc].type == "outline" )
                    children[c].children[cc].visible = true;

}

// update time control panel colors
function updateSelectedTimestamp( name )
{

    var obj = timeObj[name];

    var ts_depth = 10/60;
    var timestamps = obj.parent.children;

    for( var c=0; c<timestamps.length; c++ )
    {
        if( timestamps[c].type != "timestamp_cover" )
        {
            timestamps[c].material.color.setHex( 0xffffff );
            if( timestamps[c].type != "REALTIME" )
                timestamps[c].position.z = 0;
        }
    }

    obj.material.color.setHex( 0x00ff00 );

    if( obj.type == "timestamp" )
        obj.translateZ( ts_depth * 0.1 );

}

// animate control panel movement
function animateControlPanel()
{
    service_control_panel.rotation.y -= CP_SPEED;
    time_control_panel.rotation.z += CP_SPEED/4;
    timeObj["REALTIME"].rotation.y -= CP_SPEED/4;
}