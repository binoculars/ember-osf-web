import { tagName } from '@ember-decorators/component';
import { action, computed } from '@ember-decorators/object';
import Component from '@ember/component';
import { localClassName, localClassNames } from 'ember-osf-web/decorators/css-modules';
import defaultTo from 'ember-osf-web/utils/default-to';

@tagName('section')
@localClassNames('Component')
export default class SubmitSection extends Component {
    tPrefix: string = defaultTo(this.tPrefix, 'collections.submit.');
    titleKey: string = this.titleKey;
    descriptionKey?: string = this.descriptionKey;

    section: number = this.section;
    activeSection: number = this.activeSection;
    savedSections: number[] = this.savedSections;

    @localClassName
    shadow: boolean = defaultTo(this.shadow, true);

    @action
    editSection() {
        // TODO
    }

    @computed('savedSections.[]', 'section')
    get didSave() {
        return this.savedSections.includes(this.section);
    }
}
