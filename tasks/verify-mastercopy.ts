import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre'

import { verifyMastercopy } from '@gnosis-guild/zodiac-core'

import { getBlockExplorerApiUrl } from './block-explorers.js'
import { readMastercopiesForVersion } from './read-mastercopies-for-version.js'

interface VerifyMastercopyTaskArguments {
  contractVersion: string
}

export default async function (
  { contractVersion }: VerifyMastercopyTaskArguments,
  hre: HardhatRuntimeEnvironment
) {
  const artifacts = readMastercopiesForVersion(contractVersion)
  const apiKey = process.env.ETHERSCAN_API_KEY ?? ''
  const { ethers, networkName } = await hre.network.create()
  const { chainId } = await ethers.provider.getNetwork()

  for (const artifact of artifacts) {
    const { noop } = await verifyMastercopy({
      artifact,
      chainId: Number(chainId),
      apiKey,
      apiUrl: getBlockExplorerApiUrl(networkName),
    })

    const { contractName, contractVersion, address } = artifact

    if (noop) {
      console.log(
        `🔄 ${contractName}@${contractVersion}: Already verified at ${address}`
      )
    } else {
      console.log(
        `🚀 ${contractName}@${contractVersion}: Successfully verified at ${address}`
      )
    }
  }
}
