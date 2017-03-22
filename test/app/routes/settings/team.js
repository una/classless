import Ember from 'ember';
import App from '../../app';
import _ from 'lodash/lodash';

let redirectNoAccess = function () {
  window.location.replace('/settings');
};

export default Ember.Route.extend({
  queryParams: {
    query: {
      refreshModel: true
    },
    sort: {
      refreshModel: true
    },
    sort_direction: {
      refreshModel: true
    },
    page: {
      refreshModel: true
    }
  },

  shouldRedirect: function(transition) {
    return App.User.get('isUserContext') &&
      transition.targetName !== 'settings.team.new';
  },

  beforeModel: function (transition) {
    if (this.shouldRedirect(transition)) {
      return redirectNoAccess();
    }
  },

  model: function (params, transition) {
    if (this.shouldRedirect(transition)) {
      return redirectNoAccess();
    }

    _.merge(params, {
      teamId: App.User.get('currentContext.internalIdentifier')
    });

    let hash = {
      team: App.User.get('currentContext'),
      user: this.modelFor('application')
    };

    if(!App.User.get('isUserContext')) {
      hash.members = this.store.query('member', params).then(null, () => {
        this.error = true;
        return Ember.A();
      });
    }

    return Ember.RSVP.hash(hash);
  },

  actions: {
    loading: function(transition) {
      let controller = this.controllerFor('settings.team');
      controller.set('modelLoading', true);
      transition.promise.finally(function() {
        controller.set('modelLoading', false);
      });
    },
    authenticate: function(provider) {
      let controller = this.controllerFor('settings.team');
      this.get('torii').open(provider).then(function() {
        controller.set('isGmailAuthenticated', true);
      })
      .catch(function() {
        App.NotificationsManager.show('Oops! Something went wrong while authenticating!', 'alert');
      });
    }
  }
});
