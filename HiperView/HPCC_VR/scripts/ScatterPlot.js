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

function ScatterPlot( axes, ranges, intervals, dataid, data, scale )
{
    // building scatter plot
    var population = data.length;
    var bin, binCount;

    var x = setInfo( 0 );
    var y = setInfo( 1 );
    var z = setInfo( 2 );

    var graph = new THREE.Group();
    var grid = setGrid();
    // var points = setPoints( true );

    initBins( intervals - 1 );
    var bins = setBins();

    // var scag = setScagnostics();

    graph.add( grid );
    // graph.add( points );
    graph.add( x.obj );
    graph.add( y.obj );
    graph.add( z.obj );
    graph.add( bins );

    this.graph = graph;
    this.grid = grid;
    // this.points = points;
    this.axes = axes;
    this.x = x;
    this.y = y;
    this.z = z;
    this.data = data;
    this.bins = bins;
    this.bin = bin;
    // this.scag = scag;

    // functions

    function initBins( size )
    {
        bin = {}, binCount = {};
        for( var bx=0; bx<size; bx++ )
        {
            bin[bx] = {}, binCount[bx] = {};
            for( var by=0; by<size; by++ )
            {
                bin[bx][by] = {}, binCount[bx][by] = {};
                for( var bz=0; bz<size; bz++ )
                {
                    bin[bx][by][bz] = null, binCount[bx][by][bz] = 0;
                }
            }
        }
    }

    function setInfo( axis )
    {
        var info = {};
        info.min = ranges[axis][0];
        info.max = ranges[axis][1];
        info.range = info.max - info.min;
        info.name = axis == 0 ? "x" : axis == 1 ? "y" : "z";
        info.legend = axes[axis];
        info.obj = setAxis( axis, info );
        info.binSize = intervals - 1;

        info.bin = function( n )
        {
            var interval = this.range/this.binSize+this.min;
            for( var b=0; b<this.binSize; b++ )
            {
                if( n>b*interval & n<(b+1)*interval)
                    return b;
            }
            return 0;
        }

        info.fit = function( n )
        {
            if( n == undefined ) return 0;
            if( this.range == 0 ) return 0;
            return scale * (n - this.min) / this.range;
        }

        info.match = function( b )
        {
            var interval = this.range/this.binSize;
            var pos = b*interval*1 + this.min + interval/2;
            return this.fit(pos);
        }

        return info;
    }

    function setScagnostics()
    {
        var tmp = [], tmp2;
        for( var i=0; i<data.length; i++ )
        {
            tmp2 = [0,0,0];
            tmp2[0] = data[i][0] == undefined ? 0 : data[i][0] ;
            tmp2[1] = data[i][1] == undefined ? 0 : data[i][1] ;
            tmp2[2] = data[i][2] == undefined ? 0 : data[i][2] ;
            tmp.push( tmp2 );
        }

        return scagnostics3d( tmp );
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

        // // scatterplot background
        // var back_geometry = new THREE.BoxGeometry( scale, scale, scale );
        // var back_material = new THREE.MeshBasicMaterial( {  color: 0x000000,
        //                                                     transparent: true,
        //                                                     opacity: 0.1,
        //                                                     side: THREE.BackSide } );
        // var background = new THREE.Mesh( back_geometry, back_material );
        // background.position.set(scale/2,scale/2,scale/2);
        // box.add( background );
        grid.add( box );

        return grid;
    }

    function setAxis( axis, obj )
    {
        var group = new THREE.Group();
        group.add( setMarks() );
        addAxisLegend( group );

        return group;

        function setMarks()
        {
            var marks = new THREE.Group();
            marks.name = "axis-marks";
            var no_marks = intervals;
            var axismark = [];

            var mark_material = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1 } );
            var mark_length = -1*scale/15;
            var line, mark_geometry, v, start, end;

            for( var i=0; i<no_marks; i++ )
            {
                v = scale * i/(no_marks-1);

                if( axis == 0 )  // x marks
                {
                    mark_geometry = new THREE.Geometry();
                    start = new THREE.Vector3( v, 0, scale );
                    end = new THREE.Vector3( v, 0, scale + mark_length * -1 );
                    mark_geometry.vertices.push( start, end );
                    line = new THREE.Line( mark_geometry.clone(), mark_material.clone() );
                    addIntervalLegend( line, i, end );
                    axismark.push( line );
                    marks.add(axismark[i]);
                }
                else if( axis == 1 )  // y marks
                {
                    mark_geometry = new THREE.Geometry();
                    start = new THREE.Vector3( 0, v, 0 );
                    end = new THREE.Vector3( 0, v, mark_length );
                    mark_geometry.vertices.push( start, end );
                    line = new THREE.Line( mark_geometry.clone(), mark_material.clone() );
                    addIntervalLegend( line, i, end );
                    axismark.push( line );
                    marks.add( axismark[i] );
                }
                else  // z marks
                {
                    mark_geometry = new THREE.Geometry();
                    start = new THREE.Vector3( 0, 0, v );
                    end = new THREE.Vector3( 0, mark_length, v );
                    mark_geometry.vertices.push( start, end );
                    line = new THREE.Line( mark_geometry.clone(), mark_material.clone() );
                    addIntervalLegend( line, i, end );
                    axismark.push( line );
                    marks.add(axismark[i]);
                }

            }

            function addIntervalLegend( line, interval, pos )
            {

                var num = obj.min + obj.range * interval / (no_marks-1);
                num = Math.round(num*100)/100;

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

                    if( axis == 0 )
                        legend.position.set( pos.x, pos.y + mark_length/2, pos.z );
                    else if( axis == 1 )
                    {
                        legend.position.set( pos.x, pos.y, pos.z * 3 );
                        legend.rotation.set( Math.PI/2, Math.PI/-2, Math.PI/2 );
                    }
                    else
                    {
                        legend.position.set( pos.x, pos.y + mark_length/2, pos.z );
                        legend.rotation.set( Math.PI/2, Math.PI/-2, Math.PI/2 );
                    }

                    line.add( legend );
                } );

            }

            return marks;
        }

        function addAxisLegend( group )
        {
            var loader = new THREE.FontLoader();
            var legend_material = new THREE.MeshBasicMaterial( { color: 0xffffff } );

            // legend background/hitbox
            var hitbox_material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
            var hitbox_geometry = new THREE.BoxGeometry( scale, scale/10, scale/500 );
            var hitbox = new THREE.Mesh( hitbox_geometry, hitbox_material );

            loader.load( 'media/fonts/helvetiker_regular.typeface.json', function ( font ) {

                var legend_geometry = new THREE.TextGeometry( SERVICE[obj.legend].value, {
                    font: font,
                    size: scale/20,
                    height: 0,
                    curveSegments: 12,
                    bevelEnabled: false
                } );

                var legend = new THREE.Mesh( legend_geometry, legend_material );
                hitbox.add( legend );
                // setAxesMenu( hitbox );
                legend.position.set( scale/-3.5, scale/-75, scale/500);
                hitbox.type = "axis";

                if( obj.name == "x" )
                {
                    hitbox.name = "x-axis";
                    hitbox.position.set( scale/2, scale/-4, scale + scale/15 );
                }
                if( obj.name == "y" )
                {
                    hitbox.name = "y-axis";
                    hitbox.position.set( 0, scale/2, scale/-3 );
                    hitbox.rotation.set( 0, Math.PI/-2, Math.PI/2 );
                }
                if( obj.name == "z" )
                {
                    hitbox.name = "z-axis";
                    hitbox.position.set( 0, scale/-4, scale/2 );
                    hitbox.rotation.set( Math.PI/2, Math.PI/-2, Math.PI/2 );
                }

            } );

            group.add( hitbox );
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
                pos[0] = x.fit( data[p][0] );
            }
            else
            {
                pos[0] = 0;
            }

            if( data[p][1] )
            {
                pos[1] = y.fit( data[p][1] );
            }
            else
            {
                pos[1] = 0;
            }

            if( data[p][2] )
            {
                pos[2] = z.fit( data[p][2] );
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

    function setBins()
    {
        var bins = new THREE.Group();

        // setting binCount
        var xb, yb, zb;
        for( var p=0; p<population; p++ )
        {
            xb = x.bin( data[p][0] );
            yb = y.bin( data[p][1] );
            zb = z.bin( data[p][2] );
            
            binCount[xb][yb][zb] = binCount[xb][yb][zb]+1;
        }

        // setting bin
        for( xb in bin )
        {
            if( !bin.hasOwnProperty(xb) ) continue;

            for( yb in bin )
            {
                if( !bin[xb].hasOwnProperty(yb) ) continue;

                for( zb in bin[xb][yb] )
                {
                    if( !bin[xb][yb].hasOwnProperty(zb) ) continue;

                    if( !binCount[xb][yb][zb] ) continue;

                    // if( xb != 2 | yb != 2 | zb != 2 ) continue;

                    var material = new THREE.MeshPhongMaterial( { color: 0x000000 } );
                    var geometry = new THREE.SphereGeometry( 0.0005 * binCount[xb][yb][zb], 16, 16 );
                    var point = new THREE.Mesh( geometry, material );
                    point.count = binCount[xb][yb][zb];
                    point.position.x = x.match( xb );
                    point.position.y = y.match( yb );
                    point.position.z = z.match( zb );

                    bins.add( point );
                    bin[xb][yb][zb] = point;
                }
            }
        }

        return bins;
    }

    // public functions

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