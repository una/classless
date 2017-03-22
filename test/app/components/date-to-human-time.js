/* globals moment: false */

import Ember from 'ember';
import _ from 'lodash/lodash';

const MS_IN_SECOND = 1000;
const SECONDS_IN_DAY = 86400;

export default Ember.Component.extend({
  tagName: '',

  justNow: false,

  getFormattedDate: function (shortDate) {
    if (shortDate) {
      return moment(this.get('date')).format('MMM D, YYYY');
    }
    return moment(this.get('date')).format('ddd, MMM D, YYYY [at] h:mm a');
  },

  humanTime: function () {
    if (this.get('justNow')) {
      return 'Just now';
    }

    let dateArg = this.get('date');
    // replace dashes for hyphens for UTC date strings
    // otherwise, Safari will not be able to parse the date
    if(dateArg && !_.isDate(dateArg) && dateArg.indexOf('UTC') !== -1) {
      dateArg = ('' + dateArg).replace(/-/g, '/');
    }
    let date = dateArg ? new Date(dateArg) : new Date();
    let diff = (((new Date()).getTime() - date.getTime()) / MS_IN_SECOND);
    let day_diff = Math.max(0, Math.floor(diff / SECONDS_IN_DAY));

    if (isNaN(day_diff)) {
      return 'Invalid date';
    }
    // fromNow(true) to remove past 'ago' string
    // @see initializers/moment-init.js
    return moment(this.get('date')).fromNow(true);
  }.property('date', 'justNow'),

  tooltipDate: function () {
    return this.getFormattedDate();
  }.property('date')

});
