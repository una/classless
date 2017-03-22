import AutoCompleteRoute from '../../../routes/autocomplete';

export default AutoCompleteRoute.extend({
  titleToken: 'Datacenter',
  autoCompletes: [{
    autoComplete: ['region']
  }],

  renderTemplate: function () {
    this.render('networking.floatingIp.datacenter', {
      into: 'application',
      outlet: 'modal',
      controller: 'networking.floatingIp.datacenter'
    });
  },

  beforeModel: function() {
    let model = this.modelFor('networking.floatingIp');

    if(model.floatingIps.get('length') >= model.resourceLimits.resource_limits.floating_ip_limit) {
      this.transitionTo('networking.floatingIp');
    }
  },

  model: function(params) {
    params = params || {};

    return this.store.query('region', params).then((model) => {
      return this.sortRegions(model);
    }).then((model) => {
      return this.autoCompleteModel(model, {
        region: model
      }, {
        region: params
      });
    });
  },

  setupController: function(controller, model) {
    this._super(controller, model);
  },

  sortRegions: function(regions) {
    return regions.sortBy('slug');
  },

  onDeactivate: function() {
    this.controller.resetProperties();
  }.on('deactivate')
});