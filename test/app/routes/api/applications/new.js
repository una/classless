import Ember from 'ember';

export default Ember.Route.extend({
  setupController: function (controller) {
    controller.resetForm();
  },

  renderTemplate: function () {
    this.render('api.applications.show', {
      controller: 'api.applications.new',
      into: 'application',
      outlet: 'modal'
    });
  }
});
