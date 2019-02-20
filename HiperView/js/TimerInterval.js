// source: https://stackoverflow.com/questions/24724852/pause-and-resume-setinterval
function IntervalTimer(callback, interval) {
    var timerId, startTime, remaining = 0;
    var state = 0; //  0 = idle, 1 = running, 2 = paused, 3= resumed

    this.pause = function () {
        if (state != 1) return;

        remaining = interval - (new Date() - startTime);
        window.clearInterval(timerId);
        state = 2;
    };

    this.resume = function () {
        if (state != 2) return;

        state = 3;
        window.setTimeout(this.timeoutCallback, remaining);
    };

    this.timeoutCallback = function (intervalin) {
        if (state != 3) return;

        callback();
        interval = intervalin||interval;
        startTime = new Date();
        timerId = window.setInterval(callback, interval);
        state = 1;
    };

    this.stop = function () {
        state = 0;
        window.clearInterval(timerId);
    };

    startTime = new Date();
    timerId = window.setInterval(callback, interval);
    state = 1;

}