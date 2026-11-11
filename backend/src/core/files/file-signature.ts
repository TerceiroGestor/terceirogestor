// Validates a file's real content against its declared extension by
// checking magic bytes, instead of trusting the client-supplied mimetype
// (trivially spoofed) or the filename's extension alone.
//
// ZIP-based Office formats (docx/xlsx/pptx) and plain .zip share the same
// container signature (PK\x03\x04); the old binary Office formats
// (doc/xls/ppt) share the OLE Compound File signature. Telling them apart
// further would require parsing the container, which is out of scope here
// - the goal is blocking an executable/script disguised with an office
// extension, not perfectly distinguishing docx from a renamed .zip.
type SignatureFamily = {
  extensions: string[];
  matches: (buffer: Buffer) => boolean;
};

function bytesMatch(
  buffer: Buffer,
  signature: number[],
  offset = 0,
): boolean {
  if (buffer.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[offset + i] !== signature[i]) return false;
  }
  return true;
}

const SIGNATURE_FAMILIES: SignatureFamily[] = [
  {
    extensions: ['.jpg', '.jpeg'],
    matches: (b) => bytesMatch(b, [0xff, 0xd8, 0xff]),
  },
  {
    extensions: ['.png'],
    matches: (b) =>
      bytesMatch(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  {
    extensions: ['.gif'],
    matches: (b) => bytesMatch(b, [0x47, 0x49, 0x46, 0x38]), // "GIF8"
  },
  {
    extensions: ['.webp'],
    matches: (b) =>
      bytesMatch(b, [0x52, 0x49, 0x46, 0x46]) && // "RIFF"
      bytesMatch(b, [0x57, 0x45, 0x42, 0x50], 8), // "WEBP"
  },
  {
    extensions: ['.pdf'],
    matches: (b) => bytesMatch(b, [0x25, 0x50, 0x44, 0x46, 0x2d]), // "%PDF-"
  },
  {
    extensions: ['.zip', '.docx', '.xlsx', '.pptx'],
    matches: (b) => bytesMatch(b, [0x50, 0x4b, 0x03, 0x04]), // ZIP local file header
  },
  {
    extensions: ['.doc', '.xls', '.ppt'],
    matches: (b) =>
      bytesMatch(
        b,
        [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], // OLE Compound File
      ),
  },
];

// .txt/.csv have no reliable binary signature - any byte sequence is a
// valid text file. Extension/mimetype are the only signal for those, same
// as before this check existed.
const EXTENSIONS_WITHOUT_SIGNATURE = new Set(['.txt', '.csv']);

export function matchesFileSignature(
  extension: string,
  buffer: Buffer,
): boolean {
  const ext = extension.toLowerCase();
  if (EXTENSIONS_WITHOUT_SIGNATURE.has(ext)) return true;
  const family = SIGNATURE_FAMILIES.find((f) => f.extensions.includes(ext));
  if (!family) return true; // no known signature for this extension; nothing to check
  return family.matches(buffer);
}
