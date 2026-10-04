import type { InventoryLocationEntity } from './location.entity.js'

describe('InventoryLocationEntity', () => {
  it('keeps deletedAt outside current location output contract', () => {
    const location: InventoryLocationEntity = {
      id: 'location-1',
      code: 'LOC-LAB',
      name: 'Laboratorium',
      building: null,
      room: null,
      rack: null,
      description: null,
      createdAt: new Date(),
    }

    expect(location).not.toHaveProperty('deletedAt')
  })

  const staleLocation: InventoryLocationEntity = {
    id: 'location-1',
    code: 'LOC-LAB',
    name: 'Laboratorium',
    building: null,
    room: null,
    rack: null,
    description: null,
    createdAt: new Date(),
    // @ts-expect-error deletedAt is not part of the current location contract.
    deletedAt: null,
  }

  void staleLocation
})
