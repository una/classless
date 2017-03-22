import Ember from 'ember';
import AttachVolumeModalController from '../../../controllers/attach-volume-modal';
import IndexPage from '../../../mixins/controllers/index-page';
import App from '../../../app';

export default AttachVolumeModalController.extend(IndexPage, {
  queryParams: ['sort', 'sort_direction', 'page'],
  sort: 'created_at',
  sort_direction: 'desc',
  page: 1,
  trackPageName: 'Images Volume Snapshots',
  snapshotsCtrl: Ember.inject.controller('images.snapshots'),
  newSnapshots: [],
  menuItems: [{ name: 'Create Volume' }, { name: 'Delete' }],
  //set up index page mixin
  filteredModelProperty: 'filteredSnapshots',
  modelProperty: 'snapshots',

  // create list of snapshots and newly created snapshots from take a snapshot form
  filteredSnapshots: function() {
    return this.get('newSnapshots').filter(function (model) {
      return !model.get('isDeleted') || model.get('isDirty') || model.get('isSaving');
    }).concat(this.snapshots.toArray());
  }.property('newSnapshot.isSaving', 'newSnapshots.length', 'newSnapshots.@each.isSaving', 'newSnapshots.@each.isDeleted', 'snapshots.@each.isDeleted'),

  needsPagination: function () {
    return this.snapshots.meta.pagination.pages > 1;
  }.property('snapshots'),

  // resets newSnapshots array
  cleanupNewSnapshots: function () {
    this.set('newSnapshots', []);
  }.observes('snapshots'),

  _doneSorting: function () {
    this.setProperties({
      sorting: false,
      pagination: false
    });
  }.observes('snapshots'),

  actions: {
    changePage: function () {
      this.trackAction('Change page');
      this.set('paginating', true);
    },
    modelLoaded: function () {
      this.set('paginating', false);
    },
    deleteSnapshot: function (snapshot) {
      snapshot.set('failedDelete', false);
      snapshot.destroyRecord().then( () => {
        this.get('snapshotsCtrl').send('decrementCount', 'volumeSnapshotCount');
        App.NotificationsManager.show('Volume Snapshot has been deleted.', 'notice');
      }).catch((err) => {
        snapshot.set('failedDelete', true);
        this.errorHandler(err, 'Delete');
      });
    },
    attachNewVolume: function () {
      let name = this.get('newVolumeName');
      let droplet = this.get('selectedDroplet');
      let region = droplet.get('region.slug');

      this.set('attachingVolume', true);
      this.nameIsValid(name, region).then((result) => {
        if(!result) {
          this.set('attachingVolume', false);
          return App.NotificationsManager.show(this.duplicateErrMsg, 'alert');
        }
        this.get('snapshot').restore(droplet.get('id'), region, this.get('newVolumeSize'), name).then(() => {
          App.NotificationsManager.show('Volume was successfully created.', 'notice', {
            text: 'View ' + name,
            route: 'droplets.volumes'
          });
          this.afterAttach();
          this.updateVolumeSequenceNum(region);
        }).catch((err) => {
          this.errorHandler(err, 'Restoring a Volume Snapshot');
        }).finally(() => {
          this.set('attachingVolume', false);
        });
      });
    },
    menuItemClick: function(item, snapshot) {
      if(item === 'Create Volume') {
        //must be in this order as show-attach-modal needs to know the snapshot before showing the modal
        this.set('snapshot', snapshot);
        this.send('showAttachModal');
        this.setProperties({
          volumeModalTitle: 'Create volume from ' + snapshot.get('name'),
          volumeModalSubTitle: 'Must be equal to or greater than snapshot size (' + snapshot.get('sizeGigabytes') + ' GB).'
        });
      }
    },
    onSubmitCreateImage: function (name, volume) {
      let snapshot = this.store.createRecord('volumeSnapshot', {
        volumeId: volume.get('id'),
        volumeName: volume.get('name'),
        utilizedSizeGigabytes: volume.get('sizeGigabytes'),
        region: volume.get('region.slug'),
        createdAt: new Date(),
        isInitializing: true,
        name: name
      });

      // save snapshot
      let pendingSave = snapshot.save().then(() => {
        App.NotificationsManager.show('Snapshot was successfully created.', 'notice');
        this.get('snapshotsCtrl').send('incrementCount', 'volumeSnapshotCount');
        snapshot.set('isInitializing', false);
      }).catch((err) => {
        this.store.unloadRecord(snapshot);
        newSnapshots.removeObject(snapshot);
        this.errorHandler(err, 'Take a volume snapshot');
      });

      // add the new snapshot to beginning of the array
      let newSnapshots = this.get('newSnapshots');
      newSnapshots.unshift(snapshot);
      this.set('newSnapshots', newSnapshots);
      // this will trigger filteredSnapshots property to update
      this.set('newSnapshot', snapshot);

      // transition to snapshots page with newest snapshots first
      // pass in pendingSave promise to save snapshot first and then fetch
      // the models

      this.transitionToRoute('images.snapshots.volumes', {
        queryParams: {
          page: 1,
          sort: 'created_at',
          sort_direction: 'desc',
          pendingSave: pendingSave
        }
      });
    }
  }

});
