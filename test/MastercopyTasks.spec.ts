import { rejects } from 'node:assert/strict'

import hre from 'hardhat'

import mastercopies from '../mastercopies.json' with { type: 'json' }

describe('Single-version mastercopy tasks', () => {
  for (const name of ['deploy:mastercopy', 'verify:mastercopy']) {
    it(`${name} rejects an unknown contract version and lists available versions`, async () => {
      const versions = Object.keys(mastercopies.Delay).join(', ')

      await rejects(hre.tasks.getTask(name).run({ contractVersion: '9.9.9' }), {
        message: `Unknown mastercopy contract version "9.9.9". Available versions: ${versions}`,
      })
    })
  }
})
