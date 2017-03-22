import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  leafCertificate: DS.attr('string'),
  privateKey: DS.attr('string'),
  certificateChain: DS.attr('string'),
  SHA1Fingerprint: DS.attr('string')
});
