export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidStatusTransitionError extends DomainError {
  constructor(public readonly fromStatus: string, public readonly toStatus: string) {
    super(`Transición de estado no permitida: de '${fromStatus}' a '${toStatus}' (BR-02)`);
  }
}

export class ProductNotFoundError extends DomainError {
  constructor(identifier: string | number) {
    super(`Producto no encontrado: ${identifier}`);
  }
}

export class CategoryNotFoundError extends DomainError {
  constructor(id: number) {
    super(`Categoría no encontrada: ${id}`);
  }
}

export class CategoryHierarchyError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class ProtectedCategoryError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

