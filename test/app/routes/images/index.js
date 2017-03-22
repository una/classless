import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'Snapshots',
  beforeModel: function() {
    this.transitionTo('images.snapshots');
  }
});
