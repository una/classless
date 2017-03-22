import AutoCompleteController from '../../../controllers/autocomplete';
import App from '../../../app';
import _ from 'lodash/lodash';
import Ember from 'ember';

export default AutoCompleteController.extend({
  trackPageName: 'Networking Floating IPs Datacenter',
  floatingIpController: Ember.inject.controller('networking.floatingIp'),

  filteredRegions: function() {
    let regions = this.get('model');
    let searchQuery = this.get('searchQuery');

    if(searchQuery) {
      searchQuery = searchQuery.toLowerCase();
      return _.filter(regions, function(region) {
        let name = region.get('name');
        let slug = region.get('slug');

        if(name.toLowerCase().indexOf(searchQuery) > -1 || slug.toLowerCase().indexOf(searchQuery) > -1) {
          return region;
        }
      });
    }

    return regions;
  }.property('searchQuery'),

  resetProperties: function() {
    this.setProperties({
      searchQuery: '',
      selectedRegion: null
    });
  },

  actions: {
    onSubmit: function() {
      let floatingIp = this.store.createRecord('floatingIp');

      this.set('isSubmitting', true);

      floatingIp.allocateForRegion(this.get('selectedRegion.slug')).then(() => {
        App.NotificationsManager.show('A floating IP was successfully reserved.', 'notice');
        this.get('floatingIpController').send('reloadFloatingIps');
        this.send('onModalHide');
      }).catch((err) => {
        this.errorHandler(err, 'Allocate Floating IP');
      }).finally(() => {
        this.set('isSubmitting', false);
      });
    },
    onDatacenterSelect: function(selected) {
      let region = null;
      if(selected) {
        region = selected;
      }
      this.set('selectedRegion', region);
    },
    onDatacenterUnselect: function() {
      this.set('selectedRegion', null);
    },
    onDatacenterInput: function(input) {
      this.set('searchQuery', input);
    },
    onModalHide: function() {
      this.transitionToRoute('networking.floatingIp');
    }
  }
});