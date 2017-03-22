import Ember from 'ember';
import {getDropletName, getInitialDropletName} from '../utils/handleDropletNames';
import { VALID_NAME_REGEX } from '../constants';

export default Ember.Component.extend({
  hostNames: [],
  validHostNameRegex: VALID_NAME_REGEX,

  setup: function() {
    Ember.run.scheduleOnce('afterRender', this, this.setDefaultHostName);
  }.on('didInsertElement'),

  updateHostNames: function(dontRender) {
    dontRender = dontRender === true;

    let count = parseInt(this.get('count'), 10);

    if(count) {
      let arr = this.get('hostNames').slice(0, count);
      let name;

      for(let i = 1; i < count; i++) {
        if(!arr[i] || arr[i].generated) {
          name = getDropletName(arr[0].name, i + 1);
          if(dontRender) {
            this.$('input:eq(' + i + ')').val(name);
          } else {
            arr[i] = {
              name: name,
              generated: true
            };
          }
        }
      }

      if(!dontRender) {
        this.set('hostNames', arr);
        Ember.run.next(() => {
          this.sendAction('onHostNamesChangeAction', this.usableHostNames());
        });
      }
    }
  }.observes('count'),

  usableHostNames: function () {
    let inputs = [],
        isValid = true,
        $input = this.$('input');

    if($input) {
      $input.each(function(i, input) {
        if(!input.checkValidity()) {
          isValid = false;
        }

        inputs.push(input.value);
      });
    }

    if(!isValid) {
      return null;
    }

    return inputs;
  },

  setDefaultHostName: function() {
    let hostNames = this.get('hostNames');
    if(hostNames.length && !hostNames[0].generated) {
      return;
    }

    let image = this.get('image') ? (this.get('image.iconName') || this.get('image.name')) : '',
        region = this.get('region') ? this.get('region.slug') : '',
        size = this.get('size') ? this.get('size.name').replace(/\s/, '') : '';

    if(!new RegExp(this.get('validHostNameRegex')).test(image)) {
      image = image.replace(/\W+/g,'')
        .replace(/_/g,'-');
    }

    hostNames[0] = {
      name: getInitialDropletName(image, size, region),
      generated: true
    };

    this.set('hostNames', hostNames);

    this.firstInput = this.$('input:first');
    this.firstInput.val(hostNames[0].name);
    this.updateHostNames();
    this.sendAction('onHostNamesChangeAction', this.usableHostNames());

  }.observes('image', 'region', 'size'),

  actions: {
    handleFirstHostNameInput: function(value, isValid) {
      let hostNames = this.get('hostNames');
      hostNames[0] = {
        name: value,
        generated: false
      };
      this.set('hostNames', hostNames);
      this.updateHostNames(true);
      this.sendAction('onHostNamesChangeAction', isValid ? this.usableHostNames() : null);

      if(hostNames.length > 1) {
        this.$('input:gt(0)').trigger('validate');
      }
    },
    handleHostNameInput: function(value, isValid, index) {
      let hostNames = this.get('hostNames');
      hostNames[index] = {
        name: value,
        generated: false
      };
      this.set('hostNames', hostNames);
      this.sendAction('onHostNamesChangeAction', isValid ? this.usableHostNames() : null);
    }
  }
});
