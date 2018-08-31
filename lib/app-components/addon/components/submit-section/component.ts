import { tagName } from '@ember-decorators/component';
import { action, computed } from '@ember-decorators/object';
import Component from '@ember/component';
import SlotsMixin from 'ember-block-slots';
import { localClassNames } from 'ember-osf-web/decorators/css-modules';
import styles from './styles';
import layout from './template';

@tagName('section')
@localClassNames('Component')
export default class SubmitSection extends Component.extend(SlotsMixin) {
    layout = layout;
    styles = styles;

    tooltip: string = this.tooltip;
    title: string = this.title;
    description?: string = this.description;

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
        return !!this.tooltip && !this.open && !this.didSave;
    }

    @computed('open', 'didSave')
    get showReopen(): boolean {
        return !this.open && this.didSave;
    }

    @action
    editSection(this: SubmitSection): void {
        this.set('activeSection', this.section);
    }
}
