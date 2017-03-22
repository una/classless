import Ember from 'ember';
import App from '../app';
import AttachVolumeModalController from '../controllers/attach-volume-modal';
import ResourceLimits from '../mixins/resource-limits';
import {RADIX} from '../constants';
import _ from 'lodash/lodash';

const INSTRUCTIONS_TOOLTIP_DELAY = 4000;

export default AttachVolumeModalController.extend(ResourceLimits, {
  resourceLimits: Ember.inject.service(),

  queryParams: ['sort', 'sort_direction', 'page'],
  sort: 'created_at',
  sort_direction: 'desc',
  page: 1,
  menuItemsArr: [{ name: 'Resize volume'}, { name: 'Detach' }, { name: 'Config instructions' }, { name: 'Delete' }],
  longMsg: true,

  instructionsTooltip: 'Heads up! If you need these instructions again, you can find them in here.',

  menuItems: function () {
    let arr = this.menuItemsArr.slice();
    if(App.featureEnabled('volumeSnapshots')) {
      arr.splice(arr.length - 1, 0, { name: 'Take Snapshot' });
    }
    return arr;
  }.property('menuItemsArr'),

  filteredModel: function () {
    let numVolumes = this.get('volumes.meta.pagination.total') - this.deleteCount;
    let model = this.get('volumes');
    let arr;

    if(!this.get('showDetached')) {
      arr = model.reject((volume) => {
        return volume.get('detached') && volume !== this.get('detachingVolume');
      }).toArray();
    } else {
      arr = model.toArray();
    }

    numVolumes -= model.get('length') - arr.length;

    let attaching = this.get('newlyAttachedVolumes');
    if(attaching) {
      numVolumes += attaching.length;
      let attachingFiltered = attaching.filter((volume) => {
        return (!volume.get('detached') || volume === this.get('detachingVolume')) && arr.indexOf(volume) === -1;
      });
      numVolumes -= attaching.length - attachingFiltered.length;
      arr = attachingFiltered.concat(arr);
    }
    arr = arr.filter(function (volume) {
      return !volume.get('deleted');
    });
    this.set('numVolumes', numVolumes);
    return arr;
  }.property('volumes', 'volumes.length', 'volumes.@each.detached', 'volumes.@each.deleted', 'volumes.@each.deleted', 'pendingVolume', 'detachingVolume', 'deletingVolume', 'newlyAttachedVolumes', 'newlyAttachedVolumes.@each.deleted'),

  invalidResizeSize: function () {
    return !this.onCustomInputValidation(this.get('curVolSizeObj.disk'));
  }.property('curVolSizeObj.disk'),

  detachVolume: function (volume, droplet, deleteAfter, afterDetach) {
    this.set('detachingVolume', volume);
    if(deleteAfter) {
      volume.set('deleting', true);
    }
    return volume.detachFromDroplet(droplet.get('id'), deleteAfter).then(() => {
      volume.set('detached', true);

      let event = volume.get('detachEvent');
      event.set('onSuccess', () => {
        volume.set('deleted', deleteAfter);
        if(!deleteAfter){
          this.updateUnattachedVolumes();
        }
      });
      event.set('onFailure', function () {
        volume.set('detached', false);
      });
      volume.set('deleting', false);

      if(afterDetach) {
        afterDetach(event);
      }
    }).catch((err) => {
      volume.set('deleting', false);
      this.set('detachingVolume', null);
      this.errorHandler(err, deleteAfter ? 'Deleting Volume' : 'Detaching Volume');
      throw err;
    });
  },

  detachAndAttach: function (volume, droplet, afterAttach) {
    return volume.detachFromDroplet(volume.get('dropletId'), false, droplet.get('id')).then(() => {
      if(afterAttach) {
        afterAttach(volume.get('detachEvent'));
      }
    }).catch((err) => {
      this.errorHandler(err, 'Deleting and Attaching Volume');
      throw err;
    });
  },

  updateUnattachedVolumes: function () {
    if(this.get('needToUpdateUnattached')) {
      this.send('unattachedVolumesPaginate', 1);
    }
  },

  formatVolumeInstructionsCopyText: function() {
    let copyText = [];

    copyText.push('sudo mkdir -p /mnt/' + this.get('formatInstructionsVolume.name'));
    copyText.push('sudo mount -o discard,defaults /dev/disk/by-id/scsi-0DO_Volume_' + this.get('formatInstructionsVolume.name') + ' /mnt/' + this.get('formatInstructionsVolume.name'));
    copyText.push('echo /dev/disk/by-id/scsi-0DO_Volume_' + this.get('formatInstructionsVolume.name') + ' /mnt/' + this.get('formatInstructionsVolume.name') + ' ext4 defaults,nofail,discard 0 0 | sudo tee -a /etc/fstab');

    return copyText.join('; ');
  }.property('formatInstructionsVolume'),

  showInstructionsTooltip: function() {
    this.set('toolTipVolume.tooltip', this.get('instructionsTooltip'));
    Ember.run.later(() => {
      let tooltip = this.get('toolTipVolume.tooltip');
      if(tooltip && _.isFunction(tooltip.get) && !tooltip.get('isDestroyed') && !tooltip.get('isDestroying')) {
        this.set('toolTipVolume.tooltip', null);
      }
    }, INSTRUCTIONS_TOOLTIP_DELAY);
  },

  getModalDroplet: function (volume) {
    return volume.get('droplet');
  },

  resizeSizes: function () {
    let sizes = this.getNextStepSizes(this.get('modalResizeVolume.sizeGigabytes'));
    let nextCustom = this.get('modalResizeVolume.sizeGigabytes') + 1;
    if(sizes && sizes[0]){
      sizes[0].setProperties({
        selected: true,
        isCurrent: true
      });
      this.setProperties({
        resizeVolumeSize: sizes[0].disk,
        curVolSizeObj: sizes[0]
      });
    }
    let custom = this.customDefaultSize();
    this.set('customVolumeObj', custom);
    this.updateCustomVolume(nextCustom);
    sizes.unshift(custom);

    return sizes;
  }.property('modalResizeVolume'),

  setVolumeSize: function (size) {
    this._super(size);
    // only update when custom is selected
    if(this.get('customVolumeObj.selected')){
      this.set('resizeVolumeSize', size);
    }
  },

  actions: {
    changePage: function() {
      this.set('paginating', true);
    },
    onConfirmModalHide: function(doAction) {
      if(doAction) {
        let model = this.get('modalVolume');
        let action = this.get('modalAction');
        if(action === 'Delete') {
          this.detachVolume(model, true);
        } else if (action === 'Detach') {
          this.detachVolume(model);
        }
      }
      this.set('modalVolume', null);
    },
    attachExistingVolume: function () {
      let volume = this.get('selectedVolume');

      this.set('attachingVolume', true);
      this.attachVolume(volume).then(() => {
        this.updateUnattachedVolumes();
        this.setProperties({
          formatInstructionsVolume: volume
        });
      }).catch((err) => {
        this.errorHandler(err, 'Attaching Volume');
      }).finally(() => {
        this.set('attachingVolume', false);
      });
    },
    menuItemClick: function (action, volume) {
      if(action === 'Config instructions') {
        this.setProperties({
          formatInstructionsVolume: volume,
          noToolTip: true
        });
      } else if(action === 'Resize volume') {
        let size = volume.get('sizeGigabytes');
        this.setProperties({
          modalResizeVolume: volume,
          resizeVolumeSize: size,
          resizeVolumePriceMonth: this.pricePerMonth(size, true),
          resizeVolumePriceHour: this.pricePerHour(size, true)
        });
      } else if(action === 'Take Snapshot') {
        this.set('snapshotName', volume.get('name') + '-' + (new Date().getTime()));
      } else {
        this.setProperties({
          modalAction: action,
          modalVolume: volume,
          modalDroplet: this.getModalDroplet(volume)
        });
      }
    },
    resizeVolume: function () {
      let volume = this.get('modalResizeVolume');
      volume.set('resizing', true);
      this.set('modalResizeVolume', null);
      return volume.resize(this.get('resizeVolumeSize'))
      .catch((err) => {
        this.errorHandler(err, 'Resizing Volume');
        throw err;
      }).finally(function() {
        volume.set('resizing', false);
      });
    },
    onResizeSizeChange: function (sizeObj) {
      let valueNum = window.parseInt(sizeObj.disk, RADIX);
      this.setProperties({
        curVolSizeObj: sizeObj,
        resizeVolumeSize: valueNum
      });
      if(this.volumeSizeIsValid(sizeObj.disk)) {
        this.setSelectedVolumeSize(sizeObj, this.get('resizeSizes'));

        this.setProperties({
          resizeVolumePriceMonth: this.pricePerMonth(valueNum, true),
          resizeVolumePriceHour: this.pricePerHour(valueNum, true)
        });
      } else {
        this.setProperties({
          resizeVolumePriceMonth: null,
          resizeVolumePriceHour: null
        });
      }
    },
    onResizeModalHide: function () {
      this.set('modalResizeVolume', null);
    },
    hideFormatVolumeModal: function() {
      if(!this.get('noToolTip')) {
        this.set('toolTipVolume', this.get('formatInstructionsVolume'));
        this.showInstructionsTooltip();
      }
      this.setProperties({
        noToolTip: false,
        formatInstructionsVolume: null
      });
    },
    createSnapshot: function(volume) {
      let name = this.get('snapshotName');
      let volumeSnapshot = this.store.createRecord('volumeSnapshot', {
        volumeId: volume.get('id'),
        region: volume.get('region.slug'),
        name: name
      });
      let error = false;

      return volumeSnapshot.save().then((model) => {
        model.set('highlightNew', true);
        App.NotificationsManager.show('Snapshot was successfully created.', 'notice', {
          text: 'View ' + name,
          route: 'images.snapshots.volumes'
        });
      }).catch((err) => {
        error = true;
        this.errorHandler(err);
      }).finally(function () {
        if(volume.onSnapshotComplete) {
          volume.onSnapshotComplete(!error);
        }
      });
    }
  }
});
