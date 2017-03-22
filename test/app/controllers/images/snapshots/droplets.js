import Ember from 'ember';
import App from '../../../app';
import BaseController from '../../../controllers/base';
import IndexPage from '../../../mixins/controllers/index-page';
import {post} from '../../../utils/apiHelpers';
import {SNAPSHOT_COST_PER_GB} from '../../../constants';

export default BaseController.extend(IndexPage, {
  queryParams: ['sort', 'sort_direction', 'page'],
  sort: 'created_at',
  sort_direction: 'desc',
  page: 1,
  trackPageName: 'Snapshots Index',
  sortProperties: ['slug:asc'],
  snapshotsCtrl: Ember.inject.controller('images.snapshots'),
  sortedRegions: Ember.computed.sort('regions', 'sortProperties'),
  transferIndiciesObj: {}, /* key: imageId, value: transferId */
  pollingEvents: [],
  newSnapshots: [],
  routeName: 'images.snapshots.droplets',
  volumeSnapshotsEnabled: App.featureEnabled('volumeSnapshots'),
  //set up index page mixin
  filteredModelProperty: 'filteredSnapshots',
  modelProperty: 'snapshots',

  PRICE_PER_GB: SNAPSHOT_COST_PER_GB,

  // create list of snapshots and newly created snapshots from take a snapshot form
  filteredSnapshots: function() {
    return this.get('newSnapshots').filter(function (model) {
      return !model.get('isDeleted') || model.get('isDirty') || model.get('isSaving');
    }).concat(this.snapshots.toArray()).filter(function (model) {
      return !model.get('transferComplete');
    });
  }.property('newSnapshot.isSaving', 'snapshots.@each.transferComplete', 'newSnapshots.@each.transferComplete', 'newSnapshots.length', 'newSnapshots.@each.isSaving', 'newSnapshots.@each.isDeleted', 'snapshots.@each.isDeleted'),

  // resets newSnapshots array
  cleanupNewSnapshots: function () {
    this.set('newSnapshots', []);
  }.observes('snapshots'),

  needsPagination: function () {
    return this.snapshots.meta.pagination.pages > 1;
  }.property('snapshots'),

  getImageById: function(id) {
    return this.store.peekRecord('image', id);
  },

  doneSorting: function () {
    this.set('sorting', false);
  }.observes('snapshots'),

  pollRestores: function() {
    if(this.get('snapshots.length')) {
      this.get('snapshots').forEach((image) => {
        this.onRestorePollEvent(image);
      });
    }
  }.observes('snapshots'),

  addPollingEvent: function(pollingEvent) {
    let pollingEvents = this.get('pollingEvents');
    pollingEvents.push(pollingEvent);
    this.set('pollingEvents', pollingEvents);
  },

  removePollingEvent: function(pollingEvent) {
    pollingEvent.cancelPoll();

    let pollingEvents = this.get('pollingEvents');
    pollingEvents.splice(pollingEvents.indexOf(pollingEvent), 1);
    this.set('pollingEvents', pollingEvents);
  },

  removeAllPollingEvents: function() {
    let pollingEvents = this.get('pollingEvents').slice();
    let len = pollingEvents.length;
    for(let i = 0; i < len; i++) {
      this.removePollingEvent(pollingEvents[i]);
    }
  },

  onRestorePollEvent: function(image, afterPollEvent) {
    if(this.isDropletShow) {
      return;
    }
    let restoreEvent = image.get('restoreEvent.content');

    if(restoreEvent) {
      this.addPollingEvent(restoreEvent);
      // Begin Polling
      let success = true;
      restoreEvent.pollEvent().catch(function () {
        success = false;
      }).finally(() => {
        image.set('isRestoring', false);
        if(afterPollEvent) {
          afterPollEvent.call(this, success);
        }
        this.removePollingEvent(restoreEvent);
        image.set('currentlyPendingEvent', null);
        image.reload();
      });

    }
  },

  pollRegionTransfer: function() {
    if(this.get('snapshots.length')) {
      this.get('snapshots').forEach((image) => {
        if(image.get('ongoingTransfers.length')) {
          image.get('ongoingTransfers').forEach((transfer) => {
            this.onRegionTransferPollEvent(image, transfer);
          });
        }
      });
    }
  }.observes('snapshots'),

  onRegionTransferPollEvent: function(image, transfer) {
    // Begin Polling
    transfer.pollEvent().catch(() => {
      App.NotificationsManager.show(this.DEFAULT_ERR, 'alert');
    }).finally(() => {
      // Manually unset Polling event from Model props
      image.set('ongoingRegionTransfers', false);
      this.removePollingEvent(transfer);
      image.get('ongoingTransfers').removeObject(transfer);
      image.reload();
    });
    this.addPollingEvent(transfer);
  },

  _pollImageTransfers: function(transfers) {
    if(transfers && transfers.length) {
      transfers.forEach((transfer) => {
        // only poll transfers that the user sent
        if(transfer.get('sender_email') === App.User.get('effectiveRecipientEmail')) {
          this.onImageTransferPollEvent(transfer);
        }
      });
    }
  },

  pollImageTransfers: function() {
    this._pollImageTransfers(this.get('transfers'));
  }.observes('transfers'),

  onImageTransferPollEvent: function(transfer) {
    transfer.pollTransfer().catch(() => {
      // account transfer is not an event
      // when the transfer is accepted or rejected then the transfer no longer exists,
      // the request will 404 and we'll need to catch it and remove
      // the transfer from the transfers collection
      let transfers = this.get('transfers').toArray();
      transfers.splice(transfers.indexOf(transfer), 1);
      this.set('transfers', transfers);
      this.get('filteredSnapshots').forEach(function (snapshot) {
        if(transfer.get('image.id') === snapshot.get('id')) {
          snapshot.set('transferComplete', true);
          App.NotificationsManager.show('Your Snapshot has been accepted by ' + transfer.get('recipient_email') + '.', 'notice');
        }
      });
      this.removePollingEvent(transfer);
    });

    this.addPollingEvent(transfer);
  },

  getSnapshotsByDropletId: function(dropletId) {
    return this.get('snapshots').filterBy('dropletId', dropletId);
  },

  setImagesRestoringFlag: function(images, isRestoring) {
    images.forEach((img) => {
      img.set('dropletIsRestoring', isRestoring);
    });
  },

  showCreatedMessage: function () {
    return Ember.run.next(function () {
      App.NotificationsManager.show('Snapshot Created.', 'notice');
    });
  },

  actions: {
    changePage: function() {
      this.trackAction('Change page');
      this.set('paginating', true);
    },
    modelLoaded: function () {
      this.set('paginating', false);
    },
    menuItemClick: function (clickedKey) {
      // reset current renameId
      this.set('renameId', null);

      if(clickedKey) {
        this.trackAction('Menu Item Click: ' + clickedKey);
      } else {
        App.NotificationsManager.show(this.DEFAULT_ERR, 'alert');
      }
    },

    transferringSnapshotById: function(imageId, transferType, transferRecipient, successCallback, errorCallback) {
      if(imageId !== undefined && transferRecipient) {
        let data = {
          image_account_transfer: {
            image_id: imageId
          }
        };

        if (transferType === 'user') {
          data.image_account_transfer.recipient_email = transferRecipient;
        } else {
          data.image_account_transfer.recipient_organization_id = transferRecipient;
        }

        post('/api/v1/images/account_transfers', data).then((resp) => {
          resp.json().then((json) => {
            if(successCallback) {
              successCallback.call(null, json);
            }
            let transferIndicies = this.get('transferIndiciesObj');
            transferIndicies[imageId] = json.image_account_transfer.id;
            this.set('transferIndiciesObj', transferIndicies);

            this.set('transfers', this.store.findAll('accountTransfer'));

            this.store.findRecord('accountTransfer', json.image_account_transfer.id).then((transfer) => {
              this.onImageTransferPollEvent(transfer);
            });
          });
        })
        .catch((err) => {
          this.errorHandler(err, 'Transfer');
          if(errorCallback) {
            errorCallback.call(null, err);
          }
        });
      }
    },
    cancelTransferringSnapshotById: function(imageId, transferId, successCallback, errorCallback) {
      let transferIndicies;

      if(transferId === undefined || transferId === null) {
        transferIndicies = this.get('transferIndiciesObj');
        if(transferIndicies) {
          transferId = transferIndicies[imageId];
        }
      }

      if(transferId) {
        let transfer = this.store.peekRecord('accountTransfer', transferId);
        transfer.destroyRecord().then(() => {
          if(successCallback) {
            successCallback.call();
          }

          if(transferIndicies && transferIndicies.hasOwnProperty(imageId)) {
            delete transferIndicies[imageId];
          }
        })
        .catch((err) => {
          this.errorHandler(err, 'Transfer');
          if(errorCallback) {
            errorCallback.call(null, err);
          }
        });
      }
    },

    // Event Trigger for Change Region
    updateRegionById: function(imageId, regionId, successCallback, errorCallback) {
      let image = this.getImageById(imageId);
      if(image) {

        let data = {
          region_id: parseInt(regionId, 10)
        };

        image.set('ongoingRegionTransfers', true);
        this.send('openSnapshotDropdown', image);

        image.triggerEvent('transfer_region', data).then(() => {
          if(successCallback) {
            successCallback.call();
          }

          image.get('ongoingTransfers').forEach((transfer) => {
            this.onRegionTransferPollEvent(image, transfer);
          });
        })
        .catch((err) => {
          if(errorCallback) {
            errorCallback.call();
          }
          this.errorHandler(err, 'Distribute');
        });
      }
    },
    openSnapshotDropdown: function(snapshot) {
      snapshot.set('isDropdownOpen', true);
      Ember.run.next(function () {
        snapshot.set('isDropdownOpen', false);
      });
    },
    undoRename: function () {
      this.set('renameId', null);
    },
    renameSnapshotById: function(imageId) {
      // don't allow renaming when imageId is null
      if(imageId) {
        let image = this.getImageById(imageId);
        // prevent renaming when snapshot is being deleted, saved, or restored
        if(!image || (image && !image.get('isDeleted') && !image.get('isSaving') && !image.get('isRestoring'))) {
          this.set('renameId', imageId);
        }
      }
    },
    submitRenameSnapshot: function() {
      let renameId = this.get('renameId');

      if(renameId !== undefined) {
        let image = this.getImageById(renameId);
        if(image) {
          this.set('renameId', null);
          image.set('isRenaming', true);
          image.save()
            .then(() => {
              App.NotificationsManager.show('Snapshot has been renamed.', 'notice');
              image.set('isRenaming', false);
            })
            .catch((err) => {
              this.errorHandler(err, 'Rename');
              image.rollbackAttributes();
            });
        }
      }
    },

    restoreSnapshotById: function(imageId) {
      let image = this.getImageById(imageId),
          dropletId = image.get('dropletId');

      image.set('isFetchingDroplet', true);
      this.store.findRecord('droplet', dropletId).then((droplet) => {
        this.set('restoreImage', image);
        this.set('restoreDroplet', droplet);
        image.set('isFetchingDroplet', false);
      }).catch((err) => {
        this.errorHandler(err, 'Fetching droplet');
        image.set('isFetchingDroplet', false);
      });
    },

    createFromSnapshotById: function(imageId) {
      this.transitionToRoute('droplet_create', { queryParams: { imageId: imageId }});
    },

    deleteSnapshotById: function(imageId) {
      let image = this.getImageById(imageId);
      image.destroyRecord().then(function () {
        App.NotificationsManager.show('Snapshot has been deleted.', 'notice');
      }).catch((err) => {
        this.errorHandler(err, 'Delete');
      });
    },

    /* Create snapshot from droplet */
    onInputUpdateImageName: function() {
      this.set('nameUpdated', true);
    },
    onSelectDroplet: function(selected) {
      let dropletId;
      if(selected.type === 'default') {
        dropletId = null;
      } else {
        dropletId = selected.get('id');
      }

      this.set('createImageDropletId', dropletId);
      if(!this.get('createImageName') || !this.get('nameUpdated')) {
        this.set('createImageName', selected.get('name') + '-' + (new Date().getTime()));
        this.set('nameUpdated', false);
      }
    },
    onUnselectDroplet: function() {
      if(!this.get('nameUpdated')) {
        this.set('createImageName', '');
      }
    },
    onSubmitCreateImage: function() {
      let dropletId = this.get('createImageDropletId'),
          createImageName = this.get('createImageName'),
          data = {
            dropletId: dropletId,
            name: createImageName
          };

      // create new snapshot
      let snapshot = this.store.createRecord('image', data);

      // get droplet snapshot was created from for
      // droplet name and region
      let droplet = this.store.peekRecord('droplet', dropletId);

      // set snapshot properties before we fetch from the server
      snapshot.setProperties({
        isSnapshot: true,
        dropletId: dropletId,
        region: this.store.peekRecord('region', droplet.get('region.id')),
        dropletName: droplet.get('name'),
        createdAt: new Date(),
        isInitializing: true
      });

      // save snapshot
      let newSnapshots = this.get('newSnapshots');
      let pendingSave = snapshot.save().then(() => {
        if(this.isDropletShow) {
          droplet.reload();
        }
      })
      .catch((err) => {
        this.store.unloadRecord(snapshot);
        newSnapshots.removeObject(snapshot);
        this.errorHandler(err, 'Take a snapshot');
      }).finally(() => {
        snapshot.set('isInitializing', false);
      });

      this.set('nameUpdated', false);

      // add the new snapshot to beginning of the array
      newSnapshots.unshift(snapshot);
      this.set('newSnapshots', newSnapshots);
      // this will trigger filteredSnapshots property to update
      this.set('newSnapshot', snapshot);

      // transition to snapshots page with newest snapshots first
      // pass in pendingSave promise to save snapshot first and then fetch
      // the models

      this.transitionToRoute(this.routeName, {
        queryParams: {
          page: 1,
          sort: 'created_at',
          sort_direction: 'desc',
          pendingSave: pendingSave
        }
      });
    },
    onCreateError: function (snapshot) {
      this.store.findRecord('droplet', snapshot.get('dropletId')).then(() => {
        App.NotificationsManager.show(this.DEFAULT_ERR, 'alert');
        this.get('newSnapshots').removeObject(snapshot);
      });
    },
    afterCreateEvent: function(image) {
      image.reload();
      if(this.isDropletShow) {
        return;
      }
      this.store.findRecord('droplet', image.get('dropletId'))
        .then(this.showCreatedMessage);
    },

    // Event Trigger for restore from image
    onRestoreModalHide: function(doRestore) {
      if(doRestore) {
        let image = this.get('restoreImage'),
            imageId = this.get('restoreImage.id'),
            droplet = this.get('restoreDroplet'),
            images;

        // Set is Image isRestoring flag for spinner
        image.set('isRestoring', true);

        // API Trigger call to restore droplet returns updated Droplet
        // Model if needed
        droplet.triggerEvent('restore', {image_id: imageId}).then(() => {

          if(this.isDropletShow) {
            return droplet.set('restoreImage', image);
          }

          // find other snapshots that are from this droplet
          // and set them as restoring
          images = this.getSnapshotsByDropletId(image.get('dropletId'));
          this.setImagesRestoringFlag(images, true);

          // Attatch pending event to image
          image.set('currentlyPendingEvent', droplet.get('currentlyPendingEvent'));

          this.onRestorePollEvent(image, (success) => {
            if(!this.isDropletShow) {
              if(success) {
                App.NotificationsManager.show('Droplet Restored from Snapshot', 'notice');
              } else {
                App.NotificationsManager.show(this.DEFAULT_ERR, 'alert');
              }
            }
            // find other snapshots from this droplet
            // and set them as no longer restoring
            images = this.getSnapshotsByDropletId(image.get('dropletId'));

            this.setImagesRestoringFlag(images, false);

          });

        })
        .catch((err) => {
          this.errorHandler(err, 'Restoring');
          image.set('isRestoring', false);
        });
      }
      this.set('restoreImage', null);
      this.set('restoreDroplet', null);
    },
    removeAllPollingEvents: function() {
      this.removeAllPollingEvents();
    }
  }
});
