/*eslint no-console: ["error", { allow: ["error"] }] */
import RavenLogger from 'ember-cli-sentry/services/raven';
import Ember from 'ember';
const { getOwner } = Ember;

export default RavenLogger.extend({
  ignoreError: function (error) {
    // Ember 2.X seems to not catch `TransitionAborted` errors caused by
    // regular redirects. We don't want these errors to show up in Sentry
    // so we have to filter them ourselfs.
    //
    // Once this issue https://github.com/emberjs/ember.js/issues/12505 is
    // resolved we can remove this code.
    if (error && error.name) {
      return error.name === 'TransitionAborted';
    }
    return false;
  },

  release: function () {
    return Ember.$("meta[name='sentry:revision']").attr('content');
  }.property(),

  unhandledPromiseErrorMessage: 'Uncaught Promise Error',

  _generateArguments: function (error) {
    let currentController = getOwner(this).lookup('controller:application');
    let currentRouteName = currentController.currentRouteName;
    return [error, {
      tags: {
        route_name: currentRouteName
      }
    }];
  },

  captureException: function (error) {
    if (this.get('isRavenUsable') && !this.ignoreError(error)) {
      window.Raven.captureException.apply(window.Raven, this._generateArguments(error));
    } else {
      // In development mode, we want to display the error in the console
      console.error(error);
    }
  },

  captureMessage: function (message) {
    if (this.get('isRavenUsable')) {
      window.Raven.captureMessage.apply(window.Raven, this._generateArguments(message));
    } else {
      // In development mode, we want to display the error in the console
      console.error(new Error(`Error to be sent to Sentry: ${message}`));
    }
    return true;
  }
});
