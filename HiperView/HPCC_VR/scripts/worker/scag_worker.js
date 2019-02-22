// web worker for scagnostics
importScripts('../lib/scagnostics3d.min.js'); 

self.onmessage = function( event )
{
    var scagf = scagnostics3d( event.data );

    var scag = {};
    var info = Object.keys(scagf);

    for( m in info )
        if( info[m] != "delaunay" )                 // scagf.delaunay contains a function
            scag[info[m]] = scagf[info[m]];

    self.postMessage( scag );
    self.close();
};