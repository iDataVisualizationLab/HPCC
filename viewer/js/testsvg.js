window.addEventListener('load', function(){

    var stats = new Stats();
    stats.setMode( 0 ); // 0: fps, 1: ms, 2: mb

    // align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    document.body.appendChild( stats.domElement );



    var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    /*
      Generate the data.
     */
    var data = [];
    function makeData(count) {
        data = [];
        for(var i = 0; i < count; i++) {
            var w = 10 + Math.random() * 20;
            var obj = {
                x: Math.random() * (width - 20),
                y: Math.random() * (height - 20),
                xVel: (Math.random() * 0.5) * (Math.random() < 0.5 ? -1 : 1),
                yVel: (Math.random() * 0.5) * (Math.random() < 0.5 ? -1 : 1),
                width: w,
                height: w,
                index: i
            };
            data.push(obj);
        }
        return data;
    }

    var controls = {count:100};
    var gui = new dat.GUI();
    var controller = gui.add(controls, 'count', 0, 20000).step(100);
    controller.onChange(function(value) {
        data = makeData(value);
    });

    /*
      Updates the nodes on each frame to make them bounce around the screen.
     */
    function update(data) {
        var numElements = data.length;
        // for(var i = 0; i < numElements; i++) {
        for(var i = 0; i < numElements; i++) {
            var node = data[i];
            node.x += node.xVel;
            node.y += node.yVel;

            if(node.x > width || node.x < 0) {
                node.xVel *= -1;
            }
            if(node.y > height || node.y < 0) {
                node.yVel *= -1;
            }
        }
    }

    function init(container) {
        var svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
        return svg;
    }


    function draw(data, selection) {
        var nodes = selection.selectAll("rect.node")
            .data(data, function(d) { return d.index; });

        nodes.enter()
            .append('rect')
            .attr('class', 'node')
            .on('click', function(d){
                d.renderCol = 'Orange';
            });

        nodes
            .attr('width', function(d){ return d.width; })
            .attr('height', function(d){ return d.height; })
            .attr('x', function(d){ return d.x; })
            .attr('y', function(d){ return d.y; })
            .style('opacity', 1)
            .style('fill', function(d){
                if(d.renderCol){
                    return d.renderCol;
                } else {
                    return 'DimGray';
                }
            });

        nodes.exit()
            .remove();

    }

    // Generate the data and start the draw loop.

    var svg = init(document.querySelector('#container'));
    data = makeData(100);
    function animate() {
        stats.begin();
        draw(data, svg);
        update(data);
        stats.end();
        window.requestAnimationFrame(animate);
    }
    window.requestAnimationFrame(animate);



}, false);