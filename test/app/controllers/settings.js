import Ember from 'ember';
import BaseController from '../controllers/base';
import App from '../app';

export default BaseController.extend({
  insightsDashboard: App.featureEnabled('insightsDashboard'),
  context: Ember.inject.service('context'),
  currentLocationPath: Ember.computed.alias('application.currentLocationPath'),
  application: Ember.inject.controller('application'),
  auroraBilling: App.featureEnabled('auroraBilling'),

  actions: {
    switchContext: function(context, redirectTo, isRailsLink) {
      try {
        if(this.get('context').isCurrentContext(context)) {
          if (isRailsLink) {
            let shortCurrentContextId = App.User && App.User.get('shortCurrentContextId');
            if (shortCurrentContextId) {
              redirectTo += `?i=${shortCurrentContextId}`;
            }
            return window.location.replace(redirectTo);
          }
          return this.transitionToRoute(redirectTo);
        }

        if (!isRailsLink) {
          redirectTo = redirectTo.replace('.index', '').split('.').join('/');
        }

        this.get('application').send('switchContext', context, redirectTo);
      } catch (e) {
        return this.logException(e, 'Switching Context on Settings Page');
      }
    }
  }
});
