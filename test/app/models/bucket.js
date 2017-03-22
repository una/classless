import DS from 'ember-data';
import ENV from '../config/environment';
import { objectStorageFetch } from '../utils/apiHelpers';
import { camelizeObject } from '../utils/normalizeObjects';

export default DS.Model.extend({
  name: DS.attr(),
  createdAt: DS.attr(),
  region: DS.attr(),
  key: DS.attr(),
  acl: DS.attr(),
  cors: DS.attr(),

  url: function () {
    return 'http://' + this.get('name') + '.' + ENV.APP.bucketLocation;
  }.property('name'),

  regenerateKey: function () {
    return objectStorageFetch('/keys', 'POST').then((obj) => {
      return this.set('key', camelizeObject(obj.key));
    });
  }

});
