import Ember from 'ember';
import { objectStorageFetch } from '../../utils/apiHelpers';

export default Ember.Route.extend({
  model: function (params) {
    return Ember.RSVP.hash({
      bucket: this.store.findRecord('bucket', params.bucket_id, { reload: true }),
      stats: objectStorageFetch(`/buckets/${params.bucket_id}/stats`)
    });
  },

  setupController: function (controller, model) {
    this.set('titleToken', model.bucket.get('name'));

    controller.setProperties({
      model: model.bucket,
      stats: model.stats.bucket_stats
    });
  },

  actions: {
    loading: function () {
      return true;
    }
  }
});
