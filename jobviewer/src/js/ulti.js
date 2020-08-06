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

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
