import Ember from 'ember';
import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  ajax: function(url, method, hash) {

    return Ember.RSVP.hash({
      dropletCounts: this._super(this.host + '/' + this.namespace + '/regions/droplet_counts', 'GET', {}),
      regions: this._super(url, method, hash)
    })
    .then(({dropletCounts, regions}) => {
      return { regions: regions.regions.map((r) => {
        r.droplet_count = dropletCounts.regions[r.slug];
        return r;
      }) };
    });
  }
});
