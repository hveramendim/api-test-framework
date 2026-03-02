// src/domains/pet_store/models/users.types.ts

export interface PetStoreUser {
  id: string | number;       // puede ser string si lo generas en builder
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  userStatus: number;
}