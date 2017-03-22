import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'Settings',

  model: function () {
    return this.modelFor('application');
  },
  actions: {
    loading: function (transition) {
      let controller = this.controllerFor('settings');
      controller.set('showLoader', true);
      transition.promise.finally(function() {
        controller.set('showLoader', false);
      });
    }
  }
});
