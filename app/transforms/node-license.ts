import DS from 'ember-data';

const { Transform } = DS;

interface Serialized {
    copyrightHolders: string[];
    year: string;
}

export interface Deserialized {
    copyrightHolders: string;
    year: string;
}

export default class NodeLicense extends Transform.extend({
    deserialize(value: Serialized | null): Deserialized | null {
        if (!value) {
            return null;
        }

        const {
            copyrightHolders = [],
            year,
        } = value;

        return {
            copyrightHolders: copyrightHolders.join(', '),
            year,
        };
    },

    serialize(value: Deserialized | null): Serialized | null {
        if (!value) {
            return null;
        }

        const {
            copyrightHolders,
            year,
        } = value;

        return {
            copyrightHolders: copyrightHolders
                .split(', ')
                .map(s => s.trim()),
            year,
        };
    },
}) {}

declare module 'ember-data' {
    interface TransformRegistry {
        'node-license': NodeLicense;
    }
}
