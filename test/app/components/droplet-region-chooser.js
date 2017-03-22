import Ember from 'ember';
import _ from 'lodash/lodash';

export default Ember.Component.extend({
  _sortRegionsByGeographyAndDatacenters: function() {
    // group by geography
    let regions = _.groupBy(this.get('regions'), 'geography');

    // sort by number of datacenters in region
    return _.sortBy(regions, (obj) => {
      return -obj.length;
    });
  },

  sortedRegions: function() {
    let regions = this._sortRegionsByGeographyAndDatacenters();

    // move regions into a sorted array
    let sorted = [];
    regions.forEach((regionGroup) => {
      let regionName = (regionGroup[0].originalName || regionGroup[0].name) + '';
      sorted.push({
        name: regionName.replace(/[\d]/g, ''),
        slug: regionGroup[0].geography,
        regions: _.sortBy(regionGroup, 'name').map(function (region, i) {
          // since we are mutating name, let's store it in originalName and use that
          // next time we need to reference it
          let name = (region.originalName || region.name) + '';
          region.originalName = name;
          Ember.set(region, 'name', name.replace(/[^\d]+/, '') || (i + 1));
          return region;
        }),
        selected: !!(_.find(regionGroup, function(region) {
          return region.selected;
        }))
      });
    });

    return sorted;
  }.property('regions'),

  updateSelected: function() {
    let sortedRegions = this.get('sortedRegions'),
        regions = this._sortRegionsByGeographyAndDatacenters();

    regions.forEach((regionGroup) => {
      Ember.set(_.find(sortedRegions, {slug: regionGroup[0].geography}), 'selected', !!(_.find(regionGroup, function(region) {
        return region.selected;
      })));
    });
  }.observes('regions.@each.selected'),

  actions: {
    onSelect: function(region) {
      this.$('.selected').removeClass('selected');
      this.$('.region-' + region.id).addClass('selected').closest('.aurora-region-chooser').addClass('selected');

      if(this.get('onSelect')) {
        this.sendAction('onSelect', region);
      }
    }
  }
});
