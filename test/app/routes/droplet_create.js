import Ember from 'ember';
import { get } from '../utils/apiHelpers';
import ENV from '../config/environment';
import _ from 'lodash/lodash';
import App from '../app';
import AttachVolumeModalRoute from '../routes/attach-volume-modal';
import updateQueryStringParams from '../utils/updateQueryStringParams';
import {STATUS_CODE_FORBIDDEN, BYTES_IN_KB, COST_PER_HOUR_PRECISION} from '../constants';

/*
  Examples of deeplinks:
    ?distro=debian
    ?distroImage=306
    ?appId=36
    ?imageId=5  (used from snapshots/backups image page)
    ?size=4gb
    ?region=nyc1
    ?options=monitoring,backups,ipv6,private_networking
 */

export default AttachVolumeModalRoute.extend({
  titleToken: 'Create Droplets',
  deeplinks: {},
  dropletLimitReached: false,
  dropletCreateEventsDisabled: false,
  dontResetSelectedVolumes: true,

  beforeModel: function(transition) {
    if (App.User.get('isInHoldContext') && !App.User.get('isInVerifiedContext')) {
      this.transitionTo('hold');
      return;
    }
    // This is done here to support legacy deeplinking without convoluting
    // Ember's use of queryParameters
    if(transition.queryParams && transition.queryParams.image) {
      this.deeplinks.imageSlug = transition.queryParams.image.toLowerCase();
      //Remove query parameter
      updateQueryStringParams({'image': null});
    }
  },

  _getJSON: function(uri) {
    return get(uri).then((resp) => {
      return resp.json();
    }, (error) => {
      if(error && error.status === STATUS_CODE_FORBIDDEN) {
        return error.json().then((json) => {
          if(json.error === 'droplet_limit_reached') {
            this.dropletLimitReached = true;
          } else if(json.error === 'droplet_create_disabled') {
            this.dropletCreateEventsDisabled = true;
          } else {
            throw new Error(json.error);
          }
        });
      } else {
        throw new Error('sentry-ignore droplet create');
      }
    });
  },

  _isSnapshotsOrBackups: function(type) {
    return type === 'snapshots' || type === 'backups';
  },

  _getModel: function(params) {
    let hash = {};

    if(this.deeplinks.imageSlug) {
      params.type = 'applications';
    }

    if(params.type) {

      this.set('imageType', params.type);

      if(!params.page) {
        params.page = 1;
      }

      if(this._isSnapshotsOrBackups(params.type)) {
        hash.images = this.store.query('image', {
          type: params.type === 'snapshots' ? 'snapshot' : 'backup',
          page: params.page,
          sort: 'created_at',
          sort_direction: 'desc'
        });
      } else {
        hash.images = this._getJSON(`/${ENV['api-namespace']}/images/${params.type}?page=${params.page}`);
      }
    }

    if(!this.optionsLoaded) {
      hash.options = this._getJSON(`/${ENV['api-namespace']}/droplets/options_for_create`).then((model) => {
        if(model && model.regions) {
          model.regions = model.regions.map(function (region) {
            region.storage_enabled = region.features && region.features.indexOf('storage') > -1;
            return region;
          });
          let firstStorageRegion = model.regions.filter(function (region) {
            return region.storage_enabled;
          })[0];
          if(firstStorageRegion) {
            model.firstStorageRegion = firstStorageRegion.slug;
            return this.getUnattachedVolumes(null).then(function (unattachedVolumes) {
              model.unattachedVolumes = unattachedVolumes;
              return model;
            });
          }
          return model;
        }
        return model;
      });
      hash.volumeSequenceNum = this.getSequenceNumber();
    }

    return Ember.RSVP.hash(hash);
  },

  _setApplicationIconNames: function(images) {
    images.forEach((image) => {
      image.iconName = image.name
                            .replace(/[^a-zA-Z\s\-]/g, '')
                            .toLowerCase().split(/\s|\-/)
                            .filter(function(el){return el.length > 2;}) // eslint-disable-line no-magic-numbers
                            .join('-');
    });

    return images;
  },

  _findImageById: function(images, imageId) {
    return _.find(images, {id: imageId});
  },

  _prependDeeplinkImageToImages: function(images) {
    let deeplinkImage = this.get('deeplinkImage');

    // if we have an image from the deeplink, it doesn't exist on
    // this page, and it is of the same type add it to the beginning of the list
    if(deeplinkImage && !images.findBy('id', deeplinkImage.get('id')) && deeplinkImage.get('isSnapshot') === images.toArray()[0].get('isSnapshot')) {

      images.unshiftObject(deeplinkImage._internalModel);

    }

    return images;
  },

  /*
    The initially selected image is determined in the following order:
      1. Snapshot/Backup deeplink
      2. Distro deeplink
      3. App deeplink
      4. Initial image id set the in the options API search distros
      5. Initial image id set the in the options API search distro versions
      6. First distribution
   */
  _setInitialImage: function() {
    let image = this.get('deeplinkImage'),
        imageType = 'distro';

    if(image) {
      imageType = this.get('imageType');
    }

    if(!image) {
      let deeplinkDistroSlug = this.deeplinks.distroSlug,
          deeplinkDistroVersionSlug = this.deeplinks.distroVersionSlug,
          deeplinkImageSlug = this.deeplinks.imageSlug,
          deeplinkAppId = this.deeplinks.appId,
          initialImageId = this.controller.get('model.initial_state.image_id'),
          distributions = this.controller.get('model.distributions'),
          distroVersion = null,
          distro = null,
          options = this.deeplinks.options,
          applications;

      let selectedFeatures = _.filter(this.controller.get('model.features'), function(feature) {
        if(_.includes(options, feature.id)) {
          Ember.set(feature, 'checked', true);
          return true;
        }
        return false;
      });

      // Monitoring, if present, should look at the feature flipper to be selected by default
      let monitoringFeature = _.find(this.controller.get('model.features'), function(f) { return f.id === 'install_agent'; });
      if(monitoringFeature && App.featureEnabled('dropletCreateMonitoring')) {
        Ember.set(monitoringFeature, 'checked', true);
        selectedFeatures = selectedFeatures.concat([monitoringFeature]);
      }

      // Even if options is an empty collection, trigger so it'll clear any non-valid values from query parameters
      this.controller.send('onSelectOption', selectedFeatures);

      // Supports deprecated deeplinks in the form of image=imageSlug that links to distros
      // and applications.
      if(deeplinkImageSlug) {
        let images = _.flatten(_.map(distributions, function(distro) {
          return distro.images;
        }));
        image = _.find(images, function(image) {
          return image.slug_name === deeplinkImageSlug;
        });
        if(image) {
          distro = _.find(distributions, function(distro) {
            return distro.name.toLowerCase() === image.distribution_name.toLowerCase();
          });

          this.deeplinks.distroSlug = distro.slug;
          this.deeplinks.distroVersionSlug = image.slug;
          this.controller.set('imageTab', 'distributions');
          this.controller.send('onSelectDistroVersion', distro, image);
          return;
        } else {
          applications = this.modelFor('dropletCreate').images.images;
          image = _.find(applications, function(app) {
            return app.slug_name && (app.slug_name.toLowerCase() === deeplinkImageSlug);
          });
          if (image) {
            this.deeplinks.appId = parseInt(image.appId, 10);
            this.deeplinks.type = 'applications';
            imageType = 'application';
          }
        }
      }

      if(deeplinkDistroSlug) {
        distro = _.find(distributions, function(distro) {
          return distro.name.toLowerCase() === deeplinkDistroSlug;
        });
        if(distro) {
          if(deeplinkDistroVersionSlug) {
            image = _.find(distro.images, function(image) {
              return image.slug_name && (image.slug_name.toLowerCase() === deeplinkDistroVersionSlug);
            });
            if(image) {
              this.controller.send('onSelectDistroVersion', distro, image);
              return;
            }
          }
          if(!image) {
            image = distro;
            imageType = 'distro';
          }
        }
      }

      if(!image && deeplinkAppId) {
        applications = this.controller.get('applications');
        image = this._findImageById(applications, deeplinkAppId);
        imageType = 'application';
      }

      if(!image && initialImageId) {
        image = this._findImageById(distributions, initialImageId);
        if (image) {
          imageType = 'distro';
          this.controller.set('imageTab', 'distributions');
        }
      }

      if(!image) {
        distributions.forEach((distro) => {
          if(!image) {
            image = this._findImageById(distro.images, initialImageId);
            if(image) {
              distroVersion = image;
              image = distro;
            }
          }
        });

        if(image && distroVersion) {
          this.controller.set('imageTab', 'distributions');
          this.controller.send('onSelectDistroVersion', image, distroVersion);
          return;
        }
      }

      if(!image && distributions) {
        image = distributions[0];
        imageType = 'distro';
      }
    }

    if(image) {
      this.controller.send('onSelectImage', image, imageType);
    }
  },

  _formatSizes: function(sizes) {
    let convertToMb = function(value) { return value / (BYTES_IN_KB * BYTES_IN_KB); },
        convertToGb = function(value) { return value / (BYTES_IN_KB * BYTES_IN_KB * BYTES_IN_KB); };

    sizes.forEach(function(size) {
      size.monthlyPrice = size.price_per_month;
      size.costPerHour = size.price_per_hour.toFixed(COST_PER_HOUR_PRECISION);
      size.cpu = size.cpu_count;
      size.memory = convertToMb(size.memory_in_bytes);
      size.disk = convertToGb(size.disk_in_bytes);
      size.bandwidth = convertToGb(size.bandwidth_in_bytes);
    });

    return sizes;
  },

  _setDeeplinkValues: function(params) {
    if(params.size) {
      this.deeplinks.size = params.size;
    }

    if(params.region) {
      this.deeplinks.region = params.region;
    }

    if(params.options) {
      let validQueryOptions = this.controllerFor('droplet_create').get('validQueryOptions');
      this.deeplinks.options = _.filter(params.options.split(','), (option) => {
        return _.includes(validQueryOptions, option);
      });
    }

    if(params.distro) {
      this.deeplinks.distroSlug = params.distro.toLowerCase();
      if(params.distroImage) {
        this.deeplinks.distroVersionSlug = params.distroImage.toLowerCase();
      }
    }

    if(params.appId) {
      this.deeplinks.appId = parseInt(params.appId, 10);
      this.deeplinks.type = 'applications';
      params.type = 'applications';
    }
  },

  model: function(params) {
    this._setDeeplinkValues(params);
    let imageId = params.imageId && parseInt(params.imageId, 10);
    let appId = (params.appId && parseInt(params.appId, 10));
    if(imageId && !params.distro) {
      return this.store.findRecord('image', imageId).then((image) => {
        if(image) {
          this.set('deeplinkImage', image);
          params.type = image.get('isSnapshot') ? 'snapshots' : 'backups';
          this.set('imageType', params.type);
        }
      }).catch(() => {
        // this catch prevents the 404 takeover if the image with an id of params.imageId does not exist
      }).then(this._getModel.bind(this, params));
    } else if (!appId) {
      params.type = null;
    }
    return this._getModel(params);
  },

  _parseImagesFromJson: function(json, imageType, page) {
    let images;

    if(this._isSnapshotsOrBackups(imageType)) {
      images = json.images;
      if(page === 1) {
        images = this._prependDeeplinkImageToImages(images);
      }
    } else {
      images = json.images.images;

      if(imageType === 'applications') {
        images = this._setApplicationIconNames(images);
      }

      images.meta = json.images.meta;
    }

    return images;
  },

  setupController: function(controller, model) {
    this.controller = controller;

    if(this.dropletCreateEventsDisabled) {
      this.controllerFor('application').set('dropletCreateEventsDisabled', true);
      this.transitionTo('droplets');
    } else if(this.dropletLimitReached) {
      controller.setProperties({
        dropletLimit: App.User.get('dropletLimit'),
        dropletLimitReached: true,
        isUserContext: App.User.get('isUserContext')
      });
    } else {
      let imageType = this.get('imageType');

      if(!this.optionsLoaded) {
        this.optionsLoaded = true;
      }

      if(imageType && model.images) {
        let images = this._parseImagesFromJson(model, imageType, 1);
        controller.set(imageType, images);
        controller.set('imageTab', imageType);
      }

      if(model.options) {
        model.options.query_state = {
          size: _.find(model.options.sizes, (size) => {
            return this.deeplinks.size && size.name.toLowerCase() === this.deeplinks.size.toLowerCase();
          }),
          region: _.find(model.options.regions, (region) => {
            return this.deeplinks.region && region.slug.toLowerCase() === this.deeplinks.region.toLowerCase();
          })
        };

        if(model.options.sizes.length) {
          let firstCat = model.options.sizes.map((obj) => obj.size_category).sort(function (a, b) {
            return b.id - a.id;
          }).pop();
          let querySize = model.options.query_state.size;
          let tab = querySize && querySize.size_category.name ? querySize.size_category.name : firstCat.name;

          controller.setProperties({
            sizesTab: tab,
            selectedsizesTab: tab
          });
        }

        if(model.options.ssh_keys) {
          model.options.ssh_keys = model.options.ssh_keys.map((key) => {
            if(key.id) {
              this.store.push(this.store.normalize('ssh-key', key));
              return this.store.peekRecord('ssh-key', key.id);
            }
            return key;
          });
        }

        // persist server sent restriction
        if(model.options.regions) {
          model.options.regions = model.options.regions.map((region) => {
            if(region.restriction) {
              region.server_restriction = region.restriction;
            }
            return region;
          });
        }

        if(model.options.distributions) {
          model.options.distributions.forEach(function(distro) {
            if(distro.disabled_features && distro.disabled_features.indexOf('disallows_user_data') !== -1) {
              distro.disabled_features.push('metadata');
            }

            if(distro.images && distro.images.length) {
              distro.images.forEach(function(version) {
                if(version.disabled_features && version.disabled_features.indexOf('disallows_user_data') !== -1) {
                  version.disabled_features.push('metadata');
                }
              });
            }
          });
        }

        if(model.volumeSequenceNum) {
          controller.setProperties({
            firstVolumeRegion: model.options.firstStorageRegion
          });
          this._super(controller, {
            unattachedVolumes: model.options.unattachedVolumes,
            volumeSequenceNum: model.volumeSequenceNum
          });
        }

        model.options.sizes = this._formatSizes(model.options.sizes);
        controller.set('model', model.options);
        this._setInitialImage();
      }

      if(!imageType) {
        controller.set('imageTab', 'distributions');
      }
    }
  },

  resetProperties: function() {
    this.controller.send('resetState');
    if(this.dropletLimitReached) {
      this.dropletLimitReached = false;
    } else {
      this._setInitialImage();
    }
    this.optionsLoaded = false;
  }.on('deactivate'),

  actions: {
    updateModel: function(type, page) {
      let reqId = new Date();
      this.inFlight = reqId;

      if(page) {
        this.controller.set('paginationLoading', true);
      } else {
        page = 1;
        this.controller.set('loading', true);
      }

      this._getModel({type: type, page: page}).then((json) => {
        let images = this._parseImagesFromJson(json, type, page);
        this.controller.set(type, images);

        if(this.inFlight === reqId) {
          this.controller.set('loading', false);
          this.controller.set('paginationLoading', false);
        }
      });
    },
    sshKeyPaginate: function (page) {
      let reqId = new Date();
      this.inFlightSsh = reqId;

      this.store.query('sshKey', {
        page: page
      }).then((sshKeys) => {
        if(reqId === this.inFlightSsh) {
          this.controller.setProperties({
            'model.ssh_keys': sshKeys.toArray(),
            'model.meta.ssh_keys': sshKeys.get('meta'),
            'sshKeyPaginationLoading': false
          });
        }
      }, () => {
        this.controller.set('sshKeyPaginationLoading', false);
      });
    }
  }
});
