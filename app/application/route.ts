import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import OSFAgnosticAuthRouteMixin from 'ember-osf/mixins/osf-agnostic-auth-route';

export default class extends Route.extend(OSFAgnosticAuthRouteMixin) {
    private moment = service();

    public beforeModel(...args) {
        this.get('moment').setTimeZone('UTC');

        return this._super(...args);
    }
}
