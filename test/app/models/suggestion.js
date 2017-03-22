import DS from 'ember-data';

export default DS.Model.extend({
  articles: DS.hasMany('articles')
});
