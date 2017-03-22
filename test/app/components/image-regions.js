import Ember from 'ember';
import _ from 'lodash/lodash';

export default Ember.Component.extend({
  tagName: 'p',
  classNames: 'images__region',

  regionsAry: function() {
    let image = this.get('image'),
        regionSlug = image.get('region.slug'),
        hasRegions = image.get('regions.length'),
        regions = image.get('regions'),
        regionsAry = [];

    if(regionSlug) {
      regionsAry.push(regionSlug);
    }

    if(hasRegions) {
      regionsAry = regionsAry.concat(regions.map(function(aRegion) {
        return aRegion.get('slug');
      }));
    }

    return _.uniq(regionsAry).sort();
  }.property('image.region', 'image.regions', 'image.regions.length'),

  regionCount: function() {
    return this.get('regionsAry').length;
  }.property('regionsAry'),

  hasOneRegion: function() {
    return this.get('regionCount') === 1;
  }.property('regionCount'),

  regions: function() {
    return this.get('regionsAry').join(', ').toUpperCase();
  }.property('regionsAry')
});
