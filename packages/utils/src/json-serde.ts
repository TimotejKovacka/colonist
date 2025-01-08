export class JsonEncoder<T> {
  encode(value: T): string {
    return JSON.stringify(value);
  }
}

export class JsonDecoder<T> {
  decode(val?: string): T {
    if (val === undefined) {
      throw new Error('cannot read value "undefined"');
    }
    return JSON.parse(val);
  }
}

export class JsonSerde<T> {
  private encoder = new JsonEncoder<T>();
  private decoder = new JsonDecoder<T>();

  encode(value: T) {
    return this.encoder.encode(value);
  }

  decode(value?: string) {
    return this.decoder.decode(value);
  }
}
