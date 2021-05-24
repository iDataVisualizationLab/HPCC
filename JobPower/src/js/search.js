let SearchControl = function() {
    let master={};
    let data = {};
    let searchType,searchInput,onSearch=()=>{};

    function renderSelection() {
        // d3.select('#searchInputOptions')
        //     .selectAll('option')
        //     .data(data[searchType]??[])
        //     .join('option')
        //     .attr('value',d=>d)
        //     .text(d=>d);
        $( "#searchInput" ).autocomplete({
            source: data[searchType]??[],
            minLength: 2
        });
        d3.select('#searchInput').on('change',function(){
            searchInput = this.value.trim();
        }).node().value = ''

    }

    master.init=function(){
        searchType = $(d3.select('#searchType').on('change',function(){
            searchType = $(this).val();
            renderSelection();
        }).node()).val();
        d3.select('#searchBtn').on('click',function(){
            if (searchInput && searchInput!==''){
                filterMode = 'searchBox';
                onSearch(searchInput,searchType);
            }else{
                resetFilter('jobList');
                // drawJobList();
                // updateProcess({percentage:50,text:'render streams'});
                // setTimeout(()=>{
                //     subObject._filter = subObject.filterTerms();
                //     subObject.draw();
                // },0)
            }
        });
        renderSelection();

    };
    master.reset = function(){
        d3.select('#searchInput').node().value = '';
    }
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
