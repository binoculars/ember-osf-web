import Route from '@ember/routing/route';

export default class Discover extends Route {
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
}
