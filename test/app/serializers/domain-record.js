import DS from 'ember-data';
import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {

  attrs: {
    droplet: { deserialize: 'records' },
    floatingIp: { deserialize: 'records' }
  },

  serializeIntoHash: function (hash, type, record, options) {
    hash["record"] = this.serialize(record, options);
  },

  normalizeResponse: function (store, primaryModelClass, payload) {
    payload.domain_record = payload.record;
    delete payload.record;

    return this._super(...arguments);
  }

});
