import type { EIP1193Provider } from '@gnosis-guild/zodiac-core'

export async function ensureMastercopyDeployed(
  provider: EIP1193Provider,
  address: string,
  contractName: string,
  contractVersion: string
) {
  const code = await provider.request({
    method: 'eth_getCode',
    params: [address, 'latest'],
  })
  if (code === '0x') {
    throw new Error(
      `Failed to deploy ${contractName}@${contractVersion}: no bytecode at ${address}`
    )
  }
}
