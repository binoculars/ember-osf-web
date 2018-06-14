import { action, computed } from '@ember-decorators/object';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import EmberObject from '@ember/object';
import { camelize } from '@ember/string';
import config from 'ember-get-config';
import I18N from 'ember-i18n/services/i18n';
import { singularize } from 'ember-inflector';
import Analytics from 'ember-osf-web/services/analytics';
import CurrentUser from 'ember-osf-web/services/current-user';
import defaultTo from 'ember-osf-web/utils/default-to';
import moment from 'moment';

import { debounce } from '@ember/runloop';
import Contributor from 'ember-osf-web/models/contributor';

import { encodeParams, getSplitParams, getUniqueList } from '../../utils/elastic-query';
import styles from './styles';
import layout from './template';

/**
 * @module ember-osf
 * @submodule components
 */

/**
 * Discover-page component. Builds a search interface utilizing SHARE.
 * See retraction-watch, registries, and preprints discover pages for working examples.
 *
 * Majority adapted from Ember-SHARE https://github.com/CenterForOpenScience/ember-share, with additions from PREPRINTS
 * and REGISTRIES discover pages. Original Ember-SHARE facets and PREPRINTS/REGISTRIES facets behave differently at this
 * time. You can build a discover-page that uses Ember-SHARE type facets -OR- PREPRINTS/REGISTRIES type facets.
 * Would not recommend mixing until code is combined.
 *
 * How to Use:
 * Pass in custom text like searchPlaceholder.  The facets property will enable you to customize the filters
 * on the left-hand side of the discover page. Sort options are the sort dropdown options.  The lockedParams are the
 * query parameters that are always locked in your application. Each query parameter must be passed in individually,
 * so they are reflected in the URL.  Logo and custom colors must be placed in the consuming application's stylesheet.
 * Individual components can additionally be overridden in your application.
 *
 * Sample usage:
 * ```handlebars
 * {{discover-page
 *   activeFilters=activeFilters
 *   detailRoute=detailRoute
 *   discoverHeader=discoverHeader
 *   facets=facets
 *   fetchedProviders=model
 *   filterMap=filterMap
 *   filterReplace=filterReplace
 *   lockedParams=lockedParams
 *   page=page
 *   provider=provider
 *   q=q
 *   queryParams=queryParams
 *   searchPlaceholder=searchPlaceholder
 *   showActiveFilters=showActiveFilters
 *   sortOptions=sortOptions
 *   subject=subject
 *   themeProvider=themeProvider
 * }}
 * ```
 * @class discover-page
 */

const MAX_SOURCES = 500;
const filterQueryParams = [
    'subject',
    'provider',
    'tags',
    'sources',
    'publishers',
    'funders',
    'institutions',
    'organizations',
    'language',
    'contributors',
    'type',
];

interface Filters {
    providers: string[];
    subjects: string[];
    types: string[];
}

interface Facet {
    base?: string;
    component: string;
    key: string;
    title: string;
    type?: string;
}

interface Provider {
    domain: string;
    domainRedirectEnabled: boolean;
    name: string; // eslint-disable-line no-restricted-globals
    shareSource: string;
}

interface Result {
    '@type': string;
    description: string;
    identifiers: string[];
    sources: string[];
    registration_type?: string; // eslint-disable-line camelcase
    lists: {
        contributors: any;
    };
    id: string;
    type: string;
    workType: string;
    abstract: string;
    subjects: Array<{ text: string }>;
    subject_synonyms: Array<{ text: string }>; // eslint-disable-line camelcase
    providers: Array<{ name: string }>; // eslint-disable-line no-restricted-globals
    hyperLinks: Array<{
        type?: string;
        url: string;
    }>;
    infoLinks: Array<{
        uri: string;
        type: string;
    }>;
    registrationType?: string;
    contributors: Contributor[];
}

interface Theme {
    id: string;
    provider: object;
    isProvider: boolean;
}

interface ThemeProvider {
    additionalProviders: Provider[];
    id: string;
    name: string; // eslint-disable-line no-restricted-globals
    shareSource: string;
}

interface SortOption {
    display: string;
    sortBy: string;
}

interface Source {
    '@type': string;
    description: string;
    identifiers: string[];
    subjects: string[];
    subject_synonyms: string[]; // eslint-disable-line camelcase
    sources: string[];
    type: string;
    registration_type?: string; // eslint-disable-line camelcase
    lists: {
        contributors: any;
    };
}

interface Hit {
    _id: string;
    _source: Source;
}

export default class DiscoverPage extends Component.extend({
    init(this: DiscoverPage, ...args: any[]) {
        // TODO Sort initial results on date_modified
        // Runs on initial render.
        this._super(...args);
        // this.set('firstLoad', true);
        this.set('facetFilters', EmberObject.create());
        this.getCounts();
        this.loadPage();
    },
}) {
    layout = layout;
    styles = styles;

    @service analytics!: Analytics;
    @service currentUser!: CurrentUser;
    @service theme!: Theme;
    @service i18n!: I18N;

    firstLoad: boolean = defaultTo(this.firstLoad, true);
    results: Result[] = [];

    // classNames: ['discover-page'],

    // ************************************************************
    // PROPERTIES
    // ************************************************************
    /**
     * Primary filters for service - currently setup for PREPRINTS and REGISTRIES. Ember-SHARE's equivalent is
     * facetStates.
     * @property {Object} activeFilters
     * @default { providers: [], subjects: [], types: [] }
     */
    activeFilters: Filters = defaultTo(this.activeFilters, { providers: [], subjects: [], types: [] });

    /**
     * Contributors query parameter.  If 'contributors' is one of your query params, it must be passed to the component
     * so it can be reflected in the URL.
     * @property {String} contributors
     * @default ''
     */
    contributors: string = defaultTo(this.contributors, '');

    /**
     * Name of detail route for consuming application, like 'content' or 'detail'. Override if search result title
     * should link to detail route.
     * @property {String} detailRoute
     */
    detailRoute = null;

    /**
     * Text header for top of discover page.
     * @property {String} discoverHeader
     */
    discoverHeader: string = defaultTo(this.discoverHeader, '');

    /**
     * End query parameter.  If 'end' is one of your query params, it must be passed to the component so it can be
     * reflected in the URL.
     * @property {String} end
     * @default ''
     */
    end = '';

    /**
     * A list of the components to be used for the search facets.  Each list item should be a dictionary including the
     * key (SHARE filter), title (search-facet heading in UI), and component (name of component).
     * @property {Array} facets
     * @default [
     *       { key: 'sources', title: 'Source', component: 'search-facet-source' },
     *       { key: 'date', title: 'Date', component: 'search-facet-daterange' },
     *       { key: 'type', title: 'Type', component: 'search-facet-worktype', data: this.get('processedTypes') },
     *       { key: 'tags', title: 'Tag', component: 'search-facet-typeahead' },
     *       { key: 'publishers', title: 'Publisher', component: 'search-facet-typeahead', base: 'agents',
     *          type: 'publisher' },
     *       { key: 'funders', title: 'Funder', component: 'search-facet-typeahead', base: 'agents', type: 'funder' },
     *       { key: 'language', title: 'Language', component: 'search-facet-language' },
     *       { key: 'contributors', title: 'People', component: 'search-facet-typeahead', base: 'agents',
     *          type: 'person' }
     *   ]
     */
    facets: Facet[] = defaultTo(this.facets, [
        ['sources', 'source', 'source'],
        ['date', 'date', 'daterange'],
        ['type', 'type', 'worktype'],
        ['tags', 'tag', 'typeahead'],
        ['publishers', 'publisher', 'typeahead', 'agents', 'publisher'],
        ['funders', 'funder', 'typeahead', 'agents', 'funder'],
        ['language', 'language', 'language'],
        ['contributors', 'people', 'agents', 'person'],
    ].map(([key, tKey, component, base, type]) => ({
        base,
        component: `search-facet-${component}`,
        key,
        title: this.i18n.t(`eosf.components.discoverPage.${tKey}`),
        type,
    })));

    facetFilters = {};

    /**
     * For PREPRINTS ONLY.  Pass in the providers fetched in preprints app so they can be used in the provider carousel
     * @property {Object} fetchedProviders
     */
    fetchedProviders: Provider[] = [];

    @computed('fetchedProviders.[]')
    get domainRedirectProviders(): string[] {
        return this.fetchedProviders
            .filter(({ domain, domainRedirectEnabled }) => domain && domainRedirectEnabled)
            .map(({ domain }) => domain);
    }

    /**
     * For PREPRINTS and REGISTRIES. A mapping of activeFilters to facet names expected by SHARE.
     * Ex. {'providers': 'sources'}
     * @property {Object} filterMap
     */
    filterMap = {};

    /**
     * For PREPRINTS and REGISTRIES. A mapping of filter names for front-end display. Ex. {OSF: 'OSF Preprints'}.
     * @property {Object} filterReplace
     */
    filterReplace = {};

    /**
     * Funders query parameter. If 'funders' is one of your query params, it must be passed to the component so it can
     * be reflected in the URL.
     * @property {String} funders
     * @default ''
     */
    funders = '';

    /**
     * Institutions query parameter. If 'institutions' is one of your query params, it must be passed to the component
     * so it can be reflected in the URL.
     * @property {String} institutions
     * @default ''
     */
    institutions = '';

    /**
     * Language query parameter. If 'language' is one of your query params, it must be passed to the component so it
     * can be reflected in the URL.
     * @property {String} language
     * @default ''
     */
    language = '';

    loading: boolean = defaultTo(this.loading, true);

    /**
     * Locked portions of search query that user cannot change.  Example: {'sources': 'PubMed Central'} will make PMC a
     * locked source.
     * @property {Object} lockedParams
     */
    lockedParams = {};
    numberOfEvents = 0;
    numberOfResults = 0; // Number of search results returned
    numberOfSources = 0; // Number of sources

    /**
     * Organizations query parameter.  If 'organizations' is one of your query params, it must be passed to the
     * component so it can be reflected in the URL.
     * @property {String} organizations
     * @default ''
     */
    organizations = '';

    /**
     * Page query parameter.  If 'page' is one of your query params, it must be passed to the component so it can be
     * reflected in the URL.
     * @property {Integer} page
     * @default 1
     */
    page = 1;

    /**
     * Provider query parameter.  If 'provider' is one of your query params, it must be passed to the component so it
     * can be reflected in the URL.
     * @property {String} provider
     * @default ''
     */
    provider = '';

    /**
     * Publishers query parameter.  If 'publishers' is one of your query params, it must be passed to the component so
     * it can be reflected in the URL.
     * @property {String} publishers
     * @default ''
     */
    publishers = '';

    /**
     * q query parameter.  If 'q' is one of your query params, it must be passed to the component so it can be
     * reflected in the URL.
     * @property {String} q
     * @default ''
     */
    q = '';

    /**
     * Declare on consuming application's controller for query params to be active in that route.
     * @property {Array} queryParams
     */
    queryParams = ['q', 'start', 'end', 'sort', 'page', ...filterQueryParams];

    // results: Ember.ArrayProxy.create({ content: [] }), // Results from SHARE query

    /**
     * For PREPRINTS and REGISTRIES.  Displays activeFilters box above search facets.
     */
    showActiveFilters: boolean = defaultTo(this.showActiveFilters, false);
    showLuceneHelp: boolean = false; // Is Lucene Search help modal open?

    /**
     * Size query parameter.  If 'size' is one of your query params, it must be passed to the component so it can be
     * reflected in the URL.
     * @property {Integer} size
     * @default 10
     */
    size = 10;

    /**
     * Sort query parameter.  If 'sort' is one of your query params, it must be passed to the component so it can be
     * reflected in the URL.
     * @property {String} sort
     * @default ''
     */
    sort = '';

    /**
     * Sort dropdown options - Array of dictionaries.  Each dictionary should have display and sortBy keys.
     * @property {Array} sortOptions
     */
    // TODO: i18n-ize
    sortOptions: SortOption[] = [ // defaultTo(this.sortOptions, [
        ['Relevance', ''],
        ['Date Updated (Desc)', '-date_updated'],
        ['Date Updated (Asc)', 'date_updated'],
        ['Ingest Date (Asc)', 'date_created'],
        ['Ingest Date (Desc)', '-date_created'],
    ].map(([display, sortBy]) => ({ display, sortBy })); // );

    @computed('sort', 'sortOptions')
    get sortDisplay(): string {
        const sortOption = this.sortOptions.find(({ sortBy }) => this.sort === sortBy);

        return sortOption ? sortOption.display : '';
    }

    /**
     * Sources query parameter.  If 'sources' is one of your query params, it must be passed to the component so it can
     * be reflected in the URL.
     * @property {String} sources
     * @default ''
     */
    sources = '';

    /**
     * Start query parameter.  If 'start' is one of your query params, it must be passed to the component so it can be
     * reflected in the URL.
     * @property {String} start
     * @default ''
     */
    start = '';

    /**
     * Subject query parameter.  If 'subject' is one of your query params, it must be passed to the component so it can
     * be reflected in the URL.
     * @property {String} subject
     * @default ''
     */
    subject = '';

    /**
     * Tags query parameter.  If 'tags' is one of your query params, it must be passed to the component so it can be
     * reflected in the URL.
     * @property {String} tags
     * @default ''
     */
    tags = '';

    /**
     * themeProvider
     * @property {Object} Preprint provider loaded from theme service. Should be passed from consuming service so it is
     * loaded before SHARE is queried.
     * @default ''
     */
    themeProvider: ThemeProvider = this.themeProvider;

    took = 0;

    /**
     * type query parameter.  If 'type' is one of your query params, it must be passed to the component so it can be
     * reflected in the URL.
     * @property {String} type
     * @default ''
     */
    type = '';

    displayQueryBody: { query?: string } = {};
    queryBody: {} = {};
    aggregations: any;
    whiteListedProviders: string[] = defaultTo(this.whiteListedProviders, []);
    queryError: boolean = false;
    shareDown: boolean = false;

    // ************************************************************
    // COMPUTED PROPERTIES and OBSERVERS
    // ************************************************************

    // TODO update this property if a solution is found for the elastic search limitation.
    // Ticket: SHARE-595
    @computed('totalPages', 'size')
    get clampedPages() {
        // Total pages of search results, unless total is greater than the max pages allowed.
        const maxPages = Math.ceil(10000 / this.size);
        return this.totalPages < maxPages ? this.totalPages : maxPages;
    }

    // Ember-SHARE property.
    elasticAggregations = {
        sources: {
            terms: {
                field: 'sources',
                size: MAX_SOURCES,
            },
        },
    };

    // Ember-SHARE property.  Watches query params in URL and modifies facetStates
    @computed(...filterQueryParams, 'end', 'start')
    get facetStates(): any {
        return {
            ...filterQueryParams.reduce((acc: any, val: keyof DiscoverPage) => ({ ...acc, [val]: this[val] }), {}),
            date: {
                start: this.start,
                end: this.end,
            },
        };
    }

    // Modified when query params in URL change.
    @computed('facetStates')
    get facetStatesArray() {
        return Object.entries(this.facetStates)
            .map(([key, value]) => ({ key, value }));
    }

    // Ember-SHARE property. Returns pages of hidden search results.
    @computed('clampedPages', 'totalPages')
    get hiddenPages() {
        return this.totalPages === this.clampedPages ? null : this.totalPages - this.clampedPages;
    }

    // providerChanged: Ember.on('init', Ember.observer('provider', function() {
    //     // For PREPRINTS and REGISTRIES - watches provider query param for changes and modifies activeFilters
    //     let filter = this.get('provider');
    //     if (!filter || filter === 'true' || typeof filter === 'object') return;
    //     if (!this.get('theme.isProvider')) {
    //         this.setActiveFiltersAndReload('activeFilters.providers', filter.split('OR'));
    //     }
    // }))

    // reloadSearch: Ember.observer('activeFilters.providers.@each',
    //         'activeFilters.subjects.@each', 'activeFilters.types.@each', function() {
    //     // For PREPRINTS and REGISTRIES.  Reloads page if activeFilters change.
    //     this.set('page', 1);
    //     this.loadPage();
    // }),

    @computed('currentUser.sessionKey')
    get searchUrl() {
        // Pulls SHARE search url from config file.
        return `${config.OSF.shareSearchUrl}?preference=${this.currentUser.sessionKey}`;
    }

    // subjectChanged: Ember.on('init', Ember.observer('subject', function() {
    //     // For PREPRINTS - watches subject query param for changes and modifies activeFilters
    //     let filter = this.get('subject');
    //     if (!filter || filter === 'true' || typeof filter === 'object') return;
    //     this.setActiveFiltersAndReload('activeFilters.subjects', filter.split('OR'));
    // })),
    // typeChanged: Ember.on('init', Ember.observer('type', function() {
    //     // For REGISTRIES - watches type query param for changes and modifies activeFilters
    //     let filter = this.get('type');
    //     if (!filter || filter === 'true' || typeof filter === 'object') return;
    //     this.setActiveFiltersAndReload('activeFilters.types', filter.split('OR'));
    // })),

    // Total pages of search results
    @computed('numberOfResults', 'size')
    get totalPages(): number {
        return Math.ceil(this.numberOfResults / this.size);
    }

    // ************************************************************
    // Discover-page METHODS and HOOKS
    // ************************************************************

    /**
     * For PREPRINTS, REGISTRIES, RETRACTION WATCH - services where portion of query is restricted.
     * Builds the locked portion of the query.  For example, in preprints, types=['preprint', 'thesis']
     * is something that cannot be modified by the user.
     *
     * @method buildLockedQueryBody
     * @param {Object} lockedParams - Locked param keys matched to the locked value.
     * @return {Object} queryBody - locked portion of query body
     */
    buildLockedQueryBody(lockedParams: object): Array<string | object> {
        return Object.entries(lockedParams)
            .map(([key, value]) => {
                let queryKey: string;

                switch (key) {
                case 'contributors':
                    queryKey = 'lists.contributors.name';
                    break;
                default:
                    queryKey = key;
                }

                const query = {
                    [queryKey]: value,
                };

                return key === 'bool' ? query : { terms: query };
            });
    }

    async getCounts(this: DiscoverPage) {
        // Ember-SHARE method
        const { hits, aggregations }: any = await $.ajax({
            url: this.searchUrl,
            crossDomain: true,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                size: 0,
                aggregations: {
                    sources: {
                        cardinality: {
                            field: 'sources',
                            precision_threshold: MAX_SOURCES,
                        },
                    },
                },
            }),
        });

        this.setProperties({
            numberOfEvents: hits.total,
            numberOfSources: aggregations.sources.value,
        });
    }

    getQueryBody(this: DiscoverPage): any {
        return this.set('queryBody',
            { 'query': { 'bool': { 'must': { 'query_string': { 'query': '*' } }, 'filter': [{ 'bool': { 'should': [{ 'terms': { 'types': ['preprint'] } }, { 'terms': { 'sources': ['Thesis Commons'] } }] } }, { 'terms': { 'sources': ['OSF', 'AgriXiv', 'BITSS', 'EarthArXiv', 'ecsarxiv', 'ECSarXiv', 'ECSarXiv2', 'engrXiv', 'Experimental Protocols', 'FocUS Archive', 'INA-Rxiv', 'LawArXiv', 'LawArXiv', 'LIS Scholarship Archive', 'MarbrXiv', 'MarXiv', 'MedArXiv', 'MindRxiv', 'NutriXiv', 'PaleorXiv', 'PsyArXiv', 'Research AZ', 'SciELO', 'SocArXiv', 'SportRxiv', 'Thesis Commons', 'arXiv', 'bioRxiv', 'Cogprints', 'PeerJ', 'Research Papers in Economics', 'Preprints.org'] } }] } }, 'from': 0, 'aggregations': { 'sources': { 'terms': { 'field': 'sources', 'size': 500 } } } });
    }

    getQueryBody1(this: DiscoverPage): any {
        /**
         * Builds query body to send to SHARE from a combination of locked Params, facetFilters and activeFilters
         *
         * @method getQueryBody
         * @return queryBody
         */
        // From Ember-SHARE. Looks at facetFilters (partial SHARE queries already built) and adds them to query body

        const filters = [
            ...this.buildLockedQueryBody(this.lockedParams),
            ...Object.values(this.facetFilters as object)
                .filter(item => !!item)
                .reduce((acc: string[], val) => acc.concat(Array.isArray(val) ? val : [val]), []),
            // For PREPRINTS and REGISTRIES.  Adds activeFilters to query body.
            ...Object.entries(this.filterMap)
                .map(([key, val]: [string, string]) => {
                    const filterList = this.activeFilters[key as 'providers' | 'subjects' | 'types'];

                    this.set(key as keyof DiscoverPage, filterList.join('OR'));

                    if (!filterList.length || (key === 'providers' && this.theme.isProvider)) {
                        return {};
                    }

                    return val === 'subjects' ?
                        {
                            bool: {
                                should: filterList.map(filter => ({
                                    match: {
                                        [val]: filter,
                                    },
                                })),
                            },
                        } :
                        {
                            terms: {
                                [val]: filterList,
                            },
                        };
                }),
        ];

        // For PREPRINTS and REGISTRIES. If theme.isProvider, add provider(s) to query body
        if (this.themeProvider) {
            // Regular preprint providers will have their search results restricted to the one provider.
            // If the provider has additionalProviders, all of these providers will be added to the 'sources' SHARE
            // query

            let sources: any[] = [];
            if (this.theme.isProvider) {
                sources = (this.themeProvider!.additionalProviders || []).length ?
                    this.themeProvider.additionalProviders :
                    [this.themeProvider.shareSource || this.themeProvider.name];
            } else if (this.themeProvider.id === 'osf') {
                sources = [
                    this.themeProvider.shareSource || 'OSF',
                    ...this.fetchedProviders
                        .map(provider => provider.shareSource || provider.name),
                    ...(this.whiteListedProviders || []),
                ];
            }

            filters.push({
                terms: {
                    sources,
                },
            });
        }

        let query: any = {
            query_string: {
                query: this.q || '*',
            },
        };

        if (filters.length) {
            query = {
                bool: {
                    must: query,
                    filter: filters,
                },
            };
        }

        const queryBody: any = {
            query,
            from: (this.page - 1) * this.size,
        };

        if (this.get('sort')) {
            queryBody.sort = {
                [this.sort.replace(/^-/, '')]: this.sort[0] === '-' ? 'desc' : 'asc',
            };
        }

        if (this.page === 1 || this.firstLoad) {
            queryBody.aggregations = this.get('elasticAggregations');
        }

        this.set('displayQueryBody', { query });

        return this.set('queryBody', queryBody);
    }

    async loadPage(this: DiscoverPage) {
        const data = JSON.stringify(this.getQueryBody());

        this.set('loading', true);

        try {
            const json = await $.ajax({
                url: this.searchUrl,
                crossDomain: true,
                type: 'POST',
                contentType: 'application/json',
                data,
            });

            if (this.isDestroyed || this.isDestroying) {
                return;
            }

            // Safeguard: if query has changed since request was sent, dont update results
            // if (this.queryBody !== JSON.stringify(this.getQueryBody())) {
            //     return;
            // }

            const results = (json.hits.hits as Hit[]).map(hit => {
                // HACK: Make share data look like apiv2 preprints data
                const result: Result = {
                    ...hit._source,
                    id: hit._id,
                    type: 'elastic-search-result',
                    workType: hit._source['@type'],
                    abstract: hit._source.description,
                    subjects: hit._source.subjects.map(text => ({ text })),
                    subject_synonyms: hit._source.subject_synonyms.map(text => ({ text })),
                    providers: hit._source.sources.map(name => ({ name })), // For PREPRINTS, REGISTRIES
                    hyperLinks: [// Links that are hyperlinks from hit._source.lists.links
                        {
                            type: 'share',
                            url: `${config.OSF.shareBaseUrl}${hit._source.type.replace(/ /g, '')}/hit._id`,
                        },
                    ],
                    infoLinks: [], // Links that are not hyperlinks  hit._source.lists.links
                    registrationType: hit._source.registration_type, // For REGISTRIES
                    contributors: (hit._source.lists.contributors || [])
                        .sort((b: any, a: any) => +b.order_cited - +a.order_cited)
                        .map((contributor: any) => ({
                            users: Object.entries(contributor)
                                .reduce(
                                    (acc, [key, val]) => ({ ...acc, [camelize(key)]: val }),
                                    { bibliographic: contributor.relation !== 'contributor' },
                            )}),
                        ),
                };

                hit._source.identifiers.forEach(identifier => {
                    if (identifier.startsWith('http://')) {
                        result.hyperLinks.push({ url: identifier });
                    } else {
                        const [type, uri] = identifier.split('://');
                        result.infoLinks.push({ type, uri });
                    }
                });

                // Temporary fix to handle half way migrated SHARE ES
                // Only false will result in a false here.
                // result.contributors
                // .map(contributor => contributor.users.bibliographic = !(contributor.users.bibliographic === false));

                return result;
            });

            if (json.aggregations) {
                this.set('aggregations', json.aggregations);
            }

            this.setProperties({
                numberOfResults: json.hits.total,
                took: moment.duration(json.took).asSeconds(),
                loading: false,
                firstLoad: false,
                results,
                queryError: false,
                shareDown: false,
            });

            if (this.get('totalPages') && this.get('totalPages') < this.get('page')) {
                this.search();
            }
        } catch (errorResponse) {
            this.setProperties({
                loading: false,
                firstLoad: false,
                numberOfResults: 0,
                results: [],
            });

            // If issue with search query, for example, invalid lucene search syntax
            this.set(errorResponse.status === 400 ? 'queryError' : 'shareDown', true);
        }
    }

    scrollToResults() {
        // Scrolls to top of search results
        this.$('html, body').scrollTop(this.$('.results-top').position().top);
    }

    search(this: DiscoverPage): void {
        if (!this.firstLoad) {
            this.set('page', 1);
        }

        this.setProperties({
            loading: true,
            results: [],
        });

        debounce(this, this.loadPage, 500);
    }

    // setActiveFiltersAndReload(activeFilterName, proposedFilters) {
    //     // If activeFilter is not equal to proposedFilter, update the activeFilter and reload search
    //     const currentFilters = this.get(activeFilterName);

    //     if (Ember.compare(currentFilters, proposedFilters) !== 0) {
    //         this.set(activeFilterName, proposedFilters);
    //         this.loadPage();
    //     }
    // }

    trackDebouncedSearch() {
        // For use in tracking debounced search of registries in Keen and GA
        this.analytics.track('input', 'onkeyup', 'Discover - Search', this.q);
    }

    @action
    addFilter(this: DiscoverPage, type: keyof DiscoverPage, filterValue: string) {
        // Ember-SHARE action. Used to add filter from the search results.
        this.set(type, encodeParams(getUniqueList([
            filterValue,
            ...(getSplitParams(this.type) || []),
        ])));
    }

    @action
    clearFilters(this: DiscoverPage) {
        // Clears facetFilters for SHARE-type facets
        this.set('facetFilters', EmberObject.create());

        this.setProperties({
            start: '',
            end: '',
            sort: '',
            ...filterQueryParams.reduce((acc, val) => ({ ...acc, [val]: '' }), {} as any),
        });

        this.search();

        // For PREPRINTS and REGISTRIES. Clears activeFilters.
        const restoreActiveFilters = Object.entries(this.activeFilters)
            .reduce((acc, [key, val]) => ({
                ...acc,
                [key]: (key === 'providers' && this.theme.isProvider) ? val : [],
            }), {} as Filters);

        this.set('activeFilters', restoreActiveFilters);
        this.analytics.track('button', 'click', 'Discover - Clear Filters');
    }

    @action
    filtersChanged() {
        // Ember SHARE action. Fired in faceted-search component when Ember-SHARE facets are modified.
        this.search();
    }

    @action
    loadPageAction(this: DiscoverPage, newPage: number, scrollUp = true) {
        if (newPage === this.page || newPage < 1 || newPage > this.totalPages) {
            return;
        }

        this.set('page', newPage);

        if (scrollUp) {
            this.scrollToResults();
        }

        this.loadPage();
    }

    // @action
    // modifyRegistrationType(filter, query) {
    //     // For REGISTRIES only - modifies 'type' query param if 'provider' query param changes.
    //     // Registries are unusual, since the OSF Registration Type facet depends upon the Providers facet
    //     if (filter === 'provider' && this.get('hostAppName') === 'Registries') {
    //         if (query.length === 1 && query[0] === 'OSF') {
    //             this.set('type', this.get('activeFilters.types').join('OR'));
    //         } else {
    //             this.set('type', '');
    //             this.set('activeFilters.types', []);
    //         }
    //     }
    // }

    @action
    removeFilter(this: DiscoverPage, type: keyof DiscoverPage, filterValue: string) {
        // Ember-SHARE action. Could be used to remove filters in Active Filters box (when Ember-SHARE and
        // PREPRINTS/REGISTRIES code here is integrated)
        const currentValue = getSplitParams(this[type]) || [];
        const index = currentValue.indexOf(filterValue);

        if (index > -1) {
            currentValue.splice(index, 1);
        }

        this.set(type, currentValue.length ? encodeParams(currentValue) : '');
        // this.get('facetFilters');
    }

    @action
    searchAction() {
        // Only want to track search here when button clicked. Keypress search tracking is debounced in trackSearch
        this.analytics.track('button', 'click', 'Discover - Search', this.q);
        this.search();
    }

    @action
    selectSortOption(this: DiscoverPage, option: string) {
        // Runs when sort option changed in dropdown
        this.set('sort', option);
        this.analytics.track('dropdown', 'select', `Sort by: ${option || 'relevance'}`);
        this.search();
    }

    @action
    setLoadPage(this: DiscoverPage, pageNumber: number, scrollUp: boolean = true) {
        // Adapted from PREPRINTS for pagination. When paginating, sets page and scrolls to top of results.
        this.set('page', pageNumber);

        if (scrollUp) {
            this.scrollToResults();
        }

        this.loadPage();
    }

    @action
    toggleShowLuceneHelp() {
        // Toggles display of Lucene Search help modal
        this.toggleProperty('showLuceneHelp');
    }

    @action
    updateFilters(this: DiscoverPage, filterType: keyof Filters, filterItem: string | { text: string }) {
        // For PREPRINTS and REGISTRIES.  Modifies activeFilters.
        const item = typeof filterItem === 'object' ? filterItem.text : filterItem;
        const filters = this.activeFilters[filterType];
        const hasItem = filters.includes(item);

        filters[hasItem ? 'removeObject' : 'pushObject'](item);

        // this.set(`activeFilters.${filterType}`, filters);
        this.send('updateQueryParams', filterType, filters);

        this.analytics.track(
            'filter',
            hasItem ? 'remove' : 'add',
            `Discover - ${filterType} ${item}`,
        );
    }

    @action
    updateParams(this: DiscoverPage, key: string, value: any) {
        // Ember SHARE action. Updates query params in URL.
        if (key === 'date') {
            this.setProperties({
                start: value.start,
                end: value.end,
            });

            return;
        }

        this.set(key as keyof DiscoverPage, value ? encodeParams(value) : '');
    }

    @action
    updateQueryParams(this: DiscoverPage, pluralFilter: string, query: string[]) {
        // For PREPRINTS and REGISTRIES.  Used to modify query parameters in URL when activeFilters change.
        const filter = singularize(pluralFilter);

        if (pluralFilter !== 'providers' || !this.theme.isProvider) {
            this.set(filter as keyof DiscoverPage, query.join('OR'));
            // this.send('modifyRegistrationType', filter, query);
        }
    }
}
