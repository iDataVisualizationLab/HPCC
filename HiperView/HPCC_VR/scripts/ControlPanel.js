function initControlPanel()
{
    initServiceControlPanel();
    initTimeControlPanel();
    initScoreControlPanel();
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

    service_control_panel.position.set( ROOM_SIZE * -1.5, 0, 0.5 );
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

    time_control_panel.position.set( ROOM_SIZE * -1.25, 0.5, 0.5 );
    time_control_panel.rotateY( Math.PI/2 )
    time_control_panel.rotateX( Math.PI/8 );
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

// score control panel init
function initScoreControlPanel()
{
    var score = Object.keys(SCORE);

    var num = score.length ;
    var s = ROOM_SIZE * 0.1;
    var r = (s/2)/(2*Math.tan(Math.PI/num)) + s/20;

    score_control_panel = new THREE.Group();
    score_control_panel.name = "score_control_panel";
    score_control_panel.rotation_interval = 2*Math.PI/num;
    var cylinder = new THREE.Group();
    cylinder.slider = {};
    cylinder.name = "score-cylinder";

    for( var i=0; i<num; i++ )
    {
        // adding plane
        var plane_geometry = new THREE.PlaneGeometry( s/2, s*3, s );
        var plane_material = new THREE.MeshPhongMaterial( { side: THREE.DoubleSide, color: 0x777777 } );
        var plane = new THREE.Mesh( plane_geometry, plane_material );
        plane.type = "score_plane";
        plane.name = score[i];
        addScoreLabel( plane, score[i] );

        // adding black space
        var height_geometry = new THREE.PlaneGeometry( s/15, s*2.5, s );
        var height_material = new THREE.MeshPhongMaterial( { color: 0x000000 } );
        var height = new THREE.Mesh( height_geometry, height_material );
        plane.add( height );
        height.translateZ( 0.001 );

        // positioning plane
        plane.rotation.set( 0, i*score_control_panel.rotation_interval, 0 );
        plane.translateZ(r);
        
        // adding slider
        var slider_geometry = new THREE.CylinderGeometry( s/40, s/40, s/4, 32 );
        var slider_material = new THREE.MeshPhongMaterial( { color: 0xdddddd } );
        var slider = new THREE.Mesh( slider_geometry, slider_material );
        slider.name = "slider-" + score[i];
        slider.type = "slider";
        slider.score = 1;
        slider.initial = s*2.5/2;
        cylinder.slider[name] = slider;

        // positioning slider
        slider.translateY( slider.initial - SCORE[score[i]] * 10 * slider.initial/5 );
        slider.rotation.set( 0, i*score_control_panel.rotation_interval, 0 );
        slider.translateZ(r + s/40);
        slider.rotateZ( Math.PI/2 );

        // adding left and right arrows
        var arrowl = new THREE.Shape();
        arrowl.moveTo( 0, 0 );
        arrowl.lineTo( s/4, 0 );
        arrowl.lineTo( s/8, s/8 );
        arrowl.lineTo( 0, 0 );
        var extrudeSettings = { amount: 0.001, bevelEnabled: false };
        var arrowl_geometry = new THREE.ExtrudeGeometry( arrowl, extrudeSettings );
        var arrowl_mesh = new THREE.Mesh( arrowl_geometry, new THREE.MeshPhongMaterial( { color: 0xdddddd }) );
        arrowl_mesh.type = "arrow_left";
        arrowl_mesh.name = score[i];

        var arrowr = new THREE.Shape();
        arrowr.moveTo( 0, 0 );
        arrowr.lineTo( s/-4, 0 );
        arrowr.lineTo( s/-8, s/-8 );
        arrowr.lineTo( 0, 0 );
        var arrowr_geometry = new THREE.ExtrudeGeometry( arrowr, extrudeSettings );
        var arrowr_mesh = new THREE.Mesh( arrowr_geometry, new THREE.MeshPhongMaterial( { color: 0xdddddd }) );
        arrowr_mesh.type = "arrow_right";
        arrowr_mesh.name = score[i];

        // positioning left and right arrows
        arrowl_mesh.rotation.set( 0, i*score_control_panel.rotation_interval, 0 );
        arrowr_mesh.rotation.set( 0, i*score_control_panel.rotation_interval, 0 );
        arrowl_mesh.translateZ(r + s/40);
        arrowr_mesh.translateZ(r + s/40);
        arrowl_mesh.translateY(s*1.3);
        arrowr_mesh.translateY(s*-1.3);
        arrowl_mesh.translateX(s/-8);
        arrowr_mesh.translateX(s/8);

        // adding plane and slider
        cylinder.add( plane );
        cylinder.add( cylinder.slider[name] );
        cylinder.add( arrowl_mesh );
        cylinder.add( arrowr_mesh );

    }

    // adding up and down arrows
    var arrowu = new THREE.Shape();
    arrowu.moveTo( 0, 0 );
    arrowu.lineTo( 0, s/4 );
    arrowu.lineTo( s/8, s/8 );
    arrowu.lineTo( 0, 0 );
    var extrudeSettings = { amount: 0.001, bevelEnabled: false };
    var arrowu_geometry = new THREE.ExtrudeGeometry( arrowu, extrudeSettings );
    var arrowu_mesh = new THREE.Mesh( arrowu_geometry, new THREE.MeshPhongMaterial( { color: 0x777777 }) );
    arrowu_mesh.type = "arrow_up";

    var arrowd = new THREE.Shape();
    arrowd.moveTo( 0, 0 );
    arrowd.lineTo( 0, s/4 );
    arrowd.lineTo( s/-8, s/8 );
    arrowd.lineTo( 0, 0 );
    var arrowd_geometry = new THREE.ExtrudeGeometry( arrowd, extrudeSettings );
    var arrowd_mesh = new THREE.Mesh( arrowd_geometry, new THREE.MeshPhongMaterial( { color: 0x777777 }) );
    arrowd_mesh.type = "arrow_down";

    // positioning up and down arrows
    arrowu_mesh.translateZ(r + s/40);
    arrowd_mesh.translateZ(r + s/40);
    arrowu_mesh.translateY(s*2.7);
    arrowd_mesh.translateY(s*2.7);
    arrowu_mesh.translateX(s/20);
    arrowd_mesh.translateX(s/-20);

    score_control_panel.add( arrowu_mesh );
    score_control_panel.add( arrowd_mesh );

    // adding number labels
    var line_geometry = new THREE.Geometry();
    var line_material = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1 } );
    line_geometry.vertices.push( new THREE.Vector3( 0, 0, r+s/40 ), new THREE.Vector3( s*2.5, 0, r+s/40 ) );
    var line = new THREE.Line( line_geometry, line_material );

    for( var m=0; m<11; m++ )
    {
        var mark_geometry = new THREE.Geometry();
        var mark_material = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1 } );
        mark_geometry.vertices.push(new THREE.Vector3( 0, 0, 0),new THREE.Vector3( 0, s/20, 0 ));
        var mark = new THREE.Line( mark_geometry, mark_material );
        addMarkLabel( m/10, mark );
        line.add( mark );
        mark.position.z = r+s/40;
        mark.position.x = m*s*2.5/10;
    }

    line.translateY( s*2.5/2 );
    line.translateX( s/10 );
    line.rotateZ( Math.PI/2 );
    line.rotateZ( Math.PI );
    score_control_panel.add( line );

    score_control_panel.cylinder = cylinder;
    score_control_panel.add( score_control_panel.cylinder );
    score_control_panel.position.set( ROOM_SIZE * -1.25, -0.25, 0.45 );
    score_control_panel.rotateZ( Math.PI/2 );
    score_control_panel.rotateX( Math.PI/2 );
    score_control_panel.rotateY( 2*Math.PI/num );
    scene.add( score_control_panel );


    // functions

    function addScoreLabel( obj, label )
    {
        var banner_geometry = new THREE.PlaneGeometry( s, s/2, s );
        var banner_material = new THREE.MeshPhongMaterial( { side: THREE.DoubleSide, color: 0x777777 } );
        var banner = new THREE.Mesh( banner_geometry, banner_material );

        var loader = new THREE.FontLoader();
        var text_material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
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
            text.position.set( -s/3, 0, 0.005 );

            text.name = "score_label_"+label;
            text.type = "score_label";

            banner.add( text );
        } );


        banner.position.set( 0, s*1.6 + s/2, 0 );
        banner.rotateZ( Math.PI/-2 );
        obj.add( banner );

    }

    function addMarkLabel( label, obj )
    {
        var loader = new THREE.FontLoader();
        var text_material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        loader.load( 'media/fonts/helvetiker_regular.typeface.json', function ( font )
        {
            var text_geometry = new THREE.TextGeometry( label+"", {
                font: font,
                size: s/20,
                height: 0,
                curveSegments: 12,
                bevelEnabled: false
            } );

            var text = new THREE.Mesh( text_geometry, text_material );
            text.position.set( -s/40, s/20, 0 );
            obj.add( text );
        } );
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

// filter all scatter plot matrix
function filterScatterPlotMatrix()
{

    // check if scatter plot matrix has been initialized
    if( scatter_plot_matrix == undefined ) return 0;

    // reset lebel highlight
    scatter_plot_matrix.resetLabelHighlight();

    // loop through matrix
    for( sp in scatter_plot_matrix.matrix )
    {
        if( !scatter_plot_matrix.matrix.hasOwnProperty(sp) ) continue;          // check if attribute is valid
        if( scatter_plot_matrix.matrix[sp] == undefined ) continue;             // check if sp has been initialized
        if( scatter_plot_matrix.matrix[sp].scag == null ) continue;             // check if scag has been calculated

        var filter_result = true;

        // loop through scores
        for( score in SCORE )
        {
            if( !SCORE.hasOwnProperty(score) ) continue;                        // check if attribute is valid
            filter_result &= (scatter_plot_matrix.matrix[sp].scag[score] >= SCORE[score]);
            if(!filter_result) break;
        }
        highlightScatterPlot( scatter_plot_matrix.matrix[sp].hitbox, filter_result );
    }
}

// filter scatter plot
function filterScatterPlot( sp )
{
    var filter_result = true;

    // loop through scores
    for( score in SCORE )
    {
        if( !SCORE.hasOwnProperty(score) ) continue;
        filter_result &= (sp.scag[score] >= SCORE[score]);
        if(!filter_result) break;
    }
    highlightScatterPlot( sp.hitbox, filter_result );
}