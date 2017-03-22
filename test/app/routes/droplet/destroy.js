import Ember from 'ember';
import AutoCompleteRoute from '../../routes/autocomplete';
import _ from 'lodash/lodash';

export default AutoCompleteRoute.extend({
  autoCompletes: [{
    autoComplete: ['image']
  }],

  model: function() {
    return Ember.RSVP.hash({
      droplet: this.modelFor('droplet')
    }).then((model) => {
      return this.autoCompleteModel(model, null, {
        'image': {
          dropletId: model.droplet.get('id'),
          distros: true
        }
      });
    });
  },

  setupController: function(controller, model) {
    let droplet = model.droplet;
    controller.set('droplet', droplet);
    model._ac_model.autoComplete = this.sortDistros(model._ac_model.autoComplete, droplet.get('image.id'));
    this._super(controller, model);
  },

  // if original image id is in the list of distros, put it first in the list
  sortDistros: function(distros, imageId) {
    let ary = distros.toArray();
    let index = _.findIndex(ary, function(distro) {
      return distro.id === imageId;
    });

    // move original image to be first in the list if found
    if(index > 0) {
      let originalDistro = ary.splice(index, 1)[0];
      ary.unshift(originalDistro);
    }

    return ary;
  }
});