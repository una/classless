import {
  TLS_PASSTHROUGH_VALUE,
  ADD_CERTIFICATE_VALUE
} from '../constants';

export default function getCertificateOptions(certificates) {
  const options = certificates.map((cert) => ({
    label: cert.get('name'),
    value: cert.get('id')
  }));

  options.pushObject({
    label: 'Passthrough',
    // Using a space in the value here guarantees that we won't
    // collide with an existing certificate's name, since cert names
    // can't contain spaces.
    value: TLS_PASSTHROUGH_VALUE
  });

  options.pushObject({
    label: '+ New certificate',
    // The space in this value is required. See comment above.
    value: ADD_CERTIFICATE_VALUE
  });

  return options;
}
