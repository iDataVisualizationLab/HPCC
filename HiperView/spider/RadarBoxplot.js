d3.RadarBox = function () {
    let margin = {top: 0, right: 0, bottom: 0, left: 0};
    let svg;
    let data = [];
    let RadarBox ={};
    let id;
    RadarBox.data = function (_) {
        return arguments.length ? (data = _, RadarBox) : data;

    };
    RadarBox.svg = function (_) {
        return arguments.length ? (svg = _, RadarBox) : svg;

    };
    RadarBox.id = function (_) {
        return arguments.length ? (id = _, RadarBox) : id;

    };
    // Make the DIV element draggable: from W3 code

    return RadarBox;
}