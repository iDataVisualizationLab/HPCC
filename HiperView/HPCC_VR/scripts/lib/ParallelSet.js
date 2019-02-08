function ParallelSet( size, font, data, startField, ignoreFields, binFields )
{
    var manager, group;
    var FILTERED = 0;
    var HIVE = false, ARCH = true, STEAM = false;
    var grid;
    var chartTmp;
    var LEN = size;
    var TIMER;
    var CSV_FILE = "data/titanic.csv";
    var FONT = font;
    var table = new ProcessedTable( startField, ignoreFields, binFields, data );
    var CHART_RATIO = LEN / table.length;
    
    // parallelset info
    this.data = new ProcessedData( table, null );
    this.graph = new THREE.Group();

    setSurface( this.graph );

    // Grid
    if( HIVE )
        grid = new GridHive(this.data.getNumberOfAllOptions(), LEN, this.data.getAllFields(), this.data.getAllOptions(), this.graph );
    else
        grid = new Grid(this.data.getNumberOfAllOptions(), LEN, this.data.getAllFields(), this.data.getAllOptions(), this.graph, this.data.getOptionsOfField(0), this.data.getColors() );


    // Columns
    if( ARCH )
    {
        for( var op1=0; op1<this.data.getOptionsOfField(0).length; op1++)
        {
            for( var f=0; f<grid.getFieldCount(); f++)
            {
                for( var op2=0; op2<this.data.getOptionsOfField(f).length; op2++ )
                {
                    var coord = grid.markerLocation(f,op2);
                    var values = this.data.tallyColumn(f,op2);
                    var attributes = { "field1": f, "option1": op2, "field2": null, "option2": null }
                    col = new Column( coord, values, LEN, this.data.getColors(), attributes, this.graph);
                }
            }
        }
    }

    // Stacks
    for( var f=0; f<( ( HIVE ) ? grid.getFieldCount() : grid.getFieldCount()-1 ); f++ )
    {   
        var f2 = ( HIVE & f+1 == grid.getFieldCount() ) ? 0 : f+1;
        for( var op1=0; op1<this.data.getOptionsOfField(f).length; op1++ )
        {
            var startCoord = grid.markerLocation(f,op1);
            for( var op2=0; op2<this.data.getOptionsOfField(f2).length; op2++ )
            {
                var endCoord = grid.markerLocation(f2,op2);
                var values = this.data.tallyStack(f,op1,f2,op2);
                var attributes = { "field1": f, "option1": op1, "field2": f2, "option2": op2 };

                if( HIVE )
                    stack = new StackHive(startCoord,endCoord,values, LEN, this.data.getColors(), attributes, this.graph, f, grid.separation);
                else
                    stack = new Stack(startCoord,endCoord,values, LEN, this.data.getColors(), attributes, this.graph);
                
            }
        }
    }

    function loadFile()
    {
        var tmp = $.csv.toArrays($.ajax({
            url: CSV_FILE,
            async: false,
            success: function (csvd) { this.data = $.csv.toArrays(csvd); },
            dataType: "text",
        }).responseText);

        return tmp;
    }

    function resetChart( filtration )
    {
        // if( parallel_set != null )
        //     parallel_set.removeFromScene();
        // if( chartTmp != null )
        //     chartTmp.removeFromScene();

        chart = makeChart( table, filtration );
        // parallel_set.addToScene();
    }

    function setSurface( obj )
    {
        var surface_geometry = new THREE.BoxGeometry( LEN * table[0].length, LEN/20, LEN*1.5 );
        var texture = new THREE.TextureLoader().load( "media/textures/woodtable.jpg" );
        var surface = new THREE.Mesh( surface_geometry, new THREE.MeshPhongMaterial( { color: 0xfefefe, map: texture } ) );
        surface.position.set( (LEN/2) * (table[0].length-1), -LEN/25, LEN/2);
        surface.name = "table";
        obj.add( surface );
    }

    function ProcessedTable( startFieldName, ignoreFields, binFields, table )
    {
        this.type = "ProcessedTable";

        // lowering case of startfield
        // startFieldName = startFieldName.toLowerCase();

        // lowering case of feature names
        // for(var i=0; i<table[0].length; i++)
        //     table[0][i] = table[0][i].toLowerCase();

        // lowering case of ignoreFields
        // for(var i=0; i<ignoreFields.length; i++)
        //     ignoreFields[i] = ignoreFields[i].toLowerCase();

        // removing ignoreFields from table
        for( var i=0; i<ignoreFields.length; i++)
        {
            var index = table[0].indexOf(ignoreFields[i]);
            for( var j=0; j<table.length; j++)
                table[j].splice(index, 1);
        }

        var binIndex = [];
        // getting index of binFields
        for( var i=0; i<binFields.length; i++ )
        {
            binFields[i][0] = binFields[i].toLowerCase();
            binIndex.push(table[0].indexOf(binFields[i]));
        }

        // binning fields
        if( binFields.length > 0 )
        {
            // finding ranges of each field
            var ranges = [], mins = [];
            for( var i=0; i<binFields.length; i++ )
            {
                var min = parseInt(table[1][binIndex[i]]);
                var max = parseInt(table[1][binIndex[i]]);
                for(var j=1; j<table.length; j++)
                {
                    if( table[j][binIndex[i]] == undefined )
                        continue;

                    var num = parseInt(table[j][binIndex[i]]);
                    if( num < min )
                        min = num;
                    if( num > max )
                        max = num;
                }
                mins.push(min);
                ranges.push(max-min);
            }

            // binning data
            for( var r=1; r<table.length; r++ )
            {
                for( var f=0; f<binIndex.length; f++ )
                {
                    table[r][binIndex[f]] = getInterval( table[r][binIndex[f]], ranges[f], mins[f] );
                }
            }

            function getInterval( n, range, min )
            {
                if( n == undefined )
                    return "undefined";
                if( n < range/3 + min )
                    return "low";
                if( n > 2*range/3 + min )
                    return "high";
                return "medium";
            }
        }

        // moving startField to index 0
        if( startFieldName != table[0][0] )
        {
            var index = table[0].indexOf(startFieldName);
            var tmp;
            for( var r=0; r<table.length; r++ )
            {
                tmp = table[r][0];
                table[r][0] = table[r][index];
                table[r][index] = tmp;
            }
        }

        return table;
    }

    function ProcessedData( table, filterVar )
    {
        this.type = "ProcessedData";
        var fieldNames = [];
        
        var ptable = table.map(function(arr) {
            return arr.slice();
        });

        // naming fields
        for( var i=0; i<ptable[0].length; i++)
            fieldNames.push(ptable[0][i]);

        // intitializing arrays
        var fieldOptions = new Array(ptable[0].length);
        var fieldOptionCount = new Array(ptable[0].length);

        // counting options per field
        for( var i=1; i<ptable.length; i++)
        {
            for( var j=0; j<ptable[0].length; j++)
            {
                if( !fieldOptions[j] )
                {
                    fieldOptions[j] = [ ptable[i][j] ];
                    fieldOptionCount[j] = [ 0 ];
                }
                else
                {
                    if( fieldOptions[j].includes( ptable[i][j] ) )
                    {
                        fieldOptionCount[j][fieldOptions[j].indexOf(ptable[i][j])]++;
                    }
                    else
                    {
                        fieldOptions[j].push( ptable[i][j] );
                        fieldOptionCount[j].push(0);
                    }
                }
            }
        }

        // add boolean filtered
        if( filterVar != null )
        {
            var f1 = filterVar[0];
            var op1 = fieldOptions[f1][filterVar[1]];

            if( filterVar[2] != null )
            {
                var f2 = filterVar[2];
                var op2 = fieldOptions[f2][filterVar[3]];

                for( var r=1; r<ptable.length; r++ )
                    ptable[r].push( ptable[r][f1] != op1 | ptable[r][f2] != op2 );

            }
            else
            {
                for( var r=1; r<ptable.length; r++ )
                    ptable[r].push( ptable[r][f1] != op1 );
            }
                    
        }

        //initializing start options values
        var colors = [0x1f77b4,0xff7f0e,0x2ca02c,0xd62728,0x9467bd,0x8c564b,0xe377c2,0x7f7f7f, 0xbcbd22, 0x17becf
                    ,0x1f77b4,0xff7f0e,0x2ca02c,0xd62728,0x9467bd,0x8c564b,0xe377c2,0x7f7f7f, 0xbcbd22, 0x17becf
                    ,0x1f77b4,0xff7f0e,0x2ca02c,0xd62728,0x9467bd,0x8c564b,0xe377c2,0x7f7f7f, 0xbcbd22, 0x17becf
                    ,0x1f77b4,0xff7f0e,0x2ca02c,0xd62728,0x9467bd,0x8c564b,0xe377c2,0x7f7f7f, 0xbcbd22, 0x17becf
                    ,0x1f77b4,0xff7f0e,0x2ca02c,0xd62728,0x9467bd,0x8c564b,0xe377c2,0x7f7f7f, 0xbcbd22, 0x17becf];
        var startField = 0;

        colors = colors.slice(0, fieldOptions[startField].length);


        // Methods

        // returns record count
        function getNumberOfRecords()
        {
            return ptable.length;
        }

        // returns array of count of options per field
        function getNumberOfAllOptions()
        {
            var arr = new Array(fieldOptions.length);

            for( var i=0; i<arr.length; i++ )
                arr[i] = fieldOptions[i].length;

            return arr;
        }

        // returns array of field names
        function getAllFields()
        {
            return fieldNames;
        }

        // returns array of options names
        function getAllOptions()
        {
            return fieldOptions;
        }

        // returns array of options names of given field
        function getOptionsOfField( field )
        {
            return fieldOptions[field];
        }

        // returns array of start options names
        function getOptionsOfStartField()
        {
            return fieldOptions[startField];
        }

        // returns color of given option
        function getColors()
        {
            return colors;
        }

        // returns a tally of records with option1 and option2 of each start option
        function tallyStack(field1,option1,field2,option2)
        {
            // console.log(field1 + "  " + option1 + "  " + field2 + "  " + option2);
            var option1Name = fieldOptions[field1][option1];
            var option2Name = fieldOptions[field2][option2];
            var totalValues;

            totalValues = new Array(getOptionsOfStartField().length);
            var current_start_option;
            for( var st=0; st<totalValues.length; st++ )
            {
                totalValues[st] = 0;
                current_start_option = fieldOptions[startField][st];
                for( var i=1; i<ptable.length; i++ )
                    if ( ptable[i][startField] == current_start_option && ptable[i][field1] == option1Name && ptable[i][field2] == option2Name )
                        if ( !ptable[i][ptable[0].length] )
                            totalValues[st]++;
            }

            return totalValues;
        }

        // returns a tally of records with start options and given option
        function tallyColumn(field2,option2)
        {
            var option2Name = fieldOptions[field2][option2];
            var totalValues;

            totalValues = new Array(getOptionsOfStartField().length);
            for( var st=0; st<totalValues.length; st++ )
            {
                totalValues[st] = 0;
                current_start_option = fieldOptions[startField][st];
                for( var i=1; i<ptable.length; i++ )
                    if ( ptable[i][startField] == current_start_option && ptable[i][field2] == option2Name )
                        if ( !ptable[i][ptable[0].length] )
                            totalValues[st]++;
            }

            return totalValues;
        }
        
        this.getNumberOfRecords = getNumberOfRecords;
        this.getNumberOfAllOptions = getNumberOfAllOptions;
        this.getAllFields = getAllFields;
        this.getAllOptions = getAllOptions;
        this.getOptionsOfField = getOptionsOfField;
        this.getOptionsOfStartField = getOptionsOfStartField;
        this.getColors = getColors;
        this.tallyStack = tallyStack;
        this.tallyColumn = tallyColumn;

    }

    function Grid( columns, len, fieldNames, optionNames, obj, firstField, colors )
    {
        this.type = "Grid";
        this.columns = columns.length;

        var material = new THREE.LineBasicMaterial( { color: 0x000000 } );
        var material_text = new THREE.MeshPhongMaterial( { color: 0x000000 } );

        // drawing quadrants
        for( var i=1; i<columns.length; i++)
            addQuad(i);

        // drawing text
        for( var f=0; f<columns.length; f++)
        {
            addText(fieldNames[f],markerLocation(f,0),true,false);
            for( var j=0; j<columns[f]; j++)
                addText(optionNames[f][j],markerLocation(f,j),false,true);
        }

        addLegend( firstField, colors );

        function addText( text, coord, isField, isMarkerVisible )
        {
            var xR = 0;
            var x = coord[0];
            if( isField )
            {
                var z = len + len/5;
                var y = 0;
                text = SERVICE[text]["value"].toUpperCase();
                xR = -1.5708;
            }
            else
            {
                var z = coord[2];
                var y = len;
            }

            var loader = new THREE.FontLoader();

            loader.load( FONT, function ( font ) {

                var geometry = new THREE.TextGeometry( text, {
                    font: font,
                    size: len/20,
                    height: LEN / 300,
                    curveSegments: 12,
                    bevelEnabled: false,
                    bevelThickness: 10,
                    bevelSize: 8,
                    bevelSegments: 5
                } );

                var textMesh = new THREE.Mesh( geometry, material_text.clone() );
                textMesh.position.set( x, y, z );
                textMesh.rotation.x = xR;
                textMesh.name = "text";
                obj.add( textMesh );
            } );

            if( isMarkerVisible )
                addMarker( coord );
        }

        function addMarker( coord )
        {
            var x = coord[0];
            var z = coord[2];

            var geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3( x, 0, z ));
            geometry.vertices.push(new THREE.Vector3( x, len, z ));
            var marker = new THREE.Line( geometry, material );
            marker.name = "marker";
            obj.add( marker );
        }

        function addQuad( q )
        {
            var geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3( (q-1) * len, 0, 0 ));
            geometry.vertices.push(new THREE.Vector3( q * len, 0, 0 ));
            geometry.vertices.push(new THREE.Vector3( q * len, 0, len ));
            geometry.vertices.push(new THREE.Vector3( (q-1) * len, 0, len ));
            geometry.vertices.push(new THREE.Vector3( (q-1) * len, 0, 0 ));
            var quad = new THREE.Line( geometry, material.clone() );
            quad.name = "quad";
            obj.add( quad );
        }

        function markerLocation(column, option)
        {
            var num_of_options = columns[column];

            if( option > num_of_options-1 || option < 0 )
                console.error("Column " + column + " does not contain option " + option);

            var separation_line = len / ( num_of_options - 1 );
            var x = column * len;
            var z = option * separation_line;
            
            return [x,0,z];
        }

        function getFieldCount()
        {
            return columns.length;
        }

        function addLegend( firstField, colors )
        {
            var separation = LEN * 0.65;
            var legend = new THREE.Group();

            for( var l=0; l<firstField.length; l++ )
                addTextLegend(firstField[l],colors[l],l*separation);

            function addTextLegend( text, color, x )
            {
                var loader = new THREE.FontLoader();
                loader.load( FONT, function ( font ) {

                    var geometry = new THREE.TextGeometry( text, {
                        font: font,
                        size: len/15,
                        height: LEN / 300,
                        curveSegments: 12,
                        bevelEnabled: false
                    } );
        
                    var textMesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial( { color: color }) );
                    textMesh.position.set( x, 0, 0 );
                    legend.add( textMesh );
                } );
            }

            legend.position.set((LEN/2) * (table[0].length-1) - firstField.length * separation / 2, len+len/4 ,0);

            obj.add(legend);

        }

        this.markerLocation = markerLocation;
        this.getFieldCount = getFieldCount;
    }

    function Column( coord, values, len, colors, attributes, obj )
    {
        this.type = "Column";
        var x = coord[0];
        var y = coord[1];
        var z = coord[2];

        var totalValue = 0;
        for( var v=0; v<values.length; v++)
        {
            values[v] = values[v] * CHART_RATIO;
            totalValue+=values[v];
        }

        if ( totalValue >= 0 )
        {
            var tempTopValue = totalValue;

            // drawing archs
            for( var v=0; v<values.length; v++)
                if( values[v] > 0 )
                    addColumn(values[v],colors[v]);
        }
        else
        {
            console.error("Total tally cannot be negative");
        }

        // addColumn( value of column, color of column )
        function addColumn(value, color)
        {
            tempTopValue-= value;

            var geometry = new THREE.CylinderGeometry( len/50, len/50, value, 32 );
            var cylinder = new THREE.Mesh( geometry, new THREE.MeshStandardMaterial( { color: color } ) );
            cylinder.position.set( x, tempTopValue+value/2 + y, z );
            cylinder.material.transparent = true;
            cylinder.attributes = attributes;
            cylinder.name = "cylinder";
            obj.add( cylinder );
        }
    }

    function Stack( coord, newCoord, values, len, colors, attributes, obj )
    {
        var ratio = 2; // archstack appears to be half the size of the column

        this.type = "Stack";
        var extrudeSettings = { depth: len/100, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 0.25 };
        var x = coord[0];
        var y = coord[1];
        var z = coord[2];
        var nX = newCoord[0];
        var nY = newCoord[1];
        var nZ = newCoord[2];

        var totalValue = 0;
        for( var v=0; v<values.length; v++)
        {
            values[v] = values[v] * ratio * CHART_RATIO;
            totalValue+=values[v];
        }

        if ( totalValue >= 0 )
        {
            var tempTopValue = ( STEAM ) ? totalValue/2 : totalValue;

            // drawing archs
            for( var v=0; v<values.length; v++)
                if( values[v] > 0 )
                    addArch(values[v],colors[v]);
        }
        else
        {
            console.error("Total tally cannot be negative");
        }

        // addArch( value of arch, color of arch )
        function addArch(value, color)
        {
            // value = LEN / value;
            var top = tempTopValue;
            var down = top-value;
            tempTopValue-= value;
            var dist = Math.sqrt(Math.pow((nX-x),2)+Math.pow((nZ-z),2));
            var theta = (z > nZ) ? Math.acos(len/dist) : Math.acos(len/dist) * -1;
            var arch = new THREE.Shape();

            if( ARCH )
            {
                arch.moveTo( 0 , 0 );
                arch.quadraticCurveTo(dist/2,top,dist,0);
                arch.quadraticCurveTo(dist/2,down,0,0);
            }
            else
            {
                arch.moveTo(0,down/2)
                arch.lineTo(0,top/2);
                arch.lineTo(dist,top/2);
                arch.lineTo(dist,down/2);
                arch.lineTo(0,down/2);
            }
            addShape( arch, extrudeSettings, color, x, 0, z, 0, theta, 0, 1 );
        }

        function addShape( shape, extrudeSettings, color, x, y, z, rx, ry, rz, s )
        {
            var geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
            var material = new THREE.MeshStandardMaterial( { color: color } );
            var arch = new THREE.Mesh( geometry, material );

            arch.position.set( x, y, z );
            arch.rotation.set( rx, ry, rz );
            arch.scale.set( s, s, s );
            arch.material.transparent = true;
            arch.attributes = attributes;
            arch.name = "arch";
            obj.add( arch );
        }
    }


}