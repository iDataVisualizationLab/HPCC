// Ngan 9 May 2019

// <editor-fold  map for saving process-------------------------------->
//
// single request
//
// saveSVG_light() -> + prefill saveSVG() as saveSVG_detail
//                 -> |click save| -> onSaveImage() -> saveSVG() as saveSVG_detail
//
// multi request
//
// saveSVG_batch() -> + prefill onSaveDummy_radar() as saveSVG_detail
//                 -> |click save| -> onSaveImage() -> onSaveDummy_radar() as saveSVG_detail
//                 -> getData() -> onCreateDummy_radar() -> saveSVG () as saveSVG_detail



//---- variable-----
let saveSVG_detail;

// <editor-fold single request>
function saveSVG_light(event,type){
    saveSVG_detail = _.partial(saveSVG,event,_,type);
    $('#savename').val(event.parentNode.querySelector('.hostnameInTip').textContent.split(': ')[1]);// pre fill
}
//</editor-fold >

// <editor-fold multi request>
function saveSVG_batch(type){
    saveSVG_detail = _.partial(onSaveDummy_radar,_,'png');
    const time = new Date(query_time);
    let stringDate = time.toLocaleDateString()+'_'+time.toLocaleTimeString();
    stringDate  =stringDate.replace(/\//gi,'-');
    $('#savename').val(stringDate);// pre fill
}

function onSaveDummy_radar(prefix,type) {
    getData(null,lastIndex+1);
    imageRequest = true; //turn on watcher for image request
    saveSVG_detail = _.partial(saveSVG,_,_,type,prefix);
}

function onCreateDummy_radar(data) {
    var zip = new JSZip();
    zip = zip.folder("images");
    let q = [];
    let dummy_radarChartOptions = _.clone(radarChartOptions);
    dummy_radarChartOptions.showText = false;
    dummy_radarChartOptions.isNormalize = true;
    dummy_radarChartOptions.showHelperPoint = false;
    pausechange();
    data.forEach( function (d,i){
        let dummy_div = document.createElement('html');
        dummy_div = d3.select(dummy_div).append('body').append('div').node();
        RadarChart(dummy_div, [d], dummy_radarChartOptions,"");
        q.push(saveSVG_detail(dummy_div,d.name,zip));
        console.log((i+1)+'/'+data.length);
    });
    Promise.all(q).then(function() {
        zip.generateAsync({type:"blob"}, function updateCallback(metadata) {
            console.log("progression: " + metadata.percent.toFixed(2) + " %");
            if(metadata.currentFile) {
                console.log("current file = " + metadata.currentFile);
            }
        })
            .then(function(content) {
                // see FileSaver.js
                saveAs(content, "image.zip");
            }).catch((err) => {
                console.log(err);
            // Handle any error that occurred in any of the previous
            // promises in the chain.
        });;
    });
}
//</editor-fold >

// UI function
function onSaveImage (){
    // request puase to spped up process then resume after that
    saveSVG_detail($('#savename').val());
}

// ulti function
let saveSVG = function(event,name,type,prefix,zip){
    let target = event.parentNode||event;
    if (name==="")
        name = target.querySelector('.hostnameInTip').textContent.split(': ')[1];
    switch(type) {
        default:
            const stringbold = serialize(target.querySelector('.radarPlot'), true);
            if (zip)
                return new Promise((y, n) => (y(saveInZip(stringbold, zip))));
            else
                save(stringbold);
            break;
        case 'png':
            if (zip)
                return rasterize(target.querySelector('.radarPlot'), true).then(svgString => {
                    return saveInZip(svgString, zip);
                });
            else
                rasterize(target.querySelector('.radarPlot'), true).then(svgString=>
                    save(svgString)); // passes Blob and filesize String to the callback
            break;
    }
    function save( dataBlob){
        saveAs( dataBlob, (prefix||"")+name+'.'+type ); // FileSaver.js function
    }
    function saveInZip( dataBlob){
        zip.file(name+'.'+type, dataBlob,{base64: true}); // FileSaver.js function
        console.log(name)
    }
};