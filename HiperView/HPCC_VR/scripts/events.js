// EVENTS
var mouseDown = 0;
document.body.onmousedown = function() { ++mouseDown; };
document.body.onmouseup = function() { --mouseDown; };

// on resizing window
function onResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

// on mouse moving
function onMouseMove( event )
{
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

// on mouse clicked / screen touched
function onMouseDown( event )
{
    var mouseDownHold;
    clearInterval( mouseDownHold );

    event.preventDefault();

    // for some reason 2 event happen at the same time
    if( event.isTrusted ) return;

    raycaster.setFromCamera( new THREE.Vector2( 0, 0 ), camera );
    var intersects;

    // check if something was clicked
    if( isHostClicked() )
        console.log(INTERSECTED.name)
    else if( isServiceControlPanelClicked() )
        console.log(INTERSECTED.name);
    else if( isTimeControlPanelClicked() )
        console.log(INTERSECTED.name);
    else if( isScoreControlPanelClicked() )
        console.log(INTERSECTED.name);
    // else if( isScatterPlotClicked() )
    //     console.log(INTERSECTED.name);
    else if( isLeverClicked() )
        console.log(INTERSECTED.name);
    else if( isSomethingElseClicked() )
        console.log(INTERSECTED.name);
    else
        console.log("nothing clicked");


    // check if a quanah host was clicked
    function isHostClicked()
    {
        for( var r=0; r<RACK_NUM; r++ )
        {
            for( var h=0; h<quanah.children[r].children.length; h++ )
            {
                intersects = raycaster.intersectObjects( quanah.children[r].children[h].children );
                if( intersects.length > 0 )
                {
                    INTERSECTED = intersects[ 0 ].object.parent;
                    updateTooltip( INTERSECTED );
                    return true;
                }
            }
        }

        //tooltip.visible = false;
        return false
    }
    
    // check if service control panel was clicked
    function isServiceControlPanelClicked()
    {
        intersects = raycaster.intersectObjects( service_control_panel.children );
        if ( intersects.length > 0 )
        {
            isInit = false;
            INTERSECTED = intersects[ 0 ].object;
            updateSelectedService(INTERSECTED);
            reset();
            return true;
        }
        else
        {
            return false;
        }
    }

    // check if time control panel was clicked
    function isTimeControlPanelClicked()
    {
        intersects = raycaster.intersectObjects( time_control_panel.children );
        if ( intersects.length > 0 )  // time control panel was clicked
        {
            INTERSECTED = intersects[ 0 ].object;

            if( INTERSECTED.type == "timestamp" ) // change timestamp
            {
                isInit = false;
                selectedTimestamp = parseInt(INTERSECTED.name);
                reset();
                return true;
            }
            if( INTERSECTED.type == "REALTIME" ) // change time to REALTIME
            {
                isInit = false;
                // reset();
                return true;
            }
        }
        else
        {
            return false;
        }
    }

    // check if score control panel was clicked
    function isScoreControlPanelClicked()
    {
        intersects = raycaster.intersectObjects( score_control_panel.children );
        if ( intersects.length > 0 )  // time control panel was clicked
        {
            INTERSECTED = intersects[ 0 ].object;

            if( INTERSECTED.type == "slider" ) // change timestamp
            {
                var mouseX = mouse.x;
                mouseDownHold = setInterval( function()
                {
                    if( mouseDown )
                    {
                        // if( mouseX != mouse.X )
                        INTERSECTED.position.y = mouse.x;
                        // INTERSECTED.position.y = INTERSECTED.position.y + (mouse.x - -1*mouseX )/100;
                        // if( INTERSECTED.position.y>INTERSECTED.initial || INTERSECTED.position.y<INTERSECTED.initial*-1 )
                        //     clearInterval( timeout );
                    }
                    else
                    {
                        clearInterval( mouseDownHold );
                    }

                }, 10 );

                return true;
            }
            else if( INTERSECTED.type == "arrow" )
            {
                if( INTERSECTED.name == "up" )
                    score_control_panel.rotation.x-=score_control_panel.rotation_interval;
                if( INTERSECTED.name == "down" )
                    score_control_panel.rotation.x+=score_control_panel.rotation_interval;
                return true;
            }
        }
        else
        {
            return false;
        }
    }

    // check if scatter plot was clicked
    function isScatterPlotClicked()
    {
        intersects = raycaster.intersectObjects( scatter_plot.grid.children );
        if ( intersects.length > 0 )  // scatter plot grid was selected
        {
            INTERSECTED = intersects[ 0 ].object;

            if( INTERSECTED.type == "axis" ) // an axis was selected
            {
                INTERSECTED.menu.visible = true;
                return true;
            }
            if( INTERSECTED.type == "REALTIME" ) // change time to REALTIME
            {
                // reset();
                return true;
            }
        }
        else
        {
            // intersects = raycaster.intersectObjects( scatter_plot.x.obj.menu.children );
            // if ( intersects.length > 0 )  // x axis option was selected
            // {
            //     INTERSECTED = intersects[ 0 ].object;

            //     if( INTERSECTED.option == 0 ) // option 0 was selected
            //     {
            //         INTERSECTED.menu.visible = false;
            //         // updateScatterPlot( oldhostclicked, services )
            //         return true;
            //     }
            // }
            // else
            // {
            //     return false;
            // }

            return false;
        }
    }

    // check if lever was clicked
    function isLeverClicked()
    {
        intersects = raycaster.intersectObjects( lever.pivot.children );
        if ( intersects.length > 0 )
        {
            INTERSECTED = intersects[ 0 ].object.parent;
            if( lever.pivot.rotation.x < 0) // lever is on scatter plot
            {
                scatter_plot_matrix.graph.visible = false;
                parallel_set.graph.visible = true;
                updateLever( Math.PI/-4, Math.PI/4 );
            }
            else // lever is on parallel coordinates
            {
                scatter_plot_matrix.graph.visible = true;
                parallel_set.graph.visible = false;
                updateLever( Math.PI/4, Math.PI/-4 );
            }
            return true;
        }
        else
        {
            return false;
        }
    }

    // check if something else was clicked
    function isSomethingElseClicked()
    {
        intersects = raycaster.intersectObjects( scene.children );
        if ( intersects.length > 0 )
        {
            INTERSECTED = intersects[ 0 ].object;
            return true;
        }
        else // nothing was clicked
        {
            return false;
        }
    }
}

// on screen touched started
function onDocTouch( event )
{
    event.preventDefault();
    move_timer = setInterval( function()
                            {
                                var direction = new THREE.Vector3().copy(camera.getWorldDirection());
                                cameraHolder.position.add(direction.multiplyScalar(0.01));
                                cameraHolder.position.y = -1.5;

                            } , 5);
}

// on screen touched released
function onDocRelease( event )
{
    if( move_timer ) clearInterval(move_timer);
}