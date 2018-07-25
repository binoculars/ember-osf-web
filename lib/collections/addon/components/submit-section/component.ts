import { tagName } from '@ember-decorators/component';
import Component from '@ember/component';
import { localClassName, localClassNames } from 'ember-osf-web/decorators/css-modules';
import defaultTo from 'ember-osf-web/utils/default-to';

@tagName('section')
@localClassNames('Component')
export default class SubmitSection extends Component {
    tPrefix: string = defaultTo(this.tPrefix, 'collections.submit.');
    titleKey: string = this.titleKey;
    descriptionKey?: string = this.descriptionKey;

    @localClassName
    shadow: boolean = defaultTo(this.shadow, true);
}
