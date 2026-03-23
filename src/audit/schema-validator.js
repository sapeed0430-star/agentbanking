function isObjectLike(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidFormat(format, value) {
  if (typeof value !== 'string') return false;
  if (format === 'uuid') {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
  if (format === 'date-time') {
    return !Number.isNaN(Date.parse(value));
  }
  if (format === 'uri') {
    try {
      const parsed = new URL(value);
      return typeof parsed.protocol === 'string' && parsed.protocol.length > 0;
    } catch {
      return false;
    }
  }
  return true;
}

function resolveRef(schema, ref) {
  if (!ref.startsWith('#/')) {
    throw new Error(`unsupported_ref:${ref}`);
  }
  const tokens = ref.slice(2).split('/');
  let current = schema;
  for (const token of tokens) {
    if (!isObjectLike(current) || !(token in current)) {
      throw new Error(`unresolved_ref:${ref}`);
    }
    current = current[token];
  }
  return current;
}

function validateType(expectedType, value) {
  if (expectedType === 'object') return isObjectLike(value);
  if (expectedType === 'array') return Array.isArray(value);
  if (expectedType === 'integer') return Number.isInteger(value);
  if (expectedType === 'string') return typeof value === 'string';
  if (expectedType === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (expectedType === 'boolean') return typeof value === 'boolean';
  return true;
}

function validateNode(schemaRoot, schemaNode, value, path, errors) {
  const node = schemaNode.$ref ? resolveRef(schemaRoot, schemaNode.$ref) : schemaNode;

  if (Array.isArray(node.type)) {
    const ok = node.type.some((candidateType) => validateType(candidateType, value));
    if (!ok) {
      errors.push(`${path}: type mismatch`);
      return;
    }
  } else if (node.type && !validateType(node.type, value)) {
    errors.push(`${path}: expected ${node.type}`);
    return;
  }

  if (node.const !== undefined && value !== node.const) {
    errors.push(`${path}: const mismatch`);
  }

  if (Array.isArray(node.enum) && !node.enum.includes(value)) {
    errors.push(`${path}: enum mismatch`);
  }

  if (typeof value === 'string') {
    if (typeof node.minLength === 'number' && value.length < node.minLength) {
      errors.push(`${path}: minLength violation`);
    }
    if (typeof node.maxLength === 'number' && value.length > node.maxLength) {
      errors.push(`${path}: maxLength violation`);
    }
    if (typeof node.format === 'string' && !isValidFormat(node.format, value)) {
      errors.push(`${path}: invalid format ${node.format}`);
    }
  }

  if (typeof value === 'number' && typeof node.minimum === 'number' && value < node.minimum) {
    errors.push(`${path}: minimum violation`);
  }

  if (Array.isArray(value)) {
    if (typeof node.minItems === 'number' && value.length < node.minItems) {
      errors.push(`${path}: minItems violation`);
    }
    if (node.items) {
      value.forEach((item, index) => {
        validateNode(schemaRoot, node.items, item, `${path}[${index}]`, errors);
      });
    }
  }

  if (isObjectLike(value)) {
    const required = Array.isArray(node.required) ? node.required : [];
    for (const key of required) {
      if (!(key in value)) {
        errors.push(`${path}.${key}: required`);
      }
    }

    if (node.additionalProperties === false && isObjectLike(node.properties)) {
      for (const key of Object.keys(value)) {
        if (!(key in node.properties)) {
          errors.push(`${path}.${key}: additionalProperties not allowed`);
        }
      }
    }

    if (isObjectLike(node.properties)) {
      for (const [key, childSchema] of Object.entries(node.properties)) {
        if (key in value) {
          validateNode(schemaRoot, childSchema, value[key], `${path}.${key}`, errors);
        }
      }
    }
  }
}

export function validateJsonSchema(schema, value) {
  const errors = [];
  validateNode(schema, schema, value, '$', errors);
  return {
    valid: errors.length === 0,
    errors,
  };
}
