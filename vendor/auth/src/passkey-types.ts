/** Kent-shaped passkey row (matches D1 `Passkey` + kentcdodds.com migration). */

export type PasskeyRecord = {
  id: string;
  aaguid: string;
  publicKey: Uint8Array;
  userId: string;
  webauthnUserId: string;
  counter: number;
  deviceType: string;
  backedUp: boolean;
  transports: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PasskeyStore = {
  listByUserId: (userId: string) => Promise<PasskeyRecord[]>;
  getById: (id: string) => Promise<PasskeyRecord | null>;
  upsert: (record: PasskeyRecord) => Promise<PasskeyRecord>;
  deleteById: (id: string, userId: string) => Promise<boolean>;
  updateCounter: (id: string, counter: number) => Promise<void>;
};
