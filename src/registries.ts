import TerceiroClient from '@/clients/terceiroClient'

export type Registry = typeof terceiroRegistry;
type Clients = typeof clients;

const terceiroRegistry = {
  id: 1,
  requisitionTypes: {
    Register: 1,
    Certification: 3,
    DocumentCopy: 5,
  }
}

const clients = {
  [terceiroRegistry.id]: TerceiroClient,
}

const registries: Record<number, Registry> = {
  [terceiroRegistry.id]: terceiroRegistry,
}

export default class Registries {

  static getClientById<K extends keyof Clients>(id: K): Clients[K] | undefined {
    return clients[id]
  }

  static existForId(id:number): boolean {
    return id in registries
  }

  static getAll(): Registry[] {
    return Object.values(registries)
  }

  static getTypes(): number[] {
    return this.getAll().reduce(
      (output, registry) => [...output, ...Object.values(registry.requisitionTypes)],
      [] as number[],
    )
  }
}