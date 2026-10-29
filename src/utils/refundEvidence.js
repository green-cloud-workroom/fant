// Preserve Firestore value types and Timestamp nanoseconds; never dump values.
export function refundEvidenceFingerprint(id, data) {
  const encode = value => {
    if (value === null) return ['null'];
    if (typeof value === 'number') return ['number', Number.isNaN(value) ? 'NaN' : Object.is(value,-0) ? '-0' : String(value)];
    if (['string','boolean'].includes(typeof value)) return [typeof value,value];
    if (Array.isArray(value)) return ['array',value.map(encode)];
    if (value && typeof value === 'object') {
      if (typeof value.toMillis === 'function' && Number.isInteger(value.seconds) && Number.isInteger(value.nanoseconds)) return ['timestamp',value.seconds,value.nanoseconds];
      if (typeof value.latitude === 'number' && typeof value.longitude === 'number' && typeof value.isEqual === 'function') return ['geopoint',encode(value.latitude),encode(value.longitude)];
      if (typeof value.toBase64 === 'function') return ['bytes',value.toBase64()];
      if (value.type === 'document' && typeof value.toJSON === 'function') return ['reference',encode(value.toJSON())];
      if (value instanceof Date) return ['date',value.toISOString()];
      const proto=Object.getPrototypeOf(value);
      const plain=proto===null || (Object.getPrototypeOf(proto)===null
        && Object.prototype.hasOwnProperty.call(proto,'constructor')
        && typeof proto.constructor==='function'
        && Function.prototype.toString.call(proto.constructor)===Function.prototype.toString.call(Object));
      if(!plain) throw Error('INVALID_SUPPLEMENT_LOG_STATE');
      return ['map',Object.keys(value).sort().map(key=>[key,encode(value[key])])];
    }
    throw Error('INVALID_SUPPLEMENT_LOG_STATE');
  };
  return JSON.stringify([id,encode(data)]);
}
