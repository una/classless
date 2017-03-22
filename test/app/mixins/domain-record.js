import Ember from 'ember';
import {DEFAULT_TTL} from '../constants';

const HOSTNAME_PATTERN = '\\S+\\.\\S+';

export default Ember.Mixin.create({

  helpText: {
    A: 'Use @ to create the record at the root of the domain or enter a hostname to create it elsewhere. A records are for IPv4 addresses only and tell a request where your domain should direct to.',
    AAAA: 'Use @ to create the record at the root of the domain or enter a hostname to create it elsewhere. AAAA records are for IPv6 addresses only and tell a request where your domain should direct to.',
    CNAME: 'CNAME records act as an alias by mapping a hostname to another hostname.',
    MX: 'MX records specify the mail servers responsible for accepting emails on behalf of your domain, and priority value if your provider has a number of mail servers for contingency.',
    TXT: 'TXT records are used to associate a string of text with a hostname. These are primarily used for verification.',
    NS: 'NS records specify the servers which are providing DNS services for your domain. You can use these to create subzones if your need to direct part of your traffic to another DNS service.',
    SRV: 'SRV records specify the location (hostname and port number) of servers for specific services. You can use service records to direct certain types of traffic to particular servers.'
  },

  recordHelpText: function () {
    return this.helpText[this.get('record.recordType')];
  }.property('record.recordType'),

  recordTypes: function () {
    return ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV'];
  }.property(),

  recordTypeClass: function () {
    return (this.get('record.recordType') || '').toLowerCase();
  }.property('record.recordType'),

  hasPriority: function () {
    let type = this.get('record.recordType');
    return type === 'MX' || type === 'SRV';
  }.property('record.recordType'),

  valuePrefix: function () {
    let type = this.get('record.recordType');
    let prefix;
    switch(type) {
      case 'MX':
        prefix = 'mail handled by';
        break;
      case 'TXT':
        prefix = 'returns';
        break;
      case 'CNAME':
        prefix = 'is an alias of';
        break;
      default:
        prefix = 'directs to';
    }

    return prefix;
  }.property('record'),

  hostNameItems: function () {
    let type = this.get('record.recordType');
    let wildcardPattern = '\\*|[a-zA-Z0-9_\\*]?[a-z0-9A-Z_\\.\\-]*[a-z0-9A-Z\\.]';
    let pattern = '@|' + wildcardPattern;
    let placeholder = 'Enter @ or hostname';
    let label = 'Hostname';
    let err = 'Invalid hostname';
    let key = 'name';
    let hasDefault = false;

    if(type === 'CNAME') {
      err = 'Invalid CNAME';
      pattern = wildcardPattern;
      placeholder = 'Enter hostname';
    } else if (type === 'SRV') {
      placeholder = 'e.g. _service._protocol';
      pattern = '_\\S*\\._\\S*';
    } else if (type === 'NS') {
      hasDefault = true;
    }
    return [{
      pattern,
      err,
      label,
      placeholder,
      key,
      hasDefault
    }];
  }.property('record', 'isEditing'),

  valueItems: function () {
    let record = this.get('record');
    let type = record.get('recordType');
    let value = record.get('dataRecord');

    let label = 'Will direct to';
    let pattern = HOSTNAME_PATTERN;
    let err = 'Invalid hostname';
    let long = false;
    let key = 'dataRecord';
    let autoComplete = false;
    let placeholder = 'e.g. mydomain.com';
    let header;
    let FQDN = false;

    if(type === 'MX') {
      label = 'Mail providers mail server';
      placeholder = 'e.g. aspmx.l.google.com.';
      FQDN = true;
    } else if (type === 'CNAME') {
      FQDN = true;
      placeholder = 'Enter @ or hostname';
      pattern = '@|' + pattern;
      err = 'Invalid hostname';
      header = 'Is an alias of';
    } else if (type === 'TXT') {
      label = 'Will return';
      header = 'Value';
      placeholder = 'Paste TXT string here';
      err = 'TXT string cannot be blank';
      pattern = null;
      long = true;
    } else if (type === 'NS') {
      FQDN = true;
      placeholder = 'Enter nameserver';
    } else if (type === 'A' || type === 'AAAA') {
      err = 'Invalid IP' + (type === 'AAAA' ? 'v6 address' : ' address');
      pattern = type === 'AAAA' ? '[0-9a-fA-F]+::?[0-9a-fA-F:]+': '(?:[0-9]{1,3}\\.){3}[0-9]{1,3}';
      placeholder = 'Select resource or enter custom IP' + (type === 'AAAA' ? 'v6 address' : '');
      autoComplete = true;
    }

    let valueArr = [{
      value,
      pattern,
      err,
      label,
      long,
      key,
      header,
      placeholder,
      autoComplete,
      FQDN
    }];

    if(type === 'SRV') {
      valueArr.push({
        value: record.get('port'),
        pattern: '[\\d]{1,5}',
        err: 'Port must be from 1-65535',
        label: 'Port',
        key: 'port',
        placeholder: 'e.g. 5060'
      });
    }
    if(type === 'MX' || type === 'SRV') {
      valueArr.push({
        value: record.get('priority'),
        err: 'Priority',
        longErr: 'Invalid Priority',
        pattern: '\\d+',
        label: 'Priority',
        key: 'priority',
        placeholder: 'e.g. 10'
      });
    }
    if(type === 'SRV') {
      valueArr.push({
        value: record.get('weight'),
        err: 'Weight',
        longErr: 'Invalid Weight',
        pattern: '\\d+',
        label: 'Weight',
        key: 'weight',
        placeholder: 'e.g. 100'
      });
    }

    return valueArr;
  }.property('record', 'isEditing'),

  ttlItems: function () {
    let type = this.get('record.recordType');

    let valueArr = {
      value: this.get('record.ttl'),
      pattern: '\\d+',
      label: 'Enter TTL',
      header: 'TTL (Seconds)',
      err: 'Invalid TTL',
      key: 'ttl',
      defaultValue: '' + DEFAULT_TTL
    };

    if(type === 'MX') {
      valueArr.defaultValue = '14400';
    } else if (type === 'CNAME') {
      valueArr.defaultValue = '43200';
    } else if (type === 'NS') {
      valueArr.defaultValue = '86400';
    } else if (type === 'SRV') {
      valueArr.defaultValue = '43200';
    }

    return [valueArr];
  }.property('record', 'isEditing')

});
