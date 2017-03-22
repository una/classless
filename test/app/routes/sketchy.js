import Ember from 'ember';
import App from '../app';
import Sketchy from '../models/sketchy';

export default Ember.Route.extend({
  titleToken: 'Verify',
  beforeModel: function() {
    if (!App.User.get('isSketchy')) {
      this.transitionTo('droplets');
    }
  },
  model: function() {
    return Sketchy.create();
  },
  actions: {
    authenticate: function(identity, provider) {
      let controller = this.controller;
      this.get('torii').open(provider).then(function() {
        controller.fetchData(true);
      })
      .catch(function() {
        App.NotificationsManager.show('Oops! Something went wrong while authenticating!', 'alert');
      });
    }
  }
});
