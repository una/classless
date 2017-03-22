import SearchableRestAdapter from '../adapters/searchable';
import ENV from '../config/environment';

export default SearchableRestAdapter.extend({

	buildURL (modelName, id, snapshot, requestType) {
		let baseUrl = `${ENV['api-host']}/api/v1/domains/${snapshot.adapterOptions.domainId}/records`;
		if( requestType === 'deleteRecord' || requestType === 'updateRecord') {
			return `${baseUrl}/${id}`;
		}
		return baseUrl;
	}

});
