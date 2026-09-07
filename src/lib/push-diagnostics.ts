export interface PushDiagnostic {
  stage: string;
  code: string;
  message: string;
}

function safeText(value: unknown, fallback: string, maxLength: number) {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, maxLength)
    : fallback;
}

export function toPushDiagnostic(stage: string, error: unknown): PushDiagnostic {
  const source = typeof error === 'object' && error !== null
    ? error as { code?: unknown; message?: unknown; stage?: unknown }
    : {};
  return {
    stage: safeText(source.stage, stage, 50),
    code: safeText(source.code, 'unknown', 100),
    message: safeText(source.message, 'Unknown push registration error', 400),
  };
}

export async function pushStage<T>(stage: string, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw toPushDiagnostic(stage, error);
  }
}
