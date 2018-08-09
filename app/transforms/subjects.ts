import ArrayTransform from './array';

interface Identifiable {
    id: string;
    [key: string]: any;
}

export default class Subjects extends ArrayTransform {
    serialize(value: Identifiable[][]): string[][] {
        return (super.serialize(value) as Identifiable[][])
            .map(
                item => item.map(({ id }) => id),
            );
    }
}

declare module 'ember-data' {
    interface TransformRegistry {
        subjects: Subjects;
    }
}
