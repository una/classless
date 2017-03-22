import DS from 'ember-data';

export default DS.Model.extend({
  fullName: DS.attr(),
  isAdmin: DS.attr('boolean', {default: false}),
  gravatarUrl: DS.attr('string', { defaultValue: '' })
});
