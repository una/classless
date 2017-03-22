import Ember from 'ember';

export default Ember.Mixin.create({
  resourceLimits: Ember.inject.service(),

  volumeSnapshotLimitReached: function() {
    return !this.get('resourceLimits.volumeSnapshotInfinite') && (this.get('resourceLimits.volumeSnapshotCount') >= this.get('resourceLimits.volumeSnapshotLimit'));
  }.property('resourceLimits.volumeSnapshotLimit', 'resourceLimits.volumeSnapshotCount'),

  actions: {
    incrementCount: function (countType) {
      this.get('resourceLimits').add(countType);
    },
    decrementCount: function (countType) {
      this.get('resourceLimits').remove(countType);
    }
  }

});
