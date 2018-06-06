import Service from '@ember/service';

const advisoryBoard = `
    <div class="col-xs-12">
        <h2>Advisory Group</h2>
        <p class="m-b-lg">Our advisory group includes leaders in preprints and scholarly communication</p>
    </div>
    <div class="col-xs-6">
        <ul>
            <li><strong>Devin Berg</strong> : engrXiv, University of Wisconsin-Stout</li>
            <li><strong>Pete Binfield</strong> : PeerJ PrePrints</li>
            <li><strong>Benjamin Brown</strong> : PsyArXiv, Georgia Gwinnett College</li>
            <li><strong>Philip Cohen</strong> : SocArXiv, University of Maryland</li>
            <li><strong>Kathleen Fitzpatrick</strong> : Modern Language Association</li>
        </ul>
    </div>
    <div class="col-xs-6">
        <ul>
            <li><strong>John Inglis</strong> : bioRxiv, Cold Spring Harbor Laboratory Press</li>
            <li><strong>Rebecca Kennison</strong> : K | N Consultants</li>
            <li><strong>Kristen Ratan</strong> : CoKo Foundation</li>
            <li><strong>Oya Riege</strong>r : arXiv, Cornell University</li>
            <li><strong>Judy Ruttenberg</strong> : SHARE, Association of Research Libraries</li>
        </ul>
    </div>
`.trim();

export default class Theme extends Service {
    id = 'osf';
    isProvider = false;

    provider = {
        id: 'osf',
        advisoryBoard,
    };
}

declare module '@ember/service' {
    interface Registry {
        theme: Theme;
    }
}
