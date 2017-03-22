import VolumeBaseRoute from '../volume-base';

export default VolumeBaseRoute.extend({
  getUnattached: true,
  getSequence: true,
  dropletFromModel: true,

  model: function (...args) {
    let dropletModel = this.modelFor('droplet');
    if(dropletModel.get('region.storageEnabled')) {
      this.defaultRegionSlug = dropletModel.get('region.slug');
      return this._super(...args);
    }
    return {
      volumes: []
    };
  }
});
