function toErrorDetails(error) {
  if (!error) return undefined;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  return { message: String(error) };
}

function safeSerialize(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ message: "Failed to serialize log payload" });
  }
}

function buildLog(level, message, meta) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta || {})
  };
}

export const logger = {
  info(message, meta) {
    console.log(safeSerialize(buildLog("INFO", message, meta)));
  },
  warn(message, meta) {
    console.warn(safeSerialize(buildLog("WARN", message, meta)));
  },
  error(message, error, meta) {
    console.error(
      safeSerialize(
        buildLog("ERROR", message, {
          ...(meta || {}),
          error: toErrorDetails(error)
        })
      )
    );
  }
};
