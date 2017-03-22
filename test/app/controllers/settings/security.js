import BaseController from '../base';
import App from '../../app';

let hasMorePages = function (collection) {
  return collection && collection.meta && collection.meta.pagination && collection.meta.pagination.pages > 1;
};

export default BaseController.extend({
  trackPageName: 'Team Settings',
  sort: 'name',
  sort_direction: 'desc',
  page: 1,
  keys_page: 1,
  certificates_page: 1,
  loadBalancersEnabled: App.featureEnabled('loadBalancers'),
  disabling2FA: false,
  disabling2FABackup: false,
  showDisable2FAModal: false,
  showDisable2FABackupModal: false,
  showEnable2FAModal: false,
  showEnable2FAViaAuthenticatorModal: false,
  showEnable2FAViaSMSModal: false,
  showSetup2FABackupModal: false,
  showAdd2FABackupViaAuthenticatorModal: false,
  showAdd2FABackupViaSMSModal: false,
  showAdded2FABackupViaCodesModal: false,
  showRegerenateBackupCodesConfirmationModal: false,
  show2FASuccessfullyActivatedModal: false,
  authenticator: {modules: [], module_count: 0},
  sms: {},
  modalBeforeBackups: null,

  init: function() {
    this.boundErrorHandler = this.errorHandler.bind(this);

    this.resetProperties();
  },

  needsPagination: function() {
    return !this.get('error') && hasMorePages(this.get('model.events'));
  }.property('model', 'error'),

  sshKeysNeedPagination: function () {
    return !this.get('error') && hasMorePages(this.get('model.sshKeys'));
  }.property('model' ,'error'),

  certificatesNeedPagination: function () {
    return !this.get('error') && hasMorePages(this.get('model.certificates'));
  }.property('model' ,'error'),

  isChangingKeyPage: function() {
    return this.get('paginatingKeys');
  }.property('paginatingKeys'),

  resetProperties: function () {
    this.setProperties({
      paginating: false,
      paginatingKeys: false,
      paginatingCertificates: false,
      sorting: false,

      certificate: {
        name: null,
        leafCertificate: null,
        privateKey: null,
        certificateChain: null
      }
    });
  },

  sshKeysMenuItems: [
    {
      name: 'Edit'
    }, {
      name: 'Delete'
    }
  ],

  certificatesMenuItems: [
    {
      name: 'Delete'
    }
  ],

  saveKeyModel: function(key) {
    key.save().then((response) => {
      this.get('model.sshKeys').unshiftObject(response._internalModel);
      this.set('showSshKeyCreateModal', false);
      App.NotificationsManager.show('SSH Key created successfully.', 'notice');
    }).catch((err) => {
      this.errorHandler(err, 'Create SSH Key');
    }).finally(() => {
      this.set('savingKey', false);
    });
  },

  editKeyModel: function(key) {
    key.save().then(() => {
      this.set('savingKey', false);
      this.set('showSshKeyEditModal', false);
      App.NotificationsManager.show('SSH Key updated successfully.', 'notice');
    }).catch((err) => {
      this.set('savingKey', false);
      this.errorHandler(err, 'Edit SSH Key');
    });
  },

  disable2FA: function() {
    this.get('model.user').disable2FA().then(() => {
      this.set('model.user.tfaEnabled', false);
      this.set('model.user.twoFactorMethods', {});
      App.NotificationsManager.show('Two Factor Authentication Disabled.', 'notice');
      this.set('disabling2FA', false);
    }).catch((err) => {
      this.errorHandler(err, 'Disable Two Factor Authentication');
      this.set('disabling2FA', false);
    });
  },

  disable2FABackup: function() {
    this.get('model.user').disable2FABackup().then(() => {
      let methods = this.get('model.user.twoFactorMethods');
      let primaryMethodType = this.get('model.user.tfaPrimaryType');
      let resultingMethods = {};
      resultingMethods[primaryMethodType] = methods[primaryMethodType];
      this.set('model.user.twoFactorMethods', resultingMethods);
      App.NotificationsManager.show('Two Factor Authentication Backup Disabled.', 'notice');
      this.set('disabling2FABackup', false);
    }).catch((err) => {
      this.errorHandler(err, 'Disable Two Factor Authentication Backup');
      this.set('disabling2FABackup', false);
    });
  },

  tfaTypeDescription: function(type, method) {
    switch(type) {
      case 'authenticator':
        return 'When you log in you will be required to enter a code that we will send to an app.';
      case 'sms':
        return `We will send a unique code to ${method.phone_number}`;
      case 'recovery_codes':
        return `You have ${method.code_count} backup codes remaining.`;
    }
    return '';
  },

  tfaMethodDescription: function() {
    let type = this.get('model.user.tfaMethod.type');
    let method = this.get('model.user.tfaMethod.data');
    return this.get('tfaTypeDescription')(type, method);
  }.property('model.user.tfaMethod'),

  tfaBackupMethodDescription: function() {
    let type = this.get('model.user.tfaBackupMethod.type');
    let method = this.get('model.user.tfaBackupMethod.data');
    return this.get('tfaTypeDescription')(type, method);
  }.property('model.user.tfaBackupMethod'),

  primary2FAMethodModalName: {
    authenticator: 'showEnable2FAViaAuthenticatorModal',
    sms: 'showEnable2FAViaSMSModal'
  },

  backup2FAMethodModalName: {
    authenticator: 'showAdd2FABackupViaAuthenticatorModal',
    sms: 'showAdd2FABackupViaSMSModal',
    recovery_codes: 'showAdded2FABackupViaCodesModal'
  },

  selectMethodError: function(err, type) {
    this.errorHandler(err, `Selecting ${type} two factor authentication method`);
  },

  tfaPrimaryMethodType: function() {
    return this.get('model.user.tfaPrimaryType');
  }.property('model.user.tfaPrimaryType'),

  recoveryCodes: function() {
    return this.get('recovery_codes.recovery_codes') || [];
  }.property('recovery_codes'),

  validBackupCodesLeft: function() {
    return this.get('model.user.tfaBackupMethod.data.code_count') || 0;
  }.property('model.user.tfaBackupMethod'),

  validBackupCodesLeftText: function() {
    let codesLeft = this.get('validBackupCodesLeft');
    return `${codesLeft} code${codesLeft !== 1 ? 's' : ''}`;
  }.property('validBackupCodesLeft'),

  regenerateBackupCodes: function() {
    this.set('recovery_codes', null);
    this.set('showAdded2FABackupViaCodesModal', true);
  },

  actions: {
    enable2FA: function() {
      this.set('showEnable2FAModal', true);
    },
    showDisable2FAModal: function() {
      if (!this.get('disabling2FA')) {
        this.set('showDisable2FAModal', true);
      }
    },
    confirmDisable2FA: function(confirm) {
      this.set('showDisable2FAModal', false);
      if (confirm) {
        this.set('disabling2FA', true);
        this.disable2FA();
      }
    },
    showDisable2FABackupModal: function() {
      if (!this.get('disabling2FABackup')) {
        this.set('showDisable2FABackupModal', true);
      }
    },
    confirmDisable2FABackup: function(confirm) {
      this.set('showDisable2FABackupModal', false);
      if (confirm) {
        this.set('disabling2FABackup', true);
        this.disable2FABackup();
      }
    },
    hideEnable2FAModal: function() {
      this.set('showEnable2FAModal', false);
    },
    show2FAPrimaryActionModal: function(method) {
      this.set('showEnable2FAModal', false);
      this.set(this.primary2FAMethodModalName[method], true);
    },
    selectAuthenticator: function(type) {
      this.get('model.user').selectMethod({ method: 'authenticator', type: type}).then((resp) => {
        resp.json().then((json) => {
          this.set('authenticator', json);
        });
      }).catch((err) => {
        this.selectMethodError(err, type);
      });
    },
    selectBackupCodes: function() {
      if(this.get('model.user.tfaBackupMethod.type') === 'recovery_codes') {
        this.get('model.user').generateRecoveryCodes().then((resp) => {
          resp.json().then((json) => {
            this.set('recovery_codes', json);
          });
        }).catch((err) => {
          if(this.get('showAdded2FABackupViaCodesModal')) {
            this.set('showAdded2FABackupViaCodesModal', false);
            if (this.get('modalBeforeBackups')) {
              this.set(this.get('modalBeforeBackups'), true);
            }
            this.set('recovery_codes', null);
          }
          this.errorHandler(err, 'Generating recovery codes');
        });
      } else {
        this.get('model.user').selectMethod({ method: 'recovery_codes', type: 'backup'}).then((resp) => {
          resp.json().then((json) => {
            this.set('recovery_codes', json);
          });
        }).catch((err) => {
          if(this.get('showAdded2FABackupViaCodesModal')) {
            this.set('showAdded2FABackupViaCodesModal', false);
            if (this.get('modalBeforeBackups')) {
              this.set(this.get('modalBeforeBackups'), true);
            }
            this.set('recovery_codes', null);
          }
          this.selectMethodError(err, 'backup');
        });
      }
    },
    hideEnable2FAAuthenticatorModal: function() {
      this.set('authenticator', null);
      this.set('showEnable2FAViaAuthenticatorModal', false);
    },
    hideAdd2FABackupViaAuthenticatorModal: function() {
      this.set('authenticator', null);
      this.set('showAdd2FABackupViaAuthenticatorModal', false);
    },
    confirm2FAAuthenticatorCode: function(enteredCode, errHandler) {
      let modal = this.primary2FAMethodModalName.authenticator;
      this.get('model.user').verifyAuthenticator(enteredCode).then(() => {
        this.set(modal, false);
        this.set('model.user.twoFactorMethods', { authenticator: { is_primary: true } });
        this.set('model.user.tfaEnabled', true);
        this.set('show2FASuccessfullyActivatedModal', true);
      }).catch((err) => {
        this.errorHandler(err, 'Invalid authenticator code');
        errHandler(err);
      });
    },
    confirm2FABackupAuthenticatorCode: function(enteredCode, errHandler) {
      let modal = this.backup2FAMethodModalName.authenticator;
      this.get('model.user').verifyAuthenticator(enteredCode).then(() => {
        this.set(modal, false);
        let resultingTfaMethods = {};
        let primaryMethodType = this.get('model.user.tfaPrimaryType');
        resultingTfaMethods[primaryMethodType] = this.get('model.user.twoFactorMethods')[primaryMethodType];
        resultingTfaMethods.authenticator = { is_primary: false };
        this.set('model.user.twoFactorMethods', resultingTfaMethods);
      }).catch((err) => {
        this.errorHandler(err, 'Invalid authenticator code');
        errHandler(err);
      });
    },
    hideEnable2FASMSModal: function() {
      this.set('showEnable2FAViaSMSModal', false);
    },
    hideAdd2FABackupViaSMSModal: function() {
      this.set('showAdd2FABackupViaSMSModal', false);
    },
    send2FAPrimarySMSCode: function(callingCode, phoneNumber, callback) {
      let payload = {
        method: 'sms',
        type: 'primary',
        calling_code: callingCode,
        phone_number: phoneNumber
      };
      this.get('model.user').selectMethod(payload).then(() => {
        this.set('phone', `+${callingCode}${phoneNumber}`);
        if(callback) {
          callback();
        }
      }).catch((err) => {
        this.selectMethodError(err, payload.type);
        if(callback) {
          callback(err);
        }
      });
    },
    send2FABackupSMSCode: function(callingCode, phoneNumber, callback) {
      let payload = {
        method: 'sms',
        type: 'backup',
        calling_code: callingCode,
        phone_number: phoneNumber
      };
      this.get('model.user').selectMethod(payload).then(() => {
        this.set('phone', `+${callingCode}${phoneNumber}`);
        if(callback) {
          callback();
        }
      }).catch((err) => {
        this.errorHandler(err, payload.type);
        if(callback) {
          callback(err);
        }
      });
    },
    confirm2FAPrimarySMSCode: function(enteredCode, errHandler) {
      let modal = this.primary2FAMethodModalName.sms;
      this.get('model.user').verifySMS(enteredCode).then(() => {
        this.set(modal, false);
        this.set('model.user.twoFactorMethods', { sms: { is_primary: true, phone_number: this.get('phone') } });
        this.set('model.user.tfaEnabled', true);
        this.set('show2FASuccessfullyActivatedModal', true);
      }).catch((err) => {
        this.errorHandler(err, 'Invalid SMS code');
        errHandler(err);
      });
    },
    confirm2FABackupSMSCode: function(enteredCode, errHandler) {
      let modal = this.backup2FAMethodModalName.sms;
      this.get('model.user').verifySMS(enteredCode).then(() => {
        this.set(modal, false);
        let resultingTfaMethods = {};
        let primaryMethodType = this.get('model.user.tfaPrimaryType');
        resultingTfaMethods[primaryMethodType] = this.get('model.user.twoFactorMethods')[primaryMethodType];
        resultingTfaMethods.sms = { is_primary: false, phone_number: this.get('phone') };
        this.set('model.user.twoFactorMethods', resultingTfaMethods);
      }).catch((err) => {
        this.errorHandler(err, 'Invalid SMS code');
        errHandler(err);
      });
    },
    hide2FASuccessfullyActivatedModal: function() {
      this.set('modalBeforeBackups', 'show2FASuccessfullyActivatedModal');
      this.set('show2FASuccessfullyActivatedModal', false);
    },
    show2FABackupActionModal: function(method) {
      this.set(this.backup2FAMethodModalName[method], true);
    },
    hide2FABackupActionModal: function() {
      this.set('modalBeforeBackups', 'showSetup2FABackupModal');
      this.set('showSetup2FABackupModal', false);
    },
    hideAdded2FABackupViaCodesModal: function() {
      let codeCount = (this.get('recovery_codes.recovery_codes') || []).length;
      if(codeCount > 0) {
        let resultingTfaMethods = {};
        let primaryMethodType = this.get('model.user.tfaPrimaryType');
        resultingTfaMethods[primaryMethodType] = this.get('model.user.twoFactorMethods')[primaryMethodType];
        resultingTfaMethods.recovery_codes = { code_count: codeCount };
        this.set('model.user.twoFactorMethods', resultingTfaMethods);
      }
      this.set('showAdded2FABackupViaCodesModal', false);
      this.set('recovery_codes', null);
    },
    add2FABackupMethod: function() {
      this.set('showSetup2FABackupModal', true);
    },
    regenerate2FABackupCodes: function() {
      if(this.get('validBackupCodesLeft') > 0) {
        this.set('showRegerenateBackupCodesConfirmationModal', true);
      } else {
        this.regenerateBackupCodes();
      }
    },
    confirmRegenerateBackupCodes: function(confirm) {
      this.set('showRegerenateBackupCodesConfirmationModal', false);
      if(confirm) {
        this.set('modalBeforeBackups', 'showRegerenateBackupCodesConfirmationModal');
        this.regenerateBackupCodes();
      }
    },
    showSshKeyCreateModal: function () {
      this.set('showSshKeyCreateModal', true);
    },
    showSshKeyEditModal: function () {
      this.set('showSshKeyEditModal', true);
    },
    hideSshCreateModal: function () {
      this.set('showSshKeyCreateModal', false);
    },
    hideSshEditModal: function () {
      this.set('showSshKeyEditModal', false);
    },
    saveSshKey: function (keyMeta) {
      let key = this.store.createRecord('ssh-key', keyMeta);
      this.set('savingKey', true);
      this.saveKeyModel(key);
    },
    updateSshKey: function (keyMeta) {
      let key = this.get('keyToEdit');
      key.setProperties(keyMeta);
      this.set('savingKey', true);

      this.editKeyModel(key);
    },
    onDeleteKeyClose: function(confirm) {
      this.set('showSshKeyDeleteModal', false);
      if (confirm) {
        let key = this.get('keyToDelete');
        key.destroyRecord().then(() => {
          App.NotificationsManager.show(`You have deleted "${key.get('name')}".`, 'notice');
        }).catch((err) => {
          this.errorHandler(err, 'Delete SSH key');
        });
      }
      this.set('keyToDelete', null);
    },
    showCertificateCreateModal: function () {
      this.set('showCertificateCreateModal', true);
    },
    closeCertificateModal: function () {
      this.set('showCertificateCreateModal', false);
    },
    onDeleteCertificateClose: function(confirm) {
      this.set('showCertificateDeleteModal', false);
      if (confirm) {
        const certificate = this.get('certificateToDelete');
        certificate.destroyRecord().then(() => {
          App.NotificationsManager.show(`You have deleted "${certificate.get('name')}".`, 'notice');
        }).catch((err) => {
          this.errorHandler(err, 'Delete Certificate');
        });
      }
      this.set('certificateToDelete', null);
    },
    menuItemClick: function (clickedKey, key) {
      this.trackAction('Menu Item Click: ' + clickedKey);
      if(clickedKey === 'Edit') {
        this.set('keyToEdit', key);
        this.set('showSshKeyEditModal', true);
      } else if(clickedKey === 'Delete') {
        this.set('keyToDelete', key);
        this.set('showSshKeyDeleteModal', true);
      }
    },
    certificateMenuItemClick: function (clickedKey, certificate) {
      this.trackAction('Menu Item Click: ' + clickedKey);
      if(clickedKey === 'Delete') {
        this.set('certificateToDelete', certificate);
        this.set('showCertificateDeleteModal', true);
      }
    },
    changePage: function() {
      this.trackAction('Change history page');
      this.set('paginating', true);
    },
    changeKeyPage: function(page) {
      this.set('keys_page', page);
      this.trackAction('Change SSH keys page');
      this.set('paginatingKeys', true);
    },
    changeCertificatePage: function(page) {
      this.set('certificates_page', page);
      this.trackAction('Change Certificates page');
      this.set('paginatingCertificates', true);
    },
    sortEvents: function (row) {
      let direction = this.get('sort') === row && this.get('sort_direction') === 'asc' ? 'desc' : 'asc';
      this.setProperties({
        sort: row,
        sort_direction: direction,
        sorting: true,
        page: 1
      });
      this.trackAction('Sort');
    },

    modelLoaded: function () {
      this.resetProperties();
    },
    modelError: function () {
      this.resetProperties();
    }
  }
});
