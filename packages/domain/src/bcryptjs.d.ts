declare module "bcryptjs" {
  const bcrypt: {
    compare(value: string, encrypted: string): Promise<boolean>;
    hash(value: string, saltOrRounds: string | number): Promise<string>;
  };

  export function compare(
    value: string,
    encrypted: string
  ): Promise<boolean>;

  export function hash(
    value: string,
    saltOrRounds: string | number
  ): Promise<string>;

  export default bcrypt;
}
