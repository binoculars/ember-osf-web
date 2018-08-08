
import ArrayProxy from '@ember/array/proxy';
import Component from '@ember/component';
import Contributor from 'ember-osf-web/models/contributor';
import Node from 'ember-osf-web/models/node';

export default class ProjectContributors extends Component {
    node: Node = this.node;
    contributors: ArrayProxy<Contributor> = this.contributors;
}
