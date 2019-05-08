// web worker for scagnostics
importScripts('../lib/scagnostics3d_mod.min.js'); 

self.onmessage = function( event )
{
    // var worker = self;

    // var promiseScag = new Promise( resolve => 
    // {
    //     var scagf = scagnostics3d( event.data );
    //     var scag = {};
    //     var info = Object.keys(scagf);

    //     for( m in info )
    //         if( info[m] != "delaunay" )                 // scagf.delaunay contains a function
    //             scag[info[m]] = scagf[info[m]];
        
    //     resolve( scag );

    // } );

    // promiseScag.then( message =>
    //     {

    //         self.postMessage( message );
    //         self.close();

    //     } );

        var options = {
            startBinGridSize: 10,
            minBins: 5,
            maxBins: 20
        }

        var scagf = scagnostics3d( event.data, options );
        var scag = {};
        var info = Object.keys(scagf);

        for( m in info )
            if( info[m] != "delaunay" )                 // scagf.delaunay contains a function
                scag[info[m]] = scagf[info[m]];

        self.postMessage( scag );
            self.close();
};