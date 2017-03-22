import Ember from 'ember';
import App from '../../app';

export default Ember.Route.extend({
  controllerName: 'monitors.new-edit',
  templateName: 'monitors.new-edit',

  enums: Ember.inject.service('insights-threshold-enums'),

  model: function() {
    return Ember.RSVP.hash({
      endpoints: this.get('enums.endpoints'),
      socialIdentities: this.store.findAll('social-identity'),
      droplets: this.store.findAll('droplet')
    });
  },

  actions: {
    authenticate: function(provider) {
      this.get('torii').open(provider, {height: 630}).then(() => {
        this.store.findAll('social-identity');
      })
      .catch(function() {
        App.NotificationsManager.show('Oops! Something went wrong while authenticating!', 'alert');
      });
    }
  }
});
