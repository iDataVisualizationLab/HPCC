
srcpath = '../HiperView/';


let jobMap_opt = {
    margin:{top:20,bottom:20,left:20,right:20},
    width: 1000,
    height:500,
    node:{
        r: 5,
    },
    job: {
        r: 10,
        r_inside: 2,
    },user:{
        r: 10,
    },
}

function zoomtoogle(event) {
    let oldvval = d3.select(event).classed('lock');
    jobMap.zoomtoogle(!oldvval);
    d3.select(event).classed('lock',!oldvval);
}