import { action, computed } from '@ember-decorators/object';
import { service } from '@ember-decorators/service';
import { assert } from '@ember/debug';
import config from 'collections/config/environment';
import DS from 'ember-data';
import eatArgs from 'ember-osf-web/utils/eat-args';
import $ from 'jquery';
import Base from '../base/component';

const {
    OSF: {
        shareSearchUrl,
        url,
    },
    whiteListedProviders,
} = config;

const getProvidersPayload = JSON.stringify({
    from: 0,
    query: {
        bool: {
            must: {
                query_string: {
                    query: '*',
                },
            },
            filter: [
                {
                    bool: {
                        should: [
                            {
                                terms:
                                {
                                    types: [
                                        'preprint',
                                    ],
                                },
                            },
                            {
                                terms: {
                                    sources: [
                                        'Thesis Commons',
                                    ],
                                },
                            },
                        ],
                    },
                },
            ],
        },
    },
    aggregations: {
        sources: {
            terms: {
                field: 'sources',
                size: 200,
            },
        },
    },
});

interface ShareProviderHit {
    key: string;
    doc_count: number; // eslint-disable-line camelcase
}

/**
 * Builds preprint provider facets for discover page.
 * To be used with discover-page component and faceted-search component.
 *
 * Sample usage:
 * ```handlebars
 * {{search-facet-provider
 *      updateFilters=(action 'updateFilters')
 *      activeFilters=activeFilters
 *      options=facet
 *      filterReplace=filterReplace
 *      key=key
 * }}
 * ```
 * @class search-facet-provider
 */
export default class SearchFacetProvider extends Base.extend({
    didReceiveAttrs(this: SearchFacetProvider, ...args: any[]) {
        this._super(...args);
        this.initialize();
    },
}) {
    @service store!: DS.Store;

    activeFilter: string[] = this.activeFilter;
    osfProviders: string[] = [];
    otherProviders: ShareProviderHit[] = [];
    // allProviders
    whiteListedProviders = whiteListedProviders.map(item => item.toLowerCase());
    osfUrl = url;

    @computed('otherProviders.[]')
    get checkedProviders() {
        return this.otherProviders.filterBy('checked', true);
    }

    @computed('checkedProviders')
    get activeProviders() {
        return this.checkedProviders.mapBy('key');
    }

    @computed('otherProviders.[]', 'checkedProviders')
    get filters() {
        return [
            this.checkedProviders,
            this.otherProviders,
        ].map(item => ({
            terms: {
                sources: item.mapBy('key'),
            },
        }));
    }

    /**
     * The providers list from the API
     */
    async getProviderNames(this: SearchFacetProvider): Promise<string[]> {
        const providers = await this.store.findAll('preprint-provider');

        const providerNames = providers
            .filter(provider => provider.id !== 'livedata')
            .map(({ shareSource, name }) => {
                const n = shareSource || name;
                // TODO Change this in populate_preprint_providers script to just OSF
                return n === 'Open Science Framework' ? 'OSF' : n;
            });

        this.set('osfProviders', providerNames);

        return providerNames;
    }

    async getShareProviders(): Promise<ShareProviderHit[]> {
        const {
            aggregations: {
                sources: {
                    buckets,
                },
            },
        } = await $.ajax({
            type: 'POST',
            url: shareSearchUrl,
            data: getProvidersPayload,
            contentType: 'application/json',
            crossDomain: true,
        });

        return buckets;
    }

    async initialize(this: SearchFacetProvider) {
        const [osfProviders, hits] = await Promise.all([
            this.getProviderNames(),
            this.getShareProviders(),
        ]);

        // Get the whitelist and add the OSF Providers to it
        const whiteList = [
            ...this.whiteListedProviders,
            ...osfProviders.map(osfProvider => osfProvider.toLowerCase()),
        ];

        // Filter out providers that are not on the whitelist
        const providers = hits.filter(({ key }) => whiteList.includes(key.toLowerCase()));

        // Add the OSF Providers that are not in SHARE
        providers.push(
            ...osfProviders
                .filter(osfProvider => !providers
                    .find(({ key }) => key.toLowerCase() === osfProvider.toLowerCase()))
                .map(key => ({
                    key,
                    doc_count: 0,
                })),
        );

        // Sort the providers list add add OSF to the top
        providers
            .sort((a, b) => (a.key.toLowerCase() < b.key.toLowerCase() ? -1 : 1))
            .unshift(
                ...providers.splice(
                    providers.findIndex(({ key }) => (/^osf/i).test(key)),
                    1,
                ),
            );

        if (!this.theme.isProvider) {
            this.set('otherProviders', providers);
        } else {
            const filtered = providers
                .filter(({ key }) => key === this.theme.provider!.name);

            this.set('otherProviders', filtered);
            this.activeFilter.pushObject(filtered[0].key);
        }

        // this.notifyPropertyChange('otherProviders');
    }

    @computed('otherProviders.[]', 'activeFilter.[]')
    get providers() {
        return this.otherProviders
            .map(provider => ({
                ...provider,
                checked: this.activeFilter.includes(provider.key),
            }));
    }

    @action
    updateFilters(this: SearchFacetProvider, item: any) {
        // item.checked = !item.checked;

        // this.filterChanged('providers', this.activeProviders);
        const method = this.activeFilter.includes(item.key) ? 'removeObject' : 'pushObject';

        this.activeFilter[method](item.key);
    }

    filterChanged(key: string, providers: string[]) {
        eatArgs(key, providers);
        assert('You should pass in a closure action: filterChanged');
    }
}
