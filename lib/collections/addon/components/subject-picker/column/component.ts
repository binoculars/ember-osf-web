import { classNames } from '@ember-decorators/component';
import { computed } from '@ember-decorators/object';
import { sort } from '@ember-decorators/object/computed';
import Component from '@ember/component';
import defaultTo from 'ember-osf-web/utils/default-to';

@classNames('col-md-4')
export default class Column extends Component {
    sortDefinition = ['text:asc'];
    filterText: string = defaultTo(this.filterText, '');
    selection: any[] = this.selection;
    subjects: any[] = this.subjects;

    @computed('subjects.[]', 'filterText')
    get subjectsFiltered() {
        const filterTextLowerCase = this.filterText.toLowerCase();

        if (!filterTextLowerCase) {
            return this.subjects;
        }

        return this.subjects.filter(({ text }) => text.toLowerCase().includes(filterTextLowerCase));
    }

    @sort('subjectsFiltered', 'sortDefinition') subjectsSorted!: any[];
}
