import Ember from 'ember';
import App from '../../app';
import AutoCompleteController from '../../controllers/autocomplete';
import DropletModel from '../../models/droplet';
import VolumeModel from '../../models/volume';
import ResourceLimits from '../../mixins/resource-limits';
import {post} from '../../utils/apiHelpers';
import {SNAPSHOT_COST_PER_GB} from '../../constants';

export default AutoCompleteController.extend(ResourceLimits, {
  dropletSnapshotsCtrl: Ember.inject.controller('images.snapshots.droplets'),
  volumeSnapshotsCtrl: Ember.inject.controller('images.snapshots.volumes'),

  volumeSnapshotsEnabled: App.featureEnabled('volumeSnapshots'),

  createImageName: Ember.computed.alias('dropletSnapshotsCtrl.createImageName'),
  autoCompletePlaceholder: App.featureEnabled('volumeSnapshots') ? 'Choose a Droplet or volume' : 'Choose a Droplet',

  PRICE_PER_GB: SNAPSHOT_COST_PER_GB,

  pendingTransfers: function() {
    return this.get('transfers').filterBy('recipient_email', App.User.get('effectiveRecipientEmail')).rejectBy('transferred', true);
  }.property('transfers', 'transfers.length', 'transfers.@each.transferred'),

  dropletsDisabledModelIndices: function () {
    let indices = [];
    this.get('autoCompleteItems').forEach( (model, index) => {
      if(model instanceof DropletModel) {
        if (model.get('server.offline')) {
          indices.push({ index: index, reason: 'Droplet server is offline'});
        } else if(model.get('currentlyPendingEvent.id')) {
          indices.push({ index: index, reason: 'Droplet is currently processing another event'});
        }
      } else if(model instanceof VolumeModel && this.get('volumeSnapshotLimitReached')){
        indices.push({ index: index, reason: 'Volume snapshot limit reached'});
      }
    });
    return indices;
  }.property('autoCompleteItems', 'volumeSnapshotLimitReached'),

  actions: {
    //index controller owns these actions as it is also used by droplet show snapshots
    onInputUpdateImageName: function() {
      this.get('dropletSnapshotsCtrl').send('onInputUpdateImageName');
    },
    onSelectDroplet: function(selected) {
      this.set('selectedModel', selected);
      this.get('dropletSnapshotsCtrl').send('onSelectDroplet', selected);
    },
    onUnselectDroplet: function() {
      this.get('dropletSnapshotsCtrl').send('onUnselectDroplet');
    },
    onSubmitCreateImage: function() {
      let selectedModel = this.get('selectedModel');
      if(selectedModel instanceof DropletModel) {
        this.get('dropletSnapshotsCtrl').send('onSubmitCreateImage');
      } else {
        this.get('volumeSnapshotsCtrl').send('onSubmitCreateImage', this.get('createImageName'), selectedModel);
      }
      this.set('snapshotCount', this.get('snapshotCount') + 1);
    },
    acceptSnapshotTransfer: function(transferId) {
      let transfer = this.store.peekRecord('accountTransfer', transferId);
      transfer.set('isAccepting', true);

      post('/api/v1/images/account_transfers/' + transferId + '/accept').then(() => {
        App.NotificationsManager.show('The snapshot has now been transfered to your account.', 'notice');

        // set the transfer as `transferred`, which will updating the
        // pendingTransfers property
        transfer.set('transferred', true);

        // add the new transferred image to snapshots at the top
        let snapshots = this.get('dropletSnapshotsCtrl.newSnapshots');
        let newImage = transfer.get('image');
        snapshots.unshift(newImage);
        this.setProperties({
          'dropletSnapshotsCtrl.newSnapshots': snapshots,
          'dropletSnapshotsCtrl.newSnapshot': newImage
        });
        this.set('snapshotCount', this.get('snapshotCount') + 1);
      }).catch((err) => {
        this.errorHandler(err, 'Accepting Snapshot Transfer');
      });

      this.transitionToRoute('images.snapshots.droplets', {
        queryParams: {
          page: 1,
          sort: 'created_at',
          sort_direction: 'desc'
        }
      });
    },
    declineSnapshotTransfer: function(transferId) {
      let transfer = this.store.peekRecord('accountTransfer', transferId);
      transfer.set('isRejecting', true);

      post('/api/v1/images/account_transfers/' + transferId + '/reject').then(() => {
        App.NotificationsManager.show('The transfer of that snapshot has been rejected.', 'notice');

        transfer.set('transferred', true);
      }).catch((err) => {
        this.errorHandler(err, 'Rejecting Snapshot Transfer');
      });
    }
  }
});
