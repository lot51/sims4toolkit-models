/**
 * How resources are encoded.
 */
enum EncodingType {
  // special cases
  Unknown = "Unknown",
  Null = "Null",

  // known encoding
  CASP = "CASP",
  DATA = "DATA",
  DDS = "DDS", // DST is a subtype of DDS
  OBJC = "OBJC",
  OBJDEF = "OBJDEF",
  STBL = "STBL",
  XML = "XML",
}

// `export default enum` not supported by TS
export default EncodingType;
