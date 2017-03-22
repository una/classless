import Ember from 'ember';
import BaseController from '../base';
import TypesHelper from '../../utils/types';
import { 
  MAX_FIREWALL_TAGS,
  MAX_FIREWALL_DROPLETS
} from 'aurora/constants';

export default BaseController.extend({
  targetSearchResults: Ember.computed.union('tagSearchResults', 'dropletSearchResults'),

  resetSearchResults: function() {
    this.set('tagSearchResults', []);
    this.set('dropletSearchResults', []);
  }.on('init'),

  hasMaxDropletsOrTags: Ember.computed.or('hasMaxTags', 'hasMaxDroplets'),
  hasMaxDropletsAndTags: Ember.computed.and('hasMaxTags', 'hasMaxDroplets'),

  targetsMessage: Ember.computed('hasMaxTags', 'hasMaxDroplets', 'hasMaxDropletsAndTags', function() {
    let hasMaxTags = this.get('hasMaxTags');
    let hasMaxDroplets = this.get('hasMaxDroplets');
    let hasMaxDropletsAndTags = this.get('hasMaxDropletsAndTags');

    if (hasMaxDropletsAndTags) {
        return `You've reached the ${MAX_FIREWALL_DROPLETS} droplet and ${MAX_FIREWALL_TAGS} tag limit for firewalls.`;
    } else if (hasMaxTags) {
        return `You've reached the ${MAX_FIREWALL_TAGS} tag limit for firewalls.`;
    } else if (hasMaxDroplets) {
      return `You've reached the ${MAX_FIREWALL_DROPLETS} droplet limit for firewalls.`
    } else {
      return '';
    }
  }),

  dropletsAndTagsForUpdate: function(dropletsAndTags) {
    const droplets = dropletsAndTags.filter((target) =>
      TypesHelper.isDroplet(target)
    );

    const tags = dropletsAndTags.filter((target) =>
      TypesHelper.isTag(target)
    ).map((tag) => {
      if (!this.store.hasRecordForId('securityGroupTag', tag.get('name'))) {
        this.store.createRecord('securityGroupTag', {
          id: tag.get('name'),
          name: tag.get('name')
        });
      }
      return this.store.peekRecord('securityGroupTag', tag.get('name'));
    });

    return {droplets: droplets, tags: tags};
  },

  actions: {
    queryTargets: function(query) {
      if (!this.get('hasMaxDroplets')) {
        this.store.query('droplet', { query: query }).then((droplets) => {
          this.set('dropletSearchResults', droplets);
        });
      } else {
        this.set('dropletSearchResults', []);
      }

      if (!this.get('hasMaxTags')) {
        this.store.query('tag', { query: query }).then((tags) => {
          this.set('tagSearchResults', tags);
        });
      } else {
        this.set('tagSearchResults', []);
      }
    }
  }
});
