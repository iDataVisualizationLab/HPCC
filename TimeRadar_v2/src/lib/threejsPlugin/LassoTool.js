/**
 * @author Ngan Nguyen
 * Base on HypnosNova / https://www.threejs.org.cn/gallery
 * This is a class to check whether objects are in a selection area in 3D space
 * Modifier to lasso selection Ngan Nguyen 1/18/2020
 * selection are with reconvert 3D space to 2D space combine this function with d3 svg
 */

THREE.LassoTool = ( function () {

    var frustum = new THREE.Frustum();
    var center = new THREE.Vector3();
    var lassoPath,closePath;
    var g;
    var dispatch = d3.dispatch('start', 'end');
    function LassoTool( camera, scene, graphicopt, svg,closeDistance) {
        let self = this;
        this.camera = camera;
        this.scene = scene;
        this.width = graphicopt.width;
        this.height = graphicopt.height;
        this.svg = svg;
        this.svg.selectAll('*').remove();
        this.closeDistance = closeDistance||Infinity;
        this.lassoPolygon = [];
        this.collection = [];
        this.needRender = false;
        this.on = function (type, callback) {
            dispatch.on(type, callback);
            return self;
        };
    }

    LassoTool.prototype.start = function (  ) {
        g = this.svg.select('.group');
        if (g.empty())
            g = this.svg.append('g').attr('class', 'lasso-group');
        if (lassoPath) {
            lassoPath.remove();
        }

        lassoPath = g
            .append('path')
            .style('fill', '#0bb')
            .style('fill-opacity', 0.1)
            .style('stroke', '#0bb')
            .style('stroke-dasharray', '3, 3');

        closePath = g
            .append('line')
            .attr('x2', this.lassoPolygon[0][0])
            .attr('y2', this.lassoPolygon[0][1])
            .style('stroke', '#0bb')
            .style('stroke-dasharray', '3, 3')
            .style('opacity', 0);

        dispatch.call('start', this, this.lassoPolygon);

    };
    LassoTool.prototype.end = function (  ) {
        // remove the close path
        closePath.remove();
        closePath = null;
        // succesfully closed
        if (distance(this.lassoPolygon[0], this.lassoPolygon[this.lassoPolygon.length - 1]) < this.closeDistance) {
            lassoPath.attr('d', polygonToPath(this.lassoPolygon) + 'Z');
            dispatch.call('end', this, this.lassoPolygon);

            // otherwise cancel
        } else {
            lassoPath.remove();
            lassoPath = null;
            this.lassoPolygon = [];
        }

    };

    LassoTool.prototype.reset = function (  ) {
        if (lassoPath) {
            lassoPath.remove();
            lassoPath = null;
        }

        this.lassoPolygon = [];
        if (closePath) {
            closePath.remove();
            closePath = null;
        }

    };

    function polygonToPath(polygon) {
        return ("M" + (polygon.map(function (d) { return d.join(','); }).join('L')));
    }
    function distance(pt1, pt2) {
        return Math.sqrt(Math.pow( (pt2[0] - pt1[0]), 2 ) + Math.pow( (pt2[1] - pt1[1]), 2 ));
    }

    LassoTool.prototype.select = function ( arrPoint ) {
        this.arrPoint = arrPoint || this.arrPoint;
        this.collection = [];
        this.updateFrustum( );
        this.searchChildInFrustum( frustum, this.scene );

        return this.collection;

    };

    LassoTool.prototype.updateFrustum = function () {
        this.camera.updateMatrix();
        this.camera.updateMatrixWorld();
        frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));

        // update lasso path https://bl.ocks.org/pbeshai/8008075f9ce771ee8be39e8c38907570
        lassoPath.attr('d', polygonToPath(this.lassoPolygon));
        let point = this.lassoPolygon[this.lassoPolygon.length-1];
        // indicate if we are within closing distance
        if (distance(this.lassoPolygon[0], point) < this.closeDistance) {
            closePath
                .attr('x1', point[0])
                .attr('y1', point[1])
                .style('opacity', 1);
        } else {
            closePath.style('opacity', 0);
        };
    };

    // Ngan - 1/19/2020
    LassoTool.prototype.checkPoint = function (frustum) {
        if (frustum.containsPoint(center)){
            center.project( this.camera );
            const point2D = [(center.x+1)*this.width/2,-(center.y-1)*this.height/2];
            return d3.polygonContains(this.lassoPolygon, point2D);
        }
        return false;
    };

    LassoTool.prototype.searchChildInFrustum = function ( frustum, object, isPoints ) {
        if ( object.visible === false ) return;

        if (object.type==="Points"){
            var _position = new THREE.Vector3();
            var geometry = object.geometry;
            var matrixWorld = object.matrixWorld;

            if ( geometry.isBufferGeometry ) {

                var index = geometry.index;
                var attributes = geometry.attributes;
                var positions = attributes.position.array;

                if ( index !== null ) {

                    var indices = index.array;

                    for ( var i = 0, il = indices.length; i < il; i ++ ) {

                        var a = indices[ i ];

                        _position.fromArray( positions, a * 3 );

                        // testPoint( _position, a, localThresholdSq, matrixWorld, raycaster, intersects, this );
                        this.searchChildInFrustum( frustum, {center: _position,matrixWorld: matrixWorld,index:i} ,true);

                    }

                } else {

                    for ( var i = 0, l = positions.length / 3; i < l; i ++ ) {

                        _position.fromArray( positions, i * 3 );

                        // testPoint( _position, i, localThresholdSq, matrixWorld, raycaster, intersects, this );
                        this.searchChildInFrustum( frustum, {center: _position,matrixWorld: matrixWorld,index:i} ,true);

                    }

                }

            } else {

                var vertices = geometry.vertices;

                for ( var i = 0, l = vertices.length; i < l; i ++ ) {

                    // testPoint( vertices[ i ], i, localThresholdSq, matrixWorld, raycaster, intersects, this );
                    this.searchChildInFrustum( frustum, {center: vertices[ i ],matrixWorld: matrixWorld,index:i} ,true);

                }

            }

        }else if (isPoints){
            center.copy( object.center );

            center.applyMatrix4( object.matrixWorld );

            if ( this.checkPoint(frustum)) {

                this.collection.push( object.index );

            }
        }else {
            if (object.isMesh) {

                if (object.material !== undefined) {

                    object.geometry.computeBoundingSphere();

                    center.copy(object.geometry.boundingSphere.center);

                    center.applyMatrix4(object.matrixWorld);

                    if (this.checkPoint(frustum)) {

                        this.collection.push(object);

                    }

                }

            }

            if (object.children.length > 0) {

                for (var x = 0; x < object.children.length; x++) {

                    this.searchChildInFrustum(frustum, object.children[x]);

                }

            }
        }

    };

    return LassoTool;

} )();