/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
	                                                                                                                                                                                                                                                                               * A shader to render HTML DOM Element
	                                                                                                                                                                                                                                                                               * Inspired by @scenevr's `htmltexture-component`
	                                                                                                                                                                                                                                                                               * @see https://github.com/scenevr/htmltexture-component
	                                                                                                                                                                                                                                                                               */

	var _jquery = __webpack_require__(1);

	var _jquery2 = _interopRequireDefault(_jquery);

	var _index = __webpack_require__(4);

	var _index2 = _interopRequireDefault(_index);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	// import html2canvas from './lib/html2canvas/core'

	if (typeof AFRAME === 'undefined') {
	  throw 'Component attempted to register before AFRAME was available.';
	}

	/* get util from AFRAME */
	var debug = AFRAME.utils.debug;
	// debug.enable('shader:html:*')

	debug.enable('shader:html:warn');
	var warn = debug('shader:html:warn');
	var log = debug('shader:html:debug');

	/* create error message */
	function createError(err, target) {
	  return { status: 'error', target: target, message: err, timestamp: Date.now() };
	}

	AFRAME.registerShader('html', {

	  /**
	   * For material component:
	   * @see https://github.com/aframevr/aframe/blob/60d198ef8e2bfbc57a13511ae5fca7b62e01691b/src/components/material.js
	   * For example of `registerShader`:
	   * @see https://github.com/aframevr/aframe/blob/41a50cd5ac65e462120ecc2e5091f5daefe3bd1e/src/shaders/flat.js
	   * For MeshBasicMaterial
	   * @see http://threejs.org/docs/#Reference/Materials/MeshBasicMaterial
	   */

	  schema: {

	    /* For material */
	    color: { type: 'color' },
	    fog: { default: true },

	    /* For texuture */
	    target: { default: null },
	    debug: { default: null },
	    fps: { type: 'number', default: 0 },
	    width: { default: null },
	    height: { default: null },
	    ratio: { default: null }

	  },

	  /**
	   * Initialize material. Called once.
	   * @protected
	   */
	  init: function init(data) {
	    log('init', data);
	    this.__cnv = document.createElement('canvas');
	    this.__cnv.width = 2;
	    this.__cnv.height = 2;
	    this.__ctx = this.__cnv.getContext('2d');
	    this.__texture = new THREE.Texture(this.__cnv);
	    this.__reset();
	    this.material = new THREE.MeshBasicMaterial({ map: this.__texture });
	    this.el.sceneEl.addBehavior(this);
	    return this.material;
	  },


	  /**
	   * Update or create material.
	   * @param {object|null} oldData
	   */
	  update: function update(oldData) {
	    log('update', oldData);
	    this.__updateMaterial(oldData);
	    this.__updateTexture(oldData);
	    return this.material;
	  },


	  /**
	   * Called on each scene tick.
	   * @protected
	   */
	  tick: function tick(t) {

	    if (this.__paused || !this.__target || !this.__nextTime) {
	      return;
	    }

	    var now = Date.now();
	    if (now > this.__nextTime) {
	      this.__render();
	    }
	  },


	  /*================================
	  =            material            =
	  ================================*/

	  /**
	   * Updating existing material.
	   * @param {object} data - Material component data.
	   */
	  __updateMaterial: function __updateMaterial(data) {
	    var material = this.material;

	    var newData = this.__getMaterialData(data);
	    Object.keys(newData).forEach(function (key) {
	      material[key] = newData[key];
	    });
	  },


	  /**
	   * Builds and normalize material data, normalizing stuff along the way.
	   * @param {Object} data - Material data.
	   * @return {Object} data - Processed material data.
	   */
	  __getMaterialData: function __getMaterialData(data) {
	    return {
	      fog: data.fog,
	      color: new THREE.Color(data.color)
	    };
	  },


	  /*==============================
	  =            texure            =
	  ==============================*/

	  /**
	   * set texure
	   * @private
	   * @param {Object} data
	   * @property {string} status - success / error
	   * @property {string} target - target url
	   * @property {DOM Element} targetEl - target
	   * @property {Date} timestamp - created at the texure
	   */

	  __setTexure: function __setTexure(data) {
	    log('__setTexure', data);
	    if (data.status === 'error') {
	      warn('Error: ' + data.message + '\ntarget: ' + data.target);
	      this.__reset();
	    } else if (data.status === 'success' && data.target !== this.__textureSrc) {
	      /* Texture added or changed */
	      this.__ready(data);
	    }
	  },


	  /**
	   * Update or create texure.
	   * @param {Object} data - Material component data.
	   */
	  __updateTexture: function __updateTexture(data) {
	    var _this = this;

	    var target = data.target,
	        fps = data.fps,
	        width = data.width,
	        height = data.height,
	        ratio = data.ratio;

	    this.__width = width || this.schema.width.default;
	    this.__height = height || this.schema.height.default;

	    /* debug */
	    var resetDebug = function resetDebug() {
	      if (_this.__debugEl) {
	        _this.__debugEl.innerHTML = '';
	        _this.__debugEl = _this.schema.debug.default;
	      }
	    };
	    if (data.debug) {
	      var el = this.__validateAndGetQuerySelector(data.debug);
	      if (el && !el.error) {
	        this.__debugEl = el;
	      } else resetDebug();
	    } else resetDebug();

	    /* ratio */
	    if (ratio && ratio === 'width' || ratio === 'height') {
	      this.__ratio = ratio;
	    } else {
	      this.__ratio = this.schema.ratio.default;
	    }

	    /* fps */
	    if (fps) {
	      if (this.__fps > 0) {
	        this.__fps = fps;
	      } else if (fps === -1) {
	        /* render only once */
	        this.__fps = this.schema.fps.default;
	        if (this.__target) {
	          this.__render();
	        }
	        /* set attribute */
	        var material = Object.assign({}, this.el.getAttribute('material'));
	        delete material.fps;
	        this.el.setAttribute('material', material);
	      } else {
	        this.__fps = fps;
	        if (this.__target) {
	          this.play();
	          this.__render();
	        }
	      }
	    } else {
	      if (this.__fps > 0) {
	        this.pause();
	      } else {
	        this.__fps = this.schema.fps.default;
	      }
	    }

	    /* target */
	    if (target) {
	      if (target === this.__target) {
	        return;
	      }
	      this.__target = target;
	      // return
	      this.__validateSrc(target, this.__setTexure.bind(this));
	    } else {
	      /* Texture removed */
	      this.__reset();
	    }
	  },


	  /*=============================================
	  =            varidation for texure            =
	  =============================================*/

	  /**
	   * varidate src
	   * @private
	   * @param {string} target - dom selector
	   * @param {Function} cb - callback
	   */
	  __validateSrc: function __validateSrc(target, cb) {

	    var message = void 0;

	    /* check if target is a query selector */
	    var el = this.__validateAndGetQuerySelector(target);
	    if (!el || (typeof el === 'undefined' ? 'undefined' : _typeof(el)) !== 'object') {
	      return;
	    }
	    if (el.error) {
	      message = el.error;
	    } else {
	      var tagName = el.tagName.toLowerCase();
	      if (tagName === 'img' || tagName === 'video') {
	        message = 'For <' + tagName + '> element, please use `shader:flat`';
	      } else {
	        cb({ status: 'success', target: target, targetEl: el, timestamp: Date.now() });
	      }
	    }

	    /* if there is message, create error data */
	    if (message) {
	      var err = createError(message, target);
	      cb(err);
	    }
	  },


	  /**
	   * Query and validate a query selector,
	   *
	   * @param  {string} selector - DOM selector.
	   * @return {object} Selected DOM element | error message object.
	   */
	  __validateAndGetQuerySelector: function __validateAndGetQuerySelector(selector) {
	    try {
	      var el = document.querySelector(selector);
	      if (!el) {
	        return { error: 'No element was found matching the selector' };
	      }
	      return el;
	    } catch (e) {
	      // Capture exception if it's not a valid selector.
	      return { error: 'no valid selector' };
	    }
	  },


	  /*================================
	  =            playback            =
	  ================================*/

	  /**
	   * Pause video
	   * @public
	   */
	  pause: function pause() {
	    log('pause');
	    this.__paused = true;
	    this.__nextTime = null;
	  },


	  /**
	   * Play video
	   * @public
	   */
	  play: function play() {
	    log('play');
	    this.__paused = false;
	  },


	  /**
	   * Toggle playback. play if paused and pause if played.
	   * @public
	   */

	  togglePlayback: function togglePlayback() {
	    if (this.paused()) {
	      this.play();
	    } else {
	      this.pause();
	    }
	  },


	  /**
	   * Return if the playback is paused.
	   * @public
	   * @return {boolean}
	   */
	  paused: function paused() {
	    return this.__paused;
	  },


	  /*==============================
	   =            canvas            =
	   ==============================*/

	  /**
	   * clear canvas
	   * @private
	   */
	  __clearCanvas: function __clearCanvas() {
	    if (!this.__ctx || !this.__texture) {
	      return;
	    }
	    this.__ctx.clearRect(0, 0, this.__width, this.__height);
	    this.__texture.needsUpdate = true;
	  },


	  /**
	   * draw
	   * @private
	   */
	  __draw: function __draw(canvas) {
	    console.log(this);
	    log('__draw');
	    if (!this.__ctx || !this.__texture) {
	      return;
	    }
	    var ratio = canvas.width / canvas.height;
	    // const cnvW = this.__cnv.width = THREE.Math.nearestPowerOfTwo(canvas.width)
	    // const cnvH = this.__cnv.height = THREE.Math.nearestPowerOfTwo(canvas.height)
	    var cnvW = this.__cnv.width = THREE.Math.floorPowerOfTwo(canvas.width);
	    var cnvH = this.__cnv.height = THREE.Math.floorPowerOfTwo(canvas.height);
	    this.__ctx.drawImage(canvas, 0, 0, cnvW, cnvH);
	    this.__texture.needsUpdate = true;
	    if (this.__ratio) {
	      /* change size */
	      var _el$getObject3D$geome = this.el.getObject3D('mesh').geometry.metadata.parameters,
	          width = _el$getObject3D$geome.width,
	          height = _el$getObject3D$geome.height;

	      this.el.setAttribute('geometry', Object.assign({}, this.el.getAttribute('geometry'), {
	        width: this.__ratio === 'width' ? width : height * ratio,
	        height: this.__ratio === 'width' ? width / ratio : height
	      }));
	    }

	    /* append if debug element exists */
	    if (this.__debugEl) {
	      this.__debugEl.innerHTML = '';
	      this.__debugEl.appendChild(canvas);
	    }

	    /* setup next tick */
	    this.__setNextTick();
	  },


	  /**
	   * render
	   * @private
	   */
	  __render: function __render() {
	    this.__nextTime = null;
	    if (!this.__targetEl) {
	      return;
	    }

	    var _targetEl$getBoundin = this.__targetEl.getBoundingClientRect(),
	        width = _targetEl$getBoundin.width,
	        height = _targetEl$getBoundin.height;

	    function rr(a) {
	      setTimeout(function () {
	        (0, _index2.default)((0, _jquery2.default)(a.__target)[0], {
	          backgroundColor: null,
	          width: a.__width || width,
	          height: a.__height || height
	          // onrendered: this.__draw.bind(this)
	        }).then(function (canvas) {
	          a.__draw.bind(a)(canvas);
	        });
	      }, 1000);
	    }
	    return rr(this);
	    //     .then(function(canvas){
	    //       console.log('I am here!');
	    //       console.log(canvas);
	    //
	    //       return this.__draw.bind(this)(canvas);})
	  },


	  /**
	   * get next time to draw
	   * @private
	   */
	  __setNextTick: function __setNextTick() {
	    if (this.__fps > 0) {
	      this.__nextTime = Date.now() + 1000 / this.__fps;
	    }
	  },


	  /*============================
	  =            ready           =
	  ============================*/

	  /**
	   * setup html animation and play if autoplay is true
	   * @private
	   * @property {string} target - target url
	   * @property {DOM Element} targetEl - target
	   */
	  __ready: function __ready(_ref) {
	    var target = _ref.target,
	        targetEl = _ref.targetEl;

	    log('__ready');
	    this.__target = target;
	    this.__targetEl = targetEl;
	    this.play();
	    this.__render();
	  },


	  /*=============================
	  =            reset            =
	  =============================*/

	  /**
	   * @private
	   */

	  __reset: function __reset() {
	    this.pause();
	    this.__clearCanvas();
	    this.__target = null;
	    this.__targetEl = null;
	    this.__debugEl = null;
	  }
	});

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module) {"use strict";

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	/*! jQuery v3.4.1 | (c) JS Foundation and other contributors | jquery.org/license */
	!function (e, t) {
	  "use strict";
	  "object" == ( false ? "undefined" : _typeof(module)) && "object" == _typeof(module.exports) ? module.exports = e.document ? t(e, !0) : function (e) {
	    if (!e.document) throw new Error("jQuery requires a window with a document");return t(e);
	  } : t(e);
	}("undefined" != typeof window ? window : undefined, function (C, e) {
	  "use strict";
	  var t = [],
	      E = C.document,
	      r = Object.getPrototypeOf,
	      s = t.slice,
	      g = t.concat,
	      u = t.push,
	      i = t.indexOf,
	      n = {},
	      o = n.toString,
	      v = n.hasOwnProperty,
	      a = v.toString,
	      l = a.call(Object),
	      y = {},
	      m = function m(e) {
	    return "function" == typeof e && "number" != typeof e.nodeType;
	  },
	      x = function x(e) {
	    return null != e && e === e.window;
	  },
	      c = { type: !0, src: !0, nonce: !0, noModule: !0 };function b(e, t, n) {
	    var r,
	        i,
	        o = (n = n || E).createElement("script");if (o.text = e, t) for (r in c) {
	      (i = t[r] || t.getAttribute && t.getAttribute(r)) && o.setAttribute(r, i);
	    }n.head.appendChild(o).parentNode.removeChild(o);
	  }function w(e) {
	    return null == e ? e + "" : "object" == (typeof e === "undefined" ? "undefined" : _typeof(e)) || "function" == typeof e ? n[o.call(e)] || "object" : typeof e === "undefined" ? "undefined" : _typeof(e);
	  }var f = "3.4.1",
	      k = function k(e, t) {
	    return new k.fn.init(e, t);
	  },
	      p = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;function d(e) {
	    var t = !!e && "length" in e && e.length,
	        n = w(e);return !m(e) && !x(e) && ("array" === n || 0 === t || "number" == typeof t && 0 < t && t - 1 in e);
	  }k.fn = k.prototype = { jquery: f, constructor: k, length: 0, toArray: function toArray() {
	      return s.call(this);
	    }, get: function get(e) {
	      return null == e ? s.call(this) : e < 0 ? this[e + this.length] : this[e];
	    }, pushStack: function pushStack(e) {
	      var t = k.merge(this.constructor(), e);return t.prevObject = this, t;
	    }, each: function each(e) {
	      return k.each(this, e);
	    }, map: function map(n) {
	      return this.pushStack(k.map(this, function (e, t) {
	        return n.call(e, t, e);
	      }));
	    }, slice: function slice() {
	      return this.pushStack(s.apply(this, arguments));
	    }, first: function first() {
	      return this.eq(0);
	    }, last: function last() {
	      return this.eq(-1);
	    }, eq: function eq(e) {
	      var t = this.length,
	          n = +e + (e < 0 ? t : 0);return this.pushStack(0 <= n && n < t ? [this[n]] : []);
	    }, end: function end() {
	      return this.prevObject || this.constructor();
	    }, push: u, sort: t.sort, splice: t.splice }, k.extend = k.fn.extend = function () {
	    var e,
	        t,
	        n,
	        r,
	        i,
	        o,
	        a = arguments[0] || {},
	        s = 1,
	        u = arguments.length,
	        l = !1;for ("boolean" == typeof a && (l = a, a = arguments[s] || {}, s++), "object" == (typeof a === "undefined" ? "undefined" : _typeof(a)) || m(a) || (a = {}), s === u && (a = this, s--); s < u; s++) {
	      if (null != (e = arguments[s])) for (t in e) {
	        r = e[t], "__proto__" !== t && a !== r && (l && r && (k.isPlainObject(r) || (i = Array.isArray(r))) ? (n = a[t], o = i && !Array.isArray(n) ? [] : i || k.isPlainObject(n) ? n : {}, i = !1, a[t] = k.extend(l, o, r)) : void 0 !== r && (a[t] = r));
	      }
	    }return a;
	  }, k.extend({ expando: "jQuery" + (f + Math.random()).replace(/\D/g, ""), isReady: !0, error: function error(e) {
	      throw new Error(e);
	    }, noop: function noop() {}, isPlainObject: function isPlainObject(e) {
	      var t, n;return !(!e || "[object Object]" !== o.call(e)) && (!(t = r(e)) || "function" == typeof (n = v.call(t, "constructor") && t.constructor) && a.call(n) === l);
	    }, isEmptyObject: function isEmptyObject(e) {
	      var t;for (t in e) {
	        return !1;
	      }return !0;
	    }, globalEval: function globalEval(e, t) {
	      b(e, { nonce: t && t.nonce });
	    }, each: function each(e, t) {
	      var n,
	          r = 0;if (d(e)) {
	        for (n = e.length; r < n; r++) {
	          if (!1 === t.call(e[r], r, e[r])) break;
	        }
	      } else for (r in e) {
	        if (!1 === t.call(e[r], r, e[r])) break;
	      }return e;
	    }, trim: function trim(e) {
	      return null == e ? "" : (e + "").replace(p, "");
	    }, makeArray: function makeArray(e, t) {
	      var n = t || [];return null != e && (d(Object(e)) ? k.merge(n, "string" == typeof e ? [e] : e) : u.call(n, e)), n;
	    }, inArray: function inArray(e, t, n) {
	      return null == t ? -1 : i.call(t, e, n);
	    }, merge: function merge(e, t) {
	      for (var n = +t.length, r = 0, i = e.length; r < n; r++) {
	        e[i++] = t[r];
	      }return e.length = i, e;
	    }, grep: function grep(e, t, n) {
	      for (var r = [], i = 0, o = e.length, a = !n; i < o; i++) {
	        !t(e[i], i) !== a && r.push(e[i]);
	      }return r;
	    }, map: function map(e, t, n) {
	      var r,
	          i,
	          o = 0,
	          a = [];if (d(e)) for (r = e.length; o < r; o++) {
	        null != (i = t(e[o], o, n)) && a.push(i);
	      } else for (o in e) {
	        null != (i = t(e[o], o, n)) && a.push(i);
	      }return g.apply([], a);
	    }, guid: 1, support: y }), "function" == typeof Symbol && (k.fn[Symbol.iterator] = t[Symbol.iterator]), k.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "), function (e, t) {
	    n["[object " + t + "]"] = t.toLowerCase();
	  });var h = function (n) {
	    var e,
	        d,
	        b,
	        o,
	        i,
	        h,
	        f,
	        g,
	        w,
	        u,
	        l,
	        T,
	        C,
	        a,
	        E,
	        v,
	        s,
	        c,
	        y,
	        k = "sizzle" + 1 * new Date(),
	        m = n.document,
	        S = 0,
	        r = 0,
	        p = ue(),
	        x = ue(),
	        N = ue(),
	        A = ue(),
	        D = function D(e, t) {
	      return e === t && (l = !0), 0;
	    },
	        j = {}.hasOwnProperty,
	        t = [],
	        q = t.pop,
	        L = t.push,
	        H = t.push,
	        O = t.slice,
	        P = function P(e, t) {
	      for (var n = 0, r = e.length; n < r; n++) {
	        if (e[n] === t) return n;
	      }return -1;
	    },
	        R = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
	        M = "[\\x20\\t\\r\\n\\f]",
	        I = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",
	        W = "\\[" + M + "*(" + I + ")(?:" + M + "*([*^$|!~]?=)" + M + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + I + "))|)" + M + "*\\]",
	        $ = ":(" + I + ")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|" + W + ")*)|.*)\\)|)",
	        F = new RegExp(M + "+", "g"),
	        B = new RegExp("^" + M + "+|((?:^|[^\\\\])(?:\\\\.)*)" + M + "+$", "g"),
	        _ = new RegExp("^" + M + "*," + M + "*"),
	        z = new RegExp("^" + M + "*([>+~]|" + M + ")" + M + "*"),
	        U = new RegExp(M + "|>"),
	        X = new RegExp($),
	        V = new RegExp("^" + I + "$"),
	        G = { ID: new RegExp("^#(" + I + ")"), CLASS: new RegExp("^\\.(" + I + ")"), TAG: new RegExp("^(" + I + "|[*])"), ATTR: new RegExp("^" + W), PSEUDO: new RegExp("^" + $), CHILD: new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + M + "*(even|odd|(([+-]|)(\\d*)n|)" + M + "*(?:([+-]|)" + M + "*(\\d+)|))" + M + "*\\)|)", "i"), bool: new RegExp("^(?:" + R + ")$", "i"), needsContext: new RegExp("^" + M + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + M + "*((?:-\\d)?\\d*)" + M + "*\\)|)(?=[^-]|$)", "i") },
	        Y = /HTML$/i,
	        Q = /^(?:input|select|textarea|button)$/i,
	        J = /^h\d$/i,
	        K = /^[^{]+\{\s*\[native \w/,
	        Z = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
	        ee = /[+~]/,
	        te = new RegExp("\\\\([\\da-f]{1,6}" + M + "?|(" + M + ")|.)", "ig"),
	        ne = function ne(e, t, n) {
	      var r = "0x" + t - 65536;return r != r || n ? t : r < 0 ? String.fromCharCode(r + 65536) : String.fromCharCode(r >> 10 | 55296, 1023 & r | 56320);
	    },
	        re = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
	        ie = function ie(e, t) {
	      return t ? "\0" === e ? "\uFFFD" : e.slice(0, -1) + "\\" + e.charCodeAt(e.length - 1).toString(16) + " " : "\\" + e;
	    },
	        oe = function oe() {
	      T();
	    },
	        ae = be(function (e) {
	      return !0 === e.disabled && "fieldset" === e.nodeName.toLowerCase();
	    }, { dir: "parentNode", next: "legend" });try {
	      H.apply(t = O.call(m.childNodes), m.childNodes), t[m.childNodes.length].nodeType;
	    } catch (e) {
	      H = { apply: t.length ? function (e, t) {
	          L.apply(e, O.call(t));
	        } : function (e, t) {
	          var n = e.length,
	              r = 0;while (e[n++] = t[r++]) {}e.length = n - 1;
	        } };
	    }function se(t, e, n, r) {
	      var i,
	          o,
	          a,
	          s,
	          u,
	          l,
	          c,
	          f = e && e.ownerDocument,
	          p = e ? e.nodeType : 9;if (n = n || [], "string" != typeof t || !t || 1 !== p && 9 !== p && 11 !== p) return n;if (!r && ((e ? e.ownerDocument || e : m) !== C && T(e), e = e || C, E)) {
	        if (11 !== p && (u = Z.exec(t))) if (i = u[1]) {
	          if (9 === p) {
	            if (!(a = e.getElementById(i))) return n;if (a.id === i) return n.push(a), n;
	          } else if (f && (a = f.getElementById(i)) && y(e, a) && a.id === i) return n.push(a), n;
	        } else {
	          if (u[2]) return H.apply(n, e.getElementsByTagName(t)), n;if ((i = u[3]) && d.getElementsByClassName && e.getElementsByClassName) return H.apply(n, e.getElementsByClassName(i)), n;
	        }if (d.qsa && !A[t + " "] && (!v || !v.test(t)) && (1 !== p || "object" !== e.nodeName.toLowerCase())) {
	          if (c = t, f = e, 1 === p && U.test(t)) {
	            (s = e.getAttribute("id")) ? s = s.replace(re, ie) : e.setAttribute("id", s = k), o = (l = h(t)).length;while (o--) {
	              l[o] = "#" + s + " " + xe(l[o]);
	            }c = l.join(","), f = ee.test(t) && ye(e.parentNode) || e;
	          }try {
	            return H.apply(n, f.querySelectorAll(c)), n;
	          } catch (e) {
	            A(t, !0);
	          } finally {
	            s === k && e.removeAttribute("id");
	          }
	        }
	      }return g(t.replace(B, "$1"), e, n, r);
	    }function ue() {
	      var r = [];return function e(t, n) {
	        return r.push(t + " ") > b.cacheLength && delete e[r.shift()], e[t + " "] = n;
	      };
	    }function le(e) {
	      return e[k] = !0, e;
	    }function ce(e) {
	      var t = C.createElement("fieldset");try {
	        return !!e(t);
	      } catch (e) {
	        return !1;
	      } finally {
	        t.parentNode && t.parentNode.removeChild(t), t = null;
	      }
	    }function fe(e, t) {
	      var n = e.split("|"),
	          r = n.length;while (r--) {
	        b.attrHandle[n[r]] = t;
	      }
	    }function pe(e, t) {
	      var n = t && e,
	          r = n && 1 === e.nodeType && 1 === t.nodeType && e.sourceIndex - t.sourceIndex;if (r) return r;if (n) while (n = n.nextSibling) {
	        if (n === t) return -1;
	      }return e ? 1 : -1;
	    }function de(t) {
	      return function (e) {
	        return "input" === e.nodeName.toLowerCase() && e.type === t;
	      };
	    }function he(n) {
	      return function (e) {
	        var t = e.nodeName.toLowerCase();return ("input" === t || "button" === t) && e.type === n;
	      };
	    }function ge(t) {
	      return function (e) {
	        return "form" in e ? e.parentNode && !1 === e.disabled ? "label" in e ? "label" in e.parentNode ? e.parentNode.disabled === t : e.disabled === t : e.isDisabled === t || e.isDisabled !== !t && ae(e) === t : e.disabled === t : "label" in e && e.disabled === t;
	      };
	    }function ve(a) {
	      return le(function (o) {
	        return o = +o, le(function (e, t) {
	          var n,
	              r = a([], e.length, o),
	              i = r.length;while (i--) {
	            e[n = r[i]] && (e[n] = !(t[n] = e[n]));
	          }
	        });
	      });
	    }function ye(e) {
	      return e && "undefined" != typeof e.getElementsByTagName && e;
	    }for (e in d = se.support = {}, i = se.isXML = function (e) {
	      var t = e.namespaceURI,
	          n = (e.ownerDocument || e).documentElement;return !Y.test(t || n && n.nodeName || "HTML");
	    }, T = se.setDocument = function (e) {
	      var t,
	          n,
	          r = e ? e.ownerDocument || e : m;return r !== C && 9 === r.nodeType && r.documentElement && (a = (C = r).documentElement, E = !i(C), m !== C && (n = C.defaultView) && n.top !== n && (n.addEventListener ? n.addEventListener("unload", oe, !1) : n.attachEvent && n.attachEvent("onunload", oe)), d.attributes = ce(function (e) {
	        return e.className = "i", !e.getAttribute("className");
	      }), d.getElementsByTagName = ce(function (e) {
	        return e.appendChild(C.createComment("")), !e.getElementsByTagName("*").length;
	      }), d.getElementsByClassName = K.test(C.getElementsByClassName), d.getById = ce(function (e) {
	        return a.appendChild(e).id = k, !C.getElementsByName || !C.getElementsByName(k).length;
	      }), d.getById ? (b.filter.ID = function (e) {
	        var t = e.replace(te, ne);return function (e) {
	          return e.getAttribute("id") === t;
	        };
	      }, b.find.ID = function (e, t) {
	        if ("undefined" != typeof t.getElementById && E) {
	          var n = t.getElementById(e);return n ? [n] : [];
	        }
	      }) : (b.filter.ID = function (e) {
	        var n = e.replace(te, ne);return function (e) {
	          var t = "undefined" != typeof e.getAttributeNode && e.getAttributeNode("id");return t && t.value === n;
	        };
	      }, b.find.ID = function (e, t) {
	        if ("undefined" != typeof t.getElementById && E) {
	          var n,
	              r,
	              i,
	              o = t.getElementById(e);if (o) {
	            if ((n = o.getAttributeNode("id")) && n.value === e) return [o];i = t.getElementsByName(e), r = 0;while (o = i[r++]) {
	              if ((n = o.getAttributeNode("id")) && n.value === e) return [o];
	            }
	          }return [];
	        }
	      }), b.find.TAG = d.getElementsByTagName ? function (e, t) {
	        return "undefined" != typeof t.getElementsByTagName ? t.getElementsByTagName(e) : d.qsa ? t.querySelectorAll(e) : void 0;
	      } : function (e, t) {
	        var n,
	            r = [],
	            i = 0,
	            o = t.getElementsByTagName(e);if ("*" === e) {
	          while (n = o[i++]) {
	            1 === n.nodeType && r.push(n);
	          }return r;
	        }return o;
	      }, b.find.CLASS = d.getElementsByClassName && function (e, t) {
	        if ("undefined" != typeof t.getElementsByClassName && E) return t.getElementsByClassName(e);
	      }, s = [], v = [], (d.qsa = K.test(C.querySelectorAll)) && (ce(function (e) {
	        a.appendChild(e).innerHTML = "<a id='" + k + "'></a><select id='" + k + "-\r\\' msallowcapture=''><option selected=''></option></select>", e.querySelectorAll("[msallowcapture^='']").length && v.push("[*^$]=" + M + "*(?:''|\"\")"), e.querySelectorAll("[selected]").length || v.push("\\[" + M + "*(?:value|" + R + ")"), e.querySelectorAll("[id~=" + k + "-]").length || v.push("~="), e.querySelectorAll(":checked").length || v.push(":checked"), e.querySelectorAll("a#" + k + "+*").length || v.push(".#.+[+~]");
	      }), ce(function (e) {
	        e.innerHTML = "<a href='' disabled='disabled'></a><select disabled='disabled'><option/></select>";var t = C.createElement("input");t.setAttribute("type", "hidden"), e.appendChild(t).setAttribute("name", "D"), e.querySelectorAll("[name=d]").length && v.push("name" + M + "*[*^$|!~]?="), 2 !== e.querySelectorAll(":enabled").length && v.push(":enabled", ":disabled"), a.appendChild(e).disabled = !0, 2 !== e.querySelectorAll(":disabled").length && v.push(":enabled", ":disabled"), e.querySelectorAll("*,:x"), v.push(",.*:");
	      })), (d.matchesSelector = K.test(c = a.matches || a.webkitMatchesSelector || a.mozMatchesSelector || a.oMatchesSelector || a.msMatchesSelector)) && ce(function (e) {
	        d.disconnectedMatch = c.call(e, "*"), c.call(e, "[s!='']:x"), s.push("!=", $);
	      }), v = v.length && new RegExp(v.join("|")), s = s.length && new RegExp(s.join("|")), t = K.test(a.compareDocumentPosition), y = t || K.test(a.contains) ? function (e, t) {
	        var n = 9 === e.nodeType ? e.documentElement : e,
	            r = t && t.parentNode;return e === r || !(!r || 1 !== r.nodeType || !(n.contains ? n.contains(r) : e.compareDocumentPosition && 16 & e.compareDocumentPosition(r)));
	      } : function (e, t) {
	        if (t) while (t = t.parentNode) {
	          if (t === e) return !0;
	        }return !1;
	      }, D = t ? function (e, t) {
	        if (e === t) return l = !0, 0;var n = !e.compareDocumentPosition - !t.compareDocumentPosition;return n || (1 & (n = (e.ownerDocument || e) === (t.ownerDocument || t) ? e.compareDocumentPosition(t) : 1) || !d.sortDetached && t.compareDocumentPosition(e) === n ? e === C || e.ownerDocument === m && y(m, e) ? -1 : t === C || t.ownerDocument === m && y(m, t) ? 1 : u ? P(u, e) - P(u, t) : 0 : 4 & n ? -1 : 1);
	      } : function (e, t) {
	        if (e === t) return l = !0, 0;var n,
	            r = 0,
	            i = e.parentNode,
	            o = t.parentNode,
	            a = [e],
	            s = [t];if (!i || !o) return e === C ? -1 : t === C ? 1 : i ? -1 : o ? 1 : u ? P(u, e) - P(u, t) : 0;if (i === o) return pe(e, t);n = e;while (n = n.parentNode) {
	          a.unshift(n);
	        }n = t;while (n = n.parentNode) {
	          s.unshift(n);
	        }while (a[r] === s[r]) {
	          r++;
	        }return r ? pe(a[r], s[r]) : a[r] === m ? -1 : s[r] === m ? 1 : 0;
	      }), C;
	    }, se.matches = function (e, t) {
	      return se(e, null, null, t);
	    }, se.matchesSelector = function (e, t) {
	      if ((e.ownerDocument || e) !== C && T(e), d.matchesSelector && E && !A[t + " "] && (!s || !s.test(t)) && (!v || !v.test(t))) try {
	        var n = c.call(e, t);if (n || d.disconnectedMatch || e.document && 11 !== e.document.nodeType) return n;
	      } catch (e) {
	        A(t, !0);
	      }return 0 < se(t, C, null, [e]).length;
	    }, se.contains = function (e, t) {
	      return (e.ownerDocument || e) !== C && T(e), y(e, t);
	    }, se.attr = function (e, t) {
	      (e.ownerDocument || e) !== C && T(e);var n = b.attrHandle[t.toLowerCase()],
	          r = n && j.call(b.attrHandle, t.toLowerCase()) ? n(e, t, !E) : void 0;return void 0 !== r ? r : d.attributes || !E ? e.getAttribute(t) : (r = e.getAttributeNode(t)) && r.specified ? r.value : null;
	    }, se.escape = function (e) {
	      return (e + "").replace(re, ie);
	    }, se.error = function (e) {
	      throw new Error("Syntax error, unrecognized expression: " + e);
	    }, se.uniqueSort = function (e) {
	      var t,
	          n = [],
	          r = 0,
	          i = 0;if (l = !d.detectDuplicates, u = !d.sortStable && e.slice(0), e.sort(D), l) {
	        while (t = e[i++]) {
	          t === e[i] && (r = n.push(i));
	        }while (r--) {
	          e.splice(n[r], 1);
	        }
	      }return u = null, e;
	    }, o = se.getText = function (e) {
	      var t,
	          n = "",
	          r = 0,
	          i = e.nodeType;if (i) {
	        if (1 === i || 9 === i || 11 === i) {
	          if ("string" == typeof e.textContent) return e.textContent;for (e = e.firstChild; e; e = e.nextSibling) {
	            n += o(e);
	          }
	        } else if (3 === i || 4 === i) return e.nodeValue;
	      } else while (t = e[r++]) {
	        n += o(t);
	      }return n;
	    }, (b = se.selectors = { cacheLength: 50, createPseudo: le, match: G, attrHandle: {}, find: {}, relative: { ">": { dir: "parentNode", first: !0 }, " ": { dir: "parentNode" }, "+": { dir: "previousSibling", first: !0 }, "~": { dir: "previousSibling" } }, preFilter: { ATTR: function ATTR(e) {
	          return e[1] = e[1].replace(te, ne), e[3] = (e[3] || e[4] || e[5] || "").replace(te, ne), "~=" === e[2] && (e[3] = " " + e[3] + " "), e.slice(0, 4);
	        }, CHILD: function CHILD(e) {
	          return e[1] = e[1].toLowerCase(), "nth" === e[1].slice(0, 3) ? (e[3] || se.error(e[0]), e[4] = +(e[4] ? e[5] + (e[6] || 1) : 2 * ("even" === e[3] || "odd" === e[3])), e[5] = +(e[7] + e[8] || "odd" === e[3])) : e[3] && se.error(e[0]), e;
	        }, PSEUDO: function PSEUDO(e) {
	          var t,
	              n = !e[6] && e[2];return G.CHILD.test(e[0]) ? null : (e[3] ? e[2] = e[4] || e[5] || "" : n && X.test(n) && (t = h(n, !0)) && (t = n.indexOf(")", n.length - t) - n.length) && (e[0] = e[0].slice(0, t), e[2] = n.slice(0, t)), e.slice(0, 3));
	        } }, filter: { TAG: function TAG(e) {
	          var t = e.replace(te, ne).toLowerCase();return "*" === e ? function () {
	            return !0;
	          } : function (e) {
	            return e.nodeName && e.nodeName.toLowerCase() === t;
	          };
	        }, CLASS: function CLASS(e) {
	          var t = p[e + " "];return t || (t = new RegExp("(^|" + M + ")" + e + "(" + M + "|$)")) && p(e, function (e) {
	            return t.test("string" == typeof e.className && e.className || "undefined" != typeof e.getAttribute && e.getAttribute("class") || "");
	          });
	        }, ATTR: function ATTR(n, r, i) {
	          return function (e) {
	            var t = se.attr(e, n);return null == t ? "!=" === r : !r || (t += "", "=" === r ? t === i : "!=" === r ? t !== i : "^=" === r ? i && 0 === t.indexOf(i) : "*=" === r ? i && -1 < t.indexOf(i) : "$=" === r ? i && t.slice(-i.length) === i : "~=" === r ? -1 < (" " + t.replace(F, " ") + " ").indexOf(i) : "|=" === r && (t === i || t.slice(0, i.length + 1) === i + "-"));
	          };
	        }, CHILD: function CHILD(h, e, t, g, v) {
	          var y = "nth" !== h.slice(0, 3),
	              m = "last" !== h.slice(-4),
	              x = "of-type" === e;return 1 === g && 0 === v ? function (e) {
	            return !!e.parentNode;
	          } : function (e, t, n) {
	            var r,
	                i,
	                o,
	                a,
	                s,
	                u,
	                l = y !== m ? "nextSibling" : "previousSibling",
	                c = e.parentNode,
	                f = x && e.nodeName.toLowerCase(),
	                p = !n && !x,
	                d = !1;if (c) {
	              if (y) {
	                while (l) {
	                  a = e;while (a = a[l]) {
	                    if (x ? a.nodeName.toLowerCase() === f : 1 === a.nodeType) return !1;
	                  }u = l = "only" === h && !u && "nextSibling";
	                }return !0;
	              }if (u = [m ? c.firstChild : c.lastChild], m && p) {
	                d = (s = (r = (i = (o = (a = c)[k] || (a[k] = {}))[a.uniqueID] || (o[a.uniqueID] = {}))[h] || [])[0] === S && r[1]) && r[2], a = s && c.childNodes[s];while (a = ++s && a && a[l] || (d = s = 0) || u.pop()) {
	                  if (1 === a.nodeType && ++d && a === e) {
	                    i[h] = [S, s, d];break;
	                  }
	                }
	              } else if (p && (d = s = (r = (i = (o = (a = e)[k] || (a[k] = {}))[a.uniqueID] || (o[a.uniqueID] = {}))[h] || [])[0] === S && r[1]), !1 === d) while (a = ++s && a && a[l] || (d = s = 0) || u.pop()) {
	                if ((x ? a.nodeName.toLowerCase() === f : 1 === a.nodeType) && ++d && (p && ((i = (o = a[k] || (a[k] = {}))[a.uniqueID] || (o[a.uniqueID] = {}))[h] = [S, d]), a === e)) break;
	              }return (d -= v) === g || d % g == 0 && 0 <= d / g;
	            }
	          };
	        }, PSEUDO: function PSEUDO(e, o) {
	          var t,
	              a = b.pseudos[e] || b.setFilters[e.toLowerCase()] || se.error("unsupported pseudo: " + e);return a[k] ? a(o) : 1 < a.length ? (t = [e, e, "", o], b.setFilters.hasOwnProperty(e.toLowerCase()) ? le(function (e, t) {
	            var n,
	                r = a(e, o),
	                i = r.length;while (i--) {
	              e[n = P(e, r[i])] = !(t[n] = r[i]);
	            }
	          }) : function (e) {
	            return a(e, 0, t);
	          }) : a;
	        } }, pseudos: { not: le(function (e) {
	          var r = [],
	              i = [],
	              s = f(e.replace(B, "$1"));return s[k] ? le(function (e, t, n, r) {
	            var i,
	                o = s(e, null, r, []),
	                a = e.length;while (a--) {
	              (i = o[a]) && (e[a] = !(t[a] = i));
	            }
	          }) : function (e, t, n) {
	            return r[0] = e, s(r, null, n, i), r[0] = null, !i.pop();
	          };
	        }), has: le(function (t) {
	          return function (e) {
	            return 0 < se(t, e).length;
	          };
	        }), contains: le(function (t) {
	          return t = t.replace(te, ne), function (e) {
	            return -1 < (e.textContent || o(e)).indexOf(t);
	          };
	        }), lang: le(function (n) {
	          return V.test(n || "") || se.error("unsupported lang: " + n), n = n.replace(te, ne).toLowerCase(), function (e) {
	            var t;do {
	              if (t = E ? e.lang : e.getAttribute("xml:lang") || e.getAttribute("lang")) return (t = t.toLowerCase()) === n || 0 === t.indexOf(n + "-");
	            } while ((e = e.parentNode) && 1 === e.nodeType);return !1;
	          };
	        }), target: function target(e) {
	          var t = n.location && n.location.hash;return t && t.slice(1) === e.id;
	        }, root: function root(e) {
	          return e === a;
	        }, focus: function focus(e) {
	          return e === C.activeElement && (!C.hasFocus || C.hasFocus()) && !!(e.type || e.href || ~e.tabIndex);
	        }, enabled: ge(!1), disabled: ge(!0), checked: function checked(e) {
	          var t = e.nodeName.toLowerCase();return "input" === t && !!e.checked || "option" === t && !!e.selected;
	        }, selected: function selected(e) {
	          return e.parentNode && e.parentNode.selectedIndex, !0 === e.selected;
	        }, empty: function empty(e) {
	          for (e = e.firstChild; e; e = e.nextSibling) {
	            if (e.nodeType < 6) return !1;
	          }return !0;
	        }, parent: function parent(e) {
	          return !b.pseudos.empty(e);
	        }, header: function header(e) {
	          return J.test(e.nodeName);
	        }, input: function input(e) {
	          return Q.test(e.nodeName);
	        }, button: function button(e) {
	          var t = e.nodeName.toLowerCase();return "input" === t && "button" === e.type || "button" === t;
	        }, text: function text(e) {
	          var t;return "input" === e.nodeName.toLowerCase() && "text" === e.type && (null == (t = e.getAttribute("type")) || "text" === t.toLowerCase());
	        }, first: ve(function () {
	          return [0];
	        }), last: ve(function (e, t) {
	          return [t - 1];
	        }), eq: ve(function (e, t, n) {
	          return [n < 0 ? n + t : n];
	        }), even: ve(function (e, t) {
	          for (var n = 0; n < t; n += 2) {
	            e.push(n);
	          }return e;
	        }), odd: ve(function (e, t) {
	          for (var n = 1; n < t; n += 2) {
	            e.push(n);
	          }return e;
	        }), lt: ve(function (e, t, n) {
	          for (var r = n < 0 ? n + t : t < n ? t : n; 0 <= --r;) {
	            e.push(r);
	          }return e;
	        }), gt: ve(function (e, t, n) {
	          for (var r = n < 0 ? n + t : n; ++r < t;) {
	            e.push(r);
	          }return e;
	        }) } }).pseudos.nth = b.pseudos.eq, { radio: !0, checkbox: !0, file: !0, password: !0, image: !0 }) {
	      b.pseudos[e] = de(e);
	    }for (e in { submit: !0, reset: !0 }) {
	      b.pseudos[e] = he(e);
	    }function me() {}function xe(e) {
	      for (var t = 0, n = e.length, r = ""; t < n; t++) {
	        r += e[t].value;
	      }return r;
	    }function be(s, e, t) {
	      var u = e.dir,
	          l = e.next,
	          c = l || u,
	          f = t && "parentNode" === c,
	          p = r++;return e.first ? function (e, t, n) {
	        while (e = e[u]) {
	          if (1 === e.nodeType || f) return s(e, t, n);
	        }return !1;
	      } : function (e, t, n) {
	        var r,
	            i,
	            o,
	            a = [S, p];if (n) {
	          while (e = e[u]) {
	            if ((1 === e.nodeType || f) && s(e, t, n)) return !0;
	          }
	        } else while (e = e[u]) {
	          if (1 === e.nodeType || f) if (i = (o = e[k] || (e[k] = {}))[e.uniqueID] || (o[e.uniqueID] = {}), l && l === e.nodeName.toLowerCase()) e = e[u] || e;else {
	            if ((r = i[c]) && r[0] === S && r[1] === p) return a[2] = r[2];if ((i[c] = a)[2] = s(e, t, n)) return !0;
	          }
	        }return !1;
	      };
	    }function we(i) {
	      return 1 < i.length ? function (e, t, n) {
	        var r = i.length;while (r--) {
	          if (!i[r](e, t, n)) return !1;
	        }return !0;
	      } : i[0];
	    }function Te(e, t, n, r, i) {
	      for (var o, a = [], s = 0, u = e.length, l = null != t; s < u; s++) {
	        (o = e[s]) && (n && !n(o, r, i) || (a.push(o), l && t.push(s)));
	      }return a;
	    }function Ce(d, h, g, v, y, e) {
	      return v && !v[k] && (v = Ce(v)), y && !y[k] && (y = Ce(y, e)), le(function (e, t, n, r) {
	        var i,
	            o,
	            a,
	            s = [],
	            u = [],
	            l = t.length,
	            c = e || function (e, t, n) {
	          for (var r = 0, i = t.length; r < i; r++) {
	            se(e, t[r], n);
	          }return n;
	        }(h || "*", n.nodeType ? [n] : n, []),
	            f = !d || !e && h ? c : Te(c, s, d, n, r),
	            p = g ? y || (e ? d : l || v) ? [] : t : f;if (g && g(f, p, n, r), v) {
	          i = Te(p, u), v(i, [], n, r), o = i.length;while (o--) {
	            (a = i[o]) && (p[u[o]] = !(f[u[o]] = a));
	          }
	        }if (e) {
	          if (y || d) {
	            if (y) {
	              i = [], o = p.length;while (o--) {
	                (a = p[o]) && i.push(f[o] = a);
	              }y(null, p = [], i, r);
	            }o = p.length;while (o--) {
	              (a = p[o]) && -1 < (i = y ? P(e, a) : s[o]) && (e[i] = !(t[i] = a));
	            }
	          }
	        } else p = Te(p === t ? p.splice(l, p.length) : p), y ? y(null, t, p, r) : H.apply(t, p);
	      });
	    }function Ee(e) {
	      for (var i, t, n, r = e.length, o = b.relative[e[0].type], a = o || b.relative[" "], s = o ? 1 : 0, u = be(function (e) {
	        return e === i;
	      }, a, !0), l = be(function (e) {
	        return -1 < P(i, e);
	      }, a, !0), c = [function (e, t, n) {
	        var r = !o && (n || t !== w) || ((i = t).nodeType ? u(e, t, n) : l(e, t, n));return i = null, r;
	      }]; s < r; s++) {
	        if (t = b.relative[e[s].type]) c = [be(we(c), t)];else {
	          if ((t = b.filter[e[s].type].apply(null, e[s].matches))[k]) {
	            for (n = ++s; n < r; n++) {
	              if (b.relative[e[n].type]) break;
	            }return Ce(1 < s && we(c), 1 < s && xe(e.slice(0, s - 1).concat({ value: " " === e[s - 2].type ? "*" : "" })).replace(B, "$1"), t, s < n && Ee(e.slice(s, n)), n < r && Ee(e = e.slice(n)), n < r && xe(e));
	          }c.push(t);
	        }
	      }return we(c);
	    }return me.prototype = b.filters = b.pseudos, b.setFilters = new me(), h = se.tokenize = function (e, t) {
	      var n,
	          r,
	          i,
	          o,
	          a,
	          s,
	          u,
	          l = x[e + " "];if (l) return t ? 0 : l.slice(0);a = e, s = [], u = b.preFilter;while (a) {
	        for (o in n && !(r = _.exec(a)) || (r && (a = a.slice(r[0].length) || a), s.push(i = [])), n = !1, (r = z.exec(a)) && (n = r.shift(), i.push({ value: n, type: r[0].replace(B, " ") }), a = a.slice(n.length)), b.filter) {
	          !(r = G[o].exec(a)) || u[o] && !(r = u[o](r)) || (n = r.shift(), i.push({ value: n, type: o, matches: r }), a = a.slice(n.length));
	        }if (!n) break;
	      }return t ? a.length : a ? se.error(e) : x(e, s).slice(0);
	    }, f = se.compile = function (e, t) {
	      var n,
	          v,
	          y,
	          m,
	          x,
	          r,
	          i = [],
	          o = [],
	          a = N[e + " "];if (!a) {
	        t || (t = h(e)), n = t.length;while (n--) {
	          (a = Ee(t[n]))[k] ? i.push(a) : o.push(a);
	        }(a = N(e, (v = o, m = 0 < (y = i).length, x = 0 < v.length, r = function r(e, t, n, _r, i) {
	          var o,
	              a,
	              s,
	              u = 0,
	              l = "0",
	              c = e && [],
	              f = [],
	              p = w,
	              d = e || x && b.find.TAG("*", i),
	              h = S += null == p ? 1 : Math.random() || .1,
	              g = d.length;for (i && (w = t === C || t || i); l !== g && null != (o = d[l]); l++) {
	            if (x && o) {
	              a = 0, t || o.ownerDocument === C || (T(o), n = !E);while (s = v[a++]) {
	                if (s(o, t || C, n)) {
	                  _r.push(o);break;
	                }
	              }i && (S = h);
	            }m && ((o = !s && o) && u--, e && c.push(o));
	          }if (u += l, m && l !== u) {
	            a = 0;while (s = y[a++]) {
	              s(c, f, t, n);
	            }if (e) {
	              if (0 < u) while (l--) {
	                c[l] || f[l] || (f[l] = q.call(_r));
	              }f = Te(f);
	            }H.apply(_r, f), i && !e && 0 < f.length && 1 < u + y.length && se.uniqueSort(_r);
	          }return i && (S = h, w = p), c;
	        }, m ? le(r) : r))).selector = e;
	      }return a;
	    }, g = se.select = function (e, t, n, r) {
	      var i,
	          o,
	          a,
	          s,
	          u,
	          l = "function" == typeof e && e,
	          c = !r && h(e = l.selector || e);if (n = n || [], 1 === c.length) {
	        if (2 < (o = c[0] = c[0].slice(0)).length && "ID" === (a = o[0]).type && 9 === t.nodeType && E && b.relative[o[1].type]) {
	          if (!(t = (b.find.ID(a.matches[0].replace(te, ne), t) || [])[0])) return n;l && (t = t.parentNode), e = e.slice(o.shift().value.length);
	        }i = G.needsContext.test(e) ? 0 : o.length;while (i--) {
	          if (a = o[i], b.relative[s = a.type]) break;if ((u = b.find[s]) && (r = u(a.matches[0].replace(te, ne), ee.test(o[0].type) && ye(t.parentNode) || t))) {
	            if (o.splice(i, 1), !(e = r.length && xe(o))) return H.apply(n, r), n;break;
	          }
	        }
	      }return (l || f(e, c))(r, t, !E, n, !t || ee.test(e) && ye(t.parentNode) || t), n;
	    }, d.sortStable = k.split("").sort(D).join("") === k, d.detectDuplicates = !!l, T(), d.sortDetached = ce(function (e) {
	      return 1 & e.compareDocumentPosition(C.createElement("fieldset"));
	    }), ce(function (e) {
	      return e.innerHTML = "<a href='#'></a>", "#" === e.firstChild.getAttribute("href");
	    }) || fe("type|href|height|width", function (e, t, n) {
	      if (!n) return e.getAttribute(t, "type" === t.toLowerCase() ? 1 : 2);
	    }), d.attributes && ce(function (e) {
	      return e.innerHTML = "<input/>", e.firstChild.setAttribute("value", ""), "" === e.firstChild.getAttribute("value");
	    }) || fe("value", function (e, t, n) {
	      if (!n && "input" === e.nodeName.toLowerCase()) return e.defaultValue;
	    }), ce(function (e) {
	      return null == e.getAttribute("disabled");
	    }) || fe(R, function (e, t, n) {
	      var r;if (!n) return !0 === e[t] ? t.toLowerCase() : (r = e.getAttributeNode(t)) && r.specified ? r.value : null;
	    }), se;
	  }(C);k.find = h, k.expr = h.selectors, k.expr[":"] = k.expr.pseudos, k.uniqueSort = k.unique = h.uniqueSort, k.text = h.getText, k.isXMLDoc = h.isXML, k.contains = h.contains, k.escapeSelector = h.escape;var T = function T(e, t, n) {
	    var r = [],
	        i = void 0 !== n;while ((e = e[t]) && 9 !== e.nodeType) {
	      if (1 === e.nodeType) {
	        if (i && k(e).is(n)) break;r.push(e);
	      }
	    }return r;
	  },
	      S = function S(e, t) {
	    for (var n = []; e; e = e.nextSibling) {
	      1 === e.nodeType && e !== t && n.push(e);
	    }return n;
	  },
	      N = k.expr.match.needsContext;function A(e, t) {
	    return e.nodeName && e.nodeName.toLowerCase() === t.toLowerCase();
	  }var D = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;function j(e, n, r) {
	    return m(n) ? k.grep(e, function (e, t) {
	      return !!n.call(e, t, e) !== r;
	    }) : n.nodeType ? k.grep(e, function (e) {
	      return e === n !== r;
	    }) : "string" != typeof n ? k.grep(e, function (e) {
	      return -1 < i.call(n, e) !== r;
	    }) : k.filter(n, e, r);
	  }k.filter = function (e, t, n) {
	    var r = t[0];return n && (e = ":not(" + e + ")"), 1 === t.length && 1 === r.nodeType ? k.find.matchesSelector(r, e) ? [r] : [] : k.find.matches(e, k.grep(t, function (e) {
	      return 1 === e.nodeType;
	    }));
	  }, k.fn.extend({ find: function find(e) {
	      var t,
	          n,
	          r = this.length,
	          i = this;if ("string" != typeof e) return this.pushStack(k(e).filter(function () {
	        for (t = 0; t < r; t++) {
	          if (k.contains(i[t], this)) return !0;
	        }
	      }));for (n = this.pushStack([]), t = 0; t < r; t++) {
	        k.find(e, i[t], n);
	      }return 1 < r ? k.uniqueSort(n) : n;
	    }, filter: function filter(e) {
	      return this.pushStack(j(this, e || [], !1));
	    }, not: function not(e) {
	      return this.pushStack(j(this, e || [], !0));
	    }, is: function is(e) {
	      return !!j(this, "string" == typeof e && N.test(e) ? k(e) : e || [], !1).length;
	    } });var q,
	      L = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;(k.fn.init = function (e, t, n) {
	    var r, i;if (!e) return this;if (n = n || q, "string" == typeof e) {
	      if (!(r = "<" === e[0] && ">" === e[e.length - 1] && 3 <= e.length ? [null, e, null] : L.exec(e)) || !r[1] && t) return !t || t.jquery ? (t || n).find(e) : this.constructor(t).find(e);if (r[1]) {
	        if (t = t instanceof k ? t[0] : t, k.merge(this, k.parseHTML(r[1], t && t.nodeType ? t.ownerDocument || t : E, !0)), D.test(r[1]) && k.isPlainObject(t)) for (r in t) {
	          m(this[r]) ? this[r](t[r]) : this.attr(r, t[r]);
	        }return this;
	      }return (i = E.getElementById(r[2])) && (this[0] = i, this.length = 1), this;
	    }return e.nodeType ? (this[0] = e, this.length = 1, this) : m(e) ? void 0 !== n.ready ? n.ready(e) : e(k) : k.makeArray(e, this);
	  }).prototype = k.fn, q = k(E);var H = /^(?:parents|prev(?:Until|All))/,
	      O = { children: !0, contents: !0, next: !0, prev: !0 };function P(e, t) {
	    while ((e = e[t]) && 1 !== e.nodeType) {}return e;
	  }k.fn.extend({ has: function has(e) {
	      var t = k(e, this),
	          n = t.length;return this.filter(function () {
	        for (var e = 0; e < n; e++) {
	          if (k.contains(this, t[e])) return !0;
	        }
	      });
	    }, closest: function closest(e, t) {
	      var n,
	          r = 0,
	          i = this.length,
	          o = [],
	          a = "string" != typeof e && k(e);if (!N.test(e)) for (; r < i; r++) {
	        for (n = this[r]; n && n !== t; n = n.parentNode) {
	          if (n.nodeType < 11 && (a ? -1 < a.index(n) : 1 === n.nodeType && k.find.matchesSelector(n, e))) {
	            o.push(n);break;
	          }
	        }
	      }return this.pushStack(1 < o.length ? k.uniqueSort(o) : o);
	    }, index: function index(e) {
	      return e ? "string" == typeof e ? i.call(k(e), this[0]) : i.call(this, e.jquery ? e[0] : e) : this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
	    }, add: function add(e, t) {
	      return this.pushStack(k.uniqueSort(k.merge(this.get(), k(e, t))));
	    }, addBack: function addBack(e) {
	      return this.add(null == e ? this.prevObject : this.prevObject.filter(e));
	    } }), k.each({ parent: function parent(e) {
	      var t = e.parentNode;return t && 11 !== t.nodeType ? t : null;
	    }, parents: function parents(e) {
	      return T(e, "parentNode");
	    }, parentsUntil: function parentsUntil(e, t, n) {
	      return T(e, "parentNode", n);
	    }, next: function next(e) {
	      return P(e, "nextSibling");
	    }, prev: function prev(e) {
	      return P(e, "previousSibling");
	    }, nextAll: function nextAll(e) {
	      return T(e, "nextSibling");
	    }, prevAll: function prevAll(e) {
	      return T(e, "previousSibling");
	    }, nextUntil: function nextUntil(e, t, n) {
	      return T(e, "nextSibling", n);
	    }, prevUntil: function prevUntil(e, t, n) {
	      return T(e, "previousSibling", n);
	    }, siblings: function siblings(e) {
	      return S((e.parentNode || {}).firstChild, e);
	    }, children: function children(e) {
	      return S(e.firstChild);
	    }, contents: function contents(e) {
	      return "undefined" != typeof e.contentDocument ? e.contentDocument : (A(e, "template") && (e = e.content || e), k.merge([], e.childNodes));
	    } }, function (r, i) {
	    k.fn[r] = function (e, t) {
	      var n = k.map(this, i, e);return "Until" !== r.slice(-5) && (t = e), t && "string" == typeof t && (n = k.filter(t, n)), 1 < this.length && (O[r] || k.uniqueSort(n), H.test(r) && n.reverse()), this.pushStack(n);
	    };
	  });var R = /[^\x20\t\r\n\f]+/g;function M(e) {
	    return e;
	  }function I(e) {
	    throw e;
	  }function W(e, t, n, r) {
	    var i;try {
	      e && m(i = e.promise) ? i.call(e).done(t).fail(n) : e && m(i = e.then) ? i.call(e, t, n) : t.apply(void 0, [e].slice(r));
	    } catch (e) {
	      n.apply(void 0, [e]);
	    }
	  }k.Callbacks = function (r) {
	    var e, n;r = "string" == typeof r ? (e = r, n = {}, k.each(e.match(R) || [], function (e, t) {
	      n[t] = !0;
	    }), n) : k.extend({}, r);var i,
	        t,
	        o,
	        a,
	        s = [],
	        u = [],
	        l = -1,
	        c = function c() {
	      for (a = a || r.once, o = i = !0; u.length; l = -1) {
	        t = u.shift();while (++l < s.length) {
	          !1 === s[l].apply(t[0], t[1]) && r.stopOnFalse && (l = s.length, t = !1);
	        }
	      }r.memory || (t = !1), i = !1, a && (s = t ? [] : "");
	    },
	        f = { add: function add() {
	        return s && (t && !i && (l = s.length - 1, u.push(t)), function n(e) {
	          k.each(e, function (e, t) {
	            m(t) ? r.unique && f.has(t) || s.push(t) : t && t.length && "string" !== w(t) && n(t);
	          });
	        }(arguments), t && !i && c()), this;
	      }, remove: function remove() {
	        return k.each(arguments, function (e, t) {
	          var n;while (-1 < (n = k.inArray(t, s, n))) {
	            s.splice(n, 1), n <= l && l--;
	          }
	        }), this;
	      }, has: function has(e) {
	        return e ? -1 < k.inArray(e, s) : 0 < s.length;
	      }, empty: function empty() {
	        return s && (s = []), this;
	      }, disable: function disable() {
	        return a = u = [], s = t = "", this;
	      }, disabled: function disabled() {
	        return !s;
	      }, lock: function lock() {
	        return a = u = [], t || i || (s = t = ""), this;
	      }, locked: function locked() {
	        return !!a;
	      }, fireWith: function fireWith(e, t) {
	        return a || (t = [e, (t = t || []).slice ? t.slice() : t], u.push(t), i || c()), this;
	      }, fire: function fire() {
	        return f.fireWith(this, arguments), this;
	      }, fired: function fired() {
	        return !!o;
	      } };return f;
	  }, k.extend({ Deferred: function Deferred(e) {
	      var o = [["notify", "progress", k.Callbacks("memory"), k.Callbacks("memory"), 2], ["resolve", "done", k.Callbacks("once memory"), k.Callbacks("once memory"), 0, "resolved"], ["reject", "fail", k.Callbacks("once memory"), k.Callbacks("once memory"), 1, "rejected"]],
	          i = "pending",
	          a = { state: function state() {
	          return i;
	        }, always: function always() {
	          return s.done(arguments).fail(arguments), this;
	        }, "catch": function _catch(e) {
	          return a.then(null, e);
	        }, pipe: function pipe() {
	          var i = arguments;return k.Deferred(function (r) {
	            k.each(o, function (e, t) {
	              var n = m(i[t[4]]) && i[t[4]];s[t[1]](function () {
	                var e = n && n.apply(this, arguments);e && m(e.promise) ? e.promise().progress(r.notify).done(r.resolve).fail(r.reject) : r[t[0] + "With"](this, n ? [e] : arguments);
	              });
	            }), i = null;
	          }).promise();
	        }, then: function then(t, n, r) {
	          var u = 0;function l(i, o, a, s) {
	            return function () {
	              var n = this,
	                  r = arguments,
	                  e = function e() {
	                var e, t;if (!(i < u)) {
	                  if ((e = a.apply(n, r)) === o.promise()) throw new TypeError("Thenable self-resolution");t = e && ("object" == (typeof e === "undefined" ? "undefined" : _typeof(e)) || "function" == typeof e) && e.then, m(t) ? s ? t.call(e, l(u, o, M, s), l(u, o, I, s)) : (u++, t.call(e, l(u, o, M, s), l(u, o, I, s), l(u, o, M, o.notifyWith))) : (a !== M && (n = void 0, r = [e]), (s || o.resolveWith)(n, r));
	                }
	              },
	                  t = s ? e : function () {
	                try {
	                  e();
	                } catch (e) {
	                  k.Deferred.exceptionHook && k.Deferred.exceptionHook(e, t.stackTrace), u <= i + 1 && (a !== I && (n = void 0, r = [e]), o.rejectWith(n, r));
	                }
	              };i ? t() : (k.Deferred.getStackHook && (t.stackTrace = k.Deferred.getStackHook()), C.setTimeout(t));
	            };
	          }return k.Deferred(function (e) {
	            o[0][3].add(l(0, e, m(r) ? r : M, e.notifyWith)), o[1][3].add(l(0, e, m(t) ? t : M)), o[2][3].add(l(0, e, m(n) ? n : I));
	          }).promise();
	        }, promise: function promise(e) {
	          return null != e ? k.extend(e, a) : a;
	        } },
	          s = {};return k.each(o, function (e, t) {
	        var n = t[2],
	            r = t[5];a[t[1]] = n.add, r && n.add(function () {
	          i = r;
	        }, o[3 - e][2].disable, o[3 - e][3].disable, o[0][2].lock, o[0][3].lock), n.add(t[3].fire), s[t[0]] = function () {
	          return s[t[0] + "With"](this === s ? void 0 : this, arguments), this;
	        }, s[t[0] + "With"] = n.fireWith;
	      }), a.promise(s), e && e.call(s, s), s;
	    }, when: function when(e) {
	      var n = arguments.length,
	          t = n,
	          r = Array(t),
	          i = s.call(arguments),
	          o = k.Deferred(),
	          a = function a(t) {
	        return function (e) {
	          r[t] = this, i[t] = 1 < arguments.length ? s.call(arguments) : e, --n || o.resolveWith(r, i);
	        };
	      };if (n <= 1 && (W(e, o.done(a(t)).resolve, o.reject, !n), "pending" === o.state() || m(i[t] && i[t].then))) return o.then();while (t--) {
	        W(i[t], a(t), o.reject);
	      }return o.promise();
	    } });var $ = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;k.Deferred.exceptionHook = function (e, t) {
	    C.console && C.console.warn && e && $.test(e.name) && C.console.warn("jQuery.Deferred exception: " + e.message, e.stack, t);
	  }, k.readyException = function (e) {
	    C.setTimeout(function () {
	      throw e;
	    });
	  };var F = k.Deferred();function B() {
	    E.removeEventListener("DOMContentLoaded", B), C.removeEventListener("load", B), k.ready();
	  }k.fn.ready = function (e) {
	    return F.then(e)["catch"](function (e) {
	      k.readyException(e);
	    }), this;
	  }, k.extend({ isReady: !1, readyWait: 1, ready: function ready(e) {
	      (!0 === e ? --k.readyWait : k.isReady) || (k.isReady = !0) !== e && 0 < --k.readyWait || F.resolveWith(E, [k]);
	    } }), k.ready.then = F.then, "complete" === E.readyState || "loading" !== E.readyState && !E.documentElement.doScroll ? C.setTimeout(k.ready) : (E.addEventListener("DOMContentLoaded", B), C.addEventListener("load", B));var _ = function _(e, t, n, r, i, o, a) {
	    var s = 0,
	        u = e.length,
	        l = null == n;if ("object" === w(n)) for (s in i = !0, n) {
	      _(e, t, s, n[s], !0, o, a);
	    } else if (void 0 !== r && (i = !0, m(r) || (a = !0), l && (a ? (t.call(e, r), t = null) : (l = t, t = function t(e, _t2, n) {
	      return l.call(k(e), n);
	    })), t)) for (; s < u; s++) {
	      t(e[s], n, a ? r : r.call(e[s], s, t(e[s], n)));
	    }return i ? e : l ? t.call(e) : u ? t(e[0], n) : o;
	  },
	      z = /^-ms-/,
	      U = /-([a-z])/g;function X(e, t) {
	    return t.toUpperCase();
	  }function V(e) {
	    return e.replace(z, "ms-").replace(U, X);
	  }var G = function G(e) {
	    return 1 === e.nodeType || 9 === e.nodeType || !+e.nodeType;
	  };function Y() {
	    this.expando = k.expando + Y.uid++;
	  }Y.uid = 1, Y.prototype = { cache: function cache(e) {
	      var t = e[this.expando];return t || (t = {}, G(e) && (e.nodeType ? e[this.expando] = t : Object.defineProperty(e, this.expando, { value: t, configurable: !0 }))), t;
	    }, set: function set(e, t, n) {
	      var r,
	          i = this.cache(e);if ("string" == typeof t) i[V(t)] = n;else for (r in t) {
	        i[V(r)] = t[r];
	      }return i;
	    }, get: function get(e, t) {
	      return void 0 === t ? this.cache(e) : e[this.expando] && e[this.expando][V(t)];
	    }, access: function access(e, t, n) {
	      return void 0 === t || t && "string" == typeof t && void 0 === n ? this.get(e, t) : (this.set(e, t, n), void 0 !== n ? n : t);
	    }, remove: function remove(e, t) {
	      var n,
	          r = e[this.expando];if (void 0 !== r) {
	        if (void 0 !== t) {
	          n = (t = Array.isArray(t) ? t.map(V) : (t = V(t)) in r ? [t] : t.match(R) || []).length;while (n--) {
	            delete r[t[n]];
	          }
	        }(void 0 === t || k.isEmptyObject(r)) && (e.nodeType ? e[this.expando] = void 0 : delete e[this.expando]);
	      }
	    }, hasData: function hasData(e) {
	      var t = e[this.expando];return void 0 !== t && !k.isEmptyObject(t);
	    } };var Q = new Y(),
	      J = new Y(),
	      K = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	      Z = /[A-Z]/g;function ee(e, t, n) {
	    var r, i;if (void 0 === n && 1 === e.nodeType) if (r = "data-" + t.replace(Z, "-$&").toLowerCase(), "string" == typeof (n = e.getAttribute(r))) {
	      try {
	        n = "true" === (i = n) || "false" !== i && ("null" === i ? null : i === +i + "" ? +i : K.test(i) ? JSON.parse(i) : i);
	      } catch (e) {}J.set(e, t, n);
	    } else n = void 0;return n;
	  }k.extend({ hasData: function hasData(e) {
	      return J.hasData(e) || Q.hasData(e);
	    }, data: function data(e, t, n) {
	      return J.access(e, t, n);
	    }, removeData: function removeData(e, t) {
	      J.remove(e, t);
	    }, _data: function _data(e, t, n) {
	      return Q.access(e, t, n);
	    }, _removeData: function _removeData(e, t) {
	      Q.remove(e, t);
	    } }), k.fn.extend({ data: function data(n, e) {
	      var t,
	          r,
	          i,
	          o = this[0],
	          a = o && o.attributes;if (void 0 === n) {
	        if (this.length && (i = J.get(o), 1 === o.nodeType && !Q.get(o, "hasDataAttrs"))) {
	          t = a.length;while (t--) {
	            a[t] && 0 === (r = a[t].name).indexOf("data-") && (r = V(r.slice(5)), ee(o, r, i[r]));
	          }Q.set(o, "hasDataAttrs", !0);
	        }return i;
	      }return "object" == (typeof n === "undefined" ? "undefined" : _typeof(n)) ? this.each(function () {
	        J.set(this, n);
	      }) : _(this, function (e) {
	        var t;if (o && void 0 === e) return void 0 !== (t = J.get(o, n)) ? t : void 0 !== (t = ee(o, n)) ? t : void 0;this.each(function () {
	          J.set(this, n, e);
	        });
	      }, null, e, 1 < arguments.length, null, !0);
	    }, removeData: function removeData(e) {
	      return this.each(function () {
	        J.remove(this, e);
	      });
	    } }), k.extend({ queue: function queue(e, t, n) {
	      var r;if (e) return t = (t || "fx") + "queue", r = Q.get(e, t), n && (!r || Array.isArray(n) ? r = Q.access(e, t, k.makeArray(n)) : r.push(n)), r || [];
	    }, dequeue: function dequeue(e, t) {
	      t = t || "fx";var n = k.queue(e, t),
	          r = n.length,
	          i = n.shift(),
	          o = k._queueHooks(e, t);"inprogress" === i && (i = n.shift(), r--), i && ("fx" === t && n.unshift("inprogress"), delete o.stop, i.call(e, function () {
	        k.dequeue(e, t);
	      }, o)), !r && o && o.empty.fire();
	    }, _queueHooks: function _queueHooks(e, t) {
	      var n = t + "queueHooks";return Q.get(e, n) || Q.access(e, n, { empty: k.Callbacks("once memory").add(function () {
	          Q.remove(e, [t + "queue", n]);
	        }) });
	    } }), k.fn.extend({ queue: function queue(t, n) {
	      var e = 2;return "string" != typeof t && (n = t, t = "fx", e--), arguments.length < e ? k.queue(this[0], t) : void 0 === n ? this : this.each(function () {
	        var e = k.queue(this, t, n);k._queueHooks(this, t), "fx" === t && "inprogress" !== e[0] && k.dequeue(this, t);
	      });
	    }, dequeue: function dequeue(e) {
	      return this.each(function () {
	        k.dequeue(this, e);
	      });
	    }, clearQueue: function clearQueue(e) {
	      return this.queue(e || "fx", []);
	    }, promise: function promise(e, t) {
	      var n,
	          r = 1,
	          i = k.Deferred(),
	          o = this,
	          a = this.length,
	          s = function s() {
	        --r || i.resolveWith(o, [o]);
	      };"string" != typeof e && (t = e, e = void 0), e = e || "fx";while (a--) {
	        (n = Q.get(o[a], e + "queueHooks")) && n.empty && (r++, n.empty.add(s));
	      }return s(), i.promise(t);
	    } });var te = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,
	      ne = new RegExp("^(?:([+-])=|)(" + te + ")([a-z%]*)$", "i"),
	      re = ["Top", "Right", "Bottom", "Left"],
	      ie = E.documentElement,
	      oe = function oe(e) {
	    return k.contains(e.ownerDocument, e);
	  },
	      ae = { composed: !0 };ie.getRootNode && (oe = function oe(e) {
	    return k.contains(e.ownerDocument, e) || e.getRootNode(ae) === e.ownerDocument;
	  });var se = function se(e, t) {
	    return "none" === (e = t || e).style.display || "" === e.style.display && oe(e) && "none" === k.css(e, "display");
	  },
	      ue = function ue(e, t, n, r) {
	    var i,
	        o,
	        a = {};for (o in t) {
	      a[o] = e.style[o], e.style[o] = t[o];
	    }for (o in i = n.apply(e, r || []), t) {
	      e.style[o] = a[o];
	    }return i;
	  };function le(e, t, n, r) {
	    var i,
	        o,
	        a = 20,
	        s = r ? function () {
	      return r.cur();
	    } : function () {
	      return k.css(e, t, "");
	    },
	        u = s(),
	        l = n && n[3] || (k.cssNumber[t] ? "" : "px"),
	        c = e.nodeType && (k.cssNumber[t] || "px" !== l && +u) && ne.exec(k.css(e, t));if (c && c[3] !== l) {
	      u /= 2, l = l || c[3], c = +u || 1;while (a--) {
	        k.style(e, t, c + l), (1 - o) * (1 - (o = s() / u || .5)) <= 0 && (a = 0), c /= o;
	      }c *= 2, k.style(e, t, c + l), n = n || [];
	    }return n && (c = +c || +u || 0, i = n[1] ? c + (n[1] + 1) * n[2] : +n[2], r && (r.unit = l, r.start = c, r.end = i)), i;
	  }var ce = {};function fe(e, t) {
	    for (var n, r, i, o, a, s, u, l = [], c = 0, f = e.length; c < f; c++) {
	      (r = e[c]).style && (n = r.style.display, t ? ("none" === n && (l[c] = Q.get(r, "display") || null, l[c] || (r.style.display = "")), "" === r.style.display && se(r) && (l[c] = (u = a = o = void 0, a = (i = r).ownerDocument, s = i.nodeName, (u = ce[s]) || (o = a.body.appendChild(a.createElement(s)), u = k.css(o, "display"), o.parentNode.removeChild(o), "none" === u && (u = "block"), ce[s] = u)))) : "none" !== n && (l[c] = "none", Q.set(r, "display", n)));
	    }for (c = 0; c < f; c++) {
	      null != l[c] && (e[c].style.display = l[c]);
	    }return e;
	  }k.fn.extend({ show: function show() {
	      return fe(this, !0);
	    }, hide: function hide() {
	      return fe(this);
	    }, toggle: function toggle(e) {
	      return "boolean" == typeof e ? e ? this.show() : this.hide() : this.each(function () {
	        se(this) ? k(this).show() : k(this).hide();
	      });
	    } });var pe = /^(?:checkbox|radio)$/i,
	      de = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i,
	      he = /^$|^module$|\/(?:java|ecma)script/i,
	      ge = { option: [1, "<select multiple='multiple'>", "</select>"], thead: [1, "<table>", "</table>"], col: [2, "<table><colgroup>", "</colgroup></table>"], tr: [2, "<table><tbody>", "</tbody></table>"], td: [3, "<table><tbody><tr>", "</tr></tbody></table>"], _default: [0, "", ""] };function ve(e, t) {
	    var n;return n = "undefined" != typeof e.getElementsByTagName ? e.getElementsByTagName(t || "*") : "undefined" != typeof e.querySelectorAll ? e.querySelectorAll(t || "*") : [], void 0 === t || t && A(e, t) ? k.merge([e], n) : n;
	  }function ye(e, t) {
	    for (var n = 0, r = e.length; n < r; n++) {
	      Q.set(e[n], "globalEval", !t || Q.get(t[n], "globalEval"));
	    }
	  }ge.optgroup = ge.option, ge.tbody = ge.tfoot = ge.colgroup = ge.caption = ge.thead, ge.th = ge.td;var me,
	      xe,
	      be = /<|&#?\w+;/;function we(e, t, n, r, i) {
	    for (var o, a, s, u, l, c, f = t.createDocumentFragment(), p = [], d = 0, h = e.length; d < h; d++) {
	      if ((o = e[d]) || 0 === o) if ("object" === w(o)) k.merge(p, o.nodeType ? [o] : o);else if (be.test(o)) {
	        a = a || f.appendChild(t.createElement("div")), s = (de.exec(o) || ["", ""])[1].toLowerCase(), u = ge[s] || ge._default, a.innerHTML = u[1] + k.htmlPrefilter(o) + u[2], c = u[0];while (c--) {
	          a = a.lastChild;
	        }k.merge(p, a.childNodes), (a = f.firstChild).textContent = "";
	      } else p.push(t.createTextNode(o));
	    }f.textContent = "", d = 0;while (o = p[d++]) {
	      if (r && -1 < k.inArray(o, r)) i && i.push(o);else if (l = oe(o), a = ve(f.appendChild(o), "script"), l && ye(a), n) {
	        c = 0;while (o = a[c++]) {
	          he.test(o.type || "") && n.push(o);
	        }
	      }
	    }return f;
	  }me = E.createDocumentFragment().appendChild(E.createElement("div")), (xe = E.createElement("input")).setAttribute("type", "radio"), xe.setAttribute("checked", "checked"), xe.setAttribute("name", "t"), me.appendChild(xe), y.checkClone = me.cloneNode(!0).cloneNode(!0).lastChild.checked, me.innerHTML = "<textarea>x</textarea>", y.noCloneChecked = !!me.cloneNode(!0).lastChild.defaultValue;var Te = /^key/,
	      Ce = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
	      Ee = /^([^.]*)(?:\.(.+)|)/;function ke() {
	    return !0;
	  }function Se() {
	    return !1;
	  }function Ne(e, t) {
	    return e === function () {
	      try {
	        return E.activeElement;
	      } catch (e) {}
	    }() == ("focus" === t);
	  }function Ae(e, t, n, r, i, o) {
	    var a, s;if ("object" == (typeof t === "undefined" ? "undefined" : _typeof(t))) {
	      for (s in "string" != typeof n && (r = r || n, n = void 0), t) {
	        Ae(e, s, n, r, t[s], o);
	      }return e;
	    }if (null == r && null == i ? (i = n, r = n = void 0) : null == i && ("string" == typeof n ? (i = r, r = void 0) : (i = r, r = n, n = void 0)), !1 === i) i = Se;else if (!i) return e;return 1 === o && (a = i, (i = function i(e) {
	      return k().off(e), a.apply(this, arguments);
	    }).guid = a.guid || (a.guid = k.guid++)), e.each(function () {
	      k.event.add(this, t, i, r, n);
	    });
	  }function De(e, i, o) {
	    o ? (Q.set(e, i, !1), k.event.add(e, i, { namespace: !1, handler: function handler(e) {
	        var t,
	            n,
	            r = Q.get(this, i);if (1 & e.isTrigger && this[i]) {
	          if (r.length) (k.event.special[i] || {}).delegateType && e.stopPropagation();else if (r = s.call(arguments), Q.set(this, i, r), t = o(this, i), this[i](), r !== (n = Q.get(this, i)) || t ? Q.set(this, i, !1) : n = {}, r !== n) return e.stopImmediatePropagation(), e.preventDefault(), n.value;
	        } else r.length && (Q.set(this, i, { value: k.event.trigger(k.extend(r[0], k.Event.prototype), r.slice(1), this) }), e.stopImmediatePropagation());
	      } })) : void 0 === Q.get(e, i) && k.event.add(e, i, ke);
	  }k.event = { global: {}, add: function add(t, e, n, r, i) {
	      var o,
	          a,
	          s,
	          u,
	          l,
	          c,
	          f,
	          p,
	          d,
	          h,
	          g,
	          v = Q.get(t);if (v) {
	        n.handler && (n = (o = n).handler, i = o.selector), i && k.find.matchesSelector(ie, i), n.guid || (n.guid = k.guid++), (u = v.events) || (u = v.events = {}), (a = v.handle) || (a = v.handle = function (e) {
	          return "undefined" != typeof k && k.event.triggered !== e.type ? k.event.dispatch.apply(t, arguments) : void 0;
	        }), l = (e = (e || "").match(R) || [""]).length;while (l--) {
	          d = g = (s = Ee.exec(e[l]) || [])[1], h = (s[2] || "").split(".").sort(), d && (f = k.event.special[d] || {}, d = (i ? f.delegateType : f.bindType) || d, f = k.event.special[d] || {}, c = k.extend({ type: d, origType: g, data: r, handler: n, guid: n.guid, selector: i, needsContext: i && k.expr.match.needsContext.test(i), namespace: h.join(".") }, o), (p = u[d]) || ((p = u[d] = []).delegateCount = 0, f.setup && !1 !== f.setup.call(t, r, h, a) || t.addEventListener && t.addEventListener(d, a)), f.add && (f.add.call(t, c), c.handler.guid || (c.handler.guid = n.guid)), i ? p.splice(p.delegateCount++, 0, c) : p.push(c), k.event.global[d] = !0);
	        }
	      }
	    }, remove: function remove(e, t, n, r, i) {
	      var o,
	          a,
	          s,
	          u,
	          l,
	          c,
	          f,
	          p,
	          d,
	          h,
	          g,
	          v = Q.hasData(e) && Q.get(e);if (v && (u = v.events)) {
	        l = (t = (t || "").match(R) || [""]).length;while (l--) {
	          if (d = g = (s = Ee.exec(t[l]) || [])[1], h = (s[2] || "").split(".").sort(), d) {
	            f = k.event.special[d] || {}, p = u[d = (r ? f.delegateType : f.bindType) || d] || [], s = s[2] && new RegExp("(^|\\.)" + h.join("\\.(?:.*\\.|)") + "(\\.|$)"), a = o = p.length;while (o--) {
	              c = p[o], !i && g !== c.origType || n && n.guid !== c.guid || s && !s.test(c.namespace) || r && r !== c.selector && ("**" !== r || !c.selector) || (p.splice(o, 1), c.selector && p.delegateCount--, f.remove && f.remove.call(e, c));
	            }a && !p.length && (f.teardown && !1 !== f.teardown.call(e, h, v.handle) || k.removeEvent(e, d, v.handle), delete u[d]);
	          } else for (d in u) {
	            k.event.remove(e, d + t[l], n, r, !0);
	          }
	        }k.isEmptyObject(u) && Q.remove(e, "handle events");
	      }
	    }, dispatch: function dispatch(e) {
	      var t,
	          n,
	          r,
	          i,
	          o,
	          a,
	          s = k.event.fix(e),
	          u = new Array(arguments.length),
	          l = (Q.get(this, "events") || {})[s.type] || [],
	          c = k.event.special[s.type] || {};for (u[0] = s, t = 1; t < arguments.length; t++) {
	        u[t] = arguments[t];
	      }if (s.delegateTarget = this, !c.preDispatch || !1 !== c.preDispatch.call(this, s)) {
	        a = k.event.handlers.call(this, s, l), t = 0;while ((i = a[t++]) && !s.isPropagationStopped()) {
	          s.currentTarget = i.elem, n = 0;while ((o = i.handlers[n++]) && !s.isImmediatePropagationStopped()) {
	            s.rnamespace && !1 !== o.namespace && !s.rnamespace.test(o.namespace) || (s.handleObj = o, s.data = o.data, void 0 !== (r = ((k.event.special[o.origType] || {}).handle || o.handler).apply(i.elem, u)) && !1 === (s.result = r) && (s.preventDefault(), s.stopPropagation()));
	          }
	        }return c.postDispatch && c.postDispatch.call(this, s), s.result;
	      }
	    }, handlers: function handlers(e, t) {
	      var n,
	          r,
	          i,
	          o,
	          a,
	          s = [],
	          u = t.delegateCount,
	          l = e.target;if (u && l.nodeType && !("click" === e.type && 1 <= e.button)) for (; l !== this; l = l.parentNode || this) {
	        if (1 === l.nodeType && ("click" !== e.type || !0 !== l.disabled)) {
	          for (o = [], a = {}, n = 0; n < u; n++) {
	            void 0 === a[i = (r = t[n]).selector + " "] && (a[i] = r.needsContext ? -1 < k(i, this).index(l) : k.find(i, this, null, [l]).length), a[i] && o.push(r);
	          }o.length && s.push({ elem: l, handlers: o });
	        }
	      }return l = this, u < t.length && s.push({ elem: l, handlers: t.slice(u) }), s;
	    }, addProp: function addProp(t, e) {
	      Object.defineProperty(k.Event.prototype, t, { enumerable: !0, configurable: !0, get: m(e) ? function () {
	          if (this.originalEvent) return e(this.originalEvent);
	        } : function () {
	          if (this.originalEvent) return this.originalEvent[t];
	        }, set: function set(e) {
	          Object.defineProperty(this, t, { enumerable: !0, configurable: !0, writable: !0, value: e });
	        } });
	    }, fix: function fix(e) {
	      return e[k.expando] ? e : new k.Event(e);
	    }, special: { load: { noBubble: !0 }, click: { setup: function setup(e) {
	          var t = this || e;return pe.test(t.type) && t.click && A(t, "input") && De(t, "click", ke), !1;
	        }, trigger: function trigger(e) {
	          var t = this || e;return pe.test(t.type) && t.click && A(t, "input") && De(t, "click"), !0;
	        }, _default: function _default(e) {
	          var t = e.target;return pe.test(t.type) && t.click && A(t, "input") && Q.get(t, "click") || A(t, "a");
	        } }, beforeunload: { postDispatch: function postDispatch(e) {
	          void 0 !== e.result && e.originalEvent && (e.originalEvent.returnValue = e.result);
	        } } } }, k.removeEvent = function (e, t, n) {
	    e.removeEventListener && e.removeEventListener(t, n);
	  }, k.Event = function (e, t) {
	    if (!(this instanceof k.Event)) return new k.Event(e, t);e && e.type ? (this.originalEvent = e, this.type = e.type, this.isDefaultPrevented = e.defaultPrevented || void 0 === e.defaultPrevented && !1 === e.returnValue ? ke : Se, this.target = e.target && 3 === e.target.nodeType ? e.target.parentNode : e.target, this.currentTarget = e.currentTarget, this.relatedTarget = e.relatedTarget) : this.type = e, t && k.extend(this, t), this.timeStamp = e && e.timeStamp || Date.now(), this[k.expando] = !0;
	  }, k.Event.prototype = { constructor: k.Event, isDefaultPrevented: Se, isPropagationStopped: Se, isImmediatePropagationStopped: Se, isSimulated: !1, preventDefault: function preventDefault() {
	      var e = this.originalEvent;this.isDefaultPrevented = ke, e && !this.isSimulated && e.preventDefault();
	    }, stopPropagation: function stopPropagation() {
	      var e = this.originalEvent;this.isPropagationStopped = ke, e && !this.isSimulated && e.stopPropagation();
	    }, stopImmediatePropagation: function stopImmediatePropagation() {
	      var e = this.originalEvent;this.isImmediatePropagationStopped = ke, e && !this.isSimulated && e.stopImmediatePropagation(), this.stopPropagation();
	    } }, k.each({ altKey: !0, bubbles: !0, cancelable: !0, changedTouches: !0, ctrlKey: !0, detail: !0, eventPhase: !0, metaKey: !0, pageX: !0, pageY: !0, shiftKey: !0, view: !0, "char": !0, code: !0, charCode: !0, key: !0, keyCode: !0, button: !0, buttons: !0, clientX: !0, clientY: !0, offsetX: !0, offsetY: !0, pointerId: !0, pointerType: !0, screenX: !0, screenY: !0, targetTouches: !0, toElement: !0, touches: !0, which: function which(e) {
	      var t = e.button;return null == e.which && Te.test(e.type) ? null != e.charCode ? e.charCode : e.keyCode : !e.which && void 0 !== t && Ce.test(e.type) ? 1 & t ? 1 : 2 & t ? 3 : 4 & t ? 2 : 0 : e.which;
	    } }, k.event.addProp), k.each({ focus: "focusin", blur: "focusout" }, function (e, t) {
	    k.event.special[e] = { setup: function setup() {
	        return De(this, e, Ne), !1;
	      }, trigger: function trigger() {
	        return De(this, e), !0;
	      }, delegateType: t };
	  }), k.each({ mouseenter: "mouseover", mouseleave: "mouseout", pointerenter: "pointerover", pointerleave: "pointerout" }, function (e, i) {
	    k.event.special[e] = { delegateType: i, bindType: i, handle: function handle(e) {
	        var t,
	            n = e.relatedTarget,
	            r = e.handleObj;return n && (n === this || k.contains(this, n)) || (e.type = r.origType, t = r.handler.apply(this, arguments), e.type = i), t;
	      } };
	  }), k.fn.extend({ on: function on(e, t, n, r) {
	      return Ae(this, e, t, n, r);
	    }, one: function one(e, t, n, r) {
	      return Ae(this, e, t, n, r, 1);
	    }, off: function off(e, t, n) {
	      var r, i;if (e && e.preventDefault && e.handleObj) return r = e.handleObj, k(e.delegateTarget).off(r.namespace ? r.origType + "." + r.namespace : r.origType, r.selector, r.handler), this;if ("object" == (typeof e === "undefined" ? "undefined" : _typeof(e))) {
	        for (i in e) {
	          this.off(i, t, e[i]);
	        }return this;
	      }return !1 !== t && "function" != typeof t || (n = t, t = void 0), !1 === n && (n = Se), this.each(function () {
	        k.event.remove(this, e, n, t);
	      });
	    } });var je = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,
	      qe = /<script|<style|<link/i,
	      Le = /checked\s*(?:[^=]|=\s*.checked.)/i,
	      He = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;function Oe(e, t) {
	    return A(e, "table") && A(11 !== t.nodeType ? t : t.firstChild, "tr") && k(e).children("tbody")[0] || e;
	  }function Pe(e) {
	    return e.type = (null !== e.getAttribute("type")) + "/" + e.type, e;
	  }function Re(e) {
	    return "true/" === (e.type || "").slice(0, 5) ? e.type = e.type.slice(5) : e.removeAttribute("type"), e;
	  }function Me(e, t) {
	    var n, r, i, o, a, s, u, l;if (1 === t.nodeType) {
	      if (Q.hasData(e) && (o = Q.access(e), a = Q.set(t, o), l = o.events)) for (i in delete a.handle, a.events = {}, l) {
	        for (n = 0, r = l[i].length; n < r; n++) {
	          k.event.add(t, i, l[i][n]);
	        }
	      }J.hasData(e) && (s = J.access(e), u = k.extend({}, s), J.set(t, u));
	    }
	  }function Ie(n, r, i, o) {
	    r = g.apply([], r);var e,
	        t,
	        a,
	        s,
	        u,
	        l,
	        c = 0,
	        f = n.length,
	        p = f - 1,
	        d = r[0],
	        h = m(d);if (h || 1 < f && "string" == typeof d && !y.checkClone && Le.test(d)) return n.each(function (e) {
	      var t = n.eq(e);h && (r[0] = d.call(this, e, t.html())), Ie(t, r, i, o);
	    });if (f && (t = (e = we(r, n[0].ownerDocument, !1, n, o)).firstChild, 1 === e.childNodes.length && (e = t), t || o)) {
	      for (s = (a = k.map(ve(e, "script"), Pe)).length; c < f; c++) {
	        u = e, c !== p && (u = k.clone(u, !0, !0), s && k.merge(a, ve(u, "script"))), i.call(n[c], u, c);
	      }if (s) for (l = a[a.length - 1].ownerDocument, k.map(a, Re), c = 0; c < s; c++) {
	        u = a[c], he.test(u.type || "") && !Q.access(u, "globalEval") && k.contains(l, u) && (u.src && "module" !== (u.type || "").toLowerCase() ? k._evalUrl && !u.noModule && k._evalUrl(u.src, { nonce: u.nonce || u.getAttribute("nonce") }) : b(u.textContent.replace(He, ""), u, l));
	      }
	    }return n;
	  }function We(e, t, n) {
	    for (var r, i = t ? k.filter(t, e) : e, o = 0; null != (r = i[o]); o++) {
	      n || 1 !== r.nodeType || k.cleanData(ve(r)), r.parentNode && (n && oe(r) && ye(ve(r, "script")), r.parentNode.removeChild(r));
	    }return e;
	  }k.extend({ htmlPrefilter: function htmlPrefilter(e) {
	      return e.replace(je, "<$1></$2>");
	    }, clone: function clone(e, t, n) {
	      var r,
	          i,
	          o,
	          a,
	          s,
	          u,
	          l,
	          c = e.cloneNode(!0),
	          f = oe(e);if (!(y.noCloneChecked || 1 !== e.nodeType && 11 !== e.nodeType || k.isXMLDoc(e))) for (a = ve(c), r = 0, i = (o = ve(e)).length; r < i; r++) {
	        s = o[r], u = a[r], void 0, "input" === (l = u.nodeName.toLowerCase()) && pe.test(s.type) ? u.checked = s.checked : "input" !== l && "textarea" !== l || (u.defaultValue = s.defaultValue);
	      }if (t) if (n) for (o = o || ve(e), a = a || ve(c), r = 0, i = o.length; r < i; r++) {
	        Me(o[r], a[r]);
	      } else Me(e, c);return 0 < (a = ve(c, "script")).length && ye(a, !f && ve(e, "script")), c;
	    }, cleanData: function cleanData(e) {
	      for (var t, n, r, i = k.event.special, o = 0; void 0 !== (n = e[o]); o++) {
	        if (G(n)) {
	          if (t = n[Q.expando]) {
	            if (t.events) for (r in t.events) {
	              i[r] ? k.event.remove(n, r) : k.removeEvent(n, r, t.handle);
	            }n[Q.expando] = void 0;
	          }n[J.expando] && (n[J.expando] = void 0);
	        }
	      }
	    } }), k.fn.extend({ detach: function detach(e) {
	      return We(this, e, !0);
	    }, remove: function remove(e) {
	      return We(this, e);
	    }, text: function text(e) {
	      return _(this, function (e) {
	        return void 0 === e ? k.text(this) : this.empty().each(function () {
	          1 !== this.nodeType && 11 !== this.nodeType && 9 !== this.nodeType || (this.textContent = e);
	        });
	      }, null, e, arguments.length);
	    }, append: function append() {
	      return Ie(this, arguments, function (e) {
	        1 !== this.nodeType && 11 !== this.nodeType && 9 !== this.nodeType || Oe(this, e).appendChild(e);
	      });
	    }, prepend: function prepend() {
	      return Ie(this, arguments, function (e) {
	        if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
	          var t = Oe(this, e);t.insertBefore(e, t.firstChild);
	        }
	      });
	    }, before: function before() {
	      return Ie(this, arguments, function (e) {
	        this.parentNode && this.parentNode.insertBefore(e, this);
	      });
	    }, after: function after() {
	      return Ie(this, arguments, function (e) {
	        this.parentNode && this.parentNode.insertBefore(e, this.nextSibling);
	      });
	    }, empty: function empty() {
	      for (var e, t = 0; null != (e = this[t]); t++) {
	        1 === e.nodeType && (k.cleanData(ve(e, !1)), e.textContent = "");
	      }return this;
	    }, clone: function clone(e, t) {
	      return e = null != e && e, t = null == t ? e : t, this.map(function () {
	        return k.clone(this, e, t);
	      });
	    }, html: function html(e) {
	      return _(this, function (e) {
	        var t = this[0] || {},
	            n = 0,
	            r = this.length;if (void 0 === e && 1 === t.nodeType) return t.innerHTML;if ("string" == typeof e && !qe.test(e) && !ge[(de.exec(e) || ["", ""])[1].toLowerCase()]) {
	          e = k.htmlPrefilter(e);try {
	            for (; n < r; n++) {
	              1 === (t = this[n] || {}).nodeType && (k.cleanData(ve(t, !1)), t.innerHTML = e);
	            }t = 0;
	          } catch (e) {}
	        }t && this.empty().append(e);
	      }, null, e, arguments.length);
	    }, replaceWith: function replaceWith() {
	      var n = [];return Ie(this, arguments, function (e) {
	        var t = this.parentNode;k.inArray(this, n) < 0 && (k.cleanData(ve(this)), t && t.replaceChild(e, this));
	      }, n);
	    } }), k.each({ appendTo: "append", prependTo: "prepend", insertBefore: "before", insertAfter: "after", replaceAll: "replaceWith" }, function (e, a) {
	    k.fn[e] = function (e) {
	      for (var t, n = [], r = k(e), i = r.length - 1, o = 0; o <= i; o++) {
	        t = o === i ? this : this.clone(!0), k(r[o])[a](t), u.apply(n, t.get());
	      }return this.pushStack(n);
	    };
	  });var $e = new RegExp("^(" + te + ")(?!px)[a-z%]+$", "i"),
	      Fe = function Fe(e) {
	    var t = e.ownerDocument.defaultView;return t && t.opener || (t = C), t.getComputedStyle(e);
	  },
	      Be = new RegExp(re.join("|"), "i");function _e(e, t, n) {
	    var r,
	        i,
	        o,
	        a,
	        s = e.style;return (n = n || Fe(e)) && ("" !== (a = n.getPropertyValue(t) || n[t]) || oe(e) || (a = k.style(e, t)), !y.pixelBoxStyles() && $e.test(a) && Be.test(t) && (r = s.width, i = s.minWidth, o = s.maxWidth, s.minWidth = s.maxWidth = s.width = a, a = n.width, s.width = r, s.minWidth = i, s.maxWidth = o)), void 0 !== a ? a + "" : a;
	  }function ze(e, t) {
	    return { get: function get() {
	        if (!e()) return (this.get = t).apply(this, arguments);delete this.get;
	      } };
	  }!function () {
	    function e() {
	      if (u) {
	        s.style.cssText = "position:absolute;left:-11111px;width:60px;margin-top:1px;padding:0;border:0", u.style.cssText = "position:relative;display:block;box-sizing:border-box;overflow:scroll;margin:auto;border:1px;padding:1px;width:60%;top:1%", ie.appendChild(s).appendChild(u);var e = C.getComputedStyle(u);n = "1%" !== e.top, a = 12 === t(e.marginLeft), u.style.right = "60%", o = 36 === t(e.right), r = 36 === t(e.width), u.style.position = "absolute", i = 12 === t(u.offsetWidth / 3), ie.removeChild(s), u = null;
	      }
	    }function t(e) {
	      return Math.round(parseFloat(e));
	    }var n,
	        r,
	        i,
	        o,
	        a,
	        s = E.createElement("div"),
	        u = E.createElement("div");u.style && (u.style.backgroundClip = "content-box", u.cloneNode(!0).style.backgroundClip = "", y.clearCloneStyle = "content-box" === u.style.backgroundClip, k.extend(y, { boxSizingReliable: function boxSizingReliable() {
	        return e(), r;
	      }, pixelBoxStyles: function pixelBoxStyles() {
	        return e(), o;
	      }, pixelPosition: function pixelPosition() {
	        return e(), n;
	      }, reliableMarginLeft: function reliableMarginLeft() {
	        return e(), a;
	      }, scrollboxSize: function scrollboxSize() {
	        return e(), i;
	      } }));
	  }();var Ue = ["Webkit", "Moz", "ms"],
	      Xe = E.createElement("div").style,
	      Ve = {};function Ge(e) {
	    var t = k.cssProps[e] || Ve[e];return t || (e in Xe ? e : Ve[e] = function (e) {
	      var t = e[0].toUpperCase() + e.slice(1),
	          n = Ue.length;while (n--) {
	        if ((e = Ue[n] + t) in Xe) return e;
	      }
	    }(e) || e);
	  }var Ye = /^(none|table(?!-c[ea]).+)/,
	      Qe = /^--/,
	      Je = { position: "absolute", visibility: "hidden", display: "block" },
	      Ke = { letterSpacing: "0", fontWeight: "400" };function Ze(e, t, n) {
	    var r = ne.exec(t);return r ? Math.max(0, r[2] - (n || 0)) + (r[3] || "px") : t;
	  }function et(e, t, n, r, i, o) {
	    var a = "width" === t ? 1 : 0,
	        s = 0,
	        u = 0;if (n === (r ? "border" : "content")) return 0;for (; a < 4; a += 2) {
	      "margin" === n && (u += k.css(e, n + re[a], !0, i)), r ? ("content" === n && (u -= k.css(e, "padding" + re[a], !0, i)), "margin" !== n && (u -= k.css(e, "border" + re[a] + "Width", !0, i))) : (u += k.css(e, "padding" + re[a], !0, i), "padding" !== n ? u += k.css(e, "border" + re[a] + "Width", !0, i) : s += k.css(e, "border" + re[a] + "Width", !0, i));
	    }return !r && 0 <= o && (u += Math.max(0, Math.ceil(e["offset" + t[0].toUpperCase() + t.slice(1)] - o - u - s - .5)) || 0), u;
	  }function tt(e, t, n) {
	    var r = Fe(e),
	        i = (!y.boxSizingReliable() || n) && "border-box" === k.css(e, "boxSizing", !1, r),
	        o = i,
	        a = _e(e, t, r),
	        s = "offset" + t[0].toUpperCase() + t.slice(1);if ($e.test(a)) {
	      if (!n) return a;a = "auto";
	    }return (!y.boxSizingReliable() && i || "auto" === a || !parseFloat(a) && "inline" === k.css(e, "display", !1, r)) && e.getClientRects().length && (i = "border-box" === k.css(e, "boxSizing", !1, r), (o = s in e) && (a = e[s])), (a = parseFloat(a) || 0) + et(e, t, n || (i ? "border" : "content"), o, r, a) + "px";
	  }function nt(e, t, n, r, i) {
	    return new nt.prototype.init(e, t, n, r, i);
	  }k.extend({ cssHooks: { opacity: { get: function get(e, t) {
	          if (t) {
	            var n = _e(e, "opacity");return "" === n ? "1" : n;
	          }
	        } } }, cssNumber: { animationIterationCount: !0, columnCount: !0, fillOpacity: !0, flexGrow: !0, flexShrink: !0, fontWeight: !0, gridArea: !0, gridColumn: !0, gridColumnEnd: !0, gridColumnStart: !0, gridRow: !0, gridRowEnd: !0, gridRowStart: !0, lineHeight: !0, opacity: !0, order: !0, orphans: !0, widows: !0, zIndex: !0, zoom: !0 }, cssProps: {}, style: function style(e, t, n, r) {
	      if (e && 3 !== e.nodeType && 8 !== e.nodeType && e.style) {
	        var i,
	            o,
	            a,
	            s = V(t),
	            u = Qe.test(t),
	            l = e.style;if (u || (t = Ge(s)), a = k.cssHooks[t] || k.cssHooks[s], void 0 === n) return a && "get" in a && void 0 !== (i = a.get(e, !1, r)) ? i : l[t];"string" === (o = typeof n === "undefined" ? "undefined" : _typeof(n)) && (i = ne.exec(n)) && i[1] && (n = le(e, t, i), o = "number"), null != n && n == n && ("number" !== o || u || (n += i && i[3] || (k.cssNumber[s] ? "" : "px")), y.clearCloneStyle || "" !== n || 0 !== t.indexOf("background") || (l[t] = "inherit"), a && "set" in a && void 0 === (n = a.set(e, n, r)) || (u ? l.setProperty(t, n) : l[t] = n));
	      }
	    }, css: function css(e, t, n, r) {
	      var i,
	          o,
	          a,
	          s = V(t);return Qe.test(t) || (t = Ge(s)), (a = k.cssHooks[t] || k.cssHooks[s]) && "get" in a && (i = a.get(e, !0, n)), void 0 === i && (i = _e(e, t, r)), "normal" === i && t in Ke && (i = Ke[t]), "" === n || n ? (o = parseFloat(i), !0 === n || isFinite(o) ? o || 0 : i) : i;
	    } }), k.each(["height", "width"], function (e, u) {
	    k.cssHooks[u] = { get: function get(e, t, n) {
	        if (t) return !Ye.test(k.css(e, "display")) || e.getClientRects().length && e.getBoundingClientRect().width ? tt(e, u, n) : ue(e, Je, function () {
	          return tt(e, u, n);
	        });
	      }, set: function set(e, t, n) {
	        var r,
	            i = Fe(e),
	            o = !y.scrollboxSize() && "absolute" === i.position,
	            a = (o || n) && "border-box" === k.css(e, "boxSizing", !1, i),
	            s = n ? et(e, u, n, a, i) : 0;return a && o && (s -= Math.ceil(e["offset" + u[0].toUpperCase() + u.slice(1)] - parseFloat(i[u]) - et(e, u, "border", !1, i) - .5)), s && (r = ne.exec(t)) && "px" !== (r[3] || "px") && (e.style[u] = t, t = k.css(e, u)), Ze(0, t, s);
	      } };
	  }), k.cssHooks.marginLeft = ze(y.reliableMarginLeft, function (e, t) {
	    if (t) return (parseFloat(_e(e, "marginLeft")) || e.getBoundingClientRect().left - ue(e, { marginLeft: 0 }, function () {
	      return e.getBoundingClientRect().left;
	    })) + "px";
	  }), k.each({ margin: "", padding: "", border: "Width" }, function (i, o) {
	    k.cssHooks[i + o] = { expand: function expand(e) {
	        for (var t = 0, n = {}, r = "string" == typeof e ? e.split(" ") : [e]; t < 4; t++) {
	          n[i + re[t] + o] = r[t] || r[t - 2] || r[0];
	        }return n;
	      } }, "margin" !== i && (k.cssHooks[i + o].set = Ze);
	  }), k.fn.extend({ css: function css(e, t) {
	      return _(this, function (e, t, n) {
	        var r,
	            i,
	            o = {},
	            a = 0;if (Array.isArray(t)) {
	          for (r = Fe(e), i = t.length; a < i; a++) {
	            o[t[a]] = k.css(e, t[a], !1, r);
	          }return o;
	        }return void 0 !== n ? k.style(e, t, n) : k.css(e, t);
	      }, e, t, 1 < arguments.length);
	    } }), ((k.Tween = nt).prototype = { constructor: nt, init: function init(e, t, n, r, i, o) {
	      this.elem = e, this.prop = n, this.easing = i || k.easing._default, this.options = t, this.start = this.now = this.cur(), this.end = r, this.unit = o || (k.cssNumber[n] ? "" : "px");
	    }, cur: function cur() {
	      var e = nt.propHooks[this.prop];return e && e.get ? e.get(this) : nt.propHooks._default.get(this);
	    }, run: function run(e) {
	      var t,
	          n = nt.propHooks[this.prop];return this.options.duration ? this.pos = t = k.easing[this.easing](e, this.options.duration * e, 0, 1, this.options.duration) : this.pos = t = e, this.now = (this.end - this.start) * t + this.start, this.options.step && this.options.step.call(this.elem, this.now, this), n && n.set ? n.set(this) : nt.propHooks._default.set(this), this;
	    } }).init.prototype = nt.prototype, (nt.propHooks = { _default: { get: function get(e) {
	        var t;return 1 !== e.elem.nodeType || null != e.elem[e.prop] && null == e.elem.style[e.prop] ? e.elem[e.prop] : (t = k.css(e.elem, e.prop, "")) && "auto" !== t ? t : 0;
	      }, set: function set(e) {
	        k.fx.step[e.prop] ? k.fx.step[e.prop](e) : 1 !== e.elem.nodeType || !k.cssHooks[e.prop] && null == e.elem.style[Ge(e.prop)] ? e.elem[e.prop] = e.now : k.style(e.elem, e.prop, e.now + e.unit);
	      } } }).scrollTop = nt.propHooks.scrollLeft = { set: function set(e) {
	      e.elem.nodeType && e.elem.parentNode && (e.elem[e.prop] = e.now);
	    } }, k.easing = { linear: function linear(e) {
	      return e;
	    }, swing: function swing(e) {
	      return .5 - Math.cos(e * Math.PI) / 2;
	    }, _default: "swing" }, k.fx = nt.prototype.init, k.fx.step = {};var rt,
	      it,
	      ot,
	      at,
	      st = /^(?:toggle|show|hide)$/,
	      ut = /queueHooks$/;function lt() {
	    it && (!1 === E.hidden && C.requestAnimationFrame ? C.requestAnimationFrame(lt) : C.setTimeout(lt, k.fx.interval), k.fx.tick());
	  }function ct() {
	    return C.setTimeout(function () {
	      rt = void 0;
	    }), rt = Date.now();
	  }function ft(e, t) {
	    var n,
	        r = 0,
	        i = { height: e };for (t = t ? 1 : 0; r < 4; r += 2 - t) {
	      i["margin" + (n = re[r])] = i["padding" + n] = e;
	    }return t && (i.opacity = i.width = e), i;
	  }function pt(e, t, n) {
	    for (var r, i = (dt.tweeners[t] || []).concat(dt.tweeners["*"]), o = 0, a = i.length; o < a; o++) {
	      if (r = i[o].call(n, t, e)) return r;
	    }
	  }function dt(o, e, t) {
	    var n,
	        a,
	        r = 0,
	        i = dt.prefilters.length,
	        s = k.Deferred().always(function () {
	      delete u.elem;
	    }),
	        u = function u() {
	      if (a) return !1;for (var e = rt || ct(), t = Math.max(0, l.startTime + l.duration - e), n = 1 - (t / l.duration || 0), r = 0, i = l.tweens.length; r < i; r++) {
	        l.tweens[r].run(n);
	      }return s.notifyWith(o, [l, n, t]), n < 1 && i ? t : (i || s.notifyWith(o, [l, 1, 0]), s.resolveWith(o, [l]), !1);
	    },
	        l = s.promise({ elem: o, props: k.extend({}, e), opts: k.extend(!0, { specialEasing: {}, easing: k.easing._default }, t), originalProperties: e, originalOptions: t, startTime: rt || ct(), duration: t.duration, tweens: [], createTween: function createTween(e, t) {
	        var n = k.Tween(o, l.opts, e, t, l.opts.specialEasing[e] || l.opts.easing);return l.tweens.push(n), n;
	      }, stop: function stop(e) {
	        var t = 0,
	            n = e ? l.tweens.length : 0;if (a) return this;for (a = !0; t < n; t++) {
	          l.tweens[t].run(1);
	        }return e ? (s.notifyWith(o, [l, 1, 0]), s.resolveWith(o, [l, e])) : s.rejectWith(o, [l, e]), this;
	      } }),
	        c = l.props;for (!function (e, t) {
	      var n, r, i, o, a;for (n in e) {
	        if (i = t[r = V(n)], o = e[n], Array.isArray(o) && (i = o[1], o = e[n] = o[0]), n !== r && (e[r] = o, delete e[n]), (a = k.cssHooks[r]) && ("expand" in a)) for (n in o = a.expand(o), delete e[r], o) {
	          (n in e) || (e[n] = o[n], t[n] = i);
	        } else t[r] = i;
	      }
	    }(c, l.opts.specialEasing); r < i; r++) {
	      if (n = dt.prefilters[r].call(l, o, c, l.opts)) return m(n.stop) && (k._queueHooks(l.elem, l.opts.queue).stop = n.stop.bind(n)), n;
	    }return k.map(c, pt, l), m(l.opts.start) && l.opts.start.call(o, l), l.progress(l.opts.progress).done(l.opts.done, l.opts.complete).fail(l.opts.fail).always(l.opts.always), k.fx.timer(k.extend(u, { elem: o, anim: l, queue: l.opts.queue })), l;
	  }k.Animation = k.extend(dt, { tweeners: { "*": [function (e, t) {
	        var n = this.createTween(e, t);return le(n.elem, e, ne.exec(t), n), n;
	      }] }, tweener: function tweener(e, t) {
	      m(e) ? (t = e, e = ["*"]) : e = e.match(R);for (var n, r = 0, i = e.length; r < i; r++) {
	        n = e[r], dt.tweeners[n] = dt.tweeners[n] || [], dt.tweeners[n].unshift(t);
	      }
	    }, prefilters: [function (e, t, n) {
	      var r,
	          i,
	          o,
	          a,
	          s,
	          u,
	          l,
	          c,
	          f = "width" in t || "height" in t,
	          p = this,
	          d = {},
	          h = e.style,
	          g = e.nodeType && se(e),
	          v = Q.get(e, "fxshow");for (r in n.queue || (null == (a = k._queueHooks(e, "fx")).unqueued && (a.unqueued = 0, s = a.empty.fire, a.empty.fire = function () {
	        a.unqueued || s();
	      }), a.unqueued++, p.always(function () {
	        p.always(function () {
	          a.unqueued--, k.queue(e, "fx").length || a.empty.fire();
	        });
	      })), t) {
	        if (i = t[r], st.test(i)) {
	          if (delete t[r], o = o || "toggle" === i, i === (g ? "hide" : "show")) {
	            if ("show" !== i || !v || void 0 === v[r]) continue;g = !0;
	          }d[r] = v && v[r] || k.style(e, r);
	        }
	      }if ((u = !k.isEmptyObject(t)) || !k.isEmptyObject(d)) for (r in f && 1 === e.nodeType && (n.overflow = [h.overflow, h.overflowX, h.overflowY], null == (l = v && v.display) && (l = Q.get(e, "display")), "none" === (c = k.css(e, "display")) && (l ? c = l : (fe([e], !0), l = e.style.display || l, c = k.css(e, "display"), fe([e]))), ("inline" === c || "inline-block" === c && null != l) && "none" === k.css(e, "float") && (u || (p.done(function () {
	        h.display = l;
	      }), null == l && (c = h.display, l = "none" === c ? "" : c)), h.display = "inline-block")), n.overflow && (h.overflow = "hidden", p.always(function () {
	        h.overflow = n.overflow[0], h.overflowX = n.overflow[1], h.overflowY = n.overflow[2];
	      })), u = !1, d) {
	        u || (v ? "hidden" in v && (g = v.hidden) : v = Q.access(e, "fxshow", { display: l }), o && (v.hidden = !g), g && fe([e], !0), p.done(function () {
	          for (r in g || fe([e]), Q.remove(e, "fxshow"), d) {
	            k.style(e, r, d[r]);
	          }
	        })), u = pt(g ? v[r] : 0, r, p), r in v || (v[r] = u.start, g && (u.end = u.start, u.start = 0));
	      }
	    }], prefilter: function prefilter(e, t) {
	      t ? dt.prefilters.unshift(e) : dt.prefilters.push(e);
	    } }), k.speed = function (e, t, n) {
	    var r = e && "object" == (typeof e === "undefined" ? "undefined" : _typeof(e)) ? k.extend({}, e) : { complete: n || !n && t || m(e) && e, duration: e, easing: n && t || t && !m(t) && t };return k.fx.off ? r.duration = 0 : "number" != typeof r.duration && (r.duration in k.fx.speeds ? r.duration = k.fx.speeds[r.duration] : r.duration = k.fx.speeds._default), null != r.queue && !0 !== r.queue || (r.queue = "fx"), r.old = r.complete, r.complete = function () {
	      m(r.old) && r.old.call(this), r.queue && k.dequeue(this, r.queue);
	    }, r;
	  }, k.fn.extend({ fadeTo: function fadeTo(e, t, n, r) {
	      return this.filter(se).css("opacity", 0).show().end().animate({ opacity: t }, e, n, r);
	    }, animate: function animate(t, e, n, r) {
	      var i = k.isEmptyObject(t),
	          o = k.speed(e, n, r),
	          a = function a() {
	        var e = dt(this, k.extend({}, t), o);(i || Q.get(this, "finish")) && e.stop(!0);
	      };return a.finish = a, i || !1 === o.queue ? this.each(a) : this.queue(o.queue, a);
	    }, stop: function stop(i, e, o) {
	      var a = function a(e) {
	        var t = e.stop;delete e.stop, t(o);
	      };return "string" != typeof i && (o = e, e = i, i = void 0), e && !1 !== i && this.queue(i || "fx", []), this.each(function () {
	        var e = !0,
	            t = null != i && i + "queueHooks",
	            n = k.timers,
	            r = Q.get(this);if (t) r[t] && r[t].stop && a(r[t]);else for (t in r) {
	          r[t] && r[t].stop && ut.test(t) && a(r[t]);
	        }for (t = n.length; t--;) {
	          n[t].elem !== this || null != i && n[t].queue !== i || (n[t].anim.stop(o), e = !1, n.splice(t, 1));
	        }!e && o || k.dequeue(this, i);
	      });
	    }, finish: function finish(a) {
	      return !1 !== a && (a = a || "fx"), this.each(function () {
	        var e,
	            t = Q.get(this),
	            n = t[a + "queue"],
	            r = t[a + "queueHooks"],
	            i = k.timers,
	            o = n ? n.length : 0;for (t.finish = !0, k.queue(this, a, []), r && r.stop && r.stop.call(this, !0), e = i.length; e--;) {
	          i[e].elem === this && i[e].queue === a && (i[e].anim.stop(!0), i.splice(e, 1));
	        }for (e = 0; e < o; e++) {
	          n[e] && n[e].finish && n[e].finish.call(this);
	        }delete t.finish;
	      });
	    } }), k.each(["toggle", "show", "hide"], function (e, r) {
	    var i = k.fn[r];k.fn[r] = function (e, t, n) {
	      return null == e || "boolean" == typeof e ? i.apply(this, arguments) : this.animate(ft(r, !0), e, t, n);
	    };
	  }), k.each({ slideDown: ft("show"), slideUp: ft("hide"), slideToggle: ft("toggle"), fadeIn: { opacity: "show" }, fadeOut: { opacity: "hide" }, fadeToggle: { opacity: "toggle" } }, function (e, r) {
	    k.fn[e] = function (e, t, n) {
	      return this.animate(r, e, t, n);
	    };
	  }), k.timers = [], k.fx.tick = function () {
	    var e,
	        t = 0,
	        n = k.timers;for (rt = Date.now(); t < n.length; t++) {
	      (e = n[t])() || n[t] !== e || n.splice(t--, 1);
	    }n.length || k.fx.stop(), rt = void 0;
	  }, k.fx.timer = function (e) {
	    k.timers.push(e), k.fx.start();
	  }, k.fx.interval = 13, k.fx.start = function () {
	    it || (it = !0, lt());
	  }, k.fx.stop = function () {
	    it = null;
	  }, k.fx.speeds = { slow: 600, fast: 200, _default: 400 }, k.fn.delay = function (r, e) {
	    return r = k.fx && k.fx.speeds[r] || r, e = e || "fx", this.queue(e, function (e, t) {
	      var n = C.setTimeout(e, r);t.stop = function () {
	        C.clearTimeout(n);
	      };
	    });
	  }, ot = E.createElement("input"), at = E.createElement("select").appendChild(E.createElement("option")), ot.type = "checkbox", y.checkOn = "" !== ot.value, y.optSelected = at.selected, (ot = E.createElement("input")).value = "t", ot.type = "radio", y.radioValue = "t" === ot.value;var ht,
	      gt = k.expr.attrHandle;k.fn.extend({ attr: function attr(e, t) {
	      return _(this, k.attr, e, t, 1 < arguments.length);
	    }, removeAttr: function removeAttr(e) {
	      return this.each(function () {
	        k.removeAttr(this, e);
	      });
	    } }), k.extend({ attr: function attr(e, t, n) {
	      var r,
	          i,
	          o = e.nodeType;if (3 !== o && 8 !== o && 2 !== o) return "undefined" == typeof e.getAttribute ? k.prop(e, t, n) : (1 === o && k.isXMLDoc(e) || (i = k.attrHooks[t.toLowerCase()] || (k.expr.match.bool.test(t) ? ht : void 0)), void 0 !== n ? null === n ? void k.removeAttr(e, t) : i && "set" in i && void 0 !== (r = i.set(e, n, t)) ? r : (e.setAttribute(t, n + ""), n) : i && "get" in i && null !== (r = i.get(e, t)) ? r : null == (r = k.find.attr(e, t)) ? void 0 : r);
	    }, attrHooks: { type: { set: function set(e, t) {
	          if (!y.radioValue && "radio" === t && A(e, "input")) {
	            var n = e.value;return e.setAttribute("type", t), n && (e.value = n), t;
	          }
	        } } }, removeAttr: function removeAttr(e, t) {
	      var n,
	          r = 0,
	          i = t && t.match(R);if (i && 1 === e.nodeType) while (n = i[r++]) {
	        e.removeAttribute(n);
	      }
	    } }), ht = { set: function set(e, t, n) {
	      return !1 === t ? k.removeAttr(e, n) : e.setAttribute(n, n), n;
	    } }, k.each(k.expr.match.bool.source.match(/\w+/g), function (e, t) {
	    var a = gt[t] || k.find.attr;gt[t] = function (e, t, n) {
	      var r,
	          i,
	          o = t.toLowerCase();return n || (i = gt[o], gt[o] = r, r = null != a(e, t, n) ? o : null, gt[o] = i), r;
	    };
	  });var vt = /^(?:input|select|textarea|button)$/i,
	      yt = /^(?:a|area)$/i;function mt(e) {
	    return (e.match(R) || []).join(" ");
	  }function xt(e) {
	    return e.getAttribute && e.getAttribute("class") || "";
	  }function bt(e) {
	    return Array.isArray(e) ? e : "string" == typeof e && e.match(R) || [];
	  }k.fn.extend({ prop: function prop(e, t) {
	      return _(this, k.prop, e, t, 1 < arguments.length);
	    }, removeProp: function removeProp(e) {
	      return this.each(function () {
	        delete this[k.propFix[e] || e];
	      });
	    } }), k.extend({ prop: function prop(e, t, n) {
	      var r,
	          i,
	          o = e.nodeType;if (3 !== o && 8 !== o && 2 !== o) return 1 === o && k.isXMLDoc(e) || (t = k.propFix[t] || t, i = k.propHooks[t]), void 0 !== n ? i && "set" in i && void 0 !== (r = i.set(e, n, t)) ? r : e[t] = n : i && "get" in i && null !== (r = i.get(e, t)) ? r : e[t];
	    }, propHooks: { tabIndex: { get: function get(e) {
	          var t = k.find.attr(e, "tabindex");return t ? parseInt(t, 10) : vt.test(e.nodeName) || yt.test(e.nodeName) && e.href ? 0 : -1;
	        } } }, propFix: { "for": "htmlFor", "class": "className" } }), y.optSelected || (k.propHooks.selected = { get: function get(e) {
	      var t = e.parentNode;return t && t.parentNode && t.parentNode.selectedIndex, null;
	    }, set: function set(e) {
	      var t = e.parentNode;t && (t.selectedIndex, t.parentNode && t.parentNode.selectedIndex);
	    } }), k.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function () {
	    k.propFix[this.toLowerCase()] = this;
	  }), k.fn.extend({ addClass: function addClass(t) {
	      var e,
	          n,
	          r,
	          i,
	          o,
	          a,
	          s,
	          u = 0;if (m(t)) return this.each(function (e) {
	        k(this).addClass(t.call(this, e, xt(this)));
	      });if ((e = bt(t)).length) while (n = this[u++]) {
	        if (i = xt(n), r = 1 === n.nodeType && " " + mt(i) + " ") {
	          a = 0;while (o = e[a++]) {
	            r.indexOf(" " + o + " ") < 0 && (r += o + " ");
	          }i !== (s = mt(r)) && n.setAttribute("class", s);
	        }
	      }return this;
	    }, removeClass: function removeClass(t) {
	      var e,
	          n,
	          r,
	          i,
	          o,
	          a,
	          s,
	          u = 0;if (m(t)) return this.each(function (e) {
	        k(this).removeClass(t.call(this, e, xt(this)));
	      });if (!arguments.length) return this.attr("class", "");if ((e = bt(t)).length) while (n = this[u++]) {
	        if (i = xt(n), r = 1 === n.nodeType && " " + mt(i) + " ") {
	          a = 0;while (o = e[a++]) {
	            while (-1 < r.indexOf(" " + o + " ")) {
	              r = r.replace(" " + o + " ", " ");
	            }
	          }i !== (s = mt(r)) && n.setAttribute("class", s);
	        }
	      }return this;
	    }, toggleClass: function toggleClass(i, t) {
	      var o = typeof i === "undefined" ? "undefined" : _typeof(i),
	          a = "string" === o || Array.isArray(i);return "boolean" == typeof t && a ? t ? this.addClass(i) : this.removeClass(i) : m(i) ? this.each(function (e) {
	        k(this).toggleClass(i.call(this, e, xt(this), t), t);
	      }) : this.each(function () {
	        var e, t, n, r;if (a) {
	          t = 0, n = k(this), r = bt(i);while (e = r[t++]) {
	            n.hasClass(e) ? n.removeClass(e) : n.addClass(e);
	          }
	        } else void 0 !== i && "boolean" !== o || ((e = xt(this)) && Q.set(this, "__className__", e), this.setAttribute && this.setAttribute("class", e || !1 === i ? "" : Q.get(this, "__className__") || ""));
	      });
	    }, hasClass: function hasClass(e) {
	      var t,
	          n,
	          r = 0;t = " " + e + " ";while (n = this[r++]) {
	        if (1 === n.nodeType && -1 < (" " + mt(xt(n)) + " ").indexOf(t)) return !0;
	      }return !1;
	    } });var wt = /\r/g;k.fn.extend({ val: function val(n) {
	      var r,
	          e,
	          i,
	          t = this[0];return arguments.length ? (i = m(n), this.each(function (e) {
	        var t;1 === this.nodeType && (null == (t = i ? n.call(this, e, k(this).val()) : n) ? t = "" : "number" == typeof t ? t += "" : Array.isArray(t) && (t = k.map(t, function (e) {
	          return null == e ? "" : e + "";
	        })), (r = k.valHooks[this.type] || k.valHooks[this.nodeName.toLowerCase()]) && "set" in r && void 0 !== r.set(this, t, "value") || (this.value = t));
	      })) : t ? (r = k.valHooks[t.type] || k.valHooks[t.nodeName.toLowerCase()]) && "get" in r && void 0 !== (e = r.get(t, "value")) ? e : "string" == typeof (e = t.value) ? e.replace(wt, "") : null == e ? "" : e : void 0;
	    } }), k.extend({ valHooks: { option: { get: function get(e) {
	          var t = k.find.attr(e, "value");return null != t ? t : mt(k.text(e));
	        } }, select: { get: function get(e) {
	          var t,
	              n,
	              r,
	              i = e.options,
	              o = e.selectedIndex,
	              a = "select-one" === e.type,
	              s = a ? null : [],
	              u = a ? o + 1 : i.length;for (r = o < 0 ? u : a ? o : 0; r < u; r++) {
	            if (((n = i[r]).selected || r === o) && !n.disabled && (!n.parentNode.disabled || !A(n.parentNode, "optgroup"))) {
	              if (t = k(n).val(), a) return t;s.push(t);
	            }
	          }return s;
	        }, set: function set(e, t) {
	          var n,
	              r,
	              i = e.options,
	              o = k.makeArray(t),
	              a = i.length;while (a--) {
	            ((r = i[a]).selected = -1 < k.inArray(k.valHooks.option.get(r), o)) && (n = !0);
	          }return n || (e.selectedIndex = -1), o;
	        } } } }), k.each(["radio", "checkbox"], function () {
	    k.valHooks[this] = { set: function set(e, t) {
	        if (Array.isArray(t)) return e.checked = -1 < k.inArray(k(e).val(), t);
	      } }, y.checkOn || (k.valHooks[this].get = function (e) {
	      return null === e.getAttribute("value") ? "on" : e.value;
	    });
	  }), y.focusin = "onfocusin" in C;var Tt = /^(?:focusinfocus|focusoutblur)$/,
	      Ct = function Ct(e) {
	    e.stopPropagation();
	  };k.extend(k.event, { trigger: function trigger(e, t, n, r) {
	      var i,
	          o,
	          a,
	          s,
	          u,
	          l,
	          c,
	          f,
	          p = [n || E],
	          d = v.call(e, "type") ? e.type : e,
	          h = v.call(e, "namespace") ? e.namespace.split(".") : [];if (o = f = a = n = n || E, 3 !== n.nodeType && 8 !== n.nodeType && !Tt.test(d + k.event.triggered) && (-1 < d.indexOf(".") && (d = (h = d.split(".")).shift(), h.sort()), u = d.indexOf(":") < 0 && "on" + d, (e = e[k.expando] ? e : new k.Event(d, "object" == (typeof e === "undefined" ? "undefined" : _typeof(e)) && e)).isTrigger = r ? 2 : 3, e.namespace = h.join("."), e.rnamespace = e.namespace ? new RegExp("(^|\\.)" + h.join("\\.(?:.*\\.|)") + "(\\.|$)") : null, e.result = void 0, e.target || (e.target = n), t = null == t ? [e] : k.makeArray(t, [e]), c = k.event.special[d] || {}, r || !c.trigger || !1 !== c.trigger.apply(n, t))) {
	        if (!r && !c.noBubble && !x(n)) {
	          for (s = c.delegateType || d, Tt.test(s + d) || (o = o.parentNode); o; o = o.parentNode) {
	            p.push(o), a = o;
	          }a === (n.ownerDocument || E) && p.push(a.defaultView || a.parentWindow || C);
	        }i = 0;while ((o = p[i++]) && !e.isPropagationStopped()) {
	          f = o, e.type = 1 < i ? s : c.bindType || d, (l = (Q.get(o, "events") || {})[e.type] && Q.get(o, "handle")) && l.apply(o, t), (l = u && o[u]) && l.apply && G(o) && (e.result = l.apply(o, t), !1 === e.result && e.preventDefault());
	        }return e.type = d, r || e.isDefaultPrevented() || c._default && !1 !== c._default.apply(p.pop(), t) || !G(n) || u && m(n[d]) && !x(n) && ((a = n[u]) && (n[u] = null), k.event.triggered = d, e.isPropagationStopped() && f.addEventListener(d, Ct), n[d](), e.isPropagationStopped() && f.removeEventListener(d, Ct), k.event.triggered = void 0, a && (n[u] = a)), e.result;
	      }
	    }, simulate: function simulate(e, t, n) {
	      var r = k.extend(new k.Event(), n, { type: e, isSimulated: !0 });k.event.trigger(r, null, t);
	    } }), k.fn.extend({ trigger: function trigger(e, t) {
	      return this.each(function () {
	        k.event.trigger(e, t, this);
	      });
	    }, triggerHandler: function triggerHandler(e, t) {
	      var n = this[0];if (n) return k.event.trigger(e, t, n, !0);
	    } }), y.focusin || k.each({ focus: "focusin", blur: "focusout" }, function (n, r) {
	    var i = function i(e) {
	      k.event.simulate(r, e.target, k.event.fix(e));
	    };k.event.special[r] = { setup: function setup() {
	        var e = this.ownerDocument || this,
	            t = Q.access(e, r);t || e.addEventListener(n, i, !0), Q.access(e, r, (t || 0) + 1);
	      }, teardown: function teardown() {
	        var e = this.ownerDocument || this,
	            t = Q.access(e, r) - 1;t ? Q.access(e, r, t) : (e.removeEventListener(n, i, !0), Q.remove(e, r));
	      } };
	  });var Et = C.location,
	      kt = Date.now(),
	      St = /\?/;k.parseXML = function (e) {
	    var t;if (!e || "string" != typeof e) return null;try {
	      t = new C.DOMParser().parseFromString(e, "text/xml");
	    } catch (e) {
	      t = void 0;
	    }return t && !t.getElementsByTagName("parsererror").length || k.error("Invalid XML: " + e), t;
	  };var Nt = /\[\]$/,
	      At = /\r?\n/g,
	      Dt = /^(?:submit|button|image|reset|file)$/i,
	      jt = /^(?:input|select|textarea|keygen)/i;function qt(n, e, r, i) {
	    var t;if (Array.isArray(e)) k.each(e, function (e, t) {
	      r || Nt.test(n) ? i(n, t) : qt(n + "[" + ("object" == (typeof t === "undefined" ? "undefined" : _typeof(t)) && null != t ? e : "") + "]", t, r, i);
	    });else if (r || "object" !== w(e)) i(n, e);else for (t in e) {
	      qt(n + "[" + t + "]", e[t], r, i);
	    }
	  }k.param = function (e, t) {
	    var n,
	        r = [],
	        i = function i(e, t) {
	      var n = m(t) ? t() : t;r[r.length] = encodeURIComponent(e) + "=" + encodeURIComponent(null == n ? "" : n);
	    };if (null == e) return "";if (Array.isArray(e) || e.jquery && !k.isPlainObject(e)) k.each(e, function () {
	      i(this.name, this.value);
	    });else for (n in e) {
	      qt(n, e[n], t, i);
	    }return r.join("&");
	  }, k.fn.extend({ serialize: function serialize() {
	      return k.param(this.serializeArray());
	    }, serializeArray: function serializeArray() {
	      return this.map(function () {
	        var e = k.prop(this, "elements");return e ? k.makeArray(e) : this;
	      }).filter(function () {
	        var e = this.type;return this.name && !k(this).is(":disabled") && jt.test(this.nodeName) && !Dt.test(e) && (this.checked || !pe.test(e));
	      }).map(function (e, t) {
	        var n = k(this).val();return null == n ? null : Array.isArray(n) ? k.map(n, function (e) {
	          return { name: t.name, value: e.replace(At, "\r\n") };
	        }) : { name: t.name, value: n.replace(At, "\r\n") };
	      }).get();
	    } });var Lt = /%20/g,
	      Ht = /#.*$/,
	      Ot = /([?&])_=[^&]*/,
	      Pt = /^(.*?):[ \t]*([^\r\n]*)$/gm,
	      Rt = /^(?:GET|HEAD)$/,
	      Mt = /^\/\//,
	      It = {},
	      Wt = {},
	      $t = "*/".concat("*"),
	      Ft = E.createElement("a");function Bt(o) {
	    return function (e, t) {
	      "string" != typeof e && (t = e, e = "*");var n,
	          r = 0,
	          i = e.toLowerCase().match(R) || [];if (m(t)) while (n = i[r++]) {
	        "+" === n[0] ? (n = n.slice(1) || "*", (o[n] = o[n] || []).unshift(t)) : (o[n] = o[n] || []).push(t);
	      }
	    };
	  }function _t(t, i, o, a) {
	    var s = {},
	        u = t === Wt;function l(e) {
	      var r;return s[e] = !0, k.each(t[e] || [], function (e, t) {
	        var n = t(i, o, a);return "string" != typeof n || u || s[n] ? u ? !(r = n) : void 0 : (i.dataTypes.unshift(n), l(n), !1);
	      }), r;
	    }return l(i.dataTypes[0]) || !s["*"] && l("*");
	  }function zt(e, t) {
	    var n,
	        r,
	        i = k.ajaxSettings.flatOptions || {};for (n in t) {
	      void 0 !== t[n] && ((i[n] ? e : r || (r = {}))[n] = t[n]);
	    }return r && k.extend(!0, e, r), e;
	  }Ft.href = Et.href, k.extend({ active: 0, lastModified: {}, etag: {}, ajaxSettings: { url: Et.href, type: "GET", isLocal: /^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(Et.protocol), global: !0, processData: !0, async: !0, contentType: "application/x-www-form-urlencoded; charset=UTF-8", accepts: { "*": $t, text: "text/plain", html: "text/html", xml: "application/xml, text/xml", json: "application/json, text/javascript" }, contents: { xml: /\bxml\b/, html: /\bhtml/, json: /\bjson\b/ }, responseFields: { xml: "responseXML", text: "responseText", json: "responseJSON" }, converters: { "* text": String, "text html": !0, "text json": JSON.parse, "text xml": k.parseXML }, flatOptions: { url: !0, context: !0 } }, ajaxSetup: function ajaxSetup(e, t) {
	      return t ? zt(zt(e, k.ajaxSettings), t) : zt(k.ajaxSettings, e);
	    }, ajaxPrefilter: Bt(It), ajaxTransport: Bt(Wt), ajax: function ajax(e, t) {
	      "object" == (typeof e === "undefined" ? "undefined" : _typeof(e)) && (t = e, e = void 0), t = t || {};var c,
	          f,
	          p,
	          n,
	          d,
	          r,
	          h,
	          g,
	          i,
	          o,
	          v = k.ajaxSetup({}, t),
	          y = v.context || v,
	          m = v.context && (y.nodeType || y.jquery) ? k(y) : k.event,
	          x = k.Deferred(),
	          b = k.Callbacks("once memory"),
	          w = v.statusCode || {},
	          a = {},
	          s = {},
	          u = "canceled",
	          T = { readyState: 0, getResponseHeader: function getResponseHeader(e) {
	          var t;if (h) {
	            if (!n) {
	              n = {};while (t = Pt.exec(p)) {
	                n[t[1].toLowerCase() + " "] = (n[t[1].toLowerCase() + " "] || []).concat(t[2]);
	              }
	            }t = n[e.toLowerCase() + " "];
	          }return null == t ? null : t.join(", ");
	        }, getAllResponseHeaders: function getAllResponseHeaders() {
	          return h ? p : null;
	        }, setRequestHeader: function setRequestHeader(e, t) {
	          return null == h && (e = s[e.toLowerCase()] = s[e.toLowerCase()] || e, a[e] = t), this;
	        }, overrideMimeType: function overrideMimeType(e) {
	          return null == h && (v.mimeType = e), this;
	        }, statusCode: function statusCode(e) {
	          var t;if (e) if (h) T.always(e[T.status]);else for (t in e) {
	            w[t] = [w[t], e[t]];
	          }return this;
	        }, abort: function abort(e) {
	          var t = e || u;return c && c.abort(t), l(0, t), this;
	        } };if (x.promise(T), v.url = ((e || v.url || Et.href) + "").replace(Mt, Et.protocol + "//"), v.type = t.method || t.type || v.method || v.type, v.dataTypes = (v.dataType || "*").toLowerCase().match(R) || [""], null == v.crossDomain) {
	        r = E.createElement("a");try {
	          r.href = v.url, r.href = r.href, v.crossDomain = Ft.protocol + "//" + Ft.host != r.protocol + "//" + r.host;
	        } catch (e) {
	          v.crossDomain = !0;
	        }
	      }if (v.data && v.processData && "string" != typeof v.data && (v.data = k.param(v.data, v.traditional)), _t(It, v, t, T), h) return T;for (i in (g = k.event && v.global) && 0 == k.active++ && k.event.trigger("ajaxStart"), v.type = v.type.toUpperCase(), v.hasContent = !Rt.test(v.type), f = v.url.replace(Ht, ""), v.hasContent ? v.data && v.processData && 0 === (v.contentType || "").indexOf("application/x-www-form-urlencoded") && (v.data = v.data.replace(Lt, "+")) : (o = v.url.slice(f.length), v.data && (v.processData || "string" == typeof v.data) && (f += (St.test(f) ? "&" : "?") + v.data, delete v.data), !1 === v.cache && (f = f.replace(Ot, "$1"), o = (St.test(f) ? "&" : "?") + "_=" + kt++ + o), v.url = f + o), v.ifModified && (k.lastModified[f] && T.setRequestHeader("If-Modified-Since", k.lastModified[f]), k.etag[f] && T.setRequestHeader("If-None-Match", k.etag[f])), (v.data && v.hasContent && !1 !== v.contentType || t.contentType) && T.setRequestHeader("Content-Type", v.contentType), T.setRequestHeader("Accept", v.dataTypes[0] && v.accepts[v.dataTypes[0]] ? v.accepts[v.dataTypes[0]] + ("*" !== v.dataTypes[0] ? ", " + $t + "; q=0.01" : "") : v.accepts["*"]), v.headers) {
	        T.setRequestHeader(i, v.headers[i]);
	      }if (v.beforeSend && (!1 === v.beforeSend.call(y, T, v) || h)) return T.abort();if (u = "abort", b.add(v.complete), T.done(v.success), T.fail(v.error), c = _t(Wt, v, t, T)) {
	        if (T.readyState = 1, g && m.trigger("ajaxSend", [T, v]), h) return T;v.async && 0 < v.timeout && (d = C.setTimeout(function () {
	          T.abort("timeout");
	        }, v.timeout));try {
	          h = !1, c.send(a, l);
	        } catch (e) {
	          if (h) throw e;l(-1, e);
	        }
	      } else l(-1, "No Transport");function l(e, t, n, r) {
	        var i,
	            o,
	            a,
	            s,
	            u,
	            l = t;h || (h = !0, d && C.clearTimeout(d), c = void 0, p = r || "", T.readyState = 0 < e ? 4 : 0, i = 200 <= e && e < 300 || 304 === e, n && (s = function (e, t, n) {
	          var r,
	              i,
	              o,
	              a,
	              s = e.contents,
	              u = e.dataTypes;while ("*" === u[0]) {
	            u.shift(), void 0 === r && (r = e.mimeType || t.getResponseHeader("Content-Type"));
	          }if (r) for (i in s) {
	            if (s[i] && s[i].test(r)) {
	              u.unshift(i);break;
	            }
	          }if (u[0] in n) o = u[0];else {
	            for (i in n) {
	              if (!u[0] || e.converters[i + " " + u[0]]) {
	                o = i;break;
	              }a || (a = i);
	            }o = o || a;
	          }if (o) return o !== u[0] && u.unshift(o), n[o];
	        }(v, T, n)), s = function (e, t, n, r) {
	          var i,
	              o,
	              a,
	              s,
	              u,
	              l = {},
	              c = e.dataTypes.slice();if (c[1]) for (a in e.converters) {
	            l[a.toLowerCase()] = e.converters[a];
	          }o = c.shift();while (o) {
	            if (e.responseFields[o] && (n[e.responseFields[o]] = t), !u && r && e.dataFilter && (t = e.dataFilter(t, e.dataType)), u = o, o = c.shift()) if ("*" === o) o = u;else if ("*" !== u && u !== o) {
	              if (!(a = l[u + " " + o] || l["* " + o])) for (i in l) {
	                if ((s = i.split(" "))[1] === o && (a = l[u + " " + s[0]] || l["* " + s[0]])) {
	                  !0 === a ? a = l[i] : !0 !== l[i] && (o = s[0], c.unshift(s[1]));break;
	                }
	              }if (!0 !== a) if (a && e["throws"]) t = a(t);else try {
	                t = a(t);
	              } catch (e) {
	                return { state: "parsererror", error: a ? e : "No conversion from " + u + " to " + o };
	              }
	            }
	          }return { state: "success", data: t };
	        }(v, s, T, i), i ? (v.ifModified && ((u = T.getResponseHeader("Last-Modified")) && (k.lastModified[f] = u), (u = T.getResponseHeader("etag")) && (k.etag[f] = u)), 204 === e || "HEAD" === v.type ? l = "nocontent" : 304 === e ? l = "notmodified" : (l = s.state, o = s.data, i = !(a = s.error))) : (a = l, !e && l || (l = "error", e < 0 && (e = 0))), T.status = e, T.statusText = (t || l) + "", i ? x.resolveWith(y, [o, l, T]) : x.rejectWith(y, [T, l, a]), T.statusCode(w), w = void 0, g && m.trigger(i ? "ajaxSuccess" : "ajaxError", [T, v, i ? o : a]), b.fireWith(y, [T, l]), g && (m.trigger("ajaxComplete", [T, v]), --k.active || k.event.trigger("ajaxStop")));
	      }return T;
	    }, getJSON: function getJSON(e, t, n) {
	      return k.get(e, t, n, "json");
	    }, getScript: function getScript(e, t) {
	      return k.get(e, void 0, t, "script");
	    } }), k.each(["get", "post"], function (e, i) {
	    k[i] = function (e, t, n, r) {
	      return m(t) && (r = r || n, n = t, t = void 0), k.ajax(k.extend({ url: e, type: i, dataType: r, data: t, success: n }, k.isPlainObject(e) && e));
	    };
	  }), k._evalUrl = function (e, t) {
	    return k.ajax({ url: e, type: "GET", dataType: "script", cache: !0, async: !1, global: !1, converters: { "text script": function textScript() {} }, dataFilter: function dataFilter(e) {
	        k.globalEval(e, t);
	      } });
	  }, k.fn.extend({ wrapAll: function wrapAll(e) {
	      var t;return this[0] && (m(e) && (e = e.call(this[0])), t = k(e, this[0].ownerDocument).eq(0).clone(!0), this[0].parentNode && t.insertBefore(this[0]), t.map(function () {
	        var e = this;while (e.firstElementChild) {
	          e = e.firstElementChild;
	        }return e;
	      }).append(this)), this;
	    }, wrapInner: function wrapInner(n) {
	      return m(n) ? this.each(function (e) {
	        k(this).wrapInner(n.call(this, e));
	      }) : this.each(function () {
	        var e = k(this),
	            t = e.contents();t.length ? t.wrapAll(n) : e.append(n);
	      });
	    }, wrap: function wrap(t) {
	      var n = m(t);return this.each(function (e) {
	        k(this).wrapAll(n ? t.call(this, e) : t);
	      });
	    }, unwrap: function unwrap(e) {
	      return this.parent(e).not("body").each(function () {
	        k(this).replaceWith(this.childNodes);
	      }), this;
	    } }), k.expr.pseudos.hidden = function (e) {
	    return !k.expr.pseudos.visible(e);
	  }, k.expr.pseudos.visible = function (e) {
	    return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
	  }, k.ajaxSettings.xhr = function () {
	    try {
	      return new C.XMLHttpRequest();
	    } catch (e) {}
	  };var Ut = { 0: 200, 1223: 204 },
	      Xt = k.ajaxSettings.xhr();y.cors = !!Xt && "withCredentials" in Xt, y.ajax = Xt = !!Xt, k.ajaxTransport(function (i) {
	    var _o, a;if (y.cors || Xt && !i.crossDomain) return { send: function send(e, t) {
	        var n,
	            r = i.xhr();if (r.open(i.type, i.url, i.async, i.username, i.password), i.xhrFields) for (n in i.xhrFields) {
	          r[n] = i.xhrFields[n];
	        }for (n in i.mimeType && r.overrideMimeType && r.overrideMimeType(i.mimeType), i.crossDomain || e["X-Requested-With"] || (e["X-Requested-With"] = "XMLHttpRequest"), e) {
	          r.setRequestHeader(n, e[n]);
	        }_o = function o(e) {
	          return function () {
	            _o && (_o = a = r.onload = r.onerror = r.onabort = r.ontimeout = r.onreadystatechange = null, "abort" === e ? r.abort() : "error" === e ? "number" != typeof r.status ? t(0, "error") : t(r.status, r.statusText) : t(Ut[r.status] || r.status, r.statusText, "text" !== (r.responseType || "text") || "string" != typeof r.responseText ? { binary: r.response } : { text: r.responseText }, r.getAllResponseHeaders()));
	          };
	        }, r.onload = _o(), a = r.onerror = r.ontimeout = _o("error"), void 0 !== r.onabort ? r.onabort = a : r.onreadystatechange = function () {
	          4 === r.readyState && C.setTimeout(function () {
	            _o && a();
	          });
	        }, _o = _o("abort");try {
	          r.send(i.hasContent && i.data || null);
	        } catch (e) {
	          if (_o) throw e;
	        }
	      }, abort: function abort() {
	        _o && _o();
	      } };
	  }), k.ajaxPrefilter(function (e) {
	    e.crossDomain && (e.contents.script = !1);
	  }), k.ajaxSetup({ accepts: { script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript" }, contents: { script: /\b(?:java|ecma)script\b/ }, converters: { "text script": function textScript(e) {
	        return k.globalEval(e), e;
	      } } }), k.ajaxPrefilter("script", function (e) {
	    void 0 === e.cache && (e.cache = !1), e.crossDomain && (e.type = "GET");
	  }), k.ajaxTransport("script", function (n) {
	    var r, _i;if (n.crossDomain || n.scriptAttrs) return { send: function send(e, t) {
	        r = k("<script>").attr(n.scriptAttrs || {}).prop({ charset: n.scriptCharset, src: n.url }).on("load error", _i = function i(e) {
	          r.remove(), _i = null, e && t("error" === e.type ? 404 : 200, e.type);
	        }), E.head.appendChild(r[0]);
	      }, abort: function abort() {
	        _i && _i();
	      } };
	  });var Vt,
	      Gt = [],
	      Yt = /(=)\?(?=&|$)|\?\?/;k.ajaxSetup({ jsonp: "callback", jsonpCallback: function jsonpCallback() {
	      var e = Gt.pop() || k.expando + "_" + kt++;return this[e] = !0, e;
	    } }), k.ajaxPrefilter("json jsonp", function (e, t, n) {
	    var r,
	        i,
	        o,
	        a = !1 !== e.jsonp && (Yt.test(e.url) ? "url" : "string" == typeof e.data && 0 === (e.contentType || "").indexOf("application/x-www-form-urlencoded") && Yt.test(e.data) && "data");if (a || "jsonp" === e.dataTypes[0]) return r = e.jsonpCallback = m(e.jsonpCallback) ? e.jsonpCallback() : e.jsonpCallback, a ? e[a] = e[a].replace(Yt, "$1" + r) : !1 !== e.jsonp && (e.url += (St.test(e.url) ? "&" : "?") + e.jsonp + "=" + r), e.converters["script json"] = function () {
	      return o || k.error(r + " was not called"), o[0];
	    }, e.dataTypes[0] = "json", i = C[r], C[r] = function () {
	      o = arguments;
	    }, n.always(function () {
	      void 0 === i ? k(C).removeProp(r) : C[r] = i, e[r] && (e.jsonpCallback = t.jsonpCallback, Gt.push(r)), o && m(i) && i(o[0]), o = i = void 0;
	    }), "script";
	  }), y.createHTMLDocument = ((Vt = E.implementation.createHTMLDocument("").body).innerHTML = "<form></form><form></form>", 2 === Vt.childNodes.length), k.parseHTML = function (e, t, n) {
	    return "string" != typeof e ? [] : ("boolean" == typeof t && (n = t, t = !1), t || (y.createHTMLDocument ? ((r = (t = E.implementation.createHTMLDocument("")).createElement("base")).href = E.location.href, t.head.appendChild(r)) : t = E), o = !n && [], (i = D.exec(e)) ? [t.createElement(i[1])] : (i = we([e], t, o), o && o.length && k(o).remove(), k.merge([], i.childNodes)));var r, i, o;
	  }, k.fn.load = function (e, t, n) {
	    var r,
	        i,
	        o,
	        a = this,
	        s = e.indexOf(" ");return -1 < s && (r = mt(e.slice(s)), e = e.slice(0, s)), m(t) ? (n = t, t = void 0) : t && "object" == (typeof t === "undefined" ? "undefined" : _typeof(t)) && (i = "POST"), 0 < a.length && k.ajax({ url: e, type: i || "GET", dataType: "html", data: t }).done(function (e) {
	      o = arguments, a.html(r ? k("<div>").append(k.parseHTML(e)).find(r) : e);
	    }).always(n && function (e, t) {
	      a.each(function () {
	        n.apply(this, o || [e.responseText, t, e]);
	      });
	    }), this;
	  }, k.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function (e, t) {
	    k.fn[t] = function (e) {
	      return this.on(t, e);
	    };
	  }), k.expr.pseudos.animated = function (t) {
	    return k.grep(k.timers, function (e) {
	      return t === e.elem;
	    }).length;
	  }, k.offset = { setOffset: function setOffset(e, t, n) {
	      var r,
	          i,
	          o,
	          a,
	          s,
	          u,
	          l = k.css(e, "position"),
	          c = k(e),
	          f = {};"static" === l && (e.style.position = "relative"), s = c.offset(), o = k.css(e, "top"), u = k.css(e, "left"), ("absolute" === l || "fixed" === l) && -1 < (o + u).indexOf("auto") ? (a = (r = c.position()).top, i = r.left) : (a = parseFloat(o) || 0, i = parseFloat(u) || 0), m(t) && (t = t.call(e, n, k.extend({}, s))), null != t.top && (f.top = t.top - s.top + a), null != t.left && (f.left = t.left - s.left + i), "using" in t ? t.using.call(e, f) : c.css(f);
	    } }, k.fn.extend({ offset: function offset(t) {
	      if (arguments.length) return void 0 === t ? this : this.each(function (e) {
	        k.offset.setOffset(this, t, e);
	      });var e,
	          n,
	          r = this[0];return r ? r.getClientRects().length ? (e = r.getBoundingClientRect(), n = r.ownerDocument.defaultView, { top: e.top + n.pageYOffset, left: e.left + n.pageXOffset }) : { top: 0, left: 0 } : void 0;
	    }, position: function position() {
	      if (this[0]) {
	        var e,
	            t,
	            n,
	            r = this[0],
	            i = { top: 0, left: 0 };if ("fixed" === k.css(r, "position")) t = r.getBoundingClientRect();else {
	          t = this.offset(), n = r.ownerDocument, e = r.offsetParent || n.documentElement;while (e && (e === n.body || e === n.documentElement) && "static" === k.css(e, "position")) {
	            e = e.parentNode;
	          }e && e !== r && 1 === e.nodeType && ((i = k(e).offset()).top += k.css(e, "borderTopWidth", !0), i.left += k.css(e, "borderLeftWidth", !0));
	        }return { top: t.top - i.top - k.css(r, "marginTop", !0), left: t.left - i.left - k.css(r, "marginLeft", !0) };
	      }
	    }, offsetParent: function offsetParent() {
	      return this.map(function () {
	        var e = this.offsetParent;while (e && "static" === k.css(e, "position")) {
	          e = e.offsetParent;
	        }return e || ie;
	      });
	    } }), k.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function (t, i) {
	    var o = "pageYOffset" === i;k.fn[t] = function (e) {
	      return _(this, function (e, t, n) {
	        var r;if (x(e) ? r = e : 9 === e.nodeType && (r = e.defaultView), void 0 === n) return r ? r[i] : e[t];r ? r.scrollTo(o ? r.pageXOffset : n, o ? n : r.pageYOffset) : e[t] = n;
	      }, t, e, arguments.length);
	    };
	  }), k.each(["top", "left"], function (e, n) {
	    k.cssHooks[n] = ze(y.pixelPosition, function (e, t) {
	      if (t) return t = _e(e, n), $e.test(t) ? k(e).position()[n] + "px" : t;
	    });
	  }), k.each({ Height: "height", Width: "width" }, function (a, s) {
	    k.each({ padding: "inner" + a, content: s, "": "outer" + a }, function (r, o) {
	      k.fn[o] = function (e, t) {
	        var n = arguments.length && (r || "boolean" != typeof e),
	            i = r || (!0 === e || !0 === t ? "margin" : "border");return _(this, function (e, t, n) {
	          var r;return x(e) ? 0 === o.indexOf("outer") ? e["inner" + a] : e.document.documentElement["client" + a] : 9 === e.nodeType ? (r = e.documentElement, Math.max(e.body["scroll" + a], r["scroll" + a], e.body["offset" + a], r["offset" + a], r["client" + a])) : void 0 === n ? k.css(e, t, i) : k.style(e, t, n, i);
	        }, s, n ? e : void 0, n);
	      };
	    });
	  }), k.each("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "), function (e, n) {
	    k.fn[n] = function (e, t) {
	      return 0 < arguments.length ? this.on(n, null, e, t) : this.trigger(n);
	    };
	  }), k.fn.extend({ hover: function hover(e, t) {
	      return this.mouseenter(e).mouseleave(t || e);
	    } }), k.fn.extend({ bind: function bind(e, t, n) {
	      return this.on(e, null, t, n);
	    }, unbind: function unbind(e, t) {
	      return this.off(e, null, t);
	    }, delegate: function delegate(e, t, n, r) {
	      return this.on(t, e, n, r);
	    }, undelegate: function undelegate(e, t, n) {
	      return 1 === arguments.length ? this.off(e, "**") : this.off(t, e || "**", n);
	    } }), k.proxy = function (e, t) {
	    var n, r, i;if ("string" == typeof t && (n = e[t], t = e, e = n), m(e)) return r = s.call(arguments, 2), (i = function i() {
	      return e.apply(t || this, r.concat(s.call(arguments)));
	    }).guid = e.guid = e.guid || k.guid++, i;
	  }, k.holdReady = function (e) {
	    e ? k.readyWait++ : k.ready(!0);
	  }, k.isArray = Array.isArray, k.parseJSON = JSON.parse, k.nodeName = A, k.isFunction = m, k.isWindow = x, k.camelCase = V, k.type = w, k.now = Date.now, k.isNumeric = function (e) {
	    var t = k.type(e);return ("number" === t || "string" === t) && !isNaN(e - parseFloat(e));
	  }, "function" == "function" && __webpack_require__(3) && !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
	    return k;
	  }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));var Qt = C.jQuery,
	      Jt = C.$;return k.noConflict = function (e) {
	    return C.$ === k && (C.$ = Jt), e && C.jQuery === k && (C.jQuery = Qt), k;
	  }, e || (C.jQuery = C.$ = k), k;
	});
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)(module)))

/***/ }),
/* 2 */
/***/ (function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ }),
/* 3 */
/***/ (function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {module.exports = __webpack_amd_options__;

	/* WEBPACK VAR INJECTION */}.call(exports, {}))

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var _extends = Object.assign || function (target) {
	    for (var i = 1; i < arguments.length; i++) {
	        var source = arguments[i];for (var key in source) {
	            if (Object.prototype.hasOwnProperty.call(source, key)) {
	                target[key] = source[key];
	            }
	        }
	    }return target;
	};

	var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
	    return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
	} : function (obj) {
	    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
	};

	var _CanvasRenderer = __webpack_require__(6);

	var _CanvasRenderer2 = _interopRequireDefault(_CanvasRenderer);

	var _Logger = __webpack_require__(10);

	var _Logger2 = _interopRequireDefault(_Logger);

	var _Window = __webpack_require__(11);

	var _Bounds = __webpack_require__(20);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	var html2canvas = function html2canvas(element, conf) {
	    // eslint-disable-next-line no-console
	    if ((typeof console === 'undefined' ? 'undefined' : _typeof(console)) === 'object' && typeof console.log === 'function') {
	        // eslint-disable-next-line no-console
	        console.log('html2canvas ' + "$npm_package_version");
	    }

	    var config = conf || {};
	    var logger = new _Logger2.default();

	    if (process.env.NODE_ENV !== 'production' && typeof config.onrendered === 'function') {
	        logger.error('onrendered option is deprecated, html2canvas returns a Promise with the canvas as the value');
	    }

	    var ownerDocument = element.ownerDocument;
	    if (!ownerDocument) {
	        return Promise.reject('Provided element is not within a Document');
	    }
	    var defaultView = ownerDocument.defaultView;

	    var scrollX = defaultView.pageXOffset;
	    var scrollY = defaultView.pageYOffset;

	    var isDocument = element.tagName === 'HTML' || element.tagName === 'BODY';

	    var _ref = isDocument ? (0, _Bounds.parseDocumentSize)(ownerDocument) : (0, _Bounds.parseBounds)(element, scrollX, scrollY),
	        width = _ref.width,
	        height = _ref.height,
	        left = _ref.left,
	        top = _ref.top;

	    var defaultOptions = {
	        async: true,
	        allowTaint: false,
	        imageTimeout: 15000,
	        proxy: null,
	        removeContainer: true,
	        foreignObjectRendering: false,
	        scale: defaultView.devicePixelRatio || 1,
	        target: new _CanvasRenderer2.default(config.canvas),
	        x: left,
	        y: top,
	        width: Math.ceil(width),
	        height: Math.ceil(height),
	        windowWidth: defaultView.innerWidth,
	        windowHeight: defaultView.innerHeight,
	        scrollX: defaultView.pageXOffset,
	        scrollY: defaultView.pageYOffset
	    };

	    var result = (0, _Window.renderElement)(element, _extends({}, defaultOptions, config), logger);

	    if (process.env.NODE_ENV !== 'production') {
	        return result.catch(function (e) {
	            logger.error(e);
	            throw e;
	        });
	    }
	    return result;
	};

	html2canvas.CanvasRenderer = _CanvasRenderer2.default;

	module.exports = html2canvas;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 5 */
/***/ (function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};

	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.

	var cachedSetTimeout;
	var cachedClearTimeout;

	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }


	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }



	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	process.prependListener = noop;
	process.prependOnceListener = noop;

	process.listeners = function (name) { return [] }

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();

	var _Path = __webpack_require__(7);

	var _textDecoration = __webpack_require__(8);

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var CanvasRenderer = function () {
	    function CanvasRenderer(canvas) {
	        _classCallCheck(this, CanvasRenderer);

	        this.canvas = canvas ? canvas : document.createElement('canvas');
	    }

	    _createClass(CanvasRenderer, [{
	        key: 'render',
	        value: function render(options) {
	            this.ctx = this.canvas.getContext('2d');
	            this.options = options;
	            this.canvas.width = Math.floor(options.width * options.scale);
	            this.canvas.height = Math.floor(options.height * options.scale);
	            this.canvas.style.width = options.width + 'px';
	            this.canvas.style.height = options.height + 'px';

	            this.ctx.scale(this.options.scale, this.options.scale);
	            this.ctx.translate(-options.x, -options.y);
	            this.ctx.textBaseline = 'bottom';
	            options.logger.log('Canvas renderer initialized (' + options.width + 'x' + options.height + ' at ' + options.x + ',' + options.y + ') with scale ' + this.options.scale);
	        }
	    }, {
	        key: 'clip',
	        value: function clip(clipPaths, callback) {
	            var _this = this;

	            if (clipPaths.length) {
	                this.ctx.save();
	                clipPaths.forEach(function (path) {
	                    _this.path(path);
	                    _this.ctx.clip();
	                });
	            }

	            callback();

	            if (clipPaths.length) {
	                this.ctx.restore();
	            }
	        }
	    }, {
	        key: 'drawImage',
	        value: function drawImage(image, source, destination) {
	            this.ctx.drawImage(image, source.left, source.top, source.width, source.height, destination.left, destination.top, destination.width, destination.height);
	        }
	    }, {
	        key: 'drawShape',
	        value: function drawShape(path, color) {
	            this.path(path);
	            this.ctx.fillStyle = color.toString();
	            this.ctx.fill();
	        }
	    }, {
	        key: 'fill',
	        value: function fill(color) {
	            this.ctx.fillStyle = color.toString();
	            this.ctx.fill();
	        }
	    }, {
	        key: 'getTarget',
	        value: function getTarget() {
	            return Promise.resolve(this.canvas);
	        }
	    }, {
	        key: 'path',
	        value: function path(_path) {
	            var _this2 = this;

	            this.ctx.beginPath();
	            if (Array.isArray(_path)) {
	                _path.forEach(function (point, index) {
	                    var start = point.type === _Path.PATH.VECTOR ? point : point.start;
	                    if (index === 0) {
	                        _this2.ctx.moveTo(start.x, start.y);
	                    } else {
	                        _this2.ctx.lineTo(start.x, start.y);
	                    }

	                    if (point.type === _Path.PATH.BEZIER_CURVE) {
	                        _this2.ctx.bezierCurveTo(point.startControl.x, point.startControl.y, point.endControl.x, point.endControl.y, point.end.x, point.end.y);
	                    }
	                });
	            } else {
	                this.ctx.arc(_path.x + _path.radius, _path.y + _path.radius, _path.radius, 0, Math.PI * 2, true);
	            }

	            this.ctx.closePath();
	        }
	    }, {
	        key: 'rectangle',
	        value: function rectangle(x, y, width, height, color) {
	            this.ctx.fillStyle = color.toString();
	            this.ctx.fillRect(x, y, width, height);
	        }
	    }, {
	        key: 'renderLinearGradient',
	        value: function renderLinearGradient(bounds, gradient) {
	            var linearGradient = this.ctx.createLinearGradient(bounds.left + gradient.direction.x1, bounds.top + gradient.direction.y1, bounds.left + gradient.direction.x0, bounds.top + gradient.direction.y0);

	            gradient.colorStops.forEach(function (colorStop) {
	                linearGradient.addColorStop(colorStop.stop, colorStop.color.toString());
	            });

	            this.ctx.fillStyle = linearGradient;
	            this.ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
	        }
	    }, {
	        key: 'renderRepeat',
	        value: function renderRepeat(path, image, imageSize, offsetX, offsetY) {
	            this.path(path);
	            this.ctx.fillStyle = this.ctx.createPattern(this.resizeImage(image, imageSize), 'repeat');
	            this.ctx.translate(offsetX, offsetY);
	            this.ctx.fill();
	            this.ctx.translate(-offsetX, -offsetY);
	        }
	    }, {
	        key: 'renderTextNode',
	        value: function renderTextNode(textBounds, color, font, textDecoration, textShadows) {
	            var _this3 = this;

	            this.ctx.font = [font.fontStyle, font.fontVariant, font.fontWeight, font.fontSize, font.fontFamily].join(' ').split(',')[0];

	            textBounds.forEach(function (text) {
	                _this3.ctx.fillStyle = color.toString();
	                if (textShadows && text.text.trim().length) {
	                    textShadows.slice(0).reverse().forEach(function (textShadow) {
	                        _this3.ctx.shadowColor = textShadow.color.toString();
	                        _this3.ctx.shadowOffsetX = textShadow.offsetX * _this3.options.scale;
	                        _this3.ctx.shadowOffsetY = textShadow.offsetY * _this3.options.scale;
	                        _this3.ctx.shadowBlur = textShadow.blur;

	                        _this3.ctx.fillText(text.text, text.bounds.left, text.bounds.top + text.bounds.height);
	                    });
	                } else {
	                    _this3.ctx.fillText(text.text, text.bounds.left, text.bounds.top + text.bounds.height);
	                }

	                if (textDecoration !== null) {
	                    var textDecorationColor = textDecoration.textDecorationColor || color;
	                    textDecoration.textDecorationLine.forEach(function (textDecorationLine) {
	                        switch (textDecorationLine) {
	                            case _textDecoration.TEXT_DECORATION_LINE.UNDERLINE:
	                                // Draws a line at the baseline of the font
	                                // TODO As some browsers display the line as more than 1px if the font-size is big,
	                                // need to take that into account both in position and size
	                                var _options$fontMetrics$ = _this3.options.fontMetrics.getMetrics(font),
	                                    baseline = _options$fontMetrics$.baseline;

	                                _this3.rectangle(text.bounds.left, Math.round(text.bounds.top + baseline), text.bounds.width, 1, textDecorationColor);
	                                break;
	                            case _textDecoration.TEXT_DECORATION_LINE.OVERLINE:
	                                _this3.rectangle(text.bounds.left, Math.round(text.bounds.top), text.bounds.width, 1, textDecorationColor);
	                                break;
	                            case _textDecoration.TEXT_DECORATION_LINE.LINE_THROUGH:
	                                // TODO try and find exact position for line-through
	                                var _options$fontMetrics$2 = _this3.options.fontMetrics.getMetrics(font),
	                                    middle = _options$fontMetrics$2.middle;

	                                _this3.rectangle(text.bounds.left, Math.ceil(text.bounds.top + middle), text.bounds.width, 1, textDecorationColor);
	                                break;
	                        }
	                    });
	                }
	            });
	        }
	    }, {
	        key: 'resizeImage',
	        value: function resizeImage(image, size) {
	            if (image.width === size.width && image.height === size.height) {
	                return image;
	            }

	            var canvas = this.canvas.ownerDocument.createElement('canvas');
	            canvas.width = size.width;
	            canvas.height = size.height;
	            var ctx = canvas.getContext('2d');
	            ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, size.width, size.height);
	            return canvas;
	        }
	    }, {
	        key: 'setOpacity',
	        value: function setOpacity(opacity) {
	            this.ctx.globalAlpha = opacity;
	        }
	    }, {
	        key: 'transform',
	        value: function transform(offsetX, offsetY, matrix, callback) {
	            this.ctx.save();
	            this.ctx.translate(offsetX, offsetY);
	            this.ctx.transform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
	            this.ctx.translate(-offsetX, -offsetY);

	            callback();

	            this.ctx.restore();
	        }
	    }]);

	    return CanvasRenderer;
	}();

	exports.default = CanvasRenderer;

/***/ }),
/* 7 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var PATH = exports.PATH = {
	    VECTOR: 0,
	    BEZIER_CURVE: 1,
	    CIRCLE: 2
	};

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.parseTextDecoration = exports.TEXT_DECORATION_LINE = exports.TEXT_DECORATION = exports.TEXT_DECORATION_STYLE = undefined;

	var _Color = __webpack_require__(9);

	var _Color2 = _interopRequireDefault(_Color);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	var TEXT_DECORATION_STYLE = exports.TEXT_DECORATION_STYLE = {
	    SOLID: 0,
	    DOUBLE: 1,
	    DOTTED: 2,
	    DASHED: 3,
	    WAVY: 4
	};

	var TEXT_DECORATION = exports.TEXT_DECORATION = {
	    NONE: null
	};

	var TEXT_DECORATION_LINE = exports.TEXT_DECORATION_LINE = {
	    UNDERLINE: 1,
	    OVERLINE: 2,
	    LINE_THROUGH: 3,
	    BLINK: 4
	};

	var parseLine = function parseLine(line) {
	    switch (line) {
	        case 'underline':
	            return TEXT_DECORATION_LINE.UNDERLINE;
	        case 'overline':
	            return TEXT_DECORATION_LINE.OVERLINE;
	        case 'line-through':
	            return TEXT_DECORATION_LINE.LINE_THROUGH;
	    }
	    return TEXT_DECORATION_LINE.BLINK;
	};

	var parseTextDecorationLine = function parseTextDecorationLine(line) {
	    if (line === 'none') {
	        return null;
	    }

	    return line.split(' ').map(parseLine);
	};

	var parseTextDecorationStyle = function parseTextDecorationStyle(style) {
	    switch (style) {
	        case 'double':
	            return TEXT_DECORATION_STYLE.DOUBLE;
	        case 'dotted':
	            return TEXT_DECORATION_STYLE.DOTTED;
	        case 'dashed':
	            return TEXT_DECORATION_STYLE.DASHED;
	        case 'wavy':
	            return TEXT_DECORATION_STYLE.WAVY;
	    }
	    return TEXT_DECORATION_STYLE.SOLID;
	};

	var parseTextDecoration = exports.parseTextDecoration = function parseTextDecoration(style) {
	    var textDecorationLine = parseTextDecorationLine(style.textDecorationLine ? style.textDecorationLine : style.textDecoration);
	    if (textDecorationLine === null) {
	        return TEXT_DECORATION.NONE;
	    }

	    var textDecorationColor = style.textDecorationColor ? new _Color2.default(style.textDecorationColor) : null;
	    var textDecorationStyle = parseTextDecorationStyle(style.textDecorationStyle);

	    return {
	        textDecorationLine: textDecorationLine,
	        textDecorationColor: textDecorationColor,
	        textDecorationStyle: textDecorationStyle
	    };
	};

/***/ }),
/* 9 */
/***/ (function(module, exports) {

	'use strict';

	// http://dev.w3.org/csswg/css-color/

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _slicedToArray = function () {
	    function sliceIterator(arr, i) {
	        var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
	            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	                _arr.push(_s.value);if (i && _arr.length === i) break;
	            }
	        } catch (err) {
	            _d = true;_e = err;
	        } finally {
	            try {
	                if (!_n && _i["return"]) _i["return"]();
	            } finally {
	                if (_d) throw _e;
	            }
	        }return _arr;
	    }return function (arr, i) {
	        if (Array.isArray(arr)) {
	            return arr;
	        } else if (Symbol.iterator in Object(arr)) {
	            return sliceIterator(arr, i);
	        } else {
	            throw new TypeError("Invalid attempt to destructure non-iterable instance");
	        }
	    };
	}();

	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var HEX3 = /^#([a-f0-9]{3})$/i;
	var hex3 = function hex3(value) {
	    var match = value.match(HEX3);
	    if (match) {
	        return [parseInt(match[1][0] + match[1][0], 16), parseInt(match[1][1] + match[1][1], 16), parseInt(match[1][2] + match[1][2], 16), null];
	    }
	    return false;
	};

	var HEX6 = /^#([a-f0-9]{6})$/i;
	var hex6 = function hex6(value) {
	    var match = value.match(HEX6);
	    if (match) {
	        return [parseInt(match[1].substring(0, 2), 16), parseInt(match[1].substring(2, 4), 16), parseInt(match[1].substring(4, 6), 16), null];
	    }
	    return false;
	};

	var RGB = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
	var rgb = function rgb(value) {
	    var match = value.match(RGB);
	    if (match) {
	        return [Number(match[1]), Number(match[2]), Number(match[3]), null];
	    }
	    return false;
	};

	var RGBA = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d?\.?\d+)\s*\)$/;
	var rgba = function rgba(value) {
	    var match = value.match(RGBA);
	    if (match && match.length > 4) {
	        return [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])];
	    }
	    return false;
	};

	var fromArray = function fromArray(array) {
	    return [Math.min(array[0], 255), Math.min(array[1], 255), Math.min(array[2], 255), array.length > 3 ? array[3] : null];
	};

	var namedColor = function namedColor(name) {
	    var color = NAMED_COLORS[name.toLowerCase()];
	    return color ? color : false;
	};

	var Color = function () {
	    function Color(value) {
	        _classCallCheck(this, Color);

	        var _ref = Array.isArray(value) ? fromArray(value) : hex3(value) || rgb(value) || rgba(value) || namedColor(value) || hex6(value) || [0, 0, 0, null],
	            _ref2 = _slicedToArray(_ref, 4),
	            r = _ref2[0],
	            g = _ref2[1],
	            b = _ref2[2],
	            a = _ref2[3];

	        this.r = r;
	        this.g = g;
	        this.b = b;
	        this.a = a;
	    }

	    _createClass(Color, [{
	        key: 'isTransparent',
	        value: function isTransparent() {
	            return this.a === 0;
	        }
	    }, {
	        key: 'toString',
	        value: function toString() {
	            return this.a !== null && this.a !== 1 ? 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')' : 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
	        }
	    }]);

	    return Color;
	}();

	exports.default = Color;

	var NAMED_COLORS = {
	    transparent: [0, 0, 0, 0],
	    aliceblue: [240, 248, 255, null],
	    antiquewhite: [250, 235, 215, null],
	    aqua: [0, 255, 255, null],
	    aquamarine: [127, 255, 212, null],
	    azure: [240, 255, 255, null],
	    beige: [245, 245, 220, null],
	    bisque: [255, 228, 196, null],
	    black: [0, 0, 0, null],
	    blanchedalmond: [255, 235, 205, null],
	    blue: [0, 0, 255, null],
	    blueviolet: [138, 43, 226, null],
	    brown: [165, 42, 42, null],
	    burlywood: [222, 184, 135, null],
	    cadetblue: [95, 158, 160, null],
	    chartreuse: [127, 255, 0, null],
	    chocolate: [210, 105, 30, null],
	    coral: [255, 127, 80, null],
	    cornflowerblue: [100, 149, 237, null],
	    cornsilk: [255, 248, 220, null],
	    crimson: [220, 20, 60, null],
	    cyan: [0, 255, 255, null],
	    darkblue: [0, 0, 139, null],
	    darkcyan: [0, 139, 139, null],
	    darkgoldenrod: [184, 134, 11, null],
	    darkgray: [169, 169, 169, null],
	    darkgreen: [0, 100, 0, null],
	    darkgrey: [169, 169, 169, null],
	    darkkhaki: [189, 183, 107, null],
	    darkmagenta: [139, 0, 139, null],
	    darkolivegreen: [85, 107, 47, null],
	    darkorange: [255, 140, 0, null],
	    darkorchid: [153, 50, 204, null],
	    darkred: [139, 0, 0, null],
	    darksalmon: [233, 150, 122, null],
	    darkseagreen: [143, 188, 143, null],
	    darkslateblue: [72, 61, 139, null],
	    darkslategray: [47, 79, 79, null],
	    darkslategrey: [47, 79, 79, null],
	    darkturquoise: [0, 206, 209, null],
	    darkviolet: [148, 0, 211, null],
	    deeppink: [255, 20, 147, null],
	    deepskyblue: [0, 191, 255, null],
	    dimgray: [105, 105, 105, null],
	    dimgrey: [105, 105, 105, null],
	    dodgerblue: [30, 144, 255, null],
	    firebrick: [178, 34, 34, null],
	    floralwhite: [255, 250, 240, null],
	    forestgreen: [34, 139, 34, null],
	    fuchsia: [255, 0, 255, null],
	    gainsboro: [220, 220, 220, null],
	    ghostwhite: [248, 248, 255, null],
	    gold: [255, 215, 0, null],
	    goldenrod: [218, 165, 32, null],
	    gray: [128, 128, 128, null],
	    green: [0, 128, 0, null],
	    greenyellow: [173, 255, 47, null],
	    grey: [128, 128, 128, null],
	    honeydew: [240, 255, 240, null],
	    hotpink: [255, 105, 180, null],
	    indianred: [205, 92, 92, null],
	    indigo: [75, 0, 130, null],
	    ivory: [255, 255, 240, null],
	    khaki: [240, 230, 140, null],
	    lavender: [230, 230, 250, null],
	    lavenderblush: [255, 240, 245, null],
	    lawngreen: [124, 252, 0, null],
	    lemonchiffon: [255, 250, 205, null],
	    lightblue: [173, 216, 230, null],
	    lightcoral: [240, 128, 128, null],
	    lightcyan: [224, 255, 255, null],
	    lightgoldenrodyellow: [250, 250, 210, null],
	    lightgray: [211, 211, 211, null],
	    lightgreen: [144, 238, 144, null],
	    lightgrey: [211, 211, 211, null],
	    lightpink: [255, 182, 193, null],
	    lightsalmon: [255, 160, 122, null],
	    lightseagreen: [32, 178, 170, null],
	    lightskyblue: [135, 206, 250, null],
	    lightslategray: [119, 136, 153, null],
	    lightslategrey: [119, 136, 153, null],
	    lightsteelblue: [176, 196, 222, null],
	    lightyellow: [255, 255, 224, null],
	    lime: [0, 255, 0, null],
	    limegreen: [50, 205, 50, null],
	    linen: [250, 240, 230, null],
	    magenta: [255, 0, 255, null],
	    maroon: [128, 0, 0, null],
	    mediumaquamarine: [102, 205, 170, null],
	    mediumblue: [0, 0, 205, null],
	    mediumorchid: [186, 85, 211, null],
	    mediumpurple: [147, 112, 219, null],
	    mediumseagreen: [60, 179, 113, null],
	    mediumslateblue: [123, 104, 238, null],
	    mediumspringgreen: [0, 250, 154, null],
	    mediumturquoise: [72, 209, 204, null],
	    mediumvioletred: [199, 21, 133, null],
	    midnightblue: [25, 25, 112, null],
	    mintcream: [245, 255, 250, null],
	    mistyrose: [255, 228, 225, null],
	    moccasin: [255, 228, 181, null],
	    navajowhite: [255, 222, 173, null],
	    navy: [0, 0, 128, null],
	    oldlace: [253, 245, 230, null],
	    olive: [128, 128, 0, null],
	    olivedrab: [107, 142, 35, null],
	    orange: [255, 165, 0, null],
	    orangered: [255, 69, 0, null],
	    orchid: [218, 112, 214, null],
	    palegoldenrod: [238, 232, 170, null],
	    palegreen: [152, 251, 152, null],
	    paleturquoise: [175, 238, 238, null],
	    palevioletred: [219, 112, 147, null],
	    papayawhip: [255, 239, 213, null],
	    peachpuff: [255, 218, 185, null],
	    peru: [205, 133, 63, null],
	    pink: [255, 192, 203, null],
	    plum: [221, 160, 221, null],
	    powderblue: [176, 224, 230, null],
	    purple: [128, 0, 128, null],
	    rebeccapurple: [102, 51, 153, null],
	    red: [255, 0, 0, null],
	    rosybrown: [188, 143, 143, null],
	    royalblue: [65, 105, 225, null],
	    saddlebrown: [139, 69, 19, null],
	    salmon: [250, 128, 114, null],
	    sandybrown: [244, 164, 96, null],
	    seagreen: [46, 139, 87, null],
	    seashell: [255, 245, 238, null],
	    sienna: [160, 82, 45, null],
	    silver: [192, 192, 192, null],
	    skyblue: [135, 206, 235, null],
	    slateblue: [106, 90, 205, null],
	    slategray: [112, 128, 144, null],
	    slategrey: [112, 128, 144, null],
	    snow: [255, 250, 250, null],
	    springgreen: [0, 255, 127, null],
	    steelblue: [70, 130, 180, null],
	    tan: [210, 180, 140, null],
	    teal: [0, 128, 128, null],
	    thistle: [216, 191, 216, null],
	    tomato: [255, 99, 71, null],
	    turquoise: [64, 224, 208, null],
	    violet: [238, 130, 238, null],
	    wheat: [245, 222, 179, null],
	    white: [255, 255, 255, null],
	    whitesmoke: [245, 245, 245, null],
	    yellow: [255, 255, 0, null],
	    yellowgreen: [154, 205, 50, null]
	};

	var TRANSPARENT = exports.TRANSPARENT = new Color([0, 0, 0, 0]);

/***/ }),
/* 10 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var Logger = function () {
	    function Logger(id, start) {
	        _classCallCheck(this, Logger);

	        this.start = start ? start : Date.now();
	        this.id = id;
	    }

	    _createClass(Logger, [{
	        key: 'child',
	        value: function child(id) {
	            return new Logger(id, this.start);
	        }

	        // eslint-disable-next-line flowtype/no-weak-types

	    }, {
	        key: 'log',
	        value: function log() {
	            if (window.console && window.console.log) {
	                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	                    args[_key] = arguments[_key];
	                }

	                Function.prototype.bind.call(window.console.log, window.console).apply(window.console, [Date.now() - this.start + 'ms', this.id ? 'html2canvas (' + this.id + '):' : 'html2canvas:'].concat([].slice.call(args, 0)));
	            }
	        }

	        // eslint-disable-next-line flowtype/no-weak-types

	    }, {
	        key: 'error',
	        value: function error() {
	            if (window.console && window.console.error) {
	                for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	                    args[_key2] = arguments[_key2];
	                }

	                Function.prototype.bind.call(window.console.error, window.console).apply(window.console, [Date.now() - this.start + 'ms', this.id ? 'html2canvas (' + this.id + '):' : 'html2canvas:'].concat([].slice.call(args, 0)));
	            }
	        }
	    }]);

	    return Logger;
	}();

	exports.default = Logger;

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.renderElement = undefined;

	var _slicedToArray = function () {
	    function sliceIterator(arr, i) {
	        var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
	            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	                _arr.push(_s.value);if (i && _arr.length === i) break;
	            }
	        } catch (err) {
	            _d = true;_e = err;
	        } finally {
	            try {
	                if (!_n && _i["return"]) _i["return"]();
	            } finally {
	                if (_d) throw _e;
	            }
	        }return _arr;
	    }return function (arr, i) {
	        if (Array.isArray(arr)) {
	            return arr;
	        } else if (Symbol.iterator in Object(arr)) {
	            return sliceIterator(arr, i);
	        } else {
	            throw new TypeError("Invalid attempt to destructure non-iterable instance");
	        }
	    };
	}();

	var _Logger = __webpack_require__(10);

	var _Logger2 = _interopRequireDefault(_Logger);

	var _NodeParser = __webpack_require__(12);

	var _Renderer = __webpack_require__(43);

	var _Renderer2 = _interopRequireDefault(_Renderer);

	var _ForeignObjectRenderer = __webpack_require__(41);

	var _ForeignObjectRenderer2 = _interopRequireDefault(_ForeignObjectRenderer);

	var _Feature = __webpack_require__(40);

	var _Feature2 = _interopRequireDefault(_Feature);

	var _Bounds = __webpack_require__(20);

	var _Clone = __webpack_require__(47);

	var _Font = __webpack_require__(44);

	var _Color = __webpack_require__(9);

	var _Color2 = _interopRequireDefault(_Color);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	var renderElement = exports.renderElement = function renderElement(element, options, logger) {
	    var ownerDocument = element.ownerDocument;

	    var windowBounds = new _Bounds.Bounds(options.scrollX, options.scrollY, options.windowWidth, options.windowHeight);

	    // http://www.w3.org/TR/css3-background/#special-backgrounds
	    var documentBackgroundColor = ownerDocument.documentElement ? new _Color2.default(getComputedStyle(ownerDocument.documentElement).backgroundColor) : _Color.TRANSPARENT;
	    var bodyBackgroundColor = ownerDocument.body ? new _Color2.default(getComputedStyle(ownerDocument.body).backgroundColor) : _Color.TRANSPARENT;

	    var backgroundColor = element === ownerDocument.documentElement ? documentBackgroundColor.isTransparent() ? bodyBackgroundColor.isTransparent() ? options.backgroundColor ? new _Color2.default(options.backgroundColor) : null : bodyBackgroundColor : documentBackgroundColor : options.backgroundColor ? new _Color2.default(options.backgroundColor) : null;

	    return (options.foreignObjectRendering ? // $FlowFixMe
	    _Feature2.default.SUPPORT_FOREIGNOBJECT_DRAWING : Promise.resolve(false)).then(function (supportForeignObject) {
	        return supportForeignObject ? function (cloner) {
	            if (process.env.NODE_ENV !== 'production') {
	                logger.log('Document cloned, using foreignObject rendering');
	            }

	            return cloner.inlineFonts(ownerDocument).then(function () {
	                return cloner.resourceLoader.ready();
	            }).then(function () {
	                var renderer = new _ForeignObjectRenderer2.default(cloner.documentElement);
	                return renderer.render({
	                    backgroundColor: backgroundColor,
	                    logger: logger,
	                    scale: options.scale,
	                    x: options.x,
	                    y: options.y,
	                    width: options.width,
	                    height: options.height,
	                    windowWidth: options.windowWidth,
	                    windowHeight: options.windowHeight,
	                    scrollX: options.scrollX,
	                    scrollY: options.scrollY
	                });
	            });
	        }(new _Clone.DocumentCloner(element, options, logger, true, renderElement)) : (0, _Clone.cloneWindow)(ownerDocument, windowBounds, element, options, logger, renderElement).then(function (_ref) {
	            var _ref2 = _slicedToArray(_ref, 3),
	                container = _ref2[0],
	                clonedElement = _ref2[1],
	                resourceLoader = _ref2[2];

	            if (process.env.NODE_ENV !== 'production') {
	                logger.log('Document cloned, using computed rendering');
	            }

	            var stack = (0, _NodeParser.NodeParser)(clonedElement, resourceLoader, logger);
	            var clonedDocument = clonedElement.ownerDocument;

	            if (backgroundColor === stack.container.style.background.backgroundColor) {
	                stack.container.style.background.backgroundColor = _Color.TRANSPARENT;
	            }

	            return resourceLoader.ready().then(function (imageStore) {
	                if (options.removeContainer === true) {
	                    if (container.parentNode) {
	                        container.parentNode.removeChild(container);
	                    } else if (process.env.NODE_ENV !== 'production') {
	                        logger.log('Cannot detach cloned iframe as it is not in the DOM anymore');
	                    }
	                }

	                var fontMetrics = new _Font.FontMetrics(clonedDocument);
	                if (process.env.NODE_ENV !== 'production') {
	                    logger.log('Starting renderer');
	                }

	                var renderOptions = {
	                    backgroundColor: backgroundColor,
	                    fontMetrics: fontMetrics,
	                    imageStore: imageStore,
	                    logger: logger,
	                    scale: options.scale,
	                    x: options.x,
	                    y: options.y,
	                    width: options.width,
	                    height: options.height
	                };

	                if (Array.isArray(options.target)) {
	                    return Promise.all(options.target.map(function (target) {
	                        var renderer = new _Renderer2.default(target, renderOptions);
	                        return renderer.render(stack);
	                    }));
	                } else {
	                    var renderer = new _Renderer2.default(options.target, renderOptions);
	                    return renderer.render(stack);
	                }
	            });
	        });
	    });
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.NodeParser = undefined;

	var _StackingContext = __webpack_require__(13);

	var _StackingContext2 = _interopRequireDefault(_StackingContext);

	var _NodeContainer = __webpack_require__(14);

	var _NodeContainer2 = _interopRequireDefault(_NodeContainer);

	var _TextContainer = __webpack_require__(37);

	var _TextContainer2 = _interopRequireDefault(_TextContainer);

	var _Input = __webpack_require__(36);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	var NodeParser = exports.NodeParser = function NodeParser(node, resourceLoader, logger) {
	    if (process.env.NODE_ENV !== 'production') {
	        logger.log('Starting node parsing');
	    }

	    var index = 0;

	    var container = new _NodeContainer2.default(node, null, resourceLoader, index++);
	    var stack = new _StackingContext2.default(container, null, true);

	    parseNodeTree(node, container, stack, resourceLoader, index);

	    if (process.env.NODE_ENV !== 'production') {
	        logger.log('Finished parsing node tree');
	    }

	    return stack;
	};

	var IGNORED_NODE_NAMES = ['SCRIPT', 'HEAD', 'TITLE', 'OBJECT', 'BR', 'OPTION'];

	var parseNodeTree = function parseNodeTree(node, parent, stack, resourceLoader, index) {
	    if (process.env.NODE_ENV !== 'production' && index > 50000) {
	        throw new Error('Recursion error while parsing node tree');
	    }

	    for (var childNode = node.firstChild, nextNode; childNode; childNode = nextNode) {
	        nextNode = childNode.nextSibling;
	        var defaultView = childNode.ownerDocument.defaultView;
	        if (childNode instanceof defaultView.Text || childNode instanceof Text || defaultView.parent && childNode instanceof defaultView.parent.Text) {
	            if (childNode.data.trim().length > 0) {
	                parent.childNodes.push(_TextContainer2.default.fromTextNode(childNode, parent));
	            }
	        } else if (childNode instanceof defaultView.HTMLElement || childNode instanceof HTMLElement || defaultView.parent && childNode instanceof defaultView.parent.HTMLElement) {
	            if (IGNORED_NODE_NAMES.indexOf(childNode.nodeName) === -1) {
	                var container = new _NodeContainer2.default(childNode, parent, resourceLoader, index++);
	                if (container.isVisible()) {
	                    if (childNode.tagName === 'INPUT') {
	                        // $FlowFixMe
	                        (0, _Input.inlineInputElement)(childNode, container);
	                    } else if (childNode.tagName === 'TEXTAREA') {
	                        // $FlowFixMe
	                        (0, _Input.inlineTextAreaElement)(childNode, container);
	                    } else if (childNode.tagName === 'SELECT') {
	                        // $FlowFixMe
	                        (0, _Input.inlineSelectElement)(childNode, container);
	                    }

	                    var SHOULD_TRAVERSE_CHILDREN = childNode.tagName !== 'TEXTAREA';
	                    var treatAsRealStackingContext = createsRealStackingContext(container, childNode);
	                    if (treatAsRealStackingContext || createsStackingContext(container)) {
	                        // for treatAsRealStackingContext:false, any positioned descendants and descendants
	                        // which actually create a new stacking context should be considered part of the parent stacking context
	                        var parentStack = treatAsRealStackingContext || container.isPositioned() ? stack.getRealParentStackingContext() : stack;
	                        var childStack = new _StackingContext2.default(container, parentStack, treatAsRealStackingContext);
	                        parentStack.contexts.push(childStack);
	                        if (SHOULD_TRAVERSE_CHILDREN) {
	                            parseNodeTree(childNode, container, childStack, resourceLoader, index);
	                        }
	                    } else {
	                        stack.children.push(container);
	                        if (SHOULD_TRAVERSE_CHILDREN) {
	                            parseNodeTree(childNode, container, stack, resourceLoader, index);
	                        }
	                    }
	                }
	            }
	        } else if (childNode instanceof defaultView.SVGSVGElement || childNode instanceof SVGSVGElement || defaultView.parent && childNode instanceof defaultView.parent.SVGSVGElement) {
	            var _container = new _NodeContainer2.default(childNode, parent, resourceLoader, index++);
	            var _treatAsRealStackingContext = createsRealStackingContext(_container, childNode);
	            if (_treatAsRealStackingContext || createsStackingContext(_container)) {
	                // for treatAsRealStackingContext:false, any positioned descendants and descendants
	                // which actually create a new stacking context should be considered part of the parent stacking context
	                var _parentStack = _treatAsRealStackingContext || _container.isPositioned() ? stack.getRealParentStackingContext() : stack;
	                var _childStack = new _StackingContext2.default(_container, _parentStack, _treatAsRealStackingContext);
	                _parentStack.contexts.push(_childStack);
	            } else {
	                stack.children.push(_container);
	            }
	        }
	    }
	};

	var createsRealStackingContext = function createsRealStackingContext(container, node) {
	    return container.isRootElement() || container.isPositionedWithZIndex() || container.style.opacity < 1 || container.isTransformed() || isBodyWithTransparentRoot(container, node);
	};

	var createsStackingContext = function createsStackingContext(container) {
	    return container.isPositioned() || container.isFloating();
	};

	var isBodyWithTransparentRoot = function isBodyWithTransparentRoot(container, node) {
	    return node.nodeName === 'BODY' && container.parent instanceof _NodeContainer2.default && container.parent.style.background.backgroundColor.isTransparent();
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();

	var _NodeContainer = __webpack_require__(14);

	var _NodeContainer2 = _interopRequireDefault(_NodeContainer);

	var _position = __webpack_require__(30);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var StackingContext = function () {
	    function StackingContext(container, parent, treatAsRealStackingContext) {
	        _classCallCheck(this, StackingContext);

	        this.container = container;
	        this.parent = parent;
	        this.contexts = [];
	        this.children = [];
	        this.treatAsRealStackingContext = treatAsRealStackingContext;
	    }

	    _createClass(StackingContext, [{
	        key: 'getOpacity',
	        value: function getOpacity() {
	            return this.parent ? this.container.style.opacity * this.parent.getOpacity() : this.container.style.opacity;
	        }
	    }, {
	        key: 'getRealParentStackingContext',
	        value: function getRealParentStackingContext() {
	            return !this.parent || this.treatAsRealStackingContext ? this : this.parent.getRealParentStackingContext();
	        }
	    }]);

	    return StackingContext;
	}();

	exports.default = StackingContext;

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();

	var _Color = __webpack_require__(9);

	var _Color2 = _interopRequireDefault(_Color);

	var _Util = __webpack_require__(15);

	var _background = __webpack_require__(16);

	var _border = __webpack_require__(23);

	var _borderRadius = __webpack_require__(24);

	var _display = __webpack_require__(25);

	var _float = __webpack_require__(26);

	var _font = __webpack_require__(27);

	var _letterSpacing = __webpack_require__(28);

	var _overflow = __webpack_require__(29);

	var _padding = __webpack_require__(22);

	var _position = __webpack_require__(30);

	var _textDecoration = __webpack_require__(8);

	var _textShadow = __webpack_require__(31);

	var _textTransform = __webpack_require__(32);

	var _transform = __webpack_require__(33);

	var _visibility = __webpack_require__(34);

	var _zIndex = __webpack_require__(35);

	var _Bounds = __webpack_require__(20);

	var _Input = __webpack_require__(36);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var INPUT_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

	var NodeContainer = function () {
	    function NodeContainer(node, parent, resourceLoader, index) {
	        var _this = this;

	        _classCallCheck(this, NodeContainer);

	        this.parent = parent;
	        this.index = index;
	        this.childNodes = [];
	        var defaultView = node.ownerDocument.defaultView;
	        var scrollX = defaultView.pageXOffset;
	        var scrollY = defaultView.pageYOffset;
	        var style = defaultView.getComputedStyle(node, null);
	        var display = (0, _display.parseDisplay)(style.display);

	        var IS_INPUT = node.type === 'radio' || node.type === 'checkbox';

	        var position = (0, _position.parsePosition)(style.position);

	        this.style = {
	            background: IS_INPUT ? _Input.INPUT_BACKGROUND : (0, _background.parseBackground)(style, resourceLoader),
	            border: IS_INPUT ? _Input.INPUT_BORDERS : (0, _border.parseBorder)(style),
	            borderRadius: (node instanceof defaultView.HTMLInputElement || node instanceof HTMLInputElement) && IS_INPUT ? (0, _Input.getInputBorderRadius)(node) : (0, _borderRadius.parseBorderRadius)(style),
	            color: IS_INPUT ? _Input.INPUT_COLOR : new _Color2.default(style.color),
	            display: display,
	            float: (0, _float.parseCSSFloat)(style.float),
	            font: (0, _font.parseFont)(style),
	            letterSpacing: (0, _letterSpacing.parseLetterSpacing)(style.letterSpacing),
	            opacity: parseFloat(style.opacity),
	            overflow: INPUT_TAGS.indexOf(node.tagName) === -1 ? (0, _overflow.parseOverflow)(style.overflow) : _overflow.OVERFLOW.HIDDEN,
	            padding: (0, _padding.parsePadding)(style),
	            position: position,
	            textDecoration: (0, _textDecoration.parseTextDecoration)(style),
	            textShadow: (0, _textShadow.parseTextShadow)(style.textShadow),
	            textTransform: (0, _textTransform.parseTextTransform)(style.textTransform),
	            transform: (0, _transform.parseTransform)(style),
	            visibility: (0, _visibility.parseVisibility)(style.visibility),
	            zIndex: (0, _zIndex.parseZIndex)(position !== _position.POSITION.STATIC ? style.zIndex : 'auto')
	        };

	        if (this.isTransformed()) {
	            // getBoundingClientRect provides values post-transform, we want them without the transformation
	            node.style.transform = 'matrix(1,0,0,1,0,0)';
	        }

	        // TODO move bound retrieval for all nodes to a later stage?
	        if (node.tagName === 'IMG') {
	            node.addEventListener('load', function () {
	                _this.bounds = (0, _Bounds.parseBounds)(node, scrollX, scrollY);
	                _this.curvedBounds = (0, _Bounds.parseBoundCurves)(_this.bounds, _this.style.border, _this.style.borderRadius);
	            });
	        }
	        this.image = getImage(node, resourceLoader);
	        this.bounds = IS_INPUT ? (0, _Input.reformatInputBounds)((0, _Bounds.parseBounds)(node, scrollX, scrollY)) : (0, _Bounds.parseBounds)(node, scrollX, scrollY);
	        this.curvedBounds = (0, _Bounds.parseBoundCurves)(this.bounds, this.style.border, this.style.borderRadius);

	        if (process.env.NODE_ENV !== 'production') {
	            this.name = '' + node.tagName.toLowerCase() + (node.id ? '#' + node.id : '') + node.className.toString().split(' ').map(function (s) {
	                return s.length ? '.' + s : '';
	            }).join('');
	        }
	    }

	    _createClass(NodeContainer, [{
	        key: 'getClipPaths',
	        value: function getClipPaths() {
	            var parentClips = this.parent ? this.parent.getClipPaths() : [];
	            var isClipped = this.style.overflow === _overflow.OVERFLOW.HIDDEN || this.style.overflow === _overflow.OVERFLOW.SCROLL;

	            return isClipped ? parentClips.concat([(0, _Bounds.calculatePaddingBoxPath)(this.curvedBounds)]) : parentClips;
	        }
	    }, {
	        key: 'isInFlow',
	        value: function isInFlow() {
	            return this.isRootElement() && !this.isFloating() && !this.isAbsolutelyPositioned();
	        }
	    }, {
	        key: 'isVisible',
	        value: function isVisible() {
	            return !(0, _Util.contains)(this.style.display, _display.DISPLAY.NONE) && this.style.opacity > 0 && this.style.visibility === _visibility.VISIBILITY.VISIBLE;
	        }
	    }, {
	        key: 'isAbsolutelyPositioned',
	        value: function isAbsolutelyPositioned() {
	            return this.style.position !== _position.POSITION.STATIC && this.style.position !== _position.POSITION.RELATIVE;
	        }
	    }, {
	        key: 'isPositioned',
	        value: function isPositioned() {
	            return this.style.position !== _position.POSITION.STATIC;
	        }
	    }, {
	        key: 'isFloating',
	        value: function isFloating() {
	            return this.style.float !== _float.FLOAT.NONE;
	        }
	    }, {
	        key: 'isRootElement',
	        value: function isRootElement() {
	            return this.parent === null;
	        }
	    }, {
	        key: 'isTransformed',
	        value: function isTransformed() {
	            return this.style.transform !== null;
	        }
	    }, {
	        key: 'isPositionedWithZIndex',
	        value: function isPositionedWithZIndex() {
	            return this.isPositioned() && !this.style.zIndex.auto;
	        }
	    }, {
	        key: 'isInlineLevel',
	        value: function isInlineLevel() {
	            return (0, _Util.contains)(this.style.display, _display.DISPLAY.INLINE) || (0, _Util.contains)(this.style.display, _display.DISPLAY.INLINE_BLOCK) || (0, _Util.contains)(this.style.display, _display.DISPLAY.INLINE_FLEX) || (0, _Util.contains)(this.style.display, _display.DISPLAY.INLINE_GRID) || (0, _Util.contains)(this.style.display, _display.DISPLAY.INLINE_LIST_ITEM) || (0, _Util.contains)(this.style.display, _display.DISPLAY.INLINE_TABLE);
	        }
	    }, {
	        key: 'isInlineBlockOrInlineTable',
	        value: function isInlineBlockOrInlineTable() {
	            return (0, _Util.contains)(this.style.display, _display.DISPLAY.INLINE_BLOCK) || (0, _Util.contains)(this.style.display, _display.DISPLAY.INLINE_TABLE);
	        }
	    }]);

	    return NodeContainer;
	}();

	exports.default = NodeContainer;

	var getImage = function getImage(node, resourceLoader) {
	    if (node instanceof node.ownerDocument.defaultView.SVGSVGElement || node instanceof SVGSVGElement) {
	        var s = new XMLSerializer();
	        return resourceLoader.loadImage('data:image/svg+xml,' + encodeURIComponent(s.serializeToString(node)));
	    }
	    switch (node.tagName) {
	        case 'IMG':
	            // $FlowFixMe
	            var img = node;
	            return resourceLoader.loadImage(img.currentSrc || img.src);
	        case 'CANVAS':
	            // $FlowFixMe
	            var canvas = node;
	            return resourceLoader.loadCanvas(canvas);
	        case 'IFRAME':
	            var iframeKey = node.getAttribute('data-html2canvas-internal-iframe-key');
	            if (iframeKey) {
	                return iframeKey;
	            }
	            break;
	    }

	    return null;
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 15 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var contains = exports.contains = function contains(bit, value) {
	    return (bit & value) !== 0;
	};

	var copyCSSStyles = exports.copyCSSStyles = function copyCSSStyles(style, target) {
	    // Edge does not provide value for cssText
	    for (var i = style.length - 1; i >= 0; i--) {
	        var property = style.item(i);
	        // Safari shows pseudoelements if content is set
	        if (property !== 'content') {
	            target.style.setProperty(property, style.getPropertyValue(property));
	        }
	    }
	    return target;
	};

	var SMALL_IMAGE = exports.SMALL_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.parseBackgroundImage = exports.parseBackground = exports.calculateBackgroundRepeatPath = exports.calculateBackgroundPosition = exports.calculateBackgroungPositioningArea = exports.calculateBackgroungPaintingArea = exports.calculateBackgroundSize = exports.BACKGROUND_ORIGIN = exports.BACKGROUND_CLIP = exports.BACKGROUND_SIZE = exports.BACKGROUND_REPEAT = undefined;

	var _Color = __webpack_require__(9);

	var _Color2 = _interopRequireDefault(_Color);

	var _Length = __webpack_require__(17);

	var _Length2 = _interopRequireDefault(_Length);

	var _Size = __webpack_require__(18);

	var _Size2 = _interopRequireDefault(_Size);

	var _Vector = __webpack_require__(19);

	var _Vector2 = _interopRequireDefault(_Vector);

	var _Bounds = __webpack_require__(20);

	var _padding = __webpack_require__(22);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var BACKGROUND_REPEAT = exports.BACKGROUND_REPEAT = {
	    REPEAT: 0,
	    NO_REPEAT: 1,
	    REPEAT_X: 2,
	    REPEAT_Y: 3
	};

	var BACKGROUND_SIZE = exports.BACKGROUND_SIZE = {
	    AUTO: 0,
	    CONTAIN: 1,
	    COVER: 2,
	    LENGTH: 3
	};

	var BACKGROUND_CLIP = exports.BACKGROUND_CLIP = {
	    BORDER_BOX: 0,
	    PADDING_BOX: 1,
	    CONTENT_BOX: 2
	};

	var BACKGROUND_ORIGIN = exports.BACKGROUND_ORIGIN = BACKGROUND_CLIP;

	var AUTO = 'auto';

	var BackgroundSize = function BackgroundSize(size) {
	    _classCallCheck(this, BackgroundSize);

	    switch (size) {
	        case 'contain':
	            this.size = BACKGROUND_SIZE.CONTAIN;
	            break;
	        case 'cover':
	            this.size = BACKGROUND_SIZE.COVER;
	            break;
	        case 'auto':
	            this.size = BACKGROUND_SIZE.AUTO;
	            break;
	        default:
	            this.value = new _Length2.default(size);
	    }
	};

	var calculateBackgroundSize = exports.calculateBackgroundSize = function calculateBackgroundSize(backgroundImage, image, bounds) {
	    var width = 0;
	    var height = 0;
	    var size = backgroundImage.size;
	    if (size[0].size === BACKGROUND_SIZE.CONTAIN || size[0].size === BACKGROUND_SIZE.COVER) {
	        var targetRatio = bounds.width / bounds.height;
	        var currentRatio = image.width / image.height;
	        return targetRatio < currentRatio !== (size[0].size === BACKGROUND_SIZE.COVER) ? new _Size2.default(bounds.width, bounds.width / currentRatio) : new _Size2.default(bounds.height * currentRatio, bounds.height);
	    }

	    if (size[0].value) {
	        width = size[0].value.getAbsoluteValue(bounds.width);
	    }

	    if (size[0].size === BACKGROUND_SIZE.AUTO && size[1].size === BACKGROUND_SIZE.AUTO) {
	        height = image.height;
	    } else if (size[1].size === BACKGROUND_SIZE.AUTO) {
	        height = width / image.width * image.height;
	    } else if (size[1].value) {
	        height = size[1].value.getAbsoluteValue(bounds.height);
	    }

	    if (size[0].size === BACKGROUND_SIZE.AUTO) {
	        width = height / image.height * image.width;
	    }

	    return new _Size2.default(width, height);
	};

	var AUTO_SIZE = new BackgroundSize(AUTO);

	var calculateBackgroungPaintingArea = exports.calculateBackgroungPaintingArea = function calculateBackgroungPaintingArea(curves, clip) {
	    switch (clip) {
	        case BACKGROUND_CLIP.BORDER_BOX:
	            return (0, _Bounds.calculateBorderBoxPath)(curves);
	        case BACKGROUND_CLIP.PADDING_BOX:
	        default:
	            return (0, _Bounds.calculatePaddingBoxPath)(curves);
	    }
	};

	var calculateBackgroungPositioningArea = exports.calculateBackgroungPositioningArea = function calculateBackgroungPositioningArea(backgroundOrigin, bounds, padding, border) {
	    var paddingBox = (0, _Bounds.calculatePaddingBox)(bounds, border);

	    switch (backgroundOrigin) {
	        case BACKGROUND_ORIGIN.BORDER_BOX:
	            return bounds;
	        case BACKGROUND_ORIGIN.CONTENT_BOX:
	            var paddingLeft = padding[_padding.PADDING_SIDES.LEFT].getAbsoluteValue(bounds.width);
	            var paddingRight = padding[_padding.PADDING_SIDES.RIGHT].getAbsoluteValue(bounds.width);
	            var paddingTop = padding[_padding.PADDING_SIDES.TOP].getAbsoluteValue(bounds.width);
	            var paddingBottom = padding[_padding.PADDING_SIDES.BOTTOM].getAbsoluteValue(bounds.width);
	            return new _Bounds.Bounds(paddingBox.left + paddingLeft, paddingBox.top + paddingTop, paddingBox.width - paddingLeft - paddingRight, paddingBox.height - paddingTop - paddingBottom);
	        case BACKGROUND_ORIGIN.PADDING_BOX:
	        default:
	            return paddingBox;
	    }
	};

	var calculateBackgroundPosition = exports.calculateBackgroundPosition = function calculateBackgroundPosition(position, size, bounds) {
	    return new _Vector2.default(position[0].getAbsoluteValue(bounds.width - size.width), position[1].getAbsoluteValue(bounds.height - size.height));
	};

	var calculateBackgroundRepeatPath = exports.calculateBackgroundRepeatPath = function calculateBackgroundRepeatPath(background, position, size, backgroundPositioningArea, bounds) {
	    var repeat = background.repeat;
	    switch (repeat) {
	        case BACKGROUND_REPEAT.REPEAT_X:
	            return [new _Vector2.default(Math.round(bounds.left), Math.round(backgroundPositioningArea.top + position.y)), new _Vector2.default(Math.round(bounds.left + bounds.width), Math.round(backgroundPositioningArea.top + position.y)), new _Vector2.default(Math.round(bounds.left + bounds.width), Math.round(size.height + backgroundPositioningArea.top + position.y)), new _Vector2.default(Math.round(bounds.left), Math.round(size.height + backgroundPositioningArea.top + position.y))];
	        case BACKGROUND_REPEAT.REPEAT_Y:
	            return [new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x), Math.round(bounds.top)), new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x + size.width), Math.round(bounds.top)), new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x + size.width), Math.round(bounds.height + bounds.top)), new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x), Math.round(bounds.height + bounds.top))];
	        case BACKGROUND_REPEAT.NO_REPEAT:
	            return [new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x), Math.round(backgroundPositioningArea.top + position.y)), new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x + size.width), Math.round(backgroundPositioningArea.top + position.y)), new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x + size.width), Math.round(backgroundPositioningArea.top + position.y + size.height)), new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x), Math.round(backgroundPositioningArea.top + position.y + size.height))];
	        default:
	            return [new _Vector2.default(Math.round(bounds.left), Math.round(bounds.top)), new _Vector2.default(Math.round(bounds.left + bounds.width), Math.round(bounds.top)), new _Vector2.default(Math.round(bounds.left + bounds.width), Math.round(bounds.height + bounds.top)), new _Vector2.default(Math.round(bounds.left), Math.round(bounds.height + bounds.top))];
	    }
	};

	var parseBackground = exports.parseBackground = function parseBackground(style, resourceLoader) {
	    return {
	        backgroundColor: new _Color2.default(style.backgroundColor),
	        backgroundImage: parseBackgroundImages(style, resourceLoader),
	        backgroundClip: parseBackgroundClip(style.backgroundClip),
	        backgroundOrigin: parseBackgroundOrigin(style.backgroundOrigin)
	    };
	};

	var parseBackgroundClip = function parseBackgroundClip(backgroundClip) {
	    switch (backgroundClip) {
	        case 'padding-box':
	            return BACKGROUND_CLIP.PADDING_BOX;
	        case 'content-box':
	            return BACKGROUND_CLIP.CONTENT_BOX;
	    }
	    return BACKGROUND_CLIP.BORDER_BOX;
	};

	var parseBackgroundOrigin = function parseBackgroundOrigin(backgroundOrigin) {
	    switch (backgroundOrigin) {
	        case 'padding-box':
	            return BACKGROUND_ORIGIN.PADDING_BOX;
	        case 'content-box':
	            return BACKGROUND_ORIGIN.CONTENT_BOX;
	    }
	    return BACKGROUND_ORIGIN.BORDER_BOX;
	};

	var parseBackgroundRepeat = function parseBackgroundRepeat(backgroundRepeat) {
	    switch (backgroundRepeat.trim()) {
	        case 'no-repeat':
	            return BACKGROUND_REPEAT.NO_REPEAT;
	        case 'repeat-x':
	        case 'repeat no-repeat':
	            return BACKGROUND_REPEAT.REPEAT_X;
	        case 'repeat-y':
	        case 'no-repeat repeat':
	            return BACKGROUND_REPEAT.REPEAT_Y;
	        case 'repeat':
	            return BACKGROUND_REPEAT.REPEAT;
	    }

	    if (process.env.NODE_ENV !== 'production') {
	        console.error('Invalid background-repeat value "' + backgroundRepeat + '"');
	    }

	    return BACKGROUND_REPEAT.REPEAT;
	};

	var parseBackgroundImages = function parseBackgroundImages(style, resourceLoader) {
	    var sources = parseBackgroundImage(style.backgroundImage).map(function (backgroundImage) {
	        if (backgroundImage.method === 'url') {
	            var key = resourceLoader.loadImage(backgroundImage.args[0]);
	            backgroundImage.args = key ? [key] : [];
	        }
	        return backgroundImage;
	    });
	    var positions = style.backgroundPosition.split(',');
	    var repeats = style.backgroundRepeat.split(',');
	    var sizes = style.backgroundSize.split(',');

	    return sources.map(function (source, index) {
	        var size = (sizes[index] || AUTO).trim().split(' ').map(parseBackgroundSize);
	        var position = (positions[index] || AUTO).trim().split(' ').map(parseBackgoundPosition);

	        return {
	            source: source,
	            repeat: parseBackgroundRepeat(typeof repeats[index] === 'string' ? repeats[index] : repeats[0]),
	            size: size.length < 2 ? [size[0], AUTO_SIZE] : [size[0], size[1]],
	            position: position.length < 2 ? [position[0], position[0]] : [position[0], position[1]]
	        };
	    });
	};

	var parseBackgroundSize = function parseBackgroundSize(size) {
	    return size === 'auto' ? AUTO_SIZE : new BackgroundSize(size);
	};

	var parseBackgoundPosition = function parseBackgoundPosition(position) {
	    switch (position) {
	        case 'bottom':
	        case 'right':
	            return new _Length2.default('100%');
	        case 'left':
	        case 'top':
	            return new _Length2.default('0%');
	        case 'auto':
	            return new _Length2.default('0');
	    }
	    return new _Length2.default(position);
	};

	var parseBackgroundImage = exports.parseBackgroundImage = function parseBackgroundImage(image) {
	    var whitespace = /^\s$/;
	    var results = [];

	    var args = [];
	    var method = '';
	    var quote = null;
	    var definition = '';
	    var mode = 0;
	    var numParen = 0;

	    var appendResult = function appendResult() {
	        var prefix = '';
	        if (method) {
	            if (definition.substr(0, 1) === '"') {
	                definition = definition.substr(1, definition.length - 2);
	            }

	            if (definition) {
	                args.push(definition.trim());
	            }

	            var prefix_i = method.indexOf('-', 1) + 1;
	            if (method.substr(0, 1) === '-' && prefix_i > 0) {
	                prefix = method.substr(0, prefix_i).toLowerCase();
	                method = method.substr(prefix_i);
	            }
	            method = method.toLowerCase();
	            if (method !== 'none') {
	                results.push({
	                    prefix: prefix,
	                    method: method,
	                    args: args
	                });
	            }
	        }
	        args = [];
	        method = definition = '';
	    };

	    image.split('').forEach(function (c) {
	        if (mode === 0 && whitespace.test(c)) {
	            return;
	        }
	        switch (c) {
	            case '"':
	                if (!quote) {
	                    quote = c;
	                } else if (quote === c) {
	                    quote = null;
	                }
	                break;
	            case '(':
	                if (quote) {
	                    break;
	                } else if (mode === 0) {
	                    mode = 1;
	                    return;
	                } else {
	                    numParen++;
	                }
	                break;
	            case ')':
	                if (quote) {
	                    break;
	                } else if (mode === 1) {
	                    if (numParen === 0) {
	                        mode = 0;
	                        appendResult();
	                        return;
	                    } else {
	                        numParen--;
	                    }
	                }
	                break;

	            case ',':
	                if (quote) {
	                    break;
	                } else if (mode === 0) {
	                    appendResult();
	                    return;
	                } else if (mode === 1) {
	                    if (numParen === 0 && !method.match(/^url$/i)) {
	                        args.push(definition.trim());
	                        definition = '';
	                        return;
	                    }
	                }
	                break;
	        }

	        if (mode === 0) {
	            method += c;
	        } else {
	            definition += c;
	        }
	    });

	    appendResult();
	    return results;
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var LENGTH_TYPE = exports.LENGTH_TYPE = {
	    PX: 0,
	    PERCENTAGE: 1
	};

	var Length = function () {
	    function Length(value) {
	        _classCallCheck(this, Length);

	        this.type = value.substr(value.length - 1) === '%' ? LENGTH_TYPE.PERCENTAGE : LENGTH_TYPE.PX;
	        var parsedValue = parseFloat(value);
	        if (process.env.NODE_ENV !== 'production' && isNaN(parsedValue)) {
	            console.error('Invalid value given for Length: "' + value + '"');
	        }
	        this.value = isNaN(parsedValue) ? 0 : parsedValue;
	    }

	    _createClass(Length, [{
	        key: 'isPercentage',
	        value: function isPercentage() {
	            return this.type === LENGTH_TYPE.PERCENTAGE;
	        }
	    }, {
	        key: 'getAbsoluteValue',
	        value: function getAbsoluteValue(parentLength) {
	            return this.isPercentage() ? parentLength * (this.value / 100) : this.value;
	        }
	    }], [{
	        key: 'create',
	        value: function create(v) {
	            return new Length(v);
	        }
	    }]);

	    return Length;
	}();

	exports.default = Length;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 18 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var Size = function Size(width, height) {
	    _classCallCheck(this, Size);

	    this.width = width;
	    this.height = height;
	};

	exports.default = Size;

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _Path = __webpack_require__(7);

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var Vector = function Vector(x, y) {
	    _classCallCheck(this, Vector);

	    this.type = _Path.PATH.VECTOR;
	    this.x = x;
	    this.y = y;
	    if (process.env.NODE_ENV !== 'production') {
	        if (isNaN(x)) {
	            console.error('Invalid x value given for Vector');
	        }
	        if (isNaN(y)) {
	            console.error('Invalid y value given for Vector');
	        }
	    }
	};

	exports.default = Vector;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.parseBoundCurves = exports.calculatePaddingBoxPath = exports.calculateBorderBoxPath = exports.parsePathForBorder = exports.parseDocumentSize = exports.calculateContentBox = exports.calculatePaddingBox = exports.parseBounds = exports.Bounds = undefined;

	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();

	var _Vector = __webpack_require__(19);

	var _Vector2 = _interopRequireDefault(_Vector);

	var _BezierCurve = __webpack_require__(21);

	var _BezierCurve2 = _interopRequireDefault(_BezierCurve);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var TOP = 0;
	var RIGHT = 1;
	var BOTTOM = 2;
	var LEFT = 3;

	var H = 0;
	var V = 1;

	var Bounds = exports.Bounds = function () {
	    function Bounds(x, y, w, h) {
	        _classCallCheck(this, Bounds);

	        this.left = x;
	        this.top = y;
	        this.width = w;
	        this.height = h;
	    }

	    _createClass(Bounds, null, [{
	        key: 'fromClientRect',
	        value: function fromClientRect(clientRect, scrollX, scrollY) {
	            return new Bounds(clientRect.left + scrollX, clientRect.top + scrollY, clientRect.width, clientRect.height);
	        }
	    }]);

	    return Bounds;
	}();

	var parseBounds = exports.parseBounds = function parseBounds(node, scrollX, scrollY) {
	    return Bounds.fromClientRect(node.getBoundingClientRect(), scrollX, scrollY);
	};

	var calculatePaddingBox = exports.calculatePaddingBox = function calculatePaddingBox(bounds, borders) {
	    return new Bounds(bounds.left + borders[LEFT].borderWidth, bounds.top + borders[TOP].borderWidth, bounds.width - (borders[RIGHT].borderWidth + borders[LEFT].borderWidth), bounds.height - (borders[TOP].borderWidth + borders[BOTTOM].borderWidth));
	};

	var calculateContentBox = exports.calculateContentBox = function calculateContentBox(bounds, padding, borders) {
	    // TODO support percentage paddings
	    var paddingTop = padding[TOP].value;
	    var paddingRight = padding[RIGHT].value;
	    var paddingBottom = padding[BOTTOM].value;
	    var paddingLeft = padding[LEFT].value;

	    return new Bounds(bounds.left + paddingLeft + borders[LEFT].borderWidth, bounds.top + paddingTop + borders[TOP].borderWidth, bounds.width - (borders[RIGHT].borderWidth + borders[LEFT].borderWidth + paddingLeft + paddingRight), bounds.height - (borders[TOP].borderWidth + borders[BOTTOM].borderWidth + paddingTop + paddingBottom));
	};

	var parseDocumentSize = exports.parseDocumentSize = function parseDocumentSize(document) {
	    var body = document.body;
	    var documentElement = document.documentElement;

	    if (!body || !documentElement) {
	        throw new Error(process.env.NODE_ENV !== 'production' ? 'Unable to get document size' : '');
	    }
	    var width = Math.max(Math.max(body.scrollWidth, documentElement.scrollWidth), Math.max(body.offsetWidth, documentElement.offsetWidth), Math.max(body.clientWidth, documentElement.clientWidth));

	    var height = Math.max(Math.max(body.scrollHeight, documentElement.scrollHeight), Math.max(body.offsetHeight, documentElement.offsetHeight), Math.max(body.clientHeight, documentElement.clientHeight));

	    return new Bounds(0, 0, width, height);
	};

	var parsePathForBorder = exports.parsePathForBorder = function parsePathForBorder(curves, borderSide) {
	    switch (borderSide) {
	        case TOP:
	            return createPathFromCurves(curves.topLeftOuter, curves.topLeftInner, curves.topRightOuter, curves.topRightInner);
	        case RIGHT:
	            return createPathFromCurves(curves.topRightOuter, curves.topRightInner, curves.bottomRightOuter, curves.bottomRightInner);
	        case BOTTOM:
	            return createPathFromCurves(curves.bottomRightOuter, curves.bottomRightInner, curves.bottomLeftOuter, curves.bottomLeftInner);
	        case LEFT:
	        default:
	            return createPathFromCurves(curves.bottomLeftOuter, curves.bottomLeftInner, curves.topLeftOuter, curves.topLeftInner);
	    }
	};

	var createPathFromCurves = function createPathFromCurves(outer1, inner1, outer2, inner2) {
	    var path = [];
	    if (outer1 instanceof _BezierCurve2.default) {
	        path.push(outer1.subdivide(0.5, false));
	    } else {
	        path.push(outer1);
	    }

	    if (outer2 instanceof _BezierCurve2.default) {
	        path.push(outer2.subdivide(0.5, true));
	    } else {
	        path.push(outer2);
	    }

	    if (inner2 instanceof _BezierCurve2.default) {
	        path.push(inner2.subdivide(0.5, true).reverse());
	    } else {
	        path.push(inner2);
	    }

	    if (inner1 instanceof _BezierCurve2.default) {
	        path.push(inner1.subdivide(0.5, false).reverse());
	    } else {
	        path.push(inner1);
	    }

	    return path;
	};

	var calculateBorderBoxPath = exports.calculateBorderBoxPath = function calculateBorderBoxPath(curves) {
	    return [curves.topLeftOuter, curves.topRightOuter, curves.bottomRightOuter, curves.bottomLeftOuter];
	};

	var calculatePaddingBoxPath = exports.calculatePaddingBoxPath = function calculatePaddingBoxPath(curves) {
	    return [curves.topLeftInner, curves.topRightInner, curves.bottomRightInner, curves.bottomLeftInner];
	};

	var parseBoundCurves = exports.parseBoundCurves = function parseBoundCurves(bounds, borders, borderRadius) {
	    var HALF_WIDTH = bounds.width / 2;
	    var HALF_HEIGHT = bounds.height / 2;
	    var tlh = borderRadius[CORNER.TOP_LEFT][H].getAbsoluteValue(bounds.width) < HALF_WIDTH ? borderRadius[CORNER.TOP_LEFT][H].getAbsoluteValue(bounds.width) : HALF_WIDTH;
	    var tlv = borderRadius[CORNER.TOP_LEFT][V].getAbsoluteValue(bounds.height) < HALF_HEIGHT ? borderRadius[CORNER.TOP_LEFT][V].getAbsoluteValue(bounds.height) : HALF_HEIGHT;
	    var trh = borderRadius[CORNER.TOP_RIGHT][H].getAbsoluteValue(bounds.width) < HALF_WIDTH ? borderRadius[CORNER.TOP_RIGHT][H].getAbsoluteValue(bounds.width) : HALF_WIDTH;
	    var trv = borderRadius[CORNER.TOP_RIGHT][V].getAbsoluteValue(bounds.height) < HALF_HEIGHT ? borderRadius[CORNER.TOP_RIGHT][V].getAbsoluteValue(bounds.height) : HALF_HEIGHT;
	    var brh = borderRadius[CORNER.BOTTOM_RIGHT][H].getAbsoluteValue(bounds.width) < HALF_WIDTH ? borderRadius[CORNER.BOTTOM_RIGHT][H].getAbsoluteValue(bounds.width) : HALF_WIDTH;
	    var brv = borderRadius[CORNER.BOTTOM_RIGHT][V].getAbsoluteValue(bounds.height) < HALF_HEIGHT ? borderRadius[CORNER.BOTTOM_RIGHT][V].getAbsoluteValue(bounds.height) : HALF_HEIGHT;
	    var blh = borderRadius[CORNER.BOTTOM_LEFT][H].getAbsoluteValue(bounds.width) < HALF_WIDTH ? borderRadius[CORNER.BOTTOM_LEFT][H].getAbsoluteValue(bounds.width) : HALF_WIDTH;
	    var blv = borderRadius[CORNER.BOTTOM_LEFT][V].getAbsoluteValue(bounds.height) < HALF_HEIGHT ? borderRadius[CORNER.BOTTOM_LEFT][V].getAbsoluteValue(bounds.height) : HALF_HEIGHT;

	    var topWidth = bounds.width - trh;
	    var rightHeight = bounds.height - brv;
	    var bottomWidth = bounds.width - brh;
	    var leftHeight = bounds.height - blv;

	    return {
	        topLeftOuter: tlh > 0 || tlv > 0 ? getCurvePoints(bounds.left, bounds.top, tlh, tlv, CORNER.TOP_LEFT) : new _Vector2.default(bounds.left, bounds.top),
	        topLeftInner: tlh > 0 || tlv > 0 ? getCurvePoints(bounds.left + borders[LEFT].borderWidth, bounds.top + borders[TOP].borderWidth, Math.max(0, tlh - borders[LEFT].borderWidth), Math.max(0, tlv - borders[TOP].borderWidth), CORNER.TOP_LEFT) : new _Vector2.default(bounds.left + borders[LEFT].borderWidth, bounds.top + borders[TOP].borderWidth),
	        topRightOuter: trh > 0 || trv > 0 ? getCurvePoints(bounds.left + topWidth, bounds.top, trh, trv, CORNER.TOP_RIGHT) : new _Vector2.default(bounds.left + bounds.width, bounds.top),
	        topRightInner: trh > 0 || trv > 0 ? getCurvePoints(bounds.left + Math.min(topWidth, bounds.width + borders[LEFT].borderWidth), bounds.top + borders[TOP].borderWidth, topWidth > bounds.width + borders[LEFT].borderWidth ? 0 : trh - borders[LEFT].borderWidth, trv - borders[TOP].borderWidth, CORNER.TOP_RIGHT) : new _Vector2.default(bounds.left + bounds.width - borders[RIGHT].borderWidth, bounds.top + borders[TOP].borderWidth),
	        bottomRightOuter: brh > 0 || brv > 0 ? getCurvePoints(bounds.left + bottomWidth, bounds.top + rightHeight, brh, brv, CORNER.BOTTOM_RIGHT) : new _Vector2.default(bounds.left + bounds.width, bounds.top + bounds.height),
	        bottomRightInner: brh > 0 || brv > 0 ? getCurvePoints(bounds.left + Math.min(bottomWidth, bounds.width - borders[LEFT].borderWidth), bounds.top + Math.min(rightHeight, bounds.height + borders[TOP].borderWidth), Math.max(0, brh - borders[RIGHT].borderWidth), brv - borders[BOTTOM].borderWidth, CORNER.BOTTOM_RIGHT) : new _Vector2.default(bounds.left + bounds.width - borders[RIGHT].borderWidth, bounds.top + bounds.height - borders[BOTTOM].borderWidth),
	        bottomLeftOuter: blh > 0 || blv > 0 ? getCurvePoints(bounds.left, bounds.top + leftHeight, blh, blv, CORNER.BOTTOM_LEFT) : new _Vector2.default(bounds.left, bounds.top + bounds.height),
	        bottomLeftInner: blh > 0 || blv > 0 ? getCurvePoints(bounds.left + borders[LEFT].borderWidth, bounds.top + leftHeight, Math.max(0, blh - borders[LEFT].borderWidth), blv - borders[BOTTOM].borderWidth, CORNER.BOTTOM_LEFT) : new _Vector2.default(bounds.left + borders[LEFT].borderWidth, bounds.top + bounds.height - borders[BOTTOM].borderWidth)
	    };
	};

	var CORNER = {
	    TOP_LEFT: 0,
	    TOP_RIGHT: 1,
	    BOTTOM_RIGHT: 2,
	    BOTTOM_LEFT: 3
	};

	var getCurvePoints = function getCurvePoints(x, y, r1, r2, position) {
	    var kappa = 4 * ((Math.sqrt(2) - 1) / 3);
	    var ox = r1 * kappa; // control point offset horizontal
	    var oy = r2 * kappa; // control point offset vertical
	    var xm = x + r1; // x-middle
	    var ym = y + r2; // y-middle

	    switch (position) {
	        case CORNER.TOP_LEFT:
	            return new _BezierCurve2.default(new _Vector2.default(x, ym), new _Vector2.default(x, ym - oy), new _Vector2.default(xm - ox, y), new _Vector2.default(xm, y));
	        case CORNER.TOP_RIGHT:
	            return new _BezierCurve2.default(new _Vector2.default(x, y), new _Vector2.default(x + ox, y), new _Vector2.default(xm, ym - oy), new _Vector2.default(xm, ym));
	        case CORNER.BOTTOM_RIGHT:
	            return new _BezierCurve2.default(new _Vector2.default(xm, y), new _Vector2.default(xm, y + oy), new _Vector2.default(x + ox, ym), new _Vector2.default(x, ym));
	        case CORNER.BOTTOM_LEFT:
	        default:
	            return new _BezierCurve2.default(new _Vector2.default(xm, ym), new _Vector2.default(xm - ox, ym), new _Vector2.default(x, y + oy), new _Vector2.default(x, y));
	    }
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();

	var _Path = __webpack_require__(7);

	var _Vector = __webpack_require__(19);

	var _Vector2 = _interopRequireDefault(_Vector);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var lerp = function lerp(a, b, t) {
	    return new _Vector2.default(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
	};

	var BezierCurve = function () {
	    function BezierCurve(start, startControl, endControl, end) {
	        _classCallCheck(this, BezierCurve);

	        this.type = _Path.PATH.BEZIER_CURVE;
	        this.start = start;
	        this.startControl = startControl;
	        this.endControl = endControl;
	        this.end = end;
	    }

	    _createClass(BezierCurve, [{
	        key: 'subdivide',
	        value: function subdivide(t, firstHalf) {
	            var ab = lerp(this.start, this.startControl, t);
	            var bc = lerp(this.startControl, this.endControl, t);
	            var cd = lerp(this.endControl, this.end, t);
	            var abbc = lerp(ab, bc, t);
	            var bccd = lerp(bc, cd, t);
	            var dest = lerp(abbc, bccd, t);
	            return firstHalf ? new BezierCurve(this.start, ab, abbc, dest) : new BezierCurve(dest, bccd, cd, this.end);
	        }
	    }, {
	        key: 'reverse',
	        value: function reverse() {
	            return new BezierCurve(this.end, this.endControl, this.startControl, this.start);
	        }
	    }]);

	    return BezierCurve;
	}();

	exports.default = BezierCurve;

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.parsePadding = exports.PADDING_SIDES = undefined;

	var _Length = __webpack_require__(17);

	var _Length2 = _interopRequireDefault(_Length);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	var PADDING_SIDES = exports.PADDING_SIDES = {
	    TOP: 0,
	    RIGHT: 1,
	    BOTTOM: 2,
	    LEFT: 3
	};

	var SIDES = ['top', 'right', 'bottom', 'left'];

	var parsePadding = exports.parsePadding = function parsePadding(style) {
	    return SIDES.map(function (side) {
	        return new _Length2.default(style.getPropertyValue('padding-' + side));
	    });
	};

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.parseBorder = exports.BORDER_SIDES = exports.BORDER_STYLE = undefined;

	var _Color = __webpack_require__(9);

	var _Color2 = _interopRequireDefault(_Color);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	var BORDER_STYLE = exports.BORDER_STYLE = {
	    NONE: 0,
	    SOLID: 1
	};

	var BORDER_SIDES = exports.BORDER_SIDES = {
	    TOP: 0,
	    RIGHT: 1,
	    BOTTOM: 2,
	    LEFT: 3
	};

	var SIDES = Object.keys(BORDER_SIDES).map(function (s) {
	    return s.toLowerCase();
	});

	var parseBorderStyle = function parseBorderStyle(style) {
	    switch (style) {
	        case 'none':
	            return BORDER_STYLE.NONE;
	    }
	    return BORDER_STYLE.SOLID;
	};

	var parseBorder = exports.parseBorder = function parseBorder(style) {
	    return SIDES.map(function (side) {
	        var borderColor = new _Color2.default(style.getPropertyValue('border-' + side + '-color'));
	        var borderStyle = parseBorderStyle(style.getPropertyValue('border-' + side + '-style'));
	        var borderWidth = parseFloat(style.getPropertyValue('border-' + side + '-width'));
	        return {
	            borderColor: borderColor,
	            borderStyle: borderStyle,
	            borderWidth: isNaN(borderWidth) ? 0 : borderWidth
	        };
	    });
	};

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.parseBorderRadius = undefined;

	var _slicedToArray = function () {
	    function sliceIterator(arr, i) {
	        var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
	            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	                _arr.push(_s.value);if (i && _arr.length === i) break;
	            }
	        } catch (err) {
	            _d = true;_e = err;
	        } finally {
	            try {
	                if (!_n && _i["return"]) _i["return"]();
	            } finally {
	                if (_d) throw _e;
	            }
	        }return _arr;
	    }return function (arr, i) {
	        if (Array.isArray(arr)) {
	            return arr;
	        } else if (Symbol.iterator in Object(arr)) {
	            return sliceIterator(arr, i);
	        } else {
	            throw new TypeError("Invalid attempt to destructure non-iterable instance");
	        }
	    };
	}();

	var _Length = __webpack_require__(17);

	var _Length2 = _interopRequireDefault(_Length);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	var SIDES = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

	var parseBorderRadius = exports.parseBorderRadius = function parseBorderRadius(style) {
	    return SIDES.map(function (side) {
	        var value = style.getPropertyValue('border-' + side + '-radius');

	        var _value$split$map = value.split(' ').map(_Length2.default.create),
	            _value$split$map2 = _slicedToArray(_value$split$map, 2),
	            horizontal = _value$split$map2[0],
	            vertical = _value$split$map2[1];

	        return typeof vertical === 'undefined' ? [horizontal, horizontal] : [horizontal, vertical];
	    });
	};

/***/ }),
/* 25 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var DISPLAY = exports.DISPLAY = {
	    NONE: 1 << 0,
	    BLOCK: 1 << 1,
	    INLINE: 1 << 2,
	    RUN_IN: 1 << 3,
	    FLOW: 1 << 4,
	    FLOW_ROOT: 1 << 5,
	    TABLE: 1 << 6,
	    FLEX: 1 << 7,
	    GRID: 1 << 8,
	    RUBY: 1 << 9,
	    SUBGRID: 1 << 10,
	    LIST_ITEM: 1 << 11,
	    TABLE_ROW_GROUP: 1 << 12,
	    TABLE_HEADER_GROUP: 1 << 13,
	    TABLE_FOOTER_GROUP: 1 << 14,
	    TABLE_ROW: 1 << 15,
	    TABLE_CELL: 1 << 16,
	    TABLE_COLUMN_GROUP: 1 << 17,
	    TABLE_COLUMN: 1 << 18,
	    TABLE_CAPTION: 1 << 19,
	    RUBY_BASE: 1 << 20,
	    RUBY_TEXT: 1 << 21,
	    RUBY_BASE_CONTAINER: 1 << 22,
	    RUBY_TEXT_CONTAINER: 1 << 23,
	    CONTENTS: 1 << 24,
	    INLINE_BLOCK: 1 << 25,
	    INLINE_LIST_ITEM: 1 << 26,
	    INLINE_TABLE: 1 << 27,
	    INLINE_FLEX: 1 << 28,
	    INLINE_GRID: 1 << 29
	};

	var parseDisplayValue = function parseDisplayValue(display) {
	    switch (display) {
	        case 'block':
	            return DISPLAY.BLOCK;
	        case 'inline':
	            return DISPLAY.INLINE;
	        case 'run-in':
	            return DISPLAY.RUN_IN;
	        case 'flow':
	            return DISPLAY.FLOW;
	        case 'flow-root':
	            return DISPLAY.FLOW_ROOT;
	        case 'table':
	            return DISPLAY.TABLE;
	        case 'flex':
	            return DISPLAY.FLEX;
	        case 'grid':
	            return DISPLAY.GRID;
	        case 'ruby':
	            return DISPLAY.RUBY;
	        case 'subgrid':
	            return DISPLAY.SUBGRID;
	        case 'list-item':
	            return DISPLAY.LIST_ITEM;
	        case 'table-row-group':
	            return DISPLAY.TABLE_ROW_GROUP;
	        case 'table-header-group':
	            return DISPLAY.TABLE_HEADER_GROUP;
	        case 'table-footer-group':
	            return DISPLAY.TABLE_FOOTER_GROUP;
	        case 'table-row':
	            return DISPLAY.TABLE_ROW;
	        case 'table-cell':
	            return DISPLAY.TABLE_CELL;
	        case 'table-column-group':
	            return DISPLAY.TABLE_COLUMN_GROUP;
	        case 'table-column':
	            return DISPLAY.TABLE_COLUMN;
	        case 'table-caption':
	            return DISPLAY.TABLE_CAPTION;
	        case 'ruby-base':
	            return DISPLAY.RUBY_BASE;
	        case 'ruby-text':
	            return DISPLAY.RUBY_TEXT;
	        case 'ruby-base-container':
	            return DISPLAY.RUBY_BASE_CONTAINER;
	        case 'ruby-text-container':
	            return DISPLAY.RUBY_TEXT_CONTAINER;
	        case 'contents':
	            return DISPLAY.CONTENTS;
	        case 'inline-block':
	            return DISPLAY.INLINE_BLOCK;
	        case 'inline-list-item':
	            return DISPLAY.INLINE_LIST_ITEM;
	        case 'inline-table':
	            return DISPLAY.INLINE_TABLE;
	        case 'inline-flex':
	            return DISPLAY.INLINE_FLEX;
	        case 'inline-grid':
	            return DISPLAY.INLINE_GRID;
	    }

	    return DISPLAY.NONE;
	};

	var setDisplayBit = function setDisplayBit(bit, display) {
	    return bit | parseDisplayValue(display);
	};

	var parseDisplay = exports.parseDisplay = function parseDisplay(display) {
	    return display.split(' ').reduce(setDisplayBit, 0);
	};

/***/ }),
/* 26 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var FLOAT = exports.FLOAT = {
	    NONE: 0,
	    LEFT: 1,
	    RIGHT: 2,
	    INLINE_START: 3,
	    INLINE_END: 4
	};

	var parseCSSFloat = exports.parseCSSFloat = function parseCSSFloat(float) {
	    switch (float) {
	        case 'left':
	            return FLOAT.LEFT;
	        case 'right':
	            return FLOAT.RIGHT;
	        case 'inline-start':
	            return FLOAT.INLINE_START;
	        case 'inline-end':
	            return FLOAT.INLINE_END;
	    }
	    return FLOAT.NONE;
	};

/***/ }),
/* 27 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var parseFontWeight = function parseFontWeight(weight) {
	    switch (weight) {
	        case 'normal':
	            return 400;
	        case 'bold':
	            return 700;
	    }

	    var value = parseInt(weight, 10);
	    return isNaN(value) ? 400 : value;
	};

	var parseFont = exports.parseFont = function parseFont(style) {
	    var fontFamily = style.fontFamily;
	    var fontSize = style.fontSize;
	    var fontStyle = style.fontStyle;
	    var fontVariant = style.fontVariant;
	    var fontWeight = parseFontWeight(style.fontWeight);

	    return {
	        fontFamily: fontFamily,
	        fontSize: fontSize,
	        fontStyle: fontStyle,
	        fontVariant: fontVariant,
	        fontWeight: fontWeight
	    };
	};

/***/ }),
/* 28 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var parseLetterSpacing = exports.parseLetterSpacing = function parseLetterSpacing(letterSpacing) {
	    if (letterSpacing === 'normal') {
	        return 0;
	    }
	    var value = parseFloat(letterSpacing);
	    return isNaN(value) ? 0 : value;
	};

/***/ }),
/* 29 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var OVERFLOW = exports.OVERFLOW = {
	    VISIBLE: 0,
	    HIDDEN: 1,
	    SCROLL: 2,
	    AUTO: 3
	};

	var parseOverflow = exports.parseOverflow = function parseOverflow(overflow) {
	    switch (overflow) {
	        case 'hidden':
	            return OVERFLOW.HIDDEN;
	        case 'scroll':
	            return OVERFLOW.SCROLL;
	        case 'auto':
	            return OVERFLOW.AUTO;
	        case 'visible':
	        default:
	            return OVERFLOW.VISIBLE;
	    }
	};

/***/ }),
/* 30 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var POSITION = exports.POSITION = {
	    STATIC: 0,
	    RELATIVE: 1,
	    ABSOLUTE: 2,
	    FIXED: 3,
	    STICKY: 4
	};

	var parsePosition = exports.parsePosition = function parsePosition(position) {
	    switch (position) {
	        case 'relative':
	            return POSITION.RELATIVE;
	        case 'absolute':
	            return POSITION.ABSOLUTE;
	        case 'fixed':
	            return POSITION.FIXED;
	        case 'sticky':
	            return POSITION.STICKY;
	    }

	    return POSITION.STATIC;
	};

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.parseTextShadow = undefined;

	var _Color = __webpack_require__(9);

	var _Color2 = _interopRequireDefault(_Color);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	var NUMBER = /^([+-]|\d|\.)$/i;

	var parseTextShadow = exports.parseTextShadow = function parseTextShadow(textShadow) {
	    if (textShadow === 'none' || typeof textShadow !== 'string') {
	        return null;
	    }

	    var currentValue = '';
	    var isLength = false;
	    var values = [];
	    var shadows = [];
	    var numParens = 0;
	    var color = null;

	    var appendValue = function appendValue() {
	        if (currentValue.length) {
	            if (isLength) {
	                values.push(parseFloat(currentValue));
	            } else {
	                color = new _Color2.default(currentValue);
	            }
	        }
	        isLength = false;
	        currentValue = '';
	    };

	    var appendShadow = function appendShadow() {
	        if (values.length && color !== null) {
	            shadows.push({
	                color: color,
	                offsetX: values[0] || 0,
	                offsetY: values[1] || 0,
	                blur: values[2] || 0
	            });
	        }
	        values.splice(0, values.length);
	        color = null;
	    };

	    for (var i = 0; i < textShadow.length; i++) {
	        var c = textShadow[i];
	        switch (c) {
	            case '(':
	                currentValue += c;
	                numParens++;
	                break;
	            case ')':
	                currentValue += c;
	                numParens--;
	                break;
	            case ',':
	                if (numParens === 0) {
	                    appendValue();
	                    appendShadow();
	                } else {
	                    currentValue += c;
	                }
	                break;
	            case ' ':
	                if (numParens === 0) {
	                    appendValue();
	                } else {
	                    currentValue += c;
	                }
	                break;
	            default:
	                if (currentValue.length === 0 && NUMBER.test(c)) {
	                    isLength = true;
	                }
	                currentValue += c;
	        }
	    }

	    appendValue();
	    appendShadow();

	    if (shadows.length === 0) {
	        return null;
	    }

	    return shadows;
	};

/***/ }),
/* 32 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var TEXT_TRANSFORM = exports.TEXT_TRANSFORM = {
	    NONE: 0,
	    LOWERCASE: 1,
	    UPPERCASE: 2,
	    CAPITALIZE: 3
	};

	var parseTextTransform = exports.parseTextTransform = function parseTextTransform(textTransform) {
	    switch (textTransform) {
	        case 'uppercase':
	            return TEXT_TRANSFORM.UPPERCASE;
	        case 'lowercase':
	            return TEXT_TRANSFORM.LOWERCASE;
	        case 'capitalize':
	            return TEXT_TRANSFORM.CAPITALIZE;
	    }

	    return TEXT_TRANSFORM.NONE;
	};

/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.parseTransform = undefined;

	var _Length = __webpack_require__(17);

	var _Length2 = _interopRequireDefault(_Length);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	var toFloat = function toFloat(s) {
	    return parseFloat(s.trim());
	};

	var MATRIX = /(matrix|matrix3d)\((.+)\)/;

	var parseTransform = exports.parseTransform = function parseTransform(style) {
	    var transform = parseTransformMatrix(style.transform || style.webkitTransform || style.mozTransform ||
	    // $FlowFixMe
	    style.msTransform ||
	    // $FlowFixMe
	    style.oTransform);
	    if (transform === null) {
	        return null;
	    }

	    return {
	        transform: transform,
	        transformOrigin: parseTransformOrigin(style.transformOrigin || style.webkitTransformOrigin || style.mozTransformOrigin ||
	        // $FlowFixMe
	        style.msTransformOrigin ||
	        // $FlowFixMe
	        style.oTransformOrigin)
	    };
	};

	// $FlowFixMe
	var parseTransformOrigin = function parseTransformOrigin(origin) {
	    if (typeof origin !== 'string') {
	        var v = new _Length2.default('0');
	        return [v, v];
	    }
	    var values = origin.split(' ').map(_Length2.default.create);
	    return [values[0], values[1]];
	};

	// $FlowFixMe
	var parseTransformMatrix = function parseTransformMatrix(transform) {
	    if (transform === 'none' || typeof transform !== 'string') {
	        return null;
	    }

	    var match = transform.match(MATRIX);
	    if (match) {
	        if (match[1] === 'matrix') {
	            var matrix = match[2].split(',').map(toFloat);
	            return [matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]];
	        } else {
	            var matrix3d = match[2].split(',').map(toFloat);
	            return [matrix3d[0], matrix3d[1], matrix3d[4], matrix3d[5], matrix3d[12], matrix3d[13]];
	        }
	    }
	    return null;
	};

/***/ }),
/* 34 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var VISIBILITY = exports.VISIBILITY = {
	    VISIBLE: 0,
	    HIDDEN: 1,
	    COLLAPSE: 2
	};

	var parseVisibility = exports.parseVisibility = function parseVisibility(visibility) {
	    switch (visibility) {
	        case 'hidden':
	            return VISIBILITY.HIDDEN;
	        case 'collapse':
	            return VISIBILITY.COLLAPSE;
	        case 'visible':
	        default:
	            return VISIBILITY.VISIBLE;
	    }
	};

/***/ }),
/* 35 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var parseZIndex = exports.parseZIndex = function parseZIndex(zIndex) {
	    var auto = zIndex === 'auto';
	    return {
	        auto: auto,
	        order: auto ? 0 : parseInt(zIndex, 10)
	    };
	};

/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.reformatInputBounds = exports.inlineSelectElement = exports.inlineTextAreaElement = exports.inlineInputElement = exports.getInputBorderRadius = exports.INPUT_BACKGROUND = exports.INPUT_BORDERS = exports.INPUT_COLOR = undefined;

	var _TextContainer = __webpack_require__(37);

	var _TextContainer2 = _interopRequireDefault(_TextContainer);

	var _background = __webpack_require__(16);

	var _border = __webpack_require__(23);

	var _Circle = __webpack_require__(42);

	var _Circle2 = _interopRequireDefault(_Circle);

	var _Vector = __webpack_require__(19);

	var _Vector2 = _interopRequireDefault(_Vector);

	var _Color = __webpack_require__(9);

	var _Color2 = _interopRequireDefault(_Color);

	var _Length = __webpack_require__(17);

	var _Length2 = _interopRequireDefault(_Length);

	var _Bounds = __webpack_require__(20);

	var _TextBounds = __webpack_require__(38);

	var _Util = __webpack_require__(15);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	var INPUT_COLOR = exports.INPUT_COLOR = new _Color2.default([42, 42, 42]);
	var INPUT_BORDER_COLOR = new _Color2.default([165, 165, 165]);
	var INPUT_BACKGROUND_COLOR = new _Color2.default([222, 222, 222]);
	var INPUT_BORDER = {
	    borderWidth: 1,
	    borderColor: INPUT_BORDER_COLOR,
	    borderStyle: _border.BORDER_STYLE.SOLID
	};
	var INPUT_BORDERS = exports.INPUT_BORDERS = [INPUT_BORDER, INPUT_BORDER, INPUT_BORDER, INPUT_BORDER];
	var INPUT_BACKGROUND = exports.INPUT_BACKGROUND = {
	    backgroundColor: INPUT_BACKGROUND_COLOR,
	    backgroundImage: [],
	    backgroundClip: _background.BACKGROUND_CLIP.PADDING_BOX,
	    backgroundOrigin: _background.BACKGROUND_ORIGIN.PADDING_BOX
	};

	var RADIO_BORDER_RADIUS = new _Length2.default('50%');
	var RADIO_BORDER_RADIUS_TUPLE = [RADIO_BORDER_RADIUS, RADIO_BORDER_RADIUS];
	var INPUT_RADIO_BORDER_RADIUS = [RADIO_BORDER_RADIUS_TUPLE, RADIO_BORDER_RADIUS_TUPLE, RADIO_BORDER_RADIUS_TUPLE, RADIO_BORDER_RADIUS_TUPLE];

	var CHECKBOX_BORDER_RADIUS = new _Length2.default('3px');
	var CHECKBOX_BORDER_RADIUS_TUPLE = [CHECKBOX_BORDER_RADIUS, CHECKBOX_BORDER_RADIUS];
	var INPUT_CHECKBOX_BORDER_RADIUS = [CHECKBOX_BORDER_RADIUS_TUPLE, CHECKBOX_BORDER_RADIUS_TUPLE, CHECKBOX_BORDER_RADIUS_TUPLE, CHECKBOX_BORDER_RADIUS_TUPLE];

	var getInputBorderRadius = exports.getInputBorderRadius = function getInputBorderRadius(node) {
	    return node.type === 'radio' ? INPUT_RADIO_BORDER_RADIUS : INPUT_CHECKBOX_BORDER_RADIUS;
	};

	var inlineInputElement = exports.inlineInputElement = function inlineInputElement(node, container) {
	    if (node.type === 'radio' || node.type === 'checkbox') {
	        if (node.checked) {
	            var size = Math.min(container.bounds.width, container.bounds.height);
	            container.childNodes.push(node.type === 'checkbox' ? [new _Vector2.default(container.bounds.left + size * 0.39363, container.bounds.top + size * 0.79), new _Vector2.default(container.bounds.left + size * 0.16, container.bounds.top + size * 0.5549), new _Vector2.default(container.bounds.left + size * 0.27347, container.bounds.top + size * 0.44071), new _Vector2.default(container.bounds.left + size * 0.39694, container.bounds.top + size * 0.5649), new _Vector2.default(container.bounds.left + size * 0.72983, container.bounds.top + size * 0.23), new _Vector2.default(container.bounds.left + size * 0.84, container.bounds.top + size * 0.34085), new _Vector2.default(container.bounds.left + size * 0.39363, container.bounds.top + size * 0.79)] : new _Circle2.default(container.bounds.left + size / 4, container.bounds.top + size / 4, size / 4));
	        }
	    } else {
	        inlineFormElement(getInputValue(node), node, container, false);
	    }
	};

	var inlineTextAreaElement = exports.inlineTextAreaElement = function inlineTextAreaElement(node, container) {
	    inlineFormElement(node.value, node, container, true);
	};

	var inlineSelectElement = exports.inlineSelectElement = function inlineSelectElement(node, container) {
	    var option = node.options[node.selectedIndex || 0];
	    inlineFormElement(option ? option.text || '' : '', node, container, false);
	};

	var reformatInputBounds = exports.reformatInputBounds = function reformatInputBounds(bounds) {
	    if (bounds.width > bounds.height) {
	        bounds.left += (bounds.width - bounds.height) / 2;
	        bounds.width = bounds.height;
	    } else if (bounds.width < bounds.height) {
	        bounds.top += (bounds.height - bounds.width) / 2;
	        bounds.height = bounds.width;
	    }
	    return bounds;
	};

	var inlineFormElement = function inlineFormElement(value, node, container, allowLinebreak) {
	    var body = node.ownerDocument.body;
	    if (value.length > 0 && body) {
	        var wrapper = node.ownerDocument.createElement('html2canvaswrapper');
	        (0, _Util.copyCSSStyles)(node.ownerDocument.defaultView.getComputedStyle(node, null), wrapper);
	        wrapper.style.position = 'fixed';
	        wrapper.style.left = container.bounds.left + 'px';
	        wrapper.style.top = container.bounds.top + 'px';
	        if (!allowLinebreak) {
	            wrapper.style.whiteSpace = 'nowrap';
	        }
	        var text = node.ownerDocument.createTextNode(value);
	        wrapper.appendChild(text);
	        body.appendChild(wrapper);
	        container.childNodes.push(_TextContainer2.default.fromTextNode(text, container));
	        body.removeChild(wrapper);
	    }
	};

	var getInputValue = function getInputValue(node) {
	    var value = node.type === 'password' ? new Array(node.value.length + 1).join('\u2022') : node.value;

	    return value.length === 0 ? node.placeholder || '' : value;
	};

/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();

	var _textTransform = __webpack_require__(32);

	var _TextBounds = __webpack_require__(38);

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var TextContainer = function () {
	    function TextContainer(text, parent, bounds) {
	        _classCallCheck(this, TextContainer);

	        this.text = text;
	        this.parent = parent;
	        this.bounds = bounds;
	    }

	    _createClass(TextContainer, null, [{
	        key: 'fromTextNode',
	        value: function fromTextNode(node, parent) {
	            var text = transform(node.data, parent.style.textTransform);
	            return new TextContainer(text, parent, (0, _TextBounds.parseTextBounds)(text, parent, node));
	        }
	    }]);

	    return TextContainer;
	}();

	exports.default = TextContainer;

	var CAPITALIZE = /(^|\s|:|-|\(|\))([a-z])/g;

	var transform = function transform(text, _transform) {
	    switch (_transform) {
	        case _textTransform.TEXT_TRANSFORM.LOWERCASE:
	            return text.toLowerCase();
	        case _textTransform.TEXT_TRANSFORM.CAPITALIZE:
	            return text.replace(CAPITALIZE, capitalize);
	        case _textTransform.TEXT_TRANSFORM.UPPERCASE:
	            return text.toUpperCase();
	        default:
	            return text;
	    }
	};

	function capitalize(m, p1, p2) {
	    if (m.length > 0) {
	        return p1 + p2.toUpperCase();
	    }

	    return m;
	}

/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.parseTextBounds = exports.TextBounds = undefined;

	var _punycode = __webpack_require__(39);

	var _Bounds = __webpack_require__(20);

	var _textDecoration = __webpack_require__(8);

	var _Feature = __webpack_require__(40);

	var _Feature2 = _interopRequireDefault(_Feature);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var UNICODE = /[^\u0000-\u00ff]/;

	var hasUnicodeCharacters = function hasUnicodeCharacters(text) {
	    return UNICODE.test(text);
	};

	var encodeCodePoint = function encodeCodePoint(codePoint) {
	    return _punycode.ucs2.encode([codePoint]);
	};

	var TextBounds = exports.TextBounds = function TextBounds(text, bounds) {
	    _classCallCheck(this, TextBounds);

	    this.text = text;
	    this.bounds = bounds;
	};

	var parseTextBounds = exports.parseTextBounds = function parseTextBounds(value, parent, node) {
	    var codePoints = _punycode.ucs2.decode(value);
	    var letterRendering = parent.style.letterSpacing !== 0 || hasUnicodeCharacters(value);
	    var textList = letterRendering ? codePoints.map(encodeCodePoint) : splitWords(codePoints);
	    var length = textList.length;
	    var defaultView = node.parentNode ? node.parentNode.ownerDocument.defaultView : null;
	    var scrollX = defaultView ? defaultView.pageXOffset : 0;
	    var scrollY = defaultView ? defaultView.pageYOffset : 0;
	    var textBounds = [];
	    var offset = 0;
	    for (var i = 0; i < length; i++) {
	        var text = textList[i];
	        if (parent.style.textDecoration !== _textDecoration.TEXT_DECORATION.NONE || text.trim().length > 0) {
	            if (_Feature2.default.SUPPORT_RANGE_BOUNDS) {
	                textBounds.push(new TextBounds(text, getRangeBounds(node, offset, text.length, scrollX, scrollY)));
	            } else {
	                var replacementNode = node.splitText(text.length);
	                textBounds.push(new TextBounds(text, getWrapperBounds(node, scrollX, scrollY)));
	                node = replacementNode;
	            }
	        } else if (!_Feature2.default.SUPPORT_RANGE_BOUNDS) {
	            node = node.splitText(text.length);
	        }
	        offset += text.length;
	    }
	    return textBounds;
	};

	var getWrapperBounds = function getWrapperBounds(node, scrollX, scrollY) {
	    var wrapper = node.ownerDocument.createElement('html2canvaswrapper');
	    wrapper.appendChild(node.cloneNode(true));
	    var parentNode = node.parentNode;
	    if (parentNode) {
	        parentNode.replaceChild(wrapper, node);
	        var bounds = (0, _Bounds.parseBounds)(wrapper, scrollX, scrollY);
	        if (wrapper.firstChild) {
	            parentNode.replaceChild(wrapper.firstChild, wrapper);
	        }
	        return bounds;
	    }
	    return new _Bounds.Bounds(0, 0, 0, 0);
	};

	var getRangeBounds = function getRangeBounds(node, offset, length, scrollX, scrollY) {
	    var range = node.ownerDocument.createRange();
	    range.setStart(node, offset);
	    range.setEnd(node, offset + length);
	    return _Bounds.Bounds.fromClientRect(range.getBoundingClientRect(), scrollX, scrollY);
	};

	var splitWords = function splitWords(codePoints) {
	    var words = [];
	    var i = 0;
	    var onWordBoundary = false;
	    var word = void 0;
	    while (codePoints.length) {
	        if (isWordBoundary(codePoints[i]) === onWordBoundary) {
	            word = codePoints.splice(0, i);
	            if (word.length) {
	                words.push(_punycode.ucs2.encode(word));
	            }
	            onWordBoundary = !onWordBoundary;
	            i = 0;
	        } else {
	            i++;
	        }

	        if (i >= codePoints.length) {
	            word = codePoints.splice(0, i);
	            if (word.length) {
	                words.push(_punycode.ucs2.encode(word));
	            }
	        }
	    }
	    return words;
	};

	var isWordBoundary = function isWordBoundary(characterCode) {
	    return [32, // <space>
	    13, // \r
	    10, // \n
	    9, // \t
	    45 // -
	    ].indexOf(characterCode) !== -1;
	};

/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module, global) {/*! https://mths.be/punycode v1.4.1 by @mathias */
	;(function(root) {

		/** Detect free variables */
		var freeExports = typeof exports == 'object' && exports &&
			!exports.nodeType && exports;
		var freeModule = typeof module == 'object' && module &&
			!module.nodeType && module;
		var freeGlobal = typeof global == 'object' && global;
		if (
			freeGlobal.global === freeGlobal ||
			freeGlobal.window === freeGlobal ||
			freeGlobal.self === freeGlobal
		) {
			root = freeGlobal;
		}

		/**
		 * The `punycode` object.
		 * @name punycode
		 * @type Object
		 */
		var punycode,

		/** Highest positive signed 32-bit float value */
		maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

		/** Bootstring parameters */
		base = 36,
		tMin = 1,
		tMax = 26,
		skew = 38,
		damp = 700,
		initialBias = 72,
		initialN = 128, // 0x80
		delimiter = '-', // '\x2D'

		/** Regular expressions */
		regexPunycode = /^xn--/,
		regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
		regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

		/** Error messages */
		errors = {
			'overflow': 'Overflow: input needs wider integers to process',
			'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
			'invalid-input': 'Invalid input'
		},

		/** Convenience shortcuts */
		baseMinusTMin = base - tMin,
		floor = Math.floor,
		stringFromCharCode = String.fromCharCode,

		/** Temporary variable */
		key;

		/*--------------------------------------------------------------------------*/

		/**
		 * A generic error utility function.
		 * @private
		 * @param {String} type The error type.
		 * @returns {Error} Throws a `RangeError` with the applicable error message.
		 */
		function error(type) {
			throw new RangeError(errors[type]);
		}

		/**
		 * A generic `Array#map` utility function.
		 * @private
		 * @param {Array} array The array to iterate over.
		 * @param {Function} callback The function that gets called for every array
		 * item.
		 * @returns {Array} A new array of values returned by the callback function.
		 */
		function map(array, fn) {
			var length = array.length;
			var result = [];
			while (length--) {
				result[length] = fn(array[length]);
			}
			return result;
		}

		/**
		 * A simple `Array#map`-like wrapper to work with domain name strings or email
		 * addresses.
		 * @private
		 * @param {String} domain The domain name or email address.
		 * @param {Function} callback The function that gets called for every
		 * character.
		 * @returns {Array} A new string of characters returned by the callback
		 * function.
		 */
		function mapDomain(string, fn) {
			var parts = string.split('@');
			var result = '';
			if (parts.length > 1) {
				// In email addresses, only the domain name should be punycoded. Leave
				// the local part (i.e. everything up to `@`) intact.
				result = parts[0] + '@';
				string = parts[1];
			}
			// Avoid `split(regex)` for IE8 compatibility. See #17.
			string = string.replace(regexSeparators, '\x2E');
			var labels = string.split('.');
			var encoded = map(labels, fn).join('.');
			return result + encoded;
		}

		/**
		 * Creates an array containing the numeric code points of each Unicode
		 * character in the string. While JavaScript uses UCS-2 internally,
		 * this function will convert a pair of surrogate halves (each of which
		 * UCS-2 exposes as separate characters) into a single code point,
		 * matching UTF-16.
		 * @see `punycode.ucs2.encode`
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode.ucs2
		 * @name decode
		 * @param {String} string The Unicode input string (UCS-2).
		 * @returns {Array} The new array of code points.
		 */
		function ucs2decode(string) {
			var output = [],
			    counter = 0,
			    length = string.length,
			    value,
			    extra;
			while (counter < length) {
				value = string.charCodeAt(counter++);
				if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
					// high surrogate, and there is a next character
					extra = string.charCodeAt(counter++);
					if ((extra & 0xFC00) == 0xDC00) { // low surrogate
						output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
					} else {
						// unmatched surrogate; only append this code unit, in case the next
						// code unit is the high surrogate of a surrogate pair
						output.push(value);
						counter--;
					}
				} else {
					output.push(value);
				}
			}
			return output;
		}

		/**
		 * Creates a string based on an array of numeric code points.
		 * @see `punycode.ucs2.decode`
		 * @memberOf punycode.ucs2
		 * @name encode
		 * @param {Array} codePoints The array of numeric code points.
		 * @returns {String} The new Unicode string (UCS-2).
		 */
		function ucs2encode(array) {
			return map(array, function(value) {
				var output = '';
				if (value > 0xFFFF) {
					value -= 0x10000;
					output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
					value = 0xDC00 | value & 0x3FF;
				}
				output += stringFromCharCode(value);
				return output;
			}).join('');
		}

		/**
		 * Converts a basic code point into a digit/integer.
		 * @see `digitToBasic()`
		 * @private
		 * @param {Number} codePoint The basic numeric code point value.
		 * @returns {Number} The numeric value of a basic code point (for use in
		 * representing integers) in the range `0` to `base - 1`, or `base` if
		 * the code point does not represent a value.
		 */
		function basicToDigit(codePoint) {
			if (codePoint - 48 < 10) {
				return codePoint - 22;
			}
			if (codePoint - 65 < 26) {
				return codePoint - 65;
			}
			if (codePoint - 97 < 26) {
				return codePoint - 97;
			}
			return base;
		}

		/**
		 * Converts a digit/integer into a basic code point.
		 * @see `basicToDigit()`
		 * @private
		 * @param {Number} digit The numeric value of a basic code point.
		 * @returns {Number} The basic code point whose value (when used for
		 * representing integers) is `digit`, which needs to be in the range
		 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
		 * used; else, the lowercase form is used. The behavior is undefined
		 * if `flag` is non-zero and `digit` has no uppercase form.
		 */
		function digitToBasic(digit, flag) {
			//  0..25 map to ASCII a..z or A..Z
			// 26..35 map to ASCII 0..9
			return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
		}

		/**
		 * Bias adaptation function as per section 3.4 of RFC 3492.
		 * https://tools.ietf.org/html/rfc3492#section-3.4
		 * @private
		 */
		function adapt(delta, numPoints, firstTime) {
			var k = 0;
			delta = firstTime ? floor(delta / damp) : delta >> 1;
			delta += floor(delta / numPoints);
			for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
				delta = floor(delta / baseMinusTMin);
			}
			return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
		}

		/**
		 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
		 * symbols.
		 * @memberOf punycode
		 * @param {String} input The Punycode string of ASCII-only symbols.
		 * @returns {String} The resulting string of Unicode symbols.
		 */
		function decode(input) {
			// Don't use UCS-2
			var output = [],
			    inputLength = input.length,
			    out,
			    i = 0,
			    n = initialN,
			    bias = initialBias,
			    basic,
			    j,
			    index,
			    oldi,
			    w,
			    k,
			    digit,
			    t,
			    /** Cached calculation results */
			    baseMinusT;

			// Handle the basic code points: let `basic` be the number of input code
			// points before the last delimiter, or `0` if there is none, then copy
			// the first basic code points to the output.

			basic = input.lastIndexOf(delimiter);
			if (basic < 0) {
				basic = 0;
			}

			for (j = 0; j < basic; ++j) {
				// if it's not a basic code point
				if (input.charCodeAt(j) >= 0x80) {
					error('not-basic');
				}
				output.push(input.charCodeAt(j));
			}

			// Main decoding loop: start just after the last delimiter if any basic code
			// points were copied; start at the beginning otherwise.

			for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

				// `index` is the index of the next character to be consumed.
				// Decode a generalized variable-length integer into `delta`,
				// which gets added to `i`. The overflow checking is easier
				// if we increase `i` as we go, then subtract off its starting
				// value at the end to obtain `delta`.
				for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

					if (index >= inputLength) {
						error('invalid-input');
					}

					digit = basicToDigit(input.charCodeAt(index++));

					if (digit >= base || digit > floor((maxInt - i) / w)) {
						error('overflow');
					}

					i += digit * w;
					t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

					if (digit < t) {
						break;
					}

					baseMinusT = base - t;
					if (w > floor(maxInt / baseMinusT)) {
						error('overflow');
					}

					w *= baseMinusT;

				}

				out = output.length + 1;
				bias = adapt(i - oldi, out, oldi == 0);

				// `i` was supposed to wrap around from `out` to `0`,
				// incrementing `n` each time, so we'll fix that now:
				if (floor(i / out) > maxInt - n) {
					error('overflow');
				}

				n += floor(i / out);
				i %= out;

				// Insert `n` at position `i` of the output
				output.splice(i++, 0, n);

			}

			return ucs2encode(output);
		}

		/**
		 * Converts a string of Unicode symbols (e.g. a domain name label) to a
		 * Punycode string of ASCII-only symbols.
		 * @memberOf punycode
		 * @param {String} input The string of Unicode symbols.
		 * @returns {String} The resulting Punycode string of ASCII-only symbols.
		 */
		function encode(input) {
			var n,
			    delta,
			    handledCPCount,
			    basicLength,
			    bias,
			    j,
			    m,
			    q,
			    k,
			    t,
			    currentValue,
			    output = [],
			    /** `inputLength` will hold the number of code points in `input`. */
			    inputLength,
			    /** Cached calculation results */
			    handledCPCountPlusOne,
			    baseMinusT,
			    qMinusT;

			// Convert the input in UCS-2 to Unicode
			input = ucs2decode(input);

			// Cache the length
			inputLength = input.length;

			// Initialize the state
			n = initialN;
			delta = 0;
			bias = initialBias;

			// Handle the basic code points
			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue < 0x80) {
					output.push(stringFromCharCode(currentValue));
				}
			}

			handledCPCount = basicLength = output.length;

			// `handledCPCount` is the number of code points that have been handled;
			// `basicLength` is the number of basic code points.

			// Finish the basic string - if it is not empty - with a delimiter
			if (basicLength) {
				output.push(delimiter);
			}

			// Main encoding loop:
			while (handledCPCount < inputLength) {

				// All non-basic code points < n have been handled already. Find the next
				// larger one:
				for (m = maxInt, j = 0; j < inputLength; ++j) {
					currentValue = input[j];
					if (currentValue >= n && currentValue < m) {
						m = currentValue;
					}
				}

				// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
				// but guard against overflow
				handledCPCountPlusOne = handledCPCount + 1;
				if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
					error('overflow');
				}

				delta += (m - n) * handledCPCountPlusOne;
				n = m;

				for (j = 0; j < inputLength; ++j) {
					currentValue = input[j];

					if (currentValue < n && ++delta > maxInt) {
						error('overflow');
					}

					if (currentValue == n) {
						// Represent delta as a generalized variable-length integer
						for (q = delta, k = base; /* no condition */; k += base) {
							t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
							if (q < t) {
								break;
							}
							qMinusT = q - t;
							baseMinusT = base - t;
							output.push(
								stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
							);
							q = floor(qMinusT / baseMinusT);
						}

						output.push(stringFromCharCode(digitToBasic(q, 0)));
						bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
						delta = 0;
						++handledCPCount;
					}
				}

				++delta;
				++n;

			}
			return output.join('');
		}

		/**
		 * Converts a Punycode string representing a domain name or an email address
		 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
		 * it doesn't matter if you call it on a string that has already been
		 * converted to Unicode.
		 * @memberOf punycode
		 * @param {String} input The Punycoded domain name or email address to
		 * convert to Unicode.
		 * @returns {String} The Unicode representation of the given Punycode
		 * string.
		 */
		function toUnicode(input) {
			return mapDomain(input, function(string) {
				return regexPunycode.test(string)
					? decode(string.slice(4).toLowerCase())
					: string;
			});
		}

		/**
		 * Converts a Unicode string representing a domain name or an email address to
		 * Punycode. Only the non-ASCII parts of the domain name will be converted,
		 * i.e. it doesn't matter if you call it with a domain that's already in
		 * ASCII.
		 * @memberOf punycode
		 * @param {String} input The domain name or email address to convert, as a
		 * Unicode string.
		 * @returns {String} The Punycode representation of the given domain name or
		 * email address.
		 */
		function toASCII(input) {
			return mapDomain(input, function(string) {
				return regexNonASCII.test(string)
					? 'xn--' + encode(string)
					: string;
			});
		}

		/*--------------------------------------------------------------------------*/

		/** Define the public API */
		punycode = {
			/**
			 * A string representing the current Punycode.js version number.
			 * @memberOf punycode
			 * @type String
			 */
			'version': '1.4.1',
			/**
			 * An object of methods to convert from JavaScript's internal character
			 * representation (UCS-2) to Unicode code points, and back.
			 * @see <https://mathiasbynens.be/notes/javascript-encoding>
			 * @memberOf punycode
			 * @type Object
			 */
			'ucs2': {
				'decode': ucs2decode,
				'encode': ucs2encode
			},
			'decode': decode,
			'encode': encode,
			'toASCII': toASCII,
			'toUnicode': toUnicode
		};

		/** Expose `punycode` */
		// Some AMD build optimizers, like r.js, check for specific condition patterns
		// like the following:
		if (
			true
		) {
			!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
				return punycode;
			}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		} else if (freeExports && freeModule) {
			if (module.exports == freeExports) {
				// in Node.js, io.js, or RingoJS v0.8.0+
				freeModule.exports = punycode;
			} else {
				// in Narwhal or RingoJS v0.7.0-
				for (key in punycode) {
					punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
				}
			}
		} else {
			// in Rhino or a web browser
			root.punycode = punycode;
		}

	}(this));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)(module), (function() { return this; }())))

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _ForeignObjectRenderer = __webpack_require__(41);

	var testRangeBounds = function testRangeBounds(document) {
	    var TEST_HEIGHT = 123;

	    if (document.createRange) {
	        var range = document.createRange();
	        if (range.getBoundingClientRect) {
	            var testElement = document.createElement('boundtest');
	            testElement.style.height = TEST_HEIGHT + 'px';
	            testElement.style.display = 'block';
	            document.body.appendChild(testElement);

	            range.selectNode(testElement);
	            var rangeBounds = range.getBoundingClientRect();
	            var rangeHeight = Math.round(rangeBounds.height);
	            document.body.removeChild(testElement);
	            if (rangeHeight === TEST_HEIGHT) {
	                return true;
	            }
	        }
	    }

	    return false;
	};

	// iOS 10.3 taints canvas with base64 images unless crossOrigin = 'anonymous'
	var testBase64 = function testBase64(document, src) {
	    var img = new Image();
	    var canvas = document.createElement('canvas');
	    var ctx = canvas.getContext('2d');

	    return new Promise(function (resolve) {
	        // Single pixel base64 image renders fine on iOS 10.3???
	        img.src = src;

	        var onload = function onload() {
	            try {
	                ctx.drawImage(img, 0, 0);
	                canvas.toDataURL();
	            } catch (e) {
	                return resolve(false);
	            }

	            return resolve(true);
	        };

	        img.onload = onload;
	        img.onerror = function () {
	            return resolve(false);
	        };

	        if (img.complete === true) {
	            setTimeout(function () {
	                onload();
	            }, 500);
	        }
	    });
	};

	var testCORS = function testCORS() {
	    return typeof new Image().crossOrigin !== 'undefined';
	};

	var testResponseType = function testResponseType() {
	    return typeof new XMLHttpRequest().responseType === 'string';
	};

	var testSVG = function testSVG(document) {
	    var img = new Image();
	    var canvas = document.createElement('canvas');
	    var ctx = canvas.getContext('2d');
	    img.src = 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'></svg>';

	    try {
	        ctx.drawImage(img, 0, 0);
	        canvas.toDataURL();
	    } catch (e) {
	        return false;
	    }
	    return true;
	};

	var isGreenPixel = function isGreenPixel(data) {
	    return data[0] === 0 && data[1] === 255 && data[2] === 0 && data[3] === 255;
	};

	var testForeignObject = function testForeignObject(document) {
	    var canvas = document.createElement('canvas');
	    var size = 100;
	    canvas.width = size;
	    canvas.height = size;
	    var ctx = canvas.getContext('2d');
	    ctx.fillStyle = 'rgb(0, 255, 0)';
	    ctx.fillRect(0, 0, size, size);

	    var img = new Image();
	    var greenImageSrc = canvas.toDataURL();
	    img.src = greenImageSrc;
	    var svg = (0, _ForeignObjectRenderer.createForeignObjectSVG)(size, size, 0, 0, img);
	    ctx.fillStyle = 'red';
	    ctx.fillRect(0, 0, size, size);

	    return (0, _ForeignObjectRenderer.loadSerializedSVG)(svg).then(function (img) {
	        ctx.drawImage(img, 0, 0);
	        var data = ctx.getImageData(0, 0, size, size).data;
	        ctx.fillStyle = 'red';
	        ctx.fillRect(0, 0, size, size);

	        var node = document.createElement('div');
	        node.style.backgroundImage = 'url(' + greenImageSrc + ')';
	        node.style.height = size + 'px';
	        // Firefox 55 does not render inline <img /> tags
	        return isGreenPixel(data) ? (0, _ForeignObjectRenderer.loadSerializedSVG)((0, _ForeignObjectRenderer.createForeignObjectSVG)(size, size, 0, 0, node)) : Promise.reject(false);
	    }).then(function (img) {
	        ctx.drawImage(img, 0, 0);
	        // Edge does not render background-images
	        return isGreenPixel(ctx.getImageData(0, 0, size, size).data);
	    }).catch(function (e) {
	        return false;
	    });
	};

	var FEATURES = {
	    // $FlowFixMe - get/set properties not yet supported
	    get SUPPORT_RANGE_BOUNDS() {
	        'use strict';

	        var value = testRangeBounds(document);
	        Object.defineProperty(FEATURES, 'SUPPORT_RANGE_BOUNDS', { value: value });
	        return value;
	    },
	    // $FlowFixMe - get/set properties not yet supported
	    get SUPPORT_SVG_DRAWING() {
	        'use strict';

	        var value = testSVG(document);
	        Object.defineProperty(FEATURES, 'SUPPORT_SVG_DRAWING', { value: value });
	        return value;
	    },
	    // $FlowFixMe - get/set properties not yet supported
	    get SUPPORT_BASE64_DRAWING() {
	        'use strict';

	        return function (src) {
	            var _value = testBase64(document, src);
	            Object.defineProperty(FEATURES, 'SUPPORT_BASE64_DRAWING', { value: function value() {
	                    return _value;
	                } });
	            return _value;
	        };
	    },
	    // $FlowFixMe - get/set properties not yet supported
	    get SUPPORT_FOREIGNOBJECT_DRAWING() {
	        'use strict';

	        var value = typeof Array.from === 'function' && typeof window.fetch === 'function' ? testForeignObject(document) : Promise.resolve(false);
	        Object.defineProperty(FEATURES, 'SUPPORT_FOREIGNOBJECT_DRAWING', { value: value });
	        return value;
	    },
	    // $FlowFixMe - get/set properties not yet supported
	    get SUPPORT_CORS_IMAGES() {
	        'use strict';

	        var value = testCORS();
	        Object.defineProperty(FEATURES, 'SUPPORT_CORS_IMAGES', { value: value });
	        return value;
	    },
	    // $FlowFixMe - get/set properties not yet supported
	    get SUPPORT_RESPONSE_TYPE() {
	        'use strict';

	        var value = testResponseType();
	        Object.defineProperty(FEATURES, 'SUPPORT_RESPONSE_TYPE', { value: value });
	        return value;
	    },
	    // $FlowFixMe - get/set properties not yet supported
	    get SUPPORT_CORS_XHR() {
	        'use strict';

	        var value = 'withCredentials' in new XMLHttpRequest();
	        Object.defineProperty(FEATURES, 'SUPPORT_CORS_XHR', { value: value });
	        return value;
	    }
	};

	exports.default = FEATURES;

/***/ }),
/* 41 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var ForeignObjectRenderer = function () {
	    function ForeignObjectRenderer(element) {
	        _classCallCheck(this, ForeignObjectRenderer);

	        this.element = element;
	    }

	    _createClass(ForeignObjectRenderer, [{
	        key: 'render',
	        value: function render(options) {
	            var _this = this;

	            this.options = options;
	            this.canvas = document.createElement('canvas');
	            this.ctx = this.canvas.getContext('2d');
	            this.canvas.width = Math.floor(options.width) * options.scale;
	            this.canvas.height = Math.floor(options.height) * options.scale;
	            this.canvas.style.width = options.width + 'px';
	            this.canvas.style.height = options.height + 'px';

	            options.logger.log('ForeignObject renderer initialized (' + options.width + 'x' + options.height + ' at ' + options.x + ',' + options.y + ') with scale ' + options.scale);
	            var svg = createForeignObjectSVG(Math.max(options.windowWidth, options.width) * options.scale, Math.max(options.windowHeight, options.height) * options.scale, options.scrollX * options.scale, options.scrollY * options.scale, this.element);

	            return loadSerializedSVG(svg).then(function (img) {
	                if (options.backgroundColor) {
	                    _this.ctx.fillStyle = options.backgroundColor.toString();
	                    _this.ctx.fillRect(0, 0, options.width * options.scale, options.height * options.scale);
	                }

	                _this.ctx.drawImage(img, -options.x * options.scale, -options.y * options.scale);
	                return _this.canvas;
	            });
	        }
	    }]);

	    return ForeignObjectRenderer;
	}();

	exports.default = ForeignObjectRenderer;
	var createForeignObjectSVG = exports.createForeignObjectSVG = function createForeignObjectSVG(width, height, x, y, node) {
	    var xmlns = 'http://www.w3.org/2000/svg';
	    var svg = document.createElementNS(xmlns, 'svg');
	    var foreignObject = document.createElementNS(xmlns, 'foreignObject');
	    svg.setAttributeNS(null, 'width', width);
	    svg.setAttributeNS(null, 'height', height);

	    foreignObject.setAttributeNS(null, 'width', '100%');
	    foreignObject.setAttributeNS(null, 'height', '100%');
	    foreignObject.setAttributeNS(null, 'x', x);
	    foreignObject.setAttributeNS(null, 'y', y);
	    foreignObject.setAttributeNS(null, 'externalResourcesRequired', 'true');
	    svg.appendChild(foreignObject);

	    foreignObject.appendChild(node);

	    return svg;
	};

	var loadSerializedSVG = exports.loadSerializedSVG = function loadSerializedSVG(svg) {
	    return new Promise(function (resolve, reject) {
	        var img = new Image();
	        img.onload = function () {
	            return resolve(img);
	        };
	        img.onerror = reject;

	        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
	    });
	};

/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _Path = __webpack_require__(7);

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var Circle = function Circle(x, y, radius) {
	    _classCallCheck(this, Circle);

	    this.type = _Path.PATH.CIRCLE;
	    this.x = x;
	    this.y = y;
	    this.radius = radius;
	    if (process.env.NODE_ENV !== 'production') {
	        if (isNaN(x)) {
	            console.error('Invalid x value given for Circle');
	        }
	        if (isNaN(y)) {
	            console.error('Invalid y value given for Circle');
	        }
	        if (isNaN(radius)) {
	            console.error('Invalid radius value given for Circle');
	        }
	    }
	};

	exports.default = Circle;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _slicedToArray = function () {
	    function sliceIterator(arr, i) {
	        var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
	            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	                _arr.push(_s.value);if (i && _arr.length === i) break;
	            }
	        } catch (err) {
	            _d = true;_e = err;
	        } finally {
	            try {
	                if (!_n && _i["return"]) _i["return"]();
	            } finally {
	                if (_d) throw _e;
	            }
	        }return _arr;
	    }return function (arr, i) {
	        if (Array.isArray(arr)) {
	            return arr;
	        } else if (Symbol.iterator in Object(arr)) {
	            return sliceIterator(arr, i);
	        } else {
	            throw new TypeError("Invalid attempt to destructure non-iterable instance");
	        }
	    };
	}();

	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();

	var _Bounds = __webpack_require__(20);

	var _Font = __webpack_require__(44);

	var _Gradient = __webpack_require__(45);

	var _TextContainer = __webpack_require__(37);

	var _TextContainer2 = _interopRequireDefault(_TextContainer);

	var _background = __webpack_require__(16);

	var _border = __webpack_require__(23);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var Renderer = function () {
	    function Renderer(target, options) {
	        _classCallCheck(this, Renderer);

	        this.target = target;
	        this.options = options;
	        target.render(options);
	    }

	    _createClass(Renderer, [{
	        key: 'renderNode',
	        value: function renderNode(container) {
	            if (container.isVisible()) {
	                this.renderNodeBackgroundAndBorders(container);
	                this.renderNodeContent(container);
	            }
	        }
	    }, {
	        key: 'renderNodeContent',
	        value: function renderNodeContent(container) {
	            var _this = this;

	            var callback = function callback() {
	                if (container.childNodes.length) {
	                    container.childNodes.forEach(function (child) {
	                        if (child instanceof _TextContainer2.default) {
	                            var style = child.parent.style;
	                            _this.target.renderTextNode(child.bounds, style.color, style.font, style.textDecoration, style.textShadow);
	                        } else {
	                            _this.target.drawShape(child, container.style.color);
	                        }
	                    });
	                }

	                if (container.image) {
	                    var _image = _this.options.imageStore.get(container.image);
	                    if (_image) {
	                        var contentBox = (0, _Bounds.calculateContentBox)(container.bounds, container.style.padding, container.style.border);
	                        var _width = typeof _image.width === 'number' && _image.width > 0 ? _image.width : contentBox.width;
	                        var _height = typeof _image.height === 'number' && _image.height > 0 ? _image.height : contentBox.height;
	                        if (_width > 0 && _height > 0) {
	                            _this.target.clip([(0, _Bounds.calculatePaddingBoxPath)(container.curvedBounds)], function () {
	                                _this.target.drawImage(_image, new _Bounds.Bounds(0, 0, _width, _height), contentBox);
	                            });
	                        }
	                    }
	                }
	            };
	            var paths = container.getClipPaths();
	            if (paths.length) {
	                this.target.clip(paths, callback);
	            } else {
	                callback();
	            }
	        }
	    }, {
	        key: 'renderNodeBackgroundAndBorders',
	        value: function renderNodeBackgroundAndBorders(container) {
	            var _this2 = this;

	            var HAS_BACKGROUND = !container.style.background.backgroundColor.isTransparent() || container.style.background.backgroundImage.length;

	            var renderableBorders = container.style.border.filter(function (border) {
	                return border.borderStyle !== _border.BORDER_STYLE.NONE && !border.borderColor.isTransparent();
	            });

	            var callback = function callback() {
	                var backgroundPaintingArea = (0, _background.calculateBackgroungPaintingArea)(container.curvedBounds, container.style.background.backgroundClip);

	                if (HAS_BACKGROUND) {
	                    _this2.target.clip([backgroundPaintingArea], function () {
	                        if (!container.style.background.backgroundColor.isTransparent()) {
	                            _this2.target.fill(container.style.background.backgroundColor);
	                        }

	                        _this2.renderBackgroundImage(container);
	                    });
	                }

	                renderableBorders.forEach(function (border, side) {
	                    _this2.renderBorder(border, side, container.curvedBounds);
	                });
	            };

	            if (HAS_BACKGROUND || renderableBorders.length) {
	                var paths = container.parent ? container.parent.getClipPaths() : [];
	                if (paths.length) {
	                    this.target.clip(paths, callback);
	                } else {
	                    callback();
	                }
	            }
	        }
	    }, {
	        key: 'renderBackgroundImage',
	        value: function renderBackgroundImage(container) {
	            var _this3 = this;

	            container.style.background.backgroundImage.slice(0).reverse().forEach(function (backgroundImage) {
	                if (backgroundImage.source.method === 'url' && backgroundImage.source.args.length) {
	                    _this3.renderBackgroundRepeat(container, backgroundImage);
	                } else {
	                    var _gradient = (0, _Gradient.parseGradient)(backgroundImage.source, container.bounds);
	                    if (_gradient) {
	                        var _bounds = container.bounds;
	                        _this3.target.renderLinearGradient(_bounds, _gradient);
	                    }
	                }
	            });
	        }
	    }, {
	        key: 'renderBackgroundRepeat',
	        value: function renderBackgroundRepeat(container, background) {
	            var image = this.options.imageStore.get(background.source.args[0]);
	            if (image) {
	                var backgroundPositioningArea = (0, _background.calculateBackgroungPositioningArea)(container.style.background.backgroundOrigin, container.bounds, container.style.padding, container.style.border);
	                var backgroundImageSize = (0, _background.calculateBackgroundSize)(background, image, backgroundPositioningArea);
	                var position = (0, _background.calculateBackgroundPosition)(background.position, backgroundImageSize, backgroundPositioningArea);
	                var _path = (0, _background.calculateBackgroundRepeatPath)(background, position, backgroundImageSize, backgroundPositioningArea, container.bounds);

	                var _offsetX = Math.round(backgroundPositioningArea.left + position.x);
	                var _offsetY = Math.round(backgroundPositioningArea.top + position.y);
	                this.target.renderRepeat(_path, image, backgroundImageSize, _offsetX, _offsetY);
	            }
	        }
	    }, {
	        key: 'renderBorder',
	        value: function renderBorder(border, side, curvePoints) {
	            this.target.drawShape((0, _Bounds.parsePathForBorder)(curvePoints, side), border.borderColor);
	        }
	    }, {
	        key: 'renderStack',
	        value: function renderStack(stack) {
	            var _this4 = this;

	            if (stack.container.isVisible()) {
	                var _opacity = stack.getOpacity();
	                if (_opacity !== this._opacity) {
	                    this.target.setOpacity(stack.getOpacity());
	                    this._opacity = _opacity;
	                }

	                var _transform = stack.container.style.transform;
	                if (_transform !== null) {
	                    this.target.transform(stack.container.bounds.left + _transform.transformOrigin[0].value, stack.container.bounds.top + _transform.transformOrigin[1].value, _transform.transform, function () {
	                        return _this4.renderStackContent(stack);
	                    });
	                } else {
	                    this.renderStackContent(stack);
	                }
	            }
	        }
	    }, {
	        key: 'renderStackContent',
	        value: function renderStackContent(stack) {
	            var _splitStackingContext = splitStackingContexts(stack),
	                _splitStackingContext2 = _slicedToArray(_splitStackingContext, 5),
	                negativeZIndex = _splitStackingContext2[0],
	                zeroOrAutoZIndexOrTransformedOrOpacity = _splitStackingContext2[1],
	                positiveZIndex = _splitStackingContext2[2],
	                nonPositionedFloats = _splitStackingContext2[3],
	                nonPositionedInlineLevel = _splitStackingContext2[4];

	            var _splitDescendants = splitDescendants(stack),
	                _splitDescendants2 = _slicedToArray(_splitDescendants, 2),
	                inlineLevel = _splitDescendants2[0],
	                nonInlineLevel = _splitDescendants2[1];

	            // https://www.w3.org/TR/css-position-3/#painting-order
	            // 1. the background and borders of the element forming the stacking context.


	            this.renderNodeBackgroundAndBorders(stack.container);
	            // 2. the child stacking contexts with negative stack levels (most negative first).
	            negativeZIndex.sort(sortByZIndex).forEach(this.renderStack, this);
	            // 3. For all its in-flow, non-positioned, block-level descendants in tree order:
	            this.renderNodeContent(stack.container);
	            nonInlineLevel.forEach(this.renderNode, this);
	            // 4. All non-positioned floating descendants, in tree order. For each one of these,
	            // treat the element as if it created a new stacking context, but any positioned descendants and descendants
	            // which actually create a new stacking context should be considered part of the parent stacking context,
	            // not this new one.
	            nonPositionedFloats.forEach(this.renderStack, this);
	            // 5. the in-flow, inline-level, non-positioned descendants, including inline tables and inline blocks.
	            nonPositionedInlineLevel.forEach(this.renderStack, this);
	            inlineLevel.forEach(this.renderNode, this);
	            // 6. All positioned, opacity or transform descendants, in tree order that fall into the following categories:
	            //  All positioned descendants with 'z-index: auto' or 'z-index: 0', in tree order.
	            //  For those with 'z-index: auto', treat the element as if it created a new stacking context,
	            //  but any positioned descendants and descendants which actually create a new stacking context should be
	            //  considered part of the parent stacking context, not this new one. For those with 'z-index: 0',
	            //  treat the stacking context generated atomically.
	            //
	            //  All opacity descendants with opacity less than 1
	            //
	            //  All transform descendants with transform other than none
	            zeroOrAutoZIndexOrTransformedOrOpacity.forEach(this.renderStack, this);
	            // 7. Stacking contexts formed by positioned descendants with z-indices greater than or equal to 1 in z-index
	            // order (smallest first) then tree order.
	            positiveZIndex.sort(sortByZIndex).forEach(this.renderStack, this);
	        }
	    }, {
	        key: 'render',
	        value: function render(stack) {
	            var _this5 = this;

	            if (this.options.backgroundColor) {
	                this.target.rectangle(0, 0, this.options.width, this.options.height, this.options.backgroundColor);
	            }
	            this.renderStack(stack);
	            var target = this.target.getTarget();
	            if (process.env.NODE_ENV !== 'production') {
	                return target.then(function (output) {
	                    _this5.options.logger.log('Render completed');
	                    return output;
	                });
	            }
	            return target;
	        }
	    }]);

	    return Renderer;
	}();

	exports.default = Renderer;

	var splitDescendants = function splitDescendants(stack) {
	    var inlineLevel = [];
	    var nonInlineLevel = [];

	    var length = stack.children.length;
	    for (var i = 0; i < length; i++) {
	        var child = stack.children[i];
	        if (child.isInlineLevel()) {
	            inlineLevel.push(child);
	        } else {
	            nonInlineLevel.push(child);
	        }
	    }
	    return [inlineLevel, nonInlineLevel];
	};

	var splitStackingContexts = function splitStackingContexts(stack) {
	    var negativeZIndex = [];
	    var zeroOrAutoZIndexOrTransformedOrOpacity = [];
	    var positiveZIndex = [];
	    var nonPositionedFloats = [];
	    var nonPositionedInlineLevel = [];
	    var length = stack.contexts.length;
	    for (var i = 0; i < length; i++) {
	        var child = stack.contexts[i];
	        if (child.container.isPositioned() || child.container.style.opacity < 1 || child.container.isTransformed()) {
	            if (child.container.style.zIndex.order < 0) {
	                negativeZIndex.push(child);
	            } else if (child.container.style.zIndex.order > 0) {
	                positiveZIndex.push(child);
	            } else {
	                zeroOrAutoZIndexOrTransformedOrOpacity.push(child);
	            }
	        } else {
	            if (child.container.isFloating()) {
	                nonPositionedFloats.push(child);
	            } else {
	                nonPositionedInlineLevel.push(child);
	            }
	        }
	    }
	    return [negativeZIndex, zeroOrAutoZIndexOrTransformedOrOpacity, positiveZIndex, nonPositionedFloats, nonPositionedInlineLevel];
	};

	var sortByZIndex = function sortByZIndex(a, b) {
	    if (a.container.style.zIndex.order > b.container.style.zIndex.order) {
	        return 1;
	    } else if (a.container.style.zIndex.order < b.container.style.zIndex.order) {
	        return -1;
	    }

	    return a.container.index > b.container.index ? 1 : -1;
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.FontMetrics = undefined;

	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();

	var _Util = __webpack_require__(15);

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var SAMPLE_TEXT = 'Hidden Text';

	var FontMetrics = exports.FontMetrics = function () {
	    function FontMetrics(document) {
	        _classCallCheck(this, FontMetrics);

	        this._data = {};
	        this._document = document;
	    }

	    _createClass(FontMetrics, [{
	        key: '_parseMetrics',
	        value: function _parseMetrics(font) {
	            var container = this._document.createElement('div');
	            var img = this._document.createElement('img');
	            var span = this._document.createElement('span');

	            var body = this._document.body;
	            if (!body) {
	                throw new Error(process.env.NODE_ENV !== 'production' ? 'No document found for font metrics' : '');
	            }

	            container.style.visibility = 'hidden';
	            container.style.fontFamily = font.fontFamily;
	            container.style.fontSize = font.fontSize;
	            container.style.margin = '0';
	            container.style.padding = '0';

	            body.appendChild(container);

	            img.src = _Util.SMALL_IMAGE;
	            img.width = 1;
	            img.height = 1;

	            img.style.margin = '0';
	            img.style.padding = '0';
	            img.style.verticalAlign = 'baseline';

	            span.style.fontFamily = font.fontFamily;
	            span.style.fontSize = font.fontSize;
	            span.style.margin = '0';
	            span.style.padding = '0';

	            span.appendChild(this._document.createTextNode(SAMPLE_TEXT));
	            container.appendChild(span);
	            container.appendChild(img);
	            var baseline = img.offsetTop - span.offsetTop + 2;

	            container.removeChild(span);
	            container.appendChild(this._document.createTextNode(SAMPLE_TEXT));

	            container.style.lineHeight = 'normal';
	            img.style.verticalAlign = 'super';

	            var middle = img.offsetTop - container.offsetTop + 2;

	            body.removeChild(container);

	            return { baseline: baseline, middle: middle };
	        }
	    }, {
	        key: 'getMetrics',
	        value: function getMetrics(font) {
	            var key = font.fontFamily + ' ' + font.fontSize;
	            if (this._data[key] === undefined) {
	                this._data[key] = this._parseMetrics(font);
	            }

	            return this._data[key];
	        }
	    }]);

	    return FontMetrics;
	}();
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.parseGradient = undefined;

	var _slicedToArray = function () {
	    function sliceIterator(arr, i) {
	        var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
	            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	                _arr.push(_s.value);if (i && _arr.length === i) break;
	            }
	        } catch (err) {
	            _d = true;_e = err;
	        } finally {
	            try {
	                if (!_n && _i["return"]) _i["return"]();
	            } finally {
	                if (_d) throw _e;
	            }
	        }return _arr;
	    }return function (arr, i) {
	        if (Array.isArray(arr)) {
	            return arr;
	        } else if (Symbol.iterator in Object(arr)) {
	            return sliceIterator(arr, i);
	        } else {
	            throw new TypeError("Invalid attempt to destructure non-iterable instance");
	        }
	    };
	}();

	var _Angle = __webpack_require__(46);

	var _Color = __webpack_require__(9);

	var _Color2 = _interopRequireDefault(_Color);

	var _Length = __webpack_require__(17);

	var _Length2 = _interopRequireDefault(_Length);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	var SIDE_OR_CORNER = /^(to )?(left|top|right|bottom)( (left|top|right|bottom))?$/i;
	var PERCENTAGE_ANGLES = /^([+-]?\d*\.?\d+)% ([+-]?\d*\.?\d+)%$/i;
	var ENDS_WITH_LENGTH = /(px)|%|( 0)$/i;
	var FROM_TO = /^(from|to)\((.+)\)$/i;

	var parseGradient = exports.parseGradient = function parseGradient(_ref, bounds) {
	    var args = _ref.args,
	        method = _ref.method,
	        prefix = _ref.prefix;

	    if (method === 'linear-gradient') {
	        return parseLinearGradient(args, bounds);
	    } else if (method === 'gradient' && args[0] === 'linear') {
	        // TODO handle correct angle
	        return parseLinearGradient(['to bottom'].concat(args.slice(3).map(function (color) {
	            return color.match(FROM_TO);
	        }).filter(function (v) {
	            return v !== null;
	        })
	        // $FlowFixMe
	        .map(function (v) {
	            return v[2];
	        })), bounds);
	    }
	};

	var parseLinearGradient = function parseLinearGradient(args, bounds) {
	    var angle = (0, _Angle.parseAngle)(args[0]);
	    var HAS_SIDE_OR_CORNER = SIDE_OR_CORNER.test(args[0]);
	    var HAS_DIRECTION = HAS_SIDE_OR_CORNER || angle !== null || PERCENTAGE_ANGLES.test(args[0]);
	    var direction = HAS_DIRECTION ? angle !== null ? calculateGradientDirection(angle, bounds) : HAS_SIDE_OR_CORNER ? parseSideOrCorner(args[0], bounds) : parsePercentageAngle(args[0], bounds) : calculateGradientDirection(Math.PI, bounds);
	    var colorStops = [];
	    var firstColorStopIndex = HAS_DIRECTION ? 1 : 0;

	    for (var i = firstColorStopIndex; i < args.length; i++) {
	        var value = args[i];
	        var HAS_LENGTH = ENDS_WITH_LENGTH.test(value);
	        var lastSpaceIndex = value.lastIndexOf(' ');
	        var _color = new _Color2.default(HAS_LENGTH ? value.substring(0, lastSpaceIndex) : value);
	        var _stop = HAS_LENGTH ? new _Length2.default(value.substring(lastSpaceIndex + 1)) : i === firstColorStopIndex ? new _Length2.default('0%') : i === args.length - 1 ? new _Length2.default('100%') : null;
	        colorStops.push({ color: _color, stop: _stop });
	    }

	    // TODO: Fix some inaccuracy with color stops with px values
	    var lineLength = Math.min(Math.sqrt(Math.pow(Math.abs(direction.x0) + Math.abs(direction.x1), 2) + Math.pow(Math.abs(direction.y0) + Math.abs(direction.y1), 2)), bounds.width * 2, bounds.height * 2);

	    var absoluteValuedColorStops = colorStops.map(function (_ref2) {
	        var color = _ref2.color,
	            stop = _ref2.stop;

	        return {
	            color: color,
	            // $FlowFixMe
	            stop: stop ? stop.getAbsoluteValue(lineLength) / lineLength : null
	        };
	    });

	    var previousColorStop = absoluteValuedColorStops[0].stop;
	    for (var _i = 0; _i < absoluteValuedColorStops.length; _i++) {
	        if (previousColorStop !== null) {
	            var _stop2 = absoluteValuedColorStops[_i].stop;
	            if (_stop2 === null) {
	                var n = _i;
	                while (absoluteValuedColorStops[n].stop === null) {
	                    n++;
	                }
	                var steps = n - _i + 1;
	                var nextColorStep = absoluteValuedColorStops[n].stop;
	                var stepSize = (nextColorStep - previousColorStop) / steps;
	                for (; _i < n; _i++) {
	                    previousColorStop = absoluteValuedColorStops[_i].stop = previousColorStop + stepSize;
	                }
	            } else {
	                previousColorStop = _stop2;
	            }
	        }
	    }

	    return {
	        direction: direction,
	        colorStops: absoluteValuedColorStops
	    };
	};

	var calculateGradientDirection = function calculateGradientDirection(radian, bounds) {
	    var width = bounds.width;
	    var height = bounds.height;
	    var HALF_WIDTH = width * 0.5;
	    var HALF_HEIGHT = height * 0.5;
	    var lineLength = Math.abs(width * Math.sin(radian)) + Math.abs(height * Math.cos(radian));
	    var HALF_LINE_LENGTH = lineLength / 2;

	    var x0 = HALF_WIDTH + Math.sin(radian) * HALF_LINE_LENGTH;
	    var y0 = HALF_HEIGHT - Math.cos(radian) * HALF_LINE_LENGTH;
	    var x1 = width - x0;
	    var y1 = height - y0;

	    return { x0: x0, x1: x1, y0: y0, y1: y1 };
	};

	var parseTopRight = function parseTopRight(bounds) {
	    return Math.acos(bounds.width / 2 / (Math.sqrt(Math.pow(bounds.width, 2) + Math.pow(bounds.height, 2)) / 2));
	};

	var parseSideOrCorner = function parseSideOrCorner(side, bounds) {
	    switch (side) {
	        case 'bottom':
	        case 'to top':
	            return calculateGradientDirection(0, bounds);
	        case 'left':
	        case 'to right':
	            return calculateGradientDirection(Math.PI / 2, bounds);
	        case 'right':
	        case 'to left':
	            return calculateGradientDirection(3 * Math.PI / 2, bounds);
	        case 'top right':
	        case 'right top':
	        case 'to bottom left':
	        case 'to left bottom':
	            return calculateGradientDirection(Math.PI + parseTopRight(bounds), bounds);
	        case 'top left':
	        case 'left top':
	        case 'to bottom right':
	        case 'to right bottom':
	            return calculateGradientDirection(Math.PI - parseTopRight(bounds), bounds);
	        case 'bottom left':
	        case 'left bottom':
	        case 'to top right':
	        case 'to right top':
	            return calculateGradientDirection(parseTopRight(bounds), bounds);
	        case 'bottom right':
	        case 'right bottom':
	        case 'to top left':
	        case 'to left top':
	            return calculateGradientDirection(2 * Math.PI - parseTopRight(bounds), bounds);
	        case 'top':
	        case 'to bottom':
	        default:
	            return calculateGradientDirection(Math.PI, bounds);
	    }
	};

	var parsePercentageAngle = function parsePercentageAngle(angle, bounds) {
	    var _angle$split$map = angle.split(' ').map(parseFloat),
	        _angle$split$map2 = _slicedToArray(_angle$split$map, 2),
	        left = _angle$split$map2[0],
	        top = _angle$split$map2[1];

	    var ratio = left / 100 * bounds.width / (top / 100 * bounds.height);

	    return calculateGradientDirection(Math.atan(isNaN(ratio) ? 1 : ratio) + Math.PI / 2, bounds);
	};

/***/ }),
/* 46 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var ANGLE = /([+-]?\d*\.?\d+)(deg|grad|rad|turn)/i;

	var parseAngle = exports.parseAngle = function parseAngle(angle) {
	    var match = angle.match(ANGLE);

	    if (match) {
	        var value = parseFloat(match[1]);
	        switch (match[2].toLowerCase()) {
	            case 'deg':
	                return Math.PI * value / 180;
	            case 'grad':
	                return Math.PI / 200 * value;
	            case 'rad':
	                return value;
	            case 'turn':
	                return Math.PI * 2 * value;
	        }
	    }

	    return null;
	};

/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.cloneWindow = exports.DocumentCloner = undefined;

	var _slicedToArray = function () {
	    function sliceIterator(arr, i) {
	        var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
	            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	                _arr.push(_s.value);if (i && _arr.length === i) break;
	            }
	        } catch (err) {
	            _d = true;_e = err;
	        } finally {
	            try {
	                if (!_n && _i["return"]) _i["return"]();
	            } finally {
	                if (_d) throw _e;
	            }
	        }return _arr;
	    }return function (arr, i) {
	        if (Array.isArray(arr)) {
	            return arr;
	        } else if (Symbol.iterator in Object(arr)) {
	            return sliceIterator(arr, i);
	        } else {
	            throw new TypeError("Invalid attempt to destructure non-iterable instance");
	        }
	    };
	}();

	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();

	var _Bounds = __webpack_require__(20);

	var _Proxy = __webpack_require__(48);

	var _ResourceLoader = __webpack_require__(49);

	var _ResourceLoader2 = _interopRequireDefault(_ResourceLoader);

	var _Util = __webpack_require__(15);

	var _background = __webpack_require__(16);

	var _CanvasRenderer = __webpack_require__(6);

	var _CanvasRenderer2 = _interopRequireDefault(_CanvasRenderer);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var IGNORE_ATTRIBUTE = 'data-html2canvas-ignore';

	var DocumentCloner = exports.DocumentCloner = function () {
	    function DocumentCloner(element, options, logger, copyInline, renderer) {
	        _classCallCheck(this, DocumentCloner);

	        this.referenceElement = element;
	        this.scrolledElements = [];
	        this.copyStyles = copyInline;
	        this.inlineImages = copyInline;
	        this.logger = logger;
	        this.options = options;
	        this.renderer = renderer;
	        this.resourceLoader = new _ResourceLoader2.default(options, logger, window);
	        // $FlowFixMe
	        this.documentElement = this.cloneNode(element.ownerDocument.documentElement);
	    }

	    _createClass(DocumentCloner, [{
	        key: 'inlineAllImages',
	        value: function inlineAllImages(node) {
	            var _this = this;

	            if (this.inlineImages && node) {
	                var style = node.style;
	                Promise.all((0, _background.parseBackgroundImage)(style.backgroundImage).map(function (backgroundImage) {
	                    if (backgroundImage.method === 'url') {
	                        return _this.resourceLoader.inlineImage(backgroundImage.args[0]).then(function (img) {
	                            return img && typeof img.src === 'string' ? 'url("' + img.src + '")' : 'none';
	                        }).catch(function (e) {
	                            if (process.env.NODE_ENV !== 'production') {
	                                _this.logger.log('Unable to load image', e);
	                            }
	                        });
	                    }
	                    return Promise.resolve('' + backgroundImage.prefix + backgroundImage.method + '(' + backgroundImage.args.join(',') + ')');
	                })).then(function (backgroundImages) {
	                    if (backgroundImages.length > 1) {
	                        // TODO Multiple backgrounds somehow broken in Chrome
	                        style.backgroundColor = '';
	                    }
	                    style.backgroundImage = backgroundImages.join(',');
	                });

	                if (node instanceof HTMLImageElement) {
	                    this.resourceLoader.inlineImage(node.src).then(function (img) {
	                        if (img && node instanceof HTMLImageElement && node.parentNode) {
	                            var parentNode = node.parentNode;
	                            var clonedChild = (0, _Util.copyCSSStyles)(node.style, img.cloneNode(false));
	                            parentNode.replaceChild(clonedChild, node);
	                        }
	                    }).catch(function (e) {
	                        if (process.env.NODE_ENV !== 'production') {
	                            _this.logger.log('Unable to load image', e);
	                        }
	                    });
	                }
	            }
	        }
	    }, {
	        key: 'inlineFonts',
	        value: function inlineFonts(document) {
	            var _this2 = this;

	            return Promise.all(Array.from(document.styleSheets).map(function (sheet) {
	                if (sheet.href) {
	                    return fetch(sheet.href).then(function (res) {
	                        return res.text();
	                    }).then(function (text) {
	                        return createStyleSheetFontsFromText(text, sheet.href);
	                    }).catch(function (e) {
	                        if (process.env.NODE_ENV !== 'production') {
	                            _this2.logger.log('Unable to load stylesheet', e);
	                        }
	                        return [];
	                    });
	                }
	                return getSheetFonts(sheet, document);
	            })).then(function (fonts) {
	                return fonts.reduce(function (acc, font) {
	                    return acc.concat(font);
	                }, []);
	            }).then(function (fonts) {
	                return Promise.all(fonts.map(function (font) {
	                    return fetch(font.formats[0].src).then(function (response) {
	                        return response.blob();
	                    }).then(function (blob) {
	                        return new Promise(function (resolve, reject) {
	                            var reader = new FileReader();
	                            reader.onerror = reject;
	                            reader.onload = function () {
	                                // $FlowFixMe
	                                var result = reader.result;
	                                resolve(result);
	                            };
	                            reader.readAsDataURL(blob);
	                        });
	                    }).then(function (dataUri) {
	                        font.fontFace.setProperty('src', 'url("' + dataUri + '")');
	                        return '@font-face {' + font.fontFace.cssText + ' ';
	                    });
	                }));
	            }).then(function (fontCss) {
	                var style = document.createElement('style');
	                style.textContent = fontCss.join('\n');
	                _this2.documentElement.appendChild(style);
	            });
	        }
	    }, {
	        key: 'createElementClone',
	        value: function createElementClone(node) {
	            var _this3 = this;

	            if (this.copyStyles && node instanceof HTMLCanvasElement) {
	                var img = node.ownerDocument.createElement('img');
	                try {
	                    img.src = node.toDataURL();
	                    return img;
	                } catch (e) {
	                    if (process.env.NODE_ENV !== 'production') {
	                        this.logger.log('Unable to clone canvas contents, canvas is tainted');
	                    }
	                }
	            }

	            if (node instanceof HTMLIFrameElement) {
	                var tempIframe = node.cloneNode(false);
	                var iframeKey = generateIframeKey();
	                tempIframe.setAttribute('data-html2canvas-internal-iframe-key', iframeKey);

	                var _parseBounds = (0, _Bounds.parseBounds)(node, 0, 0),
	                    width = _parseBounds.width,
	                    height = _parseBounds.height;

	                this.resourceLoader.cache[iframeKey] = getIframeDocumentElement(node, this.options).then(function (documentElement) {
	                    return _this3.renderer(documentElement, {
	                        async: _this3.options.async,
	                        allowTaint: _this3.options.allowTaint,
	                        backgroundColor: '#ffffff',
	                        canvas: null,
	                        imageTimeout: _this3.options.imageTimeout,
	                        proxy: _this3.options.proxy,
	                        removeContainer: _this3.options.removeContainer,
	                        scale: _this3.options.scale,
	                        foreignObjectRendering: _this3.options.foreignObjectRendering,
	                        target: new _CanvasRenderer2.default(),
	                        width: width,
	                        height: height,
	                        x: 0,
	                        y: 0,
	                        windowWidth: documentElement.ownerDocument.defaultView.innerWidth,
	                        windowHeight: documentElement.ownerDocument.defaultView.innerHeight,
	                        scrollX: documentElement.ownerDocument.defaultView.pageXOffset,
	                        scrollY: documentElement.ownerDocument.defaultView.pageYOffset
	                    }, _this3.logger.child(iframeKey));
	                }).then(function (canvas) {
	                    return new Promise(function (resolve, reject) {
	                        var iframeCanvas = document.createElement('img');
	                        iframeCanvas.onload = function () {
	                            return resolve(canvas);
	                        };
	                        iframeCanvas.onerror = reject;
	                        iframeCanvas.src = canvas.toDataURL();
	                        if (tempIframe.parentNode) {
	                            tempIframe.parentNode.replaceChild((0, _Util.copyCSSStyles)(node.ownerDocument.defaultView.getComputedStyle(node), iframeCanvas), tempIframe);
	                        }
	                    });
	                });
	                return tempIframe;
	            }

	            return node.cloneNode(false);
	        }
	    }, {
	        key: 'cloneNode',
	        value: function cloneNode(node) {
	            var clone = node.nodeType === Node.TEXT_NODE ? document.createTextNode(node.nodeValue) : this.createElementClone(node);

	            var window = node.ownerDocument.defaultView;

	            if (this.referenceElement === node && clone instanceof window.HTMLElement) {
	                this.clonedReferenceElement = clone;
	            }

	            if (clone instanceof window.HTMLBodyElement) {
	                createPseudoHideStyles(clone);
	            }

	            for (var child = node.firstChild; child; child = child.nextSibling) {
	                if (child.nodeType !== Node.ELEMENT_NODE ||
	                // $FlowFixMe
	                child.nodeName !== 'SCRIPT' && !child.hasAttribute(IGNORE_ATTRIBUTE)) {
	                    if (!this.copyStyles || child.nodeName !== 'STYLE') {
	                        clone.appendChild(this.cloneNode(child));
	                    }
	                }
	            }
	            if (node instanceof window.HTMLElement && clone instanceof window.HTMLElement) {
	                this.inlineAllImages(inlinePseudoElement(node, clone, PSEUDO_BEFORE));
	                this.inlineAllImages(inlinePseudoElement(node, clone, PSEUDO_AFTER));
	                if (this.copyStyles && !(node instanceof HTMLIFrameElement)) {
	                    (0, _Util.copyCSSStyles)(node.ownerDocument.defaultView.getComputedStyle(node), clone);
	                }
	                this.inlineAllImages(clone);
	                if (node.scrollTop !== 0 || node.scrollLeft !== 0) {
	                    this.scrolledElements.push([clone, node.scrollLeft, node.scrollTop]);
	                }
	                switch (node.nodeName) {
	                    case 'CANVAS':
	                        if (!this.copyStyles) {
	                            cloneCanvasContents(node, clone);
	                        }
	                        break;
	                    case 'TEXTAREA':
	                    case 'SELECT':
	                        clone.value = node.value;
	                        break;
	                }
	            }
	            return clone;
	        }
	    }]);

	    return DocumentCloner;
	}();

	var getSheetFonts = function getSheetFonts(sheet, document) {
	    // $FlowFixMe
	    return (sheet.cssRules ? Array.from(sheet.cssRules) : []).filter(function (rule) {
	        return rule.type === CSSRule.FONT_FACE_RULE;
	    }).map(function (rule) {
	        var src = (0, _background.parseBackgroundImage)(rule.style.getPropertyValue('src'));
	        var formats = [];
	        for (var i = 0; i < src.length; i++) {
	            if (src[i].method === 'url' && src[i + 1] && src[i + 1].method === 'format') {
	                var a = document.createElement('a');
	                a.href = src[i].args[0];
	                if (document.body) {
	                    document.body.appendChild(a);
	                }

	                var font = {
	                    src: a.href,
	                    format: src[i + 1].args[0]
	                };
	                formats.push(font);
	            }
	        }

	        return {
	            // TODO select correct format for browser),

	            formats: formats.filter(function (font) {
	                return (/^woff/i.test(font.format)
	                );
	            }),
	            fontFace: rule.style
	        };
	    }).filter(function (font) {
	        return font.formats.length;
	    });
	};

	var createStyleSheetFontsFromText = function createStyleSheetFontsFromText(text, baseHref) {
	    var doc = document.implementation.createHTMLDocument('');
	    var base = document.createElement('base');
	    // $FlowFixMe
	    base.href = baseHref;
	    var style = document.createElement('style');

	    style.textContent = text;
	    if (doc.head) {
	        doc.head.appendChild(base);
	    }
	    if (doc.body) {
	        doc.body.appendChild(style);
	    }

	    return style.sheet ? getSheetFonts(style.sheet, doc) : [];
	};

	var restoreOwnerScroll = function restoreOwnerScroll(ownerDocument, x, y) {
	    if (ownerDocument.defaultView && (x !== ownerDocument.defaultView.pageXOffset || y !== ownerDocument.defaultView.pageYOffset)) {
	        ownerDocument.defaultView.scrollTo(x, y);
	    }
	};

	var cloneCanvasContents = function cloneCanvasContents(canvas, clonedCanvas) {
	    try {
	        if (clonedCanvas) {
	            clonedCanvas.width = canvas.width;
	            clonedCanvas.height = canvas.height;
	            clonedCanvas.getContext('2d').putImageData(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height), 0, 0);
	        }
	    } catch (e) {}
	};

	var inlinePseudoElement = function inlinePseudoElement(node, clone, pseudoElt) {
	    var style = node.ownerDocument.defaultView.getComputedStyle(node, pseudoElt);
	    if (!style || !style.content || style.content === 'none' || style.content === '-moz-alt-content' || style.display === 'none') {
	        return;
	    }

	    var content = stripQuotes(style.content);
	    var image = content.match(URL_REGEXP);
	    var anonymousReplacedElement = clone.ownerDocument.createElement(image ? 'img' : 'html2canvaspseudoelement');
	    if (image) {
	        // $FlowFixMe
	        anonymousReplacedElement.src = stripQuotes(image[1]);
	    } else {
	        anonymousReplacedElement.textContent = content;
	    }

	    (0, _Util.copyCSSStyles)(style, anonymousReplacedElement);

	    anonymousReplacedElement.className = PSEUDO_HIDE_ELEMENT_CLASS_BEFORE + ' ' + PSEUDO_HIDE_ELEMENT_CLASS_AFTER;
	    clone.className += pseudoElt === PSEUDO_BEFORE ? ' ' + PSEUDO_HIDE_ELEMENT_CLASS_BEFORE : ' ' + PSEUDO_HIDE_ELEMENT_CLASS_AFTER;
	    if (pseudoElt === PSEUDO_BEFORE) {
	        clone.insertBefore(anonymousReplacedElement, clone.firstChild);
	    } else {
	        clone.appendChild(anonymousReplacedElement);
	    }

	    return anonymousReplacedElement;
	};

	var stripQuotes = function stripQuotes(content) {
	    var first = content.substr(0, 1);
	    return first === content.substr(content.length - 1) && first.match(/['"]/) ? content.substr(1, content.length - 2) : content;
	};

	var URL_REGEXP = /^url\((.+)\)$/i;
	var PSEUDO_BEFORE = ':before';
	var PSEUDO_AFTER = ':after';
	var PSEUDO_HIDE_ELEMENT_CLASS_BEFORE = '___html2canvas___pseudoelement_before';
	var PSEUDO_HIDE_ELEMENT_CLASS_AFTER = '___html2canvas___pseudoelement_after';

	var PSEUDO_HIDE_ELEMENT_STYLE = '{\n    content: "" !important;\n    display: none !important;\n}';

	var createPseudoHideStyles = function createPseudoHideStyles(body) {
	    createStyles(body, '.' + PSEUDO_HIDE_ELEMENT_CLASS_BEFORE + PSEUDO_BEFORE + PSEUDO_HIDE_ELEMENT_STYLE + '\n         .' + PSEUDO_HIDE_ELEMENT_CLASS_AFTER + PSEUDO_AFTER + PSEUDO_HIDE_ELEMENT_STYLE);
	};

	var createStyles = function createStyles(body, styles) {
	    var style = body.ownerDocument.createElement('style');
	    style.innerHTML = styles;
	    body.appendChild(style);
	};

	var initNode = function initNode(_ref) {
	    var _ref2 = _slicedToArray(_ref, 3),
	        element = _ref2[0],
	        x = _ref2[1],
	        y = _ref2[2];

	    element.scrollLeft = x;
	    element.scrollTop = y;
	};

	var generateIframeKey = function generateIframeKey() {
	    return Math.ceil(Date.now() + Math.random() * 10000000).toString(16);
	};

	var DATA_URI_REGEXP = /^data:text\/(.+);(base64)?,(.*)$/i;

	var getIframeDocumentElement = function getIframeDocumentElement(node, options) {
	    try {
	        return Promise.resolve(node.contentWindow.document.documentElement);
	    } catch (e) {
	        return options.proxy ? (0, _Proxy.Proxy)(node.src, options).then(function (html) {
	            var match = html.match(DATA_URI_REGEXP);
	            if (!match) {
	                return Promise.reject();
	            }

	            return match[2] === 'base64' ? window.atob(decodeURIComponent(match[3])) : decodeURIComponent(match[3]);
	        }).then(function (html) {
	            return createIframeContainer(node.ownerDocument, (0, _Bounds.parseBounds)(node, 0, 0)).then(function (cloneIframeContainer) {
	                var cloneWindow = cloneIframeContainer.contentWindow;
	                var documentClone = cloneWindow.document;

	                documentClone.open();
	                documentClone.write(html);
	                var iframeLoad = iframeLoader(cloneIframeContainer).then(function () {
	                    return documentClone.documentElement;
	                });

	                documentClone.close();
	                return iframeLoad;
	            });
	        }) : Promise.reject();
	    }
	};

	var createIframeContainer = function createIframeContainer(ownerDocument, bounds) {
	    var cloneIframeContainer = ownerDocument.createElement('iframe');

	    cloneIframeContainer.className = 'html2canvas-container';
	    cloneIframeContainer.style.visibility = 'hidden';
	    cloneIframeContainer.style.position = 'fixed';
	    cloneIframeContainer.style.left = '-10000px';
	    cloneIframeContainer.style.top = '0px';
	    cloneIframeContainer.style.border = '0';
	    cloneIframeContainer.width = bounds.width.toString();
	    cloneIframeContainer.height = bounds.height.toString();
	    cloneIframeContainer.scrolling = 'no'; // ios won't scroll without it
	    cloneIframeContainer.setAttribute(IGNORE_ATTRIBUTE, 'true');
	    if (!ownerDocument.body) {
	        return Promise.reject(process.env.NODE_ENV !== 'production' ? 'Body element not found in Document that is getting rendered' : '');
	    }

	    ownerDocument.body.appendChild(cloneIframeContainer);

	    return Promise.resolve(cloneIframeContainer);
	};

	var iframeLoader = function iframeLoader(cloneIframeContainer) {
	    var cloneWindow = cloneIframeContainer.contentWindow;
	    var documentClone = cloneWindow.document;

	    return new Promise(function (resolve, reject) {
	        cloneWindow.onload = cloneIframeContainer.onload = documentClone.onreadystatechange = function () {
	            var interval = setInterval(function () {
	                if (documentClone.body.childNodes.length > 0 && documentClone.readyState === 'complete') {
	                    clearInterval(interval);
	                    resolve(cloneIframeContainer);
	                }
	            }, 50);
	        };
	    });
	};

	var cloneWindow = exports.cloneWindow = function cloneWindow(ownerDocument, bounds, referenceElement, options, logger, renderer) {
	    var cloner = new DocumentCloner(referenceElement, options, logger, false, renderer);
	    var scrollX = ownerDocument.defaultView.pageXOffset;
	    var scrollY = ownerDocument.defaultView.pageYOffset;

	    return createIframeContainer(ownerDocument, bounds).then(function (cloneIframeContainer) {
	        var cloneWindow = cloneIframeContainer.contentWindow;
	        var documentClone = cloneWindow.document;

	        /* Chrome doesn't detect relative background-images assigned in inline <style> sheets when fetched through getComputedStyle
	             if window url is about:blank, we can assign the url to current by writing onto the document
	             */

	        var iframeLoad = iframeLoader(cloneIframeContainer).then(function () {
	            cloner.scrolledElements.forEach(initNode);
	            cloneWindow.scrollTo(bounds.left, bounds.top);
	            if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent) && (cloneWindow.scrollY !== bounds.top || cloneWindow.scrollX !== bounds.left)) {
	                documentClone.documentElement.style.top = -bounds.top + 'px';
	                documentClone.documentElement.style.left = -bounds.left + 'px';
	                documentClone.documentElement.style.position = 'absolute';
	            }
	            return cloner.clonedReferenceElement instanceof cloneWindow.HTMLElement || cloner.clonedReferenceElement instanceof ownerDocument.defaultView.HTMLElement || cloner.clonedReferenceElement instanceof HTMLElement ? Promise.resolve([cloneIframeContainer, cloner.clonedReferenceElement, cloner.resourceLoader]) : Promise.reject(process.env.NODE_ENV !== 'production' ? 'Error finding the ' + referenceElement.nodeName + ' in the cloned document' : '');
	        });

	        documentClone.open();
	        documentClone.write('<!DOCTYPE html><html></html>');
	        // Chrome scrolls the parent document for some reason after the write to the cloned window???
	        restoreOwnerScroll(referenceElement.ownerDocument, scrollX, scrollY);
	        documentClone.replaceChild(documentClone.adoptNode(cloner.documentElement), documentClone.documentElement);
	        documentClone.close();

	        return iframeLoad;
	    });
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.Proxy = undefined;

	var _Feature = __webpack_require__(40);

	var _Feature2 = _interopRequireDefault(_Feature);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	var Proxy = exports.Proxy = function Proxy(src, options) {
	    if (!options.proxy) {
	        return Promise.reject(process.env.NODE_ENV !== 'production' ? 'No proxy defined' : null);
	    }
	    var proxy = options.proxy;

	    return new Promise(function (resolve, reject) {
	        var responseType = _Feature2.default.SUPPORT_CORS_XHR && _Feature2.default.SUPPORT_RESPONSE_TYPE ? 'blob' : 'text';
	        var xhr = _Feature2.default.SUPPORT_CORS_XHR ? new XMLHttpRequest() : new XDomainRequest();
	        xhr.onload = function () {
	            if (xhr instanceof XMLHttpRequest) {
	                if (xhr.status === 200) {
	                    if (responseType === 'text') {
	                        resolve(xhr.response);
	                    } else {
	                        var reader = new FileReader();
	                        // $FlowFixMe
	                        reader.addEventListener('load', function () {
	                            return resolve(reader.result);
	                        }, false);
	                        // $FlowFixMe
	                        reader.addEventListener('error', function (e) {
	                            return reject(e);
	                        }, false);
	                        reader.readAsDataURL(xhr.response);
	                    }
	                } else {
	                    reject(process.env.NODE_ENV !== 'production' ? 'Failed to proxy resource ' + src.substring(0, 256) + ' with status code ' + xhr.status : '');
	                }
	            } else {
	                resolve(xhr.responseText);
	            }
	        };

	        xhr.onerror = reject;
	        xhr.open('GET', proxy + '?url=' + encodeURIComponent(src) + '&responseType=' + responseType);

	        if (responseType !== 'text' && xhr instanceof XMLHttpRequest) {
	            xhr.responseType = responseType;
	        }

	        if (options.imageTimeout) {
	            var timeout = options.imageTimeout;
	            xhr.timeout = timeout;
	            xhr.ontimeout = function () {
	                return reject(process.env.NODE_ENV !== 'production' ? 'Timed out (' + timeout + 'ms) proxying ' + src.substring(0, 256) : '');
	            };
	        }

	        xhr.send();
	    });
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.ResourceStore = undefined;

	var _createClass = function () {
	    function defineProperties(target, props) {
	        for (var i = 0; i < props.length; i++) {
	            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
	        }
	    }return function (Constructor, protoProps, staticProps) {
	        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	    };
	}();

	var _Feature = __webpack_require__(40);

	var _Feature2 = _interopRequireDefault(_Feature);

	var _Proxy = __webpack_require__(48);

	function _interopRequireDefault(obj) {
	    return obj && obj.__esModule ? obj : { default: obj };
	}

	function _classCallCheck(instance, Constructor) {
	    if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	    }
	}

	var ResourceLoader = function () {
	    function ResourceLoader(options, logger, window) {
	        _classCallCheck(this, ResourceLoader);

	        this.options = options;
	        this._window = window;
	        this.origin = this.getOrigin(window.location.href);
	        this.cache = {};
	        this.logger = logger;
	        this._index = 0;
	    }

	    _createClass(ResourceLoader, [{
	        key: 'loadImage',
	        value: function loadImage(src) {
	            var _this = this;

	            if (this.hasResourceInCache(src)) {
	                return src;
	            }

	            if (isSVG(src)) {
	                if (this.options.allowTaint === true || _Feature2.default.SUPPORT_SVG_DRAWING) {
	                    return this.addImage(src, src, false);
	                }
	            } else {
	                if (this.options.allowTaint === true || isInlineBase64Image(src) || this.isSameOrigin(src)) {
	                    return this.addImage(src, src, false);
	                } else if (!this.isSameOrigin(src)) {
	                    if (typeof this.options.proxy === 'string') {
	                        this.cache[src] = (0, _Proxy.Proxy)(src, this.options).then(function (src) {
	                            return _loadImage(src, _this.options.imageTimeout || 0);
	                        });
	                        return src;
	                    } else if (this.options.useCORS === true && _Feature2.default.SUPPORT_CORS_IMAGES) {
	                        return this.addImage(src, src, true);
	                    }
	                }
	            }
	        }
	    }, {
	        key: 'inlineImage',
	        value: function inlineImage(src) {
	            var _this2 = this;

	            if (isInlineImage(src)) {
	                return _loadImage(src, this.options.imageTimeout || 0);
	            }
	            if (this.hasResourceInCache(src)) {
	                return this.cache[src];
	            }
	            if (!this.isSameOrigin(src) && typeof this.options.proxy === 'string') {
	                return this.cache[src] = (0, _Proxy.Proxy)(src, this.options).then(function (src) {
	                    return _loadImage(src, _this2.options.imageTimeout || 0);
	                });
	            }

	            return this.xhrImage(src);
	        }
	    }, {
	        key: 'xhrImage',
	        value: function xhrImage(src) {
	            var _this3 = this;

	            this.cache[src] = new Promise(function (resolve, reject) {
	                var xhr = new XMLHttpRequest();
	                xhr.onreadystatechange = function () {
	                    if (xhr.readyState === 4) {
	                        if (xhr.status !== 200) {
	                            reject('Failed to fetch image ' + src.substring(0, 256) + ' with status code ' + xhr.status);
	                        } else {
	                            var reader = new FileReader();
	                            reader.addEventListener('load', function () {
	                                // $FlowFixMe
	                                var result = reader.result;
	                                resolve(result);
	                            }, false);
	                            reader.addEventListener('error', function (e) {
	                                return reject(e);
	                            }, false);
	                            reader.readAsDataURL(xhr.response);
	                        }
	                    }
	                };
	                xhr.responseType = 'blob';
	                if (_this3.options.imageTimeout) {
	                    var timeout = _this3.options.imageTimeout;
	                    xhr.timeout = timeout;
	                    xhr.ontimeout = function () {
	                        return reject(process.env.NODE_ENV !== 'production' ? 'Timed out (' + timeout + 'ms) fetching ' + src.substring(0, 256) : '');
	                    };
	                }
	                xhr.open('GET', src, true);
	                xhr.send();
	            }).then(function (src) {
	                return _loadImage(src, _this3.options.imageTimeout || 0);
	            });

	            return this.cache[src];
	        }
	    }, {
	        key: 'loadCanvas',
	        value: function loadCanvas(node) {
	            var key = String(this._index++);
	            this.cache[key] = Promise.resolve(node);
	            return key;
	        }
	    }, {
	        key: 'hasResourceInCache',
	        value: function hasResourceInCache(key) {
	            return typeof this.cache[key] !== 'undefined';
	        }
	    }, {
	        key: 'addImage',
	        value: function addImage(key, src, useCORS) {
	            var _this4 = this;

	            if (process.env.NODE_ENV !== 'production') {
	                this.logger.log('Added image ' + key.substring(0, 256));
	            }

	            var imageLoadHandler = function imageLoadHandler(supportsDataImages) {
	                return new Promise(function (resolve, reject) {
	                    var img = new Image();
	                    img.onload = function () {
	                        return resolve(img);
	                    };
	                    //ios safari 10.3 taints canvas with data urls unless crossOrigin is set to anonymous
	                    if (!supportsDataImages || useCORS) {
	                        img.crossOrigin = 'anonymous';
	                    }

	                    img.onerror = reject;
	                    img.src = src;
	                    if (img.complete === true) {
	                        // Inline XML images may fail to parse, throwing an Error later on
	                        setTimeout(function () {
	                            resolve(img);
	                        }, 500);
	                    }
	                    if (_this4.options.imageTimeout) {
	                        var timeout = _this4.options.imageTimeout;
	                        setTimeout(function () {
	                            return reject(process.env.NODE_ENV !== 'production' ? 'Timed out (' + timeout + 'ms) fetching ' + src.substring(0, 256) : '');
	                        }, timeout);
	                    }
	                });
	            };

	            this.cache[key] = isInlineBase64Image(src) && !isSVG(src) ? // $FlowFixMe
	            _Feature2.default.SUPPORT_BASE64_DRAWING(src).then(imageLoadHandler) : imageLoadHandler(true);
	            return key;
	        }
	    }, {
	        key: 'isSameOrigin',
	        value: function isSameOrigin(url) {
	            return this.getOrigin(url) === this.origin;
	        }
	    }, {
	        key: 'getOrigin',
	        value: function getOrigin(url) {
	            var link = this._link || (this._link = this._window.document.createElement('a'));
	            link.href = url;
	            link.href = link.href; // IE9, LOL! - http://jsfiddle.net/niklasvh/2e48b/
	            return link.protocol + link.hostname + link.port;
	        }
	    }, {
	        key: 'ready',
	        value: function ready() {
	            var _this5 = this;

	            var keys = Object.keys(this.cache);
	            var values = keys.map(function (str) {
	                return _this5.cache[str].catch(function (e) {
	                    if (process.env.NODE_ENV !== 'production') {
	                        _this5.logger.log('Unable to load image', e);
	                    }
	                    return null;
	                });
	            });
	            return Promise.all(values).then(function (images) {
	                if (process.env.NODE_ENV !== 'production') {
	                    _this5.logger.log('Finished loading ' + images.length + ' images', images);
	                }
	                return new ResourceStore(keys, images);
	            });
	        }
	    }]);

	    return ResourceLoader;
	}();

	exports.default = ResourceLoader;

	var ResourceStore = exports.ResourceStore = function () {
	    function ResourceStore(keys, resources) {
	        _classCallCheck(this, ResourceStore);

	        this._keys = keys;
	        this._resources = resources;
	    }

	    _createClass(ResourceStore, [{
	        key: 'get',
	        value: function get(key) {
	            var index = this._keys.indexOf(key);
	            return index === -1 ? null : this._resources[index];
	        }
	    }]);

	    return ResourceStore;
	}();

	var INLINE_SVG = /^data:image\/svg\+xml/i;
	var INLINE_BASE64 = /^data:image\/.*;base64,/i;
	var INLINE_IMG = /^data:image\/.*/i;

	var isInlineImage = function isInlineImage(src) {
	    return INLINE_IMG.test(src);
	};
	var isInlineBase64Image = function isInlineBase64Image(src) {
	    return INLINE_BASE64.test(src);
	};

	var isSVG = function isSVG(src) {
	    return src.substr(-3).toLowerCase() === 'svg' || INLINE_SVG.test(src);
	};

	var _loadImage = function _loadImage(src, timeout) {
	    return new Promise(function (resolve, reject) {
	        var img = new Image();
	        img.onload = function () {
	            return resolve(img);
	        };
	        img.onerror = reject;
	        img.src = src;
	        if (img.complete === true) {
	            // Inline XML images may fail to parse, throwing an Error later on
	            setTimeout(function () {
	                resolve(img);
	            }, 500);
	        }
	        if (timeout) {
	            setTimeout(function () {
	                return reject(process.env.NODE_ENV !== 'production' ? 'Timed out (' + timeout + 'ms) loading image' : '');
	            }, timeout);
	        }
	    });
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ })
/******/ ]);