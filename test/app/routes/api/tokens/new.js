import Ember from 'ember';

export default Ember.Route.extend({
  setupController: function (controller) {
    controller.resetForm();
  },

  renderTemplate: function () {
    this.render('api.tokens.show', {
      into: 'application',
      outlet: 'modal',
      controller: 'api.tokens.new'
    });
  }
});
