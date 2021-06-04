$('.sidebar').hover(hoverSidebarIn,hoverSidebarOut);
function initSideBar(){
    $('#sidenav .collapse').on('show.bs.collapse',function(){
        extractToolbar($(this).attr('data-action'),true);
    }).on('hidden.bs.collapse',function(){
        if(!d3.select('#'+$($(this).attr('data-action')).attr('data-minimize')).classed('hide')){
            extractToolbar($(this).attr('data-action'),false);
        }
    })
}
function hoverSidebarIn() {
    $(this).toggleClass( "active", true);
    $('#controls').show();
    document.documentElement.style.setProperty('--sideNavwidth', 330 + "px");
}
function hoverSidebarOut(){
    $(this).toggleClass( "active", false);
    $(this).find('.collapse').hide();
    document.documentElement.style.setProperty('--sideNavwidth', 52 + "px");
}
