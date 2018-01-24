import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Analytics from 'ember-osf/mixins/analytics';

export default class extends Controller.extend(Analytics) {
    public canEdit = computed('currentUser', 'model', function(): boolean {
        const modelId = this.get('model.id');

        if (modelId) {
            return (modelId === this.get('currentUser.currentUserId'));;
        }

        return false;
    });

    public title = computed('model.fullName', function(): string {
        return `${this.get('model.fullName')}'s Quick Files`;
    });

    public actions = {
        async openFile(file, show) {
            if (file.get('guid')) {
                await file.getGuid();
            }

            this.transitionToRoute('file-detail', file.get('guid'), { queryParams: { show } });
        },
    };

    private currentUser = service();
}
