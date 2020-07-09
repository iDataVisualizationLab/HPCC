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
