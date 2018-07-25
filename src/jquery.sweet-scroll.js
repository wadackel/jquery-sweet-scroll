;(function(root, factory){
  "use strict";

  // CommonJS module.
  if( typeof module === "object" && typeof module.exports === "object" ){
    factory(require("jquery"));

  // AMD module.
  }else if( typeof define === "function" && define.amd ){
    define(["jquery"], factory);

  // Browser globals. root = window
  }else{
    factory(root.jQuery || root.Zepto);
  }


}(this, function($){
  "use strict";

  var version = "0.0.1",

      ns = "sweetscroll",

      defaults = {
        duration: 1200,           //"auto" or specifies animation duration in integer.
        delay: 0,                 //Specifies the milliseconds to start to scroll.
        easing: "easeOutQuint",   //Specifies the easing function of scroll.
        target: null,             //Specifies the target of the scroll position. Example => target: "#header"
        to: null,                 //Specifies the scroll positions.
        offset: 0,                //Adjust the scroll positions.
        autoCoefficient: 2,       //Coefficient for "auto" speed.
        stopScroll: true,         //Stop scrolling in any of the events of the wheel or touchstart(touchmove).
        changeHash: false,        //Change the hash after scrolled.
        verticalScroll: true,     //Enable the vertical scroll.
        horizontalScroll: false,  //Enable the horizontal scroll.
        loadedScroll: false,      //Scroll to the position of the hash when the page read.
        loadedScrollQuery: false, //The priority than the "loadedScroll".
        stopPropagation: true,    //Stop the bubbling of anchor click event.
        useVelocity: true,        //if velocity is possible to use from the jQuery or Zepto is used as an alternative to "animate()" method.

        // Callbacks
        beforeScroll: null,
        afterScroll: null,
        cancelScroll: null
      },

      MouseEvent = {
        CLICK: "click." + ns,
        WHEEL: ("onwheel" in document ? "wheel" : "onmousewheel" in document ? "mousewheel" : "DOMMouseScroll") + "." + ns
      },

      TouchEvent = {
        START: "touchstart." + ns,
        MOVE: "touchmove." + ns
      },

      Status = {
        ENABLE: 1,
        DISABLE: 2
      },

      optionKeys = $.map(defaults, function(v, k){ return k; }),
      loadedOptions, //Options to be used when the page read.
      cancelScrollEvents = [
        MouseEvent.WHEEL,
        TouchEvent.START,
        TouchEvent.MOVE
      ].join(" "),

      globalStatus = Status.ENABLE,
      currentTarget,
      selectors = [],
      disables = [],

      $win = $(window),
      $doc = $(document),
      $scrollElement,

      isZepto = typeof $.fn["jquery"] === "undefined",
      zeptoTween, //ZeptoTween instance.

      // Easing function that can be used by default. (Zepto and jQuery)
      ScrollEasings = {
        easeInQuint: function(x, t, b, c, d){
          return c * ( t /= d ) * t * t * t + b;
        },
        easeOutQuint: function(x, t, b, c, d){
          return -c * ( ( t = t / d - 1 ) * t * t * t - 1 ) + b;
        },
        easeInOutQuint: function(x, t, b, c, d){
          if( ( t /= d / 2 ) < 1 ) return c / 2 * t * t * t * t + b;
          return -c / 2 * ( ( t -= 2 ) * t * t * t - 2 ) + b;
        }
      };


  // Add if is no "ease****Quint" in $.easing.
  if( !isZepto && typeof $.easing["easeInQuint"] === "undefined" ){
    $.easing = $.extend($.easing, ScrollEasings);
  }


  /**
   * SweetScroll
   * @param object | string
   * @return void
   */
  function SweetScroll(options){
    if( $.type(options) === "string" ){
      return SweetScroll.callPublicMethod.apply(this, arguments);
    }

    var params = $.extend({}, defaults, options),
        $elem = params.$elem || $win,
        $scrollElement = SweetScroll.getScrollElement(params.verticalScroll);


    if( !$scrollElement || SweetScroll.isDisable() ) return;

    // stop the current animation
    SweetScroll.stop();

    var scroll = {},
        to = SweetScroll.formatCoodinate(params.to, params.verticalScroll),
        offset = SweetScroll.formatCoodinate(params.offset, params.verticalScroll);

    // `to` I will top priority the specified options.
    if( !$.isEmptyObject(to) ){
      scroll.scrollTop = to.top;
      scroll.scrollLeft = to.left;

    // get target offset
    }else{
      var strTarget = params.target || "",
          targetOffset,
          tmpOffset;

      if( !/[:,]/.test(strTarget) && $(strTarget).length > 0 ){
        targetOffset = $(strTarget).offset();
        if( !targetOffset ) return;
        scroll.scrollTop = targetOffset.top;
        scroll.scrollLeft = targetOffset.left;

      }else{
        tmpOffset = SweetScroll.formatCoodinate(strTarget.slice(1), params.verticalScroll);
        if( $.isEmptyObject(tmpOffset) ) return;
        scroll.scrollTop = tmpOffset.top;
        scroll.scrollLeft = tmpOffset.left;
      }
    }

    scroll.scrollTop += offset.top;
    scroll.scrollLeft += offset.left;

    // adjustment of scroll position
    var docSize = {
          width: $doc.width(),
          height: $doc.height()
        },
        winSize = {
          width: $win.width(),
          height: $win.height()
        };
    
    if( params.verticalScroll ){
      if( scroll.scrollTop + winSize.height > docSize.height ){
        scroll.scrollTop = docSize.height - winSize.height;
      }
    }
    
    if( params.horizontalScroll ){
      if( scroll.scrollLeft + winSize.width > docSize.width ){
        scroll.scrollLeft = docSize.width - winSize.width;
      }
    }

    if( !params.verticalScroll ) delete scroll.scrollTop;
    if( !params.horizontalScroll ) delete scroll.scrollLeft;

    // hook `beforeScroll`
    if( SweetScroll.hook($elem, "beforeScroll", params.beforeScroll, scroll) === false ){
      currentTarget = null;
      return;
    }

    $doc.on(cancelScrollEvents, function(e){
      currentTarget = null;

      if( params.stopScroll ){
        SweetScroll.stop($elem, params.cancelScroll);
      }else{
        e.preventDefault();
      }
    });

    var engine = isZepto ? "zepto" : "jquery",
        duration = isNumeric(params.duration) ? parseInt(params.duration) : duration;

    // Using the velocity only if the scroll direction is a single.
    if( params.useVelocity && $.isFunction($.fn["velocity"]) && $.map(scroll, function(key){ return key; }).length < 2 ){
      engine = "velocity";
    }

    SweetScroll.animate(scroll, params.delay, duration, params.easing, engine, params.autoCoefficient, function(){
      SweetScroll.stop();
      currentTarget = null;

      // change hash
      if( params.changeHash ){
        window.location.hash = SweetScroll.encodeCoodinate(params.to) || SweetScroll.encodeCoodinate(params.target);
      }

      // hook `afterScroll`
      SweetScroll.hook($elem, "afterScroll", params.afterScroll, scroll);
    });
  }

  /**
   * Call the public method with itself.
   * @param string
   * @param [...mixed]
   * @return mixed
   */
  SweetScroll.callPublicMethod = function(){
    var method = arguments[0],
        params = sliceArray(arguments, 1);
    return $.isFunction(SweetScroll[method]) ? SweetScroll[method].apply(SweetScroll, params) : null;
  };

  /**
   * Calls the callback and custom events
   * @param jQueryObject
   * @param string
   * @param function
   * @param [mixed...]
   * @return mixed
   */
  SweetScroll.hook = function(){
    var $elem = arguments[0],
        type = arguments[1],
        callback = arguments[2],
        params = sliceArray(arguments, 3),
        f = $.isFunction(callback) ? callback : function(){},
        v = f.apply($elem.get(0), params);

    // Fire custom event.
    var e, d = {};

    $.each(params, function(i, val){
      if( $.isPlainObject(val) ) d = $.extend(d, val);
    });

    e = new $.Event(ns+"."+type, d);
    $elem.trigger(e);

    return v;
  };

  /**
   * stop the scrolling animation.
   * @return void
   */
  SweetScroll.stop = function($elem, callback){
    if( !$scrollElement ) return;

    if( isZepto ){
      if( zeptoTween && zeptoTween.progress ){
        zeptoTween.stop();
        zeptoTween = null;
      }
    }else{
      $scrollElement.stop();
    }

    // for velocity
    if( $.isFunction($.fn["velocity"]) ){
      $scrollElement.velocity("stop");
    }

    $doc.off(cancelScrollEvents);

    // hook `cancelScroll`
    if( $elem ){
      SweetScroll.hook($elem || $win, "cancelScroll", callback);
    }
  };

  /**
   * wrapper method of "animate()"
   * @param object
   * @param integer
   * @param integer
   * @param string
   * @param string
   * @param integer
   * @param function
   * @return void
   */
  SweetScroll.animate = function(properties, delay, duration, easing, engine, autoCoefficient, callback){
    if( !$scrollElement ) return false;

    delay = delay || defaults.delay;
    duration = duration || defaults.duration;
    easing = easing || defaults.easing;
    engine = engine || ( isZepto ? "zepto" : "jquery" );
    callback = callback || function(){};

    // Automatically calculate the speed of the scroll based on distance / coefficient.
    var method = typeof properties.scrollTop !== "undefined" ? "scrollTop" : "scrollLeft";

    if( duration === "auto" ){
      var delta = properties[method] - $scrollElement[method]();
      delta *= delta < 0 ? -1 : 1;
      duration = parseInt(delta / autoCoefficient);
    }

    switch( engine ){

      // for velocity
      case "velocity":
        
        $scrollElement.velocity("scroll", {
          duration: duration,
          axis: method === "scrollTop" ? "y" : "x",
          delay: delay,
          easing: easing,
          offset: properties[method],
          queue: false,
          complete: function(){
            callback.call();
          }
        });
        break;

      // for Zepto
      case "zepto":
        zeptoTween = new ZeptoTween($scrollElement, properties, delay, duration, easing);
        zeptoTween.run(function(){
          zeptoTween = null;
          callback.call();
        });
        break;

      // for jQuery
      case "jquery":
        $scrollElement.delay(delay).animate(properties, duration, easing, function(){
          callback.call();
        });
        break;

      default:
        callback.call();
        break;
    }
  };

  /**
   * Specifies the operation after page load.
   * @param object
   * @return void
   */
  SweetScroll.loaded = function(options){
    loadedOptions = loadedOptions || $.extend({}, defaults, options);
  };

  /**
   * Enable processing of plugins that have been disabled.
   * @param string
   * @return void
   */
  SweetScroll.enable = function(selector){
    if( SweetScroll.isEnable(selector) ) return;

    if( typeof selector === "undefined" ){
      globalStatus = Status.ENABLE;
    }else{
      deleteArray(disables, selector);
    }
  };

  /**
   * Temporarily disable the this plugins.
   * @param string
   * @return void
   */
  SweetScroll.disable = function(selector){
    if( SweetScroll.isDisable(selector) ) return;

    SweetScroll.stop();

    if( typeof selector === "undefined" ){
      globalStatus = Status.DISABLE;
    }else{
      disables.push(selector);
    }
  };

  /**
   * Determine whether the plugin is enabled.
   * @param string
   * @return boolean
   */
  SweetScroll.isEnable = function(selector){
    var enable = globalStatus === Status.ENABLE;
    if( typeof selector === "undefined" ) return enable;
    return enable && $.inArray(selector, disables) === -1;
  };

  /**
   * Determine whether the plugin is disabled.
   * @param string
   * @return boolean
   */
  SweetScroll.isDisable = function(selector){
    return !SweetScroll.isEnable(selector);
  };

  /**
   * Remove all of the processing of this plugin.
   * @param string
   * @return void
   */
  SweetScroll.destroy = function(selector){
    SweetScroll.stop();

    // Remove an event handler, and array elements.
    if( typeof selector === "undefined" ){
      $doc.off(MouseEvent.CLICK);
      globalStatus = Status.DISABLE;
      disables = [];
      selectors = [];
    }else{
      $doc
        .off(MouseEvent.CLICK, selector) //Click event.
        .off(ns, selector); //Original events.
      deleteArray(disables, selector);
      deleteArray(selectors, selector);
    }

    currentTarget = null;
  };

  /**
   * Returns an object that contains the "top" and "left" by analyzing the various parameters.
   * @param mixed
   * @param boolean
   * @return object
   */
  SweetScroll.formatCoodinate = function(coodinate, verticalEnable){
    var obj = {};

    // object => {top:[0-9], left:[0-9]} or {(top|left): [0-9]}
    if( $.isPlainObject(coodinate) ){
      obj = $.extend({
        top: 0,
        left: 0
      }, coodinate);

    // array => [[0-9], [0-9]]
    }else if( $.isArray(coodinate) ){
      if( coodinate.length === 2 ){
        obj.top = coodinate[0];
        obj.left = coodinate[1];
      }else{
        obj.top = verticalEnable ? coodinate[0] : 0;
        obj.left = verticalEnable ? 0 : coodinate[0];
      }

    // numeric => [0-9] (The priority in the vertical position)
    }else if( isNumeric(coodinate) ){
      obj.top = verticalEnable ? coodinate : 0;
      obj.left = verticalEnable ? 0 : coodinate;

    // string
    }else if( $.type(coodinate) === "string" ){
      coodinate = removeSpaces(coodinate);

      // => [0-9], [0-9]
      if( /^[0-9]+,[0-9]+$/.test(coodinate) ){
        coodinate = coodinate.split(",");
        obj.top = coodinate[0];
        obj.left = coodinate[1];

      // top:[0-9], left:[0-9]
      }else if( /(top|left):([0-9]+),?/g.test(coodinate) ){
        obj = {
          top: coodinate.match(/top:([0-9]+)/) ? RegExp.$1 : 0,
          left: coodinate.match(/left:([0-9]+)/) ? RegExp.$1 : 0
        };
      }
    }

    if( typeof obj.top !== "undefined" ) obj.top = parseInt(obj.top);
    if( typeof obj.left !== "undefined" ) obj.left = parseInt(obj.left);

    return obj;
  };

  /**
   * encode the coordinates for the URL.
   * @param mixed
   * @return string
   */
  SweetScroll.encodeCoodinate = function(coodinate){

    // object => top:[0-9],left:[0-9]
    if( $.isPlainObject(coodinate) ){
      var results = [];
      if( typeof coodinate.top !== "undefined" ) results.push("top:" + coodinate.top);
      if( typeof coodinate.left !== "undefined" ) results.push("left:" + coodinate.left);
      return results.join(",");

    // array =>  top:[0-9],left:[0-9]
    }else if( $.isArray(coodinate) ){
      return coodinate.join(",");

    // string => remove spaces.
    }else if( $.type(coodinate) === "string" ){
      coodinate = removeSpaces(coodinate);
    }

    return coodinate;
  };

  /**
   * Get the element to be used for the scroll animation.
   * @param boolean
   * @return jQueryObject
   */
  SweetScroll.getScrollElement = function(verticalEnable){
    if( $scrollElement ) return $scrollElement;
    verticalEnable = typeof verticalEnable !== "undefined" ? verticalEnable : true;

    var $scrollElements = $("body,html"),
        scrollMethod = verticalEnable ? "scrollTop" : "scrollLeft";

    $scrollElements.each(function(){
      if( $(this)[scrollMethod]() > 0 ){
        $scrollElement = $(this);
        return false;
      }
    });

    if( !$scrollElement ){
      var current = $win[scrollMethod]();
      $win[scrollMethod]( current + 1 );

      $scrollElements.each(function(){
        if( $(this)[scrollMethod]() > 0 ){
          $scrollElement = $(this);
          return false;
        }
      });

      $win[scrollMethod]( current );
    }

    return $scrollElement;
  };


  /**
   * ZeptoTween
   * Minimal animation engine for Zepto. (Zepto use only)
   * 
   * Usage:
   *     var anim = new ZeptoTween($obj, {scrollTop:0}, 0, 1000);
   *     anim.stop(); //stop the animation.
   *     anim.run(function(){}); //run the animation.
   * 
   * @param jQueryObject
   * @param object
   * @param integer
   * @param integer
   * @param string
   * @return ZeptoTween
   */
  function ZeptoTween(){
    this.initialize.apply(this, arguments);
  }

  // This value is used to "setTimeout()".
  ZeptoTween.interval = 13; //ms

  // Set "requestAnimationFrame".
  ZeptoTween.frame = 
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function(callback){
      setTimeout(callback, ZeptoTween.interval);
    };

  // easing functions.
  ZeptoTween.easing = {
    // access in "linear"
    linear: function(p){
      return p;
    },
    easeInQuint: ScrollEasings.easeInQuint, //access in "ease-in-quint" or "easeInQuint"
    easeOutQuint: ScrollEasings.easeOutQuint, //access in "ease-out-quint" or "easeOutQuint"
    easeInOutQuint: ScrollEasings.easeInOutQuint, //access in "ease-in-out-quint" or "easeInOutQuint"
    easeIn: ScrollEasings.easeInQuint, //access in "ease-in" or "easeIn" (alias for easeInQuint)
    easeOut: ScrollEasings.easeOutQuint, //access in "ease-out" or "easeOut" (alias for easeOutQuint)
    easeInOut: ScrollEasings.easeInOutQuint //access in "ease-in-out" or "easeInOut" (alias for easeInOutQuint)
  };

  ZeptoTween.prototype = {
    initialize: function($elem, properties, delay, duration, easing){
      var _this = this;

      // options
      _this.$elem = $elem;
      _this.elem = $elem[0];
      _this.properties = properties || {};
      _this.delay = delay || 0;
      _this.duration = duration || 1000;
      _this.easing = $.camelCase(easing || "ease-out");
      _this.callback = null;

      // properties
      _this.progress = false;
      _this.startTime = null;
    },

    // Run the animation.
    run: function(callback){
      var _this = this;
      if( _this.progress || _this.$elem.length === 0 ) return;

      _this.progress = true;
      _this.callback = callback || function(){};

      // start animation frames.
      setTimeout(function(){

        // save current properties.
        _this.startTime = Date.now();
        _this.startProperties = {};
        $.each(_this.properties, function(key){
          _this.startProperties[key] = _this.getValue(key) || 0;
        });

        // Run!!
        _this.frame(_this.render);
      }, _this.delay);
    },

    // Stop the animation.
    stop: function(gotoEnd){
      this.progress = false;
      if( gotoEnd === true && $.isFunction(this.callback) ){
        this.callback.call(this);
      }
      this.callback = null;
    },

    // Alias for ZeptoTween#frame()
    // binding on the ZeptoTween instance.
    frame: function(callback){
      ZeptoTween.frame.call(window, $.proxy(callback, this));
    },

    // Update some properties.
    render: function(){
      if( !this.progress ) return;

      var _this = this,
          toProperties = {},
          currentTime = Date.now(),
          easing = ZeptoTween.easing[_this.easing],
          t = Math.min(1, Math.max((currentTime - _this.startTime) / _this.duration, 0));

      $.each(_this.properties, function(key, value){
        var initialValue = _this.startProperties[key],
            delta = value - initialValue,
            val;

        if( delta === 0 ) return true;

        val = easing(t, _this.duration * t, 0, 1, _this.duration);
        val = Math.round(initialValue + delta * val);

        if( val !== value ){
          toProperties[key] = val;
        }
      });

      if( $.isEmptyObject(toProperties) ){
        _this.stop();
        return;
      }

      // Set the amount of movement.
      $.each(toProperties, function(key, value){
        _this.setValue(key, value);
      });

      _this.frame(_this.render);
    },

    // Support css() or setter functions.
    setValue: function(key, value){
      if( this.$elem.css(key) ) this.$elem.css(key, value);
      else if( $.isFunction(this.$elem[key]) ) this.$elem[key](value);
      return this;
    },

    // Support css() or getter functions.
    getValue: function(key){
      var val = this.$elem.css(key);
      if( isNumeric(val) ) return parseFloat(val);
      else if( $.isFunction(this.$elem[key]) ) return this.$elem[key]();
      return null;
    }
  };


  SweetScroll.version = version;


  // Register the jQuery or Zepto public method.
  $.sweetScroll = SweetScroll;



  // Register the jQuery or Zepto plugin method.
  $.fn.sweetScroll = function(options){

    if( $.type(options) === "string" ){
      SweetScroll(options, $(this).selector);
      return this;
    }

    var selector = $(this).selector;

    // Overwrite parametors.
    if( $.inArray(selector, selectors) > -1 ){
      deleteArray(selectors, selector);
      $doc.off(MouseEvent.CLICK, selector);
    }

    selectors.push(selector);


    // Click event
    $doc.on(MouseEvent.CLICK, selector, function(e){
      if( SweetScroll.isDisable(selector) ) return;
      if( currentTarget === e.target ) return;
      currentTarget = e.target;

      var $this = $(currentTarget),
          params = $.extend({}, defaults, options),
          dataOptions = {},
          val;

      e.preventDefault();
      if( params.stopPropagation ) e.stopPropagation();

      params.$elem = $this;
      params.target = $this.attr("href");

      // Parse custom data attributes.
      $.each(optionKeys, function(i, d){
        val = $this.data($.camelCase(d.toLowerCase()));
        if( typeof val !== "undefined" ){
          dataOptions[d] = val;
        }
      });

      // Merge custom data attributes and options. 
      params = $.extend(params, dataOptions);

      // Call the public method.
      SweetScroll(params);
    });

    return this;
  };


  // DOMContentLoaded
  $(function(){
    if( $.isPlainObject(loadedOptions) ){
      if( !loadedOptions.loadedScroll && !loadedOptions.loadedScrollQuery ) return;

      // parse to hash and querystring
      var location = window.location,
          hash = loadedOptions.loadedScrollQuery ? location.search.replace("?", "#") : location.hash,
          to = SweetScroll.formatCoodinate(hash);

      if( !/[:,]/.test(hash) && $(hash).length > 0 ){
        loadedOptions = $.extend(loadedOptions, {target: hash});
        location.hash = "";
      }else{
        loadedOptions = $.extend(loadedOptions, {to: to});
      }

      SweetScroll(loadedOptions);
    }
  });



  /**
   * =============================================================
   * Helper Functions
   * =============================================================
   */
  function deleteArray(array, value){
    var i = $.inArray(value, array);
    if( i > -1 ) array.splice(i, 1);
    return array;
  }

  function sliceArray(array, start, end){
    return Array.prototype.slice.call(array, start, end !== undefined ? end : array.length);
  }

  function removeSpaces(str){
    return str.replace(/\s*/g, "") || "";
  }

  function isNumeric(value){
    return !$.isArray(value) && (value - parseFloat(value) + 1) >= 0;
  }


}));