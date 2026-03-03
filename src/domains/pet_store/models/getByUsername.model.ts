// src/domains/pet_store/models/users.types.ts

export interface PetStoreUser {
  id: string | number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  userStatus: number;
}