import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr(),
  distributionName: DS.attr(),

  distributionNameClass: function () {
    let distroName = this.get('distributionName');
    return distroName ? distroName.replace(/\s/g, '-').toLowerCase() : '';
  }.property('distributionName')
});
