import { useEffect, useState } from 'react'

const API_BASE = '/api'

type Config = {
  latent_dim: number
  hidden_dim: number
  learning_rate: number
  batch_size: number
  plan_horizon: number
  obs_dim: number
  action_dim: number
}

type TrainResult = {
  steps: number
  final_loss: number
  loss_history: number[]
}

type PlanResult = {
  actions: number[][][]
}

type YoutubeVideo = {
  id: string
  title: string
  description: string
  channelTitle: string
  publishedAt: string
  thumbnails?: Record<string, { url: string }>
}

export default function App() {
  const [config, setConfig] = useState<Config | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [trainSteps, setTrainSteps] = useState(100)
  const [trainBatch, setTrainBatch] = useState(32)
  const [trainLr, setTrainLr] = useState(1e-4)
  const [training, setTraining] = useState(false)
  const [trainResult, setTrainResult] = useState<TrainResult | null>(null)
  const [trainError, setTrainError] = useState<string | null>(null)
  const [planHorizon, setPlanHorizon] = useState(5)
  const [planning, setPlanning] = useState(false)
  const [planResult, setPlanResult] = useState<PlanResult | null>(null)
  const [planError, setPlanError] = useState<string | null>(null)
  // YouTube (Algorythm-style) → AGI
  const [ytQuery, setYtQuery] = useState('trending reels shorts')
  const [ytVideos, setYtVideos] = useState<YoutubeVideo[]>([])
  const [ytLoading, setYtLoading] = useState(false)
  const [ytError, setYtError] = useState<string | null>(null)
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set())
  const [encodeVideoLoading, setEncodeVideoLoading] = useState(false)
  const [encodeVideoResult, setEncodeVideoResult] = useState<{ latents: number[][] } | null>(null)
  const [encodeVideoError, setEncodeVideoError] = useState<string | null>(null)
  // Train on YouTube (JEPA learning from video pairs)
  const [ytTrainQuery, setYtTrainQuery] = useState('trending reels shorts')
  const [ytTrainTrending, setYtTrainTrending] = useState(false)
  const [ytTrainSteps, setYtTrainSteps] = useState(50)
  const [ytTrainBatch, setYtTrainBatch] = useState(8)
  const [ytTrainLoading, setYtTrainLoading] = useState(false)
  const [ytTrainResult, setYtTrainResult] = useState<TrainResult | null>(null)
  const [ytTrainError, setYtTrainError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => {
        if (!r.ok) {
          if (r.status === 404) {
            throw new Error('API returned 404. Use the UI at http://localhost:5173 (not :8000). If you are on :5173, start the backend: cd agi_jepa && python -m uvicorn agi_jepa.api.main:app --port 8000')
          }
          throw new Error(`Backend error ${r.status}`)
        }
        return r.json()
      })
      .then(() =>
        fetch(`${API_BASE}/config`)
          .then((r) => {
            if (!r.ok) throw new Error(`Config ${r.status}`)
            return r.json()
          })
          .then(setConfig)
          .catch((e) => setConfigError(e.message))
      )
      .catch((e) => setConfigError(e instanceof Error ? e.message : 'Backend not reachable. Start it: cd agi_jepa && python -m uvicorn agi_jepa.api.main:app --port 8000'))
  }, [])

  async function runTrain() {
    setTraining(true)
    setTrainError(null)
    setTrainResult(null)
    try {
      const res = await fetch(`${API_BASE}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: trainSteps,
          batch_size: trainBatch,
          lr: trainLr,
        }),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      const data: TrainResult = await res.json()
      setTrainResult(data)
    } catch (e) {
      setTrainError(e instanceof Error ? e.message : String(e))
    } finally {
      setTraining(false)
    }
  }

  async function youtubeSearch() {
    setYtLoading(true)
    setYtError(null)
    setYtVideos([])
    try {
      const res = await fetch(`${API_BASE}/youtube/search?q=${encodeURIComponent(ytQuery)}&max_results=20`)
      if (!res.ok) {
        const t = await res.json().catch(() => ({}))
        const d = (t as { detail?: string | string[] }).detail; throw new Error(Array.isArray(d) ? d[0] : d || res.statusText)
      }
      const data = await res.json()
      setYtVideos(data.items || [])
    } catch (e) {
      setYtError(e instanceof Error ? e.message : String(e))
    } finally {
      setYtLoading(false)
    }
  }

  async function youtubeTrending() {
    setYtLoading(true)
    setYtError(null)
    setYtVideos([])
    try {
      const res = await fetch(`${API_BASE}/youtube/trending?region_code=US&max_results=20`)
      if (!res.ok) {
        const t = await res.json().catch(() => ({}))
        const d = (t as { detail?: string | string[] }).detail
        throw new Error(Array.isArray(d) ? d[0] : d || res.statusText)
      }
      const data = await res.json()
      setYtVideos(data.items || [])
    } catch (e) {
      setYtError(e instanceof Error ? e.message : String(e))
    } finally {
      setYtLoading(false)
    }
  }

  function toggleVideoSelection(id: string) {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function trainOnYouTube() {
    setYtTrainLoading(true)
    setYtTrainError(null)
    setYtTrainResult(null)
    try {
      const res = await fetch(`${API_BASE}/train/youtube`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: ytTrainTrending ? undefined : ytTrainQuery,
          use_trending: ytTrainTrending,
          steps: ytTrainSteps,
          batch_size: ytTrainBatch,
          lr: 1e-4,
          region_code: 'US',
          max_videos: 50,
        }),
      })
      if (!res.ok) {
        const t = await res.json().catch(() => ({}))
        const d = (t as { detail?: string | string[] }).detail
        throw new Error(Array.isArray(d) ? d[0] : d || res.statusText)
      }
      const data: TrainResult = await res.json()
      setYtTrainResult(data)
    } catch (e) {
      setYtTrainError(e instanceof Error ? e.message : String(e))
    } finally {
      setYtTrainLoading(false)
    }
  }

  async function encodeSelectedVideos() {
    const toEncode = ytVideos.filter((v) => selectedVideoIds.has(v.id))
    if (toEncode.length === 0) {
      setEncodeVideoError('Select at least one video')
      return
    }
    setEncodeVideoLoading(true)
    setEncodeVideoError(null)
    setEncodeVideoResult(null)
    try {
      const res = await fetch(`${API_BASE}/youtube/encode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videos: toEncode.map((v) => ({
            id: v.id,
            title: v.title,
            description: v.description || '',
            channelTitle: v.channelTitle || '',
            publishedAt: v.publishedAt || '',
            thumbnails: v.thumbnails || {},
          })),
        }),
      })
      if (!res.ok) {
        const t = await res.json().catch(() => ({}))
        const d = (t as { detail?: string | string[] }).detail
        throw new Error(Array.isArray(d) ? d[0] : d || res.statusText)
      }
      const data = await res.json()
      setEncodeVideoResult(data)
    } catch (e) {
      setEncodeVideoError(e instanceof Error ? e.message : String(e))
    } finally {
      setEncodeVideoLoading(false)
    }
  }

  async function runPlan() {
    setPlanning(true)
    setPlanError(null)
    setPlanResult(null)
    try {
      const res = await fetch(`${API_BASE}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latent: null,
          horizon: planHorizon,
          num_candidates: 32,
        }),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      const data: PlanResult = await res.json()
      setPlanResult(data)
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : String(e))
    } finally {
      setPlanning(false)
    }
  }

  return (
    <>
      <h1>AGI-JEPA</h1>
      <p style={{ margin: 0, color: '#9ca3af' }}>
        Joint Embedding Predictive Architecture — config, training, and planning.
      </p>

      <section className="card">
        <h2>Backend config</h2>
        {configError && <p className="error">{configError}</p>}
        {config && (
          <pre className="pre">
            latent_dim={config.latent_dim}  plan_horizon={config.plan_horizon}
            batch_size={config.batch_size}  lr={config.learning_rate}
            obs_dim={config.obs_dim}  action_dim={config.action_dim}
          </pre>
        )}
      </section>

      <section className="card">
        <h2>Train (JEPA)</h2>
        <p style={{ margin: '0 0 0.75rem 0', color: '#9ca3af' }}>
          Run encoder + predictor training for a few steps (dummy data).
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label>
            Steps <input
              type="number"
              min={1}
              max={2000}
              value={trainSteps}
              onChange={(e) => setTrainSteps(Number(e.target.value))}
            />
          </label>
          <label>
            Batch size{' '}
            <input
              type="number"
              min={1}
              max={128}
              value={trainBatch}
              onChange={(e) => setTrainBatch(Number(e.target.value))}
            />
          </label>
          <label>
            LR{' '}
            <input
              type="number"
              step="1e-5"
              min={1e-5}
              max={0.1}
              value={trainLr}
              onChange={(e) => setTrainLr(Number(e.target.value))}
            />
          </label>
          <button onClick={runTrain} disabled={training || !config}>
            {training ? 'Training…' : 'Run training'}
          </button>
        </div>
        {trainError && <p className="error">{trainError}</p>}
        {trainResult && (
          <p className="success">
            Done: {trainResult.steps} steps, final loss = {trainResult.final_loss.toFixed(6)}
          </p>
        )}
        {trainResult && trainResult.loss_history.length > 0 && (
          <p className="pre" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Loss curve (first/last 5):{' '}
            {[
              ...trainResult.loss_history.slice(0, 5),
              '…',
              ...trainResult.loss_history.slice(-5),
            ].join(', ')}
          </p>
        )}
      </section>

      <section className="card">
        <h2>Train on YouTube (JEPA from videos)</h2>
        <p style={{ margin: '0 0 0.75rem 0', color: '#9ca3af' }}>
          Fetch videos via YouTube API (search or trending), form consecutive pairs (video i → video i+1), and train the JEPA predictor to predict the next video&apos;s latent from the current one.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <input type="checkbox" checked={ytTrainTrending} onChange={(e) => setYtTrainTrending(e.target.checked)} />
            Use trending
          </label>
          {!ytTrainTrending && (
            <input
              type="text"
              value={ytTrainQuery}
              onChange={(e) => setYtTrainQuery(e.target.value)}
              placeholder="Search query"
              style={{ minWidth: '160px' }}
            />
          )}
          <label>Steps <input type="number" min={5} max={500} value={ytTrainSteps} onChange={(e) => setYtTrainSteps(Number(e.target.value))} /></label>
          <label>Batch <input type="number" min={1} max={32} value={ytTrainBatch} onChange={(e) => setYtTrainBatch(Number(e.target.value))} /></label>
          <button onClick={trainOnYouTube} disabled={ytTrainLoading || !config}>
            {ytTrainLoading ? 'Training on YouTube…' : 'Train on YouTube'}
          </button>
        </div>
        {ytTrainError && <p className="error">{ytTrainError}</p>}
        {ytTrainResult && (
          <p className="success">
            Done: {ytTrainResult.steps} steps, final loss = {ytTrainResult.final_loss.toFixed(6)}
          </p>
        )}
      </section>

      <section className="card">
        <h2>Plan</h2>
        <p style={{ margin: '0 0 0.75rem 0', color: '#9ca3af' }}>
          Value-guided action sequence from a random latent (world model + value head).
        </p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label>
            Horizon{' '}
            <input
              type="number"
              min={1}
              max={20}
              value={planHorizon}
              onChange={(e) => setPlanHorizon(Number(e.target.value))}
            />
          </label>
          <button onClick={runPlan} disabled={planning || !config}>
            {planning ? 'Planning…' : 'Run plan'}
          </button>
        </div>
        {planError && <p className="error">{planError}</p>}
        {planResult && (
          <p className="success">
            Got action sequence shape (1, {planHorizon}, {config?.action_dim ?? '?'})
          </p>
        )}
        {planResult && planResult.actions[0] && (
          <pre className="pre" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            First 2 steps: {JSON.stringify(planResult.actions[0].slice(0, 2))}
          </pre>
        )}
      </section>

      <section className="card">
        <h2>YouTube → AGI (Algorythm)</h2>
        <p style={{ margin: '0 0 0.75rem 0', color: '#9ca3af' }}>
          Search or load trending videos (YouTube Data API, same as <code>aixApp/algorythm</code>), then encode them into JEPA latents.
        </p>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#9ca3af' }}>
          Set <code>YOUTUBE_API_KEY</code> in the backend environment.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
          <input
            type="text"
            value={ytQuery}
            onChange={(e) => setYtQuery(e.target.value)}
            placeholder="Search query"
            style={{ minWidth: '180px' }}
          />
          <button onClick={youtubeSearch} disabled={ytLoading || !config}>
            {ytLoading ? 'Loading…' : 'Search'}
          </button>
          <button onClick={youtubeTrending} disabled={ytLoading || !config}>
            Trending
          </button>
        </div>
        {ytError && <p className="error">{ytError}</p>}
        {ytVideos.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem' }}>{ytVideos.length} videos — select then Encode</span>
              <button onClick={encodeSelectedVideos} disabled={encodeVideoLoading || selectedVideoIds.size === 0}>
                {encodeVideoLoading ? 'Encoding…' : `Encode in JEPA (${selectedVideoIds.size})`}
              </button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '240px', overflowY: 'auto' }}>
              {ytVideos.slice(0, 15).map((v) => (
                <li
                  key={v.id}
                  style={{
                    padding: '0.4rem 0.5rem',
                    marginBottom: '0.25rem',
                    background: selectedVideoIds.has(v.id) ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.15)',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleVideoSelection(v.id)}
                >
                  <strong style={{ fontSize: '0.85rem' }}>{v.title.slice(0, 50)}{v.title.length > 50 ? '…' : ''}</strong>
                  {v.channelTitle && <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block' }}>{v.channelTitle}</span>}
                </li>
              ))}
            </ul>
            {encodeVideoError && <p className="error">{encodeVideoError}</p>}
            {encodeVideoResult && (
              <p className="success" style={{ marginTop: '0.5rem' }}>
                Encoded {encodeVideoResult.latents.length} video(s) → latents shape [{encodeVideoResult.latents.length}, {config?.latent_dim ?? '?'}]
              </p>
            )}
          </>
        )}
      </section>
    </>
  )
}
