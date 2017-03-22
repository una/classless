import DS from 'ember-data';
import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    user: { deserialize: 'records', serialize: false },
    admin: { deserialize: 'records', serialize: false }
  }
});
