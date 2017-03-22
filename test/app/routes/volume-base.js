import Ember from 'ember';
import AttachVolumeModalRoute from '../routes/attach-volume-modal';

export default AttachVolumeModalRoute.extend({
  resourceLimits: Ember.inject.service(),

  queryParams: {
    sort: {
      refreshModel: true
    },
    sort_direction: {
      refreshModel: true
    },
    page: {
      refreshModel: true
    }
  },
  isInitialLoad: true,

  _getModel: function (params) {
    if(this.get('dropletFromModel')) {
      params = Ember.merge(params, {
        droplet_id: this.modelFor('droplet').get('id')
      });
    }
    if(this.get('includeDropletInModel')) {
      params = Ember.merge(params, {
        include_droplet: true
      });
    }
    return this.store.query('volume', params);
  },

  _getModelHash: function (params) {
    return Ember.RSVP.hash({
      volumes: this._getModel(params)
    });
  },

  _getFullHash: function(params) {
    return Ember.RSVP.hash({
      volumes: this._getModel(params),
      unattachedVolumes: this.get('getUnattached') ? this.getUnattachedVolumes() : null,
      volumeSnapshots: this.get('getUnattached') ? this.getVolumeSnapshots() : null,
      volumeSequenceNum: this.get('getSequence') ? this.getSequenceNumber() : null
    });
  },

  model: function(params, transition) {
    params = params || {};
    if(this.isInitialLoad) {
      if(this.hasDropletAutoComplete) {
        return this._getFullHash(params).then(this.autoCompleteModel.bind(this));
      } else {
        return this._getFullHash(params);
      }
    } else {
      this.showLoader = !!transition.queryParams.pendingAttach;
      if(transition.queryParams.pendingAttach) {
        return transition.queryParams.pendingAttach.then(() => {
          return this._getModelHash(params);
        });
      }
      return this._getModelHash(params);
    }
  },

  afterModel(model) {
    if(model.volumeSnapshots) {   
      this.get('resourceLimits').setProperties({
        volumeSnapshotLimit: model.volumeSnapshots.meta.volume_snapshot_limit.limit,
        volumeSnapshotInfinite: model.volumeSnapshots.meta.volume_snapshot_limit.is_infinite,
        volumeSnapshotCount: model.volumeSnapshots.meta.volume_snapshot_count
      });
    }
  },

  setupController: function (controller, modelHash) {
    let volumes = modelHash.volumes;
    controller.setProperties({
      volumes: volumes,
      volumeCount: volumes.get('meta.volume_count'),
      volumeLimit: volumes.get('meta.volume_limit'),
      detachingVolume: false,
      attachingVolume: false,
      pendingVolume: null,
      paginating: false,
      sorting: false,
      deleteCount: 0,
      newlyAttachedVolumes: []
    });
    if(this.isInitialLoad) {
      this._super(controller, modelHash);
    }
    this.controller = controller;
    this.isInitialLoad = false;
    this.showLoader = false;
  },

  initRoute: function() {
    this.set('isInitialLoad', !this.showLoader);
  }.on('deactivate', 'init'),

  actions: {
    refreshModel: function () {
      this.refresh();
    },
    loading: function () {
      return this.isInitialLoad || this.showLoader;
    }
  }
});
