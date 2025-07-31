function millisecondsToStr (milliseconds) {
    // TIP: to find current time in milliseconds, use:
    // var  current_time_milliseconds = new Date().getTime();

    function numberEnding (number) {
        return (number > 1) ? 's' : '';
    }

    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    var str = '';
    if (years) {
        str+= years + ' year' + numberEnding(years);
    }
    //TODO: Months! Maybe weeks?
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        str+= days + ' day' + numberEnding(days)+' ';
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        str+= hours + ' hour' + numberEnding(hours)+' ';
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        str+= minutes + ' minute' + numberEnding(minutes)+' ';
    }
    var seconds = temp % 60;
    if (seconds) {
        str+= seconds + ' second' + numberEnding(seconds)+' ';
    }
    if(str==='')
        return Math.round(milliseconds)+' ms' ; //'just now' //or other string you like;
    else
        return str;
}
function millisecondsToStr_axproximate (milliseconds) {
    // TIP: to find current time in milliseconds, use:
    // var  current_time_milliseconds = new Date().getTime();

    function numberEnding (number) {
        return (number > 1) ? 's' : '';
    }

    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    var str = '';
    if (years) {
        str+= years + ' year' + numberEnding(years);
        return `(~ ${str})`
    }
    //TODO: Months! Maybe weeks?
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        str+= days + ' day' + numberEnding(days)+' ';
        return `(~ ${str})`
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        str+= hours + ' hour' + numberEnding(hours)+' ';
        return `(~ ${str})`
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        str+= minutes + ' minute' + numberEnding(minutes)+' ';
        return str
    }
    var seconds = temp % 60;
    if (seconds) {
        str+= seconds + ' second' + numberEnding(seconds)+' ';
    }
    if(str==='')
        return Math.round(milliseconds)+' ms' ; //'just now' //or other string you like;
    else
        return str;
}
// Establish the desired formatting options using locale.format():
// https://github.com/d3/d3-time-format/blob/master/README.md#locale_format
var formatMillisecond = d3.timeFormat(".%L"),
    formatSecond = d3.timeFormat(":%S"),
    formatMinute = d3.timeFormat("%I:%M"),
    formatHour = d3.timeFormat("%I %p"),
    formatDay = d3.timeFormat("%a %d"),
    formatWeek = d3.timeFormat("%b %d"),
    formatMonth = d3.timeFormat("%B"),
    formatYear = d3.timeFormat("%Y");

// Define filter conditions
function multiFormat(date) {
    return (d3.timeSecond(date) < date ? formatMillisecond
        : d3.timeMinute(date) < date ? formatSecond
            : d3.timeHour(date) < date ? formatMinute
                : d3.timeDay(date) < date ? formatHour
                    : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
                        : d3.timeYear(date) < date ? formatMonth
                            : formatYear)(date);
}
function UpdateGradient(svg) { // using global arrcolor
    let rdef = svg.select('defs.gradient');
    let rg,rg2,lg;
    if (rdef.empty()){
        rdef = svg.append("defs").attr('class','gradient');
        rg = rdef
            .append("radialGradient")
            .attr("id", "rGradient");
        rg2 = rdef.append("radialGradient")
            .attr("id", "rGradient2");
        lg = rdef.append("linearGradient")
            .attr("id", "lradient");
    }
    else {
        rg = rdef.select('#rGradient');
        rg2 = rdef.select('#rGradient2');
        lg = rdef.select('#lradient');
    }
    let opacityGradient =undefined
    // const rangeop = d3.range(0,arrColor.length);
    // const opas = d3.scaleLinear().domain([1,arrColor.length/2-1]).range([1,0.5]);
    // let opacityGradient = d3.scaleLinear().domain(rangeop).range(rangeop.map(d=>opas(d>(arrColor.length/2-1)?(arrColor.length-1-d):d)));
    createGradient(rg,4,arrColor,opacityGradient);
    createGradient(rg2,0,arrColor,opacityGradient);
    createLinearGradient('v',lg,0,arrColor,opacityGradient);

}
function fixName2Class(s) {
    return 'h'+s.replace(/ |#|\./gi,''); //avoid . and number format
}
function positiveAngle(angle){
    return angle>0? angle: (angle+Math.PI*2);
}
function loadTheme(event){
    const theme = d3.select(event.target).attr('value')
    d3.select(document.getElementsByTagName('BODY')[0]).select('link#theme')
        .attr('href',`src/style/bootstrap${theme!=''?'.'+theme:''}.css`)
}


// save file
// Below are the functions that handle actual exporting:
// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
function getSVGString( svgNode ) {
    svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
    var cssStyleText = getCSSStyles( svgNode );
    appendCSS( cssStyleText, svgNode );

    var serializer = new XMLSerializer();
    var svgString = serializer.serializeToString(svgNode);
    svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
    svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

    return svgString;

    function getCSSStyles( parentElement ) {
        var selectorTextArr = [];

        // Add Parent element Id and Classes to the list
        selectorTextArr.push( '#'+parentElement.id );
        for (var c = 0; c < parentElement.classList.length; c++)
            if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
                selectorTextArr.push( '.'+parentElement.classList[c] );

        // Add Children element Ids and Classes to the list
        var nodes = parentElement.getElementsByTagName("*");
        for (var i = 0; i < nodes.length; i++) {
            var id = nodes[i].id;
            if ( !contains('#'+id, selectorTextArr) )
                selectorTextArr.push( '#'+id );

            var classes = nodes[i].classList;
            for (var c = 0; c < classes.length; c++)
                if ( !contains('.'+classes[c], selectorTextArr) )
                    selectorTextArr.push( '.'+classes[c] );
        }

        // Extract CSS Rules
        var extractedCSSText = "";
        for (var i = 0; i < document.styleSheets.length; i++) {
            var s = document.styleSheets[i];

            try {
                if(!s.cssRules) continue;
            } catch( e ) {
                if(e.name !== 'SecurityError') throw e; // for Firefox
                continue;
            }

            var cssRules = s.cssRules;
            for (var r = 0; r < cssRules.length; r++) {
                if ( contains( cssRules[r].selectorText, selectorTextArr ) )
                    extractedCSSText += cssRules[r].cssText;
            }
        }


        return extractedCSSText;

        function contains(str,arr) {
            return arr.indexOf( str ) === -1 ? false : true;
        }

    }

    function appendCSS( cssText, element ) {
        var styleElement = document.createElement("style");
        styleElement.setAttribute("type","text/css");
        styleElement.innerHTML = cssText;
        var refNode = element.hasChildNodes() ? element.children[0] : null;
        element.insertBefore( styleElement, refNode );
    }
}


function svgString2Image( svgString, width, height, format, callback ) {
    var format = format ? format : 'png';

    var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    var image = new Image();
    image.onload = function() {
        context.clearRect ( 0, 0, width, height );
        context.drawImage(image, 0, 0, width, height);

        canvas.toBlob( function(blob) {
            var filesize = Math.round( blob.length/1024 ) + ' KB';
            if ( callback ) callback( blob, filesize );
        });


    };

    image.src = imgsrc;
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function getUrl({_start,_end,interval,value,compress}){
    const timeFormat = d3.timeFormat('%Y-%m-%dT%H:%M:%S-05:00');
    const start = timeFormat(_start)
    const end = timeFormat(_end)
    interval = interval||'5m';
    value = value||'max';
    compress = compress||false;
    const url = `https://influx.ttu.edu:8080/v1/metrics?start=${start}&end=${end}&interval=${interval}&value=${value}&compress=${compress}`;
    return url;
}
