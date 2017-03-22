import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'Create Space',
  setupController: function (controller, model) {
    controller.set('model', model);
    controller.send('reset');
  }
});
