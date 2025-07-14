THREE.CubicBezierCurve_w3 = (function () {
    function CubicBezierCurve_w3( v0, v1, v2, v3, w ) {

        THREE.Curve.call( this );

        this.type = 'CubicBezierCurve_w3';

        this.v0 = v0 || new THREE.Vector3();
        this.v1 = v1 || new THREE.Vector3();
        this.v2 = v2 || new THREE.Vector3();
        this.v3 = v3 || new THREE.Vector3();
        this.w = w||0.1;
    }
    CubicBezierCurve_w3.prototype = Object.create( THREE.Curve.prototype );
    CubicBezierCurve_w3.prototype.constructor = CubicBezierCurve_w3;

    CubicBezierCurve_w3.prototype.isCubicBezierCurve_w3 = true;

    CubicBezierCurve_w3.prototype.getPoint = function ( t, optionalTarget ) {

        var point = optionalTarget || new THREE.Vector3();

        var v0 = this.v0, v1 = this.v1, v2 = this.v2, v3 = this.v3;
        point.set(
            RationalBezier( t, this.w, [v0.x, v1.x, v2.x, v3.x]),
            RationalBezier( t, this.w, [v0.y, v1.y, v2.y, v3.y] ),
            RationalBezier( t, this.w, [v0.z, v1.z, v2.z, v3.z] )
        );
        return point;

    };
    function RationalBezier(t,w,p)
    {

        const t2 = t * t;
        const t3 = t2 * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const f = [
            mt3,
            3 * w * mt2 * t,
            3 * w * mt * t2,
            t3
        ];
        const basis = f[0] + f[1] + f[2] + f[3];
        return basis? ((f[0]*p[0] + f[1]*p[1] + f[2]*p[2] + f[3]*p[3]) / basis):0;
    }

    CubicBezierCurve_w3.prototype.copy = function ( source ) {

        THREE.Curve.prototype.copy.call( this, source );

        this.v0.copy( source.v0 );
        this.v1.copy( source.v1 );
        this.v2.copy( source.v2 );
        this.v3.copy( source.v3 );

        return this;

    };

    CubicBezierCurve_w3.prototype.toJSON = function () {

        var data = THREE.Curve.prototype.toJSON.call( this );

        data.v0 = this.v0.toArray();
        data.v1 = this.v1.toArray();
        data.v2 = this.v2.toArray();
        data.v3 = this.v3.toArray();

        return data;

    };

    CubicBezierCurve_w3.prototype.fromJSON = function ( json ) {

        THREE.Curve.prototype.fromJSON.call( this, json );

        this.v0.fromArray( json.v0 );
        this.v1.fromArray( json.v1 );
        this.v2.fromArray( json.v2 );
        this.v3.fromArray( json.v3 );

        return this;

    };
    return CubicBezierCurve_w3;
})();
