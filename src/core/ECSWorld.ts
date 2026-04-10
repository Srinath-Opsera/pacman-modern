export type Entity = number;

export interface Component {
  readonly type: string;
}

export interface System {
  readonly name: string;
  update(world: World, deltaTime: number): void;
}

export class World {
  private nextEntityId = 0;
  private entities = new Set<Entity>();
  private components = new Map<Entity, Map<string, Component>>();
  private systems: System[] = [];

  createEntity(): Entity {
    const id = this.nextEntityId++;
    this.entities.add(id);
    this.components.set(id, new Map());
    return id;
  }

  addComponent<T extends Component>(entity: Entity, component: T): void {
    const entityComponents = this.components.get(entity);
    if (!entityComponents) {
      throw new Error(`Entity ${entity} does not exist`);
    }
    entityComponents.set(component.type, component);
  }

  getComponent<T extends Component>(entity: Entity, type: string): T | undefined {
    const entityComponents = this.components.get(entity);
    if (!entityComponents) {
      return undefined;
    }
    return entityComponents.get(type) as T | undefined;
  }

  hasComponent(entity: Entity, type: string): boolean {
    const entityComponents = this.components.get(entity);
    return entityComponents?.has(type) ?? false;
  }

  removeComponent(entity: Entity, type: string): void {
    const entityComponents = this.components.get(entity);
    entityComponents?.delete(type);
  }

  removeEntity(entity: Entity): void {
    this.entities.delete(entity);
    this.components.delete(entity);
  }

  addSystem(system: System): void {
    this.systems.push(system);
  }

  getEntities(): ReadonlySet<Entity> {
    return this.entities;
  }

  getEntitiesWithComponents(...types: string[]): Entity[] {
    const result: Entity[] = [];
    for (const entity of this.entities) {
      const entityComponents = this.components.get(entity);
      if (entityComponents && types.every((t) => entityComponents.has(t))) {
        result.push(entity);
      }
    }
    return result;
  }

  update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update(this, deltaTime);
    }
  }
}
