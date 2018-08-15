import { classNames } from '@ember-decorators/component';
import Component from '@ember/component';
import requiredAction from 'ember-osf-web/decorators/required-action';
import defaultTo from 'ember-osf-web/utils/default-to';

@classNames('col-xs-12 text-right')
export default class SubmitSectionButtons extends Component {
    showDiscard: boolean = defaultTo(this.showDiscard, true);
    continueDisabled: boolean = defaultTo(this.continueDisabled, false);

    @requiredAction discard!: () => void;
    @requiredAction continue!: () => void;
}
