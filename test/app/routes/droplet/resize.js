import Ember from 'ember';

export default Ember.Route.extend({

  model: function() {
    let droplet = this.modelFor('droplet');
    return Ember.RSVP.hash({
      droplet: droplet,
      resizeSizes: droplet.getSizesForResize(),
      expandSizes: droplet.getSizesForExpand()
    });
  },


  setupController: function(controller, model) {
    let curSizeId = model.droplet.get('sizeId');
    function prepareSize(size) {
      if(size.id === curSizeId && ! size.overrideId) {
        size.error = 'Current Droplet Size';
        size.isCurrent = true;
        size.available = false;
      } else if(size.disk < model.droplet.get('disk')) {
        size.error = 'This size is not available because it has a smaller disk';
        size.available = false;
      }

      return size;
    }

    let currentSizeCategory = '';
    function sameCategory(size) {
      return size.sizeCategory.name === currentSizeCategory;
    }

    let currentSize = model.expandSizes.filter(function (size, i) {
      let isSameSize = size.id === curSizeId;
      let isSameDisk = false;
      if(isSameSize) {
        isSameDisk = size.disk === model.droplet.get('disk');
        currentSizeCategory = size.sizeCategory.name;
        //if disk sizes are different, the droplet has been resized
        if(!isSameDisk) {
          //keep track of this new size so that we can show it in the UI and set the size with matching id to available
          model.droplet.size = JSON.parse(JSON.stringify(size));
          model.droplet.size.disk = model.droplet.get('disk');
          model.droplet.size.insertIndex = i;
          size.available = !size.error;
          size.overrideId = true;
        }
      }
      return isSameSize && isSameDisk;
    })[0];

    //if the current droplet size isn't in the list of sizes, it has been resized, so add its current size to the list
    if(!currentSize && model.droplet.size) {
      model.expandSizes.splice(model.droplet.size.insertIndex, 0, model.droplet.size);
    }
    model.expandSizes = model.expandSizes.filter(sameCategory).map(prepareSize);
    model.resizeSizes = model.resizeSizes.filter(sameCategory).map(prepareSize).map(function (size) {
      size.disk = model.droplet.get('disk');
      return size;
    });

    this.controller = controller;

    controller.setProperties({
      model: model,
      isResizing: false,
      sizePlan: currentSizeCategory.toLowerCase(),
      unloaded: false,
      selectedSize: null
    });
  },

  onDeactivate: function () {
    this.controller.send('pageUnloaded');
  }.on('deactivate'),

  actions: {
    refreshModel: function () {
      this.model().then((model) => {
        this.setupController(this.controller, model);
        this.controller.send('afterModelRefresh');
      });
    }
  }
});
