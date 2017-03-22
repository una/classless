import DS from 'ember-data';
import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    region: { embedded: 'always' },
    droplet: { embedded: 'always' },
    latestPublicEvent: { embedded: 'always' },
    currentlyPendingEvent: { embedded: 'always' }
  }
});
