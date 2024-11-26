export interface MapController {
  active: boolean
  setActive: (active: boolean) => void
  onMapUpdate?: () => void
  onMapRedraw?: () => void
}
