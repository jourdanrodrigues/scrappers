import {TerceiroClient} from '@/clients/terceiro-client'

export type Registry = typeof terceiroRegistry;
type Clients = typeof clients;

const terceiroRegistry = {
  id: 1,
  name: 'Terceiro Ofício de Registro de Imóveis de Fortaleza',
  requisitionTypes: [
    {title: 'Registro e Averbação', value: 1},
    {title: 'Certidão', value: 3},
    {title: 'Cópia de Documentos', value: 5},
  ],
}

const clients = {
  [terceiroRegistry.id]: TerceiroClient,
}

const registries: Record<number, Registry> = {
  [terceiroRegistry.id]: terceiroRegistry,
}

export class Registries {

  static getClientById<K extends keyof Clients>(id: K): Clients[K] | null {
    return clients[id]
  }

  static existForId(id: number): boolean {
    return id in registries
  }

  static getAll(): Registry[] {
    return Object.values(registries)
  }

  static getById(id: number): Registry | null {
    return registries[id]
  }

  static getTypes(): number[] {
    return this.getAll().reduce(
      (output, registry) => [...output, ...registry.requisitionTypes.map(({value}) => value)],
      [] as number[],
    )
  }
}