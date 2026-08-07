/**
 * Barrel da camada de serviços da API (F075: arquivos ≤300 linhas).
 * Cada domínio vive em services/api/<dominio>.ts; este barrel re-exporta
 * tudo para os callers continuarem importando de "../services/api".
 */
export * from "./client";
export * from "./auth";
export * from "./properties";
export * from "./appliances";
export * from "./analyses";
export * from "./preferences";
export * from "./catalog";
