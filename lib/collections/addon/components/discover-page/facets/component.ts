// import { action } from '@ember-decorators/object';
import Component from '@ember/component';
import styles from './styles';
import layout from './template';

import { Filters } from '../component';
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
    styles = styles;
    filters: any = {};

    activeFilters: Filters = this.activeFilters;

    // facetChanged(key: string, facet: string, value: string) {
    //     this.filters[key] = facet;
    //     this.sendAction('updateParams', key, value);
    //     this.sendAction('onChange', this.filters);
    // }
}
