import { readMastercopies } from '@gnosis-guild/zodiac-core'

export function readMastercopiesForVersion(
  contractVersion: string
): ReturnType<typeof readMastercopies> {
  const mastercopies = readMastercopies({ contractVersion })
  if (mastercopies.length === 0) {
    const versions = new Set(
      readMastercopies().map((mastercopy) => mastercopy.contractVersion)
    )

    throw new Error(
      `Unknown mastercopy contract version "${contractVersion}". Available versions: ${[...versions].join(', ') || '(none)'}`
    )
  }

  return mastercopies
}
