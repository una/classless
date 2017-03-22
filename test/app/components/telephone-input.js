import Ember from 'ember';
import {PropTypes} from 'ember-prop-types';

/**
  Example Usage:

  ```
  {{telephone-input
    number="123456789"
    selectedCountryData=selectedCountryData
  }}
  ```
 */
export default Ember.Component.extend({
  propTypes: {
    number: PropTypes.string
  },

  classNames: 'telephone-input',

  geoIpLookupFunc: function(callback) {
    Ember.$.getJSON('//freegeoip.net/json/')
     .always(function(resp) {
       if (!resp || !resp.country_code) {
         callback('');
       } else {
         callback(resp.country_code);
       }
     });
  }
});
