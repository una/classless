import App from '../../app';
import AutoCompleteController from '../../controllers/autocomplete';
import {post} from '../../utils/apiHelpers';

export default AutoCompleteController.extend({
  queryParams: ['sort', 'sort_direction', 'page'],
  sort: 'created_at',
  sort_direction: 'desc',
  page: 1,
  trackPageName: 'Backups Index',
  pollingEvents: [],

  dropletsDisabledModelIndices: function () {
    let indices = [];

    this.get('autoCompleteItems').forEach(function(model, index) {
      if(model.get('backupsEnabled')) {
        indices.push({ index: index, reason: 'Backups are already enabled for this Droplet'});
      } else if (model.get('server.offline')) {
        indices.push({ index: index, reason: 'Droplet server is offline'});
      } else if(model.get('currentlyPendingEvent.id')) {
        indices.push({ index: index, reason: 'Droplet is currently processing another event'});
      }
    });
    return indices;
  }.property('autoCompleteItems', 'autoCompleteItems.@each.backupsEnabled'),

  hasDroplets: function () {
    return this.get('autoCompleteItems.length');
  }.property(),

  hasMoreDroplets: function () {
    return this.droplets.meta.pagination.next_page;
  }.property('droplets'),

  needsPagination: function () {
    return this.droplets.meta.pagination.pages > 1;
  }.property('droplets'),

  doneSorting: function () {
    this.set('sorting', false);
  }.observes('droplets'),


  getImageById: function(id) {
    return this.store.peekRecord('image', id);
  },

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

  pollRestores: function() {
    this.removeAllPollingEvents();
    if(this.get('droplets.length')) {
      this.get('droplets').forEach((droplet) => {
        this.onRestorePollEvent(droplet);
      });
    }
  }.observes('droplets'),

  onRestorePollEvent: function(droplet) {
    if(this.isDropletShow) {
      return;
    }
    let restoreEvent = droplet.get('restoreEvent.content');
    if(restoreEvent) {
      this.addPollingEvent(restoreEvent);

      return restoreEvent.pollEvent().then(() => {
        droplet.reload().then(() => {
          App.NotificationsManager.show('Droplet Restored from Backup', 'notice');
        });
      }).catch((err) => {
        droplet.reload().then(() => {
          this.errorHandler(err, 'Restore Poll Event');
        });
      }).finally(() => {
        this.removePollingEvent(restoreEvent);
      });
    }
  },

  onRestoreComplete: function (droplet) {
    droplet.set('isRestoring', false);
  },

  actions: {
    toggleShowBackups: function(droplet, isOpening) {
      if(isOpening) {
        this.send('getBackupsForDroplet', droplet);
      } else {
        droplet.set('showBackups', false);
      }
    },
    changePage: function() {
      this.trackAction('Change page');
      this.set('paginating', true);
    },
    modelLoaded: function () {
      this.set('paginating', false);
    },
    restoreBackupById: function(imageId) {
      let image = this.getImageById(imageId),
          dropletId = image.get('dropletId'),
          droplet = this.store.peekRecord('droplet', dropletId);

      this.set('restoreImage', image);
      this.set('restoreDroplet', droplet);
    },
    createFromBackupById: function(imageId) {
      this.transitionToRoute('droplet_create', { queryParams: { imageId: imageId }});
    },
    convertToSnapshotById: function(imageId) {
      if(imageId) {
        let image = this.getImageById(imageId),
            dropletId = image.get('dropletId');

        if(image && dropletId) {
          let droplet = this.store.peekRecord('droplet', dropletId);

          if(droplet) {
            droplet.set('isConvertingBackupToSnapshot', true);
            droplet.set('showBackups', false);
            post('/api/v1/images/' + imageId + '/snapshot').then(() => {
              App.NotificationsManager.show('Created Snapshot', 'notice');
              droplet.set('isConvertingBackupToSnapshot', false);
              // hide backup as option once converted to a snapshot
              image.set('isConvertingBackupToSnapshot', true);

              let numBackups = droplet.get('backupsCount') - 1;
              if(numBackups < 0) {
                numBackups = 0;
              }

              droplet.set('backupsCount', numBackups);
            })
            .catch((err) => {
              droplet.set('isConvertingBackupToSnapshot', false);
              this.errorHandler(err, 'Convert to snapshot');
            });
          }
        }
      }
    },
    onSelectDroplet: function(selected) {
      let dropletId = null;
      if(selected) {
        dropletId = selected.get('id');
      }
      this.set('enableBackupsDropletId', dropletId);
    },
    onUnselectDroplet: function() {
      this.set('enableBackupsDropletId', null);
    },
    onSubmitEnableBackups: function() {
      let dropletId = this.get('enableBackupsDropletId');
      let droplet = this.store.peekRecord('droplet', dropletId);

      this.set('isEnablingBackups', true);
      droplet.enableBackups().then(() => {
        droplet.reload();
        App.NotificationsManager.show('Backups Enabled', 'notice');
        return;
      }).catch((err) => {
        this.errorHandler(err, 'Enabling Backups for Droplet');
      }).finally(() => {
        this.set('isEnablingBackups', false);
      });
    },
    onRestoreModalHide: function(doRestore) {
      if(doRestore) {
        let imageId = this.get('restoreImage.id'),
            droplet = this.get('restoreDroplet');

        droplet.set('isRestoring', true);
        droplet.set('showBackups', false);
        this.set('isRestoring', true);

        droplet.triggerEvent('restore', {image_id: imageId}).then(() => {
          return this.onRestorePollEvent(droplet);
        })
        .catch((err) => {
          this.errorHandler(err, 'Restoring');
        }).finally(() => {
          this.set('isRestoring', false);
          droplet.set('isRestoring', false);
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
