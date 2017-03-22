import DS from 'ember-data';
import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    region: { embedded: 'always' },
    image: { embedded: 'always' },
    kernel: { embedded: 'always' },
    currentlyPendingEvent: { embedded: 'always' },
    floatingIps: { embedded: 'always' },
    tags: { embedded: 'always' }
  }
});
