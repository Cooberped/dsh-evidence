export const DEFAULT_FIXTURE_DIR: string

export function generateFixtures(outputDir?: string): Promise<Array<{
  name: string
  bytes: number
}>>
export declare function makeCjkPdf(): Uint8Array
