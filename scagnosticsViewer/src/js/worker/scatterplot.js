importScripts(
    '../../lib/d3.v5.min.js',
    '../Transform.js',
    '../../../node_modules/@d3fc/d3fc-extent/build/d3fc-extent.js',
    '../../../node_modules/@d3fc/d3fc-rebind/build/d3fc-rebind.js',
    '../../../node_modules/@d3fc/d3fc-series/build/d3fc-series.js',
    '../../../node_modules/@d3fc/d3fc-webgl/build/d3fc-webgl.js'
);

let data =[],
    xScale=d3.scaleLinear().range([-0.5,0.5]),
    yScale=d3.scaleLinear().range([-0.5,0.5]),
    x=d3.scaleLinear().range([-0.5,0.5]),
    y=d3.scaleLinear().range([-0.5,0.5]),
    _transform=new Transform(1,0,0);

let fillColor = fc
    .webglFillColor()
    .value(d => d.color??[0,0,0,0.75]);
let series = fc
    .seriesWebglPoint()
    .xScale(x)
    .yScale(y)
    .crossValue(d => d.x)
    .mainValue(d => d.y)
    .size(d => d.size??10)
    // .equals((previousData, data) => previousData.length > 0)
    .decorate(program => {
        // Set the color of the points.
        fillColor(program);

        // Enable blending of transparent colors.
        const context = program.context();
        context.enable(context.BLEND);
        context.blendFunc(context.SRC_ALPHA, context.ONE_MINUS_SRC_ALPHA);
    });
function render() {
    fillColor = fillColor.data(data);
    series(data);
    postMessage('frame');
}
addEventListener('message', ({ data: { offscreenCanvas, width, height, transform, data } }) => {
    if (offscreenCanvas) {
        postMessage('Rendering...');
        const gl = offscreenCanvas.getContext('webgl');
        series.context(gl);
        render();
    }
    if (data!= null){
        handleData(data);
        render();
    }
    if (width != null && height != null) {
        const gl = series.context();
        gl.canvas.width = width;
        gl.canvas.height = height;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        xScale.domain([0,width]).range([0,width]);
        yScale.domain([height,0]).range([height,0]);
        x.domain([0,width]).range([0,width]);
        y.domain([height,0]).range([height,0]);
    }
    if(transform != null){
        _transform = new Transform(transform.k,transform.x,transform.y)
        x.domain(_transform.rescaleX(xScale).domain());
        y.domain(_transform.rescaleY(yScale).domain());
        render();
    }
});

function handleData(_data){
    data=_data;
    // xScale.domain(d3.extent(_data,d=>d.x));
    // yScale.domain(d3.extent(_data,d=>d.y).reverse());
    // x.domain(_transform.rescaleX(xScale).domain());
    // y.domain(_transform.rescaleY(yScale).domain());
}
