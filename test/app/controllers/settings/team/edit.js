import Ember from 'ember';
import App from '../../../app';
import BaseController from '../../../controllers/base';
import _ from 'lodash/lodash';
import {camelizeObject} from '../../../utils/normalizeObjects';

const REDIRECT_TO_HOME_DELAY_MS = 1000;

export default BaseController.extend({
  modalTitle: 'Edit team profile',
  trackPageName: 'Edit Team Profile',
  editAction: 'updateProfile',
  showDeactivateModal: false,
  profileAttrs: ['name', 'location', 'company', 'contactEmail', 'phoneNumber', 'contactEmailConfirmation'],

  onModel: function () {
    let model = this.get('model');
    this.get('profileAttrs').forEach((key) => {
      if (key === 'contactEmailConfirmation') {
        this.set(key, model.team.get('contactEmail'));
      } else {
        this.set(key, model.team.get(key));
      }
    });
  }.observes('model', 'model.team'),

  contactEmailConfirmation: Ember.computed.alias('contactEmail'),

  actions: {
    onModalHide: function () {
      if (!this.get('showDeactivateModal')) {
        this.transitionToRoute('settings.team');
      }
    },
    onDeactivateModalHide: function (confirm) {
      if (confirm) {
        return this.get('model.team').deactivate().then(() => {
          App.NotificationsManager.show('Your Team has been deactivated.', 'notice');
          //Ensure the user notification has been shown before reloading the application.
          Ember.run.later(function () {
            window.location.href = '/';
          }, REDIRECT_TO_HOME_DELAY_MS);
        })
        .catch((resp) => {
          this.errorHandler(resp, 'Deactivate Team');
          this.set('showDeactivateModal', false);
          this.transitionToRoute('settings.team');
        });
      }
      this.set('showDeactivateModal', false);
    },
    updateProfile: function () {
      let options = {};
      this.get('profileAttrs').forEach((key) => {
        if (key) {
          options[key] = this.get(key);
        }
      });
      let emailUpdated = this.get('model.team.contactEmail') !== options.contactEmail;
      this.get('model.team').put(options).then((response) => {
        let notice = emailUpdated ? 'A change email address confirmation was sent to your account.  ' : '';
        App.NotificationsManager.show(`${notice}Your Team Profile has been updated!`, 'notice');
        response.json().then((json) => {
          this.get('model.team').setProperties(_.pick(camelizeObject(json.team), this.get('profileAttrs')));
          this.transitionToRoute('settings.team');
        });
      }).catch((resp) => {
        this.errorHandler(resp, 'Update Team Profile');
      });
    },
    toggleDeactivateModal: function () {
      this.set('showDeactivateModal', true);
    }
  }
});
