/* globals moment: false */
import Ember from 'ember';
import { ActiveModelSerializer } from 'active-model-adapter';
import DS from 'ember-data';

export default ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    threshold: { embedded: 'always' }
  },

  enumsService: Ember.inject.service('insights-threshold-enums'),

  normalize: function(modelClass, resourceHash) {
    if (modelClass.modelName === 'active-alert') {
      let metric = this.get('enumsService.metrics').find((m) => { return m.machineName === resourceHash.threshold.metric; });

      resourceHash.affected_droplets.forEach((d) => {
        let startedAt = moment(d.started_at);
        d.uiDuration = startedAt.fromNow(true);
        d.uiValue = `${d.value}${metric.unit}`;
      })
    }

    return this._super(...arguments);
  }
});
