import { computed } from '@ember/object';
import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import Analytics from 'ember-osf/mixins/analytics';

export default class UserQuickfiles extends Controller.extend(Analytics) {
    private currentUser = service('currentUser');
    private pageName = 'QuickFiles';

    private canEdit = computed('currentUser', 'model', function(this: UserQuickfiles): boolean {
        if (this.get('model.id')) {
            return this.get('model.id') === this.get('currentUser.currentUserId');
        }

        return false;
    });

    private title = computed('model.fullName', function(this: UserQuickfiles): string {
        return `${this.get('model.fullName')}'s Quick Files`;
    });

    private actions = {
        openFile(this: UserQuickfiles, file, qparams) {
            if (file.get('guid')) {
                this.transitionToRoute('file-detail', file.get('guid'), { queryParams: { show: qparams } });
            } else {
                file.getGuid().then(() => this.transitionToRoute('file-detail', file.get('guid'), { queryParams: { show: qparams } }));
            }
        },
    };
}

declare module '@ember/controller' {
    interface IRegistry {
        'user-quickfiles': UserQuickfiles;
    }
}
