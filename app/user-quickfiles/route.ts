import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import Analytics from 'ember-osf/mixins/analytics';

export default class extends Route.extend(Analytics) {
    public actions = {
        didTransition() {
            const preventDrop = (e: DragEvent) => {
                if (e.target.id === 'quickfiles-dropzone') {
                    return;
                }

                e.preventDefault();
                e.dataTransfer.effectAllowed = 'none';
                e.dataTransfer.dropEffect = 'none';
            };

            window.addEventListener('dragover', preventDrop);
            window.addEventListener('drop', preventDrop);
        },
    };

    private currentUser = service();

    public model(params) {
        return this.store.findRecord('user', params.user_id);
    }

    public afterModel(model, transition) {
        if (model.id !== this.get('currentUser.currentUserId')) {
            transition.send('track', 'view', 'track', 'Quick Files - Main page view');
        }
    }
}
