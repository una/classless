import Ember from 'ember';
import App from '../app';
import _ from 'lodash/lodash';
import $ from 'jquery';
import BaseController from '../controllers/base';
import ENV from '../config/environment';
import { get } from '../utils/apiHelpers';
import getTimings from '../utils/getPerfTimings';
import updateQueryStringParams from '../utils/updateQueryStringParams';
import isRailsRendered from '../utils/is-rails-rendered';
import {STATUS_CODE_UNAUTHORIZED, STATUS_CODE_FORBIDDEN} from '../constants';
import {isPageVisibilitySupported, setupPageVisibilityListeners} from '../utils/page-visibility';

const POLL_UPDATES_TIMEOUT_MS = 60000; /* 60 seconds */

// This event is used to clean up rails views event listeners and timeouts
let triggerAuroraStartEvent = function() {
  $(document).trigger('aurora-start');
};


export default App.ApplicationController = BaseController.extend({
  queryParams: [{
    i: {
      scope: 'controller'
    }
  }],

  updateContextIdQueryParam: function() {
    if (this.get('model.shortCurrentContextId')) {
      let queryParam = this.get('model.shortCurrentContextId');
      this.set('i', queryParam);
      updateQueryStringParams({
        i: queryParam
      });
    }
  }.observes('model.shortCurrentContextId'),

  actions: {
    showNotification: function (message, type) {
      App.NotificationsManager.show(message, type);
    },
    switchContext: function(context, redirectTo) {
      if (this.get('context').isCurrentContext(context)) {
        return;
      }

      this.setProperties({
        currentContext: App.User,
        newContext: context,
        isSwitchingContext: true,
        redirectTo: redirectTo
      });
    },
    onSwitchContextTransitionComplete: function() {
      this.get('context').switchContext(this.get('newContext'), this.get('redirectTo')).catch((resp) => {
        this.errorHandler('Context Switching', resp, 'Unable to set current context.');
      });
    },
    onError: function(err) {
      this.logException(err, 'Error handling request');
    }
  },
  currentLocationPath: window.location.pathname,
  pendingNotifications: window.pendingDisplayedNotifications,
  pendingNotificationsCount: window.pendingDisplayedNotifications ? window.pendingDisplayedNotifications.length : 0,

  prevPath: null,
  haveSeenRailsRoute: false,
  haveRemovedRailsElements: false,
  dropletCreateEventsDisabled: false,
  context: Ember.inject.service('context'),
  isSwitchingContext: false,
  currentContext: null,
  newContext: null,
  redirectTo: null,

  statusNotifications: null,

  version: null,
  newVersionAvailable: false,
  isPollingUpdate: true,

  news: null,

  init: function() {
    this.initDom();
    this.pagePerfTracking();

    Ember.run.schedule('afterRender', this, () => {
      this.fetchStatusNotifications();
      this.setupPageVisibility();
      this.fetchNewsNotifications();
      this.setupLinkTracking();
      this.setSCookie();
    });
  },

  setupPageVisibility: function() {
    if(!isPageVisibilitySupported()) {
      this.pollForVersionUpdate();
    } else {
      setupPageVisibilityListeners((isHidden) => {
        if(isHidden) {
          this.set('isPollingUpdate', false);
        } else if(!this.get('newVersionAvailable') && !this.get('isPollingUpdate')) {
          this.set('isPollingUpdate', true);
          this.pollForVersionUpdate();
        }
      });

      if(!this.get('newVersionAvailable')) {
        this.pollForVersionUpdate();
      }
    }
  },

  initDom: function () {
    if(ENV.environment === 'development') {
      document.insertBefore(document.implementation.createDocumentType('html', '', ''), document.firstChild);
    }
    Ember.$('#aurora-container').addClass('owns-css');
  },

  fetchStatusNotifications: function() {
    this.store.findAll('status-notification').then((resp) => {
      this.set('statusNotifications', resp);
    }).catch((e) => {
      this.logException(e, 'Fetching status notifications');
    });
  },

  // track regular a[href] style links automatically with segment
  setupLinkTracking: function () {
    let that = this;
    Ember.$('.aurora-body').on('click', 'a[href]:not([id^="ember"]):not([data-ember-action])', function () {
      that.segment.trackEvent('User Action', {
        actionName: 'Link Click',
        link: this.getAttribute('href'),
        linkText: this.innerText || this.textContent
      });
    });
  },

  // Track page performance load times with Segment
  pagePerfTracking: function() {
    // Safety: If we don't have this object, we don't have anything to measure.
    if (!(window.performance && window.performance.timing)) {
      return;
    }

    const POLL_INTERVAL = 250;
    const DURATION = 30000;
    let start = Date.now();

    // In order to ensure that *all* metrics are ready, we're going to poll for
    // the presence of `loadEventEnd`, which should be the last metric that we
    // care about.
    let perfInterval = setInterval(() => {
      let blockProceeding = true;
      let measurements;

      // If we've waited through our duration, we shouldn't block the
      // measurement from proceeding anymore.
      if ((Date.now() - start) > DURATION) {
        blockProceeding = false;
      }

      // We have protections up top, but in a few cases, we're getting to this
      // point, and suddenly the `performance` object becomes `undefined`.
      try {
        // If we don't have a `loadEventEnd` and we are blocked from
        // proceeding, go ahead and exit early.
        if (!window.performance.timing.loadEventEnd && blockProceeding) {
          return;
        }

        // By here, we should have all we need, so stop checking and measure things.
        clearInterval(perfInterval);
        measurements = getTimings();
      } catch (err) {
        // Something failed in getting measurements, so stop the interval and
        // exit without attempting to send measures.
        clearInterval(perfInterval);
        return;
      }

      if (measurements && this.segment) {
        this.segment.trackEvent('Web Performance', measurements);
      }
    }, POLL_INTERVAL);
  },

  redirectToLogin: function() {
    window.location.href = '/login';
  },

  pollForVersionUpdate: function() {
    let apiNS = ENV['api-namespace'];
    if(this.get('isPollingUpdate')) {
      get(`/${apiNS}/updates`).then((resp) => {
        resp.json().then((json) => {
          let currentVersion = this.get('version');
          if(currentVersion !== json.version) {
            if(currentVersion) {
              // application route will check for `newVersionAvailable` on `willTransition`
              // and will reload the page to get the latest revision
              this.set('newVersionAvailable', true);
            }
            this.set('version', json.version);
          }

          // keep polling for updates until we have a new version
          if(!this.get('newVersionAvailable')) {
            Ember.run.later(this.pollForVersionUpdate.bind(this), POLL_UPDATES_TIMEOUT_MS);
          }
        });
      }).catch((e) => {
        if(e && ([STATUS_CODE_UNAUTHORIZED, STATUS_CODE_FORBIDDEN].indexOf(parseInt(e.status, 10)) !== -1 || e.message && e.message.indexOf('Network request failed') !== -1)) {
          this.redirectToLogin();
        } else {
          let status = e.status || 'Unknown status';
          let msg = e.message || e.statusText || 'Unknown error';
          let err = new Error(`${status}: ${msg}`);
          this.logException(err, 'Polling for version update');
        }
      });
    }
  },

  setSCookie: function() {
    let uuid = App.getUUID();
    if(uuid) {
      let expires = new Date();
      expires.setDate(expires.getDate() + 365 * 20); // 20 years in the future
      let utc = expires.toUTCString();

      window.document.cookie = `S=${uuid};expires=${utc};path=/`;
    }
  },

  isReadOnly: function() {
    return App.User && App.User.get('isReadOnly');
  }.property('model'),

  fetchNewsNotifications: function() {
    this.store.query('notification', { level: 3, paginate: false, unread: true }).then((notifications) => {
      this.set('news', notifications.filter((item) => {
        return item.get('isNewsNotification') && !item.get('acknowledged');
      }));
    }).catch((e) => {
      this.logException(e, 'Fetch news notifications');
    });
  },

  onPathChanged: function() {
    let $auroraContainer;
    let $previousFocus = Ember.$('.navLink:focus');
    let currPath = this.get('currentPath');
    // If we are on a rails route, take note of it
    let currPathIsRails = isRailsRendered(currPath);
    let prevPathIsRails = isRailsRendered(this.prevPath);

    if (currPathIsRails) {
      if (this.haveRemovedRailsElements) {
        window.location.reload();
      } else {
        this.haveSeenRailsRoute = true;
      }
    } else if (this.haveSeenRailsRoute && !this.haveRemovedRailsElements && prevPathIsRails && !currPathIsRails) {
      let $cloudContainer = Ember.$('.cloud-container').css('opacity', '0');
      if (this.prevPath === 'networking') {
        $auroraContainer = Ember.$('#aurora-container');
        // reappend the dropdowns to the ember app
        Ember.$('.aurora-auto-complete').appendTo($auroraContainer);
      } else if (this.prevPath === 'settings') {
        let $sidenav = Ember.$('.js-settings-side-nav');
        $sidenav.css('display', 'none');
        $auroraContainer = Ember.$('.aurora-body');
        // reappend the sidenav to the ember app for event listener cleanup
        $sidenav.appendTo($auroraContainer);
      }
      // If we have a lingering console from the droplet disconnect
      if (window.rfb && _.isFunction(window.rfb.disconnect)) {
        window.rfb.disconnect();
      }
      //Remove all rails-rendered content
      $cloudContainer.remove();
      this.haveRemovedRailsElements = true;
      triggerAuroraStartEvent();

      //Clear styles applied to the body from cloud
      document.body.className = 'control_panel index';
    }
    this.prevPath = currPath;

    Ember.run.next(() => {
      // This is used for the navbar active class on non link-to list items.
      if (!(this.get('isDestroyed') || this.get('isDestroying'))) {
        let currentPath = window.location.pathname;

        this.setProperties({
          currentLocationPath: currentPath,
          isOauthAuthPage: currentPath.indexOf('oauth/authorize') > -1,
          isTeamCreationPage: currentPath.indexOf('settings/team/new') > -1
        });
        // TODO(selby): replace this with better sticky query parameters across routes
        this.updateContextIdQueryParam();
      }
      // Ensure we don't keep focus on the nav items as we transition via
      // the back button.
      $previousFocus.blur();
    });
  }.observes('currentPath')
});
