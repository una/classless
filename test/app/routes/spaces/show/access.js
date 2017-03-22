import Ember from 'ember';

export default Ember.Route.extend({
  model: function () {
    return this.modelFor('spaces.show');
  },
  setupController: function (controller, model) {
    controller.set('model', model.bucket);
  }
});
