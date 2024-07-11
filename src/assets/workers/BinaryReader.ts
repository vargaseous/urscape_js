export class BinaryReader {
  private buffer: Buffer
  private offset: number

  constructor(buffer: Buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

  private decodeULEB128() {
    let result = 0;
    let shift = 0;
    let length = 0;
    let byte = 0x80;

    for (; (byte & 0x80) !== 0; shift += 7) {
        byte = this.buffer[this.offset + length];
        result |= (byte & 0x7F) << shift;
        length++;
    }

    this.offset += length;

    return result;
  }

  public readString() {
    const length = this.decodeULEB128();
    const result = this.buffer.toString("utf8", this.offset, this.offset + length);
    this.offset += length;

    return result;
  }

  public readBoolean() {
    return this.buffer[this.offset++] > 0x0;
  }

  public readUint32() {
    const result = this.buffer.readUint32LE(this.offset);
    this.offset += 4;

    return result;
  }

  public readInt32() {
    const result = this.buffer.readInt32LE(this.offset);
    this.offset += 4;

    return result;
  }

  public readInt8() {
    return this.buffer.readInt8(this.offset++);
  }

  public readUint8() {
    return this.buffer.readUint8(this.offset++);
  }

  public readFloat() {
    const result = this.buffer.readFloatLE(this.offset);
    this.offset += 4;

    return result;
  }

  public readDouble() {
    const result = this.buffer.readDoubleLE(this.offset);
    this.offset += 8;

    return result;
  }
}
