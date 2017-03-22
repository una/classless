import Ember from 'ember';

export default Ember.Service.extend({
  volumeLimit: null,
  volumeCount: null,
  dropletLimit: null,
  dropletCount: null,
  domainLimit: null,
  domainCount: null,
  floatingIpLimit: null,
  floatingIpCount: null,
  volumeSnapshotLimit: null,
  volumeSnapshotInfinite: false,
  volumeSnapshotCount: null,

  add(limitType) {
    this.incrementProperty(limitType);
  },

  remove(limitType) {
    this.decrementProperty(limitType);
  }

});
