function ScatterPlotMatrix( axes_matrix, ranges_matrix, intervals, dataid, data_matrix, bin_size, scale )
{
    this.matrix = {};
    this.graph = new THREE.Group();

    for( var p=0; p<axes_matrix.length; p++ )
    {
        this.length = p+1;
        this.matrix[p] = new ScatterPlot( axes_matrix[p],
                                        ranges_matrix[p],
                                        intervals,
                                        dataid,
                                        data_matrix[p],
                                        bin_size,
                                        scale );
        this.graph.add( this.matrix[p].graph );

        // setting inner scatter plot position
        this.matrix[p].graph.position.z = SERVICE[axes_matrix[p][2]].sp_pos * scale * 1.5; // temperature
        this.matrix[p].graph.position.y = SERVICE[axes_matrix[p][1]].sp_pos * scale * 1.5; // fans speed
        this.matrix[p].graph.position.x = SERVICE[axes_matrix[p][0]].sp_pos * scale * 1.5; // other service

        // hiding legends
        if( SERVICE[axes_matrix[p][2]].sp_pos == 0 )
            this.matrix[p].toggleAxisLegend( 0 );
        if( SERVICE[axes_matrix[p][0]].sp_pos != 0 )
        {
            this.matrix[p].toggleAxisLegend( 1 );
            this.matrix[p].toggleAxisLegend( 2 );
        }
        if( SERVICE[axes_matrix[p][2]].sp_pos != 0 &
            SERVICE[axes_matrix[p][0]].sp_pos == 0 )
            this.matrix[p].toggleAxisLegend( 1 );
        if( SERVICE[axes_matrix[p][1]].sp_pos != 0 &
            SERVICE[axes_matrix[p][0]].sp_pos == 0 )
            this.matrix[p].toggleAxisLegend( 2 );
        if( SERVICE[axes_matrix[p][2]].sp_pos != 0 &
            SERVICE[axes_matrix[p][1]].sp_pos != 0 )
            this.matrix[p].toggleAxisLegend( 0 );
        
    }
}

function ScatterPlot( axes, ranges, intervals, dataid, data, bin_size, scale )
{
    // building scatter plot
    var population = data.length;

    var x = setInfo( 0 );
    var y = setInfo( 1 );
    var z = setInfo( 2 );

    var graph = new THREE.Group();
    var grid = setGrid();
    var points = setPoints( true );

    graph.add( grid );
    graph.add( points );

    this.graph = graph;
    this.grid = grid;
    this.points = points;
    this.axes = axes;
    this.x = x;
    this.y = y;
    this.z = z;
    this.data = data;

    // functions

    function fit( val, axis )
    {
        if( val == undefined ) return 0;
        if( axis.range == 0 ) return 0;
        return scale * (val - axis.min) / axis.range;
    }

    function setInfo( axis )
    {
        var info = {};
        info.min = ranges[axis][0];
        info.max = ranges[axis][1];
        info.range = info.max - info.min;
        info.name = axis == 0 ? "x" : axis == 1 ? "y" : "z";
        info.legend = axes[axis];

        return info;
    }

    function setGrid()
    {
        var grid = new THREE.Group();
        grid.name = "scatterplot-grid";

        // box
        var box_material = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1 } );
        var box_geometry = new THREE.Geometry();
        box_geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ), 
                                    new THREE.Vector3( scale, 0, 0 ),
                                    new THREE.Vector3( scale, scale, 0 ),
                                    new THREE.Vector3( 0, scale, 0 ),
                                    new THREE.Vector3( 0, 0, 0 ),
                                    new THREE.Vector3( 0, 0, scale ),
                                    new THREE.Vector3( scale, 0, scale ),
                                    new THREE.Vector3( scale, scale, scale ),
                                    new THREE.Vector3( 0, scale, scale ),
                                    new THREE.Vector3( 0, 0, scale ),
                                    new THREE.Vector3( 0, scale, scale ),
                                    new THREE.Vector3( 0, scale, 0 ),
                                    new THREE.Vector3( scale, scale, 0 ),
                                    new THREE.Vector3( scale, scale, scale ),
                                    new THREE.Vector3( scale, 0, scale ),
                                    new THREE.Vector3( scale, 0, 0 ) );
        var box = new THREE.Line( box_geometry, box_material );
        box.name = "scatterplot-grid";

        var back_geometry = new THREE.BoxGeometry( scale, scale, scale );
        var back_material = new THREE.MeshBasicMaterial( {color: 0x000000, transparent: true, opacity: 0.2, side: THREE.BackSide} );
        var background = new THREE.Mesh( back_geometry, back_material );
        background.position.set(scale/2,scale/2,scale/2);
        // box.add( background );

        grid.add( box );
        grid.add( setMarks() );

        addAxisLegend( grid, x );
        addAxisLegend( grid, y );
        addAxisLegend( grid, z );

        function setMarks()
        {
            var marks = new THREE.Group();
            marks.name = "scatterplot-marks";
            var no_marks = intervals;
            var xmark = [];
            var ymark = [];
            var zmark = [];

            var mark_material = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1 } );
            var mark_length = -1*scale/15;
            var line, mark_geometry, v, start, end;

            for( var i=0; i<no_marks; i++ )
            {
                v = scale * i/(no_marks-1);

                // x marks
                mark_geometry = new THREE.Geometry();
                start = new THREE.Vector3( v, 0, scale );
                end = new THREE.Vector3( v, 0, scale + mark_length * -1 );
                mark_geometry.vertices.push( start, end );
                line = new THREE.Line( mark_geometry.clone(), mark_material.clone() );
                addIntervalLegend( line, x, i, end );
                xmark.push( line );
                marks.add(xmark[i]);

                // y marks
                mark_geometry = new THREE.Geometry();
                start = new THREE.Vector3( 0, v, 0 );
                end = new THREE.Vector3( 0, v, mark_length );
                mark_geometry.vertices.push( start, end );
                line = new THREE.Line( mark_geometry.clone(), mark_material.clone() );
                addIntervalLegend( line, y, i, end );
                ymark.push( line );
                marks.add( ymark[i] );

                // z marks
                mark_geometry = new THREE.Geometry();
                start = new THREE.Vector3( 0, 0, v );
                end = new THREE.Vector3( 0, mark_length, v );
                mark_geometry.vertices.push( start, end );
                line = new THREE.Line( mark_geometry.clone(), mark_material.clone() );
                addIntervalLegend( line, z, i, end );
                zmark.push( line );
                marks.add(zmark[i]);

            }

            function addIntervalLegend( obj, axis, interval, pos )
            {

                var num = axis.min + axis.range * interval / (no_marks-1);
                num = Math.round(num*100)/100;
                // console.log(legend);

                var loader = new THREE.FontLoader();
                var legend_material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );

                loader.load( 'media/fonts/helvetiker_regular.typeface.json', function ( font ) {

                    var legend_geometry = new THREE.TextGeometry( num + "", {
                        font: font,
                        size: scale/30,
                        height: 0,
                        curveSegments: 12,
                        bevelEnabled: false
                    } );

                    var legend = new THREE.Mesh( legend_geometry, legend_material );
                    legend.name = "mark";

                    if( axis.name == "x" )
                        legend.position.set( pos.x, pos.y + mark_length/2, pos.z );
                    if( axis.name == "y" )
                    {
                        legend.position.set( pos.x, pos.y, pos.z * 3 );
                        legend.rotation.set( Math.PI/2, Math.PI/-2, Math.PI/2 );
                    }
                    if( axis.name == "z" )
                    {
                        legend.position.set( pos.x, pos.y + mark_length/2, pos.z );
                        legend.rotation.set( Math.PI/2, Math.PI/-2, Math.PI/2 );
                    }

                    obj.add( legend );
                } );

            }

            return marks;
        }

        function addAxisLegend( obj, axis )
        {
            var loader = new THREE.FontLoader();
            var legend_material = new THREE.MeshBasicMaterial( { color: 0xffffff } );

            // legend background/hitbox
            var hitbox_material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
            var hitbox_geometry = new THREE.BoxGeometry( scale, scale/10, scale/500 );
            var hitbox = new THREE.Mesh( hitbox_geometry, hitbox_material );

            loader.load( 'media/fonts/helvetiker_regular.typeface.json', function ( font ) {

                var legend_geometry = new THREE.TextGeometry( axis.legend, {
                    font: font,
                    size: scale/20,
                    height: 0,
                    curveSegments: 12,
                    bevelEnabled: false
                } );

                var legend = new THREE.Mesh( legend_geometry, legend_material );
                axis.obj = hitbox;
                hitbox.add( legend );
                // setAxesMenu( hitbox );
                legend.position.set( scale/-3.5, scale/-75, scale/500);
                hitbox.type = "axis";

                if( axis.name == "x" )
                {
                    hitbox.name = "x-axis";
                    hitbox.position.set( scale/2, scale/-4, scale + scale/15 );
                }
                if( axis.name == "y" )
                {
                    hitbox.name = "y-axis";
                    hitbox.position.set( 0, scale/2, scale/-3 );
                    hitbox.rotation.set( 0, Math.PI/-2, Math.PI/2 );
                }
                if( axis.name == "z" )
                {
                    hitbox.name = "z-axis";
                    hitbox.position.set( 0, scale/-4, scale/2 );
                    hitbox.rotation.set( Math.PI/2, Math.PI/-2, Math.PI/2 );
                }

            } );

            axis.obj = hitbox;
            obj.add( hitbox );
        }

        function setAxesMenu( obj )
        {
            var axesmenu = new THREE.Group();
            axesmenu.name = "scatterplot-axesmenu";

            for( var a=0; a<axes.length; a++ )
            {
                getOption( axesmenu, a );
            }

            function getOption( menu, a )
            {
                var loader = new THREE.FontLoader();
                var legend_material = new THREE.MeshBasicMaterial( { color: 0x000000 } );

                // axis option background/hitbox
                var hitbox_material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
                var hitbox_geometry = new THREE.BoxGeometry( scale, scale/10, scale/500 );
                var hitbox = new THREE.Mesh( hitbox_geometry, hitbox_material );

                loader.load( 'media/fonts/helvetiker_regular.typeface.json', function ( font ) {

                    var legend_geometry = new THREE.TextGeometry( axes[a], {
                        font: font,
                        size: scale/20,
                        height: 0,
                        curveSegments: 12,
                        bevelEnabled: false
                    } );
    
                    var legend = new THREE.Mesh( legend_geometry, legend_material );
                    hitbox.add( legend );
                    legend.position.set( scale/-3.5, scale/-75, scale/500);
                    hitbox.type = "axis-option";
                    hitbox.position.y = ( a + 1 ) * scale/-10;
                    menu.add( hitbox );
                } );
            }

            axesmenu.visible = false;
            obj.menu = axesmenu;
            obj.add( axesmenu );
        }

        return grid;
    }

    function setPoints( isInit )
    {
        var points = new THREE.Group();
        points.name = "scatterplot-points";
        var pos = [0, 0, 0];
        points.obj = {};

        for( var p=0; p<population; p++ )
        {
            if( data[p][0] )
            {
                pos[0] = fit( data[p][0], x );
            }
            else
            {
                pos[0] = 0;
            }

            if( data[p][1] )
            {
                pos[1] = fit( data[p][1], y );
            }
            else
            {
                pos[1] = 0;
            }

            if( data[p][2] )
            {
                pos[2] = fit( data[p][2], z );
            }
            else
            {
                pos[2] = 0;
            }

            var material = new THREE.MeshPhongMaterial( { color: 0x000000 } );
            var geometry = new THREE.SphereGeometry( 0.0025, 8, 8 );
            var point = new THREE.Mesh( geometry, material );

            if( isInit )
                point.position.set( 0, 0, 0 );
            else
                point.position.set( pos[0], pos[1], pos[2] );
            point.name = dataid[p];
            points.add( point );
            points.obj[dataid[p]] = point;
        }

        return points;
    }

    this.fit = function fit( val, axis )
    {
        if( val == undefined ) return 0;
        if( axis.range == 0 ) return 0;
        return scale * (val - axis.min) / axis.range;
    }

    this.toggleAxisLegend = function( axis )
    {
        if( axis == 0 )
            this.x.obj.visible = !this.x.obj.visible;
        if( axis == 1 )
            this.y.obj.visible = !this.y.obj.visible;
        if( axis == 2 )
            this.z.obj.visible = !this.z.obj.visible;
    }

}