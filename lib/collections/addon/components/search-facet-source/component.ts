import { computed } from '@ember-decorators/object';
import { service } from '@ember-decorators/service';
import I18N from 'ember-i18n/services/i18n';
import TypeaheadComponent from '../search-facet-typeahead/component';
import layout from './template';

interface Aggregations {
    sources: {
        buckets: any[];
    };
}

/**
 * Copied from Ember-SHARE.  Sources facet. Uses C3 charts.
 *
 * ```handlebars
 * {{search-facet-source
 *      key=facet.key
 *      options=facet
 *      aggregations=aggregations
 *      state=(get facetStates facet.key)
 *      filter=(get facetFilters facet.key)
 *      onChange=(action 'facetChanged')
 * }}
 * ```
 * @class search-facet-source
 */
export default class SearchFacetSource extends TypeaheadComponent {
    layout = layout;

    @service c3!: any;
    @service i18n!: I18N;

    donut: any;
    aggregations: Aggregations = this.aggregations;

    @computed('aggregations')
    get sourcesList(): any[] {
        return (this.aggregations.sources.buckets || [])
            .map(({ key }) => key);
    }

    // dataChanged: Ember.observer('aggregations', function() {
    //     let data = this.get('aggregations.sources.buckets');
    //     this.updateDonut(data);
    // }),

    updateDonut(data: any[]) {
        const columns = data.map(({ key, doc_count }) => [key, doc_count]); // eslint-disable-line camelcase
        const title = columns.length + (columns.length === 1 ?
            ` ${this.i18n.t('eosf.components.searchFacetSource.source')}` :
            ` ${this.i18n.t('eosf.components.searchFacetSource.sources')}`);

        if (!this.donut) {
            this.initDonut(title, columns);
            return;
        }

        this.donut.load({
            columns,
            unload: true,
        });

        this.$('.c3-chart-arcs-title').text(title);
    }

    initDonut(this: SearchFacetSource, title: string, columns: any) {
        const element = this.$('.donut').get(0);

        const donut = c3.generate({
            bindto: element,
            data: {
                columns,
                type: 'donut',
                onclick: (d: any) => {
                    const selected = this.get('selected');

                    if (!selected.includes(d.name)) {
                        this.send('changeFilter', [d.name, ...selected]);
                    }
                },
            },
            legend: { show: false },
            donut: {
                title,
                label: {
                    show: false,
                },
            },
            size: { height: 200 },
        });

        this.set('donut', donut);
    }
}

declare global {
    export const c3: any;
}
