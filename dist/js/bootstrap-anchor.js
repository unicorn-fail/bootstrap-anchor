/*!
 * Bootstrap Anchor v0.0.1 (http://markcarver.github.io/bootstrap-anchor/)
 * Copyright 2015 Mark Carver
 * Dual licensed under MIT/GLPv2 (https://github.com/markcarver/bootstrap-anchor/blob/master/LICENSE)
 */
+function ($, undefined) {
  'use strict';

  var Tooltip = $.fn.tooltip && $.fn.tooltip.Constructor

  // ANCHOR PUBLIC CLASS DEFINITION
  // ====================

  var Anchor = function (element, options, selector) {
    this.$anchor    = null
    this.$container = null
    this.$delegates = null
    this.dom        = null
    this.enabled    = null
    this.link       = null
    this.id         = null
    this.originalId = null
    this.scrollTop  = null
    this.scrolling  = null
    this.init('anchor', element, options, selector)
  }

  Anchor.VERSION    = '0.0.1'

  Anchor.checkVersion = function (current, min) {
    if (!current) return false
    var i, a = current.split('.'), b = min.split('.')
    for (i = 0; i < a.length; ++i) a[i] = Number(a[i])
    for (i = 0; i < b.length; ++i) b[i] = Number(b[i])
    if (a[0] > b[0]) return true
    if (a[0] < b[0]) return false
    if (a[1] > b[1]) return true
    if (a[1] < b[1]) return false
    if (a[2] > b[2]) return true
    return a[2] >= b[2]
  }

  if (!Tooltip || !Anchor.checkVersion(Tooltip.VERSION, '3.3.4')) throw new Error('Bootstrap Anchor requires the Bootstrap tooltip.js plugin, version 3.3.4 or greater.')

  Anchor.proxy = function (method, constructor) {
    constructor = constructor || Tooltip
    return function () {
      constructor.prototype[method].apply(this.getDelegate.apply(this, arguments), arguments)
    }
  }

  // NOTE: ANCHOR EXTENDS tooltip.js
  // ================================

  Anchor.DEFAULTS = $.extend({}, Tooltip.DEFAULTS, {
    // Anchor default options.
    anchors: 'h1,h2,h3,h4,[data-anchor]',
    anchorContainer: true,
    anchorDuration: 300,
    anchorFindNamed: false,
    anchorGenerateId: true,
    anchorHistory: 'append',
    anchorIcon: '<span class="glyphicon glyphicon-link" aria-hidden="true"></span>',
    anchorIgnore: '[data-anchor-ignore]:not([data-anchor-ignore="false"]),[data-dismiss],[data-slide],[data-toggle]:not([data-toggle="anchor"])',
    anchorLinks: 'a[href*="#"],[data-toggle="anchor"]',
    anchorNormalizeId: {
      separator: '-',
      // The following options appear in the order they are executed.
      convertCamel: true,
      convertCase: 'lower',
      convert: /[\s_.(){}\[\]]/g,
      strip: /[^\w-]/gi,
      singleSeparator: true,
      trim: true,
      maxLength: 32
    },
    anchorPrefixId: false,
    anchorUniqueId: true,
    anchorOffset: 20,
    anchorTarget: false,

    // DOM binding default options.
    scrollOnHashchange: true,
    scrollOnLoad: true,

    // Override Tooltip default options.
    placement: 'auto left',
    template: '<span class="anchor-link text-primary" role="tooltip"><a href="#"></a></span>',
    trigger: {
      anchors: 'hover focus',
      links: 'click'
    },
    viewport: {
      selector: 'body',
      padding: 0
    }
  })

  Anchor.prototype = $.extend({}, Tooltip.prototype)

  // Proxy the following methods so they are executed with the correct delegate.
  var methods = ['enter', 'leave', 'hide', 'show', 'toggle']
  for (var i = 0, l = methods.length; i < l; i++) {
    Anchor.prototype[methods[i]] = Anchor.proxy(methods[i])
  }

  Anchor.prototype.constructor = Anchor

  Anchor.prototype.getDefaults = function () {
    return Anchor.DEFAULTS
  }

  Anchor.prototype.getOptions = function (options, selector) {
    var data = this.$element.data() || null
    var defaults = this.getDefaults()

    // Allow a passed selector to override the default "anchors" option.
    // This is used for manual initializations of the plugin. The "anchors"
    // option can still be manually overridden by the options object or data
    // attribute.
    selector = selector && !this.dom && {
      anchors: selector
    } || null

    // Look for an anchor container that overrides any default options.
    var container = !this.dom && defaults.anchorContainer
    if (data.anchorContainer !== undefined) {
      container = data.anchorContainer || null
    }
    else if (options.anchorContainer !== undefined) {
      container = options.anchorContainer || null
    }

    if (container) {
      var $container = typeof container === 'string' && $(container)
      if (!$container || !$container[0]) $container = this.$element.parent().closest('[data-anchor-container]')
      container = $container[0] && $container.data() || null
    }

    options = $.extend(true, {}, defaults, selector, options, container, data)

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
    if (!$element) $element = this.getContainer()

    // Proxy to the Tooltip plugin.
    return Tooltip.prototype.getPosition.apply(this, [$element])
  }

  Anchor.prototype.hasContent = function () {
    return !!(!this.isLink() && this.id && this.$anchor && this.$anchor.is(this.options.anchors) && this.options.anchorIcon)
  }

  Anchor.prototype.setContent = function () {
    var self = this
    var $tip  = this.tip().removeClass('fade in')
    $tip.find('a')
      .attr('href', '#' + this.id)
      .off('click.bs.' + this.type)
      .on('click.bs.' + this.type, function (e) {
        e.preventDefault()
        e.stopPropagation()
        self.scrollTo()
      })
      .html(this.options.anchorIcon)
  }

  // ANCHOR CLASS DEFINITION
  // ====================

  Anchor.prototype.init = function (type, element, options, selector) {
    // Immediately return if instance has already been initialized.
    if (this.enabled !== null) return

    var self = this

    this.enabled    = true
    this.type       = type
    this.dom        = this.isDOM(element)
    this.$element   = this.dom ? $(document) : $(element)
    this.options    = this.getOptions(options, selector)
    this.$anchor    = this.getAnchor()
    this.$delegates = false
    this.$viewport  = this.options.viewport && $(this.options.viewport.selector || this.options.viewport)
    this.link       = this.isLink()
    this.id         = this.getID()

    // Create any necessary bindings.
    this.bind()

    // DOM binding.
    if (this.dom) {
      var $window = $(window)
      this._options = $.extend({}, this.options, { 'trigger': 'manual' })

      // Track current scrollTop of the viewport.
      $window.on('scroll.bs.' + this.type, function () {
        self.scrollTop = self.getPosition(self.$viewport).scroll
      })

      // Scroll to anchor on page load.
      if (this.options.scrollOnLoad) $window.on('load.bs.' + this.type, $.proxy(this.scrollToHash, this))

      // Scroll to the anchor on hashchange.
      if (this.options.scrollOnHashchange) $window.on('hashchange.bs.' + this.type, $.proxy(this.scrollToHash, this))

      // Refresh scrollspy plugins when an anchor ID change has been fired.
      if ($.fn.scrollspy) this.$element.on('change.bs.anchor', function () {
        if (document.readyState === 'complete') $('[data-spy="scroll"]').scrollspy('refresh')
      })

      // Ensure the DOM is ready before initializing all the anchors.
      $(function () {
        // Use the original anchors option for performance.
        self.$delegates = $(self.options.anchors).not(self.getExclude()).anchor(self._options)
      })
    }
    else if (!this.link) {
      if (!this.id) {
        this.$anchor = false
      }

      // Hi-jack the container that the tooltip is to be attached to. This is
      // so it can be appended inside this.$element instead of after it.
      if (this.$anchor && this.hasContent()) {
        this.options.originalContainer = this.options.container
        this.options.container = this.getContainer()
      }
    }
  }

  Anchor.prototype.bind = function () {
    var self = this
    var isLink = this.dom || this.isLink()

    if (this.dom && !this.options.anchors && !this.options.anchorLinks) throw new Error('`anchors` or `anchorLinks` option must be specified when initializing ' + this.type + ' on any top level DOM object!')

    // Immediately return if there is nothing to bind.
    if (!this.dom && !isLink && !this.hasContent()) return

    var exclude = this.getExclude()
    var $element = this.dom || !exclude ? this.$element : this.$element.not(exclude)

    // Construct the necessary selectors to delegate, if any.
    var selectors = function (type) {
      var wrapper = (type === 'anchors' ? '> .' + self.type + '-wrapper' : '')
      var selectors = type === 'anchors' && self.options.anchors || type === 'links' && self.options.anchorLinks || ''
      if (!self.dom) return wrapper || null
      var bind = function (callback) {
        var _selectors = selectors && selectors.split(/\s*,\s*(?![^(]*\))/ig) || []
        for (var i = 0, l = _selectors.length; i < l; i++) {
          _selectors[i] = callback.apply(this, [_selectors[i], _selectors])
        }
        return _selectors.join(',')
      }
      return bind(function (selector) { return selector + ':not(' + exclude + ')' + wrapper })
    }

    var triggerTypes = this.getTriggers()
    for (var type in triggerTypes) {
      if (!triggerTypes.hasOwnProperty(type)) continue

      var delegated = selectors(type)
      var triggers = typeof triggerTypes[type] === 'string' && triggerTypes[type].split(' ') || []
      for (var i = triggers.length; i--;) {

        var trigger = triggers[i]
        if (trigger === 'click') {
          if (type === 'links' && isLink) $element.on('click.bs.' + this.type, delegated, $.proxy(this.scrollTo, this))
          else $element.on('click.bs.' + this.type, delegated, $.proxy(this.toggle, this))
        }
        else if (type === 'anchors' && trigger !== 'manual') {
          $element.on((trigger === 'hover' ? 'mouseenter' : 'focusin') + '.bs.' + this.type, delegated, $.proxy(this.enter, this))
          $element.on((trigger === 'hover' ? 'mouseleave' : 'focusout') + '.bs.' + this.type, delegated, $.proxy(this.leave, this))
        }
      }
    }
  }

  Anchor.prototype.getAnchor = function () {
    // Immediately return the anchor is currently already set.
    if (this.$anchor !== null) return this.$anchor || false

    var $target, el = this.$element[0]

    // DOM elements aren't anchors.
    if (this.dom) return false

    // Look for an anchor if the "target" option was set.
    else if (this.options.anchorTarget) {
      $target = $(this.options.anchorTarget).first()
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

  Anchor.prototype.getContainer = function () {
    if (!this.hasContent()) return this.$anchor
    if (this.$container) return this.$container
    this.$container = this.$anchor.find('>.' + this.type + '-wrapper')
    if (this.$container[0]) return this.$container
    // For performance purposes, use native JS to wrap instead of $.wrapInner().
    var anchor = this.$anchor[0]
    var wrapper = document.createElement('span')
    wrapper.className = 'anchor-wrapper'
    while (anchor.childNodes.length) wrapper.appendChild(anchor.removeChild(anchor.childNodes[0]))
    anchor.insertBefore(wrapper, anchor.firstChild)
    this.$container = $(wrapper)
    return this.$container
  }

  // @todo There should really be a Tooltip method that this overrides.
  Anchor.prototype.getDelegate = function (obj, $target) {
    if (obj instanceof this.constructor) return obj

    $target = $target || obj instanceof jQuery.Event && $(obj.currentTarget) || $()

    // Ensure the original element is the target and not it's wrapper.
    if ($target.is('.' + this.type + '-wrapper')) {
      $target = $target.parent()
      if (obj.currentTarget) obj.currentTarget = $target[0]
    }

    var self = $target.data('bs.' + this.type)
    if (!self && !this.dom) return this
    if (!self && $target[0]) $target.data('bs.' + this.type, (self = new this.constructor($target[0], this.getDelegateOptions())))
    return self || this
  }

  Anchor.prototype.getExclude = function () {
    var exclude = this.options.anchorIgnore || false;
    if (exclude && typeof exclude === 'function') exclude = this.options.anchorIgnore.call(this)
    if (exclude && typeof this.options.anchorIgnore !== 'string') exclude = false
    return exclude
  }

  Anchor.prototype.getID = function (force) {
    if (this.dom) {
      this.id = this.originalId = false
      return this.id
    }

    var dynamic = typeof this.options.id === 'function' || typeof this.options.originalId === 'function'
    if (this.id !== null && !dynamic && !force) return this.id

    this.originalId = typeof this.options.originalId === 'function' && this.options.originalId.call(this) || this.options.originalId || false
    this.id = typeof this.options.id === 'function' && this.options.id.call(this) || this.options.id || this.originalId || false

    if (!this.id) {
      var el = this.$element[0]

      // Attempt to retrieve the ID from the element.
      var id = el && el.id || el && el.nodeName === 'A' && el.name

      // Attempt to find an adjoining named A tag, if element isn't already one.
      if (!id && this.options.anchorFindNamed) {
        var $named, traverse = ['next', 'prev', 'find']
        for (var i = traverse.length; i--;) {
          $named = this.$element[traverse[i]]('a[name]:empty')
          if ($named[0] && !id) { // Don't override existing ID
            id = $named[0].id || $named[0].name
            break
          }
        }
      }

      // Remove attributes.
      if (id) this.$element.removeAttr('id')
      if (el && el.nodeName === 'A' && el.name) this.$element.removeAttr('name')

      // Save the original ID.
      this.id = this.originalId = id || false

      // If still no ID, attempt to auto-generate one from the anchor's text.
      if (!this.id && this.options.anchorGenerateId && !this.isLink()) {
        this.id = this.$anchor.text() || false
        if (this.id) {
          if (this.options.anchorNormalizeId) this.id = this.normalizeId(this.id)
          if (this.options.anchorPrefixId) this.id = this.options.anchorPrefixId + '-' + this.id
          if (this.options.anchorUniqueId) this.id = this.getUID(this.id)
        }
      }

      // Ensure the original ID is stored on the element.
      this.$element.attr('data-original-id', this.originalId.toString())

      if (this.id) {
        this.$element
          .attr('id', this.id)
          .attr('data-id', this.id)
      }
    }

    if (this.id !== this.originalId) this.$element.trigger('change.bs.anchor', this)

    return this.id
  }

  Anchor.prototype.getTop = function () {
    // Use the anchor's offsetTop value if it's fixed.
    var top = this.$anchor.css('position') === 'fixed' ? this.$anchor[0].offsetTop : this.getPosition(this.$anchor).top
    top -= parseInt(this.$viewport.css('margin-top'), 10) || 0
    top -= parseInt(this.$viewport.css('padding-top'), 10) || 0
    if (this.options.anchorOffset) top -= parseInt(this.options.anchorOffset, 10)
    return top < 0 ? 0 : top
  }

  Anchor.prototype.getTriggers = function () {
    var triggers = this.options.trigger || false
    if (triggers && typeof triggers === 'function') triggers = triggers.call(this)
    if (triggers && typeof triggers === 'string') triggers = {
      anchors: triggers,
      links: triggers
    }
    // Ensure trigger is an object , using $.isPlainObject. Arrays are detected
    // by some browsers as "object" when using typeof.
    if (!$.isPlainObject(triggers)) triggers = false
    return triggers
  }

  Anchor.prototype.getUID = function (prefix) {
    var i = 0
    var original = '' + prefix
    while (document.getElementById(prefix)) {
      i++
      prefix = original + '-' + i
    }
    return prefix
  }

  Anchor.prototype.isDOM = function (el, force) {
    if (!force && this.dom !== null) return this.dom
    el = el || this.$element && this.$element[0]
    // Determine if the element is one of: document, window, "html" or "body".
    return (el && (el instanceof document.constructor
    || el instanceof window.constructor
    || el instanceof HTMLHtmlElement
    || el instanceof HTMLBodyElement
    ))
  }

  Anchor.prototype.isLink = function (force) {
    if (this.dom) return false
    if (!force && this.link !== null) return this.link
    var exclude = this.getExclude()
    return this.options.anchorLinks && exclude ? this.$element.not(exclude).is(this.options.anchorLinks) : this.$element.is(this.options.anchorLinks)
  }

  Anchor.prototype.normalizeId = function (id) {
    var normalize = this.options.anchorNormalizeId
    if (!normalize || typeof normalize !== 'object') return id

    var separator = normalize.separator || ''
    var escapedSeparator = separator && separator.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') || ''
    if (normalize.convertCamel)     id = id.replace(/[A-Z]/g, function (m) { return separator + m })
    if (normalize.convertCase)      id = normalize.convertCase === 'upper' ? id.toUpperCase() : id.toLowerCase()
    if (normalize.convert)          id = id.replace(normalize.convert, separator)
    if (normalize.strip)            id = id.replace(normalize.strip, '')
    if (normalize.singleSeparator)  id = id.replace(new RegExp(escapedSeparator + '+', 'g'), separator)
    if (normalize.trim)             id = id.replace(new RegExp('^' + escapedSeparator + '*|' + escapedSeparator + '*$', 'g'), '')
    if (normalize.maxLength)        id = id.substring(0, normalize.maxLength)
    return id || false
  }

  Anchor.prototype.scrollTo = function (event) {
    var self = this;
    var delegate = self.getDelegate.apply(self, arguments)

    // Immediately return if there is no anchor (or its currently detached
    // from the DOM), its disabled or currently scrolling.
    if (!delegate.$anchor || !$.contains(document, delegate.$anchor[0]) || !delegate.enabled || delegate.scrolling || self.scrolling) return

    // Handle anchor links.
    if (delegate.link) {
      // Prevent default behavior for links if an event was passed.
      event && event.preventDefault()
      delegate.$element.trigger('blur.bs.' + delegate.type)

      // Proxy any scrolling to the actual anchor element in case there are
      // data attributes that override desired functionality.
      self.scrollTo.apply(self, [null, delegate.$anchor])
      return
    }

    // Create a scroll event for the anchor.
    var e = $.Event('scroll.bs.' + delegate.type)

    // Immediately return if the event was stopped.
    if (e.isDefaultPrevented()) return

    var top = delegate.getTop()
    var scroll = $.Deferred()
    scroll
      .then(function() {
        delegate.scrolling = self.scrolling = true
      })
      .then(function () {
        if (delegate.options.animation && delegate.options.anchorDuration && delegate.options.anchorDuration > 0) {
          return delegate.$viewport.stop(true).animate({ scrollTop: top }, { anchorDuration: delegate.options.anchorDuration }).promise()
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
      var history = self.options.anchorHistory
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

      if (history === 'replace' && window.anchorHistory && window.anchorHistory.replaceState) {
        window.anchorHistory.replaceState(null, null, '#' + self.id);
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
    // Extract the arguments.
    var args = $.extend([], arguments)
    args.shift()

    // Capture the selector used, if any, to override the default "anchors" option.
    // @see Anchor.prototype.getOptions()
    var selector = this.selector

    // Iterate over each element.
    return this.each(function () {
      var $this = $(this)
      var data = $this.data('bs.anchor')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.anchor', (data = new Anchor(this, options, selector)))
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
