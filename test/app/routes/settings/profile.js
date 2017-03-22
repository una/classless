import Ember from 'ember';
import App from '../../app';
import {camelizeObject} from '../../utils/normalizeObjects';

export default Ember.Route.extend({
  model: function() {
    let user = this.modelFor('application');
    return Ember.RSVP.hash({
      user: user,
      resourceLimits: user.fetchResourceLimits(),
      socialAccountData: user.verifySocialAccounts.call(this, true)
    });
  },

  setupController: function(controller, models) {
    this.controller = controller;

    controller.setProperties({
      user: models.user,
      resourceLimits: camelizeObject(models.resourceLimits).resourceLimits,
      socialAccountData: camelizeObject(models.socialAccountData)
    });
  },

  actions: {
    authenticateSocialAccount: function(identity, provider) {
      this.get('torii').open(provider).then(function() {
        return App.User.verifySocialAccounts(true);
      }).then((data) => {
        this.controller.set('socialAccountData', camelizeObject(data));
      }).catch(function() {
        App.NotificationsManager.show('Oops! Something went wrong while authenticating!', 'alert');
      });
    },
    unauthenticateSocialAccount: function(identityId) {
      App.User.unauthenicateSocialAccount(identityId).then(() => {
        return App.User.verifySocialAccounts(true);
      }).then((data) => {
        this.controller.set('socialAccountData', camelizeObject(data));
      }).catch(function() {
          App.NotificationsManager.show('Oops! Something went wrong while unauthenticating!', 'alert');
      });
    }
  }
});
