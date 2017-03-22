import Ember from 'ember';
import App from '../app';
const { getOwner } = Ember;

export default Ember.Component.extend({
  classNames: ['nav-bar'],
  tagName: 'nav',
  insightsDashboard: App.featureEnabled('insightsDashboard'),
  monitoringPreferences: App.featureEnabled('monitoringPreferences'),
  objectStorage: App.featureEnabled('objectStorage'),

  removePadding: function () {
    Ember.run.scheduleOnce('afterRender', this, function () {
      Ember.$('.cloud-container').addClass('nav-has-loaded');
    });

  }.on('init'),

  userText: function() {
    let model = this.get('model');
    if (model.get('isOrganizationContext') && !model.get('isOwner')) {
      return 'Locked';
    }
  },

  logoLink: function() {
    if (this.get('model.isSketchy')) {
      return '/account_verification/edit';
    } else if (this.get('model.isArchived')) {
      return '/archived_account';
    } else if (this.get('model.isAbuse')) {
      return '/abuse_account';
    }
    return '/admin_locked';
  }.property('model'),

  archivedLinkText: function() {
    return this.userText() || 'Reactivate';
  }.property('model'),

  sketchyLinkText: function() {
    return this.userText() || 'Verify';
  }.property('model'),

  actions: {
    switchContext: function(contextId) {
      this.sendAction('switchContext', contextId);
    },
    reload: function (routeName) {
      let currentController = getOwner(this).lookup('controller:application');
      let currentRouteName = currentController.currentRouteName;
      if (currentRouteName === routeName) {
        let currentRouter = currentController.get('target').router;
        currentRouter.refresh();
      }
    }
  }
});
