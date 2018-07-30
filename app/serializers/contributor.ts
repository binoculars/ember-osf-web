import DS from 'ember-data';
import OsfSerializer from './osf-serializer';

export default class Contributor extends OsfSerializer.extend({
    serialize(snapshot: DS.Snapshot, options = {}) {
        const includeUser = snapshot.record.get('isNew') ? true : undefined;

        // const opts = {
        //     includeUser,
        //     ...options,
        // };

        // Restore relationships to serialized data
        const serialized = this._super(snapshot, options);

        // APIv2 expects contributor information to be nested under relationships.
        if (includeUser) {
            serialized.data.relationships = {
                users: {
                    data: {
                        id: snapshot.record.get('userId'),
                        type: 'users',
                    },
                },
            };
        }

        return serialized;
    },
}) {
}

declare module 'ember-data' {
    interface SerializerRegistry {
        contributor: Contributor;
    }
}
