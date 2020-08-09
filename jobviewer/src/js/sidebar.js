$('.sidebar').hover(hoverSidebarIn,hoverSidebarOut);
function hoverSidebarIn() {
    $(this).toggleClass( "active", true);
    document.documentElement.style.setProperty('--sideNavwidth', 250 + "px");
}
function hoverSidebarOut(){
    $(this).toggleClass( "active", false);
    $(this).find('.collapse').collapse('hide');
    document.documentElement.style.setProperty('--sideNavwidth', 52 + "px");
}
