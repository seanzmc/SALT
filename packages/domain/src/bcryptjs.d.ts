declare module "bcryptjs" {
  export function compare(
    value: string,
    encrypted: string
  ): Promise<boolean>;
}
