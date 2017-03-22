import Ember from 'ember';

export default Ember.Route.extend({
  beforeModel: function () {
    let appModel = this.modelFor('application');
    if (!(appModel.get('isInHoldContext'))) {
      this.transitionTo('droplets');
    }
  },
  model: function () {
    return this.modelFor('application');
  }
});
