import { tagName } from '@ember-decorators/component';
import { computed } from '@ember-decorators/object';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
import Contributor, { permissions } from 'ember-osf-web/models/contributor';
import CurrentUser from 'ember-osf-web/services/current-user';

export type HighlightableContributor = Contributor & { highlightClass: '' | 'success' | 'failure' };

@tagName('')
export default class Item extends Component {
    @service currentUser!: CurrentUser;

    permissions = permissions;
    contributor: HighlightableContributor = this.contributor;
    isAdmin: boolean = this.isAdmin;
    adminCount: number = this.adminCount;
    bibliographicCount: number = this.bibliographicCount;

    @computed('currentUser.currentUserId', 'contributor.users.id')
    get isSelf() {
        return this.currentUser.currentUserId === this.contributor.users.get('id');
    }

    @computed('isAdmin', 'isSelf')
    get canChangePermissions() {
        return this.isAdmin && !this.isSelf;
    }

    @computed('isAdmin', 'bibliographicCount', 'contributor.bibliographic')
    get canChangeBibliographic(): boolean {
        return this.isAdmin && this.bibliographicCount > +this.contributor.bibliographic;
    }

    @computed('isAdmin', 'isSelf', 'contributor.node.isRegistration')
    get canRemove(): boolean {
        return this.isAdmin && !this.isSelf && !this.contributor.node.get('isRegistration');
    }
}
