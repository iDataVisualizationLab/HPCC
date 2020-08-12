function initMenu(){
    $('#legendHolder').draggable({ handle: ".card-header" ,containment: "parent", scroll: false });
    $('[data-toggle="tooltip"]').tooltip();
    initSideBar()
}
function minimizeToolbar(){
    extractToolbar("#controlOnToolbar",true);
    extractToolbar("#analyticOnToolbar",true);
    d3.select("#legendHolder").classed("hide",true);
}
function extractToolbar(id,status){
    const node = $(id);
    if (status){
        node.appendTo('#'+node.attr('data-minimize'));
        d3.select('#'+node.attr('data-maximize')).classed('hide',true)
    }else{
        node.appendTo('#'+node.attr('data-maximize'));
        d3.select('#'+node.attr('data-maximize')).classed('hide',false)
    }
}
