import Ember from 'ember';
import AutoCompleteRoute from '../../routes/autocomplete';
import App from '../../app';

export default AutoCompleteRoute.extend({
  autoCompletes: [{
    autoComplete: ['droplet']
  }],

  resourceLimits: Ember.inject.service(),

  model: function() {
    if(App.featureEnabled('volumeSnapshots')) {
      this.autoCompletes[0].autoComplete = ['droplet', 'volume'];
    }

    return Ember.RSVP.hash({
      stats: App.User.getStatistics(),
      resourceLimits: App.User.fetchResourceLimits(),
      transfers: this.store.findAll('accountTransfer')
    }).then(this.autoCompleteModel.bind(this));
  },

  afterModel: function (model) {
    this.get('resourceLimits').setProperties({
      volumeSnapshotLimit: model.resourceLimits.resource_limits.volume_snapshot_limit.limit,
      volumeSnapshotInfinite: model.resourceLimits.resource_limits.volume_snapshot_limit.is_infinite,
      volumeSnapshotCount: model.stats.resource_statistics.volume_snapshots
    });
  },

  setupController: function(controller, models) {
    let stats = models.stats.resource_statistics;
    controller.setProperties({
      dropletCount: stats.active_droplets,
      volumeCount: App.featureEnabled('volumeSnapshots') ? (this._ac_metas.volume.volume_count || 0) : 0,
      snapshotCount: (stats.snapshots || 0) + (stats.volume_snapshots || 0),
      volumeSnapshotCount: stats.volume_snapshots,
      transfers: models.transfers
    });
    this._super(controller, models);
  }
});
