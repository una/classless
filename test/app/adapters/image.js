import SearchableRestAdapter from '../adapters/searchable';
import ENV from '../config/environment';
import _ from 'lodash/lodash';

export default SearchableRestAdapter.extend({
  dropletId: null,
  ajax: function(url, method, hash) {
    if(method === 'GET') {
      // used on droplet show destroy
      // specify endpoint for searching images_available_for_rebuild
      let dropletId = this.get('dropletId');
      let endpoint = this.get('endpoint');
      if(dropletId && endpoint) {
        url = [ENV['api-host'],
               ENV['api-namespace'],
               'droplets',
               dropletId,
               endpoint
              ].join('/');
      }
    }

    //dont let these hang around in the adapter
    this.setProperties({
      dropletId: null,
      endpoint: null
    });

    return this._super(url, method, hash);
  },

  query: function(store, type, query) {
    let url = ENV['api-host'] + '/' + ENV['api-namespace'];

    if (! _.isUndefined(query.dropletId)) {
      url += /droplets/ + query.dropletId;

      // used on droplet show destroy
      // to get a list of available images to rebuild from
      if(query.distros) {
        this.setProperties({
          dropletId: query.dropletId,
          endpoint: 'images_available_for_rebuild'
        });
      }
    } else {
      url += '/images';
    }
    if (query.type === 'snapshot') {
      url += '/snapshots';
    } else if (query.type === 'backup') {
      url += '/backups';
    }

    // delete type since we don't need that in the query string
    delete query.type;
    delete query.dropletId;
    delete query.distros;

    return this._ajaxWithCSRF(url, query);
  },

  urlForCreateRecord: function(modelName, image) {
    let url = this._buildURL(modelName);
    if (image.record.get('isSnapshot')) {
      return url + '/snapshots';
    }

    return url;
  }
});
