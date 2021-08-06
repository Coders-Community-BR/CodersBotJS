export function getPropAsUnknown(obj: unknown, key: string | symbol): unknown {
    const o = Object(obj);

    return o[key];
} 

export function callPropAsUnknown(obj: unknown, key: string | symbol): unknown {
    const o = Object(obj);

    const callable = o[key];

    if(typeof callable === 'function') return callable();
}