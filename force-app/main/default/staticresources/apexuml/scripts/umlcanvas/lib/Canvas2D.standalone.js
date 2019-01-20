if( ! window.Node ) {
    window.Node = {};
    Node.ELEMENT_NODE = 1;
    Node.ATTRIBUTE_NODE = 2;
    Node.TEXT_NODE = 3;
    Node.CDATA_SECTION_NODE = 4;
    Node.ENTITY_REFERENCE_NODE = 5;
    Node.ENTITY_NODE = 6;
    Node.PROCESSING_INSTRUCTION_NODE = 7;
    Node.COMMENT_NODE = 8;
    Node.DOCUMENT_NODE = 9;
    Node.DOCUMENT_TYPE_NODE = 10;
    Node.DOCUMENT_FRAGMENT_NODE = 11;
    Node.NOTATION_NODE = 12;
}

// IE misses indexOf ... and so do we ;-)
if( !Array.indexOf ) {
  Array.prototype.indexOf = function(obj){
    for(var i=0; i<this.length; i++){
      if(this[i]==obj){
        return i;
      }
    }
    return -1;
  };
}
var ProtoJS = {
  Browser: {
    IE:     !!(window.attachEvent &&
      navigator.userAgent.indexOf('Opera') === -1),
    Opera:  navigator.userAgent.indexOf('Opera') > -1,
    WebKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
    Gecko:  navigator.userAgent.indexOf('Gecko') > -1 &&
      navigator.userAgent.indexOf('KHTML') === -1,
    MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/)
  }
};

if( typeof console == "undefined" ) {
  console = { log: function() {} };
}
ProtoJS.mix = function(something, into, replace) {
  replace = replace || false;
  for( var key in something ) {
    if( replace || !into[key] ) {
      into[key] = something[key];
    } else {
      console.log( "ProtoJS: Found an implementation for " + key );
    }
  }
};
// this is a very minimalistic first stab
ProtoJS.Event = {
  observe: function(element, eventName, handler) {
    if(!element) { 
      console.log( "WARN: passed invalid element to ProtoJS.Event.observe." );
    } else {
      if (element.addEventListener) {
        element.addEventListener(eventName, handler, false);
      } else {
        element.attachEvent("on" + eventName, handler);
      }
    }
    return element;
  },

  enable: function enable( clazz ) {
    ProtoJS.mix( ProtoJS.Event.Handling, clazz );
  }
};

ProtoJS.Event.Handling = {
  on: function on( event, handler ) {
    if( !this.eventHandlers ) { this.eventHandlers = []; }
    if( !this.eventHandlers[event] ) { this.eventHandlers[event] = []; }
    this.eventHandlers[event].push(handler);
  },

  fireEvent: function fireEvent( event, data ) {
    if( !this.eventHandlers ) { return; }
    if( this.eventHandlers[event] ) {
      this.eventHandlers[event].iterate( function(handler) {
        handler(data);
      } );
    }
  }
};
ProtoJS.Object = {
  isUndefined: function(object) {
      return typeof object == "undefined";
  }
};

ProtoJS.mix( ProtoJS.Object, Object );
ProtoJS.String = {
  contains : function contains( needle ) {
    return this.indexOf( needle ) > -1;
  },

  containsOneOf: function containsOneOf( needles ) {
    var result = false;
    needles.iterate( function( needle ) {
      result = result || this.contains( needle );
    }.scope(this) );
    return result;
  },

  trim : function trim( value ) {
    if( typeof this.replace == "function" ) { value = this; }
    return value.replace(/^\s*/, "").replace(/\s*$/, "");
  },

  isArray   : function isArray()    { return false; },
  isHash    : function isHash()     { return false; },
  isFunction: function isFunction() { return false; },
  isString  : function isString()   { return true;  },
  isNumber  : function isNumber()   { return false; },
  isClass   : function isClass()    { return false; }
};

ProtoJS.mix( ProtoJS.String, String.prototype );
ProtoJS.Number = {
    isArray   : function() { return false; },
    isHash    : function() { return false; },
    isFunction: function() { return false; },
    isString  : function() { return false; },
    isNumber  : function() { return true;  },
    isClass   : function() { return false; },

    toHex     : function() {
      number = this.valueOf() < 0 ? 
        0xFFFFFFFF + this.valueOf() + 1 : this.valueOf();
      return number.toString(16).toUpperCase();
    }
};

ProtoJS.mix( ProtoJS.Number, Number.prototype );
// from http://ejohn.org/blog/simple-javascript-inheritance/
// Inspired by base2 and Prototype
(function(){
  var initializing = false, 
  fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;

    /* 
    Instantiate a base class (but only create the instance,
    don't run the init constructor)
    */
    initializing = true;
    var prototype = new this();
    initializing = false;

    // A function to create a wrapped inherited method
    function _make_wrapped_method(name, fn) {
      return function() {
        var tmp = this._super;

        // Add a new ._super() method that is the same method
        // but on the super-class
        this._super = _super[name];

        // The method only need to be bound temporarily, so we
        // remove it when we're done executing
        var ret = fn.apply(this, arguments);
        this._super = tmp;

        return ret;
      };
    }

    // implement our type tests at Class-instance level
    prototype.isArray    = function() { return false; };
    prototype.isHash     = function() { return false; };
    prototype.isNumber   = function() { return false; };
    prototype.isString   = function() { return false; };
    prototype.isFunction = function() { return false; };

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
      typeof _super[name] == "function" && fnTest.test(prop[name]) ?
      _make_wrapped_method( name, prop[name] ) : prop[name];
    }

    // toString doesn't show up in the iterated properties in JScript
    // see: https://developer.mozilla.org/en/ECMAScript_DontEnum_attribute
    // quick fix: explicitly test for it
    if( ProtoJS.Browser.IE && prop.toString ) {
      prototype.toString =
      _make_wrapped_method( "toString", prop.toString);
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init ) {
        this.init.apply(this, arguments);
      }
    }

    // we're always a class, except for Hashes
    if( ! prototype.isHash() ) {
      prototype.isClass    = function() { return true;  };
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    // implement our type tests at Class level
    Class.isArray    = function() { return false; };
    Class.isHash     = function() { return false; };
    Class.isNumber   = function() { return false; };
    Class.isString   = function() { return false; };
    Class.isFunction = function() { return false; };
    Class.isClass    = function() { return true;  };

    return Class;
  };

  // provide a way to add extended functionality to
  Class.extendMethod  = function( clazz, method, extension, before ) {
    var originalMethod = clazz.prototype[method];
    clazz.prototype[method] = function() {
      if( before ) { extension.apply(this, arguments); }
      originalMethod.apply(this, arguments);
      if( ! before ) { extension.apply(this, arguments); }
    };
  };
}
)();
function $A(object) {
  var length = object.length || 0;
  var results = new Array(length);
  while (length--) { results[length] = object[length]; }
  return results;
}

ProtoJS.Array =  {
  compare: function(other) {
    if (this.length != other.length) { return false; }
    for (var i = 0; i < other.length; i++) {
      if (this[i].compare) { 
        if (!this[i].compare(other[i])) { return false; }
      }
      if (this[i] !== other[i]) { return false; }
    }
    return true;
  },

  has: function(needle) {
    return this.indexOf(needle) > -1;
  },

  unique: function unique() {
    var old = this.dup();
    this.clear();
    old.iterate( function(item) { 
      if( !this.has(item) ) { this.push(item); }
    }.scope(this) );
    return this;
  },

  iterate: function(handler, context) {
    for(var i=0, length=this.length; i<length; i++ ) {
      handler.call(context, this[i], i);
    }
  },

  dup: function() {
    return [].concat(this);
  },

  clear: function() {
    this.length = 0;
    return this;
  },

  remove: function(array) {
    var needles = array.isArray() ? array : $A(arguments);
    var old = this.dup();
    this.clear();
    old.iterate( function(item) { 
      if( !needles.has(item) ) { this.push(item); }
    }.scope(this) );
    return this;
  },

  min: function min() {
    var minimum = null;
    this.iterate(function(item) {
      if( minimum == null || item < minimum ) { minimum = item; }
    } );
    return minimum;
  },

  max: function max() {
    var maximum = null;
    this.iterate(function(item) {
      if( maximum == null || item > maximum ) { maximum = item; }
    } );
    return maximum;
  },

  isArray   : function() { return true;  },
  isHash    : function() { return false; },
  isFunction: function() { return false; },
  isString  : function() { return false; },
  isNumber  : function() { return false; },
  isClass   : function() { return false; }
};

ProtoJS.mix( ProtoJS.Array, Array.prototype );
var Hash = Class.extend( {
  init: function init(hash) {
    this.hash = hash || {};
  },

  set: function( key, value ) {
    this.hash[key] = value;
  },

  get: function( key ) {
    return this.hash[key];
  },

  keys: function keys() {
    var ks = [];
    this.iterate( function( key, value ) {
      ks.push( key );
    } );
    return ks;
  },

  values: function values() {
    var vals = [];
    this.iterate( function( key, value ) {
      vals.push( value );
    } );
    return vals;
  },

  hasKey: function has(key) {
    return this.keys().has(key);
  },

  hasValue: function has(value) {
    return this.values().has(value);
  },

  iterate: function each(handler, context) {
    for(var key in this.hash ) {
      handler.call(context, key, this.hash[key]);
    }
  },

  isArray   : function() { return false; },
  isHash    : function() { return true;  },
  isFunction: function() { return false; },
  isString  : function() { return false; },
  isNumber  : function() { return false; },
  isClass   : function() { return false; }
} );

var $H = function(hash) { return new Hash(hash); };
ProtoJS.Function = {
  after: function() {
    var method  = this;
    var args    = $A(arguments);
    var timeout = args.shift();
    return window.setTimeout(
      function() { return method.apply(method, args); }, timeout 
    );
  },

  scope: function scope(context) { 
    var method = this;
    return function() { return method.apply( context, arguments ); };
  },

  isArray   : function() { return false; },
  isHash    : function() { return false; },
  isFunction: function() { return true;  },
  isString  : function() { return false; },
  isNumber  : function() { return false; },
  isClass   : function() { return false; }
};

ProtoJS.mix( ProtoJS.Function, Function.prototype );
ProtoJS.Ajax = Class.extend( {
  init: function() {
    this.xmlhttp = null;
    if (window.XMLHttpRequest) {
      // code for IE7+, Firefox, Chrome, Opera, Safari
      this.xmlhttp=new XMLHttpRequest();
    } else if (window.ActiveXObject) {
      // code for IE6, IE5
      this.xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    } else {
      alert("Your browser does not support XMLHTTP!");
    }
  },

  fetch: function(url, callback) {
    if( url.substring(0,4) == "http" ) { 
      return this.fetchUsingXDR(url, callback); 
    }
    this.xmlhttp.open("GET", url, typeof callback == "function" );
    if(callback) {
      this.xmlhttp.onreadystatechange = function() {
        callback.call(this, this.xmlhttp);
      }.scope(this);
    }
    this.xmlhttp.send(null);
    return this.xmlhttp.responseText;
  },

  fetchUsingXDR: function(url, callback) {
    ProtoJS.XDR.push(callback);
    var e  = document.createElement("script");
    var op = url.contains('?') ? "&" : "?";
    e.src  = url + op +"f=ProtoJS.XDR[" + (ProtoJS.XDR.length-1) +  "]";
    e.type = "text/javascript";
    document.getElementsByTagName("head")[0].appendChild(e); 
  }
});

// globally available array for storing callback functions 
// for our XDR implementation
ProtoJS.XDR = [];
ProtoJS.Timer = Class.extend( {
  init: function init() {
    this.reset();
  },
  
  start: function start() {
    this.startTime = this.startTime || this.getTime();
    this.stopTime  = null;
    return this;
  },

  stop: function stop() {
    this.stopTime = this.getTime();
    return this;
  },
  
  getTime: function getTime() {
    return new Date().getTime(); 
  },
  
  reset: function reset() {
    this.startTime = null;
  },
  
  getElapsed: function getElapsed() {
    var now = this.getTime();
    return ( this.stopTime || now ) - ( this.startTime || now );
  }
} );
ProtoJS.Font = Class.extend( {
  init: function init(font) {
    this.scale = null;
    this.size  = null;

    var result = font.match("(\\d+)([^\\s/]+)[\\s/]*");
    if( result ) {
      this.size  = result[1];
      this.scale = result[2];
    }
  },

  getSize: function getSize(as) {
    if( this.scale && this.size && ProtoJS.Font.SizeMap[this.scale]) {
      return ProtoJS.Font.SizeMap[this.scale][this.size][as];
    }
    return 0;
  },

  getPxSize : function getPxSize()  { return this.getSize("px");       },
  getPtSize : function getPtSize()  { return this.getSize("pt");       },
  getEmSize : function getEmSize()  { return this.getSize("em");       },
  getPctSize: function getPctSize() { return this.getSize("em") * 100; }
} );

/**
* expand the conversion table to a map
* http://www.reeddesign.co.uk/test/points-pixels.html
* pct = em * 100
*/
ProtoJS.Font.SizeMap = { px : {}, pt: {}, em: {} };

[ 
  { pt:5.5,  px:6,   em:0.375 }, { pt:6,    px:8,   em:0.5   },
  { pt:7,    px:9,   em:0.55  }, { pt:7.5,  px:10,  em:0.625 },
  { pt:8,    px:11,  em:0.7   }, { pt:9,    px:12,  em:0.75  },
  { pt:10,   px:13,  em:0.8   }, { pt:10.5, px:14,  em:0.875 },
  { pt:11,   px:15,  em:0.95  }, { pt:12,   px:16,  em:1     },
  { pt:13,   px:17,  em:1.05  }, { pt:13.5, px:18,  em:1.125 },
  { pt:14,   px:19,  em:1.2   }, { pt:14.5, px:20,  em:1.25  },
  { pt:15,   px:21,  em:1.3   }, { pt:16,   px:22,  em:1.4   },
  { pt:17,   px:23,  em:1.45  }, { pt:18,   px:24,  em:1.5   },
  { pt:20,   px:26,  em:1.6   }, { pt:22,   px:29,  em:1.8   },
  { pt:24,   px:32,  em:2     }, { pt:26,   px:35,  em:2.2   },
  { pt:27,   px:36,  em:2.25  }, { pt:28,   px:37,  em:2.3   },
  { pt:29,   px:38,  em:2.35  }, { pt:30,   px:40,  em:2.45  },
  { pt:32,   px:42,  em:2.55  }, { pt:34,   px:45,  em:2.75  },
  { pt:36,   px:48,  em:3     }
].iterate( function(size) {
  ProtoJS.Font.SizeMap.px[size.px] = size;
  ProtoJS.Font.SizeMap.pt[size.pt] = size;
  ProtoJS.Font.SizeMap.em[size.em] = size;
} );
ProtoJS.Test = Class.extend( {
	init: function init() {
		this.waitingFor = 0;
	},
	
	setTester: function setTester(tester) {
		this.tester = tester;
	},
	
	isReady: function isReady() {
		return this.waitingFor < 1;
	},
	
	assertEqual: function assertEqual( val1, val2, info ) {
    if( val1 == val2 ) {
			this.tester.success( this.currentTestName );
		} else {
      info = info || "";
			this.tester.fail( this.currentTestName, 
                        "  Expected:\n" + val2 + "\n" +
                        "  Got:\n" + val1 + "\n" +
                        "  " + info + "\n" );
    }
	},
	
	assertNotEqual: function assertEqual( val1, val2, info ) {
		if( val1 != val2 ) {
			this.tester.success( this.currentTestName );
		} else {
      info = info || "";
			this.tester.fail( this.currentTestName, 
                        "  Expected:\n" + val2 + "\n" +
                        "  Got:\n" + val1 + "\n" +
                        "  " + info + "\n" );
    }
	},
	
	assertTrue: function assertEqual( val, info ) {
		this.assertEqual( val, true, info );
	},

	assertFalse: function assertEqual( val, info ) {
		this.assertEqual( val, false, info );
	},
	
	assertEqualAfter: function assertEqualAfter( timeout, getValue, val, info ) {
		this.waitingFor++;
		var thisTest = this;
		window.setTimeout( function() {
			thisTest.assertEqual( getValue(), val, info );
			thisTest.waitingFor--;
		}, timeout );
	}

} );

ProtoJS.Test.RunDriver = Class.extend( {
	init : function init() {
		this.units = [];
		this.logDetails = true;
	},

	withoutDetails: function withoutDetails() {
		this.logDetails = false;
		return this;
	},

	log: function log(msg) {
		if( this.logDetails ) { print( msg ); }
	},

	addTestUnit: function addTestUnit( unit ) {
		this.units.push(unit);
		return this;
	},

	start : function start() {
		this.prepare();
		
		this.testNextUnit();

		// wait for all timers to execute before stopping
		if( Envjs.wait ) { Envjs.wait(); }
	},
	
	prepare: function prepare() {
		this.successful       = 0;
		this.failed           = 0;

		this.waitingFor       = 0;

		this.currentUnitIndex = -1;
		this.currentUnit      = null;		
	},
	
	testNextUnit: function testNextUnit() {
		if( this.currentUnit == null || this.currentUnit.isReady() ) {
			if( this.currentUnitIndex < this.units.length - 1 ) {
				this.currentUnitIndex++;
				this.currentUnit = new this.units[this.currentUnitIndex]();
				this.currentUnit.setTester(this);
				this.currentTests = 
					$H(this.units[this.currentUnitIndex].prototype).keys().sort();
				this.currentTestIndex = -1;
				if( this.currentUnit.getScope ) { 
					this.log( "Testing " + this.currentUnit.getScope() );
				}
				this.performNextTest();
				this.testNextUnit();
			} else {
				this.fireEvent( "ready", this );
			}
		} else {
			this.testNextUnit.scope(this).after(10);
		}
	},

	performNextTest: function performNextTest() {
		if( this.currentUnit.isReady() ) {
			if( this.currentTests.length > 0 && 
					this.currentTestIndex < this.currentTests.length ) 
			{
				this.currentTestIndex++;
				var name = this.currentTests[this.currentTestIndex];
				if( name && name.match(/^test/) ) {
					this.log( "- " + name );
					this.currentUnit.currentTestName = name;
					if( this.currentUnit.before ) { this.currentUnit.before(); }
					this.currentUnit[name].scope(this.currentUnit)();
					if( this.currentUnit.after ) { this.currentUnit.after(); }
				}
				// recursively go to next test
				this.performNextTest();
			} else {
				// done, will be picked up by unit loop
			}
		} else {
			this.performNextTest.scope(this).after(10);
		}
	},

	success : function success( name ) {
		this.successful++;
	},

	fail : function fail( name, info ) {
		this.failed++;
		this.log( "FAIL: " + name + "\n" + info );
	},
	
	getResults: function getResults() {
		return { 
			total     : this.failed + this.successful, 
			failed    : this.failed, 
			successful: this.successful
		};
	},

	test : function test( fnc ) {
		this.testFunction = fnc;
		this.prepare();
		return this;
	},

	using : function using( set ) {
		if( !this.testFunction ) {
			print( "Please provide a function to test first..." );
			return;
		}
		set.iterate(function(test) {
			var outcome = this.testFunction( test.data, test.msg, test.result );
      var expected = typeof test.expected == "boolean" ?
        test.expected : true;
			if( outcome.result === expected ) {
				this.success(test.name);
			} else {
			  this.fail(test.name, outcome.info);
		  }
		}.scope(this) );
		return this;
	}
} );

ProtoJS.Event.enable( ProtoJS.Test.RunDriver.prototype );
ProtoJS.Test.Runner = new ProtoJS.Test.RunDriver();

ProtoJS.version = "0.3-5";

// Copyright 2006 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


// Known Issues:
//
// * Patterns only support repeat.
// * Radial gradient are not implemented. The VML version of these look very
//   different from the canvas one.
// * Clipping paths are not implemented.
// * Coordsize. The width and height attribute have higher priority than the
//   width and height style values which isn't correct.
// * Painting mode isn't implemented.
// * Canvas width/height should is using content-box by default. IE in
//   Quirks mode will draw the canvas using border-box. Either change your
//   doctype to HTML5
//   (http://www.whatwg.org/specs/web-apps/current-work/#the-doctype)
//   or use Box Sizing Behavior from WebFX
//   (http://webfx.eae.net/dhtml/boxsizing/boxsizing.html)
// * Non uniform scaling does not correctly scale strokes.
// * Optimize. There is always room for speed improvements.

// Only add this code if we do not already have a canvas implementation
if (!document.createElement('canvas').getContext) {

(function() {

  // alias some functions to make (compiled) code shorter
  var m = Math;
  var mr = m.round;
  var ms = m.sin;
  var mc = m.cos;
  var abs = m.abs;
  var sqrt = m.sqrt;

  // this is used for sub pixel precision
  var Z = 10;
  var Z2 = Z / 2;

  var IE_VERSION = +navigator.userAgent.match(/MSIE ([\d.]+)?/)[1];

  /**
   * This funtion is assigned to the <canvas> elements as element.getContext().
   * @this {HTMLElement}
   * @return {CanvasRenderingContext2D_}
   */
  function getContext() {
    return this.context_ ||
        (this.context_ = new CanvasRenderingContext2D_(this));
  }

  var slice = Array.prototype.slice;

  /**
   * Binds a function to an object. The returned function will always use the
   * passed in {@code obj} as {@code this}.
   *
   * Example:
   *
   *   g = bind(f, obj, a, b)
   *   g(c, d) // will do f.call(obj, a, b, c, d)
   *
   * @param {Function} f The function to bind the object to
   * @param {Object} obj The object that should act as this when the function
   *     is called
   * @param {*} var_args Rest arguments that will be used as the initial
   *     arguments when the function is called
   * @return {Function} A new function that has bound this
   */
  function bind(f, obj, var_args) {
    var a = slice.call(arguments, 2);
    return function() {
      return f.apply(obj, a.concat(slice.call(arguments)));
    };
  }

  function encodeHtmlAttribute(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  function addNamespace(doc, prefix, urn) {
    if (!doc.namespaces[prefix]) {
      doc.namespaces.add(prefix, urn, '#default#VML');
    }
  }

  function addNamespacesAndStylesheet(doc) {
    addNamespace(doc, 'g_vml_', 'urn:schemas-microsoft-com:vml');
    addNamespace(doc, 'g_o_', 'urn:schemas-microsoft-com:office:office');

    // Setup default CSS.  Only add one style sheet per document
    if (!doc.styleSheets['ex_canvas_']) {
      var ss = doc.createStyleSheet();
      ss.owningElement.id = 'ex_canvas_';
      ss.cssText = 'canvas{display:inline-block;overflow:hidden;' +
          // default size is 300x150 in Gecko and Opera
          'text-align:left;width:300px;height:150px}';
    }
  }

  // Add namespaces and stylesheet at startup.
  addNamespacesAndStylesheet(document);

  var G_vmlCanvasManager_ = {
    init: function(opt_doc) {
      var doc = opt_doc || document;
      // Create a dummy element so that IE will allow canvas elements to be
      // recognized.
      doc.createElement('canvas');
      doc.attachEvent('onreadystatechange', bind(this.init_, this, doc));
    },

    init_: function(doc) {
      // find all canvas elements
      var els = doc.getElementsByTagName('canvas');
      for (var i = 0; i < els.length; i++) {
        this.initElement(els[i]);
      }
    },

    /**
     * Public initializes a canvas element so that it can be used as canvas
     * element from now on. This is called automatically before the page is
     * loaded but if you are creating elements using createElement you need to
     * make sure this is called on the element.
     * @param {HTMLElement} el The canvas element to initialize.
     * @return {HTMLElement} the element that was created.
     */
    initElement: function(el) {
      if (!el.getContext) {
        el.getContext = getContext;

        // Add namespaces and stylesheet to document of the element.
        addNamespacesAndStylesheet(el.ownerDocument);

        // Remove fallback content. There is no way to hide text nodes so we
        // just remove all childNodes. We could hide all elements and remove
        // text nodes but who really cares about the fallback content.
        el.innerHTML = '';

        // do not use inline function because that will leak memory
        el.attachEvent('onpropertychange', onPropertyChange);
        el.attachEvent('onresize', onResize);

        var attrs = el.attributes;
        if (attrs.width && attrs.width.specified) {
          // TODO: use runtimeStyle and coordsize
          // el.getContext().setWidth_(attrs.width.nodeValue);
          el.style.width = attrs.width.nodeValue + 'px';
        } else {
          el.width = el.clientWidth;
        }
        if (attrs.height && attrs.height.specified) {
          // TODO: use runtimeStyle and coordsize
          // el.getContext().setHeight_(attrs.height.nodeValue);
          el.style.height = attrs.height.nodeValue + 'px';
        } else {
          el.height = el.clientHeight;
        }
        //el.getContext().setCoordsize_()
      }
      return el;
    }
  };

  function onPropertyChange(e) {
    var el = e.srcElement;

    switch (e.propertyName) {
      case 'width':
        el.getContext().clearRect();
        el.style.width = el.attributes.width.nodeValue + 'px';
        // In IE8 this does not trigger onresize.
        el.firstChild.style.width =  el.clientWidth + 'px';
        break;
      case 'height':
        el.getContext().clearRect();
        el.style.height = el.attributes.height.nodeValue + 'px';
        el.firstChild.style.height = el.clientHeight + 'px';
        break;
    }
  }

  function onResize(e) {
    var el = e.srcElement;
    if (el.firstChild) {
      el.firstChild.style.width =  el.clientWidth + 'px';
      el.firstChild.style.height = el.clientHeight + 'px';
    }
  }

  G_vmlCanvasManager_.init();

  // precompute "00" to "FF"
  var decToHex = [];
  for (var i = 0; i < 16; i++) {
    for (var j = 0; j < 16; j++) {
      decToHex[i * 16 + j] = i.toString(16) + j.toString(16);
    }
  }

  function createMatrixIdentity() {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
  }

  function matrixMultiply(m1, m2) {
    var result = createMatrixIdentity();

    for (var x = 0; x < 3; x++) {
      for (var y = 0; y < 3; y++) {
        var sum = 0;

        for (var z = 0; z < 3; z++) {
          sum += m1[x][z] * m2[z][y];
        }

        result[x][y] = sum;
      }
    }
    return result;
  }

  function copyState(o1, o2) {
    o2.fillStyle     = o1.fillStyle;
    o2.lineCap       = o1.lineCap;
    o2.lineJoin      = o1.lineJoin;
    o2.lineWidth     = o1.lineWidth;
    o2.miterLimit    = o1.miterLimit;
    o2.shadowBlur    = o1.shadowBlur;
    o2.shadowColor   = o1.shadowColor;
    o2.shadowOffsetX = o1.shadowOffsetX;
    o2.shadowOffsetY = o1.shadowOffsetY;
    o2.strokeStyle   = o1.strokeStyle;
    o2.globalAlpha   = o1.globalAlpha;
    o2.font          = o1.font;
    o2.textAlign     = o1.textAlign;
    o2.textBaseline  = o1.textBaseline;
    o2.arcScaleX_    = o1.arcScaleX_;
    o2.arcScaleY_    = o1.arcScaleY_;
    o2.lineScale_    = o1.lineScale_;
  }

  var colorData = {
    aliceblue: '#F0F8FF',
    antiquewhite: '#FAEBD7',
    aquamarine: '#7FFFD4',
    azure: '#F0FFFF',
    beige: '#F5F5DC',
    bisque: '#FFE4C4',
    black: '#000000',
    blanchedalmond: '#FFEBCD',
    blueviolet: '#8A2BE2',
    brown: '#A52A2A',
    burlywood: '#DEB887',
    cadetblue: '#5F9EA0',
    chartreuse: '#7FFF00',
    chocolate: '#D2691E',
    coral: '#FF7F50',
    cornflowerblue: '#6495ED',
    cornsilk: '#FFF8DC',
    crimson: '#DC143C',
    cyan: '#00FFFF',
    darkblue: '#00008B',
    darkcyan: '#008B8B',
    darkgoldenrod: '#B8860B',
    darkgray: '#A9A9A9',
    darkgreen: '#006400',
    darkgrey: '#A9A9A9',
    darkkhaki: '#BDB76B',
    darkmagenta: '#8B008B',
    darkolivegreen: '#556B2F',
    darkorange: '#FF8C00',
    darkorchid: '#9932CC',
    darkred: '#8B0000',
    darksalmon: '#E9967A',
    darkseagreen: '#8FBC8F',
    darkslateblue: '#483D8B',
    darkslategray: '#2F4F4F',
    darkslategrey: '#2F4F4F',
    darkturquoise: '#00CED1',
    darkviolet: '#9400D3',
    deeppink: '#FF1493',
    deepskyblue: '#00BFFF',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1E90FF',
    firebrick: '#B22222',
    floralwhite: '#FFFAF0',
    forestgreen: '#228B22',
    gainsboro: '#DCDCDC',
    ghostwhite: '#F8F8FF',
    gold: '#FFD700',
    goldenrod: '#DAA520',
    grey: '#808080',
    greenyellow: '#ADFF2F',
    honeydew: '#F0FFF0',
    hotpink: '#FF69B4',
    indianred: '#CD5C5C',
    indigo: '#4B0082',
    ivory: '#FFFFF0',
    khaki: '#F0E68C',
    lavender: '#E6E6FA',
    lavenderblush: '#FFF0F5',
    lawngreen: '#7CFC00',
    lemonchiffon: '#FFFACD',
    lightblue: '#ADD8E6',
    lightcoral: '#F08080',
    lightcyan: '#E0FFFF',
    lightgoldenrodyellow: '#FAFAD2',
    lightgreen: '#90EE90',
    lightgrey: '#D3D3D3',
    lightpink: '#FFB6C1',
    lightsalmon: '#FFA07A',
    lightseagreen: '#20B2AA',
    lightskyblue: '#87CEFA',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#B0C4DE',
    lightyellow: '#FFFFE0',
    limegreen: '#32CD32',
    linen: '#FAF0E6',
    magenta: '#FF00FF',
    mediumaquamarine: '#66CDAA',
    mediumblue: '#0000CD',
    mediumorchid: '#BA55D3',
    mediumpurple: '#9370DB',
    mediumseagreen: '#3CB371',
    mediumslateblue: '#7B68EE',
    mediumspringgreen: '#00FA9A',
    mediumturquoise: '#48D1CC',
    mediumvioletred: '#C71585',
    midnightblue: '#191970',
    mintcream: '#F5FFFA',
    mistyrose: '#FFE4E1',
    moccasin: '#FFE4B5',
    navajowhite: '#FFDEAD',
    oldlace: '#FDF5E6',
    olivedrab: '#6B8E23',
    orange: '#FFA500',
    orangered: '#FF4500',
    orchid: '#DA70D6',
    palegoldenrod: '#EEE8AA',
    palegreen: '#98FB98',
    paleturquoise: '#AFEEEE',
    palevioletred: '#DB7093',
    papayawhip: '#FFEFD5',
    peachpuff: '#FFDAB9',
    peru: '#CD853F',
    pink: '#FFC0CB',
    plum: '#DDA0DD',
    powderblue: '#B0E0E6',
    rosybrown: '#BC8F8F',
    royalblue: '#4169E1',
    saddlebrown: '#8B4513',
    salmon: '#FA8072',
    sandybrown: '#F4A460',
    seagreen: '#2E8B57',
    seashell: '#FFF5EE',
    sienna: '#A0522D',
    skyblue: '#87CEEB',
    slateblue: '#6A5ACD',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#FFFAFA',
    springgreen: '#00FF7F',
    steelblue: '#4682B4',
    tan: '#D2B48C',
    thistle: '#D8BFD8',
    tomato: '#FF6347',
    turquoise: '#40E0D0',
    violet: '#EE82EE',
    wheat: '#F5DEB3',
    whitesmoke: '#F5F5F5',
    yellowgreen: '#9ACD32'
  };


  function getRgbHslContent(styleString) {
    var start = styleString.indexOf('(', 3);
    var end = styleString.indexOf(')', start + 1);
    var parts = styleString.substring(start + 1, end).split(',');
    // add alpha if needed
    if (parts.length != 4 || styleString.charAt(3) != 'a') {
      parts[3] = 1;
    }
    return parts;
  }

  function percent(s) {
    return parseFloat(s) / 100;
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function hslToRgb(parts){
    var r, g, b, h, s, l;
    h = parseFloat(parts[0]) / 360 % 360;
    if (h < 0)
      h++;
    s = clamp(percent(parts[1]), 0, 1);
    l = clamp(percent(parts[2]), 0, 1);
    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hueToRgb(p, q, h + 1 / 3);
      g = hueToRgb(p, q, h);
      b = hueToRgb(p, q, h - 1 / 3);
    }

    return '#' + decToHex[Math.floor(r * 255)] +
        decToHex[Math.floor(g * 255)] +
        decToHex[Math.floor(b * 255)];
  }

  function hueToRgb(m1, m2, h) {
    if (h < 0)
      h++;
    if (h > 1)
      h--;

    if (6 * h < 1)
      return m1 + (m2 - m1) * 6 * h;
    else if (2 * h < 1)
      return m2;
    else if (3 * h < 2)
      return m1 + (m2 - m1) * (2 / 3 - h) * 6;
    else
      return m1;
  }

  var processStyleCache = {};

  function processStyle(styleString) {
    if (styleString in processStyleCache) {
      return processStyleCache[styleString];
    }

    var str, alpha = 1;

    styleString = String(styleString);
    if (styleString.charAt(0) == '#') {
      str = styleString;
    } else if (/^rgb/.test(styleString)) {
      var parts = getRgbHslContent(styleString);
      var str = '#', n;
      for (var i = 0; i < 3; i++) {
        if (parts[i].indexOf('%') != -1) {
          n = Math.floor(percent(parts[i]) * 255);
        } else {
          n = +parts[i];
        }
        str += decToHex[clamp(n, 0, 255)];
      }
      alpha = +parts[3];
    } else if (/^hsl/.test(styleString)) {
      var parts = getRgbHslContent(styleString);
      str = hslToRgb(parts);
      alpha = parts[3];
    } else {
      str = colorData[styleString] || styleString;
    }
    return processStyleCache[styleString] = {color: str, alpha: alpha};
  }

  var DEFAULT_STYLE = {
    style: 'normal',
    variant: 'normal',
    weight: 'normal',
    size: 10,
    family: 'sans-serif'
  };

  // Internal text style cache
  var fontStyleCache = {};

  function processFontStyle(styleString) {
    if (fontStyleCache[styleString]) {
      return fontStyleCache[styleString];
    }

    var el = document.createElement('div');
    var style = el.style;
    try {
      style.font = styleString;
    } catch (ex) {
      // Ignore failures to set to invalid font.
    }

    return fontStyleCache[styleString] = {
      style: style.fontStyle || DEFAULT_STYLE.style,
      variant: style.fontVariant || DEFAULT_STYLE.variant,
      weight: style.fontWeight || DEFAULT_STYLE.weight,
      size: style.fontSize || DEFAULT_STYLE.size,
      family: style.fontFamily || DEFAULT_STYLE.family
    };
  }

  function getComputedStyle(style, element) {
    var computedStyle = {};

    for (var p in style) {
      computedStyle[p] = style[p];
    }

    // Compute the size
    var canvasFontSize = parseFloat(element.currentStyle.fontSize),
        fontSize = parseFloat(style.size);

    if (typeof style.size == 'number') {
      computedStyle.size = style.size;
    } else if (style.size.indexOf('px') != -1) {
      computedStyle.size = fontSize;
    } else if (style.size.indexOf('em') != -1) {
      computedStyle.size = canvasFontSize * fontSize;
    } else if(style.size.indexOf('%') != -1) {
      computedStyle.size = (canvasFontSize / 100) * fontSize;
    } else if (style.size.indexOf('pt') != -1) {
      computedStyle.size = fontSize / .75;
    } else {
      computedStyle.size = canvasFontSize;
    }

    // Different scaling between normal text and VML text. This was found using
    // trial and error to get the same size as non VML text.
    computedStyle.size *= 0.981;

    return computedStyle;
  }

  function buildStyle(style) {
    return style.style + ' ' + style.variant + ' ' + style.weight + ' ' +
        style.size + 'px ' + style.family;
  }

  var lineCapMap = {
    'butt': 'flat',
    'round': 'round'
  };

  function processLineCap(lineCap) {
    return lineCapMap[lineCap] || 'square';
  }

  /**
   * This class implements CanvasRenderingContext2D interface as described by
   * the WHATWG.
   * @param {HTMLElement} canvasElement The element that the 2D context should
   * be associated with
   */
  function CanvasRenderingContext2D_(canvasElement) {
    this.m_ = createMatrixIdentity();

    this.mStack_ = [];
    this.aStack_ = [];
    this.currentPath_ = [];

    // Canvas context properties
    this.strokeStyle = '#000';
    this.fillStyle = '#000';

    this.lineWidth = 1;
    this.lineJoin = 'miter';
    this.lineCap = 'butt';
    this.miterLimit = Z * 1;
    this.globalAlpha = 1;
    this.font = '10px sans-serif';
    this.textAlign = 'left';
    this.textBaseline = 'alphabetic';
    this.canvas = canvasElement;

    var cssText = 'width:' + canvasElement.clientWidth + 'px;height:' +
        canvasElement.clientHeight + 'px;overflow:hidden;position:absolute';
    var el = canvasElement.ownerDocument.createElement('div');
    el.style.cssText = cssText;
    canvasElement.appendChild(el);

    var overlayEl = el.cloneNode(false);
    // Use a non transparent background.
    overlayEl.style.backgroundColor = 'red';
    overlayEl.style.filter = 'alpha(opacity=0)';
    canvasElement.appendChild(overlayEl);

    this.element_ = el;
    this.arcScaleX_ = 1;
    this.arcScaleY_ = 1;
    this.lineScale_ = 1;
  }

  var contextPrototype = CanvasRenderingContext2D_.prototype;
  contextPrototype.clearRect = function() {
    if (this.textMeasureEl_) {
      this.textMeasureEl_.removeNode(true);
      this.textMeasureEl_ = null;
    }
    this.element_.innerHTML = '';
  };

  contextPrototype.beginPath = function() {
    // TODO: Branch current matrix so that save/restore has no effect
    //       as per safari docs.
    this.currentPath_ = [];
  };

  contextPrototype.moveTo = function(aX, aY) {
    var p = getCoords(this, aX, aY);
    this.currentPath_.push({type: 'moveTo', x: p.x, y: p.y});
    this.currentX_ = p.x;
    this.currentY_ = p.y;
  };

  contextPrototype.lineTo = function(aX, aY) {
    var p = getCoords(this, aX, aY);
    this.currentPath_.push({type: 'lineTo', x: p.x, y: p.y});

    this.currentX_ = p.x;
    this.currentY_ = p.y;
  };

  contextPrototype.bezierCurveTo = function(aCP1x, aCP1y,
                                            aCP2x, aCP2y,
                                            aX, aY) {
    var p = getCoords(this, aX, aY);
    var cp1 = getCoords(this, aCP1x, aCP1y);
    var cp2 = getCoords(this, aCP2x, aCP2y);
    bezierCurveTo(this, cp1, cp2, p);
  };

  // Helper function that takes the already fixed cordinates.
  function bezierCurveTo(self, cp1, cp2, p) {
    self.currentPath_.push({
      type: 'bezierCurveTo',
      cp1x: cp1.x,
      cp1y: cp1.y,
      cp2x: cp2.x,
      cp2y: cp2.y,
      x: p.x,
      y: p.y
    });
    self.currentX_ = p.x;
    self.currentY_ = p.y;
  }

  contextPrototype.quadraticCurveTo = function(aCPx, aCPy, aX, aY) {
    // the following is lifted almost directly from
    // http://developer.mozilla.org/en/docs/Canvas_tutorial:Drawing_shapes

    var cp = getCoords(this, aCPx, aCPy);
    var p = getCoords(this, aX, aY);

    var cp1 = {
      x: this.currentX_ + 2.0 / 3.0 * (cp.x - this.currentX_),
      y: this.currentY_ + 2.0 / 3.0 * (cp.y - this.currentY_)
    };
    var cp2 = {
      x: cp1.x + (p.x - this.currentX_) / 3.0,
      y: cp1.y + (p.y - this.currentY_) / 3.0
    };

    bezierCurveTo(this, cp1, cp2, p);
  };

  contextPrototype.arc = function(aX, aY, aRadius,
                                  aStartAngle, aEndAngle, aClockwise) {
    aRadius *= Z;
    var arcType = aClockwise ? 'at' : 'wa';

    var xStart = aX + mc(aStartAngle) * aRadius - Z2;
    var yStart = aY + ms(aStartAngle) * aRadius - Z2;

    var xEnd = aX + mc(aEndAngle) * aRadius - Z2;
    var yEnd = aY + ms(aEndAngle) * aRadius - Z2;

    // IE won't render arches drawn counter clockwise if xStart == xEnd.
    if (xStart == xEnd && !aClockwise) {
      xStart += 0.125; // Offset xStart by 1/80 of a pixel. Use something
                       // that can be represented in binary
    }

    var p = getCoords(this, aX, aY);
    var pStart = getCoords(this, xStart, yStart);
    var pEnd = getCoords(this, xEnd, yEnd);

    this.currentPath_.push({type: arcType,
                           x: p.x,
                           y: p.y,
                           radius: aRadius,
                           xStart: pStart.x,
                           yStart: pStart.y,
                           xEnd: pEnd.x,
                           yEnd: pEnd.y});

  };

  contextPrototype.rect = function(aX, aY, aWidth, aHeight) {
    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();
  };

  contextPrototype.strokeRect = function(aX, aY, aWidth, aHeight) {
    var oldPath = this.currentPath_;
    this.beginPath();

    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();
    this.stroke();

    this.currentPath_ = oldPath;
  };

  contextPrototype.fillRect = function(aX, aY, aWidth, aHeight) {
    var oldPath = this.currentPath_;
    this.beginPath();

    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();
    this.fill();

    this.currentPath_ = oldPath;
  };

  contextPrototype.createLinearGradient = function(aX0, aY0, aX1, aY1) {
    var gradient = new CanvasGradient_('gradient');
    gradient.x0_ = aX0;
    gradient.y0_ = aY0;
    gradient.x1_ = aX1;
    gradient.y1_ = aY1;
    return gradient;
  };

  contextPrototype.createRadialGradient = function(aX0, aY0, aR0,
                                                   aX1, aY1, aR1) {
    var gradient = new CanvasGradient_('gradientradial');
    gradient.x0_ = aX0;
    gradient.y0_ = aY0;
    gradient.r0_ = aR0;
    gradient.x1_ = aX1;
    gradient.y1_ = aY1;
    gradient.r1_ = aR1;
    return gradient;
  };

  contextPrototype.drawImage = function(image, var_args) {
    var dx, dy, dw, dh, sx, sy, sw, sh;

    // to find the original width we overide the width and height
    var oldRuntimeWidth = image.runtimeStyle.width;
    var oldRuntimeHeight = image.runtimeStyle.height;
    image.runtimeStyle.width = 'auto';
    image.runtimeStyle.height = 'auto';

    // get the original size
    var w = image.width;
    var h = image.height;

    // and remove overides
    image.runtimeStyle.width = oldRuntimeWidth;
    image.runtimeStyle.height = oldRuntimeHeight;

    if (arguments.length == 3) {
      dx = arguments[1];
      dy = arguments[2];
      sx = sy = 0;
      sw = dw = w;
      sh = dh = h;
    } else if (arguments.length == 5) {
      dx = arguments[1];
      dy = arguments[2];
      dw = arguments[3];
      dh = arguments[4];
      sx = sy = 0;
      sw = w;
      sh = h;
    } else if (arguments.length == 9) {
      sx = arguments[1];
      sy = arguments[2];
      sw = arguments[3];
      sh = arguments[4];
      dx = arguments[5];
      dy = arguments[6];
      dw = arguments[7];
      dh = arguments[8];
    } else {
      throw Error('Invalid number of arguments');
    }

    var d = getCoords(this, dx, dy);

    var w2 = sw / 2;
    var h2 = sh / 2;

    var vmlStr = [];

    var W = 10;
    var H = 10;

    // For some reason that I've now forgotten, using divs didn't work
    vmlStr.push(' <g_vml_:group',
                ' coordsize="', Z * W, ',', Z * H, '"',
                ' coordorigin="0,0"' ,
                ' style="width:', W, 'px;height:', H, 'px;position:absolute;');

    // If filters are necessary (rotation exists), create them
    // filters are bog-slow, so only create them if abbsolutely necessary
    // The following check doesn't account for skews (which don't exist
    // in the canvas spec (yet) anyway.

    if (this.m_[0][0] != 1 || this.m_[0][1] ||
        this.m_[1][1] != 1 || this.m_[1][0]) {
      var filter = [];

      // Note the 12/21 reversal
      filter.push('M11=', this.m_[0][0], ',',
                  'M12=', this.m_[1][0], ',',
                  'M21=', this.m_[0][1], ',',
                  'M22=', this.m_[1][1], ',',
                  'Dx=', mr(d.x / Z), ',',
                  'Dy=', mr(d.y / Z), '');

      // Bounding box calculation (need to minimize displayed area so that
      // filters don't waste time on unused pixels.
      var max = d;
      var c2 = getCoords(this, dx + dw, dy);
      var c3 = getCoords(this, dx, dy + dh);
      var c4 = getCoords(this, dx + dw, dy + dh);

      max.x = m.max(max.x, c2.x, c3.x, c4.x);
      max.y = m.max(max.y, c2.y, c3.y, c4.y);

      vmlStr.push('padding:0 ', mr(max.x / Z), 'px ', mr(max.y / Z),
                  'px 0;filter:progid:DXImageTransform.Microsoft.Matrix(',
                  filter.join(''), ", sizingmethod='clip');");

    } else {
      vmlStr.push('top:', mr(d.y / Z), 'px;left:', mr(d.x / Z), 'px;');
    }

    vmlStr.push(' ">' ,
                '<g_vml_:image src="', image.src, '"',
                ' style="width:', Z * dw, 'px;',
                ' height:', Z * dh, 'px"',
                ' cropleft="', sx / w, '"',
                ' croptop="', sy / h, '"',
                ' cropright="', (w - sx - sw) / w, '"',
                ' cropbottom="', (h - sy - sh) / h, '"',
                ' />',
                '</g_vml_:group>');

    this.element_.insertAdjacentHTML('BeforeEnd', vmlStr.join(''));
  };

  contextPrototype.stroke = function(aFill) {
    var lineStr = [];
    var lineOpen = false;

    var W = 10;
    var H = 10;

    lineStr.push('<g_vml_:shape',
                 ' filled="', !!aFill, '"',
                 ' style="position:absolute;width:', W, 'px;height:', H, 'px;"',
                 ' coordorigin="0,0"',
                 ' coordsize="', Z * W, ',', Z * H, '"',
                 ' stroked="', !aFill, '"',
                 ' path="');

    var newSeq = false;
    var min = {x: null, y: null};
    var max = {x: null, y: null};

    for (var i = 0; i < this.currentPath_.length; i++) {
      var p = this.currentPath_[i];
      var c;

      switch (p.type) {
        case 'moveTo':
          c = p;
          lineStr.push(' m ', mr(p.x), ',', mr(p.y));
          break;
        case 'lineTo':
          lineStr.push(' l ', mr(p.x), ',', mr(p.y));
          break;
        case 'close':
          lineStr.push(' x ');
          p = null;
          break;
        case 'bezierCurveTo':
          lineStr.push(' c ',
                       mr(p.cp1x), ',', mr(p.cp1y), ',',
                       mr(p.cp2x), ',', mr(p.cp2y), ',',
                       mr(p.x), ',', mr(p.y));
          break;
        case 'at':
        case 'wa':
          lineStr.push(' ', p.type, ' ',
                       mr(p.x - this.arcScaleX_ * p.radius), ',',
                       mr(p.y - this.arcScaleY_ * p.radius), ' ',
                       mr(p.x + this.arcScaleX_ * p.radius), ',',
                       mr(p.y + this.arcScaleY_ * p.radius), ' ',
                       mr(p.xStart), ',', mr(p.yStart), ' ',
                       mr(p.xEnd), ',', mr(p.yEnd));
          break;
      }


      // TODO: Following is broken for curves due to
      //       move to proper paths.

      // Figure out dimensions so we can do gradient fills
      // properly
      if (p) {
        if (min.x == null || p.x < min.x) {
          min.x = p.x;
        }
        if (max.x == null || p.x > max.x) {
          max.x = p.x;
        }
        if (min.y == null || p.y < min.y) {
          min.y = p.y;
        }
        if (max.y == null || p.y > max.y) {
          max.y = p.y;
        }
      }
    }
    lineStr.push(' ">');

    if (!aFill) {
      appendStroke(this, lineStr);
    } else {
      appendFill(this, lineStr, min, max);
    }

    lineStr.push('</g_vml_:shape>');

    this.element_.insertAdjacentHTML('beforeEnd', lineStr.join(''));
  };

  function appendStroke(ctx, lineStr) {
    var a = processStyle(ctx.strokeStyle);
    var color = a.color;
    var opacity = a.alpha * ctx.globalAlpha;
    var lineWidth = ctx.lineScale_ * ctx.lineWidth;

    // VML cannot correctly render a line if the width is less than 1px.
    // In that case, we dilute the color to make the line look thinner.
    if (lineWidth < 1) {
      opacity *= lineWidth;
    }

    lineStr.push(
      '<g_vml_:stroke',
      ' opacity="', opacity, '"',
      ' joinstyle="', ctx.lineJoin, '"',
      ' miterlimit="', ctx.miterLimit, '"',
      ' endcap="', processLineCap(ctx.lineCap), '"',
      ' weight="', lineWidth, 'px"',
      ' color="', color, '" />'
    );
  }

  function appendFill(ctx, lineStr, min, max) {
    var fillStyle = ctx.fillStyle;
    var arcScaleX = ctx.arcScaleX_;
    var arcScaleY = ctx.arcScaleY_;
    var width = max.x - min.x;
    var height = max.y - min.y;
    if (fillStyle instanceof CanvasGradient_) {
      // TODO: Gradients transformed with the transformation matrix.
      var angle = 0;
      var focus = {x: 0, y: 0};

      // additional offset
      var shift = 0;
      // scale factor for offset
      var expansion = 1;

      if (fillStyle.type_ == 'gradient') {
        var x0 = fillStyle.x0_ / arcScaleX;
        var y0 = fillStyle.y0_ / arcScaleY;
        var x1 = fillStyle.x1_ / arcScaleX;
        var y1 = fillStyle.y1_ / arcScaleY;
        var p0 = getCoords(ctx, x0, y0);
        var p1 = getCoords(ctx, x1, y1);
        var dx = p1.x - p0.x;
        var dy = p1.y - p0.y;
        angle = Math.atan2(dx, dy) * 180 / Math.PI;

        // The angle should be a non-negative number.
        if (angle < 0) {
          angle += 360;
        }

        // Very small angles produce an unexpected result because they are
        // converted to a scientific notation string.
        if (angle < 1e-6) {
          angle = 0;
        }
      } else {
        var p0 = getCoords(ctx, fillStyle.x0_, fillStyle.y0_);
        focus = {
          x: (p0.x - min.x) / width,
          y: (p0.y - min.y) / height
        };

        width  /= arcScaleX * Z;
        height /= arcScaleY * Z;
        var dimension = m.max(width, height);
        shift = 2 * fillStyle.r0_ / dimension;
        expansion = 2 * fillStyle.r1_ / dimension - shift;
      }

      // We need to sort the color stops in ascending order by offset,
      // otherwise IE won't interpret it correctly.
      var stops = fillStyle.colors_;
      stops.sort(function(cs1, cs2) {
        return cs1.offset - cs2.offset;
      });

      var length = stops.length;
      var color1 = stops[0].color;
      var color2 = stops[length - 1].color;
      var opacity1 = stops[0].alpha * ctx.globalAlpha;
      var opacity2 = stops[length - 1].alpha * ctx.globalAlpha;

      var colors = [];
      for (var i = 0; i < length; i++) {
        var stop = stops[i];
        colors.push(stop.offset * expansion + shift + ' ' + stop.color);
      }

      // When colors attribute is used, the meanings of opacity and o:opacity2
      // are reversed.
      lineStr.push('<g_vml_:fill type="', fillStyle.type_, '"',
                   ' method="none" focus="100%"',
                   ' color="', color1, '"',
                   ' color2="', color2, '"',
                   ' colors="', colors.join(','), '"',
                   ' opacity="', opacity2, '"',
                   ' g_o_:opacity2="', opacity1, '"',
                   ' angle="', angle, '"',
                   ' focusposition="', focus.x, ',', focus.y, '" />');
    } else if (fillStyle instanceof CanvasPattern_) {
      if (width && height) {
        var deltaLeft = -min.x;
        var deltaTop = -min.y;
        lineStr.push('<g_vml_:fill',
                     ' position="',
                     deltaLeft / width * arcScaleX * arcScaleX, ',',
                     deltaTop / height * arcScaleY * arcScaleY, '"',
                     ' type="tile"',
                     // TODO: Figure out the correct size to fit the scale.
                     //' size="', w, 'px ', h, 'px"',
                     ' src="', fillStyle.src_, '" />');
       }
    } else {
      var a = processStyle(ctx.fillStyle);
      var color = a.color;
      var opacity = a.alpha * ctx.globalAlpha;
      lineStr.push('<g_vml_:fill color="', color, '" opacity="', opacity,
                   '" />');
    }
  }

  contextPrototype.fill = function() {
    this.stroke(true);
  };

  contextPrototype.closePath = function() {
    this.currentPath_.push({type: 'close'});
  };

  function getCoords(ctx, aX, aY) {
    var m = ctx.m_;
    return {
      x: Z * (aX * m[0][0] + aY * m[1][0] + m[2][0]) - Z2,
      y: Z * (aX * m[0][1] + aY * m[1][1] + m[2][1]) - Z2
    };
  };

  contextPrototype.save = function() {
    var o = {};
    copyState(this, o);
    this.aStack_.push(o);
    this.mStack_.push(this.m_);
    this.m_ = matrixMultiply(createMatrixIdentity(), this.m_);
  };

  contextPrototype.restore = function() {
    if (this.aStack_.length) {
      copyState(this.aStack_.pop(), this);
      this.m_ = this.mStack_.pop();
    }
  };

  function matrixIsFinite(m) {
    return isFinite(m[0][0]) && isFinite(m[0][1]) &&
        isFinite(m[1][0]) && isFinite(m[1][1]) &&
        isFinite(m[2][0]) && isFinite(m[2][1]);
  }

  function setM(ctx, m, updateLineScale) {
    if (!matrixIsFinite(m)) {
      return;
    }
    ctx.m_ = m;

    if (updateLineScale) {
      // Get the line scale.
      // Determinant of this.m_ means how much the area is enlarged by the
      // transformation. So its square root can be used as a scale factor
      // for width.
      var det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
      ctx.lineScale_ = sqrt(abs(det));
    }
  }

  contextPrototype.translate = function(aX, aY) {
    var m1 = [
      [1,  0,  0],
      [0,  1,  0],
      [aX, aY, 1]
    ];

    setM(this, matrixMultiply(m1, this.m_), false);
  };

  contextPrototype.rotate = function(aRot) {
    var c = mc(aRot);
    var s = ms(aRot);

    var m1 = [
      [c,  s, 0],
      [-s, c, 0],
      [0,  0, 1]
    ];

    setM(this, matrixMultiply(m1, this.m_), false);
  };

  contextPrototype.scale = function(aX, aY) {
    this.arcScaleX_ *= aX;
    this.arcScaleY_ *= aY;
    var m1 = [
      [aX, 0,  0],
      [0,  aY, 0],
      [0,  0,  1]
    ];

    setM(this, matrixMultiply(m1, this.m_), true);
  };

  contextPrototype.transform = function(m11, m12, m21, m22, dx, dy) {
    var m1 = [
      [m11, m12, 0],
      [m21, m22, 0],
      [dx,  dy,  1]
    ];

    setM(this, matrixMultiply(m1, this.m_), true);
  };

  contextPrototype.setTransform = function(m11, m12, m21, m22, dx, dy) {
    var m = [
      [m11, m12, 0],
      [m21, m22, 0],
      [dx,  dy,  1]
    ];

    setM(this, m, true);
  };

  /**
   * The text drawing function.
   * The maxWidth argument isn't taken in account, since no browser supports
   * it yet.
   */
  contextPrototype.drawText_ = function(text, x, y, maxWidth, stroke) {
    var m = this.m_,
        delta = 1000,
        left = 0,
        right = delta,
        offset = {x: 0, y: 0},
        lineStr = [];

    var fontStyle = getComputedStyle(processFontStyle(this.font),
                                     this.element_);

    var fontStyleString = buildStyle(fontStyle);

    var elementStyle = this.element_.currentStyle;
    var textAlign = this.textAlign.toLowerCase();
    switch (textAlign) {
      case 'left':
      case 'center':
      case 'right':
        break;
      case 'end':
        textAlign = elementStyle.direction == 'ltr' ? 'right' : 'left';
        break;
      case 'start':
        textAlign = elementStyle.direction == 'rtl' ? 'right' : 'left';
        break;
      default:
        textAlign = 'left';
    }

    // 1.75 is an arbitrary number, as there is no info about the text baseline
    switch (this.textBaseline) {
      case 'hanging':
      case 'top':
        offset.y = fontStyle.size / 1.75;
        break;
      case 'middle':
        break;
      default:
      case null:
      case 'alphabetic':
      case 'ideographic':
      case 'bottom':
        offset.y = -fontStyle.size / 2.25;
        break;
    }

    switch(textAlign) {
      case 'right':
        left = delta;
        right = 0.05;
        break;
      case 'center':
        left = right = delta / 2;
        break;
    }

    var d = getCoords(this, x + offset.x, y + offset.y);

    lineStr.push('<g_vml_:line from="', -left ,' 0" to="', right ,' 0.05" ',
                 ' coordsize="100 100" coordorigin="0 0"',
                 ' filled="', !stroke, '" stroked="', !!stroke,
                 '" style="position:absolute;width:1px;height:1px;">');

    if (stroke) {
      appendStroke(this, lineStr);
    } else {
      // TODO: Fix the min and max params.
      appendFill(this, lineStr, {x: -left, y: 0},
                 {x: right, y: fontStyle.size});
    }

    var skewM = m[0][0].toFixed(3) + ',' + m[1][0].toFixed(3) + ',' +
                m[0][1].toFixed(3) + ',' + m[1][1].toFixed(3) + ',0,0';

    var skewOffset = mr(d.x / Z) + ',' + mr(d.y / Z);

    lineStr.push('<g_vml_:skew on="t" matrix="', skewM ,'" ',
                 ' offset="', skewOffset, '" origin="', left ,' 0" />',
                 '<g_vml_:path textpathok="true" />',
                 '<g_vml_:textpath on="true" string="',
                 encodeHtmlAttribute(text),
                 '" style="v-text-align:', textAlign,
                 ';font:', encodeHtmlAttribute(fontStyleString),
                 '" /></g_vml_:line>');

    this.element_.insertAdjacentHTML('beforeEnd', lineStr.join(''));
  };

  contextPrototype.fillText = function(text, x, y, maxWidth) {
    this.drawText_(text, x, y, maxWidth, false);
  };

  contextPrototype.strokeText = function(text, x, y, maxWidth) {
    this.drawText_(text, x, y, maxWidth, true);
  };

  contextPrototype.measureText = function(text) {
    if (!this.textMeasureEl_) {
      var s = '<span style="position:absolute;' +
          'top:-20000px;left:0;padding:0;margin:0;border:none;' +
          'white-space:pre;"></span>';
      this.element_.insertAdjacentHTML('beforeEnd', s);
      this.textMeasureEl_ = this.element_.lastChild;
    }
    var doc = this.element_.ownerDocument;
    this.textMeasureEl_.innerHTML = '';
    this.textMeasureEl_.style.font = this.font;
    // Don't use innerHTML or innerText because they allow markup/whitespace.
    this.textMeasureEl_.appendChild(doc.createTextNode(text));
    return {width: this.textMeasureEl_.offsetWidth};
  };

  /******** STUBS ********/
  contextPrototype.clip = function() {
    // TODO: Implement
  };

  contextPrototype.arcTo = function() {
    // TODO: Implement
  };

  contextPrototype.createPattern = function(image, repetition) {
    return new CanvasPattern_(image, repetition);
  };

  // Gradient / Pattern Stubs
  function CanvasGradient_(aType) {
    this.type_ = aType;
    this.x0_ = 0;
    this.y0_ = 0;
    this.r0_ = 0;
    this.x1_ = 0;
    this.y1_ = 0;
    this.r1_ = 0;
    this.colors_ = [];
  }

  CanvasGradient_.prototype.addColorStop = function(aOffset, aColor) {
    aColor = processStyle(aColor);
    this.colors_.push({offset: aOffset,
                       color: aColor.color,
                       alpha: aColor.alpha});
  };

  function CanvasPattern_(image, repetition) {
    assertImageIsValid(image);
    switch (repetition) {
      case 'repeat':
      case null:
      case '':
        this.repetition_ = 'repeat';
        break
      case 'repeat-x':
      case 'repeat-y':
      case 'no-repeat':
        this.repetition_ = repetition;
        break;
      default:
        throwException('SYNTAX_ERR');
    }

    this.src_ = image.src;
    this.width_ = image.width;
    this.height_ = image.height;
  }

  function throwException(s) {
    throw new DOMException_(s);
  }

  function assertImageIsValid(img) {
    if (!img || img.nodeType != 1 || img.tagName != 'IMG') {
      throwException('TYPE_MISMATCH_ERR');
    }
    if (img.readyState != 'complete') {
      throwException('INVALID_STATE_ERR');
    }
  }

  function DOMException_(s) {
    this.code = this[s];
    this.message = s +': DOM Exception ' + this.code;
  }
  var p = DOMException_.prototype = new Error;
  p.INDEX_SIZE_ERR = 1;
  p.DOMSTRING_SIZE_ERR = 2;
  p.HIERARCHY_REQUEST_ERR = 3;
  p.WRONG_DOCUMENT_ERR = 4;
  p.INVALID_CHARACTER_ERR = 5;
  p.NO_DATA_ALLOWED_ERR = 6;
  p.NO_MODIFICATION_ALLOWED_ERR = 7;
  p.NOT_FOUND_ERR = 8;
  p.NOT_SUPPORTED_ERR = 9;
  p.INUSE_ATTRIBUTE_ERR = 10;
  p.INVALID_STATE_ERR = 11;
  p.SYNTAX_ERR = 12;
  p.INVALID_MODIFICATION_ERR = 13;
  p.NAMESPACE_ERR = 14;
  p.INVALID_ACCESS_ERR = 15;
  p.VALIDATION_ERR = 16;
  p.TYPE_MISMATCH_ERR = 17;

  // set up externs
  G_vmlCanvasManager = G_vmlCanvasManager_;
  CanvasRenderingContext2D = CanvasRenderingContext2D_;
  CanvasGradient = CanvasGradient_;
  CanvasPattern = CanvasPattern_;
  DOMException = DOMException_;
})();

} // if
//
// This code is released to the public domain by Jim Studt, 2007.
// He may keep some sort of up to date copy at http://www.federated.com/~jim/canvastext/
//
var CanvasTextFunctions = { };

CanvasTextFunctions.letters = {
    ' ': { width: 16, points: [] },
    '!': { width: 10, points: [[5,21],[5,7],[-1,-1],[5,2],[4,1],[5,0],[6,1],[5,2]] },
    '"': { width: 16, points: [[4,21],[4,14],[-1,-1],[12,21],[12,14]] },
    '#': { width: 21, points: [[11,25],[4,-7],[-1,-1],[17,25],[10,-7],[-1,-1],[4,12],[18,12],[-1,-1],[3,6],[17,6]] },
    '$': { width: 20, points: [[8,25],[8,-4],[-1,-1],[12,25],[12,-4],[-1,-1],[17,18],[15,20],[12,21],[8,21],[5,20],[3,18],[3,16],[4,14],[5,13],[7,12],[13,10],[15,9],[16,8],[17,6],[17,3],[15,1],[12,0],[8,0],[5,1],[3,3]] },
    '%': { width: 24, points: [[21,21],[3,0],[-1,-1],[8,21],[10,19],[10,17],[9,15],[7,14],[5,14],[3,16],[3,18],[4,20],[6,21],[8,21],[10,20],[13,19],[16,19],[19,20],[21,21],[-1,-1],[17,7],[15,6],[14,4],[14,2],[16,0],[18,0],[20,1],[21,3],[21,5],[19,7],[17,7]] },
    '&': { width: 26, points: [[23,12],[23,13],[22,14],[21,14],[20,13],[19,11],[17,6],[15,3],[13,1],[11,0],[7,0],[5,1],[4,2],[3,4],[3,6],[4,8],[5,9],[12,13],[13,14],[14,16],[14,18],[13,20],[11,21],[9,20],[8,18],[8,16],[9,13],[11,10],[16,3],[18,1],[20,0],[22,0],[23,1],[23,2]] },
    '\'': { width: 10, points: [[5,19],[4,20],[5,21],[6,20],[6,18],[5,16],[4,15]] },
    '(': { width: 14, points: [[11,25],[9,23],[7,20],[5,16],[4,11],[4,7],[5,2],[7,-2],[9,-5],[11,-7]] },
    ')': { width: 14, points: [[3,25],[5,23],[7,20],[9,16],[10,11],[10,7],[9,2],[7,-2],[5,-5],[3,-7]] },
    '*': { width: 16, points: [[8,21],[8,9],[-1,-1],[3,18],[13,12],[-1,-1],[13,18],[3,12]] },
    '+': { width: 26, points: [[13,18],[13,0],[-1,-1],[4,9],[22,9]] },
    ',': { width: 10, points: [[6,1],[5,0],[4,1],[5,2],[6,1],[6,-1],[5,-3],[4,-4]] },
    '-': { width: 26, points: [[4,9],[22,9]] },
    '.': { width: 10, points: [[5,2],[4,1],[5,0],[6,1],[5,2]] },
    '/': { width: 22, points: [[20,25],[2,-7]] },
    '0': { width: 20, points: [[9,21],[6,20],[4,17],[3,12],[3,9],[4,4],[6,1],[9,0],[11,0],[14,1],[16,4],[17,9],[17,12],[16,17],[14,20],[11,21],[9,21]] },
    '1': { width: 20, points: [[6,17],[8,18],[11,21],[11,0]] },
    '2': { width: 20, points: [[4,16],[4,17],[5,19],[6,20],[8,21],[12,21],[14,20],[15,19],[16,17],[16,15],[15,13],[13,10],[3,0],[17,0]] },
    '3': { width: 20, points: [[5,21],[16,21],[10,13],[13,13],[15,12],[16,11],[17,8],[17,6],[16,3],[14,1],[11,0],[8,0],[5,1],[4,2],[3,4]] },
    '4': { width: 20, points: [[13,21],[3,7],[18,7],[-1,-1],[13,21],[13,0]] },
    '5': { width: 20, points: [[15,21],[5,21],[4,12],[5,13],[8,14],[11,14],[14,13],[16,11],[17,8],[17,6],[16,3],[14,1],[11,0],[8,0],[5,1],[4,2],[3,4]] },
    '6': { width: 20, points: [[16,18],[15,20],[12,21],[10,21],[7,20],[5,17],[4,12],[4,7],[5,3],[7,1],[10,0],[11,0],[14,1],[16,3],[17,6],[17,7],[16,10],[14,12],[11,13],[10,13],[7,12],[5,10],[4,7]] },
    '7': { width: 20, points: [[17,21],[7,0],[-1,-1],[3,21],[17,21]] },
    '8': { width: 20, points: [[8,21],[5,20],[4,18],[4,16],[5,14],[7,13],[11,12],[14,11],[16,9],[17,7],[17,4],[16,2],[15,1],[12,0],[8,0],[5,1],[4,2],[3,4],[3,7],[4,9],[6,11],[9,12],[13,13],[15,14],[16,16],[16,18],[15,20],[12,21],[8,21]] },
    '9': { width: 20, points: [[16,14],[15,11],[13,9],[10,8],[9,8],[6,9],[4,11],[3,14],[3,15],[4,18],[6,20],[9,21],[10,21],[13,20],[15,18],[16,14],[16,9],[15,4],[13,1],[10,0],[8,0],[5,1],[4,3]] },
    ':': { width: 10, points: [[5,14],[4,13],[5,12],[6,13],[5,14],[-1,-1],[5,2],[4,1],[5,0],[6,1],[5,2]] },
    ',': { width: 10, points: [[5,14],[4,13],[5,12],[6,13],[5,14],[-1,-1],[6,1],[5,0],[4,1],[5,2],[6,1],[6,-1],[5,-3],[4,-4]] },
    '<': { width: 24, points: [[20,18],[4,9],[20,0]] },
    '=': { width: 26, points: [[4,12],[22,12],[-1,-1],[4,6],[22,6]] },
    '>': { width: 24, points: [[4,18],[20,9],[4,0]] },
    '?': { width: 18, points: [[3,16],[3,17],[4,19],[5,20],[7,21],[11,21],[13,20],[14,19],[15,17],[15,15],[14,13],[13,12],[9,10],[9,7],[-1,-1],[9,2],[8,1],[9,0],[10,1],[9,2]] },
    '@': { width: 27, points: [[18,13],[17,15],[15,16],[12,16],[10,15],[9,14],[8,11],[8,8],[9,6],[11,5],[14,5],[16,6],[17,8],[-1,-1],[12,16],[10,14],[9,11],[9,8],[10,6],[11,5],[-1,-1],[18,16],[17,8],[17,6],[19,5],[21,5],[23,7],[24,10],[24,12],[23,15],[22,17],[20,19],[18,20],[15,21],[12,21],[9,20],[7,19],[5,17],[4,15],[3,12],[3,9],[4,6],[5,4],[7,2],[9,1],[12,0],[15,0],[18,1],[20,2],[21,3],[-1,-1],[19,16],[18,8],[18,6],[19,5]] },
    'A': { width: 18, points: [[9,21],[1,0],[-1,-1],[9,21],[17,0],[-1,-1],[4,7],[14,7]] },
    'B': { width: 21, points: [[4,21],[4,0],[-1,-1],[4,21],[13,21],[16,20],[17,19],[18,17],[18,15],[17,13],[16,12],[13,11],[-1,-1],[4,11],[13,11],[16,10],[17,9],[18,7],[18,4],[17,2],[16,1],[13,0],[4,0]] },
    'C': { width: 21, points: [[18,16],[17,18],[15,20],[13,21],[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5]] },
    'D': { width: 21, points: [[4,21],[4,0],[-1,-1],[4,21],[11,21],[14,20],[16,18],[17,16],[18,13],[18,8],[17,5],[16,3],[14,1],[11,0],[4,0]] },
    'E': { width: 19, points: [[4,21],[4,0],[-1,-1],[4,21],[17,21],[-1,-1],[4,11],[12,11],[-1,-1],[4,0],[17,0]] },
    'F': { width: 18, points: [[4,21],[4,0],[-1,-1],[4,21],[17,21],[-1,-1],[4,11],[12,11]] },
    'G': { width: 21, points: [[18,16],[17,18],[15,20],[13,21],[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5],[18,8],[-1,-1],[13,8],[18,8]] },
    'H': { width: 22, points: [[4,21],[4,0],[-1,-1],[18,21],[18,0],[-1,-1],[4,11],[18,11]] },
    'I': { width: 8, points: [[4,21],[4,0]] },
    'J': { width: 16, points: [[12,21],[12,5],[11,2],[10,1],[8,0],[6,0],[4,1],[3,2],[2,5],[2,7]] },
    'K': { width: 21, points: [[4,21],[4,0],[-1,-1],[18,21],[4,7],[-1,-1],[9,12],[18,0]] },
    'L': { width: 17, points: [[4,21],[4,0],[-1,-1],[4,0],[16,0]] },
    'M': { width: 24, points: [[4,21],[4,0],[-1,-1],[4,21],[12,0],[-1,-1],[20,21],[12,0],[-1,-1],[20,21],[20,0]] },
    'N': { width: 22, points: [[4,21],[4,0],[-1,-1],[4,21],[18,0],[-1,-1],[18,21],[18,0]] },
    'O': { width: 22, points: [[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5],[19,8],[19,13],[18,16],[17,18],[15,20],[13,21],[9,21]] },
    'P': { width: 21, points: [[4,21],[4,0],[-1,-1],[4,21],[13,21],[16,20],[17,19],[18,17],[18,14],[17,12],[16,11],[13,10],[4,10]] },
    'Q': { width: 22, points: [[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5],[19,8],[19,13],[18,16],[17,18],[15,20],[13,21],[9,21],[-1,-1],[12,4],[18,-2]] },
    'R': { width: 21, points: [[4,21],[4,0],[-1,-1],[4,21],[13,21],[16,20],[17,19],[18,17],[18,15],[17,13],[16,12],[13,11],[4,11],[-1,-1],[11,11],[18,0]] },
    'S': { width: 20, points: [[17,18],[15,20],[12,21],[8,21],[5,20],[3,18],[3,16],[4,14],[5,13],[7,12],[13,10],[15,9],[16,8],[17,6],[17,3],[15,1],[12,0],[8,0],[5,1],[3,3]] },
    'T': { width: 16, points: [[8,21],[8,0],[-1,-1],[1,21],[15,21]] },
    'U': { width: 22, points: [[4,21],[4,6],[5,3],[7,1],[10,0],[12,0],[15,1],[17,3],[18,6],[18,21]] },
    'V': { width: 18, points: [[1,21],[9,0],[-1,-1],[17,21],[9,0]] },
    'W': { width: 24, points: [[2,21],[7,0],[-1,-1],[12,21],[7,0],[-1,-1],[12,21],[17,0],[-1,-1],[22,21],[17,0]] },
    'X': { width: 20, points: [[3,21],[17,0],[-1,-1],[17,21],[3,0]] },
    'Y': { width: 18, points: [[1,21],[9,11],[9,0],[-1,-1],[17,21],[9,11]] },
    'Z': { width: 20, points: [[17,21],[3,0],[-1,-1],[3,21],[17,21],[-1,-1],[3,0],[17,0]] },
    '[': { width: 14, points: [[4,25],[4,-7],[-1,-1],[5,25],[5,-7],[-1,-1],[4,25],[11,25],[-1,-1],[4,-7],[11,-7]] },
    '\\': { width: 14, points: [[0,21],[14,-3]] },
    ']': { width: 14, points: [[9,25],[9,-7],[-1,-1],[10,25],[10,-7],[-1,-1],[3,25],[10,25],[-1,-1],[3,-7],[10,-7]] },
    '^': { width: 16, points: [[6,15],[8,18],[10,15],[-1,-1],[3,12],[8,17],[13,12],[-1,-1],[8,17],[8,0]] },
    '_': { width: 16, points: [[0,-2],[16,-2]] },
    '`': { width: 10, points: [[6,21],[5,20],[4,18],[4,16],[5,15],[6,16],[5,17]] },
    'a': { width: 19, points: [[15,14],[15,0],[-1,-1],[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'b': { width: 19, points: [[4,21],[4,0],[-1,-1],[4,11],[6,13],[8,14],[11,14],[13,13],[15,11],[16,8],[16,6],[15,3],[13,1],[11,0],[8,0],[6,1],[4,3]] },
    'c': { width: 18, points: [[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'd': { width: 19, points: [[15,21],[15,0],[-1,-1],[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'e': { width: 18, points: [[3,8],[15,8],[15,10],[14,12],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'f': { width: 12, points: [[10,21],[8,21],[6,20],[5,17],[5,0],[-1,-1],[2,14],[9,14]] },
    'g': { width: 19, points: [[15,14],[15,-2],[14,-5],[13,-6],[11,-7],[8,-7],[6,-6],[-1,-1],[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'h': { width: 19, points: [[4,21],[4,0],[-1,-1],[4,10],[7,13],[9,14],[12,14],[14,13],[15,10],[15,0]] },
    'i': { width: 8, points: [[3,21],[4,20],[5,21],[4,22],[3,21],[-1,-1],[4,14],[4,0]] },
    'j': { width: 10, points: [[5,21],[6,20],[7,21],[6,22],[5,21],[-1,-1],[6,14],[6,-3],[5,-6],[3,-7],[1,-7]] },
    'k': { width: 17, points: [[4,21],[4,0],[-1,-1],[14,14],[4,4],[-1,-1],[8,8],[15,0]] },
    'l': { width: 8, points: [[4,21],[4,0]] },
    'm': { width: 30, points: [[4,14],[4,0],[-1,-1],[4,10],[7,13],[9,14],[12,14],[14,13],[15,10],[15,0],[-1,-1],[15,10],[18,13],[20,14],[23,14],[25,13],[26,10],[26,0]] },
    'n': { width: 19, points: [[4,14],[4,0],[-1,-1],[4,10],[7,13],[9,14],[12,14],[14,13],[15,10],[15,0]] },
    'o': { width: 19, points: [[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3],[16,6],[16,8],[15,11],[13,13],[11,14],[8,14]] },
    'p': { width: 19, points: [[4,14],[4,-7],[-1,-1],[4,11],[6,13],[8,14],[11,14],[13,13],[15,11],[16,8],[16,6],[15,3],[13,1],[11,0],[8,0],[6,1],[4,3]] },
    'q': { width: 19, points: [[15,14],[15,-7],[-1,-1],[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'r': { width: 13, points: [[4,14],[4,0],[-1,-1],[4,8],[5,11],[7,13],[9,14],[12,14]] },
    's': { width: 17, points: [[14,11],[13,13],[10,14],[7,14],[4,13],[3,11],[4,9],[6,8],[11,7],[13,6],[14,4],[14,3],[13,1],[10,0],[7,0],[4,1],[3,3]] },
    't': { width: 12, points: [[5,21],[5,4],[6,1],[8,0],[10,0],[-1,-1],[2,14],[9,14]] },
    'u': { width: 19, points: [[4,14],[4,4],[5,1],[7,0],[10,0],[12,1],[15,4],[-1,-1],[15,14],[15,0]] },
    'v': { width: 16, points: [[2,14],[8,0],[-1,-1],[14,14],[8,0]] },
    'w': { width: 22, points: [[3,14],[7,0],[-1,-1],[11,14],[7,0],[-1,-1],[11,14],[15,0],[-1,-1],[19,14],[15,0]] },
    'x': { width: 17, points: [[3,14],[14,0],[-1,-1],[14,14],[3,0]] },
    'y': { width: 16, points: [[2,14],[8,0],[-1,-1],[14,14],[8,0],[6,-4],[4,-6],[2,-7],[1,-7]] },
    'z': { width: 17, points: [[14,14],[3,0],[-1,-1],[3,14],[14,14],[-1,-1],[3,0],[14,0]] },
    '{': { width: 14, points: [[9,25],[7,24],[6,23],[5,21],[5,19],[6,17],[7,16],[8,14],[8,12],[6,10],[-1,-1],[7,24],[6,22],[6,20],[7,18],[8,17],[9,15],[9,13],[8,11],[4,9],[8,7],[9,5],[9,3],[8,1],[7,0],[6,-2],[6,-4],[7,-6],[-1,-1],[6,8],[8,6],[8,4],[7,2],[6,1],[5,-1],[5,-3],[6,-5],[7,-6],[9,-7]] },
    '|': { width: 8, points: [[4,25],[4,-7]] },
    '}': { width: 14, points: [[5,25],[7,24],[8,23],[9,21],[9,19],[8,17],[7,16],[6,14],[6,12],[8,10],[-1,-1],[7,24],[8,22],[8,20],[7,18],[6,17],[5,15],[5,13],[6,11],[10,9],[6,7],[5,5],[5,3],[6,1],[7,0],[8,-2],[8,-4],[7,-6],[-1,-1],[8,8],[6,6],[6,4],[7,2],[8,1],[9,-1],[9,-3],[8,-5],[7,-6],[5,-7]] },
    '~': { width: 24, points: [[3,6],[3,8],[4,11],[6,12],[8,12],[10,11],[14,8],[16,7],[18,7],[20,8],[21,10],[-1,-1],[3,8],[4,10],[6,11],[8,11],[10,10],[14,7],[16,6],[18,6],[20,7],[21,10],[21,12]] }
};

CanvasTextFunctions.letter = function (ch)
{
    return CanvasTextFunctions.letters[ch];
}

CanvasTextFunctions.ascent = function( font, size)
{
    return size;
}

CanvasTextFunctions.descent = function( font, size)
{
    return 7.0*size/25.0;
}

CanvasTextFunctions.measure = function( font, size, str)
{
    var total = 0;
    var len = str.length;

    for ( i = 0; i < len; i++) {
	var c = CanvasTextFunctions.letter( str.charAt(i));
	if ( c) total += c.width * size / 25.0;
    }
    return total;
}

CanvasTextFunctions.italics = {};
CanvasTextFunctions.makeItalic = function(letter, c, size) {
    if( !CanvasTextFunctions.italics[letter] ) {
	var italic = [];
	for( var i=0; i < c.points.length; i++) {
	    var a = c.points[i];
	    if( a[0] != -1 && a[1] != -1) {
		italic[i] = [ a[0]+(a[1]/3), a[1] ];
	    } else {
		italic[i] = [-1,-1];
	    }
	}
	CanvasTextFunctions.italics[letter] = { width:c.width, points:italic };
    }
    return CanvasTextFunctions.italics[letter];
}

CanvasTextFunctions.draw = function(ctx,font,size,x,y,str)
{
    var total = 0;
    var len = str.length;
    var mag = size / 25.0;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = 2.0 * mag;

    for ( i = 0; i < len; i++) {
	var character = str.charAt(i);
	var c = CanvasTextFunctions.letter(character);
	if ( !c ) continue;
	if ( font.toLowerCase().indexOf("italic") > -1 ) {
	    c = CanvasTextFunctions.makeItalic( character, c, size );
	}
	ctx.beginPath();

	var penUp = 1;
	var needStroke = 0;
	for ( j = 0; j < c.points.length; j++) {
	    var a = c.points[j];
	    if ( a[0] == -1 && a[1] == -1) {
		penUp = 1;
		continue;
	    }
	    if ( penUp) {
		ctx.moveTo( x + a[0]*mag, y - a[1]*mag);
		penUp = false;
	    } else {
		ctx.lineTo( x + a[0]*mag, y - a[1]*mag);
	    }
	}
	ctx.stroke();
	x += c.width*mag;
    }
    ctx.restore();
    return total;
}

CanvasTextFunctions.enable = function( ctx)
{
    ctx.drawText = function(font,size,x,y,text) { return CanvasTextFunctions.draw( ctx, font,size,x,y,text); };
    ctx.measureText = function(font,size,text) { return CanvasTextFunctions.measure( font,size,text); };
    ctx.fontAscent = function(font,size) { return CanvasTextFunctions.ascent(font,size); }
    ctx.fontDescent = function(font,size) { return CanvasTextFunctions.descent(font,size); }

    ctx.drawTextRight = function(font,size,x,y,text) { 
	var w = CanvasTextFunctions.measure(font,size,text);
	return CanvasTextFunctions.draw( ctx, font,size,x-w,y,text); 
    };
    ctx.drawTextCenter = function(font,size,x,y,text) { 
	var w = CanvasTextFunctions.measure(font,size,text);
	return CanvasTextFunctions.draw( ctx, font,size,x-w/2,y,text); 
    };
}



// top-level ADL namespace
var ADL = {};

ADL.base = Class.extend( {
	getValue: function getValue() {
		return this.value;
	}
} );

ADL.Boolean = ADL.base.extend( {
  init: function( value ) {
    this.value = value == "true" ? true : false;
  },

  toString: function() {
    return this.value ? "true" : "false";
  }
});

ADL.Integer = ADL.base.extend( {
  init: function( value ) {
    this.value = parseInt(value);
  },

  toString: function() {
    return this.value;
  }
});

ADL.String = ADL.base.extend( {
  init: function( value ) {
    this.value = value;
  },

  toString: function() {
    return '"' + this.value + '"';
  }
});

ADL.Value = Class.extend( {
	init: function( value ) {
		this.value = value;
	},
	
	getValue: function getValue() {
		return this.value.getValue();
	},
	
	toString: function() {
		return " <= " + this.value.toString();
	}
} );

ADL.Annotation = ADL.base.extend( {
  init: function( value ) {
    this.value = value;
  },

  toString: function() {
    return "[@" + this.value + "]";
  }
});

ADL.Multiplicity = Class.extend( {
  init: function( low, high ) {
    this.low = low;
    this.high = high;
  },

	getLow: function getLow() {
		return this.low;
	},
	
	getHigh: function getHigh() {
		return this.high;
	},

  toString: function() {
    return "[" + this.low + ( this.high ? ".." + this.high : "" ) + "]";
  }
});

ADL.Reference = Class.extend( {
  init: function( constructName, multiplicity ) {
    this.constructName = constructName;
    this.multiplicity = multiplicity;
  },

	getConstructName: function getConstructName() {
		return this.constructName;
	},
	
	getMultiplicity: function getMultiplicity() {
		return this.multiplicity;
	},

  toString: function() {
    return this.constructName + 
    ( this.multiplicity ? this.multiplicity.toString() : "" );
  }
});

ADL.Modifier = ADL.base.extend( {
  init: function( name, value ) {
    this.name = name;
    this.value = value;
  },

	getName: function getName() {
		return this.name;
	},

  toString: function() {
    return "+" + this.name + 
    ( this.value ? "=" + this.value.toString() : "" );
  }
});

ADL.Construct = Class.extend( {
  init: function(type, name, value, annotations, supers, modifiers, children){
    this.type        = type;
    this.name        = name;
    this.value       = value       || null;
    this.annotations = annotations || new Array();
    this.supers      = supers      || new Array();
    this.children    = children    || new Array();
    this.modifiers   = new Hash();
		if( modifiers ) {
			modifiers.iterate( function(modifier) {
				this.addModifier(modifier);
			}.scope(this) );
		}
  },

	getType: function getType() {
		return this.type;
	},
	
	getName: function getName() {
		return this.name;
	},
	
	setName: function setName(name) {
		this.name = name
	},
	
	getValue: function getValue() {
		return this.value;
	},
	
	setValue: function setValue(value) {
		if( ! ( value instanceof ADL.Value ) ) { value = new ADL.Value(value); }
		this.value = value;
	},
	
	getAnnotations: function getAnnotations() {
		return this.annotations;
	},
	
	addAnnotation: function addAnnotation(annotation) {
		if( ! ( annotation instanceof ADL.Annotation ) ) {
			annotation = new ADL.Annotation(annotation);
		}
		this.annotations.push(annotation);
		return this;
	},
	
	getSupers: function getSupers() {
		return this.supers;
	},
	
	addSuper: function addSuper(zuper) {
		this.supers.push(zuper);
		return this;
	},
	
	getModifiers: function getModifiers() {
		return this.modifiers.values();
	},
	
	getModifier: function getModifier(name) {
		return this.modifiers.get(name);
	},
	
	addModifier: function addModifier(modifier, value) {
		if( ! ( modifier instanceof ADL.Modifier ) ) {
			modifier = new ADL.Modifier(modifier, value);
		}
		this.modifiers.set(modifier.getName(), modifier);
	},

	getChildren: function getChildren() {
		return this.children;
	},
	
	addChild: function addChild(child) {
		this.children.push(child);
		return this;
	},

  toString: function(ident) {
    ident = ident || "";

    var annotations = new Array();
    this.annotations.iterate(function(value) { 
      annotations.push( value.toString() ); 
    });

    var modifiers = new Array();
    this.modifiers.iterate(function(key, value) { 
      modifiers.push( value.toString() ); 
    });

    var children = new Array();
    this.children.iterate( function(item) { 
      children.push( item.toString("  " + ident) ); 
    });

		return ( annotations.length > 0 ? 
			ident + annotations.join("\n" + ident) + "\n" : "" ) 
			+ ident + this.type 
			+ " " + this.name
			+ ( this.supers.length > 0 ? " : " + this.supers.join(" : ") : "" )
			+ ( modifiers.length  > 0 ? " "   + modifiers.join(" ") : "" )
			+ ( this.value ? this.value.toString() : "" )
			+ ( children.length > 0 ? 
				" {" + "\n" + children.join( "\n") + "\n" + ident + "}" : ";" );
  },

  accept: function( visitor, data ) {
    return visitor.visit(this, data);
  },

  childrenAccept: function( visitor, data ) {
    this.children.iterate(function(child) { visitor.visit(child, data); } );
    return data;
  }
} );

ADL.include = function( file ) {
  var adl = new ProtoJS.Ajax().fetch( file.value + ".adl" );
  return new ADL.Parser().parse(adl).getRoot().getChildren();
}

ADL.AST = Class.extend( {
  init: function(children) {
	  this.root = 
			new ADL.Construct( "", "root", null, null, null, null, children );
  },

  getRoot: function() {
    return this.root;
  }
});

ADL.ast = null;

ADL.Parser = Class.extend( {
  parse: function( src ) {
    var error_cnt = 0;
    var error_off = new Array();
    var error_la  = new Array();

    ADL.ast = null;

    try {
      if( ( error_cnt = __parse( src, error_off, error_la ) ) > 0 ) {
        var i;
        var errors = "";
        for( i = 0; i < error_cnt; i++ ) {
          errors += "Parse error: " + src.substr( error_off[i], 30 ) + 
          ". Expecting \"" + error_la[i].join() + "\n";
        }
        this.errors = errors;
        return null;
      }
    } catch(e) {
      this.errors = "Semantic error: " + e;
      return null;
    }
    this.errors = "";
    return ADL.ast;
  }
});

function makeList() {
  var ar = new Array();
  if( arguments ) {
    for( var v=0; v<arguments.length; v++ ) {
      if( !Object.isUndefined(arguments[v]) && arguments[v].isArray() ) {
        for( var vv=0; vv<arguments[v].length; vv++ ) {
          if( arguments[v][vv] ) { 
            ar.push(arguments[v][vv]); 
          }
        }
      } else {
        if( arguments[v] ) { ar.push(arguments[v]); }
      }
    }
  }

  return ar;
}


/*
	Default template driver for JS/CC generated parsers running as
	browser-based JavaScript/ECMAScript applications.
	
	WARNING: 	This parser template will not run as console and has lesser
				features for debugging than the console derivates for the
				various JavaScript platforms.
	
	Features:
	- Parser trace messages
	- Integrated panic-mode error recovery
	
	Written 2007, 2008 by Jan Max Meyer, J.M.K S.F. Software Technologies
	
	This is in the public domain.
*/

var _dbg_withtrace		= false;
var _dbg_string			= new String();

function __dbg_print( text )
{
	_dbg_string += text + "\n";
}

function __lex( info )
{
	var state		= 0;
	var match		= -1;
	var match_pos	= 0;
	var start		= 0;
	var pos			= info.offset + 1;

	do
	{
		pos--;
		state = 0;
		match = -2;
		start = pos;

		if( info.src.length <= start )
			return 49;

		do
		{

switch( state )
{
	case 0:
		if( ( info.src.charCodeAt( pos ) >= 9 && info.src.charCodeAt( pos ) <= 10 ) || info.src.charCodeAt( pos ) == 13 || info.src.charCodeAt( pos ) == 32 ) state = 1;
		else if( info.src.charCodeAt( pos ) == 40 ) state = 2;
		else if( info.src.charCodeAt( pos ) == 41 ) state = 3;
		else if( info.src.charCodeAt( pos ) == 42 ) state = 4;
		else if( info.src.charCodeAt( pos ) == 43 ) state = 5;
		else if( info.src.charCodeAt( pos ) == 44 ) state = 6;
		else if( info.src.charCodeAt( pos ) == 45 ) state = 7;
		else if( info.src.charCodeAt( pos ) == 46 ) state = 8;
		else if( info.src.charCodeAt( pos ) == 47 ) state = 9;
		else if( info.src.charCodeAt( pos ) == 48 ) state = 10;
		else if( info.src.charCodeAt( pos ) == 58 ) state = 11;
		else if( info.src.charCodeAt( pos ) == 59 ) state = 12;
		else if( info.src.charCodeAt( pos ) == 60 ) state = 13;
		else if( info.src.charCodeAt( pos ) == 61 ) state = 14;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 15;
		else if( ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 101 ) || ( info.src.charCodeAt( pos ) >= 103 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 16;
		else if( info.src.charCodeAt( pos ) == 91 ) state = 17;
		else if( info.src.charCodeAt( pos ) == 93 ) state = 18;
		else if( info.src.charCodeAt( pos ) == 123 ) state = 19;
		else if( info.src.charCodeAt( pos ) == 124 ) state = 20;
		else if( info.src.charCodeAt( pos ) == 125 ) state = 21;
		else if( info.src.charCodeAt( pos ) == 33 ) state = 30;
		else if( ( info.src.charCodeAt( pos ) >= 49 && info.src.charCodeAt( pos ) <= 57 ) ) state = 31;
		else if( info.src.charCodeAt( pos ) == 34 ) state = 33;
		else if( info.src.charCodeAt( pos ) == 35 ) state = 34;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 47;
		else if( info.src.charCodeAt( pos ) == 102 ) state = 49;
		else state = -1;
		break;

	case 1:
		state = -1;
		match = 1;
		match_pos = pos;
		break;

	case 2:
		state = -1;
		match = 6;
		match_pos = pos;
		break;

	case 3:
		state = -1;
		match = 7;
		match_pos = pos;
		break;

	case 4:
		state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 5:
		if( info.src.charCodeAt( pos ) == 48 ) state = 10;
		else if( ( info.src.charCodeAt( pos ) >= 49 && info.src.charCodeAt( pos ) <= 57 ) ) state = 31;
		else state = -1;
		match = 17;
		match_pos = pos;
		break;

	case 6:
		state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 7:
		if( info.src.charCodeAt( pos ) == 48 ) state = 10;
		else if( ( info.src.charCodeAt( pos ) >= 49 && info.src.charCodeAt( pos ) <= 57 ) ) state = 31;
		else state = -1;
		match = 18;
		match_pos = pos;
		break;

	case 8:
		if( info.src.charCodeAt( pos ) == 46 ) state = 24;
		else state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 9:
		if( info.src.charCodeAt( pos ) == 42 ) state = 36;
		else if( info.src.charCodeAt( pos ) == 47 ) state = 37;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 10:
		state = -1;
		match = 3;
		match_pos = pos;
		break;

	case 11:
		if( info.src.charCodeAt( pos ) == 58 ) state = 25;
		else state = -1;
		match = 13;
		match_pos = pos;
		break;

	case 12:
		state = -1;
		match = 12;
		match_pos = pos;
		break;

	case 13:
		if( info.src.charCodeAt( pos ) == 61 ) state = 26;
		else state = -1;
		match = 26;
		match_pos = pos;
		break;

	case 14:
		state = -1;
		match = 19;
		match_pos = pos;
		break;

	case 15:
		state = -1;
		match = 27;
		match_pos = pos;
		break;

	case 16:
		if( ( info.src.charCodeAt( pos ) >= 45 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 16;
		else state = -1;
		match = 29;
		match_pos = pos;
		break;

	case 17:
		if( info.src.charCodeAt( pos ) == 64 ) state = 38;
		else state = -1;
		match = 10;
		match_pos = pos;
		break;

	case 18:
		state = -1;
		match = 11;
		match_pos = pos;
		break;

	case 19:
		state = -1;
		match = 8;
		match_pos = pos;
		break;

	case 20:
		state = -1;
		match = 24;
		match_pos = pos;
		break;

	case 21:
		state = -1;
		match = 9;
		match_pos = pos;
		break;

	case 22:
		state = -1;
		match = 20;
		match_pos = pos;
		break;

	case 23:
		state = -1;
		match = 4;
		match_pos = pos;
		break;

	case 24:
		state = -1;
		match = 25;
		match_pos = pos;
		break;

	case 25:
		state = -1;
		match = 14;
		match_pos = pos;
		break;

	case 26:
		state = -1;
		match = 21;
		match_pos = pos;
		break;

	case 27:
		state = -1;
		match = 5;
		match_pos = pos;
		break;

	case 28:
		if( ( info.src.charCodeAt( pos ) >= 45 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 16;
		else state = -1;
		match = 2;
		match_pos = pos;
		break;

	case 29:
		state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 30:
		if( info.src.charCodeAt( pos ) == 61 ) state = 22;
		else state = -1;
		break;

	case 31:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 31;
		else state = -1;
		match = 3;
		match_pos = pos;
		break;

	case 32:
		if( ( info.src.charCodeAt( pos ) >= 45 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 16;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 28;
		else state = -1;
		match = 29;
		match_pos = pos;
		break;

	case 33:
		if( info.src.charCodeAt( pos ) == 34 ) state = 23;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 33 ) || ( info.src.charCodeAt( pos ) >= 35 && info.src.charCodeAt( pos ) <= 254 ) ) state = 33;
		else state = -1;
		break;

	case 34:
		if( info.src.charCodeAt( pos ) == 105 ) state = 35;
		else state = -1;
		break;

	case 35:
		if( info.src.charCodeAt( pos ) == 110 ) state = 39;
		else state = -1;
		break;

	case 36:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 41 ) || ( info.src.charCodeAt( pos ) >= 43 && info.src.charCodeAt( pos ) <= 254 ) ) state = 36;
		else if( info.src.charCodeAt( pos ) == 42 ) state = 40;
		else state = -1;
		break;

	case 37:
		if( info.src.charCodeAt( pos ) == 10 ) state = 1;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 9 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 254 ) ) state = 37;
		else state = -1;
		break;

	case 38:
		if( info.src.charCodeAt( pos ) == 93 ) state = 27;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 92 ) || ( info.src.charCodeAt( pos ) >= 94 && info.src.charCodeAt( pos ) <= 254 ) ) state = 38;
		else state = -1;
		break;

	case 39:
		if( info.src.charCodeAt( pos ) == 99 ) state = 41;
		else state = -1;
		break;

	case 40:
		if( info.src.charCodeAt( pos ) == 47 ) state = 1;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 41 ) || ( info.src.charCodeAt( pos ) >= 43 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 254 ) ) state = 36;
		else if( info.src.charCodeAt( pos ) == 42 ) state = 40;
		else state = -1;
		break;

	case 41:
		if( info.src.charCodeAt( pos ) == 108 ) state = 42;
		else state = -1;
		break;

	case 42:
		if( info.src.charCodeAt( pos ) == 117 ) state = 43;
		else state = -1;
		break;

	case 43:
		if( info.src.charCodeAt( pos ) == 100 ) state = 44;
		else state = -1;
		break;

	case 44:
		if( info.src.charCodeAt( pos ) == 101 ) state = 29;
		else state = -1;
		break;

	case 45:
		if( ( info.src.charCodeAt( pos ) >= 45 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 116 ) || ( info.src.charCodeAt( pos ) >= 118 && info.src.charCodeAt( pos ) <= 122 ) ) state = 16;
		else if( info.src.charCodeAt( pos ) == 117 ) state = 32;
		else state = -1;
		match = 29;
		match_pos = pos;
		break;

	case 46:
		if( ( info.src.charCodeAt( pos ) >= 45 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 114 ) || ( info.src.charCodeAt( pos ) >= 116 && info.src.charCodeAt( pos ) <= 122 ) ) state = 16;
		else if( info.src.charCodeAt( pos ) == 115 ) state = 32;
		else state = -1;
		match = 29;
		match_pos = pos;
		break;

	case 47:
		if( ( info.src.charCodeAt( pos ) >= 45 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 113 ) || ( info.src.charCodeAt( pos ) >= 115 && info.src.charCodeAt( pos ) <= 122 ) ) state = 16;
		else if( info.src.charCodeAt( pos ) == 114 ) state = 45;
		else state = -1;
		match = 29;
		match_pos = pos;
		break;

	case 48:
		if( ( info.src.charCodeAt( pos ) >= 45 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 16;
		else if( info.src.charCodeAt( pos ) == 108 ) state = 46;
		else state = -1;
		match = 29;
		match_pos = pos;
		break;

	case 49:
		if( ( info.src.charCodeAt( pos ) >= 45 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 98 && info.src.charCodeAt( pos ) <= 122 ) ) state = 16;
		else if( info.src.charCodeAt( pos ) == 97 ) state = 48;
		else state = -1;
		match = 29;
		match_pos = pos;
		break;

}


			pos++;

		}
		while( state > -1 );

	}
	while( 1 > -1 && match == 1 );

	if( match > -1 )
	{
		info.att = info.src.substr( start, match_pos - start );
		info.offset = match_pos;
		
switch( match )
{
	case 2:
		{
		 info.att = new ADL.Boolean( info.att ); 
		}
		break;

	case 3:
		{
		 info.att = new ADL.Integer( info.att ); 
		}
		break;

	case 4:
		{
		 info.att = new ADL.String( info.att.substr( 1, info.att.length - 2 ) ); 
		}
		break;

	case 5:
		{
		 info.att = new ADL.Annotation(info.att.substr(2, info.att.length - 3)); 
		}
		break;

}


	}
	else
	{
		info.att = new String();
		match = -1;
	}

	return match;
}


function __parse( src, err_off, err_la )
{
	var		sstack			= new Array();
	var		vstack			= new Array();
	var 	err_cnt			= 0;
	var		act;
	var		go;
	var		la;
	var		rval;
	var 	parseinfo		= new Function( "", "var offset; var src; var att;" );
	var		info			= new parseinfo();
	
/* Pop-Table */
var pop_tab = new Array(
	new Array( 0/* Program' */, 1 ),
	new Array( 31/* Program */, 1 ),
	new Array( 30/* Statements */, 2 ),
	new Array( 30/* Statements */, 0 ),
	new Array( 32/* Statement */, 1 ),
	new Array( 32/* Statement */, 1 ),
	new Array( 33/* Construct */, 8 ),
	new Array( 34/* Directive */, 2 ),
	new Array( 35/* Annotations */, 2 ),
	new Array( 35/* Annotations */, 0 ),
	new Array( 43/* Generic */, 3 ),
	new Array( 44/* GenericArgument */, 1 ),
	new Array( 42/* GenericArguments */, 3 ),
	new Array( 42/* GenericArguments */, 1 ),
	new Array( 42/* GenericArguments */, 0 ),
	new Array( 38/* Name */, 1 ),
	new Array( 38/* Name */, 2 ),
	new Array( 37/* Type */, 1 ),
	new Array( 37/* Type */, 2 ),
	new Array( 39/* Supers */, 2 ),
	new Array( 39/* Supers */, 0 ),
	new Array( 45/* Super */, 3 ),
	new Array( 46/* Multiplicity */, 3 ),
	new Array( 46/* Multiplicity */, 5 ),
	new Array( 46/* Multiplicity */, 0 ),
	new Array( 36/* Modifiers */, 2 ),
	new Array( 36/* Modifiers */, 0 ),
	new Array( 47/* Modifier */, 2 ),
	new Array( 47/* Modifier */, 4 ),
	new Array( 40/* Value */, 2 ),
	new Array( 40/* Value */, 0 ),
	new Array( 48/* Constant */, 1 ),
	new Array( 48/* Constant */, 1 ),
	new Array( 48/* Constant */, 1 ),
	new Array( 41/* Children */, 3 ),
	new Array( 41/* Children */, 1 )
);

/* Action-Table */
var act_tab = new Array(
	/* State 0 */ new Array( 49/* "$" */,-3 , 28/* "IncludeDirective" */,-3 , 29/* "Identifier" */,-3 , 5/* "Annotation" */,-3 , 17/* "+" */,-3 ),
	/* State 1 */ new Array( 49/* "$" */,0 ),
	/* State 2 */ new Array( 28/* "IncludeDirective" */,7 , 49/* "$" */,-1 , 17/* "+" */,-9 , 29/* "Identifier" */,-9 , 5/* "Annotation" */,-9 ),
	/* State 3 */ new Array( 49/* "$" */,-2 , 28/* "IncludeDirective" */,-2 , 29/* "Identifier" */,-2 , 5/* "Annotation" */,-2 , 17/* "+" */,-2 , 9/* "}" */,-2 ),
	/* State 4 */ new Array( 49/* "$" */,-4 , 28/* "IncludeDirective" */,-4 , 29/* "Identifier" */,-4 , 5/* "Annotation" */,-4 , 17/* "+" */,-4 , 9/* "}" */,-4 ),
	/* State 5 */ new Array( 49/* "$" */,-5 , 28/* "IncludeDirective" */,-5 , 29/* "Identifier" */,-5 , 5/* "Annotation" */,-5 , 17/* "+" */,-5 , 9/* "}" */,-5 ),
	/* State 6 */ new Array( 5/* "Annotation" */,8 , 29/* "Identifier" */,-26 , 17/* "+" */,-26 ),
	/* State 7 */ new Array( 4/* "String" */,10 ),
	/* State 8 */ new Array( 17/* "+" */,-8 , 29/* "Identifier" */,-8 , 5/* "Annotation" */,-8 ),
	/* State 9 */ new Array( 29/* "Identifier" */,13 , 17/* "+" */,14 ),
	/* State 10 */ new Array( 49/* "$" */,-7 , 28/* "IncludeDirective" */,-7 , 29/* "Identifier" */,-7 , 5/* "Annotation" */,-7 , 17/* "+" */,-7 , 9/* "}" */,-7 ),
	/* State 11 */ new Array( 29/* "Identifier" */,-25 , 17/* "+" */,-25 , 21/* "<=" */,-25 , 8/* "{" */,-25 , 12/* ";" */,-25 ),
	/* State 12 */ new Array( 29/* "Identifier" */,16 ),
	/* State 13 */ new Array( 26/* "<" */,18 , 29/* "Identifier" */,-17 , 10/* "[" */,-17 , 17/* "+" */,-17 , 21/* "<=" */,-17 , 8/* "{" */,-17 , 12/* ";" */,-17 , 13/* ":" */,-17 ),
	/* State 14 */ new Array( 29/* "Identifier" */,19 ),
	/* State 15 */ new Array( 17/* "+" */,-20 , 21/* "<=" */,-20 , 8/* "{" */,-20 , 12/* ";" */,-20 , 13/* ":" */,-20 ),
	/* State 16 */ new Array( 26/* "<" */,18 , 13/* ":" */,-15 , 17/* "+" */,-15 , 21/* "<=" */,-15 , 8/* "{" */,-15 , 12/* ";" */,-15 ),
	/* State 17 */ new Array( 29/* "Identifier" */,-18 , 10/* "[" */,-18 , 17/* "+" */,-18 , 21/* "<=" */,-18 , 8/* "{" */,-18 , 12/* ";" */,-18 , 13/* ":" */,-18 ),
	/* State 18 */ new Array( 29/* "Identifier" */,24 , 27/* ">" */,-14 , 16/* "," */,-14 ),
	/* State 19 */ new Array( 19/* "=" */,25 , 29/* "Identifier" */,-27 , 17/* "+" */,-27 , 21/* "<=" */,-27 , 8/* "{" */,-27 , 12/* ";" */,-27 ),
	/* State 20 */ new Array( 13/* ":" */,28 , 21/* "<=" */,-26 , 8/* "{" */,-26 , 12/* ";" */,-26 , 17/* "+" */,-26 ),
	/* State 21 */ new Array( 13/* ":" */,-16 , 17/* "+" */,-16 , 21/* "<=" */,-16 , 8/* "{" */,-16 , 12/* ";" */,-16 ),
	/* State 22 */ new Array( 16/* "," */,29 , 27/* ">" */,30 ),
	/* State 23 */ new Array( 27/* ">" */,-13 , 16/* "," */,-13 ),
	/* State 24 */ new Array( 27/* ">" */,-11 , 16/* "," */,-11 ),
	/* State 25 */ new Array( 4/* "String" */,32 , 3/* "Integer" */,33 , 2/* "Boolean" */,34 ),
	/* State 26 */ new Array( 17/* "+" */,-19 , 21/* "<=" */,-19 , 8/* "{" */,-19 , 12/* ";" */,-19 , 13/* ":" */,-19 ),
	/* State 27 */ new Array( 21/* "<=" */,36 , 17/* "+" */,14 , 8/* "{" */,-30 , 12/* ";" */,-30 ),
	/* State 28 */ new Array( 29/* "Identifier" */,13 ),
	/* State 29 */ new Array( 29/* "Identifier" */,24 ),
	/* State 30 */ new Array( 29/* "Identifier" */,-10 , 13/* ":" */,-10 , 17/* "+" */,-10 , 21/* "<=" */,-10 , 8/* "{" */,-10 , 12/* ";" */,-10 , 10/* "[" */,-10 ),
	/* State 31 */ new Array( 29/* "Identifier" */,-28 , 17/* "+" */,-28 , 21/* "<=" */,-28 , 8/* "{" */,-28 , 12/* ";" */,-28 ),
	/* State 32 */ new Array( 29/* "Identifier" */,-31 , 17/* "+" */,-31 , 21/* "<=" */,-31 , 8/* "{" */,-31 , 12/* ";" */,-31 ),
	/* State 33 */ new Array( 29/* "Identifier" */,-32 , 17/* "+" */,-32 , 21/* "<=" */,-32 , 8/* "{" */,-32 , 12/* ";" */,-32 ),
	/* State 34 */ new Array( 29/* "Identifier" */,-33 , 17/* "+" */,-33 , 21/* "<=" */,-33 , 8/* "{" */,-33 , 12/* ";" */,-33 ),
	/* State 35 */ new Array( 8/* "{" */,40 , 12/* ";" */,41 ),
	/* State 36 */ new Array( 4/* "String" */,32 , 3/* "Integer" */,33 , 2/* "Boolean" */,34 ),
	/* State 37 */ new Array( 10/* "[" */,44 , 17/* "+" */,-24 , 21/* "<=" */,-24 , 8/* "{" */,-24 , 12/* ";" */,-24 , 13/* ":" */,-24 ),
	/* State 38 */ new Array( 27/* ">" */,-12 , 16/* "," */,-12 ),
	/* State 39 */ new Array( 49/* "$" */,-6 , 28/* "IncludeDirective" */,-6 , 29/* "Identifier" */,-6 , 5/* "Annotation" */,-6 , 17/* "+" */,-6 , 9/* "}" */,-6 ),
	/* State 40 */ new Array( 9/* "}" */,-3 , 28/* "IncludeDirective" */,-3 , 29/* "Identifier" */,-3 , 5/* "Annotation" */,-3 , 17/* "+" */,-3 ),
	/* State 41 */ new Array( 49/* "$" */,-35 , 28/* "IncludeDirective" */,-35 , 29/* "Identifier" */,-35 , 5/* "Annotation" */,-35 , 17/* "+" */,-35 , 9/* "}" */,-35 ),
	/* State 42 */ new Array( 8/* "{" */,-29 , 12/* ";" */,-29 ),
	/* State 43 */ new Array( 17/* "+" */,-21 , 21/* "<=" */,-21 , 8/* "{" */,-21 , 12/* ";" */,-21 , 13/* ":" */,-21 ),
	/* State 44 */ new Array( 3/* "Integer" */,46 ),
	/* State 45 */ new Array( 9/* "}" */,47 , 28/* "IncludeDirective" */,7 , 17/* "+" */,-9 , 29/* "Identifier" */,-9 , 5/* "Annotation" */,-9 ),
	/* State 46 */ new Array( 11/* "]" */,48 , 25/* ".." */,49 ),
	/* State 47 */ new Array( 49/* "$" */,-34 , 28/* "IncludeDirective" */,-34 , 29/* "Identifier" */,-34 , 5/* "Annotation" */,-34 , 17/* "+" */,-34 , 9/* "}" */,-34 ),
	/* State 48 */ new Array( 17/* "+" */,-22 , 21/* "<=" */,-22 , 8/* "{" */,-22 , 12/* ";" */,-22 , 13/* ":" */,-22 ),
	/* State 49 */ new Array( 3/* "Integer" */,50 ),
	/* State 50 */ new Array( 11/* "]" */,51 ),
	/* State 51 */ new Array( 17/* "+" */,-23 , 21/* "<=" */,-23 , 8/* "{" */,-23 , 12/* ";" */,-23 , 13/* ":" */,-23 )
);

/* Goto-Table */
var goto_tab = new Array(
	/* State 0 */ new Array( 31/* Program */,1 , 30/* Statements */,2 ),
	/* State 1 */ new Array(  ),
	/* State 2 */ new Array( 32/* Statement */,3 , 33/* Construct */,4 , 34/* Directive */,5 , 35/* Annotations */,6 ),
	/* State 3 */ new Array(  ),
	/* State 4 */ new Array(  ),
	/* State 5 */ new Array(  ),
	/* State 6 */ new Array( 36/* Modifiers */,9 ),
	/* State 7 */ new Array(  ),
	/* State 8 */ new Array(  ),
	/* State 9 */ new Array( 47/* Modifier */,11 , 37/* Type */,12 ),
	/* State 10 */ new Array(  ),
	/* State 11 */ new Array(  ),
	/* State 12 */ new Array( 38/* Name */,15 ),
	/* State 13 */ new Array( 43/* Generic */,17 ),
	/* State 14 */ new Array(  ),
	/* State 15 */ new Array( 39/* Supers */,20 ),
	/* State 16 */ new Array( 43/* Generic */,21 ),
	/* State 17 */ new Array(  ),
	/* State 18 */ new Array( 42/* GenericArguments */,22 , 44/* GenericArgument */,23 ),
	/* State 19 */ new Array(  ),
	/* State 20 */ new Array( 45/* Super */,26 , 36/* Modifiers */,27 ),
	/* State 21 */ new Array(  ),
	/* State 22 */ new Array(  ),
	/* State 23 */ new Array(  ),
	/* State 24 */ new Array(  ),
	/* State 25 */ new Array( 48/* Constant */,31 ),
	/* State 26 */ new Array(  ),
	/* State 27 */ new Array( 47/* Modifier */,11 , 40/* Value */,35 ),
	/* State 28 */ new Array( 37/* Type */,37 ),
	/* State 29 */ new Array( 44/* GenericArgument */,38 ),
	/* State 30 */ new Array(  ),
	/* State 31 */ new Array(  ),
	/* State 32 */ new Array(  ),
	/* State 33 */ new Array(  ),
	/* State 34 */ new Array(  ),
	/* State 35 */ new Array( 41/* Children */,39 ),
	/* State 36 */ new Array( 48/* Constant */,42 ),
	/* State 37 */ new Array( 46/* Multiplicity */,43 ),
	/* State 38 */ new Array(  ),
	/* State 39 */ new Array(  ),
	/* State 40 */ new Array( 30/* Statements */,45 ),
	/* State 41 */ new Array(  ),
	/* State 42 */ new Array(  ),
	/* State 43 */ new Array(  ),
	/* State 44 */ new Array(  ),
	/* State 45 */ new Array( 32/* Statement */,3 , 33/* Construct */,4 , 34/* Directive */,5 , 35/* Annotations */,6 ),
	/* State 46 */ new Array(  ),
	/* State 47 */ new Array(  ),
	/* State 48 */ new Array(  ),
	/* State 49 */ new Array(  ),
	/* State 50 */ new Array(  ),
	/* State 51 */ new Array(  )
);



/* Symbol labels */
var labels = new Array(
	"Program'" /* Non-terminal symbol */,
	"WHITESPACE" /* Terminal symbol */,
	"Boolean" /* Terminal symbol */,
	"Integer" /* Terminal symbol */,
	"String" /* Terminal symbol */,
	"Annotation" /* Terminal symbol */,
	"(" /* Terminal symbol */,
	")" /* Terminal symbol */,
	"{" /* Terminal symbol */,
	"}" /* Terminal symbol */,
	"[" /* Terminal symbol */,
	"]" /* Terminal symbol */,
	";" /* Terminal symbol */,
	":" /* Terminal symbol */,
	"::" /* Terminal symbol */,
	"." /* Terminal symbol */,
	"," /* Terminal symbol */,
	"+" /* Terminal symbol */,
	"-" /* Terminal symbol */,
	"=" /* Terminal symbol */,
	"!=" /* Terminal symbol */,
	"<=" /* Terminal symbol */,
	"*" /* Terminal symbol */,
	"/" /* Terminal symbol */,
	"|" /* Terminal symbol */,
	".." /* Terminal symbol */,
	"<" /* Terminal symbol */,
	">" /* Terminal symbol */,
	"IncludeDirective" /* Terminal symbol */,
	"Identifier" /* Terminal symbol */,
	"Statements" /* Non-terminal symbol */,
	"Program" /* Non-terminal symbol */,
	"Statement" /* Non-terminal symbol */,
	"Construct" /* Non-terminal symbol */,
	"Directive" /* Non-terminal symbol */,
	"Annotations" /* Non-terminal symbol */,
	"Modifiers" /* Non-terminal symbol */,
	"Type" /* Non-terminal symbol */,
	"Name" /* Non-terminal symbol */,
	"Supers" /* Non-terminal symbol */,
	"Value" /* Non-terminal symbol */,
	"Children" /* Non-terminal symbol */,
	"GenericArguments" /* Non-terminal symbol */,
	"Generic" /* Non-terminal symbol */,
	"GenericArgument" /* Non-terminal symbol */,
	"Super" /* Non-terminal symbol */,
	"Multiplicity" /* Non-terminal symbol */,
	"Modifier" /* Non-terminal symbol */,
	"Constant" /* Non-terminal symbol */,
	"$" /* Terminal symbol */
);


	
	info.offset = 0;
	info.src = src;
	info.att = new String();
	
	if( !err_off )
		err_off	= new Array();
	if( !err_la )
	err_la = new Array();
	
	sstack.push( 0 );
	vstack.push( 0 );
	
	la = __lex( info );

	while( true )
	{
		act = 53;
		for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
		{
			if( act_tab[sstack[sstack.length-1]][i] == la )
			{
				act = act_tab[sstack[sstack.length-1]][i+1];
				break;
			}
		}

		if( _dbg_withtrace && sstack.length > 0 )
		{
			__dbg_print( "\nState " + sstack[sstack.length-1] + "\n" +
							"\tLookahead: " + labels[la] + " (\"" + info.att + "\")\n" +
							"\tAction: " + act + "\n" + 
							"\tSource: \"" + info.src.substr( info.offset, 30 ) + ( ( info.offset + 30 < info.src.length ) ?
									"..." : "" ) + "\"\n" +
							"\tStack: " + sstack.join() + "\n" +
							"\tValue stack: " + vstack.join() + "\n" );
		}
		
			
		//Panic-mode: Try recovery when parse-error occurs!
		if( act == 53 )
		{
			if( _dbg_withtrace )
				__dbg_print( "Error detected: There is no reduce or shift on the symbol " + labels[la] );
			
			err_cnt++;
			err_off.push( info.offset - info.att.length );			
			err_la.push( new Array() );
			for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
				err_la[err_la.length-1].push( labels[act_tab[sstack[sstack.length-1]][i]] );
			
			//Remember the original stack!
			var rsstack = new Array();
			var rvstack = new Array();
			for( var i = 0; i < sstack.length; i++ )
			{
				rsstack[i] = sstack[i];
				rvstack[i] = vstack[i];
			}
			
			while( act == 53 && la != 49 )
			{
				if( _dbg_withtrace )
					__dbg_print( "\tError recovery\n" +
									"Current lookahead: " + labels[la] + " (" + info.att + ")\n" +
									"Action: " + act + "\n\n" );
				if( la == -1 )
					info.offset++;
					
				while( act == 53 && sstack.length > 0 )
				{
					sstack.pop();
					vstack.pop();
					
					if( sstack.length == 0 )
						break;
						
					act = 53;
					for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
					{
						if( act_tab[sstack[sstack.length-1]][i] == la )
						{
							act = act_tab[sstack[sstack.length-1]][i+1];
							break;
						}
					}
				}
				
				if( act != 53 )
					break;
				
				for( var i = 0; i < rsstack.length; i++ )
				{
					sstack.push( rsstack[i] );
					vstack.push( rvstack[i] );
				}
				
				la = __lex( info );
			}
			
			if( act == 53 )
			{
				if( _dbg_withtrace )
					__dbg_print( "\tError recovery failed, terminating parse process..." );
				break;
			}


			if( _dbg_withtrace )
				__dbg_print( "\tError recovery succeeded, continuing" );
		}
		
		/*
		if( act == 53 )
			break;
		*/
		
		
		//Shift
		if( act > 0 )
		{			
			if( _dbg_withtrace )
				__dbg_print( "Shifting symbol: " + labels[la] + " (" + info.att + ")" );
		
			sstack.push( act );
			vstack.push( info.att );
			
			la = __lex( info );
			
			if( _dbg_withtrace )
				__dbg_print( "\tNew lookahead symbol: " + labels[la] + " (" + info.att + ")" );
		}
		//Reduce
		else
		{		
			act *= -1;
			
			if( _dbg_withtrace )
				__dbg_print( "Reducing by producution: " + act );
			
			rval = void(0);
			
			if( _dbg_withtrace )
				__dbg_print( "\tPerforming semantic action..." );
			
switch( act )
{
	case 0:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 1:
	{
		 ADL.ast = new ADL.AST(vstack[ vstack.length - 1 ]); 
	}
	break;
	case 2:
	{
		 rval = makeList( vstack[ vstack.length - 2 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 3:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 4:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 5:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 6:
	{
		 rval = new ADL.Construct( vstack[ vstack.length - 6 ], vstack[ vstack.length - 5 ], vstack[ vstack.length - 2 ], vstack[ vstack.length - 8 ], vstack[ vstack.length - 4 ], makeList( vstack[ vstack.length - 7 ], vstack[ vstack.length - 3 ]), vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 7:
	{
		 rval = ADL.include( vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 8:
	{
		 rval = makeList( vstack[ vstack.length - 2 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 9:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 10:
	{
		
  if( vstack[ vstack.length - 2 ] ) {
    rval = vstack[ vstack.length - 3 ] + vstack[ vstack.length - 2 ].join(",") + vstack[ vstack.length - 1 ] 
  } else {
    throw( "Missing GenericArguments" );
  }

	}
	break;
	case 11:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 12:
	{
		 rval = makeList( vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ) 
	}
	break;
	case 13:
	{
		 rval = makeList( vstack[ vstack.length - 1 ] ) 
	}
	break;
	case 14:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 15:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 16:
	{
		 rval = vstack[ vstack.length - 2 ]+vstack[ vstack.length - 1 ] 
	}
	break;
	case 17:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 18:
	{
		 rval = vstack[ vstack.length - 2 ]+vstack[ vstack.length - 1 ] 
	}
	break;
	case 19:
	{
		 rval = makeList( vstack[ vstack.length - 2 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 20:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 21:
	{
		 rval = new ADL.Reference( vstack[ vstack.length - 2 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 22:
	{
		 rval = new ADL.Multiplicity( vstack[ vstack.length - 2 ] );  
	}
	break;
	case 23:
	{
		 rval = new ADL.Multiplicity( vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ] ); 
	}
	break;
	case 24:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 25:
	{
		 rval = makeList( vstack[ vstack.length - 2 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 26:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 27:
	{
		 rval = new ADL.Modifier( vstack[ vstack.length - 1 ] );     
	}
	break;
	case 28:
	{
		 rval = new ADL.Modifier( vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 29:
	{
		 rval = new ADL.Value( vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 30:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 31:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 32:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 33:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 34:
	{
		 rval = vstack[ vstack.length - 2 ];   
	}
	break;
	case 35:
	{
		 rval = null; 
	}
	break;
}



			if( _dbg_withtrace )
				__dbg_print( "\tPopping " + pop_tab[act][1] + " off the stack..." );
				
			for( var i = 0; i < pop_tab[act][1]; i++ )
			{
				sstack.pop();
				vstack.pop();
			}
									
			go = -1;
			for( var i = 0; i < goto_tab[sstack[sstack.length-1]].length; i+=2 )
			{
				if( goto_tab[sstack[sstack.length-1]][i] == pop_tab[act][0] )
				{
					go = goto_tab[sstack[sstack.length-1]][i+1];
					break;
				}
			}
			
			if( act == 0 )
				break;
				
			if( _dbg_withtrace )
				__dbg_print( "\tPushing non-terminal " + labels[ pop_tab[act][0] ] );
				
			sstack.push( go );
			vstack.push( rval );			
		}
		
		if( _dbg_withtrace )
		{		
			alert( _dbg_string );
			_dbg_string = new String();
		}
	}

	if( _dbg_withtrace )
	{
		__dbg_print( "\nParse complete." );
		alert( _dbg_string );
	}
	
	return err_cnt;
}




ADL.version = "0.5";

/*==================================================

  $Id: tabber.js,v 1.9 2006/04/27 20:51:51 pat Exp $

  tabber.js by Patrick Fitzgerald pat@barelyfitz.com



  Documentation can be found at the following URL:

  http://www.barelyfitz.com/projects/tabber/



  License (http://www.opensource.org/licenses/mit-license.php)



  Copyright (c) 2006 Patrick Fitzgerald



  Permission is hereby granted, free of charge, to any person

  obtaining a copy of this software and associated documentation files

  (the "Software"), to deal in the Software without restriction,

  including without limitation the rights to use, copy, modify, merge,

  publish, distribute, sublicense, and/or sell copies of the Software,

  and to permit persons to whom the Software is furnished to do so,

  subject to the following conditions:



  The above copyright notice and this permission notice shall be

  included in all copies or substantial portions of the Software.



  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,

  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF

  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND

  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS

  BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN

  ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN

  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE

  SOFTWARE.

  ==================================================*/



function tabberObj(argsObj)

{

  var arg; /* name of an argument to override */



  /* Element for the main tabber div. If you supply this in argsObj,

     then the init() method will be called.

  */

  this.div = null;



  /* Class of the main tabber div */

  this.classMain = "tabber";



  /* Rename classMain to classMainLive after tabifying

     (so a different style can be applied)

  */

  this.classMainLive = "tabberlive";



  /* Class of each DIV that contains a tab */

  this.classTab = "tabbertab";



  /* Class to indicate which tab should be active on startup */

  this.classTabDefault = "tabbertabdefault";



  /* Class for the navigation UL */

  this.classNav = "tabbernav";



  /* When a tab is to be hidden, instead of setting display='none', we

     set the class of the div to classTabHide. In your screen

     stylesheet you should set classTabHide to display:none.  In your

     print stylesheet you should set display:block to ensure that all

     the information is printed.

  */

  this.classTabHide = "tabbertabhide";



  /* Class to set the navigation LI when the tab is active, so you can

     use a different style on the active tab.

  */

  this.classNavActive = "tabberactive";



  /* Elements that might contain the title for the tab, only used if a

     title is not specified in the TITLE attribute of DIV classTab.

  */

  this.titleElements = ['h2','h3','h4','h5','h6'];



  /* Should we strip out the HTML from the innerHTML of the title elements?

     This should usually be true.

  */

  this.titleElementsStripHTML = true;



  /* If the user specified the tab names using a TITLE attribute on

     the DIV, then the browser will display a tooltip whenever the

     mouse is over the DIV. To prevent this tooltip, we can remove the

     TITLE attribute after getting the tab name.

  */

  this.removeTitle = true;



  /* If you want to add an id to each link set this to true */

  this.addLinkId = false;



  /* If addIds==true, then you can set a format for the ids.

     <tabberid> will be replaced with the id of the main tabber div.

     <tabnumberzero> will be replaced with the tab number

       (tab numbers starting at zero)

     <tabnumberone> will be replaced with the tab number

       (tab numbers starting at one)

     <tabtitle> will be replaced by the tab title

       (with all non-alphanumeric characters removed)

   */

  this.linkIdFormat = '<tabberid>nav<tabnumberone>';



  /* You can override the defaults listed above by passing in an object:

     var mytab = new tabber({property:value,property:value});

  */

  for (arg in argsObj) { this[arg] = argsObj[arg]; }



  /* Create regular expressions for the class names; Note: if you

     change the class names after a new object is created you must

     also change these regular expressions.

  */

  this.REclassMain = new RegExp('\\b' + this.classMain + '\\b', 'gi');

  this.REclassMainLive = new RegExp('\\b' + this.classMainLive + '\\b', 'gi');

  this.REclassTab = new RegExp('\\b' + this.classTab + '\\b', 'gi');

  this.REclassTabDefault = new RegExp('\\b' + this.classTabDefault + '\\b', 'gi');

  this.REclassTabHide = new RegExp('\\b' + this.classTabHide + '\\b', 'gi');



  /* Array of objects holding info about each tab */

  this.tabs = new Array();



  /* If the main tabber div was specified, call init() now */

  if (this.div) {



    this.init(this.div);



    /* We don't need the main div anymore, and to prevent a memory leak

       in IE, we must remove the circular reference between the div

       and the tabber object. */

    this.div = null;

  }

}





/*--------------------------------------------------

  Methods for tabberObj

  --------------------------------------------------*/





tabberObj.prototype.init = function(e)

{

  /* Set up the tabber interface.



     e = element (the main containing div)



     Example:

     init(document.getElementById('mytabberdiv'))

   */



  var

  childNodes, /* child nodes of the tabber div */

  i, i2, /* loop indices */

  t, /* object to store info about a single tab */

  defaultTab=0, /* which tab to select by default */

  DOM_ul, /* tabbernav list */

  DOM_li, /* tabbernav list item */

  DOM_a, /* tabbernav link */

  aId, /* A unique id for DOM_a */

  headingElement; /* searching for text to use in the tab */



  /* Verify that the browser supports DOM scripting */

  if (!document.getElementsByTagName) { return false; }



  /* If the main DIV has an ID then save it. */

  if (e.id) {

    this.id = e.id;

  }



  /* Clear the tabs array (but it should normally be empty) */

  this.tabs.length = 0;



  /* Loop through an array of all the child nodes within our tabber element. */

  childNodes = e.childNodes;

  for(i=0; i < childNodes.length; i++) {



    /* Find the nodes where class="tabbertab" */

    if(childNodes[i].className &&

       childNodes[i].className.match(this.REclassTab)) {

      

      /* Create a new object to save info about this tab */

      t = new Object();

      

      /* Save a pointer to the div for this tab */

      t.div = childNodes[i];

      

      /* Add the new object to the array of tabs */

      this.tabs[this.tabs.length] = t;



      /* If the class name contains classTabDefault,

	 then select this tab by default.

      */

      if (childNodes[i].className.match(this.REclassTabDefault)) {

	defaultTab = this.tabs.length-1;

      }

    }

  }



  /* Create a new UL list to hold the tab headings */

  DOM_ul = document.createElement("ul");

  DOM_ul.className = this.classNav;

  

  /* Loop through each tab we found */

  for (i=0; i < this.tabs.length; i++) {



    t = this.tabs[i];



    /* Get the label to use for this tab:

       From the title attribute on the DIV,

       Or from one of the this.titleElements[] elements,

       Or use an automatically generated number.

     */

    t.headingText = t.div.title;



    /* Remove the title attribute to prevent a tooltip from appearing */

    if (this.removeTitle) { t.div.title = ''; }



    if (!t.headingText) {



      /* Title was not defined in the title of the DIV,

	 So try to get the title from an element within the DIV.

	 Go through the list of elements in this.titleElements

	 (typically heading elements ['h2','h3','h4'])

      */

      for (i2=0; i2<this.titleElements.length; i2++) {

	headingElement = t.div.getElementsByTagName(this.titleElements[i2])[0];

	if (headingElement) {

	  t.headingText = headingElement.innerHTML;

	  if (this.titleElementsStripHTML) {

	    t.headingText.replace(/<br>/gi," ");

	    t.headingText = t.headingText.replace(/<[^>]+>/g,"");

	  }

	  break;

	}

      }

    }



    if (!t.headingText) {

      /* Title was not found (or is blank) so automatically generate a

         number for the tab.

      */

      t.headingText = i + 1;

    }



    /* Create a list element for the tab */

    DOM_li = document.createElement("li");



    /* Save a reference to this list item so we can later change it to

       the "active" class */

    t.li = DOM_li;



    /* Create a link to activate the tab */

    DOM_a = document.createElement("a");

    DOM_a.appendChild(document.createTextNode(t.headingText));

    DOM_a.href = "javascript:void(null);";

    DOM_a.title = t.headingText;

    DOM_a.onclick = this.navClick;



    /* Add some properties to the link so we can identify which tab

       was clicked. Later the navClick method will need this.

    */

    DOM_a.tabber = this;

    DOM_a.tabberIndex = i;



    /* Do we need to add an id to DOM_a? */

    if (this.addLinkId && this.linkIdFormat) {



      /* Determine the id name */

      aId = this.linkIdFormat;

      aId = aId.replace(/<tabberid>/gi, this.id);

      aId = aId.replace(/<tabnumberzero>/gi, i);

      aId = aId.replace(/<tabnumberone>/gi, i+1);

      aId = aId.replace(/<tabtitle>/gi, t.headingText.replace(/[^a-zA-Z0-9\-]/gi, ''));



      DOM_a.id = aId;

    }



    /* Add the link to the list element */

    DOM_li.appendChild(DOM_a);



    /* Add the list element to the list */

    DOM_ul.appendChild(DOM_li);

  }



  /* Add the UL list to the beginning of the tabber div */

  e.insertBefore(DOM_ul, e.firstChild);



  /* Make the tabber div "live" so different CSS can be applied */

  e.className = e.className.replace(this.REclassMain, this.classMainLive);



  /* Activate the default tab, and do not call the onclick handler */

  this.tabShow(defaultTab);



  /* If the user specified an onLoad function, call it now. */

  if (typeof this.onLoad == 'function') {

    this.onLoad({tabber:this});

  }



  return this;

};





tabberObj.prototype.navClick = function(event)

{

  /* This method should only be called by the onClick event of an <A>

     element, in which case we will determine which tab was clicked by

     examining a property that we previously attached to the <A>

     element.



     Since this was triggered from an onClick event, the variable

     "this" refers to the <A> element that triggered the onClick

     event (and not to the tabberObj).



     When tabberObj was initialized, we added some extra properties

     to the <A> element, for the purpose of retrieving them now. Get

     the tabberObj object, plus the tab number that was clicked.

  */



  var

  rVal, /* Return value from the user onclick function */

  a, /* element that triggered the onclick event */

  self, /* the tabber object */

  tabberIndex, /* index of the tab that triggered the event */

  onClickArgs; /* args to send the onclick function */



  a = this;

  if (!a.tabber) { return false; }



  self = a.tabber;

  tabberIndex = a.tabberIndex;



  /* Remove focus from the link because it looks ugly.

     I don't know if this is a good idea...

  */

  a.blur();



  /* If the user specified an onClick function, call it now.

     If the function returns false then do not continue.

  */

  if (typeof self.onClick == 'function') {



    onClickArgs = {'tabber':self, 'index':tabberIndex, 'event':event};



    /* IE uses a different way to access the event object */

    if (!event) { onClickArgs.event = window.event; }



    rVal = self.onClick(onClickArgs);

    if (rVal === false) { return false; }

  }



  self.tabShow(tabberIndex);



  return false;

};





tabberObj.prototype.tabHideAll = function()

{

  var i; /* counter */



  /* Hide all tabs and make all navigation links inactive */

  for (i = 0; i < this.tabs.length; i++) {

    this.tabHide(i);

  }

};





tabberObj.prototype.tabHide = function(tabberIndex)

{

  var div;



  if (!this.tabs[tabberIndex]) { return false; }



  /* Hide a single tab and make its navigation link inactive */

  div = this.tabs[tabberIndex].div;



  /* Hide the tab contents by adding classTabHide to the div */

  if (!div.className.match(this.REclassTabHide)) {

    div.className += ' ' + this.classTabHide;

  }

  this.navClearActive(tabberIndex);



  return this;

};





tabberObj.prototype.tabShow = function(tabberIndex)

{

  /* Show the tabberIndex tab and hide all the other tabs */



  var div;



  if (!this.tabs[tabberIndex]) { return false; }



  /* Hide all the tabs first */

  this.tabHideAll();



  /* Get the div that holds this tab */

  div = this.tabs[tabberIndex].div;



  /* Remove classTabHide from the div */

  div.className = div.className.replace(this.REclassTabHide, '');



  /* Mark this tab navigation link as "active" */

  this.navSetActive(tabberIndex);



  /* If the user specified an onTabDisplay function, call it now. */

  if (typeof this.onTabDisplay == 'function') {

    this.onTabDisplay({'tabber':this, 'index':tabberIndex});

  }



  return this;

};



tabberObj.prototype.navSetActive = function(tabberIndex)

{

  /* Note: this method does *not* enforce the rule

     that only one nav item can be active at a time.

  */



  /* Set classNavActive for the navigation list item */

  this.tabs[tabberIndex].li.className = this.classNavActive;



  return this;

};





tabberObj.prototype.navClearActive = function(tabberIndex)

{

  /* Note: this method does *not* enforce the rule

     that one nav should always be active.

  */



  /* Remove classNavActive from the navigation list item */

  this.tabs[tabberIndex].li.className = '';



  return this;

};





/*==================================================*/





function tabberAutomatic(tabberArgs)

{

  /* This function finds all DIV elements in the document where

     class=tabber.classMain, then converts them to use the tabber

     interface.



     tabberArgs = an object to send to "new tabber()"

  */

  var

    tempObj, /* Temporary tabber object */

    divs, /* Array of all divs on the page */

    i; /* Loop index */



  if (!tabberArgs) { tabberArgs = {}; }



  /* Create a tabber object so we can get the value of classMain */

  tempObj = new tabberObj(tabberArgs);



  /* Find all DIV elements in the document that have class=tabber */



  /* First get an array of all DIV elements and loop through them */

  divs = document.getElementsByTagName("div");

  for (i=0; i < divs.length; i++) {

    

    /* Is this DIV the correct class? */

    if (divs[i].className &&

	divs[i].className.match(tempObj.REclassMain)) {

      

      /* Now tabify the DIV */

      tabberArgs.div = divs[i];

      divs[i].tabber = new tabberObj(tabberArgs);

    }

  }

  

  return this;

}





/*==================================================*/





function tabberAutomaticOnLoad(tabberArgs)

{

  /* This function adds tabberAutomatic to the window.onload event,

     so it will run after the document has finished loading.

  */

  var oldOnLoad;



  if (!tabberArgs) { tabberArgs = {}; }



  /* Taken from: http://simon.incutio.com/archive/2004/05/26/addLoadEvent */



  oldOnLoad = window.onload;

  if (typeof window.onload != 'function') {

    window.onload = function() {

      tabberAutomatic(tabberArgs);

    };

  } else {

    window.onload = function() {

      oldOnLoad();

      tabberAutomatic(tabberArgs);

    };

  }

}





/*==================================================*/





/* Run tabberAutomaticOnload() unless the "manualStartup" option was specified */



if (typeof tabberOptions == 'undefined') {



    tabberAutomaticOnLoad();



} else {



  if (!tabberOptions['manualStartup']) {

    tabberAutomaticOnLoad(tabberOptions);

  }



}

if (!window['Node']) {
    window.Node = new Object();
    Node.ELEMENT_NODE = 1;
    Node.ATTRIBUTE_NODE = 2;
    Node.TEXT_NODE = 3;
    Node.CDATA_SECTION_NODE = 4;
    Node.ENTITY_REFERENCE_NODE = 5;
    Node.ENTITY_NODE = 6;
    Node.PROCESSING_INSTRUCTION_NODE = 7;
    Node.COMMENT_NODE = 8;
    Node.DOCUMENT_NODE = 9;
    Node.DOCUMENT_TYPE_NODE = 10;
    Node.DOCUMENT_FRAGMENT_NODE = 11;
    Node.NOTATION_NODE = 12;
}
if( typeof decomposeVersion != "function" ) {
    function decomposeVersion( version ) {
	var result = version.match(/([0-9]+)\.([0-9]+)(-([0-9]+))?/);
	return { major: parseInt(result[1]), 
		 minor: parseInt(result[2]), 
		 build: parseInt(result[4]) || 0 };
    }
}

if( typeof iRequire != "function" ) {
    function iRequire( lib, low, high ) {
	var version = decomposeVersion( lib.version );
	low = decomposeVersion( low );
	if( ( version.major < low.major )
	    ||
	    ( version.major == low.major 
	      && version.minor < low.minor ) 
	    ||
	    ( version.major == low.major 
	      && version.minor == low.minor 
	      && version.build < low.build ) )
	{
	    return false;
	}
	if( high ) {
            high = decomposeVersion( high );
            if( ( version.major > high.major )
		||
		( version.major == high.major 
		  && version.minor > high.minor ) 
		||
		( version.major == high.major 
		  && version.minor == high.minor 
		  && version.build > high.build ) )
	    {
		return false;
	    }
	}
	
	return true;
    }
}
    
if( ! iRequire( ADL, "0.1-4" ) ) {
    alert( "Canvas2D requires at least ADL version 0.1-4. " +
	   "Current ADL version = " + ADL.version );
}
if( !document.createElement('canvas').getContext &&
    !G_vmlCanvasManager.initElement ) {
    alert( "You browser doesn't support the Canvas element. " +
	   "If you're using IE, ExplorerCanvas is required." );
} else if( typeof CanvasTextFunctions == "undefined" ) {
    alert( "Canvas2D requires the CanvasText implementation." );
}

/*
if( typeof Canvas2D != "undefined" ) {
    alert( "WARNING: Canvas2D is already defined and will be redefined!!!" );
}
*/

function unless( stmt, func ) {
    if( ! stmt ) { func(); }
}

function max(a,b) {
    return a < b ? b : a;
}

function min(a,b) {
    return a < b ? a : b;
}

// IE misses indexOf ... and so do we ;-)
if(!Array.indexOf) {
    Array.prototype.indexOf = function(obj){
	for(var i=0; i<this.length; i++){
	    if(this[i]==obj){
	        return i;
	    }
	}
	return -1;
    }
}

Array.prototype.contains = function(substring) {
    return this.indexOf(substring) > -1;
};

/**
 * Provides the size specified in the given font specifier
 * @param {DOMString} font a CSS font specifier
 * @return the size of the font, in pixels
 */
 function getFontSize(font) {
     var size = null;
     size = toPx(font, "px");
     if (size == null) {
	 size = toPx(font, "pt");
	 if (size == null) {
	     size = toPx(font, "em");
	     if (size == null) {
		 size = toPx(font, "pct");
		 if (size != null) {
		     return size;
		 }
	     } else {
		 return size;
	     }
	 } else {
	     return size;
	 }
     } else {
	 return size;
     }
     
     throw("cannot get size from font specifier: " + font);
}

function toPx(font, src) {
    if(!font) {
	console.log( "Common::toPx: require a valid font. Got: '" + font + "'");
	return;
    }

    /* 
     * if font size is expressed in points, ems or percentages,
     * then it is converted to pixels approximately, using the table on 
     * http://www.reeddesign.co.uk/test/points-pixels.html
     */
    var conversionTable = [
	{"pt":5.5,	"px":6, 	"em":0.375,	"pct":37.5},
	{"pt":6,	"px":8, 	"em":0.5,	"pct":50},
	{"pt":7,	"px":9,		"em":0.55,	"pct":55},
	{"pt":7.5,	"px":10,	"em":0.625,	"pct":62.5},
	{"pt":8,	"px":11,	"em":0.7,	"pct":70},
	{"pt":9,	"px":12,	"em":0.75,	"pct":75},
	{"pt":10,	"px":13,	"em":0.8,	"pct":80},
	{"pt":10.5,	"px":14,	"em":0.875,	"pct":87.5},
	{"pt":11,	"px":15,	"em":0.95,	"pct":95},
	{"pt":12,	"px":16,	"em":1,		"pct":100},
	{"pt":13,	"px":17,	"em":1.05,	"pct":105},
	{"pt":13.5,	"px":18,	"em":1.125,	"pct":112.5},
	{"pt":14,	"px":19,	"em":1.2,	"pct":120},
	{"pt":14.5,	"px":20,	"em":1.25,	"pct":125},
	{"pt":15,	"px":21,	"em":1.3,	"pct":130},
	{"pt":16,	"px":22,	"em":1.4,	"pct":140},
	{"pt":17,	"px":23,	"em":1.45,	"pct":145},
	{"pt":18,	"px":24,	"em":1.5,	"pct":150},
	{"pt":20,	"px":26,	"em":1.6,	"pct":160},
	{"pt":22,	"px":29,	"em":1.8,	"pct":180},
	{"pt":24,	"px":32,	"em":2,		"pct":200},
	{"pt":26,	"px":35,	"em":2.2,	"pct":220},
	{"pt":27,	"px":36,	"em":2.25,	"pct":225},
	{"pt":28,	"px":37,	"em":2.3,	"pct":230},
	{"pt":29,	"px":38,	"em":2.35,	"pct":235},
	{"pt":30,	"px":40,	"em":2.45,	"pct":245},
	{"pt":32,	"px":42,	"em":2.55,	"pct":255},
	{"pt":34,	"px":45,	"em":2.75,	"pct":275},
	{"pt":36,	"px":48,	"em":3,		"pct":300}
    ];
    
    var result = font.match("(\\d+)"+src+"\\s*/");
    if (result == null) {
	result = font.match("(\\d+)"+src+"\\s*");
	if (result != null) {
	    result = result[1];
	}
    } else {
	result = result[1];
    }
    if (result != null) {
	for (var i = 0; i < conversionTable.length; i++) {
	    if (conversionTable[i][src] == result) {
		return conversionTable[i]["px"];
	    }
	}
    }
    
    return null;
}

function Timer() {
    this.now = new Date().getTime();
    this.stop = function() {
	return new Date().getTime() - this.now;
    }
}
// namespace for holding all Canvas2D related classes, functions and extensions
var Canvas2D = {
    // all known/registered shapes that can be used on this canvas
    shapes: $H(),

    // libraries are groups of shapes
    libraries: $H(),

    // global placeholder for extensions to register
    extensions: [],

    // one-shot activation of a Canvas
    activate: function activate(canvasId) {
	var canvas = document.getElementById(canvasId);
	if(canvas) {
	    var manager = new Canvas2D.Manager();
	    var canvas  = manager.setupBook(canvasId);
	    var sheet   = canvas.addSheet();
	    manager.startAll();
	    return sheet;
	}
	throw( canvasId + " does not reference a known id on the document." );
    },

    // method to register a shape
    registerShape: function registerShape(shape) {
	// let's store a reference to the class in the prototype itself
	shape.prototype.__CLASS__ = shape;
	shape.prototype.getClass = function getClass() { return this.__CLASS__; }

	// mixin static methods for dealing with manifests
	Canvas2D.Shape.manifestHandling.iterate( function(key, value) {
	    shape[key] = value;
	} );

	// register shape with all names (including aliasses)
	shape.getTypes().iterate(function(name) {
	    Canvas2D.shapes.set(name, shape);
	} );

	// add shape to libraries
	shape.getLibraries().iterate(function(library) {
	    if( !Canvas2D.libraries.get(library) ) { 
		Canvas2D.libraries.set(library, []);
	    }
	    Canvas2D.libraries.get(library).push(shape);
	} );
    },

    getBook : function(id) {
	return Canvas2D.KickStarter.manager.getBook(id);
    }
};
/**
 * Factory.js
 *
 * Author: Christophe VG & TheSoftwareFactory
 * http://thesoftwarefactory.be/wiki/Canvas2D
 *
 * License: http://thesoftwarefactory.be/wiki/BSD_License
 *
 * This factory takes a standard HTML5 Canvas element, adds (clearly
 * missing) features and tries to overcome the differences between
 * browsers implementations.
 *
 * The Factory extensions sub-namespace, contains sets of functionality
 * that need to be merged in. The sub-namespace "all" contains sets
 * that are merged in for all browsers. 
 */

Canvas2D.Factory = { extensions: { all: {} } };

/**
 * There are a few methods clearly missing on the HTML5 Canvas
 * element. This namespace adds a few utility methods that make life a
 * lot easier.
 */
Canvas2D.Factory.extensions.all.ShortHands = {
    clear: function clear() {
	this.clearRect( 0, 0, this.canvas.width, this.canvas.height );
    },

    fillTextCenter : function fillTextCenter(text, x, y, maxWidth) {
	var dx = this.measureText(text) / 2;
	this.fillText(text, x-dx, y, maxWidth);
    },

    fillTextRight : function fillTextRight(text, x, y, maxWidth) {
	var dx = this.measureText(text);
	this.fillText(text, x-dx, y, maxWidth);
    },

    strokeTextCenter : function strokeTextCenter(text, x, y, maxWidth) {
	var dx = this.measureText(text) / 2;
	this.strokeText(text, x-dx, y, maxWidth);
    },

    strokeTextRight : function strokeTextRight(text, x, y, maxWidth) {
	var dx = this.measureText(text);
	this.strokeText(text, x-dx, y, maxWidth);
    },

    fillStrokeRect : function fillStrokeRect(left, top, width, height) {
	this.fillRect( left, top, width, height );
	this.strokeRect( left, top, width, height );
    }
};

/**
 * This namespace adds basic event-handling supporting functions.
 */
Canvas2D.Factory.extensions.all.EventHandling = {
    on: function on( event, handler ) {
	if( !this.eventHandlers ) { this.eventHandlers = []; }
	if( !this.eventHandlers[event] ) { this.eventHandlers[event] = []; }
	this.eventHandlers[event].push(handler);
    },

    fireEvent: function fireEvent( event, data ) {
	if( !this.eventHandlers ) { return; }
	if( this.eventHandlers[event] ) {
	    this.eventHandlers[event].iterate( function(handler) { 
		handler(data);
	    } );
	}
    }
};

/**
 * We add some functionality, which also requires some additional
 * attributes, that are by default not part of the HTML5 Canvas spec. We
 * need to extend the some basic functionality to include these extended
 * properties.
 */

Canvas2D.Factory.extensions.all.ExtendedCanvasSupport = {
    __extend__: function __extend__(ctx) {
	var extProperties = [ "useCrispLines", "textDecoration", "lineStyle" ];

	var $superSave = ctx["save"];
	ctx["save"] = function() {
	    var oldValues = {};
	    var currentValues = this;
	    extProperties.iterate(function(prop) {
		oldValues[prop] = currentValues[prop];
	    });
	    if( !this.savedValues ) { this.savedValues = []; }
	    this.savedValues.push(oldValues);

	    $superSave.apply(this);
	};

	var $superRestore = ctx["restore"];
	ctx["restore"] = function() {
	    if( !this.savedValues ) { return; }

	    var oldValues = this.savedValues.pop();
	    var currentValues = this;
	    extProperties.iterate(function(prop) {
		currentValues[prop] = oldValues[prop];
	    });

	    $superRestore.apply(this);
	}

	return ctx;
    }
};

/**
 * The HTML5 specs did not specify dashed line support, because it is
 * said not to be trivial to implement natively ?! So we have to do it
 * ourselves!
 */
Canvas2D.Factory.extensions.all.DashedLineSupport = {
    __extend__: function __extend__(ctx) {
	[ "_setCurrentXY", "_plotPixel", "_drawLine" ].iterate( function(f) {
	    ctx[f] = Canvas2D.Factory.extensions.all.DashedLineSupport[f];
	});

	ctx.nativeMoveTo = ctx["moveTo"];
	ctx["moveTo"] = function(x,y) {
	    ctx.nativeMoveTo.apply( this, arguments );
	    this._setCurrentXY( x, y );
	}

	ctx.nativeLineTo = ctx["lineTo"];
	ctx["lineTo"] = function(x,y) {
	    if( this.lineStyle == "dashed" ) {
		this._drawLine( this.currentX, this.currentY, x, y );
	    } else {
		this.nativeLineTo.apply( this, arguments );
	    }
	    this._setCurrentXY(x, y);
	}

	return ctx;
    },

    _setCurrentXY: function _setCurrentXY(x, y) {
	if( !this.currentX ) { this.currentX = 0; }
	if( !this.currentY ) { this.currentY = 0; }
	this.currentX = x;
	this.currentY = y;
    },

    _plotPixel: function _plotPixel( x, y, c ) {
	var oldStyle = this.strokeStyle;
	this.beginPath();
	this.strokeStyle = c;
	this.fillStyle = c;
	this.moveTo(x,y);
	this.nativeLineTo(x+1,y+1);
	this.stroke();
	this.closePath();
	this.strokeStyle = oldStyle;
    },

    _drawLine: function _drawLine(x1, y1, x2, y2 ) {
	x1 = Math.floor(x1);	x2 = Math.floor(x2);
	y1 = Math.floor(y1-1);	y2 = Math.floor(y2-1);
	// to make sure other strokes are stroked:
	this.stroke();

	var c     = this.strokeStyle;
	var style = this.lineStyle;

	var steep = Math.abs(y2 - y1) > Math.abs(x2 - x1);
	if (steep) {
            t = y1;            y1 = x1;            x1 = t;
            t = y2;            y2 = x2;            x2 = t;
	}
	var deltaX = Math.abs(x2 - x1);
	var deltaY = Math.abs(y2 - y1);
	var error = 0;
	var deltaErr = deltaY;
	var xStep;
	var yStep;
	var x = x1;
	var y = y1;
	if(x1 < x2) {  xStep = 1; } else { xStep = -1; }
	if(y1 < y2) {  yStep = 1; } else { yStep = -1;	}
	if( steep ) { this._plotPixel(y, x, c); } 
	else        { this._plotPixel(x, y, c); }
	var dot = 0;
	while( x != x2 ) {
            x = x + xStep;
            error = error + deltaErr;
            if( 2 * error >= deltaX ) {
		y = y + yStep;
		error = error - deltaX;
            }
	    var color = ( style != "dashed" || ++dot % 15 ) < 10 ? c : "white";
            if(steep) { this._plotPixel(y, x, color); } 
	    else      { this._plotPixel(x, y, color); }
	}
    }
};

/**
 * Althought the HTML5 Canvas is a pixel-oriented environment, it still
 * uses anti-aliassing to smooth its drawings. I some cases this
 * default behaviour is not optimal (think horizontal/vertical
 * hairlines). This namspace adds support for crisp lines.
 */
Canvas2D.Factory.extensions.all.CrispLineSupport = {
    __extend__: function __extend__(ctx) {
	[ "strokeRect", "moveTo", "lineTo", "rect" ].iterate(function(f) {
	    var $super = ctx[f];
	    ctx[f] = function(x,y,w,h) {
		if(!this.useCrispLines) { return $super.apply(this,arguments); }
		var crisp = 
		    Canvas2D.Factory.extensions.all.CrispLineSupport.makeCrisp
		      (x,y,w,h,this.lineWidth);
		return $super.apply(this, [crisp.x, crisp.y, crisp.w, crisp.h]);
	    }
	});
	return ctx;
    },

    makeCrisp : function makeCrisp(x, y, xx, yy, lineWidth) {
	var x1 = x;  var y1 = y;
	var x2 = xx; var y2 = yy;
	var w  = xx; var h  = yy;

	// if the lineWidth is odd
	if( lineWidth % 2 ) {
	    x1 = Math.floor(x) + 0.5;
	    y1 = Math.floor(y) + 0.5;
	    if(typeof x2 != "undefined") {
		x2 = Math.floor(xx) + 0.5;
		y2 = Math.floor(yy) + 0.5;
	    }
	    // if the width/height is fractional
	    if( xx % 1 != 0 ) { w = Math.floor(xx); }
	    if( yy % 1 != 0 ) { h = Math.floor(yy); }
	} else {
	    x1 = Math.floor(x);
	    y1 = Math.floor(y);
	    if(typeof x2 != "undefined" ) {
		x2 = Math.floor(xx);
		y2 = Math.floor(yy);
	    }
	    // if the width/height is fractional
	    if( xx % 1 != 0 ) { w = Math.floor(xx) + 0.5; }
	    if( yy % 1 != 0 ) { h = Math.floor(yy) + 0.5; }
	}

	return {x:x1, y:y1, x1:x1, y1:y1, w:w, h:h, x2:x2, y2:y2};
    }
};

/**
 * The HTML5 Canvas provides no support for decorating text. So, this
 * namespace adds simple support for it.
 */
Canvas2D.Factory.extensions.all.TextDecorationSupport = {
    decorateText : function decorateText(text, x, y, maxWidth) {
	if( !this.textDecoration ) { return; }

	this.save();
	this.useCrispLines = true;
	this.strokeStyle = "black"; // TODO: this fixes red FF underlining
	this.textDecoration.toLowerCase().split(" ")
	                                 .iterate(function(decoration) {
	    var decorator = null;
	    switch(decoration) {
	    case "underline"   : decorator = this.underlineText;   break;
	    case "overline"    : decorator = this.overlineText;    break;
	    case "line-through": decorator = this.linethroughText; break;
	    }
	    if( decorator ) { 
		this.beginPath();
		var length = this.measureText(text);
		if( length > maxWidth ) { length = maxWidth; }
		decorator.call(this, text, x, y, length); 
		this.stroke();
		this.closePath();
	    }
	}.scope(this) );
	this.restore();
    },

    underlineText : function underlineText(text, x, y, length) {
        this.moveTo(x, y + 3);
        this.lineTo(x + length, y + 3);
    },

    overlineText : function overlineText(text, x, y, length) {
        this.moveTo(x, y - getFontSize(this.font) );
        this.lineTo(x + length, y - getFontSize(this.font) );
    },

    linethroughText : function linethroughText(text, x, y, length) {
        this.moveTo(x, y - (getFontSize(this.font) / 2) + 2);
        this.lineTo(x + length, y - (getFontSize(this.font) / 2) + 2);
    }
};

/**
 * We also want to add interaction with the Canvas. This namespace adds
 * basic mouse tracking and exposing of events to subscribers
 */
Canvas2D.Factory.extensions.all.MouseEvents = {
    setupMouseEventHandlers: function setupMouseEventHandlers() {
	ProtoJS.Event.observe(this.canvas, 'mousedown', 
		      this.handleMouseDown.scope(this));
	ProtoJS.Event.observe(this.canvas, 'mouseup', 
		      this.handleMouseUp.scope(this));
	ProtoJS.Event.observe(document, 'mousemove', 
		      this.handleMouseMove.scope(this));
	ProtoJS.Event.observe(this.canvas, 'dblclick',
		      this.handleDoubleClick.scope(this));
    },

    getLeft: function getLeft() {
	var elem = this.canvas;
	var left = 0;
	while( elem != null ) {
	    left += elem.offsetLeft;
	    elem = elem.offsetParent;
	}
	return left;
    },

    getTop: function getTop() {
	var elem = this.canvas;
	var top = 0;
	while( elem != null ) {
	    top += elem.offsetTop;
	    elem = elem.offsetParent;
	}
	return top;
    },

  getXY: function getXY(e) {
    var x,y;
    if( ProtoJS.Browser.IE ) {
      x = event.clientX + document.body.scrollLeft;
      y = event.clientY + document.body.scrollTop;
    } else {
      x = e.pageX;
      y = e.pageY;
    }
    return { x: x - this.getLeft(), y: y - this.getTop() };
  },
  
    handleMouseDown: function handleMouseDown(event) {
	this.mousepressed = true;
	var pos = this.getXY(event);
	this.fireEvent( "mousedown", pos );
	this.mousePos = pos;
    },

    handleMouseUp: function handleMouseUp(event) {
	this.mousepressed = false;
	var pos = this.getXY(event);
	this.fireEvent( "mouseup", pos );
	this.mousePos = pos;
    },

    handleMouseMove: function handleMouseMove(event) {
	    if( this.mousepressed ) { this.handleMouseDrag(event); }
	    var pos = this.getXY(event);
	    if( pos ) {
        var mouseWasOver = this.mouseOver;
	      this.mouseOver = ( pos.x >= 0 && pos.x <= this.canvas.width )
	                   &&  ( pos.y >= 0 && pos.y <= this.canvas.height );
		    if(this.mouseOver && !mouseWasOver) { this.fireEvent( "mouseEnter" );}
	      if(!this.mouseOver && mouseWasOver) { this.fireEvent( "mouseLeave" );}
	    }
    },
    
    handleMouseDrag: function handleMouseDrag(event) {
	var pos = this.getXY(event);
	this.fireEvent( "mousedrag", { x: pos.x, 
				       y: pos.y, 
				       dx: pos.x - this.mousePos.x,
				       dy: pos.y - this.mousePos.y } );
	this.mousePos = pos;
    },

    handleDoubleClick: function handleDoubleClick(event) {
      var pos = this.getXY(event);
      this.fireEvent( "dblclick", pos );
      this.mousePos = pos;
    }
};

/**
 * The iPhone has special events for touching and dragging.
 */
Canvas2D.Factory.extensions.TouchEvents = {
    setupTouchEventHandlers: function setupTouchEventHandlers() {
	ProtoJS.Event.observe(this.canvas, 'touchstart',
			      this.handleTouchStart.scope(this));
	ProtoJS.Event.observe(this.canvas, 'touchmove',
			      this.handleTouchMove.scope(this));
	ProtoJS.Event.observe(this.canvas, 'touchend',
			      this.handleTouchEnd.scope(this));
    },

    handleTouchStart: function handleTouchStart(event) {
	if( event.touches.length == 1 ) {
	    this.handleMouseDown(event.touches[0]);
	    event.preventDefault();
	}	
    },

    handleTouchMove: function handleTouchMove(event) {
	if( event.touches.length == 1 ) {
	    this.handleMouseDrag(event.touches[0]);
	    event.preventDefault();
	}	
    },

    handleTouchEnd: function handleTouchEnd(event) {
	this.handleMouseUp(event);
	event.preventDefault();
    }
};

/**
 * The HTML5 Canvas specification specifies functions for rendering
 * text. Currently only recent FF implementations provide an
 * implementation for these functions.
 *
 * Different browsers have different custom support for rendering
 * text. This namespace provides common functions for our
 * implementation.
 */
Canvas2D.Factory.extensions.all.TextSupport = {
    adjustToAlignment: function adjustToAlignment(x, text) {
	switch(this.textAlign) {
	  case "center": x -= this.measureText(text) / 2; break;
	  case "right":  x -= this.measureText(text);     break;
	}
	return x;
    },

    getFontSize: function() {
	return getFontSize( this.font || Canvas2D.Sheet.Defaults.font );
    }
};

/**
 * The HTML5 Canvas specification specifies functions for rendering
 * text. Currently only recent FF implementations provide an
 * implementation for these functions.
 *
 * For browsers that have no support at all, we render text using small
 * lines. We use the canvastext library by Jim Studt.
 */
Canvas2D.Factory.extensions.CanvasText = {
    fillText : function fillText(text, x, y, maxWidth) {
	// CanvasText implementation is stroke-based, no filling, just stroking
	this.strokeText(text, x, y, maxWidth);
    },
    
    strokeText : function strokeText(text, x, y, maxWidth) {
    	this.beginPath();
	
    	this.save();
	// CanvasText implementation is stroke-based. Just in case the
	// fillStyle is set in stead of strokeStyle
	this.strokeStyle = this.fillStyle;
	x = this.adjustToAlignment(x, text);
	CanvasTextFunctions.draw(this, this.font, getFontSize(this.font), 
				 x, y, text);
	this.decorateText(text, x, y, maxWidth);
	this.restore();

	this.closePath();
    },
    
    measureText  : function measureText(text) {
	return CanvasTextFunctions.measure( this.font, getFontSize(this.font), 
					    text);
    }
};

/**
 * The HTML5 Canvas specification specifies functions for rendering
 * text. Currently only recent FF implementations provide an
 * implementation for these functions.
 *
 * Even with HTML5 compliant text rendering functions, we still want to
 * add some missing functionalities like text-alignment and
 * text-decoration.
 */
Canvas2D.Factory.extensions.HTML5CanvasText = {
    __extend__: function __extend__(ctx) {
	var $superMeasureText = ctx["measureText"];
	ctx["measureText"] = function measureText(text) {
	    return $superMeasureText.apply(this, arguments).width;
	}

	var $superFillText = ctx["fillText"];
	ctx["fillText"] = function fillText(text, x, y, maxWidth) {
	    maxWidth = maxWidth  || this.measureText(text);
            $superFillText.apply(this, arguments);
	    x = this.adjustToAlignment( x, text );	    
            this.decorateText(text, x, y, maxWidth);
	}

	var $superStrokeText = ctx["strokeText"];
	ctx["strokeText"] = function strokeText(text, x, y, maxWidth) {
	    maxWidth = maxWidth  || this.measureText(text);
            $superStrokeText.apply(this, arguments);
	    x = this.adjustToAlignment( x, text );
            this.decorateText(text, x, y, maxWidth);
	}

	return ctx;
    }
};

/**
 * The HTML5 Canvas specification specifies functions for rendering
 * text. Currently only recent FF implementations provide an
 * implementation for these functions.
 *
 * This implementation should be used for pre Gecko 1.9.1.  Later
 * versions of Gecko should use HTML5CanvasText, which wraps the native
 * HTML5 text rendering functions.
 */
Canvas2D.Factory.extensions.GeckoCanvasText = {
    fillText     : function fillText(text, x, y, maxWidth) {
	x = this.adjustToAlignment(x, text);
        this._drawText(text, x, y, true);
        this.decorateText(text, x, y, maxWidth);
    },

    strokeText   : function strokeText(text, x, y, maxWidth) {
	x = this.adjustToAlignment(x, text);
        this._drawText(text, x, y, false);
        this.decorateText(text, x, y, maxWidth);
    },

    measureText  : function measureText(text) {
        this.save();
        this.mozTextStyle = this.font;
        var width = this.mozMeasureText(text);
        this.restore();
        return width;
    },

    /**
     * Helper function to stroke text.
     * @param {DOMString} text The text to draw into the context
     * @param {float} x The X coordinate at which to begin drawing
     * @param {float} y The Y coordinate at which to begin drawing
     * @param {boolean} fill If true, then text is filled, 
     * 			otherwise it is stroked  
     */
    _drawText : function _drawText(text, x, y, fill) {
        this.save();

        this.beginPath();
        this.translate(x, y);
        this.mozTextStyle = this.font;
        this.mozPathText(text);
        if (fill) {
            this.fill();
        } else {
            this.stroke();
        }
        this.closePath();

        this.restore();
    }
};

/**
 * This is the main Factory method. It takes a native Canvas 2D Context
 * and transforms it into a Canvas2D.
 */
Canvas2D.Factory.setup = function(element) {
    if( !Canvas2D.initialized ) {
	Canvas2D.initialized = true;
	// prepare Canvas Prototype
	if (!window.CanvasRenderingContext2D) {   // webkit
	    window.CanvasRenderingContext2D =
		document.createElement("canvas").getContext("2d").__proto__;
	} else {   // firefox
	    window.CanvasRenderingContext2D = CanvasRenderingContext2D.prototype
	}
    }

    unless( element && element.nodeType &&
	    element.nodeType == 1,
	    function() {
		throw( "CanvasBase:initialize: expected HTMLElement" );
	    } );
    
    try {
	var ctx = element.getContext("2d");    
    } catch(e) {
	throw( "Canvas2D: element is no HTML5 Canvas." );
    }

    // TextFunctions are problematic ;-)
    // it took a while before all major browser supported the text functions
    if( ctx.strokeText && ctx.fillText && ctx.measureText ) {
      // standard native functions are present, extend them a bit further
      ctx = Canvas2D.Factory.extensions.HTML5CanvasText.__extend__(ctx);
    } else if( ctx.mozMeasureText && ctx.mozPathText ) {
      // pre 1.9 gecko suports own interface (<= FF 3.1)
      ProtoJS.mix(Canvas2D.Factory.extensions.GeckoCanvasText, ctx, true );
    } else {
      // browser has no native text functions, use CanvasText to simulate it
      ProtoJS.mix( Canvas2D.Factory.extensions.CanvasText, ctx, true );
      if( ProtoJS.Browser.IE ) {
        // IE already uses an emulation layer (explorercanvas)
        // which is slow, so we disable the additional watermark text
        Canvas2D.Book.prototype.addWaterMark = function() { };
      }
    }	

    // Additional Browser Specific Configuration
    if( ProtoJS.Browser.MobileSafari ) { 
      ProtoJS.mix( Canvas2D.Factory.extensions.TouchEvents, ctx, true );
      ctx.setupTouchEventHandlers();
    }

    // mixin some functions that clearly are missing ;-)
    $H(Canvas2D.Factory.extensions.all).values().iterate(function(ext) {
	if( ext.__extend__ ) {
	    ctx = ext.__extend__(ctx);
	} else {
	    ProtoJS.mix( ext, ctx, true );
	}
    } );

    // initialize own default settings
    $H(Canvas2D.Defaults.Canvas).iterate(function(key, value) {
	ctx[key] = value;
    });

    // activate mouseEventHandlers
    ctx.setupMouseEventHandlers();

    return ctx;
}

// mix-in event handling to Canvas2D
ProtoJS.mix( Canvas2D.Factory.extensions.all.EventHandling, Canvas2D );
Canvas2D.KeyboardDriver = Class.extend( {
    init: function initialize() {
	this.currentKeysDown = [];
	ProtoJS.Event.observe(document, 'keydown', 
			      this.handleKeyDownEvent.scope(this));
	ProtoJS.Event.observe(document, 'keyup', 
			      this.handleKeyUpEvent.scope(this));
    },

    handleKeyDownEvent: function( event ) {
	var key = (event || window.event).keyCode;
	this.currentKeysDown.push(key);
	this.fireEvent( "keydown", key );
    },

    handleKeyUpEvent: function handleKeyUpEvent( event ) {
	var key = (event || window.event).keyCode;
	this.currentKeysDown = this.currentKeysDown.remove(key);
	this.fireEvent( "keyup", key );
    },

    getCurrentKeysDown: function getCurrentKeysDown() {
	return this.currentKeysDown;
    },

    keyDown: function keyDown(key) {
	return this.currentKeysDown.contains(key);
    }
} );

ProtoJS.mix( Canvas2D.Factory.extensions.all.EventHandling,
	     Canvas2D.KeyboardDriver.prototype );

Canvas2D.Keyboard = new Canvas2D.KeyboardDriver();
Canvas2D.ImageManager = {};

Canvas2D.ImageManager.work = 0;

Canvas2D.ImageManager.load = function(src, onload) {
    var image = new Image();
    Canvas2D.ImageManager.work++;
    image.onload = function() {
	Canvas2D.ImageManager.work--;
	onload();
    }
    image.src = src;
    return image;
};

Canvas2D.ImageManager.isReady = function() {
    return Canvas2D.ImageManager.work == 0;
};Canvas2D.Manager = Class.extend( {
    init : function() {
	this.plugins = [];
	this.books   = $H();
    },

    setupBook : function(id) {
	return this.addBook(new Canvas2D.Book(id));
    },

    addBook : function(book) {
	unless( book instanceof Canvas2D.Book, function() { 
	    throw( "Manager::addBook: book must be instance of Canvas2D.Book" );
	} );
	this.books.set(book.name, book);
	return book;
    },

    getBook : function(id) {
	return this.books.get(id);
    },
    
    startAll :function() {
	if( Canvas2D.ImageManager.isReady() ) {
	    this.plugins.iterate(function(plugin)      { plugin.start(); } );
	    this.books.values().iterate(function(book) { book.start();   } );
	} else {
	    this.startAll.scope(this).after(10);
	}
    }
} );
Canvas2D.ADLVisitor = Class.extend( {
  init: function() {
    this.errors = [];  
  },

  visit: function( construct, parent ) {
    var constructType = construct.type.toLowerCase();
    if( construct.name == "root" ) {
      // just move on to the children
      construct.childrenAccept(this, parent);
      return parent;
    } else if( Canvas2D.shapes.get(constructType) ) {
      var shape = Canvas2D.shapes.get(constructType).from(construct, parent);
      if( shape ) {
        if( shape.errors ) {
          shape.errors.iterate( function( error ) {
            this.errors.push( error );
          }.scope(this) );
        } else {
          if( shape.warnings ) {
            shape.warnings.iterate( function( error ) {
              this.errors.push( error );
            }.scope(this) );
          }
          var left, top;
          if( construct.annotations && construct.annotations.length > 0 ) {
            var pos = construct.annotations[0].value.split(",");
            left = parseInt(pos[0]);
            top  = parseInt(pos[1]);
            parent.book.getCurrentSheet().at(left,top).add( shape );
          } else {
            parent.add( shape );
          }
          construct.childrenAccept(this, shape);
        }
      }
      return construct;
    } else {
      this.errors.push("Unknown Construct Type: " + construct.type);
      // if we don't know the construct type, no need to go further
      return parent;
    }
  }
} );
Canvas2D.Book = Class.extend( {
  init: function(element) {
    // overloaded constructor implementation allows the passing of an id
    unless( element && element.nodeType && 
      element.nodeType == Node.ELEMENT_NODE, 
      function(){
        element = document.getElementById(element);
    } );

    this.canvas = Canvas2D.Factory.setup(element);

    this.sheets = [];
    this.currentSheet = 0;      // index of the current show sheet

    this.canvas.on( "mousedown", function(data) {
      this.fireEvent("mousedown");
      var sheet;
      if(sheet = this.getCurrentSheet() ) {
        sheet.handleMouseDown(data);
      }
    }.scope(this) );

    this.canvas.on( "mouseup", function(data) {
      this.fireEvent("mouseup");
      var sheet;
      if(sheet = this.getCurrentSheet() ) {
        sheet.handleMouseUp(data);
      }
    }.scope(this) );

    this.canvas.on( "mousedrag", function(data) {
      this.fireEvent("mousedrag");
      var sheet;
      if(sheet = this.getCurrentSheet()) {
        sheet.handleMouseDrag(data);
      }
    }.scope(this) );


    // look for a console and sources for this book
    this.console   = document.getElementById( element.id + "Console"   );
    this.source    = document.getElementById( element.id + "Source"    );
    this.generated = document.getElementById( element.id + "Generated" );

    this.name = element.id;

    this.setupExtensions();
    this.setupPlugins();
  },

  add: function( sheet ) {
    return this.addSheet(sheet);
  },

  addSheet : function( sheet ) {
    unless( sheet instanceof Canvas2D.Sheet, function() {
      sheet = new Canvas2D.Sheet( { book: this } );
    }.scope(this) );
    sheet.setCanvas(this.canvas);
    sheet.on( "change", this.rePublish.scope(this) );
    sheet.on( "newShape", this.log.scope(this) );
    this.sheets.push(sheet);
    return sheet;
  },

  setupExtensions: function() {
    this.extensions = new Hash();
    Canvas2D.extensions.iterate(function(extension) {
      this.extensions.set(extension.name, extension);
    }.scope(this) );
  },

  setupPlugins: function() {
    this.plugins = {};
    $H(Canvas2D.Book.plugins).iterate(function(key, value) {
      var plugin = new (value)(this);
      this.plugins[key] = plugin;
      if( value['exposes'] ) {
        value.exposes.iterate(function(func) {
          this[func] = function(arg1, arg2, arg3) { 
            this.plugins[key][func](arg1, arg2, arg3);
          };
        }.scope(this) );
      }
    }.scope(this) );
  },

  log: function( msg ) {
    if( this.console ) { 
      this.console.value = "[" + (new Date).toLocaleString() + "] " 
      + msg + "\n" + this.console.value;
    }
  },

  getCurrentSheet: function() {
    return this.sheets[this.currentSheet];
  },

  clear : function() {
    this.sheets.length = 0;
  },

  start : function() {
    this.stop();
    this.rePublish();
    this.publish();
  },

  stop : function() {
    if( this.nextPublish ) { window.clearTimeout( this.nextPublish ); }
  },

  freeze: function() { this.wait = true;  },
  thaw: function()   { this.wait = false; },

  load: function(source) {    
    var parser = new ADL.Parser();
    var tree;
    this.errors = "";
    if( ( tree = parser.parse( source ) ) ) {
      this.clear();
      this.freeze();
      var visitor = new Canvas2D.ADLVisitor();
      tree.getRoot().accept(visitor, this );
      this.thaw();
      this.rePublish();
      if( visitor.errors.length > 0 ) {
        this.errors = "ADLVisitor reported errors:"
        visitor.errors.iterate( function(error) {
          this.log(error);
          this.errors += "\n   - " + error;
        }.scope(this));
      }
      this.fireEvent("sourceLoaded");
      return true;
    } else {
      this.log( parser.errors );
      this.errors = parser.errors;
      this.fireEvent("sourceLoaded");
      return false;
    }
  },

  toADL: function() {
    var s = "";
    this.sheets.iterate(function(sheet) {
      s += sheet.toADL() + "\n";
    } );
    return s;
  },

  rePublish: function() {
    this.rePublishNeeded = true;	
  },

  publish : function() {
    if( this.rePublishNeeded && !this.wait ) {
      this.publishOnce();
      this.rePublishNeeded = false;
      this.afterPublish();
    }

    // reshedule publish in 10ms
    this.nextPublish = this.publish.scope(this).after(10);
  },

  publishOnce : function() {
    var timer = new Timer();
    this.canvas.clear();

    if( this.getCurrentSheet() ) {
      this.beforeRender();
      this.getCurrentSheet().render();
      this.afterRender();
    }

    this.log( "Canvas2D::publish: RenderTime: " + timer.stop() + "ms" );
  },

  afterPublish: function afterPublish() {
    $H(this.plugins).iterate( function( name, plugin ) {
      if( plugin["afterPublish"] ) { plugin.afterPublish(this); }
    }.scope(this) );
  },

  beforeRender: function beforeRender() {
    $H(this.plugins).iterate( function( name, plugin ) {
      if( plugin["beforeRender"] ) { plugin.beforeRender(this); }
    }.scope(this) );
  },

  afterRender: function afterRender() {
    $H(this.plugins).iterate( function( plugin ) {
      if( plugin["afterRender"] ) { plugin.afterRender(this); }
    }.scope(this) );

    this.updateExternalSource();
  },

  updateExternalSource: function updateExternalSource() {
    if( this.getCurrentSheet() ) {
      var newSource = this.getCurrentSheet().toADL();
      // this should be moved to Widget
      if( this.generated && newSource != this.generated.value ) {
        this.generated.value = newSource;
      }
      this.fireEvent( "sourceUpdated", newSource );
    }
  }

} );

// mix-in some common functionality at class level
ProtoJS.mix( Canvas2D.Factory.extensions.all.EventHandling,
  Canvas2D.Book.prototype );

  // add support for plugins
  Canvas2D.Book.plugins = {};
Canvas2D.ShapeCounter = {};

Canvas2D.Shape = Class.extend( {
  init: function initialize( props ) {
    props = props || {};

    // add default name is none is provided
    if( !props['name'] ) { 
      props.name = this.getPropertyDefault( 'name' ) || "__shape__";
      if( ! Canvas2D.ShapeCounter[props.name] ) {
        Canvas2D.ShapeCounter[props.name] = 0;
      }
      props.name += Canvas2D.ShapeCounter[props.name]++
    }

    // preprocess is used to allow Shapes to preprocess the
    // properties before they are automatically initialized
    props = this.preprocess(props);
    this.setProperties(props);

    // setup getters
    this.getPropertyList().iterate(function propertyListIterator(prop) {
      var propName = prop.substr(0,1).toUpperCase() + prop.substr(1);
      var getterName = "get"+propName;
      if( typeof this[getterName] == "undefined" ) {
        this[getterName] = function() { return this.getProperty(prop);};
      }
    }.scope(this));

    // postInitialize is used to allow Shapes to do initialization
    // stuff, without the need to override this construtor and
    // make sure it is called correctly
    this.postInitialize();
  },

  setParent: function setParent(parent) {
    this.parent = parent;
  },

  getParent: function getParent() {
    return this.parent;
  },

  prepare: function prepare(sheet) {},

  setProperties : function setProperties(props) {
    this.getPropertyList().iterate(function propertyListIterator(prop) {
      this[prop] = props[prop] != null ? props[prop] : null;
    }.scope(this) );
  },

  setProperty : function setProperty(prop, value) {
    this[prop] = value != null ? value : null;
    this.fireEvent( 'change' );
  },

  getProperty: function getProperty( prop ) {
    if( typeof this[prop] == "undefined" ) {
      var propName = prop.substr(0,1).toUpperCase() + prop.substr(1);
      var getterName = "get"+propName;
      return this[getterName]();
    } else {
      return this[prop] != null ? 
      this[prop] : this.getPropertyDefault(prop);
    }
  },

  getPropertyDefault: function getPropertyDefault(prop) {
    var retVal = null;
    this.getClassHierarchy().reverse().iterate( 
      function classHierarchyIterator(clazz) {
        if( retVal == null && typeof clazz.Defaults[prop] != "undefined" ) {
          retVal = clazz.Defaults[prop];
        }
      }
    );
    return retVal;
  },

  toADL: function(prefix) {
    return this.constructToString(this.asConstruct(), prefix);
  },

  asConstruct: function() {
    var construct =  
    { __SHAPE__   : this,
      annotation  : { data: null },
      type        : this.getType(),
      name        : this.getName(),
      supers      : [],
      modifiers   : {},
      children    : [],
      addModifiers: function( props ) {
        props.iterate( function(prop) {
          if( this.__SHAPE__.getProperty( prop ) ) {
            this.addModifier( prop, 
              this.__SHAPE__.getProperty(prop) );
            }
          }.scope(this)
        );
      },
      addModifier : function( key, value ) {
        if( this.__SHAPE__.getPropertyDefault( key ) != value ) {
          this.modifiers[key] = "\"" + value + "\"";
        }
      }
    };

    construct.addModifiers( [ "label", "labelPos", "labelColor" ] );

    return construct;
  },

  constructToString: function(construct, prefix) {
    if(construct == null) { return ""; }
    var string = "";
    if( construct.annotation && construct.annotation.data ) {
      string += prefix + "[@" + construct.annotation.data + "]\n";
    }
    string += prefix + construct.type + " " + construct.name;
    construct.supers.iterate(function(zuper) { string += " : " + zuper; });
    $H(construct.modifiers).iterate( 
      function modifierIterator( key, value ) {
        if( typeof value != "function" ) {
          string += " +" + key;
          if( value ) { string += "=" + value; }
        }
      } 
    );
    if( construct.children.length > 0 ) {
      string += " {\n";
      var me = this;
      construct.children.iterate(function childIterator(child) {
        string += me.constructToString(child, prefix + "  " ) + "\n";
      } );
      string += prefix + "}";
    } else {
      string += ";";
    }
    return string;
  },

  delayRender: function() {
    return false;
  },

  drawLabel: function(sheet, left, top) {
    if( this.getLabel() && this.getHeight() != null && this.getCenter() ) {
      left += this.getCenter().left;

      switch( this.getLabelPos() ) {
        case "top":	            top  += - 5;   break;
        case "top-inner":       top  += + 16;  break;
        case "bottom":          top  += this.getHeight() + 11; break;
        case "bottom-inner":    top  += this.getHeight() - 8;  break;
        case "center": default: top  += this.getCenter().top + 2.5;
      }

      sheet.save();
      sheet.fillStyle     = this.getLabelColor();
      sheet.textAlign     = this.getLabelAlign();
      sheet.font          = this.getLabelFont();
      sheet.useCrispLines = this.getLabelUseCrispLines();
      sheet.fillText(this.getLabel(), left, top);
      sheet.restore();
    }
  },

  render: function(sheet, left, top) {
    this.prepare(sheet);

    sheet.save();
    this.draw     (sheet, left, top);
    this.drawLabel(sheet, left, top);
    sheet.restore();
  },


  // these methods are required and are created when a shape is
  // registered correctly.
  getType            : function() { 
    throw( "Missing getType. Did you register the shape?" ); 
  },
  getClasSHierarchy  : function() { 
    throw( "Missing getClassHierarchy. Did you register the shape?" ); 
  },

  // the remaining methods are not applicable for abstract shapes
  preprocess     : function preprocess(props)      { return props; },
  postInitialize : function postInitialize()       { },
  draw           : function draw(sheet, left, top) { },
  hit            : function hit(x, y)              { return false; },
  hitArea        : function hitArea(l, t, w, h)    { return false; },
  getCenter      : function getCenter()            { return null;  },
  getPort        : function getPort(side)          { return null;  }
} );

// add-in some common functionality
ProtoJS.mix( Canvas2D.Factory.extensions.all.EventHandling,
  Canvas2D.Shape.prototype );

  Canvas2D.Shape.MANIFEST = {
    name : "shape",
    properties: [ "name", "label", "labelPos", "labelColor", "labelAlign",
    "labelFont", "labelUseCrispLines", "useCrispLines",
    "topDown" ]
  };

  Canvas2D.Shape.manifestHandling = $H( {
    getManifest: function getManifest() {
      return this.MANIFEST || this.__CLASS__.MANIFEST;
    },

    getType: function getType() {
      return this.getManifest().name;
    },

    getTypes: function getTypes() {
      return [ this.getType() ].concat( this.getAliasses() );
    },

    getPropertyPath: function getPropertyPath() {
      return this.getManifest().propertyPath || [];
    },

    getClassHierarchy: function getClassHierarchy() {
      var classes = [ Canvas2D.Shape ].concat( this.getPropertyPath() );
      classes.push( this.getClass() );
      return classes;
    },

    getLocalProperties: function getLocalProperties() {
      return this.getManifest().properties || [];
    },

    getPropertyList: function getPropertyList() {
      if( !this.allPropertiesCache ) { 
        this.allPropertiesCache = [];
        this.getClassHierarchy().iterate(
          function propertiesCacheFiller(shape){
            this.allPropertiesCache = this.allPropertiesCache
            .concat(shape.getLocalProperties());
          }.scope(this)
        );
      }
      return this.allPropertiesCache
    },

    getAliasses: function getAliasses() {
      return this.getManifest().aliasses || [];
    },

    getLibraries: function getLibraries() {
      return this.getManifest().libraries || [];
    }
  } 
);

// add manifestHandling functions to each Shape instance and on the
// class itself
Canvas2D.Shape.manifestHandling.iterate( function(key, value) {
  Canvas2D.Shape.prototype[key] = value;
  Canvas2D.Shape[key] = value;
} );
Canvas2D.Sheet = Class.extend( {
  init: function init(props) {
    props = props || {};

    this.book = props.book;

    this.name  = props.name  || "default";   // name of the sheet
    this.style = props.style || "static";    // selected style

    this.clear();
    this.dirty = false;

    if(props.canvas) { this.setCanvas(props.canvas); }

    Canvas2D.Keyboard.on( "keyup", this.handleKeyDown.scope(this) );
  },

  setCanvas: function setCanvas(canvas) {
    this.canvas = canvas;
    this.wireCanvasDelegation();
    this.setupProperties();
  },
  
  getHeight: function getHeight() {
    return this.canvas.canvas.height;
  },

  wireCanvasDelegation: function wireCanvasDelegation() {
    if( !this.canvas ) { return; }

    Canvas2D.Sheet.Operations.iterate(function(operation) {
      if( operation == "restore" ) {
        this[operation] = function() {
          this.canvas[operation].apply(this.canvas, arguments);
          this.transferBackProperties();
          return;
        }.scope(this);
      } else {
        this[operation] = function() {
          this.transferProperties();
          return this.canvas[operation].apply(this.canvas, arguments);
        }.scope(this);
      }
    }.scope(this) );
  },

  setupProperties: function setupProperties() {
    Canvas2D.Sheet.Properties.iterate( function(prop) {
      this[prop] = Canvas2D.Sheet.Defaults[prop] || this.canvas[prop];
    }.scope(this) );
  },

  transferProperties : function() {
    Canvas2D.Sheet.Properties.iterate(function(prop) {
      this.canvas[prop] = this[prop];
    }.scope(this) );
  },

  transferBackProperties : function() {
    Canvas2D.Sheet.Properties.iterate(function(prop) {
      this[prop] = this.canvas[prop];
    }.scope(this) );
  },

  makeDirty: function() {
    this.dirty = true;
    this.fireEvent( "change" );
  },

  isDirty: function() {
    return this.dirty;
  },

  clear: function() {
    this.positions      = []; // list of shapes on the sheet
    this.shapesMap      = {}; // name to shape mapping
    this.positionsMap   = {}; // shape to position mapping
    this.selectedShapes = []; // list of selected shapes

    this.fireEvent( "change" );
  },

  makeDynamic: function() { this.style = "dynamic";         },
  makeStatic : function() { this.style = "static";          },
  isDynamic  : function() { return this.style == "dynamic"; },
  isStatic   : function() { return !this.isDynamic();       },

  freeze: function() { this.fireEvent( "freeze" ); },
  thaw:   function() { this.fireEvent( "thaw" );   },

  at: function(left, top) {
    this.newTop  = top;
    this.newLeft = left;
    return this;
  },

  put: function(shape) {
    return this.add(shape);
  },

  add: function(shape) {
    var baseName = shape.getName().replace(/<.*$/,'');
    if( this.shapesMap[baseName] ) {
      // TODO: this.book dependency should be enforced
      var logger = this.book ? this.book : console;
      logger.log( "WARNING: Shape with name '" + baseName + 
                  "' already exists. Skipping." );
      return null;
    }

    var position = new Canvas2D.Position( shape, this.newLeft, this.newTop);
    shape   .on( "change", this.makeDirty.scope(this) );
    position.on( "change", this.makeDirty.scope(this) );

    this.newLeft = null;
    this.newTop = null;

    this.positions.push(position);
    this.shapesMap[baseName] = shape;
    this.positionsMap[shape.getName()] = position;

    this.fireEvent( "newShape", "added new shape" + 
    ( position.getLeft() != null ? 
    "@" + position.getLeft() + "," 
    + position.getTop() : "" ) );

    this.makeDirty();

    return shape;
  },

  getPosition: function getPosition(shape) {
    return this.positionsMap[shape.getName()];
  },

  hit: function(x,y) {
    for( var s = this.positions.length-1; s>=0; s-- ) {
      var position = this.positions[s];
      if( position.hit(x,y) ) {
        if( Canvas2D.Keyboard.keyDown(91) ||    // cmd
        Canvas2D.Keyboard.keyDown(17) )     // ctrl
        {
          // adding and removing
          if( this.selectedShapes.contains(position) ) {
            this.selectedShapes.remove(position);
          } else {
            this.selectedShapes.push(position);
          }
        } else {
          if( !this.selectedShapes.contains(position) ) {
            this.selectedShapes = [ position ];
          } else {
            // just clicked on already selected shape
            return;
          }
        }
        this.fireEvent( "shapeSelected", position );
        return;
      }
    }
    // no position was hit, so clearing the selection list
    this.selectedShapes = [];
  },

  hitArea: function( left, top, right, bottom ) {
    var newSelection =  
    ( Canvas2D.Keyboard.keyDown(91) || // cmd
    Canvas2D.Keyboard.keyDown(17) ) // ctrl
    ? this.selectedShapes : [];
    for( var s = this.positions.length-1; s>=0; s-- ) {
      if( this.positions[s].hitArea(left, top, right, bottom) ) {
        newSelection.push( this.positions[s] );
        this.fireEvent( "shapeSelected", this.positions[s] );
      }
    }
    this.selectedShapes = newSelection.unique();
  },

  handleMouseDown: function(pos) {
    if( !this.isDynamic() ) { return; }
    this.hit( pos.x, pos.y );
    this.currentPos = pos;
    this.makeDirty();
  },

  handleMouseUp: function(pos) {
    if( !this.isDynamic() ) { return; }
    this.selectedShapes.iterate(function(position) {
      this.fireEvent( "shapesMoved",
      "Shape moved to " + 
      position.left + ", " + position.top );
    }.scope(this) );
    this.showSelection   = false;
    this.makeDirty();
  },

  handleMouseDrag: function(pos) {
    if( !this.isDynamic() ) { return; }
    if( !this.showSelection && this.selectedShapes.length > 0 ) {
      this.moveCurrentSelection(pos.dx, pos.dy);
    } else {
      // we've lost our currentPos somewhere (probably a new sheet load)
      if( !this.currentPos ) { this.currentPos = pos; }
      this.showSelection = true;
      this.hitArea( this.currentPos.x, this.currentPos.y, pos.x, pos.y );
      this.selectionPos  = pos;
    }
    this.makeDirty();
  },

  selectAllShapes: function() {
    // FIXME: only selectable shapes (so no connectors)
    this.selectedShapes = [];
    this.positions.iterate( function(position) { 
      this.selectedShapes.push(position) 
    }.scope(this) );
    this.makeDirty();
  },

  moveCurrentSelection: function(dx, dy) {
    this.selectedShapes.iterate(function(position) {	
      position.move(dx, dy);
    }.scope(this) );
  },

  handleKeyDown: function(key) {
    if( Canvas2D.Keyboard.keyDown(16) ) { // shift + 
      switch(key) {
        case 37: this.moveCurrentSelection( -5,  0 ); break; // left
        case 38: this.moveCurrentSelection(  0, -5 ); break; // up
        case 39: this.moveCurrentSelection(  5,  0 ); break; // right
        case 40: this.moveCurrentSelection(  0,  5 ); break; // down
      }
    }
    if( ( Canvas2D.Keyboard.keyDown(91) ||    // cmd 
    Canvas2D.Keyboard.keyDown(17) ) &&  // ctrl +
    key == 65 &&                          // a
    this.canvas.mouseOver )
    {
      this.selectAllShapes();
    }
  },

  addSelectionOverlay: function() {
    if( this.showSelection ) { 
      var pos = this.selectionPos;
      var dx = pos.x - this.currentPos.x;
      var dy = pos.y - this.currentPos.y;

      this.canvas.fillStyle = "rgba( 0, 0, 255, 0.1 )";
      this.canvas.fillRect( pos.x <= this.currentPos.x ?  
        pos.x : this.currentPos.x, 
        pos.y <= this.currentPos.y ?
        pos.y : this.currentPos.y,
        Math.abs(dx), Math.abs(dy) );
    }
  },

  addSelectionMarkers: function() {
    this.selectedShapes.iterate( function(shape) {
      var box = shape.getBox();
      this.canvas.fillStyle = "rgba( 200, 200, 255, 1 )";
      [[ box.left, box.top    ], [ box.right, box.top    ],
      [ box.left, box.bottom ], [ box.right, box.bottom ]].iterate( 
        function(corner) {
          this.canvas.beginPath();
          this.canvas.arc( corner[0],  corner[1], 5, 0, Math.PI*2, true );
          this.canvas.fill();	
        }.scope(this) );
    }.scope(this) );
  },

  render: function() {
    var delayed = [];
    this.positions.iterate( function(shape) { 
      if( shape.delayRender() ) {
        delayed.push(shape);
      } else {
        shape.render(this); 
      }
    }.scope(this) );

    delayed.iterate( function(shape) { 
      shape.render(this); 
    }.scope(this) );

    this.addSelectionOverlay();
    this.addSelectionMarkers();
  },

  toADL: function() {
    var s = "";
    s += "Sheet "  + this.name;
    s += " +" + this.style + " {\n";
    this.positions.iterate(function(shape) { 
      var t = shape.toADL("  ");
      if( t ) { s += t + "\n"; }
    } );
    s += "}";
    return s;
  }
} );

// add-in some common functionality
ProtoJS.mix( Canvas2D.Factory.extensions.all.EventHandling, 
             Canvas2D.Sheet.prototype );

Canvas2D.Sheet.Properties = 
  [ "globalAlpha", "globalCompositeOperation",
    "strokeStyle", "fillStyle", "lineWidth", 
    "lineCap", "lineJoin", "miterLimit", 
    "shadowOffsetX", "shadowOffsetY", "shadowBlur", "shadowColor",
    "font", "textAlign", "textBaseline",
    "lineStyle", "useCrispLines", "textDecoration" ];

Canvas2D.Sheet.Operations = 
  [ "save", "restore", 
    "scale", "rotate", "translate", "transform", "setTransform",
    "createRadialGradient", "createPattern",
    "clearRect", "fillRect", "strokeRect",
    "beginPath", "closePath", "moveTo", "lineTo",
    "quadraticCurveTo", "bezierCurveTo", 
    "arcTo", "rect", "arc",
    "fill", "stroke", 
    "clip","isPointInPath", 
    "fillText","fillText","strokeText","strokeText","measureText",
    "drawImage","createImageData","getImageData","putImageData",
    "getFontSize", "fillStrokeRect" ];

Canvas2D.Sheet.from = function(construct, book) {
  var style = "static";
  var styleModifier = construct.modifiers.get( "style" );
  if( styleModifier ) {
    style = styleModifier.value.value.toLowerCase();
  }

  construct.modifiers.iterate(function(key, value) {
    if( key.toLowerCase() == "static" || key.toLowerCase() == "dynamic" ) {
      style = key.toLowerCase();
    }
  });

  return new Canvas2D.Sheet({ book: book, 
                              name: construct.name, style: style } );
};

Canvas2D.Sheet.MANIFEST = {
  name      : "sheet",
  properties : [],
  libraries : [ "Canvas2D" ]
};

Canvas2D.registerShape( Canvas2D.Sheet );
Canvas2D.Position = Class.extend( {
    init: function( shape, left, top ) {
	this.shape = shape;
	this.left  = left || null;
	this.top   = top  || null;
    },

    toADL: function(prefix) {
	var loc = "";
	if( this.left != null && this.top != null ) {
	    loc = prefix + "[@" + this.left + "," + this.top + "]\n";
	}
	return loc + this.shape.toADL(prefix);
    },

    getLeft: function() { return this.left; },
    getTop : function() { return this.top;  },

    getWidth : function() { return this.shape.getWidth();  },
    getHeight: function() { return this.shape.getHeight(); },
    
    getCenter: function() { 
	var center = this.shape.getCenter();
	center.left += this.left;
	center.top += this.top;
	return center;
    },

    getBox: function() {
	return { left  : this.left, 
		 right : this.left + this.shape.getWidth(),
		 top   : this.top,
		 bottom: this.top  + this.shape.getHeight() };
    },

    getPort: function(port) {
	var port = this.shape.getPort(port);
	port.left += this.left;
	port.top  += this.top;
	return port;
    },

    render: function( sheet ) {
	this.shape.render( sheet, this.left, this.top );
    },

    move: function( dleft, dtop ) {
	this.left += dleft;
	this.top  += dtop;
	this.fireEvent( "change", 
			"from " + this.left - dleft + "," + this.top - dtop +
			" to " + this.left + "," + this.top );
    },

    getName: function() {
	return this.shape.getName();
    },

    hit: function(x,y) {
	var rx = x - this.left;
	var ry = y - this.top;
	if( rx < 0 || ry < 0 ) { return false; }
	return this.shape.hit(rx, ry);
    },

    hitArea: function(left, top, right, bottom) {
	var rleft   = left   - this.left;
	var rtop    = top    - this.top;
	var rright  = right  - this.left;
	var rbottom = bottom - this.top;
	return this.shape.hitArea(min(rleft,rright), 
				  min(rtop,rbottom), 
				  max(rleft,rright), 
				  max(rtop,rbottom));

    },

    delayRender: function() {
	return this.shape.delayRender();
    }
});

ProtoJS.mix( Canvas2D.Factory.extensions.all.EventHandling,
	     Canvas2D.Position.prototype );
Canvas2D.Connector = Canvas2D.Shape.extend( {
  preprocess: function preprocess(props) {
    props = this._super(props);
    if( props.from == props.to ) { props.routing = "recursive"; }
    return props;
  },

  getFrom  : function getFrom(sheet) { 
    return sheet ? sheet.getPosition(this.from) : this.from; 
  },

  getTo    : function getTo(sheet) { 
    return sheet ? sheet.getPosition(this.to)   : this.to;   
  },

  delayRender: function delayRender() { return true; },

  isValid: function isValid() {
    return this.to != null && this.from != null;
  },

  draw: function draw(sheet, left, top) {
    if( !this.isValid() ) { return };
    
    sheet.save();
    sheet.useCrispLines = this.getUseCrispLines();
    sheet.strokeStyle   = this.getLineColor();
    sheet.lineWidth     = this.getLineWidth();
    sheet.lineStyle     = this.getLineStyle();

    sheet.beginPath();
    switch( this.getRouting() ) {
      case "custom":              this._custom    (sheet); break;
      case "recursive":           this._recursive (sheet); break;
      case "vertical":            this._vertical  (sheet); break;
      case "horizontal":          this._horizontal(sheet); break;
      case "direct":     default: this._direct    (sheet);
    }
    sheet.stroke();
    sheet.closePath();
    
    this.addLabels(sheet);
    
    sheet.restore();
  },
  
  _custom: function _custom(sheet) {
    var beginShape = this.getFrom(sheet);
    var endShape   = this.getTo(sheet);
    var start      = beginShape.getPort(this.getRouteBegin());
    var end        = endShape.getPort(this.getRouteEnd());
    // straight is a special case for direct
    if( this.getRouteStyle() == "straight" ) {
      if( this.getRouteBegin() == "e" || this.getRouteBegin() == "w" ) {
        var y = start.top - ( ( start.top - end.top ) / 2 );
        start.top = y;
        end.top   = y;
      } else {
        var x = start.left - ( ( start.left - end.left ) / 2 );
        start.left = x;
        end.left   = x;
      }
    }
    
    // label positions and alignment for begin and end
    var offset = { "e" : { left: +5, top: -5, align: "left"  },
                   "n" : { left: +5, top: -5, align: "left"  },
                   "w" : { left: -5, top: -5, align: "right" },
                   "s" : { left: +5, top: +10, align: "left"  } };

    var dir;
    if( this.getRouteBegin() ) {
      dir = this.getRouteBegin().substring(0,1);
      this.beginLabelPos = { left: start.left + offset[dir].left,
                             top:  start.top  + offset[dir].top };
      this.beginLabelAlign = offset[dir].align;
    } else {
      console.log( "WARNING: missing routeBegin on " + this.name );
    }

    if( this.getRouteEnd() ) {
      dir = this.getRouteEnd().substring(0,1);
      this.endLabelPos = { left: end.left + offset[dir].left,
                           top:  end.top  + offset[dir].top };
      this.endLabelAlign = offset[dir].align;
    } else {
      console.log( "WARNING: missing routeBegin on " + this.name );
    }
    
    // draw connectors
    end   = this._draw_end_connector(sheet, end)
    start = this._draw_start_connector(sheet, start)

    // choose special drawing algorithm
    switch( this.getRouteStyle() ) {
      case "corner"    : this._draw_corner   (sheet, start, end); break;
      case "tree"      : this._draw_tree     (sheet, start, end); break;
      case "recursive" : this._draw_recursive(sheet, start, end); break;
      default:
        var l = start.left - (( start.left - end.left ) / 2 );
        var t = start.top  - (( start.top  - end.top  ) / 2 );
        if( start.top == end.top ) { t -= 5; }
        this.centerLabelPos = { left: l, top: t };
    }
    sheet.lineTo( end.left, end.top );
  },
  
  addLabels: function addLabels(sheet) {
    if( this.getBeginLabel() && this.getBeginLabelPos() ) {
      this.addLabel( sheet, this.getBeginLabel(), 
                     this.getBeginLabelPos(), this.getBeginLabelAlign() );
    }
    if( this.getEndLabel() && this.getEndLabelPos() ) {
      this.addLabel( sheet, this.getEndLabel(),
                     this.getEndLabelPos(),   this.getEndLabelAlign() );
    }
    if( this.getCenterLabel() && this.getCenterLabelPos() ) {
      this.addLabel(sheet, this.getCenterLabel(),
                    this.getCenterLabelPos(), "center");
    }
  },
  
  addLabel: function addLabel(sheet, label, pos, align) {
    sheet.save();
    sheet.textAlign = align || "left";
    sheet.font = this.getLabelFont();
    sheet.fillText(label, pos.left, pos.top);
    sheet.restore();
  },
  
  getBeginLabelPos: function getBeginLabelPos() { 
    return this.beginLabelPos; 
  },
  
  getEndLabelPos: function getEndLabelPos() { 
    return this.endLabelPos; 
  },
  
  getCenterLabelPos: function getCenterLabelPos() { 
    return this.centerLabelPos; 
  },
  
  getBeginLabelAlign: function getBeginLabelAlign() {
    return this.beginLabelAlign || "left";    
  },
  
  getEndLabelAlign: function getEndLabelAlign() {
    return this.endLabelAlign || "left";
  },
  
  _draw_corner : function _draw_corner( sheet, start, end ) {
    var dir = this.getRouteBegin().substring(0,1);
    if( dir == "n" || dir == "s" ) {
      sheet.lineTo( start.left, end.top );
      this.centerLabelPos = { left: start.left, 
                              top: end.top + ( dir == "n" ? -5 : 10 ) };
    } else {
      sheet.lineTo( end.left, start.top );
      this.centerLabelPos = { left: end.left, 
                              top: start.top + ( dir =="e" ? -5 : 10 ) };      
    }
    sheet.lineTo( end.left, end.top   );
  },

  _draw_tree: function _draw_tree( sheet, start, end ) {
    var direction = this.getRouteBegin().substring(0,1);
    var dx = end.left - start.left;
    var dy = end.top  - start.top;
    if( direction == "n" || direction == "s" ) {
      sheet.lineTo( start.left, start.top + dy/2);
      sheet.lineTo( end.left  , start.top + dy/2);
      this.centerLabelPos = { left: start.left - ((start.left - end.left )/2),
                              top: start.top + (dy/2) + 10 };
    } else {
      sheet.lineTo( start.left + dx/2, start.top );
      sheet.lineTo( start.left + dx/2, end.top   );
      this.centerLabelPos = { left: start.left + (dx/2),
                              top: start.top - ((start.top - end.top )/2) - 5 };
    }    
  },

  _draw_recursive : function _draw_recursive(sheet, start, end) {
    var e = 30;
    var sl = start.left;  var st = start.top;
    var el = end.left;    var et = end.top;
    var mapping = { "e" : [ [ sl+e, st ], [ sl+e, et-e ], [ el, et-e ] ],
                    "n" : [ [ sl, st-e ], [ el-e, st-e ], [ el-e, et ] ],
                    "w" : [ [ sl-e, st ], [ sl-e, et+e ], [ el, et+e ] ],
                    "s" : [ [ sl, st+e ], [ el+e, st+e ], [ el+e, et ] ] };
    var orientation = this.getRouteBegin().substring(0,1);
    var d = mapping[orientation];

    sheet.lineTo( d[0][0], d[0][1] );
    sheet.lineTo( d[1][0], d[1][1] );
    sheet.lineTo( d[2][0], d[2][1] );

    var offset = { "e" : { left: 0, top: -5 }, 
                   "n" : { left: 0, top: -5 },
                   "w" : { left: 0, top: +10 },
                   "s" : { left: 0, top: +10 } };
    this.centerLabelPos = { left: d[1][0] + offset[orientation].left, 
                            top: d[1][1] + offset[orientation].top};
  },

  _draw_start_connector: function draw_start_connector(sheet, pos) {
    var connector = null;
    var dir       = this.getRouteBegin();

    if( this.getBegin() ) { 
      var connectors = this.getBegin();
      connector = connectors[dir] ? 
        connectors[dir] : connectors[dir.substring(0,1)];
    }

    return this._draw_connector(sheet, connector, pos.left, pos.top );
  },

  _draw_end_connector: function draw_start_connector(sheet, pos) {
    var connector = null;
    var dir       = this.getRouteEnd();

    if( this.getEnd() ) { 
      var connectors = this.getEnd();
      connector = connectors[dir] ? 
        connectors[dir] : connectors[dir.substring(0,1)];
    }

    return this._draw_connector(sheet, connector, pos.left, pos.top );
  },
  
  _draw_connector: function _draw_connector(sheet, connector, left, top) {
    sheet.moveTo(left, top);
    if( connector ) {
      var oldStyle = sheet.lineStyle;
      sheet.lineStyle = "solid";
      sheet.stroke();
      sheet.beginPath();
      sheet.moveTo(left, top);
      connector.lines.iterate(function(d){
        if(d == "fill") {
          sheet.fillStyle = "rgba( 0, 0, 0, 1 )";
          sheet.fill();
        } else {
          sheet.lineTo(left + d[0], top + d[1]);
        }
      });
      sheet.stroke();
      sheet.beginPath();
      sheet.lineStyle = oldStyle;
      sheet.moveTo(left + connector.end[0], top + connector.end[1]);
      return { left: left + connector.end[0], top: top + connector.end[1] };
    }
    return { left: left, top: top };
  },

  _direct: function _direct(sheet) {
    var from = this.getFrom(sheet).getCenter();
    var to   = this.getTo(sheet).getCenter();

    // top : left : [ from, to ]
    var mapping = { "-1" : { "-1" : [ "nw", "se" ],
                              "0" : [ "n" , "s"  ],
                              "1" : [ "ne", "sw" ] },
                    "0"  : { "-1" : [ "w" , "e"  ],
                              "0" : [ "n",  "s"  ],
                              "1" : [ "e",  "w"  ] },
                    "1"  : { "-1" : [ "sw", "ne" ],
                              "0" : [ "s",  "n"  ],
                              "1" : [ "se", "nw" ] } };
    var m = 100;                            
    var top  = to.top - from.top;
    top = Math.round( top / m ) * m;
    if( top != 0 ) { top /= Math.abs(top); }
    var left = to.left - from.left;
    left = Math.round( left / m ) * m;
    if( left != 0 ) { left /= Math.abs(left); }
    var route = mapping[top][left];

    // translate to new routing system
    this.routeStyle = 'direct';
    this.routeBegin = route[0];
    this.routeEnd   = route[1];

    // and call it
    this._custom(sheet);
  },
  
  _recursive: function _recursive(sheet) {
    this.routeStyle = "recursive";
    this.routeBegin = this.routeBegin || "ene";
    var mapping = { "nnw" : "wnw", "ene" : "nne",  
                    "wsw" : "ssw", "sse" : "ese" };
    this.routeEnd   = mapping[this.routeBegin];
    this._custom(sheet);
  },

  _vertical: function _vertical(sheet) {
    var from    = this.getFrom(sheet);
    var to      = this.getTo(sheet);
    var reverse = from.getBox().top < to.getBox().top;
    var dist1   = reverse ? to.getBox().top   - from.getBox().bottom
                          : from.getBox().top - to.getBox().bottom;
    var dist2   = reverse ? to.getCenter().top - from.getBox().bottom
                          : from.getCenter().top - to.getBox().bottom;
    
    if( dist1 >= Canvas2D.Connector.Defaults.minTreeDist ) {
      this.routeStyle = "tree";
      this.routeBegin = reverse ? "s" : "n";
      this.routeEnd   = reverse ? "n" : "s";
    } else if( dist2 >= Canvas2D.Connector.Defaults.minCornerDist ) {  
      this.routeStyle = "corner";
      this.routeBegin = reverse ? "s" : "n";
      this.routeEnd   = from.getPort(this.routeBegin).left < 
                          to.getPort("w").left ? "w" : "e";
    } else {
      this.routeStyle = "straight";
      this.routeBegin = from.getPort("e").left < 
                          to.getPort("w").left ? "e" : "w";
      this.routeEnd   = this.routeBegin == "e" ? "w" : "e";
    }
    this._custom(sheet);
  },

  _horizontal: function _horizontal(sheet) {
    var from    = this.getFrom(sheet);
    var to      = this.getTo(sheet);
    var reverse = from.getBox().left < to.getBox().left;
    var dist1   = reverse ? to.getBox().left   - from.getBox().right
                          : from.getBox().left - to.getBox().right;
    var dist2   = reverse ? to.getCenter().left - from.getBox().right
                          : from.getCenter().left - to.getBox().right;
    
    if( dist1 >= Canvas2D.Connector.Defaults.minTreeDist ) {
      this.routeStyle = "tree";
      this.routeBegin = reverse ? "e" : "w";
      this.routeEnd   = reverse ? "w" : "e";
    } else if( dist2 >= Canvas2D.Connector.Defaults.minCornerDist ) {  
      this.routeStyle = "corner";
      this.routeBegin = reverse ? "e" : "w";
      this.routeEnd   = from.getPort(this.routeBegin).top < 
                          to.getPort("n").top ? "n" : "s";
    } else {
      this.routeStyle = "straight";
      this.routeBegin = from.getPort("s").top < 
                          to.getPort("n").top ? "s" : "n";
      this.routeEnd   = this.routeBegin == "n" ? "s" : "n";
    }
    this._custom(sheet);
  },
  
  initialBranchLength: function initialBranchLength(top, bottom) {
    return ( bottom - top ) / 2;
  },

  hit: function hit(x,y) {
    // connectors aren't selectable (for now ;-))
    return false;
  },

  asConstruct: function asConstruct() {
    var construct = this._super();

    if( this.getFrom() && this.getTo() ) {
      construct.modifiers[this.getFrom().getName() + "-" +
                          this.getTo().getName()] = null;
    }

    construct.modifiers[this.getRouting()] = null;
    if( this.getRouting() == "custom" ) {
      construct.annotation.data = this.getRouteStyle() + ":" +
                                  this.getRouteBegin() + "-" +
                                  this.getRouteEnd();
    }

    construct.addModifiers( [ "lineColor", "lineStyle", "lineWidth", 
                              "begin", "end",
                              "beginLabel", "centerLabel", "endLabel" ] );

    if( this.getRouting() == "recursive" && this.getRouteBegin() != "ene" ) {
      construct.addModifiers( [ "routeBegin" ] );
    }
    return construct;
  }
} );

Canvas2D.Connector.from = function from(construct, sheet) {
  var props = { name: construct.name };
  construct.modifiers.iterate(function(key, value) {
    if( value.value == null ) {
      if( key.contains("-") ) {
        var parts = key.split( "-" );
        props["from"] = sheet.shapesMap[parts[0]];
        props["to"]   = sheet.shapesMap[parts[1]];
      } else {
        props["routing"] = key;
        if( key == "custom" && construct.annotation && 
            construct.annotation.data &&
            construct.annotation.data.contains(":") &&
            construct.annotation.data.contains("-") ) 
            {
              var parts = construct.annotation.data.split(":");
              props["routeStyle"] = parts[0];
              var ends = parts[1].split("-");
              props["routeBegin"] = ends[0];
              props["routeEnd"]   = ends[1];
            }
      }
    } else {
      props[key] = ( key == "from" || key == "to" ) ? 
        sheet.shapesMap[value.value.value] : value.value.value;
      if( key == "begin" || key == "end" ) {
        props[key] = Canvas2D.CustomConnectors[props[key]];
      }
    }
  });

  errors = [];
  warnings = [];
  if( !props['from'] ) {
      errors.push( "Missing FROM connection-end on " + construct.name );
  }
  if( !props['to'] ) {
    errors.push( "Missing TO connection-end on " + construct.name   );
  }
  if( !["vertical","horizontal","direct","custom"].has(props["routing"]) ){
    warnings.push( "unknown routing: " + props["routing"] + 
                   ", defaulting to direct." );
  }
  
  var result = {};
  
  if( warnings.length > 0 ) {
    result.warnings = warnings;
  }

  if( errors.length > 0 ) {
    result.errors = errors;
  } else {
    var elem = new Canvas2D.Connector( props );
    elem.warnings = result.warnings;
    result = elem;
  }

  return result;
};

Canvas2D.Connector.MANIFEST = {
  name         : "connector",
  aliasses     : [ "link" ],
  properties   : [ "lineColor", "lineStyle", "lineWidth", 
                   "from", "to", "begin", "end",
                   "routing", "routeStyle", "routeBegin", "routeEnd",
                   "beginLabel", "centerLabel", "endLabel" ],
  libraries    : [ "Canvas2D" ]
};

Canvas2D.registerShape( Canvas2D.Connector );

Canvas2D.CustomConnectors = {};
Canvas2D.registerConnector = function registerConnector( name, connector ) {
  Canvas2D.CustomConnectors[name] = connector;
}
Canvas2D.Line = Canvas2D.Shape.extend( {
    getWidth : function() { return this.getDx() },
    getHeight: function() { return this.getDy() },

    draw: function(sheet, left, top) {
	sheet.beginPath();

	sheet.strokeStyle = this.getColor();
	sheet.lineWidth = this.getLineWidth();
	sheet.lineStyle = this.getLineStyle();

	sheet.moveTo(left, top);
	sheet.lineTo(left + this.getDx(), top + this.getDy());
	sheet.stroke();
	// set lineStyle back to default
	sheet.lineStyle = "solid";

	sheet.closePath();
    },

    hit: function(x,y) { 
	return ( this.getWidth() >= x && this.getHeight() >= y ); 
    },

    hitArea: function(left, top, right, bottom) { 
	return ! ( 0 > right 
		   || this.getWidth() < left
		   || 0 > bottom
		   || this.getHeight() < top );
    },

    getCenter: function() {
	return { left: this.getWidth()  / 2, top:  this.getHeight() / 2 };
    },

    getPort: function(side) {
	switch(side) {
	case "n": case "north":  
	    return { top : 0,                left: this.getWidth() / 2 }; break;
	case "s": case "south":  
	    return { top : this.getHeight(), left: this.getWidth() / 2 }; break;
	case "e": case "east":
	    return { top : this.getHeight() / 2, left: this.getWidth() }; break;
	case "w": case "west":
	    return { top : this.getHeight() / 2, left: 0               }; break;
	}
    },

    getGeo: function() {
	return this.getWidth() && this.getHeight() ?
	    this.getWidth() + "x" + this.getHeight() : null;
    },

    asConstruct: function() {
	var construct = this._super();
	construct.addModifiers( [ "geo", "color" ] );
	return construct;
    }
} );

Canvas2D.Line.from = function( construct, sheet ) {
    var props = { name: construct.name };
    construct.modifiers.iterate(function(key, value) {
	value = ( value.value ? value.value.value : "" );

	if( key == "dx" || key == "dy" || key == "lineWidth" ) {
	    value = parseInt(value);
	} else if( value == "" ) {
	    value = key;
	    key = "color";
	}

	props[key] = value;
    } );

    return new Canvas2D.Line(props);
};

Canvas2D.Line.MANIFEST = {
    name     : "line",
    properties : [ "color", "dx", "dy", "lineWidth", "lineStyle" ],
    libraries: [ "Canvas2D" ]
};

Canvas2D.registerShape( Canvas2D.Line );
Canvas2D.LinePath = Canvas2D.Shape.extend( {
    getWidth : function() { return this.dx },
    getHeight: function() { return this.dy },

    getStart : function() { return this.start; },
    getMoves : function() { return this.moves; },

    preprocess : function(props) {
	if( props.start ) {
	    var parts = props.start.split(",");
	    props.start = { left:parseInt(parts[0]), top:parseInt(parts[1]) };
	} else {
	    props.start = { left:0, top:0 };
	}
	if( props.moves ) {
	    var moves = [];
	    var dx = max(0,props.start.left);
	    var dy = max(0,props.start.top );

	    props.moves.split(";").iterate( function(move) {
		var parts = move.split(",");
		moves.push( {dx:parseInt(parts[0]), dy:parseInt(parts[1])} );
		dx = max(dx, dx + parseInt(parts[0]));
		dy = max(dy, dy + parseInt(parts[1]));
	    });
	    props.moves = moves;
	    props.dx    = dx;
	    props.dy    = dy;
	}
	return props;
    },

    draw: function(sheet, left, top) {
	sheet.beginPath();
	sheet.strokeStyle = this.getColor();
	sheet.lineWidth = this.getLineWidth();
	sheet.lineStyle = this.getLineStyle();

	left += this.start.left;
	top  += this.start.top;
	sheet.moveTo(left, top);
	this.getMoves().iterate( function(move) {
	    left = left + move.dx;
	    top  = top  + move.dy;
	    sheet.lineTo(left, top);
	} );
	sheet.stroke();

	sheet.closePath();
    },

    hit: function(x,y) { 
	return ( this.getWidth() >= x && this.getHeight() >= y ); 
    },

    hitArea: function(left, top, right, bottom) { 
	return ! ( 0 > right 
		   || this.getWidth() < left
		   || 0 > bottom
		   || this.getHeight() < top );
    },

    getCenter: function() {
	return { left: this.getWidth()  / 2, top:  this.getHeight() / 2 };
    },

    getPort: function(side) {
	switch(side) {
	case "n": case "north":  
	    return { top : 0,                left: this.getWidth() / 2 }; break;
	case "s": case "south":  
	    return { top : this.getHeight(), left: this.getWidth() / 2 }; break;
	case "e": case "east":
	    return { top : this.getHeight() / 2, left: this.getWidth() }; break;
	case "w": case "west":
	    return { top : this.getHeight() / 2, left: 0               }; break;
	}
    },

    getGeo: function() {
	return this.getWidth() && this.getHeight() ?
	    this.getWidth() + "x" + this.getHeight() : null;
    },

    asConstruct: function() {
	var construct = this._super();
	construct.addModifiers( [ "geo", "color" ] );
	return construct;
    }
} );

Canvas2D.LinePath.from = function( construct, sheet ) {
    var props = { name: construct.name };
    construct.modifiers.iterate(function(key, value) {
	value = ( value.value ? value.value.value : "" );

	if( key == "dx" || key == "dy" || key == "lineWidth" ) {
	    value = parseInt(value);
	} else if( value == "" ) {
	    value = key;
	    key = "color";
	}

	props[key] = value;
    } );

    return new Canvas2D.LinePath(props);
};

Canvas2D.LinePath.MANIFEST = {
    name       : "linepath",
    properties : [ "dx", "dy", "start", "moves", "color", "lineWidth", "lineStyle" ],
    libraries  : [ "Canvas2D" ]
};

Canvas2D.registerShape( Canvas2D.LinePath );
Canvas2D.Alias = Canvas2D.Shape.extend( {} );

Canvas2D.Alias.mapper = {
    sheet : function(shape) { 
	return function(construct, parent) { 
	    var alias = Canvas2D.Sheet.from(construct, parent);
	    //alias.getType = function() { return shape.name; }
	    return alias;
	}
    },

    connector : function(shape) {
	return function(construct, parent) { 
	    var modifier = new ADL.Modifier( "routing", 
		                             new ADL.String("vertical" ) );
	    construct.modifiers.set( modifier.key, modifier );
	    var alias = Canvas2D.Connector.from(construct, parent);
	    //alias.getType = function() { return shape.name; }
	    return alias;
	}
    },

    image : function(shape) {
	var modifiers = shape.modifiers;
	return function( construct, parent ) {
	    modifiers.iterate(function(key, value) {
		construct.modifiers.set(key, value); 
	    } );
	    var alias = Canvas2D.Image.from(construct, parent);
	    //alias.getType = function() { return shape.name; }
	    return alias;
	}
    }
}

Canvas2D.Alias.from = function( construct, parent ) {
    Canvas2D.registerShape( { 
	prototype : {},
	MANIFEST : { 
	    name      : construct.name, 
	    libraries : [ "Aliasses" ] 
	},
	from: Canvas2D.Alias.mapper[construct.supers[0]](construct, parent)
    } );
};
    
Canvas2D.Alias.MANIFEST = {
    name     : "alias",
    aliasses : [ "shape" ],
    libraries: [] // not included in the end-user library, because it's not 
                  // a visible shape
};

Canvas2D.registerShape( Canvas2D.Alias );
Canvas2D.CompositeShape = Canvas2D.Shape.extend( {
    hasChildren: function hasChildren() {
	return this.getChildren().length > 0;
    },

    hit: function(x,y) {
	return ( this.getWidth() >= x && this.getHeight() >= y );
    },

    hitArea: function(left, top, right, bottom) {
	return ! ( 0 > right
		   || this.getWidth() < left
		   || 0 > bottom
		   || this.getHeight() < top );
    },

    getWidth: function getWidth(withoutGrowth) {
	if( this.grows 
	    && this.getParent().composition.widthGrows() 
	    && !withoutGrowth ) {
	    return this.getParent().getWidth(withoutGrowth);
	}

	if( this.hasChildren() ) {
	    return max( this.composition.getWidth(), this.width );
	}

	return this.width;
    },

    getHeight: function getHeight(withoutGrowth) {
	if( this.grows 
	    && this.getParent().composition.heightGrows() 
	    && !withoutGrowth ) 
	{
	    return this.getParent().getHeight(withoutGrowth);
	}

	if( this.hasChildren() ) {
	    return max( this.composition.getHeight(), this.height );
	}

	return this.height;
    },
    
    getChildren: function getChildren() {
	if(!this.children) { this.children = []; }
	return this.children;
    },

    preprocess: function preprocess(props) {
	props.composition = props["composition"] || "vertical-stack";
	var args = [];
	if( props.composition.contains( ":" ) ) {
	    args = props.composition.split(":");
	    props.composition = args.shift();
	}
	props.composition = 
	    new Canvas2D.Compositors[props.composition](args, this);
	return props;
    },

    draw: function(sheet, left, top) {
	this.getChildren().iterate( function(child) {
	    var d = this.composition.getPosition(child, this.getChildren());
	    child.render(sheet, left + d.left, top + d.top );
	}.scope(this) );
    },

    prepare: function(sheet) {
	this._super();
	if( this.hasChildren() ) {
	    this.prepareChildren(sheet);
	    this.composition.prepare();
	}
    },

    prepareChildren: function prepareChildren(sheet) {
	this.getChildren().iterate( function(child) {
	    child.prepare(sheet);
	} );
    },

    add: function add(child) {
	child.topDown = true; // this forces text to draw from the top down
	this.getChildren().push(child);
	child.setParent(this);
    },

    asConstruct: function() {
	var construct = this._super();
	// TODO
	return construct;
    }
} );

Canvas2D.CompositeShape.from = function( construct, sheet ) {
    var props = { name: construct.name };
    construct.modifiers.iterate(function(key, value) {
	value = ( value.value ? value.value.value : "" );

	if( "" + value == "" ) {
	    value = key;
	    key = "composition";
	}

	props[key] = value;
    } );

    return new Canvas2D.CompositeShape(props);
};

Canvas2D.CompositeShape.MANIFEST = {
    name         : "compositeShape",
    aliasses     : [ "group" ],
    properties   : [ "width", "height", "grows", "composition", "padding" ]
};

Canvas2D.registerShape( Canvas2D.CompositeShape );
Canvas2D.Compositors = {
    "vertical-stack": Class.extend( {
	init: function init(args, shape) {
	    this.align = args.contains("left") ? "left" :
		args.contains("right") ? "right" : "center";
	    this.shape = shape;
	},

	prepare: function prepare() {
	    this.left = 0;
	    this.top = 0;
	},

	getPadding: function getPadding() {
	    return parseInt(this.shape.padding ? this.shape.padding : 0);
	},

	getPosition: function(child) {
	    var dleft = this.getPadding();
	    var width = this.shape.getWidth();
	    if( this.align == "center" ) {
		dleft = ( width - child.getWidth() ) / 2;
	    } else if( this.align == "right" ) {
		dleft = width -  child.getWidth() - this.getPadding();
	    }
	    var top = this.top;
	    this.top += child.getHeight(); // for next child
	    return { left: this.left + dleft, 
		     top: top + this.getPadding() };
	},

	getWidth: function getWidth() {
	    // max width of all children
	    var width = 0;
	    this.shape.getChildren().iterate( function(child) {
		width = max( child.getWidth(child.grows), width );
	    });
	    return width + this.getPadding() * 2;
	},

	getHeight: function getHeight() {
	    // sum of all children's height
	    var height = 0;
	    this.shape.getChildren().iterate( function(child) {
		height += child.getHeight(child.grows);
	    });
	    return height + this.getPadding() * 2;
	},

	heightGrows: function heightGrows() { return false; },
	widthGrows : function widthGrows()  { return true;  }
    }),

    "horizontal-stack": Class.extend( {
	init: function init(args, shape) {
	    this.align = args.contains("top") ? "top" :
		args.contains("bottom") ? "bottom" : "center";
	    this.shape = shape;
	},
	
	prepare: function prepare() {
	    this.left = 0;
	    this.top = 0;
	},

	getPosition: function(child) {
	    var dtop = 0;
	    var height = this.shape.getHeight();
	    if( this.align == "center" ) {
		dtop = ( height - child.getHeight() ) / 2;
	    } else if( this.align == "bottom" ) {
		dtop = height - child.getHeight();
	    }
	    var left = this.left;
	    this.left += child.getWidth(); // next child
	    return { left: left, top: this.top + dtop };
	},

	getWidth: function getWidth() {
	    // sum of all children's width
	    var width = 0;
	    this.shape.getChildren().iterate( function(child) {
		width += child.getWidth(child.grows);
	    });
	    return width;
	},

	getHeight: function getHeight() {
	    // max height of all children
	    var height = 0;
	    this.shape.getChildren().iterate( function(child) {
		height = max(child.getHeight(child.grows), height);
	    });
	    return height;
	},

	heightGrows: function heightGrows() { return true;  },
	widthGrows : function widthGrows()  { return false; }
    })
};
Canvas2D.Rectangle = Canvas2D.CompositeShape.extend( {
  draw: function draw(sheet, left, top) {
    sheet.useCrispLines = this.getUseCrispLines();
    sheet.lineWidth     = this.getLineWidth();
    sheet.strokeStyle   = this.getLineColor();
    sheet.fillStyle     = this.getFillColor();
    var width  = this.getWidth();
    var height = this.getHeight();

    if( this.getRoundCorners() ) {
      this._drawRoundCorners(sheet, left, top, width, height);
    } else {
      this._drawStraightCorners(sheet, left, top, width, height);
    }
    this._super(sheet, left, top);
  },
  
  _drawRoundCorners: function _drawRoundCorners( sheet, left, top,
                                                 width, height )
  {
    sheet.beginPath();
    sheet.moveTo(left+20,top);

    sheet.lineTo(left+width-20,top);
    sheet.arcTo(left+width+0.5,top+0.5, left+width+0.5, top+20, 20);

    sheet.lineTo(left+width,top+height-20);
    sheet.arcTo(left+width+0.5, top+height+0.5, left+width-20, top+height+0.5, 20);

    sheet.lineTo(left+20, top+height);
    sheet.arcTo(left+0.5,top+height+0.5,left+0.5,top+height-20+0.5,20);

    sheet.lineTo(left, top+20);
    sheet.arcTo( left+0.5, top+0.5, left+20.5, top+0.5, 20);

    sheet.closePath();

    sheet.fill();
    sheet.stroke();
  },

  _drawStraightCorners: function _drawStraightCorners( sheet, left, top, 
                                                       width, height ) 
  {
    sheet.fillRect( left, top, width, height );
    sheet.strokeRect( left, top, width, height );
  },

  getCenter: function() {
    return { left: this.getWidth()  / 2, top:  this.getHeight() / 2 };
  },

  getPort: function(side) {
    var modifiers = { nw:  { left: 0,    top: 0   },
                      nnw: { left: 0.25, top: 0   },
                      n  : { left: 0.5,  top: 0   }, 
                      nne: { left: 0.75, top: 0   },
                      ne : { left: 1,    top: 0   },
                      ene: { left: 1,    top: 0.25},
                      e  : { left: 1,    top: 0.5 },
                      ese: { left: 1,    top: 0.75},
                      se : { left: 1,    top: 1   },
                      sse: { left: 0.75, top: 1   },
                      s  : { left: 0.5,  top: 1   },
                      ssw: { left: 0.25, top: 1   },
                      sw:  { left: 0,    top: 1   },
                      wsw: { left: 0,    top: 0.75},
                      w  : { left: 0,    top: 0.5 },
                      wnw: { left: 0,    top: 0.25} };
    
    if (!modifiers[side]) {
	return { left: 0, top: 0 };
    }
    
    return { left: modifiers[side].left * this.getWidth(),
             top:  modifiers[side].top  * this.getHeight() };
  },

  getGeo: function() {
    return this.getWidth() && this.getHeight() ?
    this.getWidth() + "x" + this.getHeight() : null;
  },
  
  asConstruct: function() {
    var construct = this._super();
    construct.addModifiers( [ "geo", "lineColor", "roundCorners" ] );
    return construct;
  }
} );

Canvas2D.Rectangle.from = function( construct, sheet ) {
  var props = { name: construct.name };
  
  construct.modifiers.iterate(function(key, value) {
    value = ( value.value ? value.value.value : "" );

    if( key == "width" || key == "height" ) {
      value = parseInt(value);
    }

    if( key == "geo" ) {
      props["width"]   = parseInt(value.split("x")[0]);
      props["height"]  = parseInt(value.split("x")[1]);
    }

    if( "" + value == "" ) {
      if( key == "roundCorners" ) {
        value = true;
      } else {
        value = key;
        key = "lineColor";
      }
    }

    props[key] = value;
  } );

  return new Canvas2D.Rectangle(props);
};

Canvas2D.Rectangle.MANIFEST = {
  name         : "rectangle",
  aliasses     : [ "box" ],
  properties   : [ "lineWidth", "lineColor", "fillColor", "roundCorners" ],
  propertyPath : [ Canvas2D.CompositeShape ],
  libraries    : [ "Canvas2D" ]
};

Canvas2D.registerShape( Canvas2D.Rectangle );
Canvas2D.Text = Canvas2D.Rectangle.extend( {
    prepare: function(sheet) {
	sheet.useCrispLines  = this.getUseCrispLines();
	sheet.strokeStyle    = this.getColor();
	sheet.fillStyle      = this.getColor();
	sheet.font           = this.getFont();
	sheet.textAlign      = this.getTextAlign();
	sheet.textDecoration = this.getTextDecoration();
	this.width  = sheet.measureText(this.getText());
	this.height = sheet.getFontSize();
    },

    draw: function(sheet, left, top) {
	if( this.getTopDown() ) { top += this.getHeight(); }
	sheet.fillText(this.getText(), left, top );
    },

    asConstruct: function() {
	var construct = this._super();
	construct.addModifiers( [ "color" ] );
	return construct;
    }
} );

Canvas2D.Text.from = function( construct, parent ) {
    var props = { name: construct.name, text: construct.value.value };
    construct.modifiers.iterate(function(key, value) {
	value = ( typeof value.value != "undefined" ? 
		      value.value.value : "" );
	props[key] = value;
    } );

    return new Canvas2D.Text(props);
};

Canvas2D.Text.MANIFEST = {
    name         : "text",
    properties   : [ "text", "color", "font", "textAlign","textDecoration" ],
    propertyPath : [ Canvas2D.Rectangle ],
    libraries    : [ "Canvas2D" ]
};

Canvas2D.registerShape( Canvas2D.Text );
Canvas2D.Image = Canvas2D.Rectangle.extend( {
    getSource : function() { return this.src;   },
    getImage  : function() { return this.image; },

    postInitialize: function() {
	if( this.getSource() ) {
	    this.image = 
		Canvas2D.ImageManager.load( this.getSource(), 
					    this.updateSize.scope(this) );
	}
    },

    updateSize: function() {
	this.width  = this.image.width;
	this.height = this.image.height;
    },

    draw: function(sheet,left,top) {
	sheet.drawImage(this.getImage(), left, top);
    },

    asConstruct: function() {
	var construct = this._super();
	construct.addModifiers( [ "source" ] );
	return construct;
    }
} );

Canvas2D.Image.from = function(construct, canvas) {
    var props = { name: construct.name };
    construct.modifiers.iterate(function(key, value) {
	props[key] = value.value.value;
    } );
    
    return new Canvas2D.Image(props);
};

Canvas2D.Image.MANIFEST = {
    name         : "image",
    aliasses     : [ "pic", "picture" ],
    properties   : [ "src" ],
    propertyPath : [ Canvas2D.Rectangle ],
    libraries    : [ "Canvas2D" ]
};

Canvas2D.registerShape( Canvas2D.Image );
Canvas2D.Arrow = Canvas2D.Rectangle.extend( {
    draw: function(sheet, left, top) {
	// rect
	sheet.useCrispLines = this.getUseCrispLines();
	sheet.lineWidth     = this.getLineWidth();
	sheet.strokeStyle   = this.getLineColor();
	sheet.fillStyle     = this.getFillColor();

	sheet.fillRect( left, 
		top, 
		this.getWidth() - this.getArrowHeadWidth(), 
		this.getHeight() );
	sheet.strokeRect( left, 
		top, 
		this.getWidth() - this.getArrowHeadWidth(), 
		this.getHeight() );

	// arrow head
	sheet.beginPath();

	sheet.moveTo(left + this.getWidth() - this.getArrowHeadWidth(), top);
	
	sheet.lineTo(left + this.getWidth() - this.getArrowHeadWidth(), 
		top + (this.getHeight() / 2) - (this.getArrowHeadHeight() / 2));
	sheet.lineTo(left + this.getWidth(), 
		top + (this.getHeight() / 2));
	sheet.lineTo(left + this.getWidth() - this.getArrowHeadWidth(), 
		top + (this.getHeight() / 2) + (this.getArrowHeadHeight() / 2));
	
	sheet.closePath();

	sheet.stroke();
	sheet.fill();
    },

    hit: function(x,y) {
	// FIXME
	return ( this.getWidth() >= x && this.getHeight() >= y ); 
    },

    hitArea: function(left, top, right, bottom) {
	// FIXME
	return ! ( 0 > right 
		   || this.getWidth() < left
		   || 0 > bottom
		   || this.getHeight() < top );
    },

    getCenter: function() {
	// FIXME
	return { left: this.getWidth()  / 2, top:  this.getHeight() / 2 };
    },

    getPort: function(side) {
	// FIXME
	switch(side) {
	case "n": case "north":  
	    return { top : 0,                left: this.getWidth() / 2 }; break;
	case "s": case "south":  
	    return { top : this.getHeight(), left: this.getWidth() / 2 }; break;
	case "e": case "east":
	    return { top : this.getHeight() / 2, left: this.getWidth() }; break;
	case "w": case "west":
	    return { top : this.getHeight() / 2, left: 0               }; break;
	}
    }
} );

Canvas2D.Arrow.from = function( construct, sheet ) {
    var props = { name: construct.name };
    construct.modifiers.iterate(function(key, value) {
	value = ( value.value ? value.value.value : "" );

	if( key == "width" || key == "height" ) {
	    value = parseInt(value);
	}

	if( key == "geo" ) {
	    props["width"]   = parseInt(value.split("x")[0]);
	    props["height"]  = parseInt(value.split("x")[1]);
	}

	if( "" + value == "" ) {
	    value = key;
	    key = "lineColor";
	}

	props[key] = value;
    } );

    return new Canvas2D.Arrow(props);
};

Canvas2D.Arrow.MANIFEST = {
    name         : "arrow",
    aliasses     : [ "pointer" ],
    properties   : [ "width", "height", "arrowHeadWidth", "arrowHeadHeight" ],
    propertyPath : [ Canvas2D.Rectangle ],
    libraries    : [ "Canvas2D" ]
};

Canvas2D.registerShape( Canvas2D.Arrow );
Canvas2D.Book.plugins.TabbedCanvas = Class.extend( {
  init: function(book) {
    this.book = book;
  },

  makeTab: function(name, height, content) {
    var tab = document.createElement("div");
    tab.className = "tabbertab";
    tab.style.height = ( 4 + parseInt(height) ) + "px";
    var head = document.createElement("h2");
    var txt = document.createTextNode(name);
    head.appendChild(txt);
    tab.appendChild(head);
    tab.appendChild(content);
    return tab;
  },

  getAboutTab: function() {
    var width  = this.book.canvas.canvas.width;
    var height = this.book.canvas.canvas.height;
    var about  = document.createElement("div");
    about.className = "Canvas2D-about";
    about.style.height = height + "px";
    about.style.width = (parseInt(width)-4)  + "px";

    var libraries = "";
    Canvas2D.extensions.iterate(function(library) {
      libraries += "\n<hr>\n";
      libraries += "<b>Library: " +
      library.name + " " + library.version + "</b> " + 
      "by " + library.author + "<br>" +
      library.info;
    });

    about.innerHTML = '<span class="Canvas2D-about-text">' +
    '<b>Canvas2D ' + Canvas2D.version  + 
    '</b><br>Copyright &copy 2009, ' +
    '<a href="http://christophe.vg" target="_blank">Christophe VG</a>'+ 
    ' & <a href="http://thesoftwarefactory.be" ' +
    'target="_blank">The Software Factory</a><br>' + 
    'Visit <a href="http://thesoftwarefactory.be/wiki/Canvas2D" ' +
    'target="_blank">http://thesoftwarefactory.be/wiki/Canvas2D</a> ' +
    'for more info. Licensed under the ' +
    '<a href="http://thesoftwarefactory.be/wiki/BSD_License" ' + 
    'target="_blank">BSD License</a>.' + libraries + '</span>';
    return this.makeTab("About", height, about );
  },

  getConsoleTab: function() {
    var width  = this.book.canvas.canvas.width;
    var height = this.book.canvas.canvas.height;
    this.book.console = document.createElement("textarea");
    this.book.console.className = "Canvas2D-console";
    this.book.console.style.height = height + "px";
    this.book.console.style.width  = ( parseInt(width) - 4 )  + "px";
    return this.makeTab("Console", height, this.book.console );
  },

  getSourceTab: function() {
    var width    = this.book.canvas.canvas.width;
    var height   = this.book.canvas.canvas.height;
    var oldValue = this.book.generated ? this.book.generated.value : "";
    this.book.generated = document.createElement("textarea");
    this.book.generated.value = oldValue;
    this.book.generated.className = "Canvas2D-source";
    this.book.generated.style.height = height + "px";
    this.book.generated.style.width  = ( parseInt(width) - 4 )  + "px";
    return this.makeTab("Source", height, this.book.generated );
  },

  applyTabber: function() {
    var source = this.book.canvas.canvas;

    this.tabber = document.createElement("div");
    this.tabber.className    = "tabber";
    this.tabber.style.width  = (parseInt(source.width)  + 17) + "px";
    this.tabber.style.height = (parseInt(source.height) + 37) + "px";
    source.parentNode.replaceChild(this.tabber, source);	

    var tab1 = document.createElement("div");
    tab1.className = "tabbertab";
    var h1 = document.createElement("h2");
    var t1 = document.createTextNode("Diagram");
    h1.appendChild(t1);
    tab1.appendChild(h1);
    tab1.appendChild(source);
    this.tabber.appendChild(tab1);
  },

  makeTabbed: function(tabs) {
    if( !this.tabber ) { this.applyTabber(); }
    if( typeof tabs.contains == "undefined" ) { return; }

    if( tabs.contains("console") ) { 
      this.tabber.appendChild(this.getConsoleTab());
    }
    if( tabs.contains("source") ) {
      this.tabber.appendChild(this.getSourceTab());
    }
    if( tabs.contains("about") ) { 
      this.tabber.appendChild(this.getAboutTab());
    }
    tabberAutomatic(); 
  }
} );

Canvas2D.Book.plugins.TabbedCanvas.exposes = [ "makeTabbed" ];
Canvas2D.Book.plugins.AutoLayout = Class.extend( {
    init: function(book) {
	this.book = book;
	this.active = false;
    },

    // this method is exposed and therefore called on a book
    autoLayout: function autoLayout(strategy) {
	this.strategy = strategy;
	this.strategy.start();
	this.active = true;
	this.book.rePublish();
    },

    beforeRender: function beforeRender(book) {
	if( !this.active ) { return; }

	var shapes = [];
	var shapeMap = $H();
	var c = 0;
	book.getCurrentSheet().positions.iterate( function( pos ) {
	    if( !(pos.shape instanceof Canvas2D.Connector) ) {
		shapes.push( { position: pos,
			       x: pos.left + pos.shape.getWidth()/2, 
			       y: pos.top + pos.shape.getHeight()/2, 
			       s: pos.shape.getWidth() > pos.shape.getHeight() ?
			       pos.shape.getWidth() : pos.shape.getHeight(),
			       f1: 0, f2: 0, 
			       c:[] } );
		shapeMap.set(pos.shape.getName(), parseInt(c++));
	    }
	} );

	// collect connectors
	book.getCurrentSheet().positions.iterate( function( pos ) {
	    if( pos.shape instanceof Canvas2D.Connector ) {
		var from = 
		    shapeMap.get(pos.shape.getFrom(book.getCurrentSheet()).getName());
		var to   = 
		    shapeMap.get(pos.shape.getTo(book.getCurrentSheet()).getName());
		shapes[from].c.push(to);
		shapes[to].c.push(from);
	    }
	} );

	
	// apply layout strategy
	shapes = this.strategy.layout(shapes);

	if( shapes ) {
	    shapes.iterate( function( shape ) {
		shape.position.left = 
		    shape.x - shape.position.shape.getWidth() / 2;
		shape.position.top  = 
		    shape.y - shape.position.shape.getHeight() / 2;
	    } );
	} else {
	    this.active = false;
	}
    },

    afterPublish: function afterPublish(book) {
	if( this.active ) { book.rePublish(); }
    }
} );
    
Canvas2D.Book.plugins.AutoLayout.exposes = [ "autoLayout" ];
    
var ForceLayoutStrategy = Class.extend( {
    init: function initialize(config) {
	this.max_repulsive_force_distance = 
	    config["max_repulsive_force_distance"] || 50;
	this.k = config["k"] || 20;
	this.c = config["c"] || 0.05;
	this.max_movement = config["max_movement"] || 10;
	this.max_iterations = config["max_iterations"] || 1000;
	this.render = config["render"] || function() {};
	this.canContinue = config["canContinue"] || 
	    function() { return false; };
    },
    
    getIterations: function getIterations() {
	return this.iteration;
    },
    
    start: function start() {
	this.iteration = 0;
    },
    
    layout: function layout(elements) {
	this.elements = elements;
	if( this.canContinue() ) {
	    if( this.iteration <= this.max_iterations ) { 
		this._layout();
		return this.elements;
	    }
	}
	return null;
    },
    
    _layout: function layout() {
	this.iteration++;
	if( this.canContinue() ) {
	    if( this.iteration <= this.max_iterations ) { 
		this._layout_iteration();
	    } else {
		console.log( "max iterations " + 
			     "(" + this.max_iterations + ") reached.");
	    }
	}
    },
    
    _layout_iteration: function _layout_iteration() {
	// reset forces
	for(var s=0; s<this.elements.length; s++) {
	    this.elements[s].f1 = 0;
	    this.elements[s].f2 = 0;
	}
	// repulse everybody (except self)
	for(var s=0; s<this.elements.length; s++) {
	    for(var o=0; o<this.elements.length; o++) {
		if( s !== o ) {
		    this._layout_repulsive(s, o);
		}
	    }
	}
	// attract if connected or self
	for(var s=0; s<this.elements.length; s++) {
	    for(var o=0; o<this.elements.length; o++) {
		if( s !== o && this.elements[o].c.indexOf(s) > -1 ) {
		    this._layout_attractive(s, o);
		}
	    }
	}
	
	// apply forces
	for(var s=0; s<this.elements.length; s++) {
	    var dx = this.c * this.elements[s].f1;
	    var dy = this.c * this.elements[s].f2;
	    var max = this.max_movement;
	    if( dx > max )      { dx = max; }
	    if( dx < max * -1 ) { dx = max * -1; }
	    if( dy > max )      { dy = max; }
	    if( dy < max * -1 ) { dy = max * -1; }
	    this.elements[s].x += dx;
	    this.elements[s].y += dy;
	}
    },
    
    _layout_repulsive: function _layout_repulsive(s, o) {
	var dx = this.elements[o].x - this.elements[s].x;
	var dy = this.elements[o].y - this.elements[s].y;
	
	var d2 = dx * dx + dy * dy;
	if( d2 < 0.01 ) {
	    dx = Math.random() + 0.1;
	    dy = Math.random() + 0.1;
	    d2 = dx * dx + dy * dy;
	}
	var d = Math.sqrt(d2);
	if( d < this.max_repulsive_force_distance) {
	    var repulsive_force = this.k * this.k / d;
	    
	    this.elements[o].f1 += repulsive_force * dx / d;
	    this.elements[o].f2 += repulsive_force * dy / d;
	    
	    this.elements[s].f1 -= repulsive_force * dx / d;
	    this.elements[s].f2 -= repulsive_force * dy / d;
	}
    },
    
    _layout_attractive: function _layout_attractive(s, o) {
	var dx = this.elements[o].x - this.elements[s].x;
	var dy = this.elements[o].y - this.elements[s].y;
	
	var d2 = dx * dx + dy * dy;
	if( d2 < 0.01 ) {
	    dx = Math.random() + 0.1;
	    dy = Math.random() + 0.1;
	    d2 = dx * dx + dy * dy;
	}
	var d = Math.sqrt(d2);
	if( d > this.max_repulsive_force_distance) {
	    d = this.max_repulsive_force_distance;
	    d2 = d * d;
	}
	var attractive_force = ( d2 - this.k * this.k ) / this.k;
	var weight = this.elements[s].s;
	if( weight < 1 ) { weight = 1; }
	attractive_force *= Math.log(weight) * 0.5 + 1;
	
	this.elements[o].f1 -= attractive_force * dx / d;
	this.elements[o].f2 -= attractive_force * dy / d;
	
	this.elements[s].f1 += attractive_force * dx / d;
	this.elements[s].f2 += attractive_force * dy / d;
    }
});
Canvas2D.Book.plugins.Watermark = Class.extend( {
    afterPublish: function afterPublish(book) {
      book.canvas.save();
      book.canvas.fillStyle = "rgba(125,125,125,1)";
      book.canvas.textDecoration = "none";
      book.canvas.rotate(Math.PI/2);
      var extensions = "";
      book.extensions.iterate(function(key, value) { 
        extensions += " + " + key; 
      });
      book.canvas.font = "6pt Sans-Serif";
      book.canvas.textAlign = "left";
      book.canvas.useCrispLines = false;
      book.canvas.lineStyle = "solid";
      book.canvas.fillText( "Canvas2D" + extensions + " / Christophe VG",
      3, (book.canvas.canvas.width * -1) + 7 +
      ( ProtoJS.Browser.IE ? 4 : 0 ) ); // if styleborder
      book.canvas.restore();
    }
} );
Canvas2D.KickStart = {};

Canvas2D.KickStart.Starter = Class.extend( {
    init: function() {
	this.manager = new Canvas2D.Manager();
    },
    
    getTag: function() {
	return "Canvas2D";
    },

    makeInstance: function( name ) {
	return this.manager.setupBook(name);
    },   

    start: function() {
	var htmlCanvases = document.getElementsByTagName( "canvas" );
	for(var c=0; c<htmlCanvases.length; c++ ) {
	    var htmlCanvas = htmlCanvases[c];
	    var classes = htmlCanvas.className;
	    if( classes.contains(this.getTag()) ) {
		var name = htmlCanvas.id;
		var book = this.makeInstance(htmlCanvas);
		if( classes.contains("Tabbed") ) {
		    var tabs = [];
		    if(classes.contains("withSource" )){ tabs.push("source" ); }
		    if(classes.contains("withConsole")){ tabs.push("console"); }
		    if(classes.contains("withAbout"  )){ tabs.push("about"  ); }
		    book.makeTabbed(tabs); 
		}
		var sourceElement = document.getElementById(name+"Source")
		if( sourceElement ) {
		    var source;
		    try {
			// some HTML element, PRE, DIV, ...
			source = sourceElement.firstChild.nodeValue;
		    } catch(err) {
			// TEXTAREA
			source = sourceElement.value;
		    }
		    book.load(source);
		}
	    }
	}
	this.fireEvent( "ready" );
	this.manager.startAll();
    }
} );


// add-in some common functionality
ProtoJS.mix( Canvas2D.Factory.extensions.all.EventHandling,
	     Canvas2D.KickStart.Starter.prototype );

Canvas2D.KickStarter = new Canvas2D.KickStart.Starter();
ProtoJS.Event.observe( window, 'load', 
		       function() { Canvas2D.KickStarter.start(); } );

Canvas2D.KickStarter.on( "ready",
			  function() { Canvas2D.fireEvent( "ready" );} );
Canvas2D.Defaults = {};

Canvas2D.Defaults.Canvas = {
    lineWidth      : 1,   
    useCrispLines  : true,
    lineStyle      : "solid",
    strokeStyle    : "black", 
    fillStyle      : "black", 
    font           : "10pt Sans-Serif", 
    textAlign      : "left", 
    textBaseline   : "alphabetic",
    textDecoration : "none"    
};

Canvas2D.Sheet.Defaults = { 
    lineWidth      : 1,   
    lineStyle      : "solid",
    strokeStyle    : "black", 
    fillStyle      : "black", 
    font           : "10pt Sans-Serif", 
    textAlign      : "left", 
    textBaseline   : "alphabetic",
    textDecoration : "none",
    shadowColor    : "rgba(0,0,0,0.0)"
};

// Shapes start here ...

Canvas2D.Shape.Defaults = {
    useCrispLines      : true,
    label              : "",
    labelFont          : "7pt Sans-Serif",
    labelAlign         : "center",
    labelPos           : "center",
    labelColor         : "black",
    labelUseCrispLines : false
};

Canvas2D.Rectangle.Defaults = {
    useCrispLines  : true,
    lineWidth      : 1,
    lineColor      : "rgba(0,0,0,100)",     // solid black
    fillColor      : "rgba(255,255,255,0)", // empty white ;-)
    labelPos       : "center",
    labelColor     : "black",
    width          : 50,
    height         : 50
};

Canvas2D.Connector.Defaults = {
    useCrispLines  : true,
    lineWidth      : 1, 
    lineColor      : "black", 
    lineStyle      : "solid",
    begin          : null, 
    end            : null,
    minTreeDist    : 30,
    minCornerDist  : 15
};
    
Canvas2D.Text.Defaults = {
    useCrispLines  : false,
    color          : "black",
    font           : "10pt Sans-Serif", 
    textAlign      : "left", 
    textDecoration : "none"
};

Canvas2D.Line.Defaults = {
    lineWidth      : 1,
    lineStyle      : "solid",
    labelPos       : "center",
    labelColor     : "black",
    color          : "black",
    dx             : 50,
    dy             : 50
};

Canvas2D.LinePath.Defaults = {
    lineWidth      : 1,
    lineStyle      : "solid",
    labelPos       : "center",
    labelColor     : "black",
    color          : "black"
};

Canvas2D.Image.Defaults = {

};

Canvas2D.Arrow.Defaults = {

};

Canvas2D.CompositeShape.Defaults = {

};


Canvas2D.version = "0.3-51";

