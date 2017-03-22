import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr(),
  token: DS.attr(),
  createdAt: DS.attr(),
  scopes: DS.attr(),
  expiresIn: DS.attr(),

  scopeRead: function () {
    return this.get('scopes').indexOf('read') !== -1;
  }.property('scopes'),

  scopeWrite: function () {
    return this.get('scopes').indexOf('write') !== -1;
  }.property('scopes')
});
