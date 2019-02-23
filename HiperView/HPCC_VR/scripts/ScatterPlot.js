function ScatterPlotMatrix( axes_matrix, ranges_matrix, intervals, dataid, data_matrix, scale, isBinned, datakeys )
{
    this.matrix = {};
    this.graph = new THREE.Group();
    this.graph.visible = false;
    this.isBinned = isBinned;

    for( var p=0; p<axes_matrix.length; p++ )
    {
        this.length = p+1;
        this.matrix[p] = new ScatterPlot( axes_matrix[p],
                                        ranges_matrix[p],
                                        intervals,
                                        dataid,
                                        data_matrix[p],
                                        scale,
                                        isBinned,
                                        datakeys[p] );
        this.graph.add( this.matrix[p].graph );

        var x = SERVICE[axes_matrix[p][0]].sp_pos;
        var y = SERVICE[axes_matrix[p][1]].sp_pos * -1 + Object.keys(SERVICE).length;
        var z = SERVICE[axes_matrix[p][2]].sp_pos;

        var xpos = x * scale * 1.5;
        var ypos = y * scale * 1.5;

        this.matrix[p].graph.position.set( xpos, ypos, 0 );
        this.matrix[p].graph.position.x = this.matrix[p].graph.position.x + summation(z-1) * scale * 1.8;
        this.matrix[p].graph.position.y = this.matrix[p].graph.position.y - ( 6-z ) * scale * 1.5;


        // adding axis labels
        var label_geometry = new THREE.BoxGeometry( scale, scale, scale );
        var label_material = new THREE.MeshBasicMaterial( {  color: 0xff0000 } );
        var label = new THREE.Mesh( back_geometry, back_material );
        background.position.set(scale/2,scale/2,scale/2);
        box.add( background );
    }

    function summation( n )
    {
        return ( n * ( n + 1 ) ) / 2;
    }

}

function ScatterPlot( axes, ranges, intervals, dataid, data, scale, isBinned, datakey )
{
    // building scatter plot
    var population = data.length;

    var x = setInfo( 0 );
    var y = setInfo( 1 );
    var z = setInfo( 2 );

    var graph = new THREE.Group();
    var grid = setGrid();

    if( !isBinned )
        var points = setPoints();
    else
        var bins = setBins();

    graph.add( grid );
    // graph.add( x.obj );
    // graph.add( y.obj );
    // graph.add( z.obj );

    if( !isBinned )
        graph.add( points );
    else
        graph.add( bins );

    this.graph = graph;
    this.grid = grid;
    this.axes = axes;
    this.x = x;
    this.y = y;
    this.z = z;
    this.datakey = datakey;
    this.data = data;
    this.scag = null;

    if( !isBinned )
        this.points = points;
    else
        this.bins = bins;

    // functions

    function setInfo( axis )
    {
        var info = {};
        info.min = ranges[axis][0];
        info.max = ranges[axis][1];
        info.range = info.max - info.min;
        info.name = axis == 0 ? "x" : axis == 1 ? "y" : "z";
        info.legend = axes[axis];
        // info.obj = setAxis( axis, info );
        info.binSize = intervals - 1;

        info.bin = function( n )
        {
            var interval = this.range/this.binSize;
            for( var b=0; b<this.binSize; b++ )
            {
                if( n>b*interval + this.min & n<(b+1)*interval+this.min)
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

    function setPoints()
    {
        var points = new THREE.Group();
        points.name = "scatterplot-points";
        var pos = [0, 0, 0];
        points.obj = {};

        for( var p=0; p<population; p++ )
        {
            pos[0] = x.fit( data[p][0] );
            pos[1] = y.fit( data[p][1] );
            pos[2] = z.fit( data[p][2] );

            var material = new THREE.MeshPhongMaterial( { color: 0x000000 } );
            var geometry = new THREE.SphereGeometry( 0.0025, 8, 8 );
            var point = new THREE.Mesh( geometry, material );

            point.position.set( 0, 0, 0 );
            point.name = dataid[p];
            points.add( point );
            points.obj[dataid[p]] = point;
        }

        return points;
    }

    function setBins()
    {
        var bins = new THREE.Group();
        var bin, binCount;
        var binSize = intervals - 1;
        var getBinOf = {};
        var oneElementSize = 1 / ( population/4 );
        var default_size = scale/intervals/1.5;

        // inititializing variables
        bin = {}, binCount = {};
        for( var bx=0; bx<binSize; bx++ )
        {
            bin[bx] = {}, binCount[bx] = {};
            for( var by=0; by<binSize; by++ )
            {
                bin[bx][by] = {}, binCount[bx][by] = {};
                for( var bz=0; bz<binSize; bz++ )
                {
                    bin[bx][by][bz] = null, binCount[bx][by][bz] = 0;
                }
            }
        }

        // setting binCount
        var xb, yb, zb;
        for( var p=0; p<population; p++ )
        {
            xb = x.bin( data[p][0] );
            yb = y.bin( data[p][1] );
            zb = z.bin( data[p][2] );
            
            binCount[xb][yb][zb] = binCount[xb][yb][zb]+1;
            getBinOf[dataid[p]] = [xb,yb,zb];
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

                    var s = (binCount[xb][yb][zb]+1) * oneElementSize;

                    // if( xb != 2 | yb != 2 | zb != 2 ) continue;

                    var material = new THREE.MeshPhongMaterial( { color: 0x000000, transparent: true, opacity: 0.75 } );
                    var geometry = new THREE.SphereGeometry( default_size, 8, 8 );
                    var point = new THREE.Mesh( geometry, material );
                    point.count = binCount[xb][yb][zb];
                    point.position.set( x.match( xb ), y.match( yb ), z.match( zb ) );
                    point.scale.set( s, s, s );

                    point.visible = binCount[xb][yb][zb] != 0;

                    bins.add( point );
                    bin[xb][yb][zb] = point;
                }
            }
        }

        bins.bin = bin;
        bins.binCount = binCount;
        bins.getBinOf = getBinOf;
        bins.oneElementSize = oneElementSize;

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

    this.updateBin = function( bin, new_size )
    {
        var intervals = 10;
        var sinterval = (new_size - bin.scale.x)/intervals;
        var count = 0;
    
        var resizeBin = setInterval( function()
        {
            bin.scale.x += sinterval;
            bin.scale.y += sinterval;
            bin.scale.z += sinterval;
            count++;
    
            if( count == intervals )
                clearInterval( resizeBin );
    
        }, 1 );
    }

    this.getTotalBinCount = function()
    {
        var total = 0;
        var bin = this.bins.bin;
        var binCount = this.bins.binCount;

        for( xb in bin )
            if( bin.hasOwnProperty(xb) )
                for( yb in bin[xb] )
                    if( bin[xb].hasOwnProperty(yb) )
                        for( zb in bin[xb][yb] )
                            if( bin[xb][yb].hasOwnProperty(zb) )
                                total+=binCount[xb][yb][zb];

        return total;
    }

    this.updateData = function( key, x, y, z )
    {
        var p = this;
        p.data[key][0] = x;
        p.data[key][1] = y;
        p.data[key][2] = z;

        // run scagnostics when all data is declared
        if( this.data.length-1 == key )
        {
            // var workerScag = new Worker("scripts/worker/scag_worker.js");
            // workerScag.postMessage( p.data );
            // workerScag.onmessage = function( event )
            // {
            //     p.scag = event.data;
            //     console.log( p.axes[0] + " " + p.axes[1] + " " + p.axes[2] + " " + p.scag.outlyingScore );
            // };

            // compute scag via promise
            promiseScag( p.data ).then( message =>
                {
                    console.log(message.outlyingScore);
                    p.scag = message;
                } );
        }

        function promiseScag( data )
        {
            return new Promise( resolve => 
                {
                    var options = {
                            startBinGridSize: 10,
                            minBins: 5,
                            maxBins: 20
                        }
                    var scag = scagnosticsnd( data, options );

                    resolve(scag)
                } );
        }
    }

}