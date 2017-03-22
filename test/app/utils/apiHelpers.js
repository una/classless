import retrieveCsrfToken from '../utils/retrieveCsrfToken';
import fetch from 'fetch';
import {decamelizeObject} from '../utils/normalizeObjects';
import config from '../config/environment';
import _ from 'lodash/lodash';
import {REQUEST_HEADER_NAME, CONTEXT_ID_HEADER_NAME} from '../constants';
import App from '../app';

const SUCCESS_STATUS_CODES = 200;
const REDIRECT_STATUS_CODES = 300;

function _fetchStatusCheck (response) {
  if (response.status >= SUCCESS_STATUS_CODES && response.status < REDIRECT_STATUS_CODES) {
    return response;
  }
  throw response;
}

function getBaseOptions(verb) {
  let baseOptions = {
    method: verb,
    credentials: 'include',
    mode: 'cors',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  // unique request id for request tracing
  baseOptions.headers[REQUEST_HEADER_NAME] = App.getUUID();


  // header with current context for deeplinking via query parameter
  if (App.User && App.User.get('currentContextId')) {
    baseOptions.headers[CONTEXT_ID_HEADER_NAME] = App.User.get('currentContextId');
  }

  if (['post', 'put', 'delete'].indexOf(verb) > -1) {
    baseOptions.headers['X-CSRF-Token'] = retrieveCsrfToken();
  }

  return baseOptions;
}

function get(url, options) {
  return fetch(`${config['api-host']}${url}`, _.assign(getBaseOptions('get'), options)).then(_fetchStatusCheck);
}

function post(url, data, options) {
  let dataToSend = JSON.stringify(decamelizeObject(data));
  return fetch(`${config['api-host']}${url}`, _.assign(getBaseOptions('post'), options, {body: dataToSend})).then(_fetchStatusCheck);
}

function put(url, data, options) {
  let dataToSend = JSON.stringify(decamelizeObject(data));
  return fetch(`${config['api-host']}${url}`, _.assign(getBaseOptions('put'), options, {body: dataToSend})).then(_fetchStatusCheck);
}

function del(url, data, options) {
  let dataToSend = JSON.stringify(decamelizeObject(data));
  return fetch(`${config['api-host']}${url}`, _.assign(getBaseOptions('delete'), options, {body: dataToSend})).then(_fetchStatusCheck);
}

function objectStorageFetch(url, method='GET', queryParams = {}, fetchOptions = {}) {
  let options = _.extend({
    method: method,
    credentials: 'cors',
    mode: 'cors',
    headers: {
      'X-User-ID': App.User.get('internalIdentifier')
    }
  }, fetchOptions);

  let query = '';
  Object.keys(queryParams).forEach(function (param, i) {
    query += `${i ? '&' : '?'}${param}=${queryParams[param]}`;
  });
  let uri = `${config['bucket-api-host']}${url}${query}`;

  return fetch(uri, options).then(_fetchStatusCheck).then((resp) => {
    if(method === 'DELETE') {
      return resp;
    }
    return resp.json();
  });
}

function objectStoragePut(url, uploadContentType, data, headers = {}) {
  let defaultHeaders = {
    'X-User-ID': App.User.get('internalIdentifier')
  };
  if(typeof uploadContentType === 'string') {
    defaultHeaders['Content-Type'] = uploadContentType;
  } else {
    //we're not uploading a file, so path is relative
    url = `${config['bucket-api-host']}${url}`;
  }
  let options = {
    method: 'put',
    body: data,
    credentials: 'cors',
    mode: 'cors',
    headers: _.extend(defaultHeaders, headers)
  };


  return fetch(url, options).then(_fetchStatusCheck);
}

let api = {
  get: get,
  post: post,
  put: put,
  del: del
};

export {get, put, post, del, api, objectStorageFetch, getBaseOptions, objectStoragePut};
