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
        })
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
                console.log('not using search box');
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
