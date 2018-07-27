import { tagName } from '@ember-decorators/component';
import { action } from '@ember-decorators/object';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import Contributor from 'ember-osf-web/models/contributor';
import Analytics from 'ember-osf-web/services/analytics';
import CurrentUser from 'ember-osf-web/services/current-user';

@tagName('')
export default class extends Component {
    @service analytics!: Analytics;
    @service currentUser!: CurrentUser;

    contributor: Contributor = this.contributor;

    get canRemove(): boolean {
        const { currentUserId } = this.currentUser;
        const isSelf = currentUserId  === this.contributor.users.get('id');

        if (!isSelf) {
            return true;
        }

        const isRegistration = this.contributor.node.get('isRegistration');

        if (!isRegistration) {
            return true;
        }

        // const currentContributor = contributors.find(contributor => contributor.users.id === currentUserId);

        // return !!currentContributor && currentContributor.permission === 'admin';

        return false;
    }

    @action
    remove() {
        //
    }

    @action
    toggleBibliographic() {
        const actionName = this.contributor.bibliographic ? 'select' : 'deselect';
        this.analytics.track('checkbox', actionName, 'Collections - Submit - Update Bibliographic');
        this.contributor.save();
        debugger;
    }
}
