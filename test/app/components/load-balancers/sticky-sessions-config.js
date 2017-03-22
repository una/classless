import Ember from 'ember';

const STICKY_SESSION_TYPES = [
  {
    value: 'NONE',
    label: 'None'
  },
  {
    value: 'COOKIES',
    label: 'Cookie'
  }
];

/* eslint-disable no-magic-numbers */
const COOKIE_NAME_LENGTH_RANGE = [2, 40];
const COOKIE_TTL_RANGE = [1, 34650];
/* eslint-enable no-magic-numbers */

// This regex should match the one used by the lb-api service:
// https://github.internal.digitalocean.com/digitalocean/cthulhu/blob/cd210c6fc45b05b0f1ed4453352ddf4369d4e42a/docode/src/teams/high_avail/load-balancers/api/validate.go#L23
const VALID_COOKIE_NAME_REGEX = '^[a-zA-Z0-9\\!\\#\\$\\%\\&\\\'\\*\\+\\-\\.\\^\\_\\|\\~`]+$';

export default Ember.Component.extend({
  isEditMode: false,

  availableOptions: STICKY_SESSION_TYPES,
  defaultCookieTTL: 300,
  defaultCookieName: 'DO-LB',

  init: function() {
    this._super(...arguments);

    this.validateCookieName = this._validateCookieName.bind(this);
    this.setCookieNameErrorMessage = this._setCookieNameErrorMessage.bind(this);
  },

  validateCookieTTL: function(ttl) {
    ttl = parseInt(ttl, 10);
    return (ttl >= COOKIE_TTL_RANGE[0])
      && (ttl <= COOKIE_TTL_RANGE[1]);
  },

  setCookieTTLErrorMessage: function(ttl) {
    return ttl > COOKIE_TTL_RANGE[1]
      ? `Must be ${COOKIE_TTL_RANGE[1]}s or less`
      : `Must be ${COOKIE_TTL_RANGE[0]}s or more`;
  },

  _validateCookieName: function(name) {
    if (!name) {
      this.set('nameError', 'Cookie name cannot be blank');
      return false;
    }

    if (!name.match(VALID_COOKIE_NAME_REGEX)) {
      this.set('nameError', 'Contains invalid symbols');
      return false;
    }

    if (name.length < COOKIE_NAME_LENGTH_RANGE[0]
      || name.length > COOKIE_NAME_LENGTH_RANGE[1]) {
      const nameError = name.length > COOKIE_NAME_LENGTH_RANGE[1]
        ? `Must be ${COOKIE_NAME_LENGTH_RANGE[1]} characters or less`
        : `Must be ${COOKIE_NAME_LENGTH_RANGE[0]} characters or more`;
      this.set('nameError', nameError);
      return false;
    }

    this.set('nameError', null);
    return true;
  },

  _setCookieNameErrorMessage: function() {
    return this.get('nameError');
  },

  actions: {
    onTypeChange: function(value) {
      if (value === 'COOKIES' && !this.get('cookieName') && !this.get('cookieTTL')) {
        this.setProperties({
          cookieName: this.get('defaultCookieName'),
          cookieTTL: this.get('defaultCookieTTL')
        });
      }
    }
  }
});
