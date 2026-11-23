export type EncryptedPayload = {
    dataEnc: Uint8Array<ArrayBuffer>;
    iv: Uint8Array<ArrayBuffer>;
    tag: Uint8Array<ArrayBuffer>;
};
export declare function parseMasterKey(masterKey: string): Buffer;
export declare function deriveTenantKey(masterKey: Buffer, tenantId: string): Buffer;
export declare function encryptJson(key: Buffer, payload: unknown): EncryptedPayload;
