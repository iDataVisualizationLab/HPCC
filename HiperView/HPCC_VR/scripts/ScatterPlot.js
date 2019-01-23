function ScatterPlot( data, bin_size, scale )
{
    // building scatter plot
    var population = data.length;

    var xrange = setRange( 0 );
    var yrange = setRange( 1 );
    var zrange = setRange( 2 );
    var range = xrange

    var graph = new THREE.Group();
    var grid = setGrid();
    var points = setPoints();

    graph.add( grid );
    graph.add( points );

    this.graph = graph;
    this.grid = grid;
    this.points = points;


    // functions

    function fit( val, range )
    {
        return scale * val * 5 / range;
    }

    function setRange( axis )
    {
        var max = data[0][axis];
        var min = data[0][axis];

        for( var i=0; i<population; i++ )
        {
            var p = data[i][axis];
            max = max > p ? max : p;
            min = min < p ? min : p;
        }

        // min = min > 0 ? 0 : min;

        return max - min;
    }

    function setGrid()
    {
        var grid = new THREE.Group();
        var x = fit(xrange,xrange);
        var y = fit(yrange,yrange);
        var z = fit(zrange,zrange);

        // box
        var box_material = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1 } );
        var box_geometry = new THREE.Geometry();
        box_geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ), 
                                    new THREE.Vector3( x, 0, 0 ),
                                    new THREE.Vector3( x, y, 0 ),
                                    new THREE.Vector3( 0, y, 0 ),
                                    new THREE.Vector3( 0, 0, 0 ),
                                    new THREE.Vector3( 0, 0, z ),
                                    new THREE.Vector3( x, 0, z ),
                                    new THREE.Vector3( x, y, z ),
                                    new THREE.Vector3( 0, y, z ),
                                    new THREE.Vector3( 0, 0, z ),
                                    new THREE.Vector3( 0, y, z ),
                                    new THREE.Vector3( 0, y, 0 ),
                                    new THREE.Vector3( x, y, 0 ),
                                    new THREE.Vector3( x, y, z ),
                                    new THREE.Vector3( x, 0, z ),
                                    new THREE.Vector3( x, 0, 0 ) );
        var box = new THREE.Line( box_geometry, box_material );
        grid.add( box );

        // marks
        var no_marks = 3;
        var xmark = [];
        var ymark = [];
        var zmark = [];

        var mark_material = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 1 } );
        
        // z marks
        for( var i=0; i<no_marks; i++ )
        {
            var mark_geometry = new THREE.Geometry();
            var start = new THREE.Vector3( 0, 0, i * range/3 );
            var end = new THREE.Vector3( 0, -1*fit(range/10,range), i * range/3 );

            mark_geometry.vertices.push( start, end );

            zmark.push( new THREE.Line( mark_geometry.clone(), mark_material.clone() ) );
        }

        for( var i=0; i<no_marks; i++ )
        {
            // grid.add(xmark[i]);
            // grid.add(ymark[i]);
            grid.add(zmark[i]);
        }

        // grid.add( zmark[0] );

        return grid;
    }

    function setPoints()
    {
        var points = new THREE.Group();

        for( var p=0; p<population; p++ )
        {
            var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
            var geometry = new THREE.SphereGeometry( 0.002, 8, 8 );
            var point = new THREE.Mesh( geometry, material );

            point.position.set( fit( data[p][0], xrange ), fit( data[p][1], yrange ), fit( data[p][2], zrange )  );
            points.add( point );
        }

        return points;
    }

}