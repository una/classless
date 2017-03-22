import Ember from 'ember';
import App from '../../app';
import ENV from '../../config/environment';
import { get } from '../../utils/apiHelpers';

export default Ember.Route.extend({
  titleToken: 'Droplets',
  queryParams: {
    query: {
      refreshModel: true
    },
    sort: {
      refreshModel: true
    },
    sort_direction: {
      refreshModel: true
    },
    page: {
      refreshModel: true
    }
  },

  beforeModel: function () {
    if (!App.User.get('isOnboarded')) {
      this.transitionTo('welcome');
    }
  },

  model: function(params) {
    this.error = false;
    params.include_failed = true;
    this.currentParams = params;

    let hash = {
      droplets: this.store.query('droplet', params).then(null, () => {
        this.error = true;
        return Ember.A();
      })
    };

    if(this.initialModelLoad && this.controllerFor('application').get('dropletCreateEventsDisabled')) {
      // we may have been redirected here from droplet create because create
      // events are disabled
      hash.status = get('/' + ENV['api-namespace'] + '/compute_status').then((status) => {
        return status.json();
      });
    }

    return Ember.RSVP.hash(hash);
  },

  initRoute: function() {
    this.initialModelLoad = true;
  }.on('deactivate', 'init'), //deactivate not activate, so we can reset before actions/loading fires next

  setupController: function (controller, model) {
    if(model.status) {
      controller.set('dropletCreateEventsDisabled', !model.status.enable_create);
    }

    model.droplets.forEach(function (droplet) {
      droplet.set('isCreating', false);
    });

    controller.set('model', model.droplets);
    if(!controller.get('typing')) {
      controller.set('searchQuery', this.currentParams.query);
    }
    this.controller = controller;
  },

  onDeactivate: function() {
    this.controller.cancelAllPollingEvents();
  }.on('deactivate'),

  actions: {
    loading: function() {
      //show loading substate intially, all other loading states are handled by spinners
      return this.initialModelLoad;
    },

    didTransition: function () {
      this.initialModelLoad = false;
      //let the controller know what happened with the latest model load
      this.controller.send(this.error ? 'modelError' : 'modelLoaded');
    }
  }
});
