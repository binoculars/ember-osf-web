
// import { action } from '@ember-decorators/object';
// import { /*alias,*/ computed } from '@ember-decorators/object';
import { service } from '@ember-decorators/service';
import Component from '@ember/component';
// import { task } from 'ember-concurrency';
import DS from 'ember-data';
// import Contributor from 'ember-osf-web/models/contributor';
// import Provider from 'ember-osf-web/models/provider';
import Node from 'ember-osf-web/models/node';
import Analytics from 'ember-osf-web/services/analytics';
import Theme from 'ember-osf-web/services/theme';

// import defaultTo from 'ember-osf-web/utils/default-to';

export default class ProjectContributors extends Component.extend({
    didReceiveAttrs(this: ProjectContributors, ...args: any[]) {
        this._super(...args);

        // console.log(this.contributors, this.node);

        // debugger;
    },
}) {
    @service analytics!: Analytics;
    @service store!: DS.Store;
    @service theme!: Theme;

    node: Node = this.node;

    // contributors: Contributor[] = this.contributors;

    // @computed('node')
}
