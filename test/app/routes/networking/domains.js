import Ember from 'ember';
import IndexPage from '../../mixins/routes/index-page';

const DOMAINS_PER_PAGE = 50;

export default Ember.Route.extend(IndexPage,{
  titleToken: 'Domains',
  queryParams: {
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

  getModel: function(params = {}) {
    params.per_page = DOMAINS_PER_PAGE;
    return this.store.query('domain', params);
  },

  model: function (params, transition) {
    this.droplet = null;
    if(transition.state.queryParams.dropletId) {
      this.droplet = this.store.findRecord('droplet', transition.state.queryParams.dropletId, { backgroundReload: false });
    }

    return this._super(params, transition);
  },

  setupController: function(controller, model) {
    this.isInitialLoad = false;
    controller.setProperties({
      model: model,
      droplet: this.droplet
    });
  }

});
