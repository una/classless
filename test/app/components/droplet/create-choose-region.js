import Ember from 'ember';
import _ from 'lodash/lodash';
import { PropTypes } from 'ember-prop-types';

export default Ember.Component.extend({

	propTypes: {
		regionsProps: PropTypes.object.isRequired,
		onSelectRegion: PropTypes.string,
		setFilteredRegions: PropTypes.string,
		onSetSelectedRegion: PropTypes.string
	},

	filteredRegions: function() {
		if(this.get('regionsProps.dropletLimitReached')) {
			return [];
		}

		let regions = this.get('regionsProps.model.regions') || [],
				region = this.get('regionsProps.regionObj'),
				size = this.get('regionsProps.sizeObj'),
				distroVersion = this.get('regionsProps.distroVersion'),
				image = this.get('regionsProps.image'),
				restriction,
				found,
				imageRequiredSettings,
				imageRegionIds,
				sizeRegionIds;

		// On INIT if sizeObj is not set, set it to test agains
		if (!size && this.get('regionsProps.size')) {
			size = this.get('regionsProps.model.sizes').findBy('name', (this.get('regionsProps.size').toUpperCase()));
		}

		// use a copy of regions so we don't mutate the original properties
		regions = regions.slice();

		regions.forEach((region) => {
			restriction = null;
			if(distroVersion) {
				// check if the distro's version is available in this region
				if(distroVersion.region_ids.indexOf(region.id) === -1) {
					restriction = 'The image you selected is not available in this region.';
				}

				// check if one of the region's disabled features is not a required feature
				// for the selected distribution
				if(image.required_features) {
					image.required_features.forEach((feature) => {
						if(region.disabled_features.indexOf(feature) !== -1) {
							restriction = 'The distribution you selected requires features not yet available in this region.';
						}
					});
				}

				// check if one of the region's disabled features is not a required setting
				// for the version of the selected distribution
				distroVersion.required_settings.forEach((feature) => {
					if(region.disabled_features.indexOf(feature) !== -1) {
						restriction = 'The distribution version you selected requires features not yet available in this region.';
					}
				});
			}

			// one click app or snapshot/backup
			if(!distroVersion && image) {
				// we need this because one click apps are json while snapshot/backups are an Ember object
				imageRequiredSettings = image.required_settings || image.get('requiredSettings') || [];
				imageRegionIds = image.region_ids || image.get('regionIds') || [];

				// check if one of the region's disabled features is not a required setting of the image
				imageRequiredSettings.forEach((feature) => {
					if(region.disabled_features.indexOf(feature) !== -1) {
						restriction = 'The image you selected requires features not yet available in this region.';
					}
				});

				// check if image is available in this region
				if(imageRegionIds.indexOf(region.id) === -1) {
					restriction = 'The image you selected is not available in this region.';
				}
			}

			// check if the size is available in this region
			if(size) {
				sizeRegionIds = size.region_ids || size.get('region_ids') || [];
				if(sizeRegionIds.indexOf(region.id) === -1) {
					restriction = 'The size you selected is not available in this region.';
				}
			}
			let volumes = this.get('regionsProps.volumes');
			if(volumes.length) {
				if(!region.storage_enabled) {
					restriction = 'Volumes are not yet available in this region.';
				} else if(volumes[0].get('isUnattached') && region.slug !== volumes[0].get('region.slug')) {
					restriction = 'The volume you selected is not available in this region';
				}
			}

			Ember.setProperties(region, {
				restriction: region.server_restriction ? region.server_restriction : restriction,
				selected: false
			});

		});

		// we selected a region from the UI
		if(region && !region.restriction) {
			found = region;
		}
		// did we deeplink to a specific region?
		if(!found && this.get('regionsProps.model.query_state.region.id')) {
			found = _.find(regions, {restriction: null, id: this.get('regionsProps.model.query_state.region.id')});
		}

		// use the initial state's region from the API if a region is not yet found
		if(!found) {
			found = _.find(regions, {restriction: null, id: this.get('regionsProps.model.initial_state.region_id')});
		}

		// find the first available region in the distro's or image's region ids array
		if(!found) {
			found = _.find(regions, (region) => {
				return !region.restriction && ((distroVersion && region.id === distroVersion.region_ids[0]) || (!distroVersion && image && region.id === imageRegionIds[0]));
			});
		}

		if(found) {
			Ember.set(found, 'selected', true);
		}

		let select = found ? found : null;

		if(this.get('onSetSelectedRegion')) {
			this.sendAction('onSetSelectedRegion', select);
		}

		if(this.get('setFilteredRegions')) {
			this.sendAction('setFilteredRegions', regions);
		}

		return regions;

	}.property('regionsProps.model.regions', 'regionsProps.image', 'regionsProps.sizeObj', 'regionsProps.volumes', 'regionsProps.regionObj', 'regionsProps.distroVersion'),

	actions: {

		onSelectRegion: function(region) {
			if(this.get('onSelectRegion')) {
				this.sendAction('onSelectRegion', region);
			}
		}

	}
});
