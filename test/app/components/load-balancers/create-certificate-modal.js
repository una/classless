import Ember from 'ember';
import { VALID_NAME_REGEX } from '../../constants';
import App from '../../app';

export default Ember.Component.extend({
  store: Ember.inject.service(),

  name: null,
  leafCertificate: null,
  privateKey: null,
  certificateChain: null,

  isSubmitting: false,

  validNameRegex: VALID_NAME_REGEX,

  init: function() {
    this.validateName = this._validateName.bind(this);
    this.setNameErrorMessage = this._setNameErrorMessage.bind(this);

    this._super();
  },

  _validateName: function(name) {
    if (!name) {
      this.set('nameError', 'Name cannot be blank');
      return false;
    }

    if (!name.match(this.get('validNameRegex'))) {
      this.set(
        'nameError',
        'Can only contain alphanumeric characters, dashes, and periods'
      );
      return false;
    }

    const dupe = this.get('allCertificates').find((certificate) =>
      name && certificate.get('name') === name && !certificate.get('isDeleted')
    );

    this.set('nameError', dupe ? 'Name must be unique' : null);
    return !dupe;
  },

  _setNameErrorMessage: function() {
    return this.get('nameError');
  },

  actions: {
    onHide: function() {
      if (this.get('onHide')) {
        this.sendAction('onHide');
      }
    },

    createCertificate: function() {
      const callback = this.get('saveCallback');
      const newCertificate = this.get('store').createRecord('certificate', {
        name: this.get('name'),
        leafCertificate: this.get('leafCertificate'),
        privateKey: this.get('privateKey'),
        certificateChain: this.get('certificateChain')
      });

      this.set('isSubmitting', true);

      newCertificate.save()
        .then((response) => {
          const id = newCertificate.get('id');

          App.NotificationsManager.show(
            'Your certificate has been added.',
            'notice'
          );

          // TODO: Can this be removed?
          // This shouldn't be necessary, but the certificates model doesn't
          // seem to get updated automatically after saving the new cert as
          // we would expect.
          if (this.get('allCertificates')) {
            this.get('allCertificates').unshiftObject(response._internalModel);
          }

          if (this.get('certificateOptions')) {
            this.get('certificateOptions').unshiftObject({
              label: newCertificate.get('name'),
              value: id
            });
          }

          // Select the new certificate in the respective forwarding rule's
          // certificate dropdown.
          if (typeof callback === 'function') {
            callback(id);
          }

          if (this.get('onHide')) {
            this.sendAction('onHide');
          }

          this.setProperties({
            name: null,
            leafCertificate: null,
            privateKey: null,
            certificateChain: null
          });
        })
        .catch((err) => {
          this.errorHandler(err, 'Adding certificate');
          this.get('store').unloadRecord(newCertificate);
        })
        .finally(() => {
          this.set('isSubmitting', false);
        });
    }
  }
});
