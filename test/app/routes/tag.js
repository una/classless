import Ember from 'ember';
import DropletsRoute from '../routes/droplets/index';

export default DropletsRoute.extend({
  titleToken: 'Tag',

  model: function(params) {
    let controller = this.controllerFor('tag');
    controller.set('tagName', params.tag_name);

    this.error = false;
    this.currentParams = params;

    let hash = {
      droplets: this.store.query('droplet', params).then(null, () => {
        this.error = true;
        return Ember.A();
      })
    };

    return Ember.RSVP.hash(hash);
  }
});
