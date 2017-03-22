import DS from 'ember-data';
import _ from 'lodash/lodash';
import { objectStorageFetch, objectStoragePut } from '../utils/apiHelpers';
import { camelizeObject, decamelizeObject } from '../utils/normalizeObjects';

export default DS.Model.extend({
	key: DS.attr(),
	lastModified: DS.attr('date'),
	size: DS.attr(),
	isDir: DS.attr('boolean'),

	generateDownloadUrl: function (bucketName, hours) {
		let url = `/buckets/${bucketName}/objects/${window.encodeURIComponent(this.get('key'))}/download`;
		if (hours) {
			url += `?seconds=${hours * 60 * 60}`; // eslint-disable-line no-magic-numbers
		}
		return objectStorageFetch(url).then((obj) => {
			return obj.download_url;
		});
	},

	generateUploadUrl: function (bucketName, contentType, queryParams) {
		let url = `/buckets/${bucketName}/objects/${window.encodeURIComponent(this.get('key'))}/upload`;
		return objectStorageFetch(url, 'get', _.extend({ 'content-type': contentType }, queryParams)).then((obj) => {
			return obj;
		});
	},

	uploadFile: function (url, contentType, file, headers) {
		return objectStoragePut(url, contentType, file, headers).then((obj) => {
			return obj.status;
		});
	},

	getMetaData: function (bucketName, checkForExistenceOfKey) {
		let url = `/buckets/${bucketName}/objects/${window.encodeURIComponent(checkForExistenceOfKey || this.get('key'))}/metadata`;
		return objectStorageFetch(url).then(function (obj) {
			if(checkForExistenceOfKey) {
				return true;
			}
			let customMetadata = [];
			Object.keys(obj.metadata.custom_metadata).forEach(function(key) {
				customMetadata.pushObject({
					key: key.toLowerCase(),
					value: obj.metadata.custom_metadata[key]
				});
			});
			let camelObj = camelizeObject(obj.metadata);
			camelObj.customMetadata = customMetadata;
			return camelObj;
		}).catch((err) => {
			if(checkForExistenceOfKey && err.status === 404) {
				return false;
			}
			throw err;
		});
	},

	saveMetaData: function (bucketName, metadata) {
		let metaDataObj = decamelizeObject(metadata);
		if(metaDataObj.custom_metadata) {
			let customMetadata = {};
			metaDataObj.custom_metadata.forEach(function (meta) {
				customMetadata[meta.key] = meta.value;
			});
			metaDataObj.custom_metadata = customMetadata;
		}
		let url = `/buckets/${bucketName}/objects/${window.encodeURIComponent(this.get('key'))}/metadata`;
		return objectStoragePut(url, null, JSON.stringify({ metadata: metaDataObj }));
	},

	deleteFromBucket: function (bucketName) {
		if(this.get('isDir')) {
			return objectStorageFetch(`/buckets/${bucketName}/objects/delete`, 'POST', {}, { body: JSON.stringify({ prefixes: [this.get('key')] }) });
		} else {
			return objectStorageFetch(`/buckets/${bucketName}/objects/${window.encodeURIComponent(this.get('key'))}`, 'DELETE');
		}
	},

	moveObject: function(bucketName, newKey, headers) {
		let url = `/buckets/${bucketName}/objects/${window.encodeURIComponent(this.get('key'))}/move`;
		return objectStorageFetch(url, 'POST', headers, {body: JSON.stringify({bucket: bucketName, key: newKey}) }).then(function (resp) {
			resp.key = newKey;
			return resp;
		});
	}

});
