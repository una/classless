import ENV from '../config/environment';
import { get } from '../utils/apiHelpers';
import _ from 'lodash/lodash';
import AutoCompleteRoute from '../routes/autocomplete';

export default AutoCompleteRoute.extend({
  params: {},

  _doQuery: function(region, type, params) {
    this.params[type] = _.merge({
      per_page: 9,
      sort: 'created_at',
      sort_direction: 'desc'
    }, params || {});
    if(region) {
      this.params[type].region_slug = region;
    }
    return this.store.query(type, this.params[type]);
  },
  getUnattachedVolumes: function(region=this.defaultRegionSlug) {
    return this._doQuery(region, 'volume', { only_unattached: true });
  },
  getVolumeSnapshots: function(region=this.defaultRegionSlug) {
    return this._doQuery(region, 'volumeSnapshot');
  },
  getSequenceNumber: function (region=this.defaultRegionSlug) {
    let suffix = region ? `?region_slug=${region}` : '';
    return get(`/${ENV['api-namespace']}/volumes/valid_name${suffix}`).then((resp) => {
      return resp.json();
    }, function () {
      return {};
    });
  },
  setupController: function(controller, model) {
    controller.setProperties({
      unattachedVolumes: model.unattachedVolumes,
      volumeSnapshots: model.volumeSnapshots,
      unattachedVolumesFirstPage: model.unattachedVolumes,
      volumeSequenceNum: model.volumeSequenceNum
    });
    if(this.hasDropletAutoComplete) {
      this._super(controller, model);
    }
  },

  _paginate: function (page, type, identifier) {
    let reqId = new Date();
    this.inFlightVolumes = reqId;

    let params = this.params[type] || {};
    params.page = page;

    if(!this.get('dontResetSelectedVolumes')) {
      this.controller.set('selectedVolume', null);
    }

    let loadingKey = identifier + 'PaginationLoading';
    this.controller.set(loadingKey, true);

    return this.store.query(type, params).then((model) => {
      if(reqId === this.inFlightVolumes) {
        this.controller.set(identifier, model);
        this.controller.set(loadingKey, false);
        return model;
      }
    }, () => {
      this.controller.set(loadingKey, false);
    });
  },

  actions: {
    unattachedVolumesPaginate: function (page) {
      this._paginate(page, 'volume', 'unattachedVolumes').then((volumes) => {
        if(page === 1) {
          this.controller.set('unattachedVolumesFirstPage', volumes);
        }
      });
    },
    volumeSnapshotsPaginate: function (page) {
      this._paginate(page, 'volumeSnapshot', 'volumeSnapshots');
    }
  }
});
