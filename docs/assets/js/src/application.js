/*!
 * JavaScript for Bootstrap Anchor's docs (http://markcarver.github.io/bootstrap-anchor/)
 * Copyright 2015 Mark Carver
 *
 * Original source and adapted from:
 * Bootstrap's docs (http://getbootstrap.com)
 * Copyright 2011-2014 Twitter, Inc.
 *
 * Licensed under the Creative Commons Attribution 3.0 Unported License. For
 * details, see http://creativecommons.org/licenses/by/3.0/.
 */
/* global ZeroClipboard */
!function ($) {
  'use strict';
  // Bind anchor plugin.
  $(document).anchor()

  $(function () {
    var $body = $('body')
    var $navbar = $('.bs-docs-nav')
    var navbarType = 'fixed'
    var $viewportDemo = $('#viewport-demo')
    var $navbarStatus = $viewportDemo.find('.status')
    var $navbarToggle = $viewportDemo.find('.toggle')
    var updateNavbar = function () {
      var other = navbarType === 'static' ? 'fixed' : 'static'
      $body.removeClass('navbar-' + other).addClass('navbar-' + navbarType)
      $navbar.removeClass('navbar-' + other + '-top').addClass('navbar-' + navbarType + '-top')
      $navbarStatus
        .text(navbarType)
        .removeClass(navbarType === 'static' ? 'label-success' : 'label-warning')
        .addClass(navbarType === 'static' ? 'label-warning' : 'label-success')
    }
    $navbarToggle.on('click', function () {
      navbarType = navbarType === 'static' ? 'fixed' : 'static'
      updateNavbar()
      $viewportDemo.anchor('scrollTo')
      $navbarToggle.trigger('blur')
    })
    updateNavbar()

    // Sidenav affixing
    setTimeout(function () {
      var $sideBar = $('.bs-docs-sidebar')

      $sideBar.affix({
        offset: {
          top: function () {
            var offsetTop      = $sideBar.offset().top
            var sideBarMargin  = parseInt($sideBar.children(0).css('margin-top'), 10)
            var navOuterHeight = $navbar.height()

            return (this.top = offsetTop - navOuterHeight - sideBarMargin)
          },
          bottom: function () {
            return (this.bottom = $('.bs-docs-footer').outerHeight(true))
          }
        }
      })
    }, 100)

    setTimeout(function () {
      $('.bs-top').affix()
    }, 100)

    // Config ZeroClipboard
    ZeroClipboard.config({
      moviePath: 'http://cdn.jsdelivr.net/zeroclipboard/1.3.5/ZeroClipboard.swf',
      hoverClass: 'btn-clipboard-hover'
    })

    // Insert copy to clipboard button before .highlight
    var $highlight = $('.highlight')

    // HACK: Removes the ! operator used to make highlighting JS objects
    // pass without any "errors".
    $highlight.find('.language-js > .o:first-child + .p').each(function () {
      $(this).prev().remove()
    })

    $highlight.before('<div class="zero-clipboard"><span class="btn-clipboard">Copy</span></div>')

    var zeroClipboard = new ZeroClipboard($('.btn-clipboard'))
    var htmlBridge = $('#global-zeroclipboard-html-bridge')

    // Handlers for ZeroClipboard
    zeroClipboard.on('load', function () {
      htmlBridge
        .data('placement', 'top')
        .attr('title', 'Copy to clipboard')
        .tooltip()
    })

    // Copy to clipboard
    zeroClipboard.on('dataRequested', function (client) {
      var highlight = $(this).parent().nextAll('.highlight').first()
      client.setText(highlight.text())
    })

    // Notify copy success and reset tooltip title
    zeroClipboard.on('complete', function () {
      htmlBridge
        .attr('title', 'Copied!')
        .tooltip('fixTitle')
        .tooltip('show')
        .attr('title', 'Copy to clipboard')
        .tooltip('fixTitle')
    })

    // Notify copy failure
    zeroClipboard.on('noflash wrongflash', function () {
      htmlBridge
        .attr('title', 'Flash required')
        .tooltip('fixTitle')
        .tooltip('show')
    })

  })
}(jQuery)
