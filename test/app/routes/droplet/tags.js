import Ember from 'ember';

export default Ember.Route.extend({
  model: function(params) {
    params = params || {};

    let droplet = this.modelFor('droplet');
    params.droplet_id = droplet.get('id');

    return Ember.RSVP.hash({
      droplet: droplet,
      tags: this.store.query('tag', params).then((tags) => {
        droplet.set('tags', tags);
        return tags;
      })
    });
  },

  afterModel: function(routeModel) {
    this.controllerFor('droplet.tags').set('pendingUpdatedTags', routeModel.tags.slice());
  }
});
