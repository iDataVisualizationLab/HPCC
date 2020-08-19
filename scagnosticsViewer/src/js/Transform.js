class Transform {
    constructor (k, x, y) {
        this.k = k;
        this.x = x;
        this.y = y;
    }
    scale(k) {
        return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
    }
    translate(x, y) {
        return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
    }
    apply(point) {
        return [point[0] * this.k + this.x, point[1] * this.k + this.y];
    }
    applyX(x) {
        return x * this.k + this.x;
    }
    applyY(y) {
        return y * this.k + this.y;
    }
    invert(location) {
        return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
    }
    invertX(x) {
        return (x - this.x) / this.k;
    }
    invertY(y) {
        return (y - this.y) / this.k;
    }
    rescaleX(x) {
        return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
    }
    rescaleY(y) {
        return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
    }
    toString() {
        return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
    }
};
