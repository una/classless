import DS from 'ember-data';
import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
  primaryKey: 'name',
  attrs: {
    droplets: { serialize: false, deserialize: 'ids' }
  }
});
