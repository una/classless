import App from '../../../app';
import BaseController from '../../../controllers/base';

export default BaseController.extend({
  trackPageName: 'Edit Profile',
  // at least 6 characters with at least one letter
  passwordRegEx: '^(?=.*[a-zA-Z])(.{6,})$',
  profileAttrs: [
    'name',
    'email',
    'emailConfirmation',
    'currentPassword',
    'password',
    'passwordConfirmation',
    'phone',
    'location',
    'company'
  ],
  isChangingEmail: false,
  isChangingPassword: false,

  onModel: function () {
    let user = this.get('model.user');
    this.get('profileAttrs').forEach((key) => {
      if(key === 'phone') {
        this.set(key, user.get('phoneNumber'));
      } else {
        this.set(key, user.get(key));
      }
    });
  }.observes('model.user'),

  resetProperties: function() {
    this.setProperties({
      currentPassword: '',
      password: '',
      passwordConfirmation: '',
      emailConfirmation: '',
      isChangingPassword: false,
      isChangingEmail: false
    });
  },

  isEmailChanged: function() {
    return Boolean(this.get('email.length') || this.get('emailConfirmation.length'));
  }.property('email', 'emailConfirmation'),

  isPasswordChanged: function() {
    return Boolean(this.get('password.length') || this.get('currentPassword.length') || this.get('passwordConfirmation.length'));
  }.property('password', 'currentPassword', 'passwordConfirmation'),

  actions: {
    onModalHide: function() {
      this.transitionToRoute('settings.profile');

      if(!this.get('isSubmitting')) {
        this.resetProperties();
      }
    },
    editEmail: function() {
      this.setProperties({
        isChangingEmail: true,
        email: ''
      });
    },
    editPassword: function() {
      this.set('isChangingPassword', true);
    },
    updateProfile: function () {
      let options = {};
      this.get('profileAttrs').forEach((key) => {
        if(key) {
          if(key === 'email') {
            options[key] = this.get('email') || this.get('model.user.email');
          } else {
            options[key] = this.get(key);
          }
        }
      });

      let emailUpdated = this.get('model.user.email') !== options.email;

      this.set('isSubmitting', true);
      this.get('model.user').setProperties(options);

      this.get('model.user').save().then(() => {
        let notice = emailUpdated ? 'A change email address confirmation was sent to your account.  ' : '';
        App.NotificationsManager.show(`${notice}Your Profile has been updated!`, 'notice');
        this.send('onModalHide');
      }).catch((err) => {
        this.get('model.user').rollbackAttributes();
        this.errorHandler(err, 'Update Profile');
      }).finally(() => {
        this.set('isSubmitting', false);
      });
    }
  }
});
