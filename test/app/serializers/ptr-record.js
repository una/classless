import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend({
  normalize: function(store, payload) {
    payload.id = payload.id || payload.droplet_id;
    return this._super(...arguments);
  }
});