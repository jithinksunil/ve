import { z } from "zod";
import { SECTION_SCHEMAS } from "./schemas.js";

function inferStringFromPath(path) {
  const key = path[path.length - 1] || "value";
  if (key.toLowerCase().includes("date")) return "2026-01-01";
  if (key.toLowerCase().includes("url")) return "https://example.com";
  if (key.toLowerCase().includes("ticker")) return "MOCK";
  if (key.toLowerCase().includes("exchange")) return "LSE";
  if (key.toLowerCase().includes("year")) return "FY26";
  return `${key}_value`;
}

function generateFromSchema(schema, path = [], depth = 0) {
  if (depth > 10) return null;

  const typeName = schema?._def?.typeName;

  if (typeName === z.ZodFirstPartyTypeKind.ZodOptional || typeName === z.ZodFirstPartyTypeKind.ZodNullable) {
    return generateFromSchema(schema._def.innerType, path, depth + 1);
  }

  if (typeName === z.ZodFirstPartyTypeKind.ZodDefault) {
    return schema._def.defaultValue();
  }

  if (typeName === z.ZodFirstPartyTypeKind.ZodString) {
    return inferStringFromPath(path);
  }

  if (typeName === z.ZodFirstPartyTypeKind.ZodNumber) {
    return 1;
  }

  if (typeName === z.ZodFirstPartyTypeKind.ZodBoolean) {
    return true;
  }

  if (typeName === z.ZodFirstPartyTypeKind.ZodEnum) {
    return schema._def.values[0];
  }

  if (typeName === z.ZodFirstPartyTypeKind.ZodNativeEnum) {
    const first = Object.values(schema._def.values).find((v) => typeof v === "string" || typeof v === "number");
    return first ?? null;
  }

  if (typeName === z.ZodFirstPartyTypeKind.ZodLiteral) {
    return schema._def.value;
  }

  if (typeName === z.ZodFirstPartyTypeKind.ZodArray) {
    return [generateFromSchema(schema._def.type, [...path, "item"], depth + 1)];
  }

  if (typeName === z.ZodFirstPartyTypeKind.ZodObject) {
    const shape = schema._def.shape();
    return Object.fromEntries(
      Object.entries(shape).map(([key, value]) => [key, generateFromSchema(value, [...path, key], depth + 1)])
    );
  }

  if (typeName === z.ZodFirstPartyTypeKind.ZodUnion) {
    return generateFromSchema(schema._def.options[0], path, depth + 1);
  }

  if (typeName === z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion) {
    const option = schema._def.options.values().next().value;
    return generateFromSchema(option, path, depth + 1);
  }

  if (typeName === z.ZodFirstPartyTypeKind.ZodEffects) {
    return generateFromSchema(schema._def.schema, path, depth + 1);
  }

  return null;
}

export function generateMockSectionData(section, options = {}) {
  const schema = SECTION_SCHEMAS[section];
  if (!schema) throw new Error(`Unsupported section for mock generation: ${section}`);

  const generated = generateFromSchema(schema);

  if (generated && typeof generated === "object") {
    if ("ticker" in generated && options.ticker) generated.ticker = options.ticker;
    if ("exchange" in generated && options.exchange) generated.exchange = options.exchange;
  }

  return schema.parse(generated);
}
