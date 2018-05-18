import { action } from '@ember-decorators/object';
import Component from '@ember/component';
import layout from './template';

/**
 * Copied from Ember-SHARE. Passing in a few properties from preprints.
 * Loops through all the facets and displays them on the left hand pane of the Discover page.
 *
 * ```handlebars
 * {{faceted-search
 *      onChange='filtersChanged'
 *      updateParams='updateParams'
 *      filters=facetFilters
 *      facetStates=facetStates
 *      facets=facets
 *      aggregations=aggregations
 *      activeFilters=activeFilters
 *      updateFilters=(action 'updateFilters')
 *      filterReplace=filterReplace
 * }}
 * ```
 * @class faceted-search
 */
export default class FacetedSearch extends Component {
    layout = layout;
    filters: any = {};

    @action
    facetChanged(key: string, facet: string, value: string) {
        this.filters[key] = facet;
        this.sendAction('updateParams', key, value);
        this.sendAction('onChange', this.filters);
    }
}
