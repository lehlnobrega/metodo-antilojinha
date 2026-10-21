import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Tira do envio os campos vazios (null, undefined ou texto em branco), para o banco usar o valor padrão. */
export function semVazios<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "")),
  ) as Partial<T>;
}
