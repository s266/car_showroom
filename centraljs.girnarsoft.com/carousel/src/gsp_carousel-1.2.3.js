/**
 * Carousel Plugin
 * @desc Builds a responsive carousel.
 * @package Girnar Soft OneJs
 * @author Vineet Kumar <vineet.vaishnav@girnarsoft.com>
 * @version 1.2.3
 * @created Nov 25, 2016
 *
 * Depends:
 *    jQuery
 */

/*!
 * Carousel (Modified by Vineet Kumar)
 * @copyright (c) 2016 Vineet Kumar
 * @license   Licensed under MIT license
 */
(function ($, undefined) {
    'use strict';
    var resizeT = 0,
        defaults = {
        item: 3,
        loop:false,
        autoWidth: false,
        slideMove: 1,
        slideMargin: 10,
        addClass: '',
        useCSS: true,
        mode: 'slide',
        cssEasing: 'ease', //'cubic-bezier(0.25, 0, 0.25, 1)',
        speed: 400, //ms'
        auto: false,
        pauseOnHover: true,
        pause: 2000,
        controls: true,
        keyPress: true,
        prevHtml: '',
        nextHtml: '',
        adaptiveHeight: false,
        thumbItem: 10,
        pager: true,
        gallery: false,
        galleryMargin: 5,//
        thumbMargin: 5,
        currentPagerPosition: 'middle',//
        enableTouch: true,
        enableDrag: true,
        freeMove: true,
        swipeThreshold: 20,
        responsive: [],
        lazyLoad: true,
        preLazyLoad: false,
        showUpcoming: false,
        upcomingPercent: 50,
        waterwheel: false,
        pagerClass: 'gscr_html_pager',
        showCounter: false,
        counterText: "Showing {current}/{total}",

        /* jshint ignore:start */
        onBeforeStart: function ($el) {
        },
        onSliderLoad: function ($el) {
        },
        onBeforeSlide: function ($el, scene, activeItems) {
        },
        onAfterSlide: function ($el, scene, activeItems) {
        },
        onBeforeNextSlide: function ($el, scene, activeItems) {
        },
        onBeforePrevSlide: function ($el, scene, activeItems) {
        }
        /* jshint ignore:end */
    };
    $.fn.gsp_carousel = function (options) {
        var ln = this.length;
        //If no selector found for carousel or there is no children inside the selector then return//
        if (ln === 0 || this.children().length<=1) {
            return this;
        } else if (ln > 1) {
            this.each(function () {
                $(this).gsp_carousel(options);
            });
            return this;
        }
        //check if carousel has already been initialized then don't initialize again (can be mistakenly done by developer)
        if(this.is('.gscr_carousel')){
            return;
        }
        var $document = $(document),
            plugin = {},
            settings = $.extend(true, {}, defaults, options),
            settingsTemp = {},
            $el = this,
            $sliderParent,
            $oWrapper,
            $counterWrapper,
            $window = $(window);
        plugin.$el = this;
        var $children = $el.children(),
            windowW = $window.width(),
            breakpoint = null,
            responsiveObj = null,
            length = 0,
            totalItems = 0,
            w = 0,
            on = false,
            elSize = 0,
            $slide = '',
            scene = 0,
            scn = 0,
            initCounter = 0,
            property = 'width',
            gutter = 'margin-right',
            slideValue = 0,
            pagerWidth = 0,
            slideWidth = 0,
            thumbWidth = 0,
            upcomingSlidePx = 0,
            showPartialMode = false,
            isActive = false,
            draggedVal = 0,
            interval = null,
            sliderInitiated = false,
            isTouch = ('ontouchstart' in document.documentElement),
            slideCalc = {},
            refresh = {};
        refresh.chbreakpoint = function () {
            windowW = $window.width();
            if (settings.responsive.length) {
                var item;
                if (settings.autoWidth === false) {
                    item = settings.item;
                }
                var _sR = settings.responsive;
                if (windowW < _sR[0].breakpoint) {
                    for (var i = 0; i < _sR.length; i++) {
                        if (windowW < _sR[i].breakpoint) {
                            breakpoint = _sR[i].breakpoint;
                            responsiveObj = _sR[i];
                        }
                    }
                }
                if (typeof responsiveObj !== 'undefined' && responsiveObj !== null) {
                    for (var j in responsiveObj.settings) {
                        if (responsiveObj.settings.hasOwnProperty(j)) {
                            if (typeof settingsTemp[j] === 'undefined' || settingsTemp[j] === null) {
                                settingsTemp[j] = settings[j];
                            }
                            settings[j] = responsiveObj.settings[j];
                        }
                    }
                }
                if (!$.isEmptyObject(settingsTemp) && windowW > _sR[0].breakpoint) {
                    for (var k in settingsTemp) {
                        if (settingsTemp.hasOwnProperty(k)) {
                            settings[k] = settingsTemp[k];
                        }
                    }
                }
                if (settings.autoWidth === false) {
                    if (slideValue > 0 && slideWidth > 0) {
                        if (item !== settings.item) {
                            scene = Math.round(slideValue / ((slideWidth + settings.slideMargin) * settings.slideMove));
                        }
                    }
                }
            }

            //Making some adjustments according to the animation effects and some specific conditions//
            if (settings.mode === 'fade') {
                settings.autoWidth = false;
                settings.slideEndAnimation = false;
            }
            if (settings.autoWidth || settings.mode === 'fade') {
                settings.slideMove = 1;
                settings.item = 1;
            }
            if (settings.loop) {
                settings.slideMove = 1;
                settings.freeMove = false;
            }
        };
        refresh.calSW = function () {
            if (settings.autoWidth === false) {
                var i = settings.item,
                    m = settings.slideMargin,
                    p = settings.upcomingPercent;
                slideWidth = elSize - (i * m - m);
                slideWidth = settings.showUpcoming ? slideWidth / (i + p / 100) : slideWidth / i;
                upcomingSlidePx = (slideWidth * p / 100) / 2;
            }
        };
        refresh.calWidth = function (cln) {
            var ln = cln === true ? $slide.find('.gscr_lslide').length : $children.length;
            if (settings.autoWidth === false) {
                w = ln * (slideWidth + settings.slideMargin);
            } else {
                w = 0;
                for (var i = 0; i < ln; i++) {
                    w += (parseInt($children.eq(i).width(), 10) + settings.slideMargin);
                }
            }
            return w;
        };
        plugin = {
            doCss: function () {
                var support = function () {
                    var transition = ['transition', 'MozTransition', 'WebkitTransition', 'OTransition', 'msTransition', 'KhtmlTransition'];
                    var root = document.documentElement;
                    for (var i = 0; i < transition.length; i++) {
                        if (transition[i] in root.style) {
                            return true;
                        }
                    }
                };
                return (settings.useCSS && support());
            },
            controls: function () {
                if (settings.controls) {
                    $el.parent('.gscr_slideWrapper').after('<div class="gscr_lSAction"><a class="gscr_lSPrev">' + settings.prevHtml + '</a><a class="gscr_lSNext">' + settings.nextHtml + '</a></div>');
                    var ctrls = $slide.next();
                    if (!settings.autoWidth) {
                        if (length <= settings.item) {
                            ctrls.hide();
                        }
                    } else {
                        if (refresh.calWidth(false) < elSize) {
                            ctrls.hide();
                        }
                    }
                    ctrls.find('a').on('click', function (e) {
                        if (e.preventDefault) {
                            e.preventDefault();
                        } else {
                            e.returnValue = false;
                        }
                        $(this).is(".gscr_lSPrev") ? $el.goToPrevSlide() : $el.goToNextSlide();
                        return false;
                    });
                    //let the hideShowActions method to be added to $el then call it
                    setTimeout(function(){
                        $el.hideShowActions();
                    }, 50);

                }
            },
            createCounter: function () {
                if (settings.showCounter) {
                    $counterWrapper = $('<div class="gscr_counter"></div>').insertAfter($oWrapper);
                }
            },
            initialStyle: function () {
                var $this = this;
                /*if (settings.mode === 'fade') {
                 settings.autoWidth = false;
                 settings.slideEndAnimation = false;
                 }
                 if (settings.autoWidth || settings.htmlPager || settings.mode === 'fade') {
                 settings.slideMove = 1;
                 settings.item = 1;
                 }
                 if (settings.loop) {
                 settings.slideMove = 1;
                 settings.freeMove = false;
                 }*/
                settings.onBeforeStart.call(this, $el);
                refresh.chbreakpoint();
                $el.addClass('gscr_carousel').wrap('<div class="gscr_slideOuter ' + settings.addClass + '"><div class="gscr_outerwrapper"><div class="gscr_slideWrapper"></div></div></div>');
                $slide = $el.parent('.gscr_slideWrapper');
                $oWrapper = $slide.parent('.gscr_outerwrapper');
                $sliderParent = $oWrapper.parent().parent();
                elSize = $sliderParent.outerWidth();
                $children.addClass('gscr_lslide');
                if (settings.loop === true && settings.mode === "slide") {
                    if (settings.showUpcoming && !settings.autoWidth) {
                        showPartialMode = true;
                    }
                    //Todo: for optimization. remove it after 2-3 version releases if everything works fine//
                    //refresh.calSW();
                    refresh.clone = function () {
                        //Todo: Refactor cloning//
                        var c, ll = $.fn.gsp_lazyload;
                        if (refresh.calWidth(true) > elSize) {
                            var tWr = 0,
                                tI = 0,
                                $lSlide = $el.find('.gscr_lslide'),
                                $leftClones = $el.find('.gscr_clone.gscr_left'),
                                $rightClones = $el.find('.gscr_clone.gscr_right');
                            for (var k = 0; k < $children.length; k++) {
                                tWr += (parseInt($lSlide.eq(k).width()) + settings.slideMargin);
                                tI++;
                                if (tWr >= (elSize + settings.slideMargin)) {
                                    break;
                                }
                            }
                            var tItem = settings.autoWidth === true ? tI : settings.item;
                            if (tItem < $leftClones.length) {
                                for (var i = 0; i < $leftClones.length - tItem; i++) {
                                    $children.eq(i).remove();
                                }
                            }
                            if (tItem < $rightClones.length) {
                                for (var j = $children.length - 1; j > ($children.length - 1 - $rightClones.length); j--) {
                                    scene--;
                                    $children.eq(j).remove();
                                }
                            }
                            for (var n = $rightClones.length; n < tItem; n++) {
                                c = $lSlide.eq(n).clone().removeClass('gscr_lslide').addClass('gscr_clone gscr_right').appendTo($el);
                                if (ll && settings.lazyLoad) {
                                    c.find('img').gsp_lazyload();
                                }
                                scene++;
                            }
                            for (var m = $lSlide.length - $leftClones.length; m > ($lSlide.length - tItem); m--) {
                                c = $lSlide.eq(m - 1).clone().removeClass('gscr_lslide').addClass('gscr_clone gscr_left').prependTo($el);
                                if (ll && settings.lazyLoad) {
                                    c.find('img').gsp_lazyload();
                                }
                            }
                            $children = $el.children();
                        }
                    };
                }
                refresh.sSW = function () {
                    length = $children.length;
                    if (settings.autoWidth === false) {
                        $children.css(property, slideWidth + 'px');
                    }
                    $children.css(gutter, settings.slideMargin + 'px');
                    w = refresh.calWidth(false);
                    //Using Math.ceil to fix width issues with width in float pixel values//
                    $el.css(property, Math.ceil(w) + 'px');
                    if (on === false) {
                        scene = $el.find('.gscr_clone.gscr_left').length;
                    }
                };
                refresh.calL = function () {
                    $children = $el.children();
                    length = $children.length;
                };
                if (this.doCss()) {
                    $slide.addClass('gscr_usingCss');
                }
                refresh.calL();
                if (settings.mode === 'slide') {
                    refresh.calSW();
                    refresh.sSW();
                    if (settings.loop === true) {
                        slideValue = $this.slideValue();
                    }
                    this.setHeight($el, false);
                } else {
                    this.setHeight($el, true);
                    $el.addClass('gscr_lSFade');
                    if (!this.doCss()) {
                        $children.fadeOut(0);
                        $children.eq(scene).fadeIn(0);
                    }
                }
                (settings.loop === true && settings.mode === 'slide') ? $children.eq(scene).addClass('gscr_active') : $children.first().addClass('gscr_active');
            },
            assignNumbers: function () {
                $slide.find(".gscr_lslide").not('.gscr_lslide*[data-gscr-nocount]').each(function (i) {
                    var $e = $(this);
                    if (typeof $e.attr('data-gscr-nocount') === 'undefined') {
                        $(this).attr('data-gscr-index', i);
                    }
                });
            },
            pager: function () {
                var $this = this;
                refresh.createPager = function () {
                    thumbWidth = (elSize - ((settings.thumbItem * (settings.thumbMargin)) - settings.thumbMargin)) / settings.thumbItem;
                    var $children = $slide.find('.gscr_lslide'),
                        sMove = settings.slideMove,
                        slidesLen = Math.ceil(($children.length - settings.item) / settings.slideMove) + 1,
                        pagers = '',
                        v = 0;
                    for (var i = 0; i < slidesLen; i++) {
                        // calculate scene * slide value
                        if (!settings.autoWidth) {
                            v = i * ((slideWidth + settings.slideMargin) * sMove);
                        } else {
                            v += ((parseInt($children.eq(i).width(), 10) + settings.slideMargin) * sMove);
                        }
                        var child = $children.eq(i * sMove);
                        var defaultPager = '<li class="gscr_dot"><a href="#">' + (i + 1) + '</a></li>';
                        if (settings.htmlPager === true) {
                            var html = child.data('gscr-html');
                            html = typeof html != "undefined" ? '<li class="gscr_dot ' + settings.pagerClass + '">' + html + '</li>' : defaultPager;
                            pagers += html;
                        } else if (settings.gallery === true) {
                            var $currentChild = $children.eq(i * sMove),
                                thumb = $currentChild.attr('data-gscr-thumb'),
                                thumbHTML = '';
                            if ($.trim(thumb) == "") {
                                thumbHTML = $currentChild.attr('data-gscr-html');
                            } else {
                                thumbHTML = '<img src="' + thumb + '" />';
                            }
                            thumbWidth = (elSize - ((settings.thumbItem * (settings.thumbMargin)) - settings.thumbMargin)) / settings.thumbItem;
                            pagers += '<li class="gscr_dot" style="width:100%;' + property + ':' + thumbWidth + 'px;' + gutter + ':' + settings.thumbMargin + 'px"><a href="#">' + thumbHTML + '</a></li>';
                        } else {
                            pagers += '<li class="gscr_dot"><a href="#">' + (i + 1) + '</a></li>';
                        }
                    }
                    var lsPager = $slide.parents('.gscr_slideOuter ').find('.gscr_lSPager');
                    lsPager.html(pagers);
                    if (settings.gallery === true) {
                        pagerWidth = (i * (settings.thumbMargin + thumbWidth)) + 0.5;
                        lsPager.css({
                            property: pagerWidth + 'px',
                            'transition-duration': settings.speed + 'ms'
                        });
                        lsPager.css(property, pagerWidth + 'px');
                    }
                    var $pager = lsPager.find('.gscr_dot');
                    $pager.first().addClass('gscr_active');
                    $pager.on('click', function () {
                        scene = $pager.index(this);
                        if (settings.loop && settings.mode!='fade') {
                            scene += settings.item;
                        }
                        $el.mode(false);
                        if (settings.gallery === true) {
                            $this.slideThumb();
                        }
                        return false;
                    });
                };
                if (settings.pager) {
                    var cl = 'gscr_lSpg',
                        gMargin = 'margin-top';
                    if (settings.gallery) {
                        cl = 'gscr_lSGallery';
                    }
                    $oWrapper.after('<div class="gscr_pagerwrapper"><div class="gscr_pagercontent"><ul class="gscr_lSPager ' + cl + '"></ul></div></div>');
                    $slide.parents('.gscr_slideOuter ').find('.gscr_lSPager').css(gMargin, settings.galleryMargin + 'px');
                    refresh.createPager();
                }
                setTimeout(function () {
                    $el.getTotalSlideCount();
                    settings.loop && settings.mode=='slide' ? refresh.init() : plugin.updateCounter();
                }, 0);

            },
            setHeight: function (ob, fade) {
                var obj = null,
                    $this = this;
                obj = settings.loop ? ob.children('.gscr_lslide').first() : ob.children().first();
                var setCss = function () {
                    var tH = obj.outerHeight(),
                        tP = 0,
                        tHT = tH;
                    if (fade) {
                        tH = 0;
                        tP = ((tHT) * 100) / elSize;
                    }
                    var css = {'height': tH + 'px'};
                    if (settings.mode == 'fade') {
                        css['padding-bottom'] = tP + '%'
                    }
                    ob.css(css);
                };

                //checking if lazy loading is true then set height after lazy loading//
                if (obj.find("img").length && settings.lazyLoad) {
                    obj.find("img").load(function () {
                        setCss();
                    });
                } else {
                    setCss();
                }
                if (obj.find('img').length) {
                    if (obj.find('img')[0].complete) {
                        setCss();
                        if (!interval) {
                            $this.auto();
                        }
                    } else {
                        obj.find('img').load(function () {
                            setTimeout(function () {
                                setCss();
                                if (!interval) {
                                    $this.auto();
                                }
                            }, 100);
                        });
                    }
                } else {
                    if (!interval) {
                        $this.auto();
                    }
                }
            },
            active: function (ob, t) {
                var sc = 0;
                if (this.doCss() && settings.mode === 'fade') {
                    $slide.addClass('gscr_on');
                }
                if (scene * settings.slideMove + settings.item <= length) {
                    ob.removeClass('gscr_active');
                    if (!this.doCss() && settings.mode === 'fade' && t === false) {
                        ob.fadeOut(settings.speed);
                    }
                    var l, nl;
                    if (t === true) {
                        l = ob.length;
                        nl = l - 1;
                    }
                    sc = t === true ? scene - $el.find('.gscr_clone.gscr_left').length : scene * settings.slideMove;
                    if (t === true) {
                        l = ob.length;
                        nl = l - 1;
                        if (sc + 1 === l) {
                            sc = nl;
                        } else if (sc + 1 > l) {
                            sc = 0;
                        }
                    }
                    if (!this.doCss() && settings.mode === 'fade' && t === false) {
                        ob.eq(sc).fadeIn(settings.speed);
                    }
                    if (!t) {
                        if (!settings.loop) {
                            var remaining = $el.getTotalSlideCount() - (sc + settings.item);
                            if (remaining < 0) {
                                sc -= Math.abs(remaining);
                            }
                        }
                    }
                    ob.eq(sc).addClass('gscr_active');
                } else {
                    ob.removeClass('gscr_active');
                    var activeIndex = ob.length - 1;
                    if (!t) {
                        activeIndex -= settings.item - 1;
                    }
                    ob.eq(activeIndex).addClass('gscr_active');
                    if (!this.doCss() && settings.mode === 'fade' && t === false) {
                        ob.fadeOut(settings.speed);
                        ob.eq(sc).fadeIn(settings.speed);
                    }
                }
            },
            move: function (ob, v) {
                if (this.doCss()) {
                    ob.css({
                        'transform': 'translate3d(' + (-v) + 'px, 0px, 0px)',
                        '-webkit-transform': 'translate3d(' + (-v) + 'px, 0px, 0px)'
                    });
                } else {
                    ob.css('position', 'relative').animate({
                        left: -v + 'px'
                    }, settings.speed);

                }
                //Todo: Uncomment code when we need to merge waterwheel
                //WaterWheel Effect//
                /*if (settings.waterwheel) {
                 var tempMiddleScene = middleScene;
                 middleScene = scene - (Math.floor(settings.item / 2));
                 if (tempMiddleScene != middleScene) {
                 plugin.tagCenter();

                 }
                 }*/
            },
            //Todo: Uncomment code when we need to merge waterwheel
            //WaterWheel Effect//
            /*tagCenter: function () {
             var neighborCount = Math.floor(settings.item / 2),
             maxCounter = neighborCount + 1,
             c = $children;
             c.removeClass("gscr_center");
             for (var i = 1; i <= maxCounter * 2 + 1; i++) {
             var j = i > maxCounter + 1 ? (maxCounter + 2 - i) + maxCounter : i;
             var transVal = 1 + (j / 5);
             var opacity = 1 - (maxCounter + 1 - j) / 8;
             c.eq(scene + (i - 2)).css({
             'z-index': j,
             'position': 'relative',
             'transform': 'scale(' + transVal + ', ' + transVal + ')',
             'opacity': opacity
             });
             }
             },*/
            fade: function () {
                this.active($children, false);
                var $thumb = $slide.parents('.gscr_slideOuter ').find('.gscr_lSPager .gscr_dot');
                this.active($thumb, true);
            },
            slide: function () {
                if (!settings.loop) {
                    $el.hideShowActions();
                }
                if (settings.adaptiveHeight === true) {
                    $el.css('height', $children.eq(scene).outerHeight(true));
                }
                if (!isActive) {
                    isActive = true;
                }
                var $this = this;
                refresh.calSlide = function () {
                    if (w > elSize) {
                        slideValue = $this.slideValue();
                        $this.active($children, false);
                        if ((slideValue) > w - elSize - settings.slideMargin) {
                            slideValue = w - elSize - settings.slideMargin;
                        } else if (slideValue < 0) {
                            slideValue = 0;
                        }
                        $this.move($el, slideValue);
                    }
                };
                refresh.calSlide();
                var $thumb = $slide.parents('.gscr_slideOuter').find('.gscr_lSPager .gscr_dot');
                this.active($thumb, true);
                $this.updateCounter();
            },
            updateCounter: function () {
                if (settings.showCounter) {
                    var activeSlide = $el.getActiveSlide(),
                        counterVal = {
                            'current': function () {
                                return (activeSlide.activeIndex + 1);
                            }(),
                            'total': function () {
                                return totalItems;
                            }()
                        };
                    activeSlide.noCount ? $counterWrapper.hide() : $counterWrapper.show();
                    $counterWrapper.html(settings.counterText.replace(/\{(.+?)\}/g, function (m, d) {
                        return counterVal[d] || counterVal[d] == 0 ? counterVal[d].toString() : '';
                    }));
                }
            },
            resetSlide: function (mode, callback) {
                if (settings.mode == 'slide') {
                    var sVal = plugin.slideValue();
                    $slide.css({
                        "transition-duration": "0ms",
                        "-webkit-transition-duration": "0ms"
                    });
                    mode == "next" ? scene++ : scene--;
                    $el.css({
                        "transform": "translate3d(-" + sVal + "px, 0px, 0px)"
                    });
                }
                setTimeout(function () {
                    $slide.css({
                        "transition-duration": settings.speed+"ms",
                        "-webkit-transition-duration": settings.speed+"ms"
                    });
                    callback();
                }, 80);
            },
            slideValue: function () {
                var _sV = 0;
                if (settings.autoWidth === false) {
                    _sV = scene * ((slideWidth + settings.slideMargin) * settings.slideMove);
                    if (settings.showUpcoming) {
                        _sV -= upcomingSlidePx;
                    }
                } else {
                    _sV = 0;
                    for (var i = 0; i < scene; i++) {
                        _sV += (parseInt($children.eq(i).width(), 10) + settings.slideMargin);
                    }
                }
                return _sV;
            },
            slideThumb: function () {
                var position;
                switch (settings.currentPagerPosition) {
                    case 'left':
                        position = 0;
                        break;
                    case 'middle':
                        position = (elSize / 2) - (thumbWidth / 2);
                        break;
                    case 'right':
                        position = elSize - thumbWidth;
                        break;
                    default:
                        return;
                }
                var sc = scene - $el.find('.gscr_clone.gscr_left').length;
                var $pager = $slide.parents('.gscr_slideOuter').find('.gscr_lSPager');
                if (sc >= $pager.children().length) {
                    sc = 0;
                } else if (sc < 0) {
                    sc = $pager.children().length;
                }
                var thumbSlide = sc * ((thumbWidth + settings.thumbMargin)) - (position);
                if ((thumbSlide + elSize) > pagerWidth) {
                    thumbSlide = pagerWidth - elSize - settings.thumbMargin;
                }
                if (thumbSlide < 0) {
                    thumbSlide = 0;
                }
                this.move($pager, thumbSlide);
            },
            auto: function () {
                if (settings.auto) {
                    clearInterval(interval);
                    interval = setInterval(function () {
                        $el.goToNextSlide();
                    }, settings.pause);
                }
            },
            pauseOnHover: function () {
                var $this = this;
                if (settings.auto && settings.pauseOnHover) {
                    $slide.on('mouseenter', function () {
                        $(this).addClass('gscr_ls-hover');
                        $el.pause();
                        settings.auto = true;
                    });
                    $slide.on('mouseleave', function () {
                        $(this).removeClass('ls-hover');
                        if (!$slide.find('.gscr_carousel').hasClass('gscr_lsGrabbing')) {
                            $this.auto();
                        }
                    });
                }
            },
            touchMove: function (endCoords, startCoords) {
                $slide.css('transition-duration', '0ms');
                if (settings.mode === 'slide') {
                    var distance = endCoords - startCoords,
                        swipeVal = slideValue - distance;
                    if(Math.abs(distance)>=settings.swipeThreshold){
                        if ((swipeVal) >= w - elSize - settings.slideMargin) {
                            if (settings.freeMove === false && settings.loop === false) {
                                swipeVal = w - elSize - settings.slideMargin;
                            } else if (settings.loop === false) {
                                var swipeValT = w - elSize - settings.slideMargin;
                                swipeVal = swipeValT + ((swipeVal - swipeValT) / 5);
                            }
                        } else if (swipeVal < 0) {
                            if (!settings.loop) {
                                swipeVal = settings.freeMove ? swipeVal / 5 : 0;
                            }
                        }
                        var touchVal = draggedVal = plugin.getSwipeVal(swipeVal);
                        if(this.doCss()){
                            this.move($el, touchVal);
                        }
                    }
                }
            },
            getSwipeVal: function (swipeVal) {
                if (settings.loop) {
                    var i, l, m = settings.slideMargin, w, r, mx, autoW = settings.autoWidth;
                    if (!autoW) {
                        i = settings.item;
                        l = $children.length;
                        w = slideWidth;
                        r = i * (w + m); //reset value or min value
                        mx = (l - i) * (m + w);    //max value
                    } else {
                        var a = slideCalc;
                        mx = a.totalW - a.rightW;
                        r = a.leftW;

                    }
                    if ((!showPartialMode && swipeVal >= mx) || (showPartialMode && ((i > 1 && swipeVal >= mx - upcomingSlidePx - slideWidth - m) || (i == 1 && swipeVal >= mx - slideWidth - m)))) {
                        return r + swipeVal - mx;
                    } else if ((swipeVal <= 0 && !showPartialMode) || (showPartialMode && ((i > 1 && swipeVal <= upcomingSlidePx + slideWidth + m) || (i ==1 && swipeVal <= slideWidth-(upcomingSlidePx*2))))) {
                        return !autoW ? mx + swipeVal - (i * (m + w)) : a.resetW + swipeVal;
                    }
                }
                return swipeVal;
            },
            updateSlideCalc: function () {
                var $c = $children,
                    $leftCl = $el.find(".gscr_left"),
                    totalCl = $leftCl.length,
                    $resetEle = $c.slice(0, $c.length - (totalCl * 2));
                slideCalc = {
                    leftW: plugin._getEleWidth($leftCl),
                    rightW: plugin._getEleWidth($el.find(".gscr_right")),
                    resetW: plugin._getEleWidth($resetEle),
                    totalW: plugin._getEleWidth($c),
                    totalCl: totalCl
                };
            },
            /**
             * Get current slide index//
             */
            getCurrentScn: function(){
                if (settings.loop && settings.mode=='slide') {
                    var items = settings.item,
                        maxItems = $children.length - items * 2;
                    scn = scene - items;
                    //If scene reaches end then reset it to 0//
                    if (scn >= maxItems) {
                        scn = 0;
                    } else if(scn < 0){
                        //If scene goes less than 0 then reset it to end index//
                        scn = maxItems-(Math.abs(scn));
                    }
                } else {
                    scn = scene;
                }
            },
            _getEleWidth: function ($e) {
                var w = 0;
                $e.each(function () {
                    w += parseInt($(this).width(), 10) + settings.slideMargin;
                });
                return w;
            },
            touchEnd: function (distance) {
                $slide.css('transition-duration', settings.speed + 'ms');
                if (settings.mode === 'slide') {
                    var _next = true,
                        mxVal = false,
                        lp = settings.loop;
                    slideValue = draggedVal;
                    if ((slideValue) > w - elSize - settings.slideMargin) {
                        slideValue = lp ? plugin.getSwipeVal(slideValue) : w - elSize - settings.slideMargin;
                        if (settings.autoWidth === false) {
                            mxVal = true;
                        }
                    } else if (slideValue <= 0) {
                        slideValue = lp ? plugin.getSwipeVal(slideValue) : 0;
                    }
                    var gC = function (next) {
                        var ad = lp ? next ? 1 : 0 : next && !mxVal ? 1 : 0;
                        if (!settings.autoWidth) {
                            var num = slideValue / ((slideWidth + settings.slideMargin) * settings.slideMove);
                            scene = parseInt(num, 10) + ad;
                            if (slideValue >= (w - elSize - settings.slideMargin)) {
                                if (num % 1 !== 0) {
                                    scene++;
                                }
                            }
                        } else {
                            var tW = 0;
                            for (var i = 0; i < $children.length; i++) {
                                tW += (parseInt($children.eq(i).width(), 10) + settings.slideMargin);
                                scene = i + ad;
                                if (tW >= slideValue) {
                                    break;
                                }
                            }
                        }
                    };
                    if (distance >= settings.swipeThreshold) {
                        gC(false);
                        _next = false;
                    } else if (distance <= -settings.swipeThreshold) {
                        gC(true);
                        _next = false;
                    }
                    $el.mode(_next);
                    if (settings.gallery) {
                        this.slideThumb();
                    }
                } else {
                    if (Math.abs(distance) > settings.swipeThreshold) {
                        distance >= settings.swipeThreshold ? $el.goToPrevSlide() : $el.goToNextSlide();
                    }
                }
            },
            enableDrag: function () {
                var $this = this;
                if (!isTouch) {
                    var startCoords = 0,
                        endCoords = 0,
                        isDraging = false;
                    $slide.find('.gscr_carousel').addClass('gscr_lsGrab');
                    $slide.on('mousedown', function (e) {
                        if (w < elSize) {
                            if (w !== 0) {
                                return false;
                            }
                        }
                        var target = $(e.target);
                        if (!target.is('.gscr_lSPrev') && !target.is('.gscr_lSNext')) {
                            startCoords = e.pageX;
                            isDraging = true;
                            if (e.preventDefault) {
                                e.preventDefault();
                            } else {
                                e.returnValue = false;
                            }
                            // ** Fix for webkit cursor issue https://code.google.com/p/chromium/issues/detail?id=26723
                            $slide.scrollLeft += 1;
                            $slide.scrollLeft -= 1;
                            // *
                            $slide.find('.gscr_carousel').removeClass('gscr_lsGrab').addClass('gscr_lsGrabbing');
                            clearInterval(interval);
                        }
                    });
                    $window.on('mousemove', function (e) {
                        if (isDraging) {
                            $slide.find('.gscr_carousel').addClass('gscr_lsDragging');
                            endCoords = e.pageX;
                            $this.touchMove(endCoords, startCoords);
                        }
                    });
                    $window.on('mouseup', function (e) {
                        if (isDraging) {
                            //added setTimeout so that we can detect if the slider was dragged (we can prevent click events by this)
                            setTimeout(function(){
                                $slide.find('.gscr_carousel').removeClass('gscr_lsGrabbing gscr_lsDragging').addClass('gscr_lsGrab');
                            }, 100);

                            isDraging = false;
                            endCoords = e.pageX;
                            var distance = endCoords - startCoords;
                            if (Math.abs(distance) >= settings.swipeThreshold) {
                                $window.on('click.ls', function (e) {
                                    if (e.preventDefault) {
                                        e.preventDefault();
                                    } else {
                                        e.returnValue = false;
                                    }
                                    e.stopImmediatePropagation();
                                    e.stopPropagation();
                                    $window.off('click.ls');
                                });
                            }
                            $this.touchEnd(distance);
                        }
                    });
                }
            },
            enableTouch: function () {
                var $this = this;
                if (isTouch) {
                    var startCoords = {},
                        endCoords = {};
                    $slide.on('touchstart', function (e) {
                        endCoords = e.originalEvent.targetTouches[0];
                        startCoords.pageX = e.originalEvent.targetTouches[0].pageX;
                        startCoords.pageY = e.originalEvent.targetTouches[0].pageY;
                        clearInterval(interval);
                    });
                    $slide.on('touchmove', function (e) {
                        if (w < elSize) {
                            if (w !== 0) {
                                return false;
                            }
                        }
                        var orig = e.originalEvent;
                        endCoords = orig.targetTouches[0];
                        var xMovement = Math.abs(endCoords.pageX - startCoords.pageX);
                        var yMovement = Math.abs(endCoords.pageY - startCoords.pageY);
                        if ((xMovement * 3) > yMovement) {
                            e.preventDefault();
                        }
                        $this.touchMove(endCoords.pageX, startCoords.pageX);
                    });
                    $slide.on('touchend', function () {
                        if (w < elSize) {
                            if (w !== 0) {
                                //Todo: Uncomment it at later stage. User is not able to redirect in case there is an anchor tag so commented this for now.
                                //return false;
                            }
                        }
                        $this.touchEnd(endCoords.pageX - startCoords.pageX);
                    });
                }
            },
            build: function () {
                var $this = this;
                $this.initialStyle();

                //if (this.doCss()) {
                if (settings.enableTouch === true) {
                    $this.enableTouch();
                }
                if (settings.enableDrag === true) {
                    $this.enableDrag();
                }
                //}
                $this.auto();
                $window.on('blur', function () {
                    clearInterval(interval);
                });
                $this.pager();
                $this.pauseOnHover();
                $this.controls();
                $this.createCounter();
                plugin.assignNumbers();
            }
        };
        plugin.build();
        refresh.init = function () {
            //Todo: Uncomment code when we need to merge waterwheel
            //If waterwheel is true then disable some options so that waterwheel can't get distorted//
            /*if(settings.waterwheel===true){
             settings.autoWidth=false;
             settings.showUpcoming=true;
             settings.mode='slide';
             }*/
            refresh.chbreakpoint();
            //Adding 1 more pixel so that slides don't break down//
            //Todo: remove +1 to get rid of 1px border issue.
            //elSize = $slide.outerWidth();
            elSize = $sliderParent.outerWidth();
            if (settings.loop === true && settings.mode === 'slide') {
                refresh.clone();
            }
            $el.lazyLoad();
            refresh.calL();
            if (settings.mode === 'slide') {
                $el.removeClass('gscr_lSSlide');
                refresh.calSW();
                refresh.sSW();
                plugin.setHeight($el, false);
            } else {
                plugin.setHeight($el, true);
            }
            setTimeout(function () {
                if (settings.mode === 'slide') {
                    $el.addClass('gscr_lSSlide');
                }
            }, 1000);
            if (settings.pager) {
                refresh.createPager();
            }
            if (settings.gallery === true) {
                plugin.slideThumb();
            }
            if (settings.mode === 'slide') {
                plugin.slide();
            }
            var _lsAction = $slide.next();
            if (settings.autoWidth === false) {
                $children.length <= settings.item ? _lsAction.hide() : _lsAction.show();
            } else {
                ((refresh.calWidth(false) < elSize) && (w !== 0)) ? _lsAction.hide() : _lsAction.show();
            }
        };
        $el.goToPrevSlide = function () {
            //cleartimeout for autoplay when jump to previous slide
            if(settings.auto){
                clearInterval(interval);
                plugin.auto();
            }
            var compareScene = showPartialMode ? 1 : 0;
            if (scene > compareScene) {
                settings.onBeforePrevSlide.call(this, $el, scn, $el.getActiveItems());
                scene--;
                $el.mode(false);
                if (settings.gallery === true) {
                    plugin.slideThumb();
                }
            } else {
                if (settings.loop === true) {
                    settings.onBeforePrevSlide.call(this, $el, scn, $el.getActiveItems());
                    if (settings.mode === 'fade') {
                        var l = (length - 1);
                        scene = parseInt(l / settings.slideMove);
                    } else {
                        scene = $children.length - (slideCalc.totalCl * 2);
                    }
                    if (showPartialMode) {
                        scene++;
                    }
                    plugin.resetSlide('prev', function () {
                        $el.mode(false);
                        if (settings.gallery === true) {
                            plugin.slideThumb();
                        }
                    });

                } else if (settings.slideEndAnimation === true) {
                    $el.addClass('leftEnd');
                    setTimeout(function () {
                        $el.removeClass('leftEnd');
                    }, 400);
                }
            }
        };
        $el.goToNextSlide = function () {
            //cleartimeout for autoplay when jump to next slide
            if(settings.auto){
                clearInterval(interval);
                plugin.auto();
            }
            var nextI = true;
            if (settings.mode === 'slide') {
                var _slideValue = plugin.slideValue(),
                    _sM = settings.slideMargin;
                if (showPartialMode) {
                    _slideValue += slideWidth + _sM;
                }
                nextI = _slideValue < w - elSize - _sM;
                if (scene == $children.length - slideCalc.totalCl && settings.autoWidth) {
                    nextI = false;
                }
            }

            if ((scene * settings.slideMove + settings.item < length) && nextI) {
                settings.onBeforeNextSlide.call(this, $el, scn, $el.getActiveItems());
                scene++;
                $el.mode(false);
                if (settings.gallery === true) {
                    plugin.slideThumb();
                }
            } else {
                if (settings.loop === true) {
                    settings.onBeforeNextSlide.call(this, $el, scn, $el.getActiveItems());
                    scene = slideCalc.totalCl;
                    if (showPartialMode) {
                        scene--;
                    }
                    plugin.resetSlide('next', function () {
                        $el.mode(false);
                        if (settings.gallery === true) {
                            plugin.slideThumb();
                        }
                    });
                } else if (settings.slideEndAnimation === true) {
                    $el.addClass('gscr_rightEnd');
                    setTimeout(function () {
                        $el.removeClass('gscr_rightEnd');
                    }, 400);
                }
            }
        };
        $el.hideShowActions = function () {
            if (!settings.loop) {
                var prevEle = $slide.next().find(".gscr_lSPrev"),
                    nextEle = $slide.next().find(".gscr_lSNext");
                scene*settings.slideMove >= $children.length - settings.item ? nextEle.hide() : nextEle.show();
                scene <= 0 ? prevEle.hide() : prevEle.show();
            }
        };
        $el.lazyLoad = function () {
            if (settings.lazyLoad && $.fn.gsp_lazyload) {
                $document.trigger('gse_lazyload');
                if (isActive) {
                    var activeItems = $el.getActiveItems(true).active_items;
                    activeItems.first().add(activeItems.last()).find("img[data-gsll-src]").trigger('gse_lazyload');
                }
            }
        };
        $el.getActiveItems = function (lazy) {
            var items = settings.item,
                start = scene,
                end = scene + items,
                sMove = settings.slideMove;
            if (typeof lazy != 'undefined' && lazy === true) {
                if (settings.preLazyLoad && settings.loop) {
                    start -= sMove;
                    end += sMove;
                }
                if (showPartialMode) {
                    start--;
                    end++;
                }
            }
            var activeItems = {active_items: $children.slice(start, end)};
            if (items % 2 !== 0) {
                activeItems.center_item = $children.eq(scene + Math.floor(items / 2));
            }
            return activeItems;
        };
        $el.addSlide = function (ele, pos) {
            $(ele).insertAfter($children.eq(pos - 1));
            $el.refresh();
            $el.jumpToSlide(pos);
        };
        $el.removeSlide = function (pos) {
            $children.eq(pos - 1).remove();
            $el.refresh();
        }
        $el.mode = function (_touch) {
            $el.hideShowActions();
            if (settings.adaptiveHeight === true) {
                $el.css('height', $children.eq(scene).outerHeight(true));
            }
            if (on === false) {
                if (plugin.doCss()) {
                    $el.addClass('gscr_slide');
                    if (settings.speed !== '') {
                        $slide.css('transition-duration', settings.speed + 'ms');
                    }
                    if (settings.cssEasing !== '') {
                        $slide.css('transition-timing-function', settings.cssEasing);
                    }
                }
            }
            if (!_touch) {
                plugin.getCurrentScn();
                settings.onBeforeSlide.call(this, $el, scn, $el.getActiveItems());
            }
            settings.mode === 'slide' ? plugin.slide() : plugin.fade();
            if (!$slide.hasClass('gscr_ls-hover')) {
                plugin.auto();
            }
            setTimeout(function () {
                if (!_touch) {
                    $el.lazyLoad();
                    settings.onAfterSlide.call(this, $el, scn, $el.getActiveItems());
                }
            }, settings.speed);
            on = true;
        };
        $el.play = function () {
            $el.goToNextSlide();
            settings.auto = true;
            plugin.auto();
        };
        $el.pause = function () {
            settings.auto = false;
            clearInterval(interval);
        };
        $el.refresh = function () {
            refresh.init();
        };
        $el.getTotalSlideCount = function () {
            totalItems = $slide.find('.gscr_lslide').length - $slide.find('.gscr_lslide*[data-gscr-nocount]').length;
            return totalItems;
        };
        $el.getActiveSlide = function () {
            var $active = $children.filter(function () {
                    return $(this).is('.gscr_active');
                }),
                activeIndex = $active.data('gscr-index'),
                noCount = false;
            if (typeof activeIndex === 'undefined') {
                noCount = true;
                activeIndex = initCounter == 0 ? -1 : initCounter;
            } else {
                initCounter = activeIndex;
            }
            return {activeIndex: activeIndex, activeSlide: $active, noCount: noCount};
        };
        $el.goToSlide = function(pos){
            if(pos > totalItems){
                pos = totalItems;
            }
            if(settings.loop){
                pos+=settings.item;
            }
            $el.jumpToSlide(pos-1);
        };
        $el.jumpToSlide = function (s) {
            scene = s;
            $el.mode(false);
            if (settings.gallery === true) {
                plugin.slideThumb();
            }
        };
        $el.getCurrentSlideCount = function () {
            var slideCount = $children.length;
            if (settings.loop && settings.mode=='slide') {
                slideCount -= (settings.item * 2);
            }
            return slideCount;
        };
        $el.destroy = function () {
            if ($el.gsp_carousel) {
                $el.goToPrevSlide = $el.goToNextSlide = $el.mode = $el.play = $el.pause = $el.refresh = $el.getCurrentSlideCount = $el.getTotalSlideCount = $el.jumpToSlide = function () {};
                $el.gsp_carousel = null;
                refresh = {
                    init: function () {
                    }
                };

                //remove carousel elements
                var $outer = $el.parents('.gscr_slideOuter'),
                    $destroyedEl = $el.clone().insertBefore($outer),
                    $slides = $destroyedEl.find('.gscr_clone').remove().end().find('>');
                $destroyedEl.removeClass('gscr_carousel gscr_slide gscr_lsGrab').removeAttr('style');
                $slides.removeClass('gscr_lslide gscr_active').removeAttr('data-gscr-index');

                //if its an autowidth carousel then don't play with its inline width
                if(!settings.autoWidth){
                    $slides.css('width', 'auto');
                }

                $outer.remove();
                $children = interval = null;
                on = false;
                scene = 0;
            }
        };
        setTimeout(function () {
            plugin.getCurrentScn();
            plugin.updateSlideCalc();
            sliderInitiated = true;
            settings.onSliderLoad.call(this, $el, scn);
        }, 10);
        $window.on('resize orientationchange', function (e) {
            /*if(resizeT){
                clearTimeout(resizeT);
            }*/
            resizeT = setTimeout(function () {
                if (e.preventDefault) {
                    e.preventDefault();
                } else {
                    e.returnValue = false;
                }
                refresh.init();
            }, 200);
        });
        $el.data('gsp_carousel', this);
        return this;
    };
})(jQuery);