import Service from '@ember/service';

export default class Theme extends Service {
    id = 'osf';
    provider = 'osf';
    isProvider = false;
}

declare module '@ember/service' {
    interface Registry {
        theme: Theme;
    }
}
