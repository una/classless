import Ember from 'ember';
import App from '../app';
import AttachVolumeModalController from '../controllers/attach-volume-modal';
import _ from 'lodash/lodash';
import AuroraImage from '../models/image';
import updateQueryStringParams from '../utils/updateQueryStringParams';
import SshKey from '../models/ssh-key';

const MAX_DROPLETS = 10;

let IMAGE_NAME_REGEX = /(\d{3}\.\d{1,3}\.\d)\s\((alpha|beta|stable)\)/;

export default AttachVolumeModalController.extend({
  DEFAULT_SIZES: [100, 250, 500, 1000, 2000], // eslint-disable-line no-magic-numbers
  trackPageName: 'Droplet Create',
  droplet: null,
  hostNames: [],
  dropletCount: 1,
  sshKeys: [],
  volumes: [],
  tags: [],
  tagSearchResults: [],
  showTagsEditor: false,
  queryParams: [
    'distro',
    'distroImage',
    'appId',
    'imageId',
    'size',
    'region',
    'type',
    'options'
  ],

  validQueryOptions: [
    'backups',
    'ipv6',
    'private_networking',
    'install_agent'
  ],
  overLimitOpen: false,

  // Properties

  // create-choose-size component object
  sizesProps: function () {
    return {
      model: this.get('model'),
      sizesTab: this.get('sizesTab'),
      selectedsizesTab: this.get('selectedsizesTab'),
      image: this.get('image'),
      sizeObj: this.get('sizeObj'),
      dropletLimitReached: this.get('dropletLimitReached')
    };
  }.property('model.sizes', 'sizesTab', 'selectedsizesTab', 'image', 'sizeObj', 'dropletLimitReached'),

  // create-choose-region component object
  regionsProps: function () {
    return {
      model: this.get('model'),
      regionObj: this.get('regionObj'),
      image: this.get('image'),
      distroVersion: this.get('distroVersion'),
      sizeObj: this.get('sizeObj'),
      dropletLimitReached: this.get('dropletLimitReached'),
      volumes: this.get('volumes')
    };
  }.property('model.regions', 'image', 'size', 'sizeObj', 'volumes', 'regionObj', 'distroVersion', 'dropletLimitReached'),

  filteredFeatures: function() {
    if(this.get('dropletLimitReached')) {
      return [];
    }

    let features = this.get('model.features'),
        currentSelectedFeatures = this.get('features'),
        distro = this.get('selectedDistro'),
        region = this.get('regionObj'),
        selectedFeatures = [],
        isDisabled,
        checked;

    _.each(features, (feature) => {
      isDisabled = false;
      checked = false;

      if(_.find(currentSelectedFeatures, {id: feature.id})) {
        checked = true;
      }

      if(distro) {
        if(distro.required_features && distro.required_features.indexOf(feature.id) !== -1) {
          checked = true;
          isDisabled = true;
        }

        if(distro.disabled_features.indexOf(feature.id) !== -1) {
          checked = false;
          isDisabled = true;
        }
      }

      if(region) {
        if(region.disabled_features.indexOf(feature.id) !== -1) {
          checked = false;
          isDisabled = true;
        }
      }

      Ember.setProperties(feature, {
        isDisabled: isDisabled,
        checked: checked
      });

      if(checked) {
        selectedFeatures.push(feature);
      }
    });

    this.set('selectedFeatures', selectedFeatures);

    return features;
  }.property('model.features', 'selectedDistro', 'region', 'features'),


  volumeRegionIds: function () {
    let regions = this.get('model.regions');
    if(regions) {
      return regions.filter(function (region) {
        return region.storage_enabled;
      }).map(function (region) {
        return region.id;
      });
    }
    return [];
  }.property('model.regions'),

  volumeRegionSlug: function () {
    let selectedRegion = this.get('selectedRegion');
    if(selectedRegion && this.get('volumeRegionIds').indexOf(selectedRegion.id) > -1) {
      return selectedRegion.slug;
    }
    return this.get('firstVolumeRegion');
  }.property('volumeRegionIds', 'selectedRegion', 'firstVolumeRegion'),

  totalVolumeCount: function () {
    return this.get('unattachedVolumes.meta.volume_count');
  }.property('unattachedVolumes'),

  volumeLimit: function () {
    return this.get('unattachedVolumes.meta.volume_limit');
  }.property('unattachedVolumes'),

  hasRequiredSshKey: function() {
    let image = this.get('image'),
        distroVersion = this.get('distroVersion'),
        requiresSsh = false;

    if(distroVersion && image && image.required_features) {
      // does the selected distro or distro version require ssh keys?
      if(image.required_features.indexOf('ssh') !== -1 || distroVersion.required_settings.indexOf('ssh') !== -1) {
        requiresSsh = true;
      }
    }

    if(!distroVersion && image) {
      let imageRequiredSettings = image.required_settings || image.get('requiredSettings') || [];

      // does the single-click app or snapshot/backup require ssh keys?
      if(imageRequiredSettings.indexOf('ssh') !== -1) {
        requiresSsh = true;
      }
    }

    if(!requiresSsh) {
      return true;
    }

    return !!this.get('sshKeys.length');
  }.property('selectedDistro', 'image', 'sshKeys'),

  maxDroplets: function() {
    return Math.min(MAX_DROPLETS, this.get('model.initial_state.droplet_limit') - this.get('model.initial_state.droplet_count'));
  }.property('model.initial_state.droplet_count', 'model.initial_state.droplet_limit', 'volumes'),

  distroVersion: function() {
    if(this.get('selectedDistro')) {
      return this.get(this.get('selectedDistro.name') + 'distroVersion');
    }
    return null;
  }.property('selectedDistro'),

  isValid: function() {
    let distroVersion = this.get('distroVersion'),
        image = this.get('image'),
        size = this.get('selectedSize'),
        region = this.get('selectedRegion'),
        hasRequiredSshKey = this.get('hasRequiredSshKey'),
        hasInvalidVolumeSize = this.get('hasInvalidVolumeSize'),
        hostNames = this.get('hostNames');
    return !!((distroVersion && image || (!distroVersion && image)) && !hasInvalidVolumeSize && size && region && hasRequiredSshKey && !_.isEmpty(hostNames));
  }.property('distroVersion', 'image', 'selectedSize', 'selectedRegion', 'hasRequiredSshKey', 'hasInvalidVolumeSize', 'hostNames'),

  createButtonIsEnabled: function() {
    return this.get('isValid') && !this.get('droplet.isCreating');
  }.property('isValid', 'droplet.isCreating'),

  numVolumes: function () {
    return this.get('volumes.length');
  }.property('volumes'),

  // Observers

  afterSshKeyRefresh: function () {
    if(!this.get('sshKeyPaginationLoading') && this.get('refeshingSshKeys')) {
      this.set('refeshingSshKeys', false);
      this.hideModal();
    }
  }.observes('sshKeyPaginationLoading'),

  sshKeysChanged: function () {
    // create copy of sshKeys so observers trigger for each change
    let keys = this.get('sshKeys') || [];
    keys = keys.slice();
    let modelKeys = this.get('model.ssh_keys') || [];

    modelKeys.forEach(function (key) {
      let id = key.get('id');
      let index = keys.indexOf(id);

      if(key.get('checked') && index === -1) {
        keys.push(id);
      } else if(!key.get('checked') && index !== -1) {
        keys.splice(keys.indexOf(id), 1);
      }
    });
    this.set('sshKeys', keys);
  }.observes('model.ssh_keys.@each.checked'),

  // *** Deep linking observers that replace state ***

  setDistroParam: function() {
    let nameToSet = this.get('distroVersion.distribution_name');
    nameToSet = nameToSet ? nameToSet.toLowerCase() : nameToSet;
    if (nameToSet) {
      this.replaceState({
        distro: nameToSet,
        distroImage: this.get('distroVersion.slug_name'),
        type: null
      });
    }
  }.observes('selectedDistro'),

  setOptionsParams: function() {
    let featuresToSet = this.get('features');
    let toReplace = _.reduce(featuresToSet, (result, value) => {
      if (_.includes(this.validQueryOptions, value.id)) {
        result.push(value.id);
      }
      return result;
    }, []);
    this.replaceState({
      options: toReplace.join(',')
    });
  }.observes('features'),

  setImageIdParam: function() {
    let image = this.get('image');
    let currentTab = this.get('selectedImageTab');
    let distroImages = this.get('image.images');
    let toReplace = {};
    // If the image is not a distro
    if (image && !distroImages && currentTab && currentTab !== 'distro') {
      toReplace.distro = null;
      toReplace.distroImage = null;
      let isApplication = image && !!image.required_settings;
      if (isApplication) {
        toReplace.appId = this.get('image.id');
        toReplace.imageId = null;
        toReplace.type = 'applications';
        // The image is either a snapshot or backup
      } else {
        toReplace.appId = null;
        toReplace.imageId = this.get('image.id');
        toReplace.type = (_.isFunction(image.get) && image.get('isSnapshot')) ? 'snapshots' : 'backups';
      }
    // When the image is a distro, we want to ensure we clear the query string of these parameters
    } else {
      toReplace.appId = null;
      toReplace.imageId = null;
      toReplace.type = null;
    }
    this.replaceState(toReplace);
  }.observes('image'),

  onVolumesChange: function () {
    if(this.get('volumes').length) {
      this.set('dropletCount', 1);
    }
  }.observes('volumes'),

  setSizeParam: function() {
    let toSet = this.get('selectedSize.name');
    toSet = toSet ? toSet.toLowerCase() : toSet;
    this.replaceState({
      size: toSet
    });
  }.observes('selectedSize'),

  setRegionParam: function() {
    let toSet = this.get('selectedRegion.slug');
    toSet = toSet ? toSet.toLowerCase() : toSet;
    this.replaceState({
      region: toSet
    });
  }.observes('selectedRegion'),

  // *** end of deep linking observers ***

  disableUnattachedDrives: function () {
    if(this.get('storageTab') === 'existing') {
      let filteredRegions = this.get('filteredRegions').filter(function (region) {
        return !region.restriction;
      }).map(function (region) {
        return '' + region.id;
      });
      this.get('unattachedVolumes').forEach((volume) => {
        let disabled = filteredRegions.indexOf(volume.get('region.id')) === -1;
        volume.set('disabled', disabled ? 'The region this volume is in is not available for your selected image.' : false);
      });
    }
  }.observes('image', 'selectedRegion', 'selectedSize', 'storageTab', 'unattachedVolumes'),

  updateVolumesEnabled: function () {
    let volumesEnabled = this.volumesAvailableForImage();
    this.set('volumesEnabled', volumesEnabled);
    if(!volumesEnabled) {
      this.removeVolume();
    }
  }.observes('image', 'selectedRegion', 'selectedSize'),


  init: function() {
    this.droplet = this.store.createRecord('droplet-to-create');
  }.on('init'),


  // STATE FUNCTIONS

  replaceState: function(queryParams) {
    updateQueryStringParams(queryParams);
  },

  setVolumeSize: function (size) {
    this.setProperties({
      volumes: [this.sizeToVolume(this.get('customVolumeObj'))],
      hasInvalidVolumeSize: !this.volumeSizeIsValid(size)
    });
  },

  resetState: function() {
    this.setProperties({
      image: null,
      sizeObj: null,
      regionObj: null,
      hostNames: [],
      selectedDistro: null,
      selectedSize: null,
      selectedRegion: null,
      selectedFeatures: null,
      sshKeys: [],
      userData: null,
      dropletCount: 1,
      features: [],
      volumes: [],
      storageTab: '',
      selectedStorageTab: '',
      selectedSizesTab: '',
      hasInvalidVolumeSize: false,
      dropletLimitReached: false,
      tags: [],
      tagSearchResults: []
    });

    let sshKeys = this.get('model.ssh_keys') || [];

    sshKeys.forEach(function(key) {
      Ember.set(key, 'checked', false);
    });
  },

  volumesAvailableForImage: function (image, distroVersion) {

    if(!arguments.length) {
      image = this.get('image');
    }
    if(arguments.length < 2) { // eslint-disable-line no-magic-numbers
      distroVersion = this.get('distroVersion');
    }
    let filterRegions = true;
    if(arguments.length) {
      filterRegions = false;
    }

    let filteredRegions = filterRegions ? this.get('filteredRegions') : null;
    function removeInvalidRegions (regions) {
      if(!filterRegions || !filteredRegions) {
        return regions;
      }
      return regions.filter(function (id) {
        let regionObj = filteredRegions.filter(function (region) {
          return region.id === id;
        })[0];
        return regionObj && !regionObj.restriction;
      });
    }
    let sizeRegions = this.get('selectedSize.region_ids');
    let volumes = this.get('volumes');
    let volumeRegionIds = volumes.length && volumes[0].get('isUnattached') ? [window.parseInt(volumes[0].get('region.id'))] : this.get('volumeRegionIds');
    let imageRegionIds = distroVersion ? distroVersion.region_ids : (image ? (image.region_ids || (image.get ? image.get('regionIds') : null)) : null);

    return (!sizeRegions || _.intersection(removeInvalidRegions(sizeRegions), volumeRegionIds).length) && (!imageRegionIds || _.intersection(removeInvalidRegions(imageRegionIds), volumeRegionIds).length);
  },

  _setDistroImage: function(distro, image) {
    this.set('selectedDistro', null);
    if(distro) {
      image = this._getDistoVersionImage(distro, image);
      this.set(distro.name + 'distroVersion', image);
      this.set('selectedDistro', distro);
      this.droplet.set('imageId', image.id);
    }
  },

  setSizesTab: function (tab) {
    this.set('sizesTab', tab);
  },


  paginateSshKeys: function (page) {
    this.set('sshKeyPaginationLoading', true);
    this.send('sshKeyPaginate', page);
  },

  hideModal: function () {
    this.setProperties({
      showModal: false,
      savingKey: false,
      keyName: '',
      keyValue: ''
    });
  },

  sizeToVolume: function(volume) {
    let size = volume.get('disk');
    return Ember.Object.create({
      sizeGigabytes: size,
      pricePerMonth: this.pricePerMonth(size, true)
    });
  },

  onCustomVolumeChange: function (size) {
    let isValid = this.onCustomInputValidation(size);
    if(isValid){
      this.updateCustomVolume(size);
    } else {
      this.resetCustomVolumeCosts();
    }
    this.setProperties({
      volumes: [this.sizeToVolume(this.get('customVolumeObj'))],
      hasInvalidVolumeSize: !isValid
    });
  },

  removeVolume: function() {
    this.setProperties({
      volumes: [],
      hasInvalidVolumeSize: false,
      storageTab: ''
    });
  },

  // UTILITY FUNCTION

  // CoreOS is a special case where we want to select the last stable release as a default
  // https://jira.internal.digitalocean.com/browse/CTR-785
  _coreOSFirstStableImage: function(distroImages) {
    let matches;
    return _.find(distroImages, function(image) {
      matches = IMAGE_NAME_REGEX.exec(image.name);
      return (_.isArray(matches) && matches.length === 3 && matches[2] === 'stable'); // eslint-disable-line no-magic-numbers
    });
  },

  _getDistoVersionImage: function(distro, image) {
    if(!image && distro.images.length) {
      image = distro.images[0];
      // For CoreOS, we want to default to the first stable release if available
      if (distro.name === 'CoreOS') {
        let coreOSStableImage = this._coreOSFirstStableImage(distro.images);
        if (coreOSStableImage) {
          image = coreOSStableImage;
        }
      }
    }
    return image;
  },

  actions: {
    onSelectImage: function(image, type) {
      let imageName = (image instanceof AuroraImage) ? image.get('name') : image.name;
      let distroVersion = this.get(imageName + 'distroVersion');
      this.selectImage = () => {
        // set which tab has the selected image
        this.set('selectedImageTab', type);

        if(type === 'distro') {
          // default to what was previously selected for the distro image version when distribution image is selected
          // otherwise, use the first image version
          this._setDistroImage(image, distroVersion);
        } else {
          this.set('selectedDistro', null);
        }
        this.set('image', image);
      };
      if(this.get('volumes').length && !this.volumesAvailableForImage(image, type === 'distro' ? this._getDistoVersionImage(image, distroVersion) : null)) {
        this.set('showConfirmRemoveVolumesModal', true);
      } else {
        this.selectImage();
      }
    },

    onHideConfirmRemoveVolumesModal: function (confirm) {
      if(confirm) {
        this.removeVolume();
        this.selectImage();
      }
      this.set('showConfirmRemoveVolumesModal', false);
    },

    onSelectDistroVersion: function(image, distro) {
      this.selectImage = () => {
        this.set('selectedImageTab', 'distro');
        this._setDistroImage(image, distro);
        this.set('image', image);
      };
      if(this.get('volumes').length && !this.volumesAvailableForImage(image, distro)) {
        this.set('showConfirmRemoveVolumesModal', true);
      } else {
        this.selectImage();
      }
    },

    onSelectSize: function(sizeObj) {
      this.setProperties({
        sizeObj: sizeObj,
        selectedsizesTab: sizeObj.size_category.name,
        sizesTab: sizeObj.size_category.name,
        selectedSize: sizeObj
      });
      this.droplet.set('sizeId', sizeObj.id);
    },

    onSetSelectedSize: function(sizeObj) {
      this.set('selectedSize', sizeObj);
    },

    /**
     * onSelectVolumeSize Action Method
     * @param  {obj} sizeObj selected obj
     */
    onSelectVolumeSize: function(sizeObj) {
      this.setSelectedVolumeSize(sizeObj);
      if(sizeObj.get('custom')) {
        this.onCustomVolumeChange(this.get('customVolumeObj.disk'));
      } else {
        this.setProperties({
          volumes: [this.sizeToVolume(sizeObj)],
          hasInvalidVolumeSize: false
        });
      }
      this.setProperties({
        selectedStorageTab: 'new',
        selectedVolume: null
      });
    },

    selectVolume: function (volume) {
      volume.set('pricePerMonth', this.pricePerMonth(volume.get('sizeGigabytes'), true));
      this.setProperties({
        volumes: [volume],
        selectedStorageTab: 'existing'
      });
      this.get('defaultVolumeSizes').map(function (size) {
        size.set('isCurrent', false);
      });
      this._super(volume);
    },

    onSelectRegion: function (region) {
      this.setProperties({
        regionObj: region,
        selectedRegion: region
      });
      this.droplet.set('regionId', region.id);
    },

    onSetSelectedRegion: function (region) {
      return this.set('selectedRegion', region);
    },

    setFilteredRegions: function(filteredRegions){
      this.set('filteredRegions', filteredRegions);
    },

    onSelectOption: function(selectedOptions) {
      this.set('features', selectedOptions);
    },

    onBlurUserData: function(value) {
      this.set('userData', value);
    },

    createDroplets: function() {
      let hostNames = this.get('hostNames'),
          moreThanOneDroplet = hostNames.length > 1,
          pluralize = moreThanOneDroplet ? 's' : '',
          features = this.get('selectedFeatures').map(function(feature) { return feature.id; }),
          sshKeys = this.get('sshKeys') || [],
          volumes = this.volumes.map((volume) => {
            let id = volume.get('id');
            if(id) {
              return {
                id: id
              };
            }
            return {
              name: this.getNextVolumeName(),
              size_gigabytes: volume.get('sizeGigabytes')
            };
          }),
          tags = this.get('tags');

      if (moreThanOneDroplet) {
        this.droplet.set('names', hostNames);
      } else {
        this.droplet.set('name', hostNames[0]);
      }

      this.droplet.set('tags', tags);

      // convert ssh key ids to ints
      sshKeys = _.uniq(sshKeys.map(function(key) {
        let id = key instanceof SshKey ? key.get('id') : key;
        return parseInt(id, 10);
      }));

      this.droplet.setProperties({
        sizeId: this.get('selectedSize.id'),
        regionId: this.get('selectedRegion.id'),
        imageId: this.get('distroVersion') ? this.get('distroVersion.id') : this.get('image.id'),
        userData: this.get('userData'),
        sshKeyIds: sshKeys,
        volumes: volumes,
        isCreating: true
      });

      features = features.filter(function (feature) {
        return feature !== 'metadata';
      });

      this.droplet.save(features).then(() => {
        this.transitionToRoute('droplets', {
          queryParams: {
            query: null,
            sort: 'created_at',
            sort_direction: 'desc',
            page: 1
          }
        });
      }).catch(() => {
        App.NotificationsManager.show(`Sorry! We've encountered an error creating your Droplet${pluralize}.`, 'alert');
      }).finally(() => {
        this.droplet.set('isCreating', false);

        // Ensure that we reset so if we add or remove droplet names we don't end up
        // with both name and names defined.
        if (moreThanOneDroplet) {
          this.droplet.set('names', null);
        } else {
          this.droplet.set('name', null);
        }
      });
    },

    increaseDroplets: function() {
      if(this.get('dropletCount') + 1 <= this.get('maxDroplets')) {
        this.set('dropletCount', this.get('dropletCount') + 1);
      }
    },

    decreaseDroplets: function() {
      if(this.get('dropletCount') - 1 > 0) {
        this.set('dropletCount', this.get('dropletCount') - 1);
      }
    },

    loadImages: function(type) {
      this.set('imageTab', type);

      if(!this.get(type) && type !== 'distributions') {
        this.send('updateModel', type);
      }
    },

    showVolumeSizeChooser: function() {
      let sizes = this.get('defaultVolumeSizes');
      sizes.map(function (size, i) {
        size.set('isCurrent', i === 1);
      });

      this.resetCustomVolumeCosts();
      this.setProperties({
        storageTab: 'new',
        selectedStorageTab: 'new',
        selectedVolume: null,
        volumes: [this.sizeToVolume(sizes[1])],
        'customVolumeObj.disk': ''
      });
    },

    changeStorageTab: function(tab) {
      this.set('storageTab', tab);
    },

    changeSizesTab: function(tab) {
      this.setSizesTab(tab);
    },

    showOverLimit: function() {
      this.set('overLimitOpen', true);
    },

    removeVolume: function() {
      this.removeVolume();
    },

    changePage: function(page) {
      this.send('updateModel', this.get('imageTab'), page);
    },

    setHostNames: function(hostNames) {
      this.set('hostNames', hostNames);
    },

    changeSshKeyPage: function(page) {
      this.paginateSshKeys(page);
    },

    showSshModal: function () {
      this.set('showModal', true);
    },
    toggleShowTagsEditor: function() {
      this.set('showTagsEditor', true);
    },

    hideSshModal: function () {
      this.setProperties({
        showModal: false,
        keyName: '',
        keyValue: ''
      });
    },

    saveSshKey: function (keyMeta) {
      let key = this.store.createRecord('ssh-key', keyMeta);

      this.set('savingKey', true);

      key.save().then(() => {
        let keys = this.get('sshKeys');
        keys.push(key);
        this.set('sshKeys', keys);

        if(this.get('model.meta.ssh-keys.current_page') !== 1) {
          this.paginateSshKeys(1);
          this.set('refeshingSshKeys', true);
        } else {
          this.hideModal();
        }
      }).catch((err) => {
        this.store.unloadRecord(key);
        this.set('savingKey', false);
        this.errorHandler(err, 'Create SSH Key');
      });
    },
    queryTags: function(query) {
      this.store.query('tag', { query: query }).then((tags) => {
        this.set('tagSearchResults', tags);
      });
    },
    updateTags: function(tags) {
      this.set('tags', tags);
    },

    resetState: function() {
      this.resetState();
    }
  }
});
