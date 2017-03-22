import DS from 'ember-data';
import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    ongoingTransfers: { embedded: 'always' },
    ongoingCreate: { embedded: 'always' },
    currentlyPendingEvent: { embedded: 'always' },
    kernel: { embedded: 'always' }
  }
});
