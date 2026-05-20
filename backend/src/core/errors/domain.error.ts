export abstract class DomainError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class DomainValidationError extends DomainError {}

export class DomainConflictError extends DomainError {}

export class DomainForbiddenError extends DomainError {}

export class DomainNotFoundError extends DomainError {}