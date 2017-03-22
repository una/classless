import ApplicationAdapter from './application';
import Inflector from 'ember-inflector';

const inflector = Inflector.inflector;

inflector.irregular('social-identity', 'identities');

export default ApplicationAdapter.extend({});
