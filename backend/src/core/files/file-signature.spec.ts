import { matchesFileSignature } from './file-signature';

describe('matchesFileSignature', () => {
  it('aceita um JPEG real como .jpg', () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    expect(matchesFileSignature('.jpg', buffer)).toBe(true);
    expect(matchesFileSignature('.jpeg', buffer)).toBe(true);
  });

  it('rejeita um PDF com extensao .jpg', () => {
    const buffer = Buffer.from('%PDF-1.4\nconteudo');
    expect(matchesFileSignature('.jpg', buffer)).toBe(false);
  });

  it('aceita um PNG real como .png', () => {
    const buffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0,
    ]);
    expect(matchesFileSignature('.png', buffer)).toBe(true);
  });

  it('aceita um GIF real como .gif', () => {
    const buffer = Buffer.from('GIF89a' + 'resto');
    expect(matchesFileSignature('.gif', buffer)).toBe(true);
  });

  it('aceita um WEBP real como .webp', () => {
    const buffer = Buffer.concat([
      Buffer.from('RIFF'),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from('WEBP'),
    ]);
    expect(matchesFileSignature('.webp', buffer)).toBe(true);
  });

  it('rejeita um RIFF que nao e WEBP (ex.: WAV)', () => {
    const buffer = Buffer.concat([
      Buffer.from('RIFF'),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from('WAVE'),
    ]);
    expect(matchesFileSignature('.webp', buffer)).toBe(false);
  });

  it('aceita um PDF real como .pdf', () => {
    const buffer = Buffer.from('%PDF-1.7\nconteudo');
    expect(matchesFileSignature('.pdf', buffer)).toBe(true);
  });

  it('aceita um container ZIP para .zip/.docx/.xlsx/.pptx', () => {
    const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0]);
    expect(matchesFileSignature('.zip', buffer)).toBe(true);
    expect(matchesFileSignature('.docx', buffer)).toBe(true);
    expect(matchesFileSignature('.xlsx', buffer)).toBe(true);
    expect(matchesFileSignature('.pptx', buffer)).toBe(true);
  });

  it('aceita um OLE Compound File para .doc/.xls/.ppt', () => {
    const buffer = Buffer.from([
      0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0,
    ]);
    expect(matchesFileSignature('.doc', buffer)).toBe(true);
    expect(matchesFileSignature('.xls', buffer)).toBe(true);
    expect(matchesFileSignature('.ppt', buffer)).toBe(true);
  });

  it('nao tem assinatura confiavel para .txt/.csv - qualquer conteudo passa', () => {
    const buffer = Buffer.from('qualquer coisa');
    expect(matchesFileSignature('.txt', buffer)).toBe(true);
    expect(matchesFileSignature('.csv', buffer)).toBe(true);
  });

  it('rejeita um buffer vazio ou curto demais para a assinatura esperada', () => {
    expect(matchesFileSignature('.png', Buffer.from([0x89, 0x50]))).toBe(
      false,
    );
    expect(matchesFileSignature('.pdf', Buffer.alloc(0))).toBe(false);
  });

  it('nao bloqueia uma extensao sem familia de assinatura cadastrada', () => {
    expect(matchesFileSignature('.unknown', Buffer.from('x'))).toBe(true);
  });
});
