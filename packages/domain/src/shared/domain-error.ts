export class DomainError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly fieldErrors?: Record<string, string[] | undefined>
  ) {
    super(message);
    this.name = "DomainError";
  }
}
