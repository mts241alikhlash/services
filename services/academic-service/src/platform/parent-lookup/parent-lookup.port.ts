export abstract class IParentLookupPort {
  abstract countByOccupation(occupationId: string): Promise<number>
}
