/** Wire shape of `GET /api/v1/raspi/status`. Pure data, no logic. */
export type RaspiStatus = {
  available: boolean
  name: string | null
  cpu_temperature: number | null
  cpu_usage: number | null
  memory_usage: number | null
}
