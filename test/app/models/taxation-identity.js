import DS from 'ember-data';
import ENV from '../config/environment';
import {put, del} from '../utils/apiHelpers';

export default DS.Model.extend({
  taxationId: DS.attr(),

  update: function() {
    return put(`/${ENV['api-namespace']}/billing/taxation_identity`, {
      taxation_identity: {
        taxation_id: this.get('taxationId')
      }
    });
  },

  delete: function() {
    return del(`/${ENV['api-namespace']}/billing/taxation_identity`);
  }
});
