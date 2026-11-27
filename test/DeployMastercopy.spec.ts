import { rejects } from 'node:assert/strict'
import hre from 'hardhat'

describe('Mastercopy deployment tasks', () => {
  it('rejects deploy:mastercopy when the deployment leaves no bytecode', async () => {
    await rejects(
      hre.tasks.getTask('deploy:mastercopy').run({ contractVersion: '2.0.0' }),
      /Failed to deploy Delay@2\.0\.0: no bytecode at 0x[0-9a-fA-F]{40}/
    )
  })

  it('rejects deploy:mastercopies when a deployment leaves no bytecode', async () => {
    await rejects(
      hre.tasks.getTask('deploy:mastercopies').run(),
      /Failed to deploy Delay@[^:]+: no bytecode at 0x[0-9a-fA-F]{40}/
    )
  })
})
