import Ember from 'ember';

export default Ember.Route.extend({
  beforeModel: function () {
    let appModel = this.modelFor('application');
    if (!(appModel.get('isAdminLocked') || appModel.get('isAbuse'))) {
      this.transitionTo('droplets');
    }
  },
  model: function () {
    return this.modelFor('application');
  }
});
