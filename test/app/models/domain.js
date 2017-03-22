import DS from 'ember-data';
import domainsHelper from '../utils/domains';
import ENV from '../config/environment';
import { post } from '../utils/apiHelpers';

export default DS.Model.extend({
  name: DS.attr(),
  ttl: DS.attr(),
  zoneFile: DS.attr(),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),
  ipAddress: DS.attr(),
  domainRecords: DS.hasMany('domain-record'),
  oldId: DS.attr(),
  directsTo: DS.attr(),
  droplet: DS.belongsTo('droplet'),
  floatingIp: DS.belongsTo('floating-ip'),
  recordStats: DS.attr(),

  recordString: function () {
    return domainsHelper.concatRecords(this.get('recordStats'));
  }.property('recordStats'),

  directsToResource: function () {
    if(this.get('droplet.content') || this.get('floatingIp.content')){
      return this.get('droplet.content') || this.get('floatingIp.content');
    } else {
      return false;
    }
  }.property('directsTo'),

  addMxRecords: function(type) {
    let uri = `/${ENV['api-namespace']}/domains/${this.get('oldId')}/add_mx_records`;
    return post(uri, {
      type: type
    });
  }

});
