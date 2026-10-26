import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

const BASE_URL = 'https://api.restcountries.com/countries/v5'
const FIELDS = [
  'names.common',
  'names.official',
  'codes.alpha_3',
  'region',
  'subregion',
  'capitals',
  'population',
  'area.kilometers',
  'flag.url_svg',
].join(',')

async function fetchCountries() {
  const all = []
  const limit = 100 // maximo del plan gratis
  let offset = 0
  let more = true

  while (more) {
    const res = await fetch(
      `${BASE_URL}?response_fields=${FIELDS}&limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${process.env.RESTCOUNTRIES_API_KEY}` } }
    )
    if (!res.ok) throw new Error(`REST Countries respondio ${res.status}`)
    const json = await res.json()
    const page = json?.data?.objects
    if (!Array.isArray(page)) throw new Error('Respuesta inesperada del API')
    all.push(...page)
    console.log(`  pagina con offset ${offset}: ${page.length} paises`)
    more = json.data.meta.more
    offset += limit
  }

  if (all.length === 0) throw new Error('La API no regreso paises')
  return all
}

async function loadRegions(countries) {
  const names = [...new Set(countries.map((c) => c.region).filter(Boolean))]
  const { data, error } = await supabase
    .from('regions')
    .upsert(names.map((name) => ({ name })), { onConflict: 'name' })
    .select()
  if (error) throw error
  return Object.fromEntries(data.map((r) => [r.name, r.id]))
}

async function loadCountries(countries, regionIds) {
  const rows = countries.map((c) => ({
    cca3: c.codes.alpha_3,
    name: c.names.common,
    official_name: c.names.official,
    region_id: regionIds[c.region] ?? null,
    subregion: c.subregion || null,
    capital: c.capitals?.[0]?.name ?? null,
    population: c.population,
    area: c.area?.kilometers ?? null,
    flag_url: c.flag?.url_svg ?? null,
    updated_at: new Date().toISOString(),
  }))

  const BATCH = 100
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase
      .from('countries')
      .upsert(rows.slice(i, i + BATCH), { onConflict: 'cca3' })
    if (error) throw error
    console.log(`  lote ${i / BATCH + 1} guardado (${Math.min(i + BATCH, rows.length)}/${rows.length})`)
  }
}

try {
  console.log('Pidiendo paises al API publico...')
  const countries = await fetchCountries()
  console.log(`Recibidos: ${countries.length}`)

  const regionIds = await loadRegions(countries)
  console.log('Regiones guardadas:', Object.keys(regionIds).join(', '))

  await loadCountries(countries, regionIds)
  console.log('Carga terminada')
} catch (err) {
  console.error('Fallo la carga:', err.message ?? err)
  process.exit(1)
}