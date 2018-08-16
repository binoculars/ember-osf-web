import { tagName } from '@ember-decorators/component';
import { action, computed } from '@ember-decorators/object';
import Component from '@ember/component';
import SlotsMixin from 'ember-block-slots';
import { localClassNames } from 'ember-osf-web/decorators/css-modules';
import defaultTo from 'ember-osf-web/utils/default-to';

@tagName('section')
@localClassNames('Component')
export default class SubmitSection extends Component.extend(SlotsMixin) {
    tPrefix: string = defaultTo(this.tPrefix, 'collections.submit.');
    tooltipKey: string = this.tooltipKey;
    titleKey: string = this.titleKey;
    descriptionKey?: string = this.descriptionKey;

    section: number = this.section;
    activeSection: number = this.activeSection;
    savedSections: number[] = this.savedSections;

    @computed('activeSection', 'section')
    get open(): boolean {
        return this.activeSection === this.section;
    }

    @computed('savedSections.[]', 'section')
    get didSave(): boolean {
        return this.savedSections.includes(this.section);
    }

    @computed('open', 'didSave')
    get showTooltip(): boolean {
        return !!this.tooltipKey && !this.open && !this.didSave;
    }

    @computed('open', 'didSave')
    get showReopen(): boolean {
        return !this.open && this.didSave;
    }

    @action
    editSection(this: SubmitSection): void {
        this.set('activeSection', this.section);
        // TODO: call a closure action that says section changed
    }
}
