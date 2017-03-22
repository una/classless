import Ember from 'ember';
import { VALID_NAME_REGEX } from '../../constants';

export default Ember.Component.extend({
  isEditMode: false,
  validNameRegex: VALID_NAME_REGEX,

  init: function() {
    this._super(...arguments);

    this.validateName = this._validateName.bind(this);
    this.setNameErrorMessage = this._setNameErrorMessage.bind(this);
  },

  // Determine whether the name is a duplicate. Checking for blank is already
  // handled by `required=true`.
  _validateName: function(name) {
    if (!name) {
      this.set('nameError', 'Name cannot be blank');
      return false;
    }

    if (!name.match(this.get('validNameRegex'))) {
      this.set('nameError', 'Can only contain alphanumeric characters, dashes, and periods');
      return false;
    }

    const lbs = this.get('loadBalancers');

    const dupe = lbs.find((lb) =>
      name && lb.get('name') === name && !lb.get('isDeleted')
    );

    this.set('nameError', dupe ? 'Name must be unique' : null);
    return !dupe;
  },

  _setNameErrorMessage: function() {
    return this.get('nameError');
  }
});
