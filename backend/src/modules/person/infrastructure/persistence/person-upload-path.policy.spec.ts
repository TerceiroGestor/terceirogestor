import { isPersonUploadPathAllowed } from './person-upload-path.policy';

describe('person-upload-path.policy', () => {
  it('keeps legacy uploads/people compatibility', () => {
    expect(isPersonUploadPathAllowed('/uploads/people/avatar.png')).toBe(true);
    expect(isPersonUploadPathAllowed('/uploads/person/avatar.png')).toBe(false);
  });
});