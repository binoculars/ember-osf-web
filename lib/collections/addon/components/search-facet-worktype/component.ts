import { action, computed } from '@ember-decorators/object';
import Component from '@ember/component';
import config from 'ember-get-config';
import defaultTo from 'ember-osf-web/utils/default-to';
import $ from 'jquery';
import { getUniqueList, termsFilter } from '../../utils/elastic-query';
import layout from './template';

interface Types {
    CreativeWork?: {
        children: any;
    };
}

/**
 * Copied from Ember-SHARE.  Type facet.
 *
 * ```handlebars
 * {{search-facet-worktype
 *      key=facet.key
 *      options=facet
 *      aggregations=aggregations
 *      state=(get facetStates facet.key)
 *      filter=(get facetFilters facet.key)
 *      onChange=(action 'facetChanged')
 * }}
 * ```
 * @class search-facet-worktype
 */

export default class SearchFacetWorktype extends Component.extend({
    init(...args: any[]) {
        // this.getTypes();
        this._super(...args);
        // this.send('setState', this.get('state'));
    },
}) {
    layout = layout;
    category = 'filter-facets';
    types: Types | null = defaultTo(this.types, null);
    state: any[] = this.state || [];
    previousState: any[] = [];
    key: any;

    getTypes(this: SearchFacetWorktype) {
        // Ember-SHARE method
        return $.ajax({
            url: `${config.OSF.shareApiUrl}/schema/creativework/hierarchy/`,
            crossDomain: true,
            type: 'GET',
            contentType: 'application/vnd.api+json',
        }).then(({ data }: { data?: any }) => {
            if (data) {
                this.set('types', data);
            }
        });
    }

    @computed('types')
    get processedTypes(): any {
        // Ember-SHARE property
        const types = this.types && this.types.CreativeWork ? this.types.CreativeWork.children : {};
        return this.transformTypes(types);
    }

    transformTypes(obj: any) {
        // Ember-SHARE method
        if (typeof (obj) !== 'object') {
            return obj;
        }

        return Object.entries(obj).reduce(
            (acc, [key, val]) => ({
                ...acc,
                [key.replace(/([A-Z])/g, ' $1').trim().toLowerCase()]: val,
            }),
            {},
        );
    }

    @computed('state')
    get selected() {
        return this.state || [];
    }

    // changed = Ember.observer('state', function() {
    //     let state = this.get('state');
    //     state = Ember.isBlank(state) ? [] : state;
    //     let previousState = this.get('previousState') || [];

    //     if (Ember.compare(previousState, state) !== 0) {
    //         let value = state || [];
    //         this.send('setState', value);
    //     }
    // });

    buildQueryObjectMatch(selected: any) {
        const value = !selected[0] ? [] : selected;

        return {
            filter: termsFilter('types', getUniqueList(value)),
            value,
        };
    }

    @action
    setState(this: SearchFacetWorktype, selected: any) {
        const { filter, value } = this.buildQueryObjectMatch(selected.length ? selected : []);
        this.set('previousState', this.state);
        this.sendAction('onChange', this.key, filter, value);
    }

    @action
    toggle(type: any) {
        this.send('setState', this.selected.includes(type) ? [] : [type]);
    }
}
