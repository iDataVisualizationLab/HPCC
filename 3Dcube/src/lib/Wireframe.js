( function () {

    const _start = new THREE.Vector3();

    const _end = new THREE.Vector3();

    class Wireframe extends THREE.Mesh {

        constructor( geometry = new THREE.LineSegmentsGeometry(), material = new THREE.LineMaterial( {
            color: Math.random() * 0xffffff
        } ) ) {

            super( geometry, material );
            this.type = 'Wireframe';

        } // for backwards-compatability, but could be a method of THREE.LineSegmentsGeometry...


        computeLineDistances() {

            const geometry = this.geometry;
            const instanceStart = geometry.attributes.instanceStart;
            const instanceEnd = geometry.attributes.instanceEnd;
            const lineDistances = new Float32Array( 2 * instanceStart.count );

            for ( let i = 0, j = 0, l = instanceStart.count; i < l; i ++, j += 2 ) {

                _start.fromBufferAttribute( instanceStart, i );

                _end.fromBufferAttribute( instanceEnd, i );

                lineDistances[ j ] = j === 0 ? 0 : lineDistances[ j - 1 ];
                lineDistances[ j + 1 ] = lineDistances[ j ] + _start.distanceTo( _end );

            }

            const instanceDistanceBuffer = new THREE.InstancedInterleavedBuffer( lineDistances, 2, 1 ); // d0, d1

            geometry.setAttribute( 'instanceDistanceStart', new THREE.InterleavedBufferAttribute( instanceDistanceBuffer, 1, 0 ) ); // d0

            geometry.setAttribute( 'instanceDistanceEnd', new THREE.InterleavedBufferAttribute( instanceDistanceBuffer, 1, 1 ) ); // d1

            return this;

        }

    }

    Wireframe.prototype.isWireframe = true;

    THREE.Wireframe = Wireframe;

} )();
