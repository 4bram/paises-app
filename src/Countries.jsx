import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'

export default function Countries() {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('countries')
        .select('cca3, name, official_name, capital, subregion, population, area, flag_url, regions(name)')
        .order('name')

      if (error) setError(error.message)
      else setCountries(data)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setSelected(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const regionNames = useMemo(
    () => [...new Set(countries.map((c) => c.regions?.name).filter(Boolean))].sort(),
    [countries]
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return countries.filter(
      (c) =>
        (!region || c.regions?.name === region) &&
        (!term || c.name.toLowerCase().includes(term))
    )
  }, [countries, search, region])

  if (loading) return <p className="status">Cargando paises...</p>
  if (error) return <p className="status error">No se pudieron cargar los paises: {error}</p>

  return (
    <>
      <div className="controls">
        <input
          type="search"
          placeholder="Buscar pais..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">Todas las regiones</option>
          {regionNames.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <span className="count">{filtered.length} paises</span>
      </div>

      {filtered.length === 0 ? (
        <p className="status">No hay paises que coincidan.</p>
      ) : (
        <div className="grid">
          {filtered.map((c) => (
            <article
              className="card"
              key={c.cca3}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(c)}
              onKeyDown={(e) => e.key === 'Enter' && setSelected(c)}
            >
              <img src={c.flag_url} alt={`Bandera de ${c.name}`} loading="lazy" />
              <div className="card-body">
                <h3>{c.name}</h3>
                <p>{c.regions?.name ?? 'Sin region'}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="Cerrar">
              ×
            </button>
            <img src={selected.flag_url} alt={`Bandera de ${selected.name}`} />
            <h2>{selected.name}</h2>
            <p className="official">{selected.official_name}</p>
            <dl>
              <dt>Region</dt>
              <dd>{selected.regions?.name ?? '-'}</dd>
              <dt>Subregion</dt>
              <dd>{selected.subregion ?? '-'}</dd>
              <dt>Capital</dt>
              <dd>{selected.capital ?? '-'}</dd>
              <dt>Poblacion</dt>
              <dd>{selected.population?.toLocaleString('es-MX') ?? '-'}</dd>
              <dt>Area</dt>
              <dd>
                {selected.area ? `${selected.area.toLocaleString('es-MX')} km²` : '-'}
              </dd>
            </dl>
          </div>
        </div>
      )}
    </>
  )
}