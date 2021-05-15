let SearchControl = function() {
    let master={};
    let data = {};
    let searchType,searchInput,onSearch=()=>{};

    function renderSelection() {
        d3.select('#searchInputOptions')
            .selectAll('option')
            .data(data[searchType]??[])
            .join('option')
            .attr('value',d=>d)
            .text(d=>d);
        d3.select('#searchInput').on('change',function(){
            searchInput = this.value
        }).node().value = ''

    }

    master.init=function(){
        searchType = $(d3.select('#searchType').on('change',function(){
            searchType = $(this).val();
            renderSelection();
        }).node()).val();
        d3.select('#searchBtn').on('click',function(){
            if (searchInput && searchInput!=='')
                onSearch(searchInput,searchType)
            else{
                drawJobList();
                updateProcess({percentage:50,text:'render streams'});
                setTimeout(()=>{
                    subObject._filter = subObject.filterTerms();
                    subObject.draw();
                },0)
            }
        });
        renderSelection();

    };
    master.data=function(_){
        data = _;
        renderSelection()
        return master
    }
    master.onSearch = function(_){
        onSearch = _;
        return master;
    }
    return master;
}
