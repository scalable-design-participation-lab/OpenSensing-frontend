import { defineEventHandler, getQuery, createError } from 'h3'
import db from '~/utils/db'
import { subMonths } from 'date-fns'

const MAX_RANGE_DAYS = 90
const DEFAULT_LIMIT = 1000
const MAX_LIMIT = 5000

/**
 * Public endpoint for pulling sensor data by moduleId. Rate limiting is
 * enforced by server/middleware/public-api-rate-limit.ts for any request
 * under /api/public/*.
 *
 * Mirrors server/api/sensor-data.js but adds a capped date range and a
 * result limit, since public callers can request arbitrary ranges.
 */
export default defineEventHandler(async (event) => {
  try {
    const { moduleId, start, end, limit } = getQuery(event)

    const requestedLimit = limit ? Number(limit) : DEFAULT_LIMIT
    if (!Number.isFinite(requestedLimit) || requestedLimit <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid limit' })
    }
    const rowLimit = Math.min(requestedLimit, MAX_LIMIT)

    // === ALL SENSORS LATEST SNAPSHOT ===
    if (!moduleId) {
      const allSensorsQuery = await db.raw(`
        SELECT
          m.moduleid,
          m.ecohub_location,
          m.lat,
          m.lon,
          s.temperature,
          s.relative_humidity,
          s.voc,
          s.nox,
          s.pm1,
          s.pm25,
          s.pm4,
          s.pm10,
          s.timestamp,
          b.bme_temp,
          b.bme_humid,
          b.bme_pressure
        FROM modules m
        LEFT JOIN (
          SELECT DISTINCT ON (moduleid) *
          FROM sen55
          ORDER BY moduleid, timestamp DESC
        ) s ON m.moduleid = s.moduleid
        LEFT JOIN (
          SELECT DISTINCT ON (moduleid) *
          FROM bme_280
          ORDER BY moduleid, timestamp DESC
        ) b ON m.moduleid = b.moduleid
        ORDER BY m.moduleid;
      `)
      return allSensorsQuery.rows
    }

    let endDate = end ? new Date(end as string) : new Date()
    let startDate = start
      ? new Date(start as string)
      : subMonths(endDate, 1)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid start/end date' })
    }

    const maxRangeMs = MAX_RANGE_DAYS * 24 * 60 * 60 * 1000
    if (endDate.getTime() - startDate.getTime() > maxRangeMs) {
      startDate = new Date(endDate.getTime() - maxRangeMs)
    }

    // === MODULE METADATA ===
    const locationQuery = await db.raw(
      `SELECT moduleid, ecohub_location, lat, lon FROM modules WHERE moduleid = ?`,
      [moduleId]
    )
    const moduleInfo = locationQuery.rows[0]
    if (!moduleInfo)
      throw createError({ statusCode: 404, statusMessage: 'Module not found' })

    // === FETCH ENABLED SENSOR TABLES ===
    const sensorListQuery = await db.raw(
      `SELECT sensors FROM modulesensors WHERE moduleid = ?`,
      [moduleId]
    )
    const sensors = sensorListQuery.rows[0]?.sensors ?? []
    const sensorFields: Record<string, string[]> = {
      bme_280: ['bme_temp', 'bme_humid', 'bme_pressure'],
      scd_41: ['scd_temp', 'scd_humid', 'scd_co2'],
    }
    const filteredSensors = sensors.filter((s: string) => s in sensorFields)

    const selectFields = [
      's.timestamp',
      's.temperature',
      's.relative_humidity',
      's.voc',
      's.nox',
      's.pm1',
      's.pm25',
      's.pm4',
      's.pm10',
    ]
    const joinClauses: string[] = []

    for (const sensor of filteredSensors) {
      const fields = sensorFields[sensor]
      fields.forEach((f) => {
        selectFields.push(`${sensor}.${f} AS ${f}`)
      })

      joinClauses.push(`
        LEFT JOIN LATERAL (
          SELECT ${fields.join(', ')}
          FROM ${sensor}
          WHERE moduleid = s.moduleid
          ORDER BY ABS(EXTRACT(EPOCH FROM (s.timestamp - timestamp)))
          LIMIT 1
        ) ${sensor} ON true
      `)
    }

    const dynamicQuery = `
      SELECT ${selectFields.join(',\n')}
      FROM sen55 s
      ${joinClauses.join('\n')}
      WHERE s.moduleid = ?
        AND s.timestamp BETWEEN ? AND ?
      ORDER BY s.timestamp DESC
      LIMIT ?
    `

    const result = await db.raw(dynamicQuery, [
      moduleId,
      startDate.toISOString(),
      endDate.toISOString(),
      rowLimit,
    ])

    return {
      moduleInfo,
      sensorData: result.rows,
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('Error executing public sensor-data query', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
