import Ember from 'ember';
import App from '../../../app';

export default Ember.Route.extend({
  titleToken: 'Droplet Limit Auto Increase',

  renderTemplate: function () {
    this.render('settings.profile.droplet_limit_auto_increase', {
      into: 'application',
      outlet: 'modal',
      controller: 'settings.profile.droplet_limit_auto_increase',
      model: this.modelFor('settings.profile')
    });
  },

  model: function() {
    return App.User;
  }
});
