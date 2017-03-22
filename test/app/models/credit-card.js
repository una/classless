import DS from 'ember-data';
import config from '../config/environment';
import {post, del} from '../utils/apiHelpers';

const apiNS = config['api-namespace'];

export default DS.Model.extend({
  name: DS.attr(),
  type: DS.attr(),
  firstName: DS.attr(),
  lastName: DS.attr(),
  lastFour: DS.attr(),
  createdAt: DS.attr('date'),
  expirationDate: DS.attr(),

  billingName: function() {
    return [this.get('firstName'), this.get('lastName')].join(' ');
  }.property('firstName', 'lastName'),

  knownExpirationDate: function() {
    return this.get('expirationDate') !== 'Unknown';
  }.property('expirationDate'),

  expirationMonthAndYear: function() {
    let expirationDate = this.get('expirationDate');
    let obj = {month: null, year: null};
    let parts = expirationDate && expirationDate.split('/');

    if(parts && parts.length > 1) {
      obj.month = parts[0];
      obj.year = parts[1];

      // zero pad month
      if(obj.month.length < 2) { // eslint-disable-line no-magic-numbers
        obj.month = '0' + obj.month;
      }
    }

    return obj;
  }.property('expirationDate'),

  formattedExpirationDate: function() {
    let dateParts = this.get('expirationMonthAndYear');
    if (!this.get('knownExpirationDate')) {
      return null;
    }

    if(dateParts.month) {
      let month = window.parseInt(dateParts.month, 0);
      let year = dateParts.year;
      let date = new Date();

      if(month) { // months are 0-indexed in dates
        month -= 1;
      }

      date.setMonth(month);
      date.setFullYear(year);
      date.setUTCHours(0, 0, 0, 0); // set to midnight UTC time

      return date;
    }

    return null;
  }.property('expirationDate'),

  save: function (meta) {
    return post(`/${apiNS}/billing/credit_cards`, meta);
  },

  destroyRecord: function() {
    return del(`/${apiNS}/billing/credit_cards/${this.get('id')}`);
  }
});
