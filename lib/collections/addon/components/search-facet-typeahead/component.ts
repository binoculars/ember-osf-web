import { action, computed } from '@ember-decorators/object';
import Component from '@ember/component';
import { debounce } from '@ember/runloop';
import { isBlank } from '@ember/utils';
import config from 'ember-get-config';
import defaultTo from 'ember-osf-web/utils/default-to';
import $ from 'jquery';
import { getUniqueList, termsFilter } from '../../utils/elastic-query';
import layout from './template';

interface Options {
    base?: string;
    type?: string;
}

interface Response {
    hits: {
        hits: Hit[];
    };
}

interface Hit {
    _source: {
        name: string; // eslint-disable-line no-restricted-globals
    };
}

/**
 * Copied from Ember-SHARE.  Typeahead facet - used for items like organization, tags, people filter.
 *
 * ```handlebars
 * {{search-facet-typeahead
 *      key=facet.key
 *      options=facet
 *      aggregations=aggregations
 *      state=(get facetStates facet.key)
 *      filter=(get facetFilters facet.key)
 *      onChange=(action 'facetChanged')
 * }}
 * ```
 * @class search-facet-typeahead
 */
const RESULTS = 20;

export default class SearchFacetTypeahead extends Component.extend({
    init(...args: any[]) {
        this._super(...args);
        // this.send('changeFilter', this.state);
    },
}) {
    layout = layout;

    key: string = defaultTo(this.key, '');
    options: Options = defaultTo(this.options, {});
    state: string[] = defaultTo(this.state, []);
    previousState!: string[];

    @computed()
    get filterType() {
        return termsFilter;
    }

    // placeholder: Ember.computed(function() {
    //     return 'Add ' + this.get('options.title') + ' filter';
    // }),

    @computed('state')
    get selected() {
        return this.state;
    }

    // changed: Ember.observer('state', function() {
    //     let state = Ember.isBlank(this.get('state')) ? [] : this.get('state');
    //     let previousState = this.get('previousState') || [];

    //     if (Ember.compare(previousState, state) !== 0) {
    //         let value = this.get('state');
    //         this.send('changeFilter', value ? value : []);
    //     }
    // }),

    buildQueryObjectMatch(selected: any): any {
        const value = !selected[0] ? [] : selected;

        return {
            filter: this.filterType(this.key, getUniqueList(value)),
            value,
        };
    }

    handleTypeaheadResponse(response: Response) {
        return getUniqueList(response.hits.hits.map((next: Hit) => next._source.name));
    }

    typeaheadQueryUrl() {
        const base = this.options.base || this.key;

        return `${config.OSF.shareApiUrl}/search/${base}/_search`;
    }

    buildTypeaheadQuery(text: string) {
        const match = {
            match: {
                'name.autocomplete': {
                    query: text,
                    operator: 'and',
                    fuzziness: 'AUTO',
                },
            },
        };

        const { type } = this.options;

        if (type) {
            return {
                size: RESULTS,
                query: {
                    bool: {
                        must: [match],
                        filter: [{ term: { types: type } }],
                    },
                },
            };
        }

        return { size: RESULTS, query: match };
    }

    _performSearch(term: string, resolve: any, reject: any) {
        if (isBlank(term)) {
            return [];
        }

        return $.ajax({
            url: this.typeaheadQueryUrl(),
            crossDomain: true,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(this.buildTypeaheadQuery(term)),
        })
            .then(this.handleTypeaheadResponse)
            .then(resolve)
            .catch(reject);
    }

    @action
    changeFilter(this: SearchFacetTypeahead, selected: any) {
        const { filter, value } = this.buildQueryObjectMatch(selected);
        this.set('previousState', this.state);
        this.sendAction('onChange', this.key, filter, value);
    }

    // TODO: use ember-concurrency
    @action
    elasticSearch(term: string) {
        return new Promise((resolve, reject) => {
            debounce(this, this._performSearch, term, resolve, reject, 250);
        });
    }
}
