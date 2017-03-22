import Ember from 'ember';
import AutoCompleteRoute from '../../routes/autocomplete';

export default AutoCompleteRoute.extend({
  autoCompletes: [{
    autoComplete: ['kernel']
  }],

  model: function(params) {
    params = params || {};

    let droplet = this.modelFor('droplet');
    params.dropletId = droplet.get('id');

    return Ember.RSVP.hash({
      droplet: droplet,
      kernels: this.store.query('kernel', params)
    }).then((model) => {
      return this.autoCompleteModel(model, {'kernel': model.kernels}, {'kernel' : {dropletId: droplet.get('id') }});
    });
  },

  setupController: function(controller, models) {
    controller.setProperties({
      droplet: models.droplet,
      kernels: models.kernels
    });

    this._super(controller, models);
  }
});