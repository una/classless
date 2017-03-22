import Ember from 'ember';
import AutoCompleteRoute from './autocomplete';

const DEFAULT_RECORD_TYPE = 'A';

export default AutoCompleteRoute.extend({
  autoCompletes: [{
    autoComplete: ['droplet', 'floatingIp']
  }, {
    autoCompleteForm: ['droplet', 'floatingIp']
  }, {
    autoCompleteAAAA: ['droplet']
  }, {
    autoCompleteFormAAAA: ['droplet']
  }],

  model: function(params) {
    return this.store.findRecord('domain', params.domain_id).then(this.autoCompleteModel.bind(this));
  },

  setupController: function (controller, model, transition) {
    controller.setProperties({
      isNewDomain: transition.queryParams.newDomain,
      recordTab: DEFAULT_RECORD_TYPE,
      record: Ember.Object.create({
        recordType: DEFAULT_RECORD_TYPE
      })
    });
    this._super(controller, model);
  },

  actions: {
    loading: function () {
      return true;
    }
  }
});
