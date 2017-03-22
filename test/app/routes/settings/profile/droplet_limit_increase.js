import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'Droplet Limit Increase',

  renderTemplate: function () {
    this.render('settings.team.droplet_limit_increase', {
      into: 'application',
      outlet: 'modal',
      controller: 'settings.profile.droplet_limit_increase',
      model: this.modelFor('settings.profile')
    });
  },

  resetModal: function() {
    let controller = this.controllerFor('settings.profile.droplet_limit_increase');
    controller.resetProperties();
  }.on('deactivate')
});
