import Ember from 'ember';
import AutoCompleteController from '../controllers/autocomplete';
import App from '../app';
import {RADIX} from '../constants';
import ENV from '../config/environment';
import { get } from '../utils/apiHelpers';


const HOURS_IN_A_MONTH = 672;
const PRICE_PER_MONTH_PRECISION = 2;
const PRICE_PER_HOUR_PRECISION = 3;
const STEP_SIZE = 100;
const MAX_OPTIONS = 3;

let volumeModalTitle = 'Add a volume';

export default AutoCompleteController.extend({
  DEFAULT_SIZES: [100, 500, 1000], // eslint-disable-line no-magic-numbers
  MAX_VOLUMES: 7,
  MIN_VOLUME_SIZE: 1,
  MAX_VOLUME_SIZE: 16384,
  PRICE_PER_GB_PER_MONTH: 0.10,

  volumesDesc: 'Volumes are highly available block storage that you can attach to your Droplet. You can create a new block storage volume or attach to an existing detached volume to your Droplet.',
  volumeModalTitle: volumeModalTitle,
  attachBtnCopy: 'Create Volume',

  duplicateErrMsg: 'You already have a volume with that name. Please use a different name.',

  atVolumeMax: function () {
    return this.get('numVolumes') >= this.MAX_VOLUMES;
  }.property('numVolumes'),

  maxVolumesMsg: function () {
    return `Only ${this.MAX_VOLUMES} volumes can be attached to a Droplet at a time.` + (this.longMsg ? ' Detach or delete a volume to add a new volume to this Droplet' : '');
  }.property(),

  defaultSizes: function () {
    return this.getSizeObj(this.DEFAULT_SIZES);
  }.property(),

  addVolumeDisabled: function () {
    return this.get('attachingVolume') || this.get('volumeSizeInvalid');
  }.property('volumeSizeInvalid', 'attachingVolume'),

  volumeSizeInvalid: function () {
    return !this.onCustomInputValidation(this.get('curSizeVal'));
  }.property('curSizeVal'),

  volumeValidation: function() {
    return {
      '.aurora-auto-complete input': this.volumeSizeIsValid.bind(this)
    };
  }.property('modalResizeVolume'),


  disabledVolumeDropletAutoCompleteItems: function () {
    let indices = [];
    let snapshotRegion = this.get('snapshot.region');
    this.get('autoCompleteItems').forEach(function (model, index) {
      if(!model.get('region.storageEnabled')) {
        indices.push({ index: index, reason: model.get('region.slug').toUpperCase() + ' does not support block storage yet'});
      } else if(snapshotRegion && (model.get('region.slug').toLowerCase() !== snapshotRegion.toLowerCase())) {
        indices.push({ index: index, reason: 'Droplet is not in ' + snapshotRegion.toUpperCase()});
      } else if(model.get('currentlyPendingEvent.id') ) {
        indices.push({ index: index, reason: 'Droplet is currently processing another event'});
      }
    });
    return indices;
  }.property('autoCompleteItems', 'snapshot'),

  showTabs: function () {
    return this.get('volumeSnapshots.length') || this.get('unattachedVolumes.length');
  }.property('volumeSnapshots', 'unattachedVolumes'),

  /**
   * setCustomInputValidation
   * setting up custom volume sizes
   */
  setCustomInputValidation: function () {
    this.onCustomInputValidation = this.volumeSizeIsValid.bind(this);
    this.set('customVolumeObj', this.customDefaultSize());
  }.on('init'),

  /**
   * updateCustomVolume
   * @param  {num} size input size in GB
   */
  updateCustomVolume: function (size) {
    let valueNum = window.parseInt(size, RADIX);
    return this.get('customVolumeObj').setProperties({
      disk: size,
      monthlyPrice: this.pricePerMonth(valueNum, false, true),
      costPerHour: this.pricePerHour(valueNum, false, true)
    });
  },

  updateVolumeSequenceNum: function (region, offset) {
    this.set('volumeSequenceNum.' + region, this.get('volumeSequenceNum.' + region) + (offset || 1));
  },

  onCustomVolumeChange: function (size) {
    let isValid = this.onCustomInputValidation(size);
    if(isValid){
      this.updateCustomVolume(size);
    } else {
      this.resetCustomVolumeCosts();
    }
    this.setVolumeSize(size);
  },

  getNextVolumeName: function () {
    let region = this.get('volumeRegionSlug');
    if(!region) {
      return '';
    }
    let sequenceNum = this.get('volumeSequenceNum')[region] || 1;
    if(sequenceNum < 10) { // eslint-disable-line no-magic-numbers
      sequenceNum = '0' + sequenceNum;
    }

    return `volume-${region}-${sequenceNum}`;
  },

  finishAttachVolume: function(volume, attachPromise, after) {
    let newlyAttachedVolumes = this.get('newlyAttachedVolumes');
    let newlyAttachedIndex = newlyAttachedVolumes.indexOf(volume);
    if(newlyAttachedIndex !== -1) {
      newlyAttachedVolumes.splice(newlyAttachedIndex, 1);
    }
    newlyAttachedVolumes.unshift(volume);

    volume.set('detached', false);
    this.setProperties({
      newlyAttachedVolumes: newlyAttachedVolumes.slice(),
      pendingVolume: volume
    });

    if(!this.get('dontTransitionAfterAttach')) {
      this.transitionToRoute(this.routeName, {
        queryParams: {
          page: 1,
          pendingAttach: attachPromise,
          sort: 'created_at',
          sort_direction: 'desc'
        }
      });
    }
    let event = volume.get('attachEvent');
    event.set('onFailure', () => {
      this.updateUnattachedVolumes();
      this.get('newlyAttachedVolumes').removeObject(volume);
    });
    if(after) {
      after(event);
    }
  },

  attachVolume: function (volume, droplet, after) {
    this.set('pendingVolume', volume);
    let attachPromise = volume.attachToDroplet(droplet.get('id')).then(() => {
      this.finishAttachVolume(volume, attachPromise, after);
    }).catch((err) => {
      this.set('pendingVolume', null);
      this.errorHandler(err, 'Attaching Volume');
      throw err;
    });
    return attachPromise;
  },

  restoreSnapshot: function (snapshot, droplet, region, name) {
    let attachPromise = snapshot.restore(droplet.get('id'), region, this.get('newVolumeSize'), name).then(() => {
      //restore will create a new volume for us,
      //however the promise can't return it b/c it is bound to the snapshot, not the volume-snapshot
      let newVolume = this.store.peekAll('volume').get('lastObject');
      this.finishAttachVolume(newVolume, attachPromise);
      this.afterAttach();
      this.updateVolumeSequenceNum(region);
    }).catch((err) => {
      this.errorHandler(err, 'Restoring a Volume Snapshot');
    }).finally(() => {
      this.set('attachingVolume', false);
    });
    return attachPromise;
  },

  afterAttach: function (volume) {
    this.setProperties({
      formatInstructionsVolume: volume,
      showTooltip: true,
      showAttachModal: false
    });
  },

  attachNew: function(droplet,region,name) {
    let volume = this.store.createRecord('volume', {
      name: name,
      sizeGigabytes: this.get('newVolumeSize'),
      regionSlug: region
    });

    let finishAttach = this.afterAttach.bind(this, volume);

    return volume.save().then((model) => {
      this.updateVolumeSequenceNum(region);
      if(droplet) {
        return this.attachVolume(model, droplet).then(finishAttach).catch(() => {
          volume.destroyRecord();
        });
      } else {
        App.NotificationsManager.show('Unattached volume has been created.', 'notice');
        finishAttach();
        this.updateUnattachedVolumes();
      }
    }).catch((err) => {
      this.store.unloadRecord(volume);
      this.errorHandler(err, 'Creating a Volume');
    }).finally(() => {
      this.setProperties({
        attachingVolume: false
      });
    });
  },

  attachNewVolume: function(droplet) {
    let name = this.get('newVolumeName');
    let region = droplet.get('region.slug');
    this.set('attachingVolume', true);
    this.nameIsValid(name, region).then((result) => {
      if(!result) {
        this.set('attachingVolume', false);
        return App.NotificationsManager.show(this.duplicateErrMsg, 'alert');
      }
      let snapshot = this.get('snapshot');
      if(snapshot) {
        return this.restoreSnapshot(snapshot, droplet, region, name);
      } else {
        return this.attachNew(droplet, region, name);
      }
    });
  },

  setVolumeSize: function (size) {
    this.setProperties({
      newVolumeSize: size,
      newVolumePriceMonth: this.pricePerMonth(size, false, true),
      newVolumePriceHour: this.pricePerHour(size, false, true),
      curSizeVal: size
    });
  },

  pricePerMonth: function(size, includeUnit, asStr) {
    let price = this.PRICE_PER_GB_PER_MONTH * size;
    price = price.toFixed(PRICE_PER_MONTH_PRECISION);
    if(includeUnit) {
      return '$' + price + '/mo';
    }
    return asStr ? price : price / 1;
  },

  pricePerHour: function(size, includeUnit, asStr) {
    let price = this.PRICE_PER_GB_PER_MONTH * size / HOURS_IN_A_MONTH;
    price = price.toFixed(PRICE_PER_HOUR_PRECISION);
    if(includeUnit) {
      return '$' + price + '/hr';
    }
    return asStr ? price : price / 1;
  },

  /**
   * setNewVolumeNameError
   * @param {string} input name
   * returns {string} error based on regex
   */
  setNewVolumeNameError: function (input) {
    let errorMessage;
    const maxLetters = 64;
    switch (true) {
      case input.length > maxLetters:
        errorMessage = 'Names must be fewer than 64 character';
        break;
      case /\s/.test(input):
        errorMessage = 'Names cannot include spaces';
        break;
      case /(^-+)|(-+$)/.test(input):
        errorMessage = 'Names cannot begin or end with a hyphen';
        break;
      case /[^a-zA-Z0-9/-]/.test(input):
        errorMessage = 'Names must be lowercase alphanumeric';
        break;
      case /(^[0-9]+)/.test(input):
        errorMessage = 'Names must start with a lowercase letter';
        break;
      case /[A-Z]/.test(input):
        errorMessage = 'Names cannot contain uppercase letters';
        break;
      default:
        errorMessage = 'Name is invalid';
        break;
    }
    return errorMessage;
  },

  getSizeObj: function(arr) {
    return arr.map((size) => {
      return Ember.Object.create({
        name:size + 'GB',
        meta: this.pricePerMonth(size, true),
        meta2: this.pricePerHour(size, true),
        id: size,
        disk:size,
        type: 'static',
        modelType: 'volume',
        custom: false,
        monthlyPrice: this.pricePerMonth(size, false, true),
        costPerHour: this.pricePerHour(size, false, true),
        available: true,
        selected: false
      });
    });
  },

  customDefaultSize: function () {
    return Ember.Object.create({
      id: 1,
      disk: '',
      type: 'static',
      modelType: 'volume',
      custom: true,
      monthlyPrice: '',
      costPerHour: '',
      available: true,
      selected: false
    });
  },

  resetCustomVolumeCosts: function() {
    this.get('customVolumeObj').setProperties({
      monthlyPrice: '',
      costPerHour: ''
    });
  },

  resetCustomVolumeObj: function () {
    this.get('customVolumeObj').setProperties({
      disk: '',
      isCurrent: false
    });
    this.resetCustomVolumeCosts();
  },

  setSelectedVolumeSize: function(sizeObj, sizes) {
    sizes = sizes || this.get('volumeSizes');
    sizes.forEach(function (size) {
      size.setProperties({
        selected: size === sizeObj,
        isCurrent: size === sizeObj
      });
    });
  },

  selectVolumeSize: function(sizeObj) {
    let sizes = this.get('volumeSizes');
    if(!sizeObj) {
      sizeObj = sizes[1];
    }
    this.setSelectedVolumeSize(sizeObj, sizes);
    let valueSize = sizeObj.get('disk');
    this.set('curSizeVal', valueSize);

    if(sizeObj.get('custom')) {
      this.onCustomVolumeChange(this.get('customVolumeObj.disk'));
    }
    this.setVolumeSize(valueSize);
  },

  /**
   * [filteredVolumeSizes description]
   * @return {array} list of defaultVolumeSizes
   */
  defaultVolumeSizes: function() {
    let volumeSizes = this.get('defaultSizes');
    volumeSizes.unshift(this.get('customVolumeObj'));
    return volumeSizes;
  }.property(),

  volumeSizes: function () {
    if (this.get('snapshot')){
      let volumeSizes = this.getNextStepSizes(this.get('snapshot.sizeGigabytes'), true);
      volumeSizes[0].set('original', true);

      let custom = this.get('customVolumeObj');
      custom.set('disk', '');
      volumeSizes.unshift(custom);
      return volumeSizes;
    }
    this.resetCustomVolumeObj();
    return this.get('defaultVolumeSizes');
  }.property('snapshot'),

  volumeSizeIsValid: function (val) {
    val = val ? val.toString() : val;
    if(!val || !val.trim().match(/^\d+(gb)?$/i)) {
      return false;
    }
    val = window.parseInt(val, RADIX);
    if(val >= this.MIN_VOLUME_SIZE && val <= this.MAX_VOLUME_SIZE) {
      let resizeVolume = this.get('modalResizeVolume');
      let snapshot = this.get('snapshot');
      if(resizeVolume) {
        return val > resizeVolume.get('sizeGigabytes');
      } else if(snapshot) {
        return val >= snapshot.get('sizeGigabytes');
      }
      return val;
    }
    return false;
  },

  nameIsValid: function (name, region) {
    return get(`/${ENV['api-namespace']}/volumes/valid_name?region_slug=${region}&name=${name}`).then((resp) => {
      return resp.json().then((obj) => {
        return obj[region];
      });
    }, function () {
      return true;
    });
  },

  roundToNearestHundred: function (num) {
    return Math.round(num/100)*100; // eslint-disable-line no-magic-numbers
  },

  getNextStepSizes: function (base, includeBase) {
    let step = STEP_SIZE;
    let nextSize = includeBase ? base : this.roundToNearestHundred(base + step);
    let sizes = [];

    while(sizes.length < MAX_OPTIONS && nextSize <= this.MAX_VOLUME_SIZE) {
      sizes.push(nextSize);
      step += STEP_SIZE * (sizes.length - (includeBase ? 1 : 0));
      nextSize = this.roundToNearestHundred(nextSize + step);
    }
    return this.getSizeObj(sizes);
  },

  actions: {
    selectVolume: function (volume) {
      this.set('selectedVolume', volume);
    },
    changeStorageTab: function(tab) {
      this.setProperties({
        storageTab: tab,
        volumeModalTitle: volumeModalTitle,
        volumeModalSubTitle: null,
        selectedVolume: null,
        snapshot: null,
        step: 1,
        newVolumePriceMonth: null,
        newVolumePriceHour: null
      });
    },

    showAttachModal: function () {
      this.resetCustomVolumeObj();
      this.selectVolumeSize();
      this.setProperties({
        showAttachModal: true,
        storageTab: 'new',
        step: 1,
        newVolumeName: this.getNextVolumeName(),
        unattachedVolumes: this.get('unattachedVolumesFirstPage'),
        volumeModalTitle: volumeModalTitle,
        volumeModalSubTitle: null,
        volumeNameChanged: false,
        newVolumePriceMonth: null,
        newVolumePriceHour: null,
        selectedVolume: null
      });
    },

    onAttachModalHide: function () {
      this.setProperties({
        showAttachModal: false,
        snapshot: null
      });
      if(!this.dropletFromModel){
        this.set('volumeRegionSlug', null);
      }
    },

    /**
     * onSelectVolumeSize Action Method
     * @param  {obj} sizeObj selected obj
     */
    onSelectVolumeSize: function(sizeObj) {
      this.selectVolumeSize(sizeObj);
    },

    /**
     * onCustomVolumeChange Action
     * @param  {num} custom size number
     */
    onCustomVolumeChange: function(size) {
      this.onCustomVolumeChange(size);
    },

    attachVolumeSnapshot: function() {
      let snapshot = this.get('selectedVolume');
      this.setProperties({
        step: 2,
        snapshot: snapshot,
        volumeModalSubTitle: 'Must be equal to or greater than snapshot size (' + snapshot.get('sizeGigabytes') + ' GB).'
      });
      this.selectVolumeSize();
    },

    backToSnapshots: function () {
      this.setProperties({
        step: 1,
        volumeModalTitle: volumeModalTitle
      });
    },

    onSelectVolumeDroplet: function(droplet) {
      this.setProperties({
        selectedDroplet: droplet,
        volumeRegionSlug: droplet.get('region.slug')
      });
      if(!this.get('volumeNameChanged')) {
        this.set('newVolumeName', this.getNextVolumeName());
      }
    },
    onRemoveVolumeDroplet: function () {
      this.setProperties({
        selectedDroplet: null,
        volumeRegionSlug: null
      });
      if(!this.get('volumeNameChanged')) {
        this.set('newVolumeName', '');
      }
    },

    onVolumeNameChange: function(val) {
      this.set('volumeNameChanged', !!val);
    }
  }
});
