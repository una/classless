import Ember from 'ember';
import {PropTypes} from 'ember-prop-types';
import DropletModel from '../../models/droplet';

/**
  Example Usage:

  ```
  {{security-groups/droplet-row-ip-address
    droplet="droplet"
  }}
  ```
 */
export default Ember.Component.extend({
  propTypes: {
      droplet: PropTypes.instanceOf(DropletModel).isRequired
  }
});
