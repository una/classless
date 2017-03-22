import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['aurora-region-chooser'],
  classNameBindings:  ['region.selected', 'region.slug', 'noOptions', 'oneOption'],

  availableRegions: function () {
    //copy the arr as sort modifies the array by reference
    let regionsCopy = this.get('region.regions').concat();
    return regionsCopy.sort(function (a, b) {
      return (!!b.is_default) - (!!a.is_default);
    }).filter(function (region) {
      return !region.restriction;
    });
  }.property('region.regions', 'region.regions.@each.restriction'),

  defaultRegion: function () {
    return this.get('availableRegions')[0];
  }.property('availableRegions'),

  noOptions: function () {
    return !this.get('defaultRegion');
  }.property('defaultRegion'),

  noOptionsRestriction: function () {
    if(this.get('noOptions')) {
      let regions = this.get('region.regions');
      let firstRestriction = regions[0].restriction;
      let allHaveTheSameRestriction = true;
      for(let i = 1; allHaveTheSameRestriction && i < regions.length; i++) {
        allHaveTheSameRestriction = firstRestriction === regions[i].restriction;
      }
      if(allHaveTheSameRestriction) {
        return firstRestriction;
      }
    }
    return false;
  }.property('noOptions', 'region.regions', 'region.regions.@each.restriction'),

  oneOption: function () {
    return this.get('availableRegions').length === 1;
  }.property('availableRegions'),

  actions: {
    select: function(region) {
      this.sendAction('action', region);
    },
    selectRegion: function () {
      let region = this.get('defaultRegion');
      if(region) {
        this.sendAction('action', region);
      }
    }
  }
});
