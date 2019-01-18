function ScatterPlot( data, bin_size, scale )
{
    // building scatter plot
    this.population = data.length;

    this.xrange = getRange( 0 );
    this.yrange = getRange( 1 );
    this.xrange = getRange( 2 );

    this.graph = new THREE.Group();
    this.grid = setGrid();
    this.points = setPoints();

    this.graph.add( this.grid );
    this.graph.add( this.points );


    // functions

    function fit( val, range )
    {
        return scale * val * 5 / range;
    }

    function getRange( axis )
    {
        var max = data[0][axis];
        var min = data[0][axis];

        for( var i=0; i<this.population; i++ )
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
        var material = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 5 } );

        // x axis
        var x_geometry = new THREE.Geometry();
        x_geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( this.xrange, 0, 0 ) );
        var x_axis = new THREE.Line( x_geometry, material );
        grid.add( x_axis );

        // y axis
        var y_geometry = new THREE.Geometry();
        y_geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, this.yrange, 0 ) );
        var y_axis = new THREE.Line( y_geometry, material );
        grid.add( y_axis );

        // z axis
        var z_geometry = new THREE.Geometry();
        z_geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, this.zrange, ) );
        var z_axis = new THREE.Line( z_geometry, material );
        grid.add( z_axis );

        return grid;
    }

    function setPoints()
    {
        var points = new THREE.Group();

        for( var p=0; p<this.population; p++ )
        {
            var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
            if( p == 4 ) var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
            var geometry = new THREE.SphereGeometry( 0.002, 16, 16 );
            var point = new THREE.Mesh( geometry, material );
            point.position.set( fit( data[p][0] ), fit( data[p][1] ), fit( data[p][2] )  );
            points.add( point );
        }

        return points
    }

}