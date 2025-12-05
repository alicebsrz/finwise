declare module 'file-saver' {
  /**
   * Saves data to a file using the browser's download mechanism.
   * Minimal typing to satisfy TS; keep broad options for compatibility.
   */
  export function saveAs(data: Blob | File | string, filename?: string, options?: any): void;
  export default saveAs;
}
