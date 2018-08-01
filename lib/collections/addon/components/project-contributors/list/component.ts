import { computed } from '@ember-decorators/object';
import { service } from '@ember-decorators/service';
import ArrayProxy from '@ember/array/proxy';
import Component from '@ember/component';
import { task } from 'ember-concurrency';
import DS from 'ember-data';
import Contributor, { Permission } from 'ember-osf-web/models/contributor';
import Node from 'ember-osf-web/models/node';
import Analytics from 'ember-osf-web/services/analytics';

export default class List extends Component {
    @service analytics!: Analytics;
    @service store!: DS.Store;

    contributors: ArrayProxy<Contributor> = this.contributors;
    node: Node = this.node;

    removeContributor = task(function *(this: List, contributor: Contributor) {
        this.analytics.track('button', 'click', 'Collections - Submit - Remove Contributor');
        yield contributor.destroyRecord();
        // It's necessary to unload the record from the store after destroying it, in case the user is added back as a
        // contributor again
        this.store.unloadRecord(contributor);
    });

    toggleBibliographic = task(function *(this: List, contributor: Contributor) {
        const actionName = `${contributor.toggleProperty('bibliographic') ? '' : 'de'}select`;
        this.analytics.track('checkbox', actionName, 'Collections - Submit - Update Bibliographic');
        yield contributor.save();
    });

    updatePermissions = task(function *(this: List, contributor: Contributor, permission: Permission) {
        this.analytics.track('option', 'select', 'Collections - Submit - Change Permission');
        contributor.setProperties({ permission });
        yield contributor.save();
    });

    /**
     * If the current user is an admin
     */
    @computed('node.currentUserPermissions')
    get isAdmin(): boolean {
        return this.node.currentUserPermissions.includes('admin');
    }

    /**
     * Number of contributors with bibliographic
     */
    @computed('contributors.@each.bibliographic')
    get bibliographicCount(): number {
        return this.contributors.reduce((acc, { bibliographic }) => acc + +bibliographic, 0);
    }

    /**
     * Number of registered admins
     */
    @computed('contributors.@each.{unregisteredContributor,permission}')
    get adminCount(): number {
        return this.contributors.reduce(
            (acc, { permission: p, unregisteredContributor: u }) => acc + +(p === Permission.admin && !u),
            0,
        );
    }
}
