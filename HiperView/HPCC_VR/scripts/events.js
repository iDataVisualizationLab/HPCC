// EVENTS

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
                    updateTooltip(INTERSECTED);
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