// src/domains/pet_store/models/builders/user.builder.ts

import { PetStoreUser } from '../shared/user.model';

type Overrides = Partial<PetStoreUser>;

export class PetStoreUserBuilder {
  /**
   * Construye un usuario válido base.
   * Permite sobreescribir cualquier campo con overrides.
   */
  static valid(overrides: Overrides = {}): PetStoreUser {
    const unique = this.uniqueSuffix();

    return {
      id: '',
      username: `user_${unique}`,
      firstName: 'a',
      lastName: 'b',
      email: `user_${unique}@gmail.com`,
      password: '12345',
      phone: '9689689655',
      userStatus: 0,
      ...overrides,
    };
  }

  /**
   * Crea múltiples usuarios válidos.
   * Puedes pasar:
   * - un objeto overrides común
   * - una función que reciba el índice y devuelva overrides por elemento
   */
  static many(
    count: number,
    overrides?: Overrides | ((index: number) => Overrides)
  ): PetStoreUser[] {
    return Array.from({ length: count }).map((_, index) => {
      const perItemOverrides =
        typeof overrides === 'function'
          ? overrides(index)
          : overrides ?? {};

      return this.valid({
        username: `user_${this.uniqueSuffix()}_${index + 1}`,
        email: `user_${this.uniqueSuffix()}_${index + 1}@gmail.com`,
        ...perItemOverrides,
      });
    });
  }

  /**
   * Construye un usuario eliminando campos específicos.
   * Útil para pruebas negativas.
   *
   * Ejemplo:
   * PetStoreUserBuilder.missing(['username'])
   */
  static missing(
    fields: Array<keyof PetStoreUser>,
    overrides: Overrides = {}
  ): PetStoreUser {
    const user = this.valid(overrides);

    for (const field of fields) {
      delete (user as any)[field];
    }

    return user;
  }

  /**
   * Construye un usuario con todos los campos vacíos.
   * Útil para escenarios negativos extremos.
   */
  static empty(overrides: Overrides = {}): PetStoreUser {
    return {
      id: '',
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      userStatus: 0,
      ...overrides,
    };
  }

  /**
   * Genera un sufijo único para evitar colisiones en ejecuciones repetidas.
   */
  private static uniqueSuffix(): string {
    return `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }
}