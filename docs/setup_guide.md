# Delay Modifier Setup Guide

Deploy a Delay proxy for your [Safe](https://app.safe.global/) using Zodiac Core's [`deployProxy`](https://github.com/gnosisguild/zodiac-core#deployproxy). The proxy is your Delay instance; the mastercopy is the shared implementation it points to. If the mastercopy already exists on your network, you do not need to deploy or verify it again.

## Prerequisites

Use Node.js 22.13 or newer on a supported even-numbered release and Yarn Classic. From the repository root, install the locked dependencies:

```sh
yarn install --frozen-lockfile
```

Choose a network listed in [the Hardhat config](../hardhat.config.ts), such as Sepolia, and create a Safe on that network. In a local `.env` file, set `SAFE_ADDRESS` to that Safe's address and configure a funded deployment account using `PK` (a private key) or `MNEMONIC`. For Sepolia, also set `INFURA_KEY`. See the [sample env file](../.env.sample). Never commit your `.env` file or use the default test mnemonic on a public network.

## Deploy a Delay instance

The example uses the version `2.0.0` address from [the mastercopy registry](../mastercopies.json). Zodiac Core uses its canonical Zodiac Module Proxy Factory; both the factory and your chosen mastercopy must have code on the selected network. Set `DELAY_NETWORK` in your shell to override the default of `sepolia`.

This example uses the Safe as the owner, avatar and target: the owner can change Delay settings and enable modules, the avatar is the account whose assets the modules act on, and the target is the contract Delay calls to execute transactions. The cooldown and expiration are in seconds: here, transactions wait one day and are executable for the next seven days. Set expiration to `0` for no expiry, or to at least `60` seconds.

Save this example as `deploy-delay.mjs` in the repository root:

```js
import { deployProxy, encodeDeployProxy, readMastercopies } from '@gnosis-guild/zodiac-core'
import hre from 'hardhat'

const { networkName, ethers, provider: rpc } = await hre.network.create()
if (networkName !== 'localhost' && !process.env.PK && !process.env.MNEMONIC) {
  throw new Error('Set PK or MNEMONIC for your funded deployment account')
}
if (!process.env.SAFE_ADDRESS) throw new Error('Set SAFE_ADDRESS')

const [signer] = await ethers.getSigners()
const safe = ethers.getAddress(process.env.SAFE_ADDRESS)
const [{ address: mastercopy }] = readMastercopies({
  contractName: 'Delay',
  contractVersion: '2.0.0',
})

const deployment = {
  mastercopy,
  setupArgs: {
    types: ['address', 'address', 'address', 'uint256', 'uint256'],
    values: [safe, safe, safe, 86_400n, 604_800n], // owner, avatar, target, cooldown, expiration
  },
  saltNonce: 1n,
}
const { to: factory } = encodeDeployProxy(deployment)
for (const address of [safe, mastercopy, factory]) {
  if (await ethers.provider.getCode(address) === '0x') {
    throw new Error(`No contract at ${address} on ${networkName}`)
  }
}

const provider = {
  async request({ method, params }) {
    if (method === 'eth_sendTransaction') {
      const { hash } = await signer.sendTransaction(params[0])
      return hash
    }
    return rpc.request({ method, params })
  },
}

const { address, noop } = await deployProxy({ ...deployment, provider })
if (await ethers.provider.getCode(address) === '0x') {
  throw new Error(`Proxy deployment failed at ${address}`)
}
console.log(`Delay proxy ${noop ? 'already exists' : 'deployed'} at ${address}`)
```

Run it with Hardhat:

```sh
yarn hardhat run deploy-delay.mjs --network "${DELAY_NETWORK:-sepolia}"
```

Save the printed **proxy** address. The mastercopy, setup values and `saltNonce` determine that address. Repeating the same deployment on the same network reports the existing proxy; use a different integer salt nonce to deploy another instance with the same settings.

## Connect the Delay instance to your Safe

1. In the Safe UI, propose and execute a Safe transaction calling `enableModule(address)` on the Safe with the Delay **proxy** address. This authorizes Delay to execute transactions through the Safe.
2. Have the Delay owner (the Safe in this example) execute `enableModule(address)` on the **Delay proxy** with the address of the upstream module that should enqueue transactions. If that module has a configurable target, point it at the Delay proxy rather than directly at the Safe so that it uses the queue.

Monitor the proxy's `TransactionAdded` events so stakeholders can react to queued transactions. Each event includes the queue nonce, transaction hash, destination, value, calldata and operation.

## Deploy and verify a mastercopy (maintainers only)

Use these tasks to publish a released implementation from [the mastercopy registry](../mastercopies.json) on a network that does not yet have it, not to create an instance. The registry's singleton factory must already be deployed on that network. Set `DELAY_NETWORK` in your shell to select a network other than Sepolia. For verification, set `ETHERSCAN_API_KEY` in `.env` and use an explorer supported by the task.

```sh
yarn deploy:mastercopy "${DELAY_NETWORK:-sepolia}" --contract-version 2.0.0
yarn verify:mastercopy "${DELAY_NETWORK:-sepolia}" --contract-version 2.0.0
```

The singular tasks default to the latest registered version if you omit the version flag. The `deploy:mastercopies` and `verify:mastercopies` tasks operate on all registered versions.

If verification of `2.0.0` fails with a source-path error, check the registry entry: the task submits `contracts/Delay.sol:Delay`, but the stored compiler input uses `project/contracts/Delay.sol`.
