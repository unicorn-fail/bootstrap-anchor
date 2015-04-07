+function ($) {
  'use strict';

  // ANCHOR PUBLIC CLASS DEFINITION
  // ====================

  var Anchor = function (element, options) {
    this.$anchor    = null
    this.dom        = null
    this.id         = null
    this.link       = null
    this.originalId = null
    this.scrollTop  = null
    this.scrolling  = null
    this.init('anchor', element, options)
  };

  if (!$.fn.tooltip || !$.fn.tooltip.Constructor.VERSION || $.fn.tooltip.Constructor.VERSION < "3.3.4") throw new Error('Anchor requires tooltip.js, version 3.3.4 or greater.')

  Anchor.VERSION  = '1.0.0'

  Anchor.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
    duration: 300,
    exclude: '[data-anchor-ignore],[data-dismiss],[data-slide],[data-toggle]:not([data-toggle="anchor"])',
    generate: true,
    generatePrefix: false,
    history: 'append',
    icon: '<span class="glyphicon glyphicon-link" aria-hidden="true"></span>',
    link: 'a[href*="#"],[data-toggle="anchor"]',
    margin: 20,
    normalize: true,
    onHashchange: true,
    onLoad: true,
    placement: 'auto left',
    selector: false,
    target: false,
    template: '<div class="anchor-link" role="tooltip"><a href="#"></a></div>',
    trigger: {
      anchor: 'hover focus',
      link: 'click'
    },
    unique: true,
    viewport: {
      selector: 'body',
      padding: 0
    }
  })

  Anchor.proxy = function (method, constructor) {
    constructor = constructor || $.fn.tooltip.Constructor
    return function () {
      constructor.prototype[method].apply(this.getDelegate.apply(this, arguments), arguments)
    }
  }

  // NOTE: ANCHOR EXTENDS tooltip.js
  // ================================

  Anchor.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype)

  // Proxy the following methods so they are executed with the correct delegate.
  var methods = ['enter', 'leave', 'hide', 'show', 'toggle']
  for (var i = 0, l = methods.length; i < l; i++) {
    Anchor.prototype[methods[i]] = Anchor.proxy(methods[i])
  }

  Anchor.prototype.constructor = Anchor

  Anchor.prototype.getDefaults = function () {
    return Anchor.DEFAULTS
  }

  Anchor.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), options, this.$element.data())

    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay,
        hide: options.delay
      }
    }

    return options
  }

  Anchor.prototype.getPosition = function ($element) {
    // Temporarily override the container so it can determine the proper
    // placement of the tooltip.
    if (!$element && !this.options.previousContainer) {
      this.options.previousContainer = this.options.container
      this.options.container = this.$viewport
    }
    // Restore the previous container the next time this is executed.
    else if (this.options.previousContainer) {
      this.options.container = this.options.previousContainer
      delete this.options.previousContainer
    }

    // Hi-jack which element is to be used for the to position of the tooltip.
    // In our case, it is the anchor wrapper instead of this.$element.
    if (!$element) $element = this.getWrapper()

    // Proxy to the Tooltip plugin.
    return $.fn.tooltip.Constructor.prototype.getPosition.apply(this, [$element])
  }

  Anchor.prototype.hasContent = function () {
    return this.id && this.$anchor && this.options.icon && this.options.icon.length
  }

  Anchor.prototype.setContent = function () {
    var self = this
    var $tip  = this.tip().removeClass('fade in')
    $tip.find('a')
      .attr('href', '#' + this.id)
      .attr('data-anchor-ignore', 'true')
      .off('click.bs.' + this.type)
      .on('click.bs.' + this.type, function (e) {
        e.preventDefault()
        e.stopPropagation()
        self.scrollTo()
      })
      .html(this.options.icon)
  }

  // ANCHOR CLASS DEFINITION
  // ====================

  Anchor.prototype.init = function (type, element, options) {
    this.enabled    = true
    this.type       = type
    this.$element   = $(element)
    this.options    = this.getOptions(options)
    this.$viewport  = this.options.viewport && $(this.options.viewport.selector || this.options.viewport)
    this.dom        = this.isDOM()
    this.$anchor    = this.getAnchor()
    this.link       = this.isLink()
    this.id         = this.getID()

    var bindSelectors = this.getBindSelectors(this.options.selector, '>.' + this.type + '-wrapper')
    var linkSelectors = this.getBindSelectors(this.options.link)

    if (this.dom) {
      if (!bindSelectors || !bindSelectors.length) throw new Error('`selector` option must be specified when initializing ' + this.type + ' on any top level DOM object!')
      // Ensure that $element is always the document for correct bindings.
      this.$element = $(document)
    }

    var exclude = this.getExclude()
    var $element = this.dom || !exclude ? this.$element : this.$element.not(exclude)

    var triggers = this.getTriggers()
    for (var triggerType in triggers) {
      if (!triggers.hasOwnProperty(triggerType)) continue
      var triggersArray = triggers[triggerType] && typeof triggers[triggerType] === 'string' && triggers[triggerType].length && triggers[triggerType].split(' ') || []
      for (var ti = triggersArray.length; ti--;) {
        var trigger = triggersArray[ti]
        if (trigger === 'click') {
          if (triggerType === 'link') $element.on('click.bs.' + this.type, linkSelectors, $.proxy(this.scrollTo, this))
          else $element.on('click.bs.' + this.type, bindSelectors, $.proxy(this.toggle, this))
        }
        else if (triggerType !== 'link' && trigger !== 'manual') {
          $element.on((trigger === 'hover' ? 'mouseenter' : 'focusin') + '.bs.' + this.type, bindSelectors, $.proxy(this.enter, this))
          $element.on((trigger === 'hover' ? 'mouseleave' : 'focusout') + '.bs.' + this.type, bindSelectors, $.proxy(this.leave, this))
        }
      }
    }

    // Global DOM binding using the "selector" option.
    if (this.dom) {
      this._options = $.extend({}, this.options, { 'trigger': 'manual', selector: '' })

      // Immediately initialize the anchors if either of these options are used.
      if (this.options.normalize || this.options.generate) {
        // Use the original selector option for performance.
        $(this.options.selector).not(exclude).anchor(this._options);
      }

      // Scroll to anchor on page load.
      if (this.options.onLoad) {
        if (document.readyState === 'complete') this.scrollToHash()
        else $(window).on('load.bs.' + this.type, $.proxy(this.scrollToHash, this))
      }

      // Scroll to the anchor on hashchange.
      if (this.options.onHashchange) $(window).on('hashchange.bs.' + this.type, $.proxy(this.scrollToHash, this))

      var self = this
      $(window).on('scroll.bs.' + this.type, function () {
        self.scrollTop = self.getPosition(self.$viewport).scroll
      })
    }
    else if (!this.link) {
      if (!this.id) {
        this.$anchor = false
      }

      // Hi-jack the container that the tooltip is to be attached to. This is
      // so it can be appended inside this.$element instead of after it.
      if (this.$anchor) {
        this.options.originalContainer = this.options.container
        this.options.container = this.getWrapper()
      }
    }
  }

  Anchor.prototype.getAnchor = function () {
    // Immediately return the anchor is currently already set.
    if (this.$anchor !== null) return this.$anchor || false

    var $target, el = this.$element[0]

    // DOM elements aren't anchors.
    if (this.isDOM()) {
      return false
    }
    // Look for an anchor if the "target" option was set.
    else if (this.options.target) {
      $target = $(this.options.target).first()
      return $target[0] && $target || false
    }
    // Attempt to extract the hash if the element is a link.
    else if (this.isLink()) {
        var hash = el && this.$element[0].nodeName === 'A' &&
            // Verify the link goes to an anchor on the same page.
          el.host === window.location.host &&
          el.pathname === window.location.pathname &&
          el.search === window.location.search &&
          el.hash

        // HTML5 specs state that the first element with a matching ID attribute
        // is to be selected first. If no element is found, the deprecated A
        // element with a name attribute should be checked instead.
        // @see http://www.w3.org/html/wg/drafts/html/master/browsers.html#scroll-to-the-fragment-identifier
        hash = hash && hash.replace(/^#/, '') || hash
        if (hash && hash.length) {
          $target = $('#' + hash + ', a[name="' + hash + '"]').first()
          return $target[0] && $target || false
        }
        return false
      }
    // Otherwise, just return the current element.
    return el && this.$element || false
  }

  Anchor.prototype.getBindSelectors = function (selector, suffix) {
    selector = selector && selector.split(/\s*,\s*(?![^(]*\))/ig) || false
    if (selector) {
      var selectors = [];
      var exclude = this.getExclude()
      exclude = exclude ? ':not(' + exclude + ')' : ''
      for (var si = 0, sl = selector.length; si < sl; si++) {
        selectors.push(selector[si] + exclude + (suffix ? suffix : ''))
      }
      selector = selectors.join(',')
    }
    return selector;
  }

  // @todo There should really be a Tooltip method that this overrides.
  Anchor.prototype.getDelegate = function (obj, $target) {
    if (obj instanceof this.constructor) return obj
    if (!this.isDOM()) return this

    $target = $target || obj instanceof jQuery.Event && $(obj.currentTarget) || $()

    // Ensure the original element is the target and not it's wrapper.
    if ($target.is('.' + this.type + '-wrapper')) {
      $target = $target.parent()
      if (obj.currentTarget) obj.currentTarget = $target[0]
    }

    var self = $target.data('bs.' + this.type)
    if (!self) {
      self = new this.constructor($target[0], this.getDelegateOptions())
      $target.data('bs.' + this.type, self)
    }
    return self
  }

  Anchor.prototype.getExclude = function () {
    var exclude = this.options.exclude || false;
    if (exclude && typeof exclude === 'function') exclude = this.options.exclude.call(this)
    if (exclude && typeof this.options.exclude !== 'string') exclude = false
    return exclude
  }

  Anchor.prototype.getID = function (original, force) {
    if (this.isDOM()) {
      this.id = this.originalId = false
      return this.id
    }

    var dynamic = typeof this.options.id === 'function' || typeof this.options.originalId === 'function'
    if (this.id !== null && !dynamic && !force) return original ? this.originalId : this.id

    this.originalId = typeof this.options.originalId === 'function' && this.options.originalId.call(this) || this.options.originalId || false
    this.id = typeof this.options.id === 'function' && this.options.id.call(this) || this.options.id || this.originalId || false

    if (!this.id) {
      var el = this.$element[0]
      var id = el && el.id || el && el.nodeName === 'A' && el.name

      // Normalize the ID.
      if (this.options.normalize) {
        // Attempt to find an adjoining named A tag, if element isn't already one.
        if (!this.id && !this.$element.is('a[name]')) {
          var $named, traverse = ['next', 'prev', 'find']
          for (var i = traverse.length; i--;) {
            $named = this.$element[traverse[i]]('a[name]:empty')
            if ($named[0] && !id) { // Don't override existing ID
              id = $named[0].id || $named[0].name
              break
            }
          }
        }
        if (id) this.$element.attr('data-original-id', id)
      }

      if (id) this.$element.removeAttr('id')
      if (el && el.nodeName === 'A' && el.name) this.$element.removeAttr('name')
      this.id = this.originalId = id || false

      // Extract the ID from the element.
      if (!this.id && !this.link && this.options.generate) {
        this.id = this.$element.text()
          // Replace spaces, underscores, periods, parenthesis, brackets and
          // curley brackets with hyphens.
          .replace(/[\s_.()\[\]{}]/g, '-')
          // Prefix uppercase letters with a hyphen
          .replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase() })
          // Replace consecutive hyphens with just one.
          .replace(/--+/g, '-')
          // Remove non alpha-numeric characters.
          .replace(/[^\w-]/gi, '')
          // Remove any trailing hyphens.
          .replace(/^-|-$/g, '')
          // Lower case the string.
          .toLowerCase()
          // Limit to 32 characters.
          .substring(0, 32) || false
        if (this.id && this.options.generatePrefix) this.id = this.options.generatePrefix + '-' + this.id
      }
    }

    if (this.id) {
      if (this.options.unique) this.id = this.getUID(this.id)
      this.$element.attr('id', this.id)

      // Refresh data API loaded scrollspys if the ID doesn't match the original.
      if (this.id !== this.originalId && document.readyState === "complete") $('[data-spy="scroll"]').scrollspy('refresh')
    }

    return this.id
  }

  Anchor.prototype.getTop = function () {
    if (this.$element.css('position') === 'fixed') return this.$element[0].offsetTop
    var pos = this.getPosition(this.$element)
    var padding = parseInt(this.options.viewport && this.options.viewport.padding || 0, 10) || false
    if (padding === false) {
      padding = parseInt(this.$viewport.css('padding-top'), 10) || false
    }
    var top = pos.top
    if (this.options.margin) top -= this.options.margin
    if (padding !== false) top -= padding
    return top < 0 ? 0 : top
  }

  Anchor.prototype.getTriggers = function () {
    var triggers = this.options.trigger || false
    if (triggers && typeof triggers === 'function') triggers = triggers.call(this)
    if (triggers && typeof triggers === 'string') triggers = {
      anchor: triggers,
      link: triggers
    }
    // Ensure trigger is an object , using $.isPlainObject. Arrays are detected
    // by some browsers as "object" when using typeof.
    if (!$.isPlainObject(triggers)) triggers = false
    return triggers
  }

  Anchor.prototype.getUID = function (prefix) {
    var i = 0
    var original = prefix
    while (document.getElementById(prefix)) {
      i++
      prefix = original + '-' + i
    }
    return prefix
  }

  Anchor.prototype.getWrapper = function () {
    var $wrapper = this.$element.find('>.' + this.type + '-wrapper')
    return $wrapper[0] ? $wrapper : this.$element.wrapInner('<span class="' + this.type + '-wrapper">').find('>.' + this.type + '-wrapper')
  }

  Anchor.prototype.isDOM = function (force) {
    if (!force && this.dom !== null) return this.dom
    // Determine if the $element initialized with is one of:
    // document, window, "html" or "body".
    var el = this.$element[0]
    return (el && (el instanceof document.constructor
    || el instanceof window.constructor
    || el instanceof HTMLHtmlElement
    || el instanceof HTMLBodyElement
    ))
  }

  Anchor.prototype.isLink = function (force) {
    if (!force && this.link !== null) return this.link
    var exclude = this.getExclude()
    return (!this.isDOM() && this.options.link && this.options.link.length && exclude ? this.$element.not(exclude).is(this.options.link) : this.$element.is(this.options.link))
  }

  Anchor.prototype.scrollTo = function (event) {
    var self = this;
    var delegate = self.getDelegate.apply(self, arguments)

    var e = $.Event('scroll.bs.' + delegate.type)
    if (e.isDefaultPrevented()) return

    // Return immediately if the event was prevented, there is no valid anchor,
    // its disabled or its currently scrolling.
    if (!delegate.$anchor || !delegate.enabled || self.scrolling) {
      // Prevent default behavior for links if an event was passed.
      if (delegate.link && event) {
        delegate.$element.trigger('blur.bs.' + delegate.type)
        event.preventDefault()
        return
      }
    }

    // Proxy any scrolling to the actual anchor element in case there are
    // data attributes that override desired functionality.
    if (delegate.link) {
      // Prevent default behavior for links if an event was passed.
      event && event.preventDefault()

      delegate.$element.trigger('blur.bs.' + delegate.type)
      self.scrollTo.apply(self, [null, delegate.$anchor])
      return
    }

    var top = delegate.getTop()
    var scroll = $.Deferred()
    scroll
      .then(function() {
        delegate.scrolling = self.scrolling = true
      })
      .then(function () {
        if (delegate.options.animation && delegate.options.duration && delegate.options.duration > 0) {
          return delegate.$viewport.stop(true).animate({ scrollTop: top }, { duration: delegate.options.duration }).promise()
        }
        else {
          return delegate.$viewport.scrollTop(top).promise()
        }
      })
      .then(function () {
        return delegate.updateHistory.call(delegate)
      })
      .then(function() {
        delegate.scrolling = self.scrolling = false
        delegate.$element.trigger('focus.bs.' + delegate.type)
        delegate.$element.trigger('scrolled.bs.' + delegate.type)
      })

    scroll.resolve()
  }

  Anchor.prototype.scrollToHash = function (hash) {
    // Return immediately if its disabled or currently scrolling.
    if (!this.enabled || this.scrolling) return

    // Return to the previously recorded scrolltop (to prevent immediate an jump).
    if (document.readyState === 'complete' && this.scrollTop !== null) this.$viewport.scrollTop(this.scrollTop)

    // Use the provided hash or the window's current hash.
    hash = hash && typeof hash === 'string' && hash.replace(/^#/, '') || window.location.hash.replace(/^#/, '')

    // Find the hash's target anchor and then scroll to it.
    var target = hash && document.getElementById(hash) || document.getElementsByName(hash)
    if (target) $(target).anchor('scrollTo')
  }

  Anchor.prototype.updateHistory = function () {
    var self = this;
    return $.Deferred(function (dfd) {
      var history = self.options.history
      if (typeof history === 'function') history = history.call(self) || false
      if (!history || (history !== 'append' && history !== 'replace')) return dfd.resolve()

      var id = self.getID()
      self.$element.attr('id', '')

      var $fake = $('<div id="' + id + '"></div>')
        .css({
          position: 'absolute',
          visibility: 'hidden',
          // Base on new viewport scrolltop and margin offset.
          top: self.getTop() + 'px'
        })
        .appendTo(self.$viewport)

      if (history === 'replace' && window.history && window.history.replaceState) {
        window.history.replaceState(null, null, '#' + self.id);
      }
      else {
        window.location.hash = id
      }

      $fake.remove()
      self.$element.attr('id', id)

      // Resolve with a timeout (so onhashchange event executes first).
      setTimeout(function () { dfd.resolve() }, 10)
    });
  }

  // ANCHOR PLUGIN DEFINITION
  // =====================

  function Plugin(option) {
    var args = $.extend([], arguments)
    args.shift()
    return this.each(function () {
      var $this = $(this)
      var data = $this.data('bs.anchor')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.anchor', (data = new Anchor(this, options)))
      if (typeof option == 'string') data[option].apply(data, args)
    })
  }

  var old = $.fn.anchor

  $.fn.anchor = Plugin
  $.fn.anchor.Constructor = Anchor

  // ANCHOR NO CONFLICT
  // ===============

  $.fn.anchor.noConflict = function () {
    $.fn.anchor = old
    return this
  }

}(jQuery);
