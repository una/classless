import Ember from 'ember';
import _ from 'lodash/lodash';

const BYTES_IN_KB = 1024;

export default Ember.Component.extend({
  tagName: '',

  size: function() {
    let num = this.numBytes();
    let unit = 'B';
    let units = ['TB', 'GB', 'MB', 'KB'];

    while(units.length && num >= BYTES_IN_KB) {
      num = num / BYTES_IN_KB;
      unit = units.pop();
    }

    let precision = this.get('precision');
    if(_.isUndefined(precision)) {
      precision = 2;
    }
    if(window.isNaN(num)) {
      num = 0;
    }
    if(!num && !this.get('showZero')) {
      return '&mdash;';
    }
    if(precision) {
      num = num.toFixed(precision).toString();
      let endsInZeroOrDotZero = /(\.|\.\d*?0)$/;
      while(num.match(endsInZeroOrDotZero)) {
        num = num.slice(0,-1);
      }
    } else {
      num = Math.round(num);
    }

    return num + ' ' + unit;
  }.property('b', 'kb', 'mb', 'gb'),

  numBytes: function () {
    return this.get('b') ||
           this.get('kb') * BYTES_IN_KB ||
           this.get('mb') * BYTES_IN_KB * BYTES_IN_KB ||
           this.get('gb') * BYTES_IN_KB * BYTES_IN_KB * BYTES_IN_KB;
  }
});
