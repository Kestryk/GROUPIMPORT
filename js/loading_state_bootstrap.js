/*
 * EasyStud loading-state bootstrap.
 *
 * This classic script deliberately loads before RequireJS so the server-rendered
 * manager can fail open even when the AMD bundle cannot start.
 */
(function() {
    'use strict';

    var rootId = 'local-groupimport-easystud';
    var loadingStateAttribute = 'data-easystud-loading-state';
    var diagnosticsQueryParameter = 'easystudloadingdiagnostics';
    var diagnosticsGlobalName = '__easyStudLoadingDiagnostics';
    var diagnosticsEventName = 'easyedu:loading-diagnostic';
    var failOpenDelay = 8000;

    var diagnosticsEnabled = function() {
        try {
            return new URL(window.location.href).searchParams.get(diagnosticsQueryParameter) === '1';
        } catch (error) {
            return false;
        }
    };

    var interactionRegions = function(root) {
        return [
            root.querySelector('[data-easystud-real-content]'),
            root.querySelector('.local-groupimport-easystud__layout'),
            root.querySelector('.local-groupimport-easystud__layout-toggles'),
            root.querySelector('[data-easystud-mobile-view-switcher]')
        ].filter(Boolean);
    };

    var isVisible = function(node) {
        if (!node) {
            return false;
        }
        var style = window.getComputedStyle(node);
        var box = node.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
    };

    var captureVisibility = function(root) {
        var regions = interactionRegions(root);
        return {
            rootVisible: isVisible(root),
            realContentVisible: isVisible(root.querySelector('[data-easystud-real-content]')),
            loadingSurfaceVisible: isVisible(root.querySelector('[data-easystud-loading-skeleton]')),
            booting: root.classList.contains('local-groupimport-easystud--booting'),
            loadingState: root.getAttribute(loadingStateAttribute),
            ariaBusy: root.getAttribute('aria-busy') === 'true',
            interactionRegionsInert: regions.length > 0 && regions.every(function(region) {
                return region.inert === true;
            })
        };
    };

    var createDiagnostics = function(root) {
        if (!diagnosticsEnabled()) {
            return null;
        }
        if (root.easystudLoadingDiagnostics) {
            return root.easystudLoadingDiagnostics;
        }

        var startedAt = window.performance && window.performance.now ? window.performance.now() : 0;
        var sequence = 0;
        var requestGeneration = 0;
        var events = [];
        var rootIdentifier = root.id || rootId;
        var diagnostics = {
            nextRequestGeneration: function() {
                requestGeneration += 1;
                return requestGeneration;
            },
            record: function(name, details, regionId) {
                var now = window.performance && window.performance.now ? window.performance.now() : startedAt;
                var event = Object.freeze({
                    sequence: ++sequence,
                    name: name,
                    rootId: rootIdentifier,
                    regionId: regionId || rootIdentifier,
                    elapsedMs: Math.round(Math.max(0, now - startedAt)),
                    details: Object.freeze(Object.assign({}, details || {}))
                });
                events.push(event);
                document.dispatchEvent(new CustomEvent(diagnosticsEventName, {detail: event}));
                return event;
            },
            snapshot: function() {
                return events.slice();
            }
        };
        var registry = window[diagnosticsGlobalName] && typeof window[diagnosticsGlobalName] === 'object' ?
            window[diagnosticsGlobalName] : {};
        registry[rootIdentifier] = diagnostics;
        window[diagnosticsGlobalName] = registry;
        root.easystudLoadingDiagnostics = diagnostics;
        root.setAttribute('data-easystud-loading-diagnostics', 'enabled');
        return diagnostics;
    };

    var installController = function(root) {
        if (!root || root.easystudLoadingController) {
            return root ? root.easystudLoadingController || null : null;
        }

        var diagnostics = createDiagnostics(root);
        var timer = null;
        var setInteractionBlocked = function(blocked) {
            interactionRegions(root).forEach(function(region) {
                if (blocked) {
                    region.setAttribute('inert', '');
                }
                region.inert = blocked;
                if (!blocked) {
                    region.removeAttribute('inert');
                }
            });
        };
        var setStatus = function(state) {
            var status = root.querySelector('[data-easystud-loading-status]');
            if (!status) {
                return;
            }
            var text = status.querySelector('[data-easystud-loading-text]');
            if (!text) {
                return;
            }
            if (state === 'ready') {
                text.textContent = status.getAttribute('data-easystud-ready-label') || '';
            } else if (state === 'loading') {
                text.textContent = status.getAttribute('data-easystud-loading-label') || '';
            } else {
                text.textContent = '';
            }
        };
        var transition = function(state, reason) {
            if (state !== 'ready' && state !== 'degraded') {
                return false;
            }
            if (root.getAttribute(loadingStateAttribute) !== 'loading') {
                return false;
            }
            if (timer !== null) {
                window.clearTimeout(timer);
                timer = null;
            }
            root.setAttribute(loadingStateAttribute, state);
            root.setAttribute('aria-busy', 'false');
            root.classList.remove('local-groupimport-easystud--booting');
            setInteractionBlocked(false);
            var content = root.querySelector('[data-easystud-real-content]');
            if (content) {
                content.hidden = false;
            }
            var skeleton = root.querySelector('[data-easystud-loading-skeleton]');
            if (skeleton) {
                skeleton.hidden = true;
            }
            setStatus(state);
            if (diagnostics) {
                diagnostics.record(state === 'ready' ? 'manager-ready' : 'manager-degraded',
                    Object.assign({reason: reason || 'unknown'}, captureVisibility(root)));
            }
            return true;
        };

        root.easystudLoadingController = Object.freeze({
            complete: transition,
            getDiagnostics: function() {
                return diagnostics;
            },
            getState: function() {
                return root.getAttribute(loadingStateAttribute);
            }
        });
        root.setAttribute('aria-busy', 'true');
        setInteractionBlocked(true);
        setStatus('loading');
        timer = window.setTimeout(function() {
            transition('degraded', 'amd-timeout');
        }, failOpenDelay);
        return root.easystudLoadingController;
    };

    var initialise = function() {
        var root = document.getElementById(rootId);
        if (root && root.getAttribute(loadingStateAttribute) === 'loading') {
            installController(root);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialise, {once: true});
    } else {
        initialise();
    }
})();
