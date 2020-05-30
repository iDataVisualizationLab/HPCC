(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["main"],{

/***/ "./$$_lazy_route_resource lazy recursive":
/*!******************************************************!*\
  !*** ./$$_lazy_route_resource lazy namespace object ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncaught exception popping up in devtools
	return Promise.resolve().then(function() {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "./$$_lazy_route_resource lazy recursive";

/***/ }),

/***/ "./src/app/AsynChart/asynchart.component.ts":
/*!**************************************************!*\
  !*** ./src/app/AsynChart/asynchart.component.ts ***!
  \**************************************************/
/*! exports provided: AsynchartComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AsynchartComponent", function() { return AsynchartComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
/* harmony import */ var _mark__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./mark */ "./src/app/AsynChart/mark.ts");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! d3 */ "./node_modules/d3/index.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _scale__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./scale */ "./src/app/AsynChart/scale.ts");






const _c0 = ["foreground"];
const _c1 = ["background"];
const _c2 = ["highlighted"];
const _c3 = ["svg"];
class AsynchartComponent {
    constructor() {
        this.margin = { top: 0, right: 0, bottom: 0, left: 0 };
        this.widthG = () => {
            return this._originalWidth - this.margin.left - this.margin.right;
        };
        this.heightG = () => {
            return this._originalHeight - this.margin.top - this.margin.bottom;
        };
    }
    get foreground() { return this._foreground; }
    set foreground(value) { this._foreground = value; }
    get background() { return this._background; }
    set background(value) { this._background = value; }
    get highlighted() { return this._highlighted; }
    set highlighted(value) { this._highlighted = value; }
    get svg() { return this._svg; }
    set svg(value) { this._svg = value; }
    ngOnInit() {
        this._originalHeight = this.height;
        this._originalWidth = this.width;
    }
    ngAfterViewInit() {
        this.initscreen();
        this.draw();
    }
    ngOnChanges() {
        if (this.foreground === undefined) {
            return;
        }
        if (this.width === 0 || this.height === 0) {
            return;
        }
    }
    initscreen() {
        d3__WEBPACK_IMPORTED_MODULE_2__["select"](this.foregroundNode.nativeElement).attr('width', this.width).attr('height', this.height);
        d3__WEBPACK_IMPORTED_MODULE_2__["select"](this.backgroundNode.nativeElement).attr('width', this.width).attr('height', this.height);
        d3__WEBPACK_IMPORTED_MODULE_2__["select"](this.highlightedNode.nativeElement).attr('width', this.width).attr('height', this.height);
        d3__WEBPACK_IMPORTED_MODULE_2__["select"](this.svgNode.nativeElement).attr('width', this.width).attr('height', this.height);
        this._foreground = this.foregroundNode.nativeElement.getContext('2d');
        this._background = this.backgroundNode.nativeElement.getContext('2d');
        this._highlighted = this.highlightedNode.nativeElement.getContext('2d');
        this._svg = d3__WEBPACK_IMPORTED_MODULE_2__["select"](this.svgNode.nativeElement);
        this.foreground.globalCompositeOperation = 'destination-over';
    }
    make_axis() {
        const self = this;
        const axisx = d3__WEBPACK_IMPORTED_MODULE_2__["axisBottom"](self.scheme.x.scale);
        const ticksx = (this.scheme.x.scale.ticks || this.scheme.x.scale.domain)().length;
        if (this.scheme.x.axis && this.scheme.x.axis.tickValues) {
            const filterFunc = new Function('datum', 'index', self.scheme.x.axis.tickValues);
            axisx.tickValues(this.scheme.x.scale.domain().filter(filterFunc));
        }
        else if (ticksx > 20) {
            axisx.tickValues(this.scheme.x.scale.domain().filter((d, i) => !(i % Math.round(ticksx / 20))));
        }
        self.svg.select('.xaxis').attr('transform', `translate(${0},${this.heightG() + this.margin.top})`)
            .call(axisx);
        if (this.scheme.y.visible === undefined || this.scheme.y.visible === true) {
            self.svg.select('.yaxis').attr('transform', `translate(${this.margin.left},${0})`)
                .call(d3__WEBPACK_IMPORTED_MODULE_2__["axisRight"](self.scheme.y.scale)).selectAll('.domain, line').style('display', 'none');
        }
    }
    onChangeColor() {
        const self = this;
        switch (self.scheme.color.type) {
            case _scale__WEBPACK_IMPORTED_MODULE_4__["ScaleType"].LINEAR:
                self.scheme.color.scale = d3__WEBPACK_IMPORTED_MODULE_2__["scaleSequential"](d3__WEBPACK_IMPORTED_MODULE_2__["interpolateTurbo"])
                    .domain(d3__WEBPACK_IMPORTED_MODULE_2__["extent"](self.scheme.data.value, d => d[self.scheme.color.key]));
                break;
            case _scale__WEBPACK_IMPORTED_MODULE_4__["ScaleType"].CATEGORY:
                self.scheme.color.scale = d3__WEBPACK_IMPORTED_MODULE_2__["scaleOrdinal"](d3__WEBPACK_IMPORTED_MODULE_2__["schemeCategory10"]);
                // .interpolate(d3.interpolateTurbo)
                // .domain(d3.extent(scheme.data.value,d=>d[scheme.color.key]));
                break;
        }
    }
    onChangeVairableX(variable_prop) {
        const self = this;
        if (variable_prop.key !== "") {
            variable_prop.scale = d3__WEBPACK_IMPORTED_MODULE_2__[`scale${variable_prop.type}`]().range([self.margin.left, self.widthG()]);
            switch (variable_prop.type) {
                case 'Band':
                    const uniqueV = lodash__WEBPACK_IMPORTED_MODULE_3__["uniq"](self.scheme.data.value.map(d => d[variable_prop.key]));
                    variable_prop.scale.domain(uniqueV);
                    break;
                case 'Time':
                    variable_prop.scale.domain(d3__WEBPACK_IMPORTED_MODULE_2__["extent"](self.scheme.data.value, d => d[variable_prop.key]));
            }
        }
    }
    onChangeVairableY(variable_prop) {
        const self = this;
        if (variable_prop.key !== "") {
            variable_prop.scale = d3__WEBPACK_IMPORTED_MODULE_2__[`scale${variable_prop.type}`]().range([self.heightG() + self.margin.top, self.margin.top]);
            switch (variable_prop.type) {
                case 'Band':
                    let uniqueV = lodash__WEBPACK_IMPORTED_MODULE_3__["uniq"](self.scheme.data.value.map(d => d[variable_prop.key]));
                    variable_prop.scale.domain(uniqueV);
                    break;
            }
        }
    }
    draw() {
        const self = this;
        this.onChangeVairableX(this.scheme.x);
        this.onChangeVairableY(this.scheme.y);
        this.onChangeColor();
        this.make_axis();
        let render_item;
        let scheme = self.scheme;
        let foreground = self.foreground;
        let graphicopt = self;
        let timel;
        let render_speed = 500;
        function render_items(selected, ctx) {
            var n = selected.length, i = 0, 
            // opacity = d3.min([2/Math.pow(n,0.3),1]),
            timer = (new Date()).getTime();
            let shuffled_data = selected;
            ctx.clearRect(0, 0, graphicopt.width + 1, graphicopt.height + 1);
            let opacity = scheme.color.opacity;
            if (opacity === undefined)
                opacity = 1;
            // render all lines until finished or a new brush event
            function animloop() {
                if (i >= n) {
                    timel.stop();
                    return true;
                }
                var max = d3__WEBPACK_IMPORTED_MODULE_2__["min"]([i + render_speed, n]);
                render_range(shuffled_data, i, max, opacity);
                i = max;
                timer = optimize(timer); // adjusts render_speed
            }
            ;
            if (timel)
                timel.stop();
            timel = d3__WEBPACK_IMPORTED_MODULE_2__["timer"](animloop);
            // if(isChangeData)
            //     axisPlot.dispatch('plot',selected);
        }
        // render item i to i+render_speed
        function render_range(selection, i, max, opacity) {
            selection.slice(i, max).forEach(function (d) {
                render_item(d, foreground, colorCanvas(d[scheme.color.key], opacity));
            });
        }
        ;
        function colorCanvas(d, a) {
            var c = d3__WEBPACK_IMPORTED_MODULE_2__["hsl"](scheme.color.scale(d));
            c.opacity = a;
            return c;
        }
        const RECT_draw = function (d, ctx, color) {
            ctx.fillRect(scheme.x.scale(d[scheme.x.key]), scheme.y.scale(d[scheme.y.key]), scheme.x.scale.bandwidth(), scheme.y.scale.bandwidth());
            // ctx.fillRect(scheme.x.scale(d[scheme.x.key]),scheme.y.scale(d[scheme.y.key]),1,scheme.y.scale.bandwidth());
            if (color) {
                ctx.fillStyle = color;
                ctx.fill();
            }
        };
        const AREA = function (d, ctx, color) {
            ctx.beginPath();
            scheme.mark.path(d.values);
            if (color) {
                ctx.fillStyle = color;
                ctx.fill();
            }
            ctx.beginPath();
            ctx.moveTo(scheme.x.scale.range()[0], scheme.y.scale(d.values[0][scheme.y.key]) + scheme.y.scale.bandwidth());
            ctx.lineTo(scheme.x.scale.range()[1], scheme.y.scale(d.values[0][scheme.y.key]) + scheme.y.scale.bandwidth());
            ctx.strokeStyle = '#ddd';
            ctx.stroke();
        };
        function optimize(timer) {
            const delta = (new Date()).getTime() - timer;
            render_speed = Math.max(Math.ceil(render_speed * 30 / delta), 100);
            render_speed = Math.min(render_speed, 1000);
            return (new Date()).getTime();
        }
        if (self.scheme.mark.type === _mark__WEBPACK_IMPORTED_MODULE_1__["RECT"]) {
            render_item = RECT_draw;
            render_items(self.scheme.data.value, foreground);
        }
        else if (self.scheme.mark.type === _mark__WEBPACK_IMPORTED_MODULE_1__["AREA"]) {
            if (self.scheme.mark.key) {
                self.scheme.mark.scale = d3__WEBPACK_IMPORTED_MODULE_2__["scaleLinear"]().domain(d3__WEBPACK_IMPORTED_MODULE_2__["extent"](self.scheme.data.value, d => d[self.scheme.mark.value])).range([0, -self.scheme.y.scale.bandwidth() * 2]);
                self.scheme.mark.path = d3__WEBPACK_IMPORTED_MODULE_2__["area"]()
                    .x(function (d) {
                    return self.scheme.x.scale(d[self.scheme.x.key]);
                })
                    .y0(function (d) {
                    return self.scheme.y.scale(d[self.scheme.y.key]) + self.scheme.y.scale.bandwidth() + self.scheme.mark.scale(0);
                })
                    .y1(function (d) {
                    return self.scheme.y.scale(d[self.scheme.y.key]) + self.scheme.y.scale.bandwidth() + self.scheme.mark.scale(d[self.scheme.mark.value]);
                })
                    .curve(d3__WEBPACK_IMPORTED_MODULE_2__["curveMonotoneX"])
                    .context(foreground);
                render_item = AREA;
                let tranformedData = d3__WEBPACK_IMPORTED_MODULE_2__["nest"]().key(d => d[self.scheme[self.scheme.mark.key].key]).entries(self.scheme.data.value);
                tranformedData.sort((a, b) => self.scheme[self.scheme.mark.key].scale(a.key) - self.scheme[self.scheme.mark.key].scale(b.key));
                render_items(tranformedData, foreground);
            }
        }
    }
}
AsynchartComponent.ɵfac = function AsynchartComponent_Factory(t) { return new (t || AsynchartComponent)(); };
AsynchartComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({ type: AsynchartComponent, selectors: [["app-asynchart"]], viewQuery: function AsynchartComponent_Query(rf, ctx) { if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵviewQuery"](_c0, true);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵviewQuery"](_c1, true);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵviewQuery"](_c2, true);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵviewQuery"](_c3, true);
    } if (rf & 2) {
        var _t;
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx.foregroundNode = _t.first);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx.backgroundNode = _t.first);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx.highlightedNode = _t.first);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx.svgNode = _t.first);
    } }, inputs: { width: "width", height: "height", margin: "margin", scheme: "scheme" }, features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵNgOnChangesFeature"]], decls: 12, vars: 0, consts: [[1, "asynchart"], [1, "foreground"], ["foreground", ""], [1, "background"], ["background", ""], [1, "highlighted"], ["highlighted", ""], [1, "chart"], ["svg", ""], [1, "axis"], [1, "xaxis"], [1, "yaxis"]], template: function AsynchartComponent_Template(rf, ctx) { if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](1, "canvas", 1, 2);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](3, "canvas", 3, 4);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](5, "canvas", 5, 6);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnamespaceSVG"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](7, "svg", 7, 8);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](9, "g", 9);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](10, "g", 10);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](11, "g", 11);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    } }, styles: ["canvas[_ngcontent-%COMP%] {\n  position: absolute;\n}\n\ndiv.asynchart[_ngcontent-%COMP%] {\n  width: 800px;\n  height: 600px;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvQXN5bkNoYXJ0L0M6XFxTVE9SRVxcbnZ0bmdhblxccHJvamVjdFxcZ2l0aHViXFxIUENDXFxoZWF0bWFwL3NyY1xcYXBwXFxBc3luQ2hhcnRcXGFzeW5jaGFydC5jb21wb25lbnQuc2NzcyIsInNyYy9hcHAvQXN5bkNoYXJ0L2FzeW5jaGFydC5jb21wb25lbnQuc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLGtCQUFBO0FDQ0Y7O0FEQ0E7RUFDRSxZQUFBO0VBQ0EsYUFBQTtBQ0VGIiwiZmlsZSI6InNyYy9hcHAvQXN5bkNoYXJ0L2FzeW5jaGFydC5jb21wb25lbnQuc2NzcyIsInNvdXJjZXNDb250ZW50IjpbImNhbnZhcyB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZVxufVxuZGl2LmFzeW5jaGFydCB7XG4gIHdpZHRoOiA4MDBweDtcbiAgaGVpZ2h0OiA2MDBweDtcbn1cbiIsImNhbnZhcyB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbn1cblxuZGl2LmFzeW5jaGFydCB7XG4gIHdpZHRoOiA4MDBweDtcbiAgaGVpZ2h0OiA2MDBweDtcbn0iXX0= */"] });
/*@__PURE__*/ (function () { _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](AsynchartComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"],
        args: [{
                selector: 'app-asynchart',
                templateUrl: './asynchart.component.html',
                styleUrls: ['./asynchart.component.scss']
            }]
    }], function () { return []; }, { foregroundNode: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["ViewChild"],
            args: ['foreground']
        }], backgroundNode: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["ViewChild"],
            args: ['background']
        }], highlightedNode: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["ViewChild"],
            args: ['highlighted']
        }], svgNode: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["ViewChild"],
            args: ['svg']
        }], width: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"]
        }], height: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"]
        }], margin: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"]
        }], scheme: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"]
        }] }); })();


/***/ }),

/***/ "./src/app/AsynChart/mark.ts":
/*!***********************************!*\
  !*** ./src/app/AsynChart/mark.ts ***!
  \***********************************/
/*! exports provided: Mark, AREA, BAR, LINE, POINT, RECT, isMark, isPathMark, isRectBasedMark, PRIMITIVE_MARKS, STROKE_CONFIG, FILL_CONFIG, FILL_STROKE_CONFIG */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Mark", function() { return Mark; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AREA", function() { return AREA; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BAR", function() { return BAR; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LINE", function() { return LINE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "POINT", function() { return POINT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RECT", function() { return RECT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isMark", function() { return isMark; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isPathMark", function() { return isPathMark; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isRectBasedMark", function() { return isRectBasedMark; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PRIMITIVE_MARKS", function() { return PRIMITIVE_MARKS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "STROKE_CONFIG", function() { return STROKE_CONFIG; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FILL_CONFIG", function() { return FILL_CONFIG; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FILL_STROKE_CONFIG", function() { return FILL_STROKE_CONFIG; });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);
// Inspried by Vega-Lite

/**
 * All types of primitive marks.
 */
const Mark = {
    arc: 'arc',
    area: 'area',
    bar: 'bar',
    image: 'image',
    line: 'line',
    point: 'point',
    rect: 'rect',
    rule: 'rule',
    text: 'text',
    tick: 'tick',
    trail: 'trail',
    circle: 'circle',
    square: 'square',
};
const AREA = Mark.area;
const BAR = Mark.bar;
const LINE = Mark.line;
const POINT = Mark.point;
const RECT = Mark.rect;
function isMark(m) {
    return m in Mark;
}
function isPathMark(m) {
    return lodash__WEBPACK_IMPORTED_MODULE_0__["includes"](['line', 'area', 'trail'], m);
}
function isRectBasedMark(m) {
    return lodash__WEBPACK_IMPORTED_MODULE_0__["includes"](['rect', 'bar', 'image', 'arc' /* arc is rect/interval in polar coordinate */], m);
}
const PRIMITIVE_MARKS = lodash__WEBPACK_IMPORTED_MODULE_0__["keys"](Mark);
const STROKE_CONFIG = [
    'stroke',
    'strokeWidth',
    'strokeDash',
    'strokeDashOffset',
    'strokeOpacity',
    'strokeJoin',
    'strokeMiterLimit'
];
const FILL_CONFIG = ['fill', 'fillOpacity'];
const FILL_STROKE_CONFIG = [...STROKE_CONFIG, ...FILL_CONFIG];


/***/ }),

/***/ "./src/app/AsynChart/scale.ts":
/*!************************************!*\
  !*** ./src/app/AsynChart/scale.ts ***!
  \************************************/
/*! exports provided: ScaleType, scale */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ScaleType", function() { return ScaleType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "scale", function() { return scale; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "./node_modules/d3/index.js");

const ScaleType = {
    // Continuous - Quantitative
    LINEAR: 'linear',
    LOG: 'log',
    POW: 'pow',
    SQRT: 'sqrt',
    SYMLOG: 'symlog',
    IDENTITY: 'identity',
    SEQUENTIAL: 'sequential',
    // Continuous - Time
    TIME: 'time',
    UTC: 'utc',
    // Discretizing scales
    QUANTILE: 'quantile',
    QUANTIZE: 'quantize',
    THRESHOLD: 'threshold',
    BIN_ORDINAL: 'bin-ordinal',
    // Discrete scales
    CATEGORY: 'category',
    ORDINAL: 'ordinal',
    POINT: 'point',
    BAND: 'band'
};
function scale(s) {
    return d3__WEBPACK_IMPORTED_MODULE_0__[`scale${s.toLocaleUpperCase}`]();
}


/***/ }),

/***/ "./src/app/app-routing.module.ts":
/*!***************************************!*\
  !*** ./src/app/app-routing.module.ts ***!
  \***************************************/
/*! exports provided: AppRoutingModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppRoutingModule", function() { return AppRoutingModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/__ivy_ngcc__/fesm2015/router.js");
/* harmony import */ var _home_home_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./home/home.component */ "./src/app/home/home.component.ts");





const routes = [
    { path: '', component: _home_home_component__WEBPACK_IMPORTED_MODULE_2__["HomeComponent"] },
    { path: '**', redirectTo: '' }
];
class AppRoutingModule {
}
AppRoutingModule.ɵmod = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineNgModule"]({ type: AppRoutingModule });
AppRoutingModule.ɵinj = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineInjector"]({ factory: function AppRoutingModule_Factory(t) { return new (t || AppRoutingModule)(); }, imports: [[_angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"].forRoot(routes)],
        _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"]] });
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵsetNgModuleScope"](AppRoutingModule, { imports: [_angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"]], exports: [_angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"]] }); })();
/*@__PURE__*/ (function () { _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](AppRoutingModule, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"],
        args: [{
                imports: [_angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"].forRoot(routes)],
                exports: [_angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"]]
            }]
    }], null, null); })();


/***/ }),

/***/ "./src/app/app.component.ts":
/*!**********************************!*\
  !*** ./src/app/app.component.ts ***!
  \**********************************/
/*! exports provided: AppComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppComponent", function() { return AppComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/__ivy_ngcc__/fesm2015/router.js");



class AppComponent {
    constructor() {
        this.title = 'heatmap';
    }
}
AppComponent.ɵfac = function AppComponent_Factory(t) { return new (t || AppComponent)(); };
AppComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({ type: AppComponent, selectors: [["app-root"]], decls: 1, vars: 0, template: function AppComponent_Template(rf, ctx) { if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](0, "router-outlet");
    } }, directives: [_angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterOutlet"]], styles: ["\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL2FwcC5jb21wb25lbnQuc2NzcyJ9 */"] });
/*@__PURE__*/ (function () { _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](AppComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"],
        args: [{
                selector: 'app-root',
                templateUrl: './app.component.html',
                styleUrls: ['./app.component.scss']
            }]
    }], null, null); })();


/***/ }),

/***/ "./src/app/app.module.ts":
/*!*******************************!*\
  !*** ./src/app/app.module.ts ***!
  \*******************************/
/*! exports provided: AppModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppModule", function() { return AppModule; });
/* harmony import */ var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/__ivy_ngcc__/fesm2015/platform-browser.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
/* harmony import */ var angular_datatables__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! angular-datatables */ "./node_modules/angular-datatables/__ivy_ngcc__/index.js");
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ "./node_modules/@fortawesome/angular-fontawesome/__ivy_ngcc__/fesm2015/angular-fontawesome.js");
/* harmony import */ var _app_routing_module__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./app-routing.module */ "./src/app/app-routing.module.ts");
/* harmony import */ var _app_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./app.component */ "./src/app/app.component.ts");
/* harmony import */ var _AsynChart_asynchart_component__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./AsynChart/asynchart.component */ "./src/app/AsynChart/asynchart.component.ts");
/* harmony import */ var _home_home_component__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./home/home.component */ "./src/app/home/home.component.ts");
/* harmony import */ var _ng_bootstrap_ng_bootstrap__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @ng-bootstrap/ng-bootstrap */ "./node_modules/@ng-bootstrap/ng-bootstrap/__ivy_ngcc__/fesm2015/ng-bootstrap.js");
/* harmony import */ var _service_list_service_list_component__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./service-list/service-list.component */ "./src/app/service-list/service-list.component.ts");
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/__ivy_ngcc__/fesm2015/forms.js");












class AppModule {
}
AppModule.ɵmod = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineNgModule"]({ type: AppModule, bootstrap: [_app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"]] });
AppModule.ɵinj = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineInjector"]({ factory: function AppModule_Factory(t) { return new (t || AppModule)(); }, providers: [], imports: [[
            _angular_platform_browser__WEBPACK_IMPORTED_MODULE_0__["BrowserModule"],
            _angular_forms__WEBPACK_IMPORTED_MODULE_10__["FormsModule"],
            _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_3__["FontAwesomeModule"],
            angular_datatables__WEBPACK_IMPORTED_MODULE_2__["DataTablesModule"],
            _app_routing_module__WEBPACK_IMPORTED_MODULE_4__["AppRoutingModule"],
            _ng_bootstrap_ng_bootstrap__WEBPACK_IMPORTED_MODULE_8__["NgbModule"]
        ]] });
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵsetNgModuleScope"](AppModule, { declarations: [_app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"],
        _home_home_component__WEBPACK_IMPORTED_MODULE_7__["HomeComponent"],
        _AsynChart_asynchart_component__WEBPACK_IMPORTED_MODULE_6__["AsynchartComponent"],
        _service_list_service_list_component__WEBPACK_IMPORTED_MODULE_9__["ServiceListComponent"]], imports: [_angular_platform_browser__WEBPACK_IMPORTED_MODULE_0__["BrowserModule"],
        _angular_forms__WEBPACK_IMPORTED_MODULE_10__["FormsModule"],
        _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_3__["FontAwesomeModule"],
        angular_datatables__WEBPACK_IMPORTED_MODULE_2__["DataTablesModule"],
        _app_routing_module__WEBPACK_IMPORTED_MODULE_4__["AppRoutingModule"],
        _ng_bootstrap_ng_bootstrap__WEBPACK_IMPORTED_MODULE_8__["NgbModule"]] }); })();
/*@__PURE__*/ (function () { _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵsetClassMetadata"](AppModule, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["NgModule"],
        args: [{
                declarations: [
                    _app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"],
                    _home_home_component__WEBPACK_IMPORTED_MODULE_7__["HomeComponent"],
                    _AsynChart_asynchart_component__WEBPACK_IMPORTED_MODULE_6__["AsynchartComponent"],
                    _service_list_service_list_component__WEBPACK_IMPORTED_MODULE_9__["ServiceListComponent"]
                ],
                imports: [
                    _angular_platform_browser__WEBPACK_IMPORTED_MODULE_0__["BrowserModule"],
                    _angular_forms__WEBPACK_IMPORTED_MODULE_10__["FormsModule"],
                    _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_3__["FontAwesomeModule"],
                    angular_datatables__WEBPACK_IMPORTED_MODULE_2__["DataTablesModule"],
                    _app_routing_module__WEBPACK_IMPORTED_MODULE_4__["AppRoutingModule"],
                    _ng_bootstrap_ng_bootstrap__WEBPACK_IMPORTED_MODULE_8__["NgbModule"]
                ],
                providers: [],
                bootstrap: [_app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"]]
            }]
    }], null, null); })();


/***/ }),

/***/ "./src/app/home/home.component.ts":
/*!****************************************!*\
  !*** ./src/app/home/home.component.ts ***!
  \****************************************/
/*! exports provided: HomeComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HomeComponent", function() { return HomeComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
/* harmony import */ var _service_list_loaddata_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../service-list/loaddata.service */ "./src/app/service-list/loaddata.service.ts");
/* harmony import */ var _service_list_service_list_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../service-list/service-list.component */ "./src/app/service-list/service-list.component.ts");
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/__ivy_ngcc__/fesm2015/common.js");
/* harmony import */ var _AsynChart_asynchart_component__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../AsynChart/asynchart.component */ "./src/app/AsynChart/asynchart.component.ts");






const _c0 = function () { return { top: 0, right: 100, bottom: 0, left: 0 }; };
function HomeComponent_app_asynchart_2_Template(rf, ctx) { if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](0, "app-asynchart", 4);
} if (rf & 2) {
    const datum_r2 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵstyleProp"]("display", true);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("width", 800)("height", 600)("margin", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpureFunction0"](6, _c0))("scheme", datum_r2);
} }
function HomeComponent_div_3_Template(rf, ctx) { if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "div", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](2, "div", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "span", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4, "Loading...");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
} }
class HomeComponent {
    constructor(loadDataFrame) {
        this.loadDataFrame = loadDataFrame;
        this.getHeatmap = (selectedService) => {
            return {
                data: { value: this.dataframe },
                x: { key: 'timestep', type: 'Band' },
                y: { key: 'compute', type: 'Band', visible: false },
                mark: { type: 'rect' },
                color: { key: selectedService, type: 'linear' }
            };
        };
    }
    get data() { return this._data; }
    set data(value) { this._data = value; }
    get serviceFullList() { return this._serviceFullList; }
    set serviceFullList(value) { this._serviceFullList = value; this.onChangeService(); }
    ngOnInit() {
        this.isPagebusy = true;
        this.onResize();
        this.loadDataFrame.dataObj = {
            id: "serviceWed26Sep_removedmetric",
            name: "HPC data - 26 Sep 2018",
            url: "../assets/influxdb0424-0427.json",
            description: "",
            category: 'hpcc',
            date: "26 Apr 2019",
            group: "sample",
            formatType: 'json'
        };
        this.getData();
    }
    getData() {
        this.loadDataFrame.getDataFrame((data) => {
            this.dataframe = data.dataframe;
            this.serviceFullList = data.serviceFullList;
            this.isPagebusy = false;
            return;
        });
    }
    onChangeFunc($event) {
        this.serviceFullList = $event;
    }
    onChangeService() {
        let temp_dataframe = [];
        const self = this;
        self.serviceFullList.forEach((s, si) => {
            if (s.enable)
                temp_dataframe.push(self.getHeatmap(s.text));
        });
        self.data = temp_dataframe;
    }
    trackByFn(index, item) {
        return (item.color.key);
    }
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
    }
}
HomeComponent.ɵfac = function HomeComponent_Factory(t) { return new (t || HomeComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_service_list_loaddata_service__WEBPACK_IMPORTED_MODULE_1__["Loaddata"])); };
HomeComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({ type: HomeComponent, selectors: [["app-home"]], hostBindings: function HomeComponent_HostBindings(rf, ctx) { if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("keyup", function HomeComponent_keyup_HostBindingHandler($event) { return ctx.ngOnInit($event); }, false, _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresolveDocument"])("keydown", function HomeComponent_keydown_HostBindingHandler($event) { return ctx.ngOnInit($event); }, false, _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresolveDocument"]);
    } }, features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵProvidersFeature"]([])], decls: 4, vars: 4, consts: [["id", "wrapper", 1, "container-fluid", 3, "resize"], [1, "float-right", "col-2", 3, "serviceFullList", "onChangeService"], [3, "width", "height", "margin", "display", "scheme", 4, "ngFor", "ngForOf", "ngForTrackBy"], ["class", "d-flex justify-content-center cover text-center", 4, "ngIf"], [3, "width", "height", "margin", "scheme"], [1, "d-flex", "justify-content-center", "cover", "text-center"], [1, "spinnerC"], ["role", "status", 1, "spinner-border", 2, "width", "3rem", "height", "3rem"], [1, "sr-only"]], template: function HomeComponent_Template(rf, ctx) { if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("resize", function HomeComponent_Template_div_resize_0_listener() { return ctx.onResize(); }, false, _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresolveWindow"]);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "app-service-list", 1);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("onChangeService", function HomeComponent_Template_app_service_list_onChangeService_1_listener($event) { return ctx.onChangeFunc($event); });
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](2, HomeComponent_app_asynchart_2_Template, 1, 7, "app-asynchart", 2);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](3, HomeComponent_div_3_Template, 5, 0, "div", 3);
    } if (rf & 2) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("serviceFullList", ctx.serviceFullList);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngForOf", ctx.data)("ngForTrackBy", ctx.trackByFn);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.isPagebusy);
    } }, directives: [_service_list_service_list_component__WEBPACK_IMPORTED_MODULE_2__["ServiceListComponent"], _angular_common__WEBPACK_IMPORTED_MODULE_3__["NgForOf"], _angular_common__WEBPACK_IMPORTED_MODULE_3__["NgIf"], _AsynChart_asynchart_component__WEBPACK_IMPORTED_MODULE_4__["AsynchartComponent"]], styles: [".cover[_ngcontent-%COMP%] {\r\n  position: fixed;\r\n  margin: 0;\r\n  width:100%;\r\n  height:100%;\r\n  background:  #f3f3f3;    \r\n  background: linear-gradient(to right, #f3f3f3c4, #ececec); \r\n  z-index: 10;\r\n}\r\n\r\n.cover[_ngcontent-%COMP%]   .spinnerC[_ngcontent-%COMP%]{\r\n  position: fixed;\r\n  margin: 0;\r\n\r\n  top: 50%;\r\n  left: 50%;\r\n  transform: translate(-50%, -50%);\r\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvaG9tZS9ob21lLmNvbXBvbmVudC5jc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxlQUFlO0VBQ2YsU0FBUztFQUNULFVBQVU7RUFDVixXQUFXO0VBQ1gsb0JBQW9CLEdBQUcsOEJBQThCLEdBQ2UsK0JBQStCO0VBQ25HLHlEQUF5RCxFQUFFLDZEQUE2RDtFQUN4SCxXQUFXO0FBQ2I7O0FBRUE7RUFDRSxlQUFlO0VBQ2YsU0FBUztBQUNYLHdCQUF3QjtFQUN0QixRQUFRO0VBQ1IsU0FBUztFQUNULGdDQUFnQztBQUNsQyIsImZpbGUiOiJzcmMvYXBwL2hvbWUvaG9tZS5jb21wb25lbnQuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiLmNvdmVyIHtcclxuICBwb3NpdGlvbjogZml4ZWQ7XHJcbiAgbWFyZ2luOiAwO1xyXG4gIHdpZHRoOjEwMCU7XHJcbiAgaGVpZ2h0OjEwMCU7XHJcbiAgYmFja2dyb3VuZDogICNmM2YzZjM7ICAvKiBmYWxsYmFjayBmb3Igb2xkIGJyb3dzZXJzICovXHJcbiAgYmFja2dyb3VuZDogLXdlYmtpdC1saW5lYXItZ3JhZGllbnQodG8gcmlnaHQsICNmM2YzZjNjNCwgI2VjZWNlYyk7ICAvKiBDaHJvbWUgMTAtMjUsIFNhZmFyaSA1LjEtNiAqL1xyXG4gIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCh0byByaWdodCwgI2YzZjNmM2M0LCAjZWNlY2VjKTsgLyogVzNDLCBJRSAxMCsvIEVkZ2UsIEZpcmVmb3ggMTYrLCBDaHJvbWUgMjYrLCBPcGVyYSAxMissIFNhKi9cclxuICB6LWluZGV4OiAxMDtcclxufVxyXG5cclxuLmNvdmVyIC5zcGlubmVyQ3tcclxuICBwb3NpdGlvbjogZml4ZWQ7XHJcbiAgbWFyZ2luOiAwO1xyXG4vKiBwb3NpdGlvbjogYWJzb2x1dGU7ICovXHJcbiAgdG9wOiA1MCU7XHJcbiAgbGVmdDogNTAlO1xyXG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpO1xyXG59XHJcbiJdfQ== */"] });
/*@__PURE__*/ (function () { _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](HomeComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"],
        args: [{
                selector: 'app-home',
                templateUrl: './home.component.html',
                providers: [],
                styleUrls: ['./home.component.css']
            }]
    }], function () { return [{ type: _service_list_loaddata_service__WEBPACK_IMPORTED_MODULE_1__["Loaddata"] }]; }, { ngOnInit: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["HostListener"],
            args: ['document:keyup', ['$event']]
        }, {
            type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["HostListener"],
            args: ['document:keydown', ['$event']]
        }] }); })();


/***/ }),

/***/ "./src/app/service-list/loaddata.service.ts":
/*!**************************************************!*\
  !*** ./src/app/service-list/loaddata.service.ts ***!
  \**************************************************/
/*! exports provided: Loaddata */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Loaddata", function() { return Loaddata; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! d3 */ "./node_modules/d3/index.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_2__);




class Loaddata {
    constructor() {
    }
    get dataObj() {
        return this.DATAOBJ;
    }
    set dataObj(value) {
        this.DATAOBJ = value;
    }
    // reset = (hard) => {
    //   this.dataObj = Dataset.currentDataset;
    // }
    getDataFrame(callback) {
        this.loadData(callback);
    }
    loadData(calback) {
        const self = this;
        const choice = self.dataObj;
        if (choice.category === 'hpcc') {
            d3__WEBPACK_IMPORTED_MODULE_1__["json"](choice.url).then((data) => {
                if (!choice.values) {
                    loadata1(data);
                }
                else {
                    loadata1(choice.values);
                }
            });
        }
        // else {
        //   readFilecsv(choice.url, choice.separate, choice);
        // }
        function loadata1(data) {
            data.timespan = data.timespan.map(d => new Date(d3__WEBPACK_IMPORTED_MODULE_1__["timeFormat"]('%a %b %d %X CDT %Y')(new Date(+d ? +d : d.replace('Z', '')))));
            self.sampleS = data;
            if (choice.category === 'hpcc') {
                systemFormat();
                self.hosts = lodash__WEBPACK_IMPORTED_MODULE_2__["without"](d3__WEBPACK_IMPORTED_MODULE_1__["keys"](data), 'timespan');
                // formatService(true);
            }
            lodash__WEBPACK_IMPORTED_MODULE_2__["without"](Object.keys(data), 'timespan').forEach(h => {
                delete data[h].arrCPU_load;
                self.serviceLists.forEach((s, si) => {
                    if (data[h][self.serviceListattr[si]]) {
                        data[h][self.serviceListattr[si]] = data.timespan.map((d, i) => {
                            if (data[h][self.serviceListattr[si]][i]) {
                                return data[h][self.serviceListattr[si]][i].slice(0, s.sub.length).map(e => e ? e : null);
                            }
                            else {
                                return d3__WEBPACK_IMPORTED_MODULE_1__["range"](0, s.sub.length).map(e => null);
                            }
                        });
                    }
                    else {
                        data[h][self.serviceListattr[si]] = data.timespan.map(d => d3__WEBPACK_IMPORTED_MODULE_1__["range"](0, s.sub.length).map(e => null));
                    }
                });
            });
            self.dataframe = [];
            self.hosts.forEach((hname, hi) => {
                const hostdata = self.sampleS[hname];
                self.sampleS.timespan.forEach((t, ti) => {
                    const values = { timestep: self.sampleS.timespan[ti], compute: hname };
                    self.serviceLists.forEach((s, si) => {
                        s.sub.forEach((sub, subi) => {
                            values[sub.text] = hostdata[self.serviceListattr[si]][ti][subi];
                        });
                    });
                    self.dataframe.push(values);
                });
            });
            // if (choice.group==='url'||choice.url.includes('influxdb')){
            //   processResult = processResult_influxdb;
            //   db = 'influxdb';
            //   realTimesetting(false, 'influxdb',true,sampleS);
            // }else {
            //   db = 'nagios';
            //   processResult = processResult_old;
            //   realTimesetting(false,undefined,true,sampleS);
            // }
            //
            // let clusternum = (data['timespan'].length<50)?[5,7]:[6,8];
            // loadPresetCluster(choice.url.replace(/(\w+).json|(\w+).csv/, '$1'),(status)=>{loadclusterInfo= status;
            //   if(loadclusterInfo){
            //     handle_dataRaw();
            //     initDataWorker();
            //     if (!init)
            //       resetRequest();
            //     else
            //       main();
            //     preloader(false)
            //   }else {
            //     recalculateCluster({
            //       clusterMethod: 'leaderbin',
            //       normMethod: 'l2',
            //       bin: {startBinGridSize: 4, range: clusternum}
            //     }, function () {
            //       handle_dataRaw();
            //       initDataWorker();
            //       main();
            //     });
            //   }
            // });
            function systemFormat() {
                self.serviceList = ['Temperature', 'Job_load', 'Memory_usage', 'Fans_speed', 'Power_consum', 'Job_scheduling'];
                self.serviceListSelected = [{ text: 'Temperature', index: 0 }, { text: 'Job_load', index: 1 }, {
                        text: 'Memory_usage',
                        index: 2
                    }, { text: 'Fans_speed', index: 3 }, { text: 'Power_consum', index: 4 }];
                self.serviceListattr = ['arrTemperature', 'arrCPU_load', 'arrMemory_usage',
                    'arrFans_health', 'arrPower_usage', 'arrJob_scheduling'];
                self.serviceLists = [{
                        text: 'Temperature',
                        id: 0,
                        enable: false,
                        sub: [{
                                text: 'CPU1 Temp',
                                id: 0,
                                enable: false,
                                idroot: 0,
                                angle: 5.834386356666759,
                                range: [3, 98]
                            }, { text: 'CPU2 Temp', id: 1, enable: false, idroot: 0, angle: 0, range: [3, 98] }, {
                                text: 'Inlet Temp',
                                id: 2,
                                enable: false,
                                idroot: 0,
                                angle: 0.4487989505128276,
                                range: [3, 98]
                            }]
                    }, {
                        text: 'Job_load',
                        id: 1,
                        enable: false,
                        sub: [{ text: 'Job load', id: 0, enable: false, idroot: 1, angle: 1.2566370614359172, range: [0, 10] }]
                    }, {
                        text: 'Memory_usage',
                        id: 2,
                        enable: false,
                        sub: [{ text: 'Memory usage', id: 0, enable: false, idroot: 2, angle: 1.8849555921538759, range: [0, 99] }]
                    }, {
                        text: 'Fans_speed',
                        id: 3,
                        enable: false,
                        sub: [{
                                text: 'Fan1 speed',
                                id: 0,
                                enable: false,
                                idroot: 3,
                                angle: 2.4751942119192307,
                                range: [1050, 17850]
                            }, {
                                text: 'Fan2 speed',
                                id: 1,
                                enable: false,
                                idroot: 3,
                                angle: 2.9239931624320583,
                                range: [1050, 17850]
                            }, {
                                text: 'Fan3 speed',
                                id: 2,
                                enable: false,
                                idroot: 3,
                                angle: 3.372792112944886,
                                range: [1050, 17850]
                            }, { text: 'Fan4 speed', id: 3, enable: false, idroot: 3, angle: 3.8215910634577135, range: [1050, 17850] }]
                    }, {
                        text: 'Power_consum',
                        id: 4,
                        enable: false,
                        sub: [{ text: 'Power consumption', id: 0, enable: false, idroot: 4, angle: 4.71238898038469, range: [0, 200] }]
                    }];
                self.serviceFullList = serviceLists2serviceFullList(self.serviceLists);
                self.serviceListattrnest = [
                    { key: 'arrTemperature', sub: ['CPU1 Temp', 'CPU2 Temp', 'Inlet Temp'] },
                    { key: 'arrCPU_load', sub: ['Job load'] },
                    { key: 'arrMemory_usage', sub: ['Memory usage'] },
                    { key: 'arrFans_health', sub: ['Fan1 speed', 'Fan2 speed', 'Fan3 speed', 'Fan4 speed'] },
                    { key: 'arrPower_usage', sub: ['Power consumption'] }
                ];
                self.serviceAttr = {
                    arrTemperature: { key: 'Temperature', val: ['arrTemperatureCPU1', 'arrTemperatureCPU2'] },
                    arrCPU_load: { key: 'CPU_load', val: ['arrCPU_load'] },
                    arrMemory_usage: { key: 'Memory_usage', val: ['arrMemory_usage'] },
                    arrFans_health: { key: 'Fans_speed', val: ['arrFans_speed1', 'arrFans_speed2'] },
                    arrPower_usage: { key: 'Power_consumption', val: ['arrPower_usage'] }
                };
            }
            function serviceLists2serviceFullList(serviceLists) {
                const temp = [];
                serviceLists.forEach(s => s.sub.forEach(sub => {
                    sub.idroot = s.id;
                    sub.enable = s.enable && (sub.enable === undefined ? true : sub.enable);
                    temp.push(sub);
                }));
                return temp;
            }
            calback({ dataframe: self.dataframe, serviceFullList: self.serviceFullList });
        }
    }
}
Loaddata.ɵfac = function Loaddata_Factory(t) { return new (t || Loaddata)(); };
Loaddata.ɵprov = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineInjectable"]({ token: Loaddata, factory: Loaddata.ɵfac, providedIn: 'root' });
/*@__PURE__*/ (function () { _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](Loaddata, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Injectable"],
        args: [{
                providedIn: 'root',
            }]
    }], function () { return []; }, null); })();


/***/ }),

/***/ "./src/app/service-list/service-list.component.ts":
/*!********************************************************!*\
  !*** ./src/app/service-list/service-list.component.ts ***!
  \********************************************************/
/*! exports provided: ServiceListComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ServiceListComponent", function() { return ServiceListComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
/* harmony import */ var _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @fortawesome/free-solid-svg-icons */ "./node_modules/@fortawesome/free-solid-svg-icons/index.es.js");
/* harmony import */ var angular_datatables__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! angular-datatables */ "./node_modules/angular-datatables/__ivy_ngcc__/index.js");
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/__ivy_ngcc__/fesm2015/common.js");
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ "./node_modules/@fortawesome/angular-fontawesome/__ivy_ngcc__/fesm2015/angular-fontawesome.js");






const _c0 = function (a0) { return { "fieldDisable": a0 }; };
function ServiceListComponent_tr_7_Template(rf, ctx) { if (rf & 1) {
    const _r3 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "tr", 2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "td");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "td", 3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](4, "span", 4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function ServiceListComponent_tr_7_Template_span_click_4_listener() { _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r3); const s_r1 = ctx.$implicit; const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](); return ctx_r2.onClickDisable(s_r1); });
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "a", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](6, "fa-icon", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
} if (rf & 2) {
    const s_r1 = ctx.$implicit;
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngClass", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpureFunction1"](3, _c0, !s_r1.enable));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](s_r1.text);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("icon", ctx_r0.faCheck);
} }
class ServiceListComponent {
    constructor() {
        this.onChangeService = new _angular_core__WEBPACK_IMPORTED_MODULE_0__["EventEmitter"]();
        this.dtOptions = {};
        this.faCheck = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__["faCheck"];
    }
    onClickDisable(event) {
        event.enable = !event.enable;
        this.onChangeService.emit(this.serviceFullList);
    }
    ngOnInit() {
        this.dtOptions = {
            pagingType: 'full_numbers',
            pageLength: 50
        };
    }
    ngOnDestroy() {
        // Do not forget to unsubscribe the event
    }
}
ServiceListComponent.ɵfac = function ServiceListComponent_Factory(t) { return new (t || ServiceListComponent)(); };
ServiceListComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({ type: ServiceListComponent, selectors: [["app-service-list"]], inputs: { serviceFullList: "serviceFullList" }, outputs: { onChangeService: "onChangeService" }, decls: 8, vars: 2, consts: [["datatable", "", 1, "row-border", "hover", 3, "dtOptions"], [3, "ngClass", 4, "ngFor", "ngForOf"], [3, "ngClass"], [1, "btngroup"], [1, "no-shrink", "toggleDisable", 3, "click"], [1, "disable-field"], [3, "icon"]], template: function ServiceListComponent_Template(rf, ctx) { if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "table", 0);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "thead");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](2, "tr");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "th");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4, "Service name");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](5, "th");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](6, "tbody");
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](7, ServiceListComponent_tr_7_Template, 7, 5, "tr", 1);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    } if (rf & 2) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("dtOptions", ctx.dtOptions);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](7);
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngForOf", ctx.serviceFullList);
    } }, directives: [angular_datatables__WEBPACK_IMPORTED_MODULE_2__["DataTableDirective"], _angular_common__WEBPACK_IMPORTED_MODULE_3__["NgForOf"], _angular_common__WEBPACK_IMPORTED_MODULE_3__["NgClass"], _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_4__["FaIconComponent"]], styles: [".fieldDisable[_ngcontent-%COMP%] {\n  color: #cccccc;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvc2VydmljZS1saXN0L0M6XFxTVE9SRVxcbnZ0bmdhblxccHJvamVjdFxcZ2l0aHViXFxIUENDXFxoZWF0bWFwL3NyY1xcYXBwXFxzZXJ2aWNlLWxpc3RcXHNlcnZpY2UtbGlzdC5jb21wb25lbnQuc2NzcyIsInNyYy9hcHAvc2VydmljZS1saXN0L3NlcnZpY2UtbGlzdC5jb21wb25lbnQuc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLGNBQUE7QUNDRiIsImZpbGUiOiJzcmMvYXBwL3NlcnZpY2UtbGlzdC9zZXJ2aWNlLWxpc3QuY29tcG9uZW50LnNjc3MiLCJzb3VyY2VzQ29udGVudCI6WyIuZmllbGREaXNhYmxlIHtcclxuICBjb2xvcjogI2NjY2NjYztcclxufVxyXG4iLCIuZmllbGREaXNhYmxlIHtcbiAgY29sb3I6ICNjY2NjY2M7XG59Il19 */"] });
/*@__PURE__*/ (function () { _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](ServiceListComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"],
        args: [{
                selector: 'app-service-list',
                templateUrl: './service-list.component.html',
                styleUrls: ['./service-list.component.scss']
            }]
    }], function () { return []; }, { serviceFullList: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"]
        }], onChangeService: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Output"]
        }] }); })();


/***/ }),

/***/ "./src/environments/environment.ts":
/*!*****************************************!*\
  !*** ./src/environments/environment.ts ***!
  \*****************************************/
/*! exports provided: environment */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "environment", function() { return environment; });
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
const environment = {
    production: false
};
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.


/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
/* harmony import */ var _environments_environment__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./environments/environment */ "./src/environments/environment.ts");
/* harmony import */ var _app_app_module__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./app/app.module */ "./src/app/app.module.ts");
/* harmony import */ var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/__ivy_ngcc__/fesm2015/platform-browser.js");




if (_environments_environment__WEBPACK_IMPORTED_MODULE_1__["environment"].production) {
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["enableProdMode"])();
}
_angular_platform_browser__WEBPACK_IMPORTED_MODULE_3__["platformBrowser"]().bootstrapModule(_app_app_module__WEBPACK_IMPORTED_MODULE_2__["AppModule"])
    .catch(err => console.error(err));


/***/ }),

/***/ 0:
/*!***************************!*\
  !*** multi ./src/main.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! C:\STORE\nvtngan\project\github\HPCC\heatmap\src\main.ts */"./src/main.ts");


/***/ })

},[[0,"runtime","vendor"]]]);
//# sourceMappingURL=main-es2015.js.map