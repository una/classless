import Ember from 'ember';
import App from '../../../app';

export default Ember.Route.extend({
  titleToken: 'Deactivate Account',

  renderTemplate: function () {
    this.render('components.deactivate-modal', {
      into: 'application',
      outlet: 'modal',
      controller: 'settings.profile.deactivate',
      model: this.modelFor('settings.profile')
    });
  },

  model: function() {
    return App.User;
  }
});
