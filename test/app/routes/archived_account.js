import Ember from 'ember';

export default Ember.Route.extend({
  beforeModel: function () {
    let appModel = this.modelFor('application');
    if (!appModel.get('isArchived')) {
      this.transitionTo('droplets');
    }
  }
});
