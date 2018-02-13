import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import OSFAgnosticAuthRouteMixin from 'ember-osf/mixins/osf-agnostic-auth-route';

export default class Application extends Route.extend(OSFAgnosticAuthRouteMixin) {
    private moment = service('moment');

    private beforeModel() {
        this.get('moment').setTimeZone('UTC');

        return this._super(...arguments);
    }
}

declare module '@ember/routing/route' {
    interface IRegistry {
        application: Application;
    }
}
