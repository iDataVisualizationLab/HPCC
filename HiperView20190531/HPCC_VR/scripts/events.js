// EVENTS
var mouseDown = 0;
document.body.onmousedown = function() { ++mouseDown; };
document.body.onmouseup = function() { --mouseDown; };
var sp_focus = null;

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

    if( sp_focus != null )
    {
        sp_focus.scatter_plot.graph.remove( sp_focus.scatter_plot.graph.getObjectByName("axis-label-x") );
        sp_focus.scatter_plot.graph.remove( sp_focus.scatter_plot.graph.getObjectByName("axis-label-y") );
        sp_focus.scatter_plot.graph.remove( sp_focus.scatter_plot.graph.getObjectByName("axis-label-z") );
        moveScatterPlot( sp_focus, sp_focus.xr, sp_focus.yr, sp_focus.zr );
        sp_focus = null;
    }

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
    else if( isScatterPlotClicked() )
        console.log(INTERSECTED.name);
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
        if ( intersects.length > 0 )  // score control panel was clicked
        {
            INTERSECTED = intersects[ 0 ].object;

            if( INTERSECTED.type == "arrow_up" )
                score_control_panel.cylinder.rotation.y-=score_control_panel.rotation_interval;
            else if( INTERSECTED.type == "arrow_down" )
                score_control_panel.cylinder.rotation.y+=score_control_panel.rotation_interval;
            return true;
        }
        else
        {
            intersects = raycaster.intersectObjects( score_control_panel.cylinder.children );
            if ( intersects.length > 0 )  // cylinder was clicked
            {
                INTERSECTED = intersects[ 0 ].object;
                if( INTERSECTED.type == "arrow_left" & SCORE[INTERSECTED.name]>0 )
                {
                    var slider = score_control_panel.getObjectByName("slider-" + INTERSECTED.name);
                    slider.position.y+=slider.initial/5;
                    SCORE[INTERSECTED.name] = ( SCORE[INTERSECTED.name]*10 - 1 ) / 10;
                    filterScatterPlotMatrix();
                    return true;
                }
                else if( INTERSECTED.type == "arrow_right" & SCORE[INTERSECTED.name]<1 )
                {
                    var slider = score_control_panel.getObjectByName("slider-" + INTERSECTED.name);
                    slider.position.y-=slider.initial/5;
                    SCORE[INTERSECTED.name] = ( SCORE[INTERSECTED.name]*10 + 1 ) / 10;
                    filterScatterPlotMatrix();
                    return true;
                }
                else
                    return false;
            }
            else
                return false;
        }
    }

    // check if scatter plot was clicked
    function isScatterPlotClicked()
    {
        intersects = raycaster.intersectObjects( scatter_plot_matrix.graph.children );
        if ( intersects.length > 0 )  // scatter plot grid was selected
        {
            INTERSECTED = intersects[ 0 ].object;
            if( INTERSECTED.type == "scatter-plot-hitbox" & INTERSECTED.highlighted ) // a scatter plot was selected
            {
                // var pos = new THREE.Vector3().setFromMatrixPosition( camera.matrixWorld );
                sp_focus = INTERSECTED;

                sp_focus.scatter_plot.drawAxis( 0, sp_focus.scatter_plot.x );
                sp_focus.scatter_plot.drawAxis( 1, sp_focus.scatter_plot.y );
                sp_focus.scatter_plot.drawAxis( 2, sp_focus.scatter_plot.z );

                moveScatterPlot( INTERSECTED, 0, 1.05, 1 );
                return true;
            }
            else if( INTERSECTED.type == "axis-filter" ) // an axis was selected
            {
                var axis_id = geAllIdsByName( scatter_plot_matrix.graph, INTERSECTED.name );
                for( var l=0; l<axis_id.length; l++ )
                    scatter_plot_matrix.graph.getObjectById(axis_id[l]).material.opacity = 1;

                for( sp in scatter_plot_matrix.matrix )
                    if( !scatter_plot_matrix.matrix[sp].hitbox.name.includes(INTERSECTED.name) )
                        highlightScatterPlot( scatter_plot_matrix.matrix[sp].hitbox, false );

                return true;
            }
        }
        else
        {
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