import DS from 'ember-data';
import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    targets: { serialize: 'ids', deserialize: 'ids' },
    tags: { serialize: 'ids', deserialize: 'records' }
  },

  serialize() {
    let json = this._super(...arguments);

    json.targets = json.target_ids.map((id) => ({id: id}));
    delete json.target_ids;

    json.tags = json.tag_ids.map((name) => ({name: name}));
    delete json.tag_ids;

    return json;
  },

  normalize(model, hash) {
    hash.target_ids = hash.targets.map((droplet) => droplet.id);
    hash.tags.forEach((tag) => {
      tag.droplet_ids = tag.droplets.map((droplet) => droplet.id);
    });
    return this._super(...arguments);
  }
});
