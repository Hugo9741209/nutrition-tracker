import { describe, it, expect } from 'vitest'
import { stravaAuthorizeUrl, normalizeStravaType, mapStravaActivity } from './strava.js'

describe('stravaAuthorizeUrl', () => {
  it('construit une URL OAuth valide', () => {
    const url = stravaAuthorizeUrl({ clientId: 123, redirectUri: 'https://app/cb' })
    expect(url).toContain('https://www.strava.com/oauth/authorize?')
    expect(url).toContain('client_id=123')
    expect(url).toContain('scope=activity%3Aread_all')
    expect(url).toContain('redirect_uri=https%3A%2F%2Fapp%2Fcb')
  })
})

describe('normalizeStravaType', () => {
  it('mappe les types Strava vers nos catégories', () => {
    expect(normalizeStravaType('Run')).toBe('run')
    expect(normalizeStravaType('TrailRun')).toBe('run')
    expect(normalizeStravaType('WeightTraining')).toBe('strength')
    expect(normalizeStravaType('Workout')).toBe('strength')
    expect(normalizeStravaType('Ride')).toBe('ride')
    expect(normalizeStravaType('Yoga')).toBe('yoga')
  })
})

describe('mapStravaActivity', () => {
  it('normalise une activité Strava (course)', () => {
    const r = mapStravaActivity({
      id: 999, name: 'Footing matin', sport_type: 'Run',
      distance: 10000, moving_time: 3000, calories: 700,
      start_date_local: '2026-06-21T07:30:00Z',
    })
    expect(r).toEqual({
      stravaId: 999, name: 'Footing matin', type: 'run',
      distanceKm: 10, durationMin: 50, calories: 700, date: '2026-06-21',
    })
  })
  it('gère les champs absents', () => {
    const r = mapStravaActivity({ id: 1, sport_type: 'WeightTraining', start_date: '2026-06-20T18:00:00Z' })
    expect(r.type).toBe('strength')
    expect(r.distanceKm).toBeNull()
    expect(r.calories).toBeNull()
    expect(r.date).toBe('2026-06-20')
  })
})
