export interface ImageValidationResult {
  valid: boolean;
  extension?: string;
  error?: string;
}

export function validateImageFile(
  file: File,
  allowedTypes: Record<string, string>,
  maxBytes: number,
  typeErrorMessage: string
): ImageValidationResult {
  const extension = allowedTypes[file.type];
  if (!extension) {
    return { valid: false, error: typeErrorMessage };
  }
  if (file.size > maxBytes) {
    return { valid: false, error: `File must be smaller than ${Math.round(maxBytes / (1024 * 1024))}MB.` };
  }
  return { valid: true, extension };
}
