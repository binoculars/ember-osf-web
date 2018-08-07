// import DS from 'ember-data';
import OsfSerializer from './osf-serializer';

export default class Node extends OsfSerializer.extend({
    // serialize(snapshot: DS.Snapshot, options: object): any {
    //     debugger;
    //     this._super(snapshot, options);
    // },
}) {}

declare module 'ember-data' {
    interface SerializerRegistry {
        'node': Node;
    }
}
