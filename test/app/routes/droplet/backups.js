import BackupsRoute from '../images/backups';

export default BackupsRoute.extend({

  model: function(params) {
    this.droplet = this.modelFor('droplet');
    params.dropletId = this.droplet.get('id');
    return this.findBackupsForDroplet(this.droplet);
  },

  setupController: function (controller) {
    if(this.get('isInitialLoad')) {
      this.set('isInitialLoad', false);
    }
    controller.set('droplet', this.droplet);

    this.controller = controller;
  }
});
