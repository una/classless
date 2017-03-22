import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'Settings',

  intentUrl: null,

	model: function() {
    return this.modelFor('application');
  },

  beforeModel: function (transition) {
    this.set('intentUrl', transition.intent && transition.intent.url);
    // Force user to welcome view if they are not onboarded, we want them to add payment info here
    if (transition.intent && transition.intent.url === '/settings/billing' && !this.modelFor('application').get('isOnboarded')) {
      this.transitionTo('welcome');
    }
  },
  actions: {
    didTransition: function() {
      Ember.run.scheduleOnce('afterRender', this, () => {
        // Append the sideNav rendered by Ember to the Rails-rendered content
        let $cloudContainer = Ember.$('.cloud-container');
        let $auroraContainer = Ember.$('#aurora-container');
        let $sideNavRow = $cloudContainer.find('div.small-2').first();
        $auroraContainer.append($cloudContainer);
        if (!(this.get('model.isSuspended') && this.get('intentUrl') === '/settings/billing')) {
          let $sideNav = Ember.$('.js-side-nav-wrapper');
          $sideNavRow.replaceWith($sideNav);
        }
      });
    }
  }
});
