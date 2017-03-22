import { ActiveModelSerializer } from 'active-model-adapter';
import DS from 'ember-data';

export default ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
  primaryKey: 'uuid',

  attrs: {
    organizations: { embedded: 'always' }
  },

  normalize: function(store, payload) {
    //properites cannot end in Id, thus Identifier
    payload.internal_identifier = payload.id;
    return this._super(...arguments);
  }
});
