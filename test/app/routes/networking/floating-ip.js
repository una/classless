import Ember from 'ember';
import AutoCompleteRoute from '../../routes/autocomplete';
import App from '../../app';
import {camelizeObject} from '../../utils/normalizeObjects';

export default AutoCompleteRoute.extend({
  titleToken: 'Floating IPs',
  queryParams: {
    sort: {
      refreshModel: true
    },
    sort_direction: {
      refreshModel: true
    },
    page: {
      refreshModel: true
    },
    /* deeplink from droplet show when enabling floating ip */
    'float-dropletIp': {
      refreshModel: true
    }
  },

  initRoute: function() {
    this.set('isInitialLoad', !this.showLoader);
  }.on('deactivate', 'init'),

  queryFloatingIps: function(params) {
    return this.store.query('floatingIp', params);
  },

  queryDroplets: function(params) {
    return this.store.query('droplet', params).then(null, () => {
      return Ember.A();
    });
  },

  getModel: function(params) {
    let dropletIp = params['float-dropletIp'];

    let hash = {
      floatingIps: this.queryFloatingIps.call(this, params)
    };

    if(this.get('isInitialLoad')) {
      if(dropletIp) {
        hash.assignedDroplet = this.store.query('droplet', {query: dropletIp}).then((droplets) => {
          if(droplets) {
            let ary = droplets.toArray();
            if(ary.length) {
              return ary[0];
            }
          }
          return null;
        });
      }

      hash.droplets = this.queryDroplets.call(this, params);
      hash.resourceLimits = App.User.fetchResourceLimits();

      return Ember.RSVP.hash(hash).then(this.autoCompleteModel.bind(this));
    } else {
      return Ember.RSVP.hash(hash);
    }
  },

  model: function(params, transition) {
    this.showLoader = !!transition.queryParams.pendingSave;
    if(transition.queryParams.pendingSave) {
      return transition.queryParams.pendingSave.then(this.getModel.bind(this, params));
    }
    return this.getModel(params);
  },

  setupController: function(controller, models) {
    if(models.droplets) {
      controller.set('droplets', models.droplets);
    }

    if(models.floatingIps) {
      controller.set('floatingIps', models.floatingIps);
    }

    if(this.get('isInitialLoad')) {
      this.set('isInitialLoad', false);
      controller.setProperties({
        resourceLimits: camelizeObject(models.resourceLimits).resourceLimits
      });

      this._super(controller, models);
    }

    if(models.assignedDroplet) {
      controller.set('assignedDroplet', models.assignedDroplet);
    }

    this.controller = controller;
  },

  onDeactivate: function() {
    this.controller.cancelAllPollingEvents();
  }.on('deactivate'),

  actions: {
    loading: function() {
      return this.get('isInitialLoad') || this.showLoader;
    },
    didTransition: function () {
      this.controller.send('modelLoaded');
      this.showLoader = false;
    },
    reloadFloatingIps: function(params) {
      if(!params) {
        params = {
          page: 1,
          sort: 'ip',
          sort_direction: 'desc'
        };
      }

      this.queryFloatingIps(params).then((model) => {
        this.controller.set('floatingIps', model);
      });
    },
    queryDroplets: function(params) {
      let reqId = new Date();
      this.inFlight = reqId;

      this.queryDroplets({
        region: params.region || '',
        query: params.query || '',
        page: params.page || 1,
        sort: 'ip',
        sort_direction: 'desc'
      }).then((model) => {
        if(this.inFlight !== reqId) {
          return;
        }
        this.controller.set('dropletsRegion', model);
        this.controller.send('queryDropletsLoaded');
      }, function (err) {
        this.controller.set('dropletsRegion', []);
        this.controller.send('queryDropletsError', err);
      });
    }
  }
});
