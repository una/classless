import SnapshotsIndexRoute from '../images/snapshots/droplets';

export default SnapshotsIndexRoute.extend({
  isDropletShow: true,

  model: function(params, transition) {
    this.droplet = this.modelFor('droplet');
    params.dropletId = this.droplet.get('id');
    return this._super(params, transition);
  },

  setupController: function (controller, models) {
    if(this.isInitialLoad) {
      controller.set('newSnapshotName', this.droplet.get('name') + '-' + (new Date().getTime()));
      controller.set('droplet', this.droplet);
    }
    this._super(controller, models);
    this.controller = controller;
  }
});
