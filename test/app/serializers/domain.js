import DS from 'ember-data';
import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    domainRecords: { embedded: 'always'},
    droplet: { deserialize: 'records' },
    floatingIp: { deserialize: 'records' }
  },

  normalize: function(store, payload) {

    payload.old_id = payload.id;
    payload.id = payload.name;

    return this._super(...arguments);
  }
});
