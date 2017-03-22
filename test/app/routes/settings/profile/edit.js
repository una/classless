import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'Edit Profile',

  renderTemplate: function () {
    this.render('settings.profile.edit', {
      into: 'application',
      outlet: 'modal',
      controller: 'settings.profile.edit',
      model: this.modelFor('settings.profile')
    });
  },

  resetModal: function() {
    let controller = this.controllerFor('settings.profile.edit');
    controller.resetProperties();
    controller.onModel();
  }.on('deactivate')
});