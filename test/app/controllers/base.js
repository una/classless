import Ember from 'ember';
import App from '../app';
import {capitalize} from '../utils/stringUtils';
import _ from 'lodash';

/*
  BaseController can be extend by other controllers to leverage
  the following behaviors:

  - segment tracking
  - error notifications
 */

export default Ember.Controller.extend({
  trackPageName: '',
  DEFAULT_ERR: 'Sorry! Something went wrong!',

  logException: function (error, trackActionForDisplayErrorHandler) {
    let logger = this.get('logger');

    if (logger && logger.captureException) {
      if (error instanceof Error || typeof error === 'string') {
        logger.captureException(error);
      } else {
        logger.captureException(new Error('Invalid error logged'));
      }
    }

    if (trackActionForDisplayErrorHandler) {
      this.errorHandler(error, trackActionForDisplayErrorHandler);
    }
  },

  isReadOnly: function() {
    return App.User && App.User.get('isReadOnly');
  }.property('model'),

  trackAction: function (action, data, trackPageName) {
    trackPageName = trackPageName || this.get('trackPageName');
    if(this.segment) {
      this.segment.trackEvent(trackPageName + ': ' + action, data);
    }
  },

  showError: function(error, errorAction, trackPageName) {
    App.NotificationsManager.show((error ? error.trim() : '') || this.DEFAULT_ERR, 'alert');

    if (this.segment) {
      let segmentTitle = [
        trackPageName,
        errorAction || 'Unknown Action',
        'Error'
      ].join(' ');

      this.segment.trackEvent(segmentTitle, {
        error: error || 'Unspecified error'
      });
    }
  },

  formatErrorMessage: function(entity, message) {
    if (entity && message[0] !== message[0].toUpperCase()) {
      message = capitalize(entity.replace(/_/g, ' ')) + ' ' + message;
    } else {
      message = capitalize(message);
    }
    message += '.';

    // Add more context to held users to encourage them to unhold their own accounts
    // https://jira.internal.digitalocean.com/browse/CTR-2248
    if (App.User && App.User.get('isInHoldContext') && message.toLowerCase().indexOf('contact support') > -1) {
      return 'Actions on your account are currently unavailable due to a billing hold. Please make a payment.';
    }

    return message.replace(/\.+$/, '.').trim();
  },

  errorHandler: function(resp, errorAction, trackPageName, methodToDisplayError) {
    methodToDisplayError = methodToDisplayError || this.showError.bind(this);
    resp = resp || {};
    trackPageName = trackPageName || this.get('trackPageName');

    // Convert fetch.js Response object
    if (resp._bodyText) {
      try {
        resp = JSON.parse(resp._bodyText);
      } catch(e) {
        methodToDisplayError(this.DEFAULT_ERR, errorAction, trackPageName);
      }
    }

    // Raw errors
    if (!_.isEmpty(resp.messages)) {
      Object.keys(resp.messages).forEach(key => {
        let message = this.formatErrorMessage(key, resp.messages[key][0]);
        methodToDisplayError(message, errorAction, trackPageName);
      });
    // Ember data mangled errors
    } else if (_.isArray(resp.errors) && !_.isEmpty(resp.errors)) {
      resp.errors.forEach(error => {
        let message;
        if (error.source) {
          let entity = _.last(error.source.pointer.split('/'));
          message = this.formatErrorMessage(entity !== '/data' ? entity : null, error.detail);
        } else {
          message = this.DEFAULT_ERR;
        }
        methodToDisplayError(message, errorAction, trackPageName);
      });
    } else {
      methodToDisplayError(this.DEFAULT_ERR, errorAction, trackPageName);
    }
  },

  actions: {
    sort: function (row) {
      let direction = this.get('sort') === row && this.get('sort_direction') === 'asc' ? 'desc' : 'asc';
      this.setProperties({
        sort: row,
        sort_direction: direction,
        sorting: true,
        page: 1
      });
      this.trackAction('Sort');
    }
  }
});
