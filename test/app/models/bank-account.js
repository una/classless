import DS from 'ember-data';
import config from '../config/environment';
import {post, del} from '../utils/apiHelpers';

const apiNS = config['api-namespace'];

export default DS.Model.extend({
  name: DS.attr(),
  lastFour: DS.attr(),
  country: DS.attr(),
  isVerified: DS.attr(),
  routingNumber: DS.attr(),
  accountNumber: DS.attr(),

  verify: function (options) {
    return post(`/${apiNS}/billing/bank_account/verify`, {
      bank_account_verification: options
    });
  },

  delete: function () {
    return del(`/${apiNS}/billing/bank_account`);
  }
});
