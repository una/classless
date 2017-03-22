import Ember from 'ember';
import VolumeBaseRoute from '../../routes/volume-base';

export default VolumeBaseRoute.extend({
  titleToken: 'Droplets',
  hasDropletAutoComplete: true,
  includeDropletInModel: true,
  getUnattached: true,
  getSequence: true,

  onDeactivate: function () {
    this.controller.get('volumes').forEach(function (volume) {
      volume.set('attachAndReattachDroplet', null);
    });
    this.controller.setProperties({
      volumes: [],
      autoCompleteVolume: null
    });
    this.controller.send('removeAllPollingEvents');
  }.on('deactivate'),

  setupController: function(controller, model) {
    model.volumes.forEach(function (volume) {
      if(volume.get('highlightNew')) {
        Ember.run.later(function () {
          volume.set('highlightNew', false);
        }, 4000); // eslint-disable-line no-magic-numbers
      }
    });
    this._super(controller, model);
  }
});
