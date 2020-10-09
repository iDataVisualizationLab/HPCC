function initMenu(){
    $('.windown').draggable({ handle: ".card-header" ,containment: "parent", scroll: false });
    $('[data-toggle="tooltip"]').tooltip();
    initSideBar()
}
function minimizeToolbar(){
    extractToolbar("#controlOnToolbar",true);
    extractToolbar("#analyticOnToolbar",true);
    d3.select("#legendHolder").classed("hide",true);
    d3.select('#windownToggleIcon').classed('disable',true)
}
function maxmizeToolbar(){
    extractToolbar("#controlOnToolbar",false);
    extractToolbar("#analyticOnToolbar",false);
    d3.select("#legendHolder").classed("hide",false);
    d3.select('#windownToggleIcon').classed('disable',false)
}
function enableControlpanel(){
    d3.select("#legendHolder").classed("hide",false);
}
function toggleControlpanel(){
    const old_state = d3.select("#legendHolder").classed("hide");
    if (old_state){
        maxmizeToolbar();
    }else
        minimizeToolbar()
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

function updateProcess(message,div){
    div = div?? ".cover";
    const holder=d3.select(div);
    holder.classed('hide', !message);
    if (message){
        holder.select('.progress-bar')
            .style("width", `${message.percentage}%`)
            .attr('aria-valuenow',message.percentage);
        holder.select('.processText').text(message.text??'');
    }
}
