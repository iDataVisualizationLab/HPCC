function CameraPositions( group )
{
    for( var x=0; x<1; x++ )
        addPosition(x);

    addPosition(4)

    function addPosition( x )
    {
        var geometry = new THREE.SphereGeometry( 5, 32, 32 );
        var material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
        var sphere = new THREE.Mesh( geometry, material );
        sphere.position.set( x - LEN, 700, LEN/2 );
        sphere.scale.set( 30, 30, 30 )
        group.add( sphere );
    }
}