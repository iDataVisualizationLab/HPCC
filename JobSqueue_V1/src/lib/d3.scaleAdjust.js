// Ngan TTU  Nov. 13 18
d3.scaleAdjust =function() {

        //scaleAdjust = {};
    let     xIndex = 0,
            domain = [0, 2],
            range = [0, 2],
            itemsize = 300,
            rwidth = (range[1] - range[0] - itemsize) / (domain[1] - domain[0]);
    scaleAdjust = function(_){
        if (arguments.length) {
            xIndex = _;
            return (xIndex>domain[1])? ((xIndex-domain[0])*2*rwidth+range[0]):((xIndex-domain[0])*rwidth+range[0]);
        }
        else {
            return scaleAdjust;
        }};

    // function access
    scaleAdjust.domain = function(_){
        if (arguments.length) {
            rwidth = (range[1] - range[0] - itemsize) / (domain[1] - domain[0]);
            domain = _;
            return scaleAdjust;
        }
        else
            return domain;
    };
    scaleAdjust.range = function(_){
        if (arguments.length) {
            rwidth = (range[1] - range[0] - itemsize) / (domain[1] - domain[0]);
            range = _;
            return scaleAdjust;
        }
        else
            return range;
    };
    scaleAdjust.itemsize = function(_){
        return arguments.length ? (itemsize = _, scaleAdjust) : itemsize;
    };
    scaleAdjust.offsetx = function(){
        return range[0];
    };
    scaleAdjust.step = function(){
        return rwidth = (range[1] - range[0] - itemsize) / (domain[1] - domain[0]);;
    };
    return scaleAdjust;

};