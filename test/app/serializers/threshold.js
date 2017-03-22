import Ember from 'ember';
import DS from 'ember-data';
import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    droplets: {
      serialize: false,
      deserialize: 'records'
    },
    tags: {
      serialize: false,
      deserialize: 'records'
    }
  },

  enumsService: Ember.inject.service('insights-threshold-enums'),

  serialize() {
    let json = this._super(...arguments);
    json.duration.time = json.duration.value;

    return json;
  },

  normalize(modelClass, resourceHash, prop) {
    if (prop === 'thresholds' || prop === 'threshold' || modelClass.modelName === 'threshold') {
      if (resourceHash.duration) {
        let duration = this.get('enumsService.durations').find((item) => {
          return item.machineName === resourceHash.duration.unit && item.value === resourceHash.duration.time;
        });

        duration = duration || this.get('enumsService.durations.firstObject');

        resourceHash.duration.id = duration.id;
        resourceHash.duration.value = resourceHash.duration.time;

        delete resourceHash.duration.time;

        if (resourceHash.metric === 'CPU_SYS' || resourceHash.metric === 'CPU_USER') {
          resourceHash.metric = 'CPU_TOTAL';
        }
      }

      if (resourceHash.droplets.length > resourceHash.droplet_ids.length) {
        resourceHash.droplets = resourceHash.droplets.filter(d => {
          return resourceHash.droplet_ids.indexOf(d.id) !== -1;
        });
      }
    }
    return this._super(modelClass, resourceHash, prop);
  }
});
