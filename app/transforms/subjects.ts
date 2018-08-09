import ArrayTransform from './array';

export default class Subjects extends ArrayTransform {
    serialize(value: any[][]): any[][] {
        return (super.serialize(value) as any[][])
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
