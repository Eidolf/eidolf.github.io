(function (name, definition) {

  if (typeof module != 'undefined') {
    module.exports = definition()
  } else if (typeof define == 'function' && typeof define.amd == 'object') {
    define(definition)
  } else {
    this[name] = definition()
  }

})('Colibri',
  function () {
    var $ = jQuery;
    if (typeof jQuery === 'undefined') {
      throw new Error('Colibri requires jQuery')
    }

    ;(function ($) {
      var version = $.fn.jquery.split('.');
      if (version[0] === 1 && version[1] < 8) {
        throw new Error('Colibri requires at least jQuery v1.8');
      }
    })(jQuery);

    var Colibri;

    var lib_prefix = "colibri.";

    ;(function () {
      // Inherits
      Function.prototype.inherits = function (parent) {
        var F = function () {
        };
        F.prototype = parent.prototype;
        var f = new F();

        for (var prop in this.prototype) {
          f[prop] = this.prototype[prop];
        }
        this.prototype = f;
        this.prototype.super = parent.prototype;
      };

      // Core Class
      Colibri = function (element, options) {
        options = (typeof options === 'object') ? options : {};

        this.$element = $(element);
        var instanceId = this.$element.data('colibri-id');

        var instanceData = Colibri.getData(instanceId);
        this.instance = instanceId;

        var elementData = this.$element.data();

        this.opts = $.extend(true, {}, this.defaults, $.fn[lib_prefix + this.namespace].options, elementData, instanceData, options);
        this.$target = (typeof this.opts.target === 'string') ? $(this.opts.target) : null;
      };

      Colibri.getData = function (id) {
        if (window.colibriData && window.colibriData[id]) {
          return window.colibriData[id];
        }

        return {};
      };

      Colibri.isCustomizerPreview = function () {
        return !!window.colibriCustomizerPreviewData;
      }
      // Core Functionality
      Colibri.prototype = {
        updateOpts: function (updatedData) {
          var instanceId = this.instance;
          var instanceData = $.extend(true, {}, this.defaults, Colibri.getData(instanceId));
          var updatedDataWithDefault = updatedData ? updatedData : {};
          this.opts = $.extend(true, this.opts, instanceData, updatedDataWithDefault);
        },
        getInstance: function () {
          return this.$element.data('fn.' + this.namespace);
        },
        hasTarget: function () {
          return !(this.$target === null);
        },
        callback: function (type) {
          var args = [].slice.call(arguments).splice(1);

          // on element callback
          if (this.$element) {
            args = this._fireCallback($._data(this.$element[0], 'events'), type, this.namespace, args);
          }

          // on target callback
          if (this.$target) {
            args = this._fireCallback($._data(this.$target[0], 'events'), type, this.namespace, args);
          }

          // opts callback
          if (this.opts && this.opts.callbacks && $.isFunction(this.opts.callbacks[type])) {
            return this.opts.callbacks[type].apply(this, args);
          }

          return args;
        },
        _fireCallback: function (events, type, eventNamespace, args) {
          if (events && typeof events[type] !== 'undefined') {
            var len = events[type].length;
            for (var i = 0; i < len; i++) {
              var namespace = events[type][i].namespace;
              if (namespace === eventNamespace) {
                var value = events[type][i].handler.apply(this, args);
              }
            }
          }

          return (typeof value === 'undefined') ? args : value;
        }
      };

    })();

    (function (Colibri) {
      Colibri.Plugin = {
        create: function (classname, pluginname) {
          pluginname = (typeof pluginname === 'undefined') ? classname.toLowerCase() : pluginname;
          pluginname = lib_prefix + pluginname;

          $.fn[pluginname] = function (method, options) {
            var args = Array.prototype.slice.call(arguments, 1);
            var name = 'fn.' + pluginname;
            var val = [];

            this.each(function () {
              var $this = $(this), data = $this.data(name);
              options = (typeof method === 'object') ? method : options;

              if (!data) {
                // Initialization
                $this.data(name, {});
                data = new Colibri[classname](this, options);
                $this.data(name, data);
              }

              // Call methods
              if (typeof method === 'string') {
                if ($.isFunction(data[method])) {
                  var methodVal = data[method].apply(data, args);
                  if (methodVal !== undefined) {
                    val.push(methodVal);
                  }
                } else {
                  $.error('No such method "' + method + '" for ' + classname);
                }
              }

            });

            return (val.length === 0 || val.length === 1) ? ((val.length === 0) ? this : val[0]) : val;
          };

          $.fn[pluginname].options = {};

          return this;
        },
        autoload: function (pluginname) {
          var arr = pluginname.split(',');
          var len = arr.length;

          for (var i = 0; i < len; i++) {
            var name = arr[i].toLowerCase().split(',').map(function (s) {
              return lib_prefix + s.trim();
            }).join(',');
            this.autoloadQueue.push(name);
          }

          return this;
        },
        autoloadQueue: [],
        startAutoload: function () {
          if (!window.MutationObserver || this.autoloadQueue.length === 0) {
            return;
          }

          var self = this;
          var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
              var newNodes = mutation.addedNodes;
              if (newNodes.length === 0 || (newNodes.length === 1 && newNodes.nodeType === 3)) {
                return;
              }

              self.startAutoloadOnce();
            });
          });

          // pass in the target node, as well as the observer options
          observer.observe(document, {
            subtree: true,
            childList: true
          });
        },

        startAutoloadOnce: function () {
          var self = this;
          var $nodes = $('[data-colibri-component]').not('[data-loaded]').not('[data-disabled]');
          $nodes.each(function () {
            var $el = $(this);
            var pluginname = lib_prefix + $el.data('colibri-component');

            if (self.autoloadQueue.indexOf(pluginname) !== -1) {
              $el.attr('data-loaded', true);
              try {
                $el[pluginname]();
              } catch (e) {
                console.error(e)
              }
            }
          });

        },
        watch: function () {
          Colibri.Plugin.startAutoloadOnce();
          Colibri.Plugin.startAutoload();
        }
      };

      $(window).on('load', function () {
        Colibri.Plugin.watch();
      });

    }(Colibri));

    (function (Colibri) {
      Colibri.Animation = function (element, effect, callback) {
        this.namespace = 'animation';
        this.defaults = {};

        // Parent Constructor
        Colibri.apply(this, arguments);

        // Initialization
        this.effect = effect;
        this.completeCallback = (typeof callback === 'undefined') ? false : callback;
        this.prefixes = ['', '-moz-', '-o-animation-', '-webkit-'];
        this.queue = [];

        this.start();
      };

      Colibri.Animation.prototype = {
        start: function () {
          if (this.isSlideEffect()) {
            this.setElementHeight();
          }

          this.addToQueue();
          this.clean();
          this.animate();
        },
        addToQueue: function () {
          this.queue.push(this.effect);
        },
        setElementHeight: function () {
          this.$element.height(this.$element.outerHeight());
        },
        removeElementHeight: function () {
          this.$element.css('height', '');
        },
        isSlideEffect: function () {
          return (this.effect === 'slideDown' || this.effect === 'slideUp');
        },
        isHideableEffect: function () {
          var effects = ['fadeOut', 'slideUp', 'flipOut', 'zoomOut', 'slideOutUp', 'slideOutRight', 'slideOutLeft'];

          return ($.inArray(this.effect, effects) !== -1);
        },
        isToggleEffect: function () {
          return (this.effect === 'show' || this.effect === 'hide');
        },
        storeHideClasses: function () {
          if (this.$element.hasClass('hide-sm')) {
            this.$element.data('hide-sm-class', true);
          } else if (this.$element.hasClass('hide-md')) {
            this.$element.data('hide-md-class', true);
          }
        },
        revertHideClasses: function () {
          if (this.$element.data('hide-sm-class')) {
            this.$element.addClass('hide-sm').removeData('hide-sm-class');
          } else if (this.$element.data('hide-md-class')) {
            this.$element.addClass('hide-md').removeData('hide-md-class');
          } else {
            this.$element.addClass('hide');
          }
        },
        removeHideClass: function () {
          if (this.$element.data('hide-sm-class')) {
            this.$element.removeClass('hide-sm');
          } else {
            if (this.$element.data('hide-md-class')) {
              this.$element.removeClass('hide-md');
            } else {
              this.$element.removeClass('hide');
              this.$element.removeClass('force-hide');
            }
          }

        },
        animate: function () {
          this.storeHideClasses();
          if (this.isToggleEffect()) {
            return this.makeSimpleEffects();
          }

          this.$element.addClass('colibri-animated');
          this.$element.addClass(this.queue[0]);
          this.removeHideClass();

          var _callback = (this.queue.length > 1) ? null : this.completeCallback;
          this.complete('AnimationEnd', $.proxy(this.makeComplete, this), _callback);
        },
        makeSimpleEffects: function () {
          if (this.effect === 'show') {
            this.removeHideClass();
          } else if (this.effect === 'hide') {
            this.revertHideClasses();
          }

          if (typeof this.completeCallback === 'function') {
            this.completeCallback(this);
          }
        },
        makeComplete: function () {
          if (this.$element.hasClass(this.queue[0])) {
            this.clean();
            this.queue.shift();

            if (this.queue.length) {
              this.animate();
            }
          }
        },
        complete: function (type, make, callback) {
          var events = type.split(' ').map(function (type) {
            return type.toLowerCase() + ' webkit' + type + ' o' + type + ' MS' + type;
          });

          this.$element.one(events.join(' '), $.proxy(function () {
            if (typeof make === 'function') {
              make();
            }
            if (this.isHideableEffect()) {
              this.revertHideClasses();
            }
            if (this.isSlideEffect()) {
              this.removeElementHeight();
            }
            if (typeof callback === 'function') {
              callback(this);
            }

            this.$element.off(event);

          }, this));
        },
        clean: function () {
          this.$element.removeClass('colibri-animated').removeClass(this.queue[0]);
        }
      };

      // Inheritance
      Colibri.Animation.inherits(Colibri);

    }(Colibri));

    (function ($) {
      var animationName = lib_prefix + 'animation';
      $.fn[animationName] = function (effect, callback) {
        var name = 'fn.animation';

        return this.each(function () {
          var $this = $(this), data = $this.data(name);

          $this.data(name, {});
          $this.data(name, (data = new Colibri.Animation(this, effect, callback)));
        });
      };

      $.fn[animationName].options = {};

      Colibri.animate = function ($target, effect, callback) {
        $target[animationName](effect, callback);
        return $target;
      }

    })(jQuery);

    (function (Colibri) {
      Colibri.Detect = function () {
      };

      Colibri.Detect.prototype = {
        isMobile: function () {
          return /(iPhone|iPod|BlackBerry|Android)/.test(navigator.userAgent);
        },
        isDesktop: function () {
          return !/(iPhone|iPod|iPad|BlackBerry|Android)/.test(navigator.userAgent);
        },
        isMobileScreen: function () {
          return ($(window).width() <= 768);
        },
        isTabletScreen: function () {
          return ($(window).width() >= 768 && $(window).width() <= 1024);
        },
        isDesktopScreen: function () {
          return ($(window).width() > 1024);
        }
      };
    }(Colibri));

    (function (Colibri) {
      Colibri.Utils = function () {
      };

      Colibri.Utils.prototype = {
        disableBodyScroll: function () {
          var $body = $('html');
          var windowWidth = window.innerWidth;

          if (!windowWidth) {
            var documentElementRect = document.documentElement.getBoundingClientRect();
            windowWidth = documentElementRect.right - Math.abs(documentElementRect.left);
          }

          var isOverflowing = document.body.clientWidth < windowWidth;
          var scrollbarWidth = this.measureScrollbar();

          $body.css('overflow', 'hidden');
          if (isOverflowing) {
            $body.css('padding-right', scrollbarWidth);
          }
        },
        measureScrollbar: function () {
          var $body = $('body');
          var scrollDiv = document.createElement('div');
          scrollDiv.className = 'scrollbar-measure';

          $body.append(scrollDiv);
          var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
          $body[0].removeChild(scrollDiv);
          return scrollbarWidth;
        },
        enableBodyScroll: function () {
          $('html').css({'overflow': '', 'padding-right': ''});
        }
      };


    }(Colibri));

    return Colibri;
  }
);
