import { action } from '@ember-decorators/object';
import Route from '@ember/routing/route';

export default class Discover extends Route {
    queryParams = {
        queryString: {
            replace: true,
        },
    };
    /**
     * Stub
     */
    model(): any[] {
        return [
            {
                id: 'osf',
                additionalProviders: [],
            },
            {
                id: 'test',
                additionalProviders: [],
            },
        ];
    }

    @action
    willTransition() {
        const controller = this.controllerFor('collections/discover');
        controller._clearFilters();
        controller._clearQueryString();
    }
}
