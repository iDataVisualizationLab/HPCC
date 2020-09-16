// plugin
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};
//general function
let vizservice=[];
function serviceControl(){
    vizservice =serviceFullList.slice();
    vizservice.push({text:'User',range:[]});
    vizservice.push({text:'Radar',range:[]});
    d3.select('#serviceSelection')
        .on('change',function(){
            serviceSelected = +$(this).val();
            createdata()
            currentDraw();
        })
        .selectAll('option')
        .data(vizservice)
        .enter()
        .append('option')
        .attr('value',(d,i)=>i)
        .attr('class',d=>d.text==='User'?'innerName':null)
        .attr('data-value',(d,i)=>d)
        .attr('selected',(d,i)=>i===serviceSelected?'':null)
        .text(d=>d.text)
}
function initdraw(){
    $('.informationHolder').draggable({ handle: ".card-header" ,containment: "parent", scroll: false });
    d3.select('#userSort').on('change',function(){
        currentDraw(serviceSelected);
    });
    d3.select('#innerDisplay').on('change',function(){
        d3.selectAll('.innerName').text(getInnerNodeAttr())
        currentDraw(serviceSelected);
    });
    d3.select('#sort_apply').on('click',function(){
        sortData();
        currentDraw(serviceSelected)
    });
    serviceControl();
    drawObject.init();
}
// setting
let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `<span>${d}</span>`})
let drawObject = new SpitalLayout();
