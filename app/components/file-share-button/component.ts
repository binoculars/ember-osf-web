import Component from '@ember/component';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';
import Analytics from 'ember-osf/mixins/analytics';
import config from 'ember-get-config';
import pathJoin from 'ember-osf/utils/path-join';

export default class FileShareButton extends Component.extend(Analytics) {
    // -- Component arguments -- //
    private file = null;

    // -- Class properties -- //
    private showPopup = false;

    // -- Computed properties -- //
    private popoverClass = computed('styleNamespace', function() {
        return `${this.get('styleNamespace')}__popover`;
    });

    private sharePaneId = computed('elementId', function() {
        return `${this.get('elementId')}__share-pane`;
    });

    private embedPaneId = computed('elementId', function() {
        return `${this.get('elementId')}__embed-pane`;
    });

    private fileUrl = computed('file', function() {
        return encodeURIComponent(pathJoin(config.OSF.url, this.get('file.guid')));
    });

    private twitterUrl = computed('file.name', 'fileUrl', function() {
        const {
            social: {
                twitter: {
                    viaHandle: via,
                },
            },
        } = config;

        const params = {
            text: this.get('file.name'),
            url: this.get('fileUrl'),
            via,
        };

        return `https://twitter.com/intent/tweet?${$.param(params)}`;
    });

    private facebookUrl = computed('fileUrl', function() {
        const params = {
            u: this.get('fileUrl'),
        };

        return `https://www.facebook.com/sharer/sharer.php?${$.param(params)}`;
    });

    private linkedInUrl = computed('file.name', 'fileUrl', function() {
        const params = {
            title: this.get('file.name'),
            url: this.get('fileUrl'),
        };

        return `https://www.linkedin.com/cws/share?${$.param(params)}`;
    });

    private emailUrl = computed('file.name', 'fileUrl', function() {
        const params = {
            body: this.get('fileUrl'),
            subejct: this.get('file.name'),
        };

        return `mailto:?${$.param(params)}`;
    });

    private mfrUrl = computed('file', function() {
        const params = {
            url: encodeURIComponent(pathJoin(config.OSF.url, this.get('file.guid'), 'download')),
        };

        return `${config.OSF.renderUrl}?${$.param(params)}`;
    });

    private shareiFrameDynamic = computed('mfrUrl', function() {
        const mfrStaticUrl = config.OSF.renderUrl.replace('/render', '/static');

        return htmlSafe(`
            <style>
                .embed-responsive {
                    position:relative;
                    height:100%;
                }
                .embed-responsive iframe {
                    position:absolute;
                    height:100%;
                }
            </style>
            <link href="${mfrStaticUrl}/css/mfr.css" media="all" rel="stylesheet">
            <div id="mfrIframe" class="mfr mfr-file"></div>
            <script src="${mfrStaticUrl}/js/mfr.js"></script>
            <script>
                function renderMfr() {
                    var mfrRender = new mfr.Render("mfrIframe", "${this.get('mfrUrl')}");
                }
                if (window.jQuery) {
                    renderMfr();
                } else {
                    var jq = document.createElement('script');
                    document.head.appendChild(jq);
                    jq.onload = function() {
                        renderMfr();
                    }
                    jq.src = 'http://code.jquery.com/jquery-1.11.2.min.js';
                }
            </script>
        `.trim().replace(/^\s{12}/mg, ''));
    });

    private shareiFrameDirect = computed('mfrUrl', function() {
        return htmlSafe(`
            <iframe src="${this.get('mfrUrl')}"
                    width="100%"
                    scrolling="yes"
                    height="677px"
                    marginheight="0"
                    frameborder="0"
                    allowfullscreen
                    webkitallowfullscreen>
        `.trim().replace(/^\s{12}/mg, ''));
    });

    private actions = {
        share(this: FileShareButton) {
            document.querySelector('.SharePane__mfr-url').select();
            document.execCommand('copy');
        },

        togglePopup(this: FileShareButton) {
            this.toggleProperty('showPopup');
        },

        hidePopup(this: FileShareButton) {
            this.set('showPopup', false);
        },
    };
}

declare module '@ember/component' {
    interface IRegistry {
        'file-share-button': FileShareButton;
    }
}
