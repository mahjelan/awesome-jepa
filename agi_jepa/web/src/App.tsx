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
  const [ytKeyConfigured, setYtKeyConfigured] = useState<boolean | null>(null)
  // Output: latest result text + video to show in GUI
  const [outputLines, setOutputLines] = useState<string[]>([])
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null)
  // JEPA analysis result for the currently previewed video (analysis, not modified video)
  const [videoAnalysis, setVideoAnalysis] = useState<{
    summary: string
    latent_norm: number
    latent_preview: number[]
    predicted_next_norm?: number
    predicted_next_preview?: number[]
  } | null>(null)
  const [videoAnalysisLoading, setVideoAnalysisLoading] = useState(false)
  const [videoAnalysisError, setVideoAnalysisError] = useState<string | null>(null)
  const [pixelInsights, setPixelInsights] = useState<{
    brightness: number
    contrast: number
    edge_density: number
    dominant_colors: [number, number, number][]
    insight_summary: string
    thumbnail_url: string
    frame_size: [number, number]
  } | null>(null)
  const [pixelInsightsError, setPixelInsightsError] = useState<string | null>(null)
  const [overlayDownloadLoading, setOverlayDownloadLoading] = useState(false)
  const [overlayDownloadError, setOverlayDownloadError] = useState<string | null>(null)
  const [videoDescriptor, setVideoDescriptor] = useState<{ descriptor_text: string; descriptor_json: object } | null>(null)
  const [descriptorLoading, setDescriptorLoading] = useState(false)
  const [descriptorError, setDescriptorError] = useState<string | null>(null)
  // Modification palette for result video pixels (1 = no change; tint -50..50)
  const [modBrightness, setModBrightness] = useState(1)
  const [modContrast, setModContrast] = useState(1)
  const [modSaturation, setModSaturation] = useState(1)
  const [modTintR, setModTintR] = useState(0)
  const [modTintG, setModTintG] = useState(0)
  const [modTintB, setModTintB] = useState(0)
  const [includeDescriptorCard, setIncludeDescriptorCard] = useState(true)
  const [savedPresets, setSavedPresets] = useState<{ name: string; mod: Record<string, number> }[]>(() => {
    try {
      const s = localStorage.getItem('jepa_palette_presets')
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const [tintPaletteChoice, setTintPaletteChoice] = useState<string>('')
  const [contentAnalysis, setContentAnalysis] = useState<{
    num_frames: number
    temporal: { frame_errors: number[]; mean_error: number; high_error_frame_indices: number[]; summary: string }
    semantic: { keyframe_labels: { frame_index: number; top_classes: { label: string; prob: number }[] }[]; aggregated_top: { label: string; count: number }[]; summary: string }
  } | null>(null)
  const [contentAnalysisLoading, setContentAnalysisLoading] = useState(false)
  const [contentAnalysisError, setContentAnalysisError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!config) return
    fetch(`${API_BASE}/youtube/status`)
      .then((r) => r.ok ? r.json() : { configured: false })
      .then((data: { configured?: boolean }) => setYtKeyConfigured(!!data?.configured))
      .catch(() => setYtKeyConfigured(false))
  }, [config])

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
      setOutputLines((prev) => [...prev, `Training: ${data.steps} steps, final loss ${data.final_loss.toFixed(6)}`])
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
      setOutputLines((prev) => [...prev, `Train on YouTube: ${data.steps} steps, final loss ${data.final_loss.toFixed(6)}`])
    } catch (e) {
      setYtTrainError(e instanceof Error ? e.message : String(e))
    } finally {
      setYtTrainLoading(false)
    }
  }

  async function analyzeVideoWithJEPA() {
    const video = ytVideos.find((v) => v.id === previewVideoId)
    if (!video || !config) return
    setVideoAnalysisLoading(true)
    setVideoAnalysisError(null)
    setVideoAnalysis(null)
    setPixelInsights(null)
    setPixelInsightsError(null)
    try {
      const [analyzeRes, pixelRes] = await Promise.all([
        fetch(`${API_BASE}/youtube/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video: {
            id: video.id,
            title: video.title,
            description: video.description || '',
            channelTitle: video.channelTitle || '',
            publishedAt: video.publishedAt || '',
            thumbnails: video.thumbnails || {},
          },
        }),
      }),
        fetch(`${API_BASE}/youtube/pixel_insights?video_id=${encodeURIComponent(video.id)}`),
      ])
      if (!analyzeRes.ok) {
        const t = await analyzeRes.json().catch(() => ({}))
        const d = (t as { detail?: string | string[] }).detail
        throw new Error(Array.isArray(d) ? d[0] : d || analyzeRes.statusText)
      }
      const data = await analyzeRes.json()
      setVideoAnalysis({
        summary: data.summary,
        latent_norm: data.latent_norm,
        latent_preview: data.latent_preview || [],
        predicted_next_norm: data.predicted_next_norm,
        predicted_next_preview: data.predicted_next_preview || undefined,
      })
      setOutputLines((prev) => [...prev, `JEPA analysis: ${video.title.slice(0, 40)}… → latent norm ${data.latent_norm.toFixed(3)}`])
      if (pixelRes.ok) {
        const pixelData = await pixelRes.json()
        setPixelInsights({
          brightness: pixelData.brightness,
          contrast: pixelData.contrast,
          edge_density: pixelData.edge_density,
          dominant_colors: pixelData.dominant_colors || [],
          insight_summary: pixelData.insight_summary || '',
          thumbnail_url: pixelData.thumbnail_url || '',
          frame_size: pixelData.frame_size || [0, 0],
        })
      } else {
        setPixelInsightsError('Pixel analysis unavailable')
      }
    } catch (e) {
      setVideoAnalysisError(e instanceof Error ? e.message : String(e))
    } finally {
      setVideoAnalysisLoading(false)
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
      setOutputLines((prev) => [...prev, `Encoded ${data.latents.length} video(s) → JEPA latents`])
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
      setOutputLines((prev) => [...prev, `Plan: ${planHorizon}-step action sequence`])
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : String(e))
    } finally {
      setPlanning(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h1>AGI-JEPA</h1>
      <p style={{ margin: 0, color: '#9ca3af' }}>
        Joint Embedding Predictive Architecture — config, training, and planning.
      </p>

      <section className="card" style={{ order: 1 }}>
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

      <section className="card" style={{ order: 2 }}>
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

      <section className="card" style={{ order: 3 }}>
        <h2>Train on YouTube (JEPA from videos)</h2>
        <p style={{ margin: '0 0 0.75rem 0', color: '#9ca3af' }}>
          Fetch videos via YouTube API (search or trending), form consecutive pairs (video i → video i+1), and train the JEPA predictor to predict the next video&apos;s latent from the current one.
        </p>
        {ytKeyConfigured === false && (
          <p className="error" style={{ marginBottom: '0.5rem' }}>YOUTUBE_API_KEY not set. Set it in the API environment and restart the server (see README or agi_jepa/.env.example).</p>
        )}
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

      <section className="card" style={{ order: 4 }}>
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

      <section className="card" style={{ order: 5 }}>
        <h2>YouTube → AGI (Algorythm)</h2>
        <p style={{ margin: '0 0 0.75rem 0', color: '#9ca3af' }}>
          Search or load trending videos (YouTube Data API, same as <code>aixApp/algorythm</code>), then encode them into JEPA latents.
        </p>
        {ytKeyConfigured === false && (
          <div style={{ padding: '0.75rem', background: 'rgba(248, 113, 113, 0.15)', borderRadius: 6, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            <strong>YOUTUBE_API_KEY not set.</strong> Restart the API with the key in the environment:
            <pre className="pre" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>{'Windows (PowerShell):\n  cd agi_jepa\n  $env:YOUTUBE_API_KEY = "your_key"\n  python -m uvicorn agi_jepa.api.main:app --port 8000\n\nMac/Linux:\n  cd agi_jepa\n  export YOUTUBE_API_KEY=your_key\n  python -m uvicorn agi_jepa.api.main:app --port 8000'}</pre>
            Get a key: Google Cloud Console → APIs &amp; Services → Credentials → enable YouTube Data API v3.
          </div>
        )}
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
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '320px', overflowY: 'auto' }}>
              {ytVideos.slice(0, 15).map((v) => (
                <li
                  key={v.id}
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '0.4rem 0.5rem',
                    marginBottom: '0.25rem',
                    background: selectedVideoIds.has(v.id) ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.15)',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleVideoSelection(v.id)}
                >
                  {(v.thumbnails?.medium?.url || v.thumbnails?.default?.url) && (
                    <img
                      src={v.thumbnails.medium?.url || v.thumbnails.default?.url}
                      alt=""
                      style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: '0.85rem' }}>{v.title.slice(0, 50)}{v.title.length > 50 ? '…' : ''}</strong>
                    {v.channelTitle && <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block' }}>{v.channelTitle}</span>}
                    <button
                      type="button"
                      onClick={(ev) => { ev.stopPropagation(); setPreviewVideoId(v.id); }}
                      style={{ marginTop: '0.25rem', fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
                    >
                      Play
                    </button>
                  </div>
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

      <section className="card" style={{ order: 6 }}>
        <h2>Output</h2>
        <p style={{ margin: '0 0 0.5rem 0', color: '#9ca3af', fontSize: '0.9rem' }}>
          Latest results (text) and video preview from the AGI pipeline.
        </p>
        {outputLines.length > 0 && (
          <>
            <pre className="pre" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 6, marginBottom: '0.75rem', maxHeight: '120px', overflowY: 'auto' }}>
              {outputLines.slice(-10).join('\n')}
            </pre>
            <button type="button" onClick={() => setOutputLines([])} style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Clear output</button>
          </>
        )}
        {previewVideoId && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.9rem' }}>Original YouTube video (not modified by JEPA)</span>
              <button type="button" onClick={() => { setPreviewVideoId(null); setVideoAnalysis(null); setVideoAnalysisError(null); setPixelInsights(null); setPixelInsightsError(null); setVideoDescriptor(null); setDescriptorError(null); setContentAnalysis(null); setContentAnalysisError(null); }} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>Close</button>
            </div>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8, background: '#000' }}>
              <iframe
                title="YouTube preview"
                src={`https://www.youtube.com/embed/${previewVideoId}?autoplay=0`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              {videoAnalysis && (() => {
                const z = videoAnalysis.latent_preview
                const zPred = videoAnalysis.predicted_next_preview
                const maxZ = Math.max(1e-6, ...z.map((v) => Math.abs(v)))
                const maxPred = zPred && zPred.length ? Math.max(1e-6, ...zPred.map((v) => Math.abs(v))) : maxZ
                return (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                      color: '#e5e7eb',
                      padding: '1.5rem 0.75rem 0.75rem 0.75rem',
                      fontSize: '0.8rem',
                      lineHeight: 1.4,
                      pointerEvents: 'auto',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '0.35rem', color: '#93c5fd' }}>JEPA analysis overlay</div>
                    <div style={{ marginBottom: '0.35rem', maxHeight: '2.2em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{videoAnalysis.summary}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', marginBottom: '0.4rem' }}>
                      <span>‖z‖= <strong>{videoAnalysis.latent_norm.toFixed(3)}</strong></span>
                      {videoAnalysis.predicted_next_norm != null && (
                        <span>‖ẑ‖= <strong>{videoAnalysis.predicted_next_norm.toFixed(3)}</strong></span>
                      )}
                    </div>
                    <div style={{ marginBottom: '0.2rem', fontSize: '0.7rem', opacity: 0.85 }}>Latent fingerprint (first 8 dims) — current z vs predicted next ẑ</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: 28 }}>
                      {z.map((v, i) => (
                        <div
                          key={`z-${i}`}
                          title={`z[${i}]=${v.toFixed(3)}`}
                          style={{
                            flex: 1,
                            minWidth: 4,
                            height: `${Math.min(100, (Math.abs(v) / maxZ) * 100)}%`,
                            background: v >= 0 ? 'rgba(59, 130, 246, 0.9)' : 'rgba(96, 165, 250, 0.5)',
                            borderRadius: 1,
                          }}
                        />
                      ))}
                    </div>
                    {zPred && zPred.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: 28, marginTop: 2 }}>
                        {zPred.map((v, i) => (
                          <div
                            key={`p-${i}`}
                            title={`ẑ[${i}]=${v.toFixed(3)}`}
                            style={{
                              flex: 1,
                              minWidth: 4,
                              height: `${Math.min(100, (Math.abs(v) / maxPred) * 100)}%`,
                              background: v >= 0 ? 'rgba(251, 146, 60, 0.9)' : 'rgba(253, 186, 116, 0.5)',
                              borderRadius: 1,
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: 4, fontSize: '0.65rem', opacity: 0.8 }}>
                      <span style={{ color: '#93c5fd' }}>▬ z (current)</span>
                      {zPred?.length ? <span style={{ color: '#fdba74' }}>▬ ẑ (predicted next)</span> : null}
                    </div>
                    {pixelInsights && (
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: 2, color: '#a5b4fc' }}>Pixel analysis (frame)</div>
                        <div style={{ fontSize: '0.7rem', marginBottom: 4 }}>{pixelInsights.insight_summary}</div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span>B:{pixelInsights.brightness.toFixed(2)} C:{pixelInsights.contrast.toFixed(2)} E:{pixelInsights.edge_density.toFixed(2)}</span>
                          {pixelInsights.dominant_colors.map((rgb, i) => (
                            <span key={i} style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 2, background: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`, border: '1px solid rgba(255,255,255,0.3)' }} title={`RGB(${rgb[0]},${rgb[1]},${rgb[2]})`} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button type="button" onClick={analyzeVideoWithJEPA} disabled={videoAnalysisLoading || !ytVideos.some((v) => v.id === previewVideoId)}>
                  {videoAnalysisLoading ? 'Analyzing…' : 'Analyze with JEPA'}
                </button>
                <button
                  type="button"
                  disabled={contentAnalysisLoading || !previewVideoId}
                  onClick={async () => {
                    if (!previewVideoId) return
                    setContentAnalysisLoading(true)
                    setContentAnalysisError(null)
                    setContentAnalysis(null)
                    try {
                      const res = await fetch(`${API_BASE}/youtube/analyze_content`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ video_id: previewVideoId, max_duration_sec: 45, max_frames: 30 }),
                      })
                      if (!res.ok) {
                        const t = await res.json().catch(() => ({}))
                        throw new Error((t as { detail?: string }).detail ?? res.statusText)
                      }
                      const data = await res.json()
                      setContentAnalysis(data)
                    } catch (e) {
                      setContentAnalysisError(e instanceof Error ? e.message : String(e))
                    } finally {
                      setContentAnalysisLoading(false)
                    }
                  }}
                >
                  {contentAnalysisLoading ? 'Analyzing content…' : 'Analyze content (temporal + semantic)'}
                </button>
              </div>
              {videoAnalysisError && <p className="error" style={{ marginTop: '0.25rem' }}>{videoAnalysisError}</p>}
              {contentAnalysisError && <p className="error" style={{ marginTop: '0.25rem' }}>{contentAnalysisError}</p>}
              {(videoAnalysis || pixelInsights || contentAnalysis) && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 6, fontSize: '0.9rem' }}>
                  <strong>Results after analysis</strong>
                  {videoAnalysis && (
                    <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem' }}>
                      <li><strong>Video:</strong> Original YouTube video only (above). No video is generated or modified by JEPA.</li>
                      <li><strong>JEPA text:</strong> {videoAnalysis.summary}</li>
                      <li><strong>JEPA numerical:</strong> Latent norm = {videoAnalysis.latent_norm.toFixed(4)}
                        {videoAnalysis.predicted_next_norm != null && `; Predicted-next norm = ${videoAnalysis.predicted_next_norm.toFixed(4)}`}.
                        First 8 latent dims: [{videoAnalysis.latent_preview.map((x) => x.toFixed(3)).join(', ')}]
                      </li>
                    </ul>
                  )}
                  {pixelInsights && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>Pixel analysis (thumbnail frame)</strong>
                      <p style={{ margin: '0.25rem 0 0 0' }}>{pixelInsights.insight_summary}</p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                        Brightness: {pixelInsights.brightness.toFixed(3)} · Contrast: {pixelInsights.contrast.toFixed(3)} · Edge density: {pixelInsights.edge_density.toFixed(3)}
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Dominant colors:</p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        {pixelInsights.dominant_colors.map((rgb, i) => (
                          <span key={i} style={{ width: 24, height: 24, borderRadius: 4, background: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`, border: '1px solid #555' }} title={`RGB(${rgb[0]},${rgb[1]},${rgb[2]})`} />
                        ))}
                      </div>
                    </div>
                  )}
                  {pixelInsightsError && <p className="error" style={{ marginTop: 4 }}>{pixelInsightsError}</p>}
                  {contentAnalysis && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                      <strong>Content analysis (temporal + semantic)</strong>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>{contentAnalysis.num_frames} frames analyzed.</p>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Temporal:</strong> {contentAnalysis.temporal.summary}</p>
                      {contentAnalysis.temporal.frame_errors.length > 0 && (
                        <div style={{ marginTop: '0.35rem' }}>
                          <span style={{ fontSize: '0.8rem' }}>Frame-to-frame change (first 20): </span>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 24, marginTop: 2 }}>
                            {contentAnalysis.temporal.frame_errors.slice(0, 20).map((e, i) => {
                              const maxE = Math.max(...contentAnalysis.temporal.frame_errors)
                              return (
                                <div
                                  key={i}
                                  title={`Frame ${i + 1}→${i + 2}: ${e.toFixed(2)}`}
                                  style={{
                                    flex: 1,
                                    minWidth: 4,
                                    height: `${Math.min(100, (e / (maxE || 1)) * 100)}%`,
                                    background: contentAnalysis.temporal.high_error_frame_indices.includes(i + 1) ? 'rgba(251, 146, 60, 0.9)' : 'rgba(59, 130, 246, 0.6)',
                                    borderRadius: 2,
                                  }}
                                />
                              )
                            })}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Orange = likely scene/cut</span>
                        </div>
                      )}
                      <p style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '0.85rem' }}><strong>Semantic:</strong> {contentAnalysis.semantic.summary}</p>
                      {contentAnalysis.semantic.keyframe_labels.length > 0 && (
                        <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          Keyframe labels:
                          {contentAnalysis.semantic.keyframe_labels.map((kf, i) => (
                            <div key={i} style={{ marginTop: 4 }}>
                              Frame {kf.frame_index}: {kf.top_classes.map((c) => `${c.label} (${(c.prob * 100).toFixed(0)}%)`).join(', ')}
                            </div>
                          ))}
                        </div>
                      )}
                      {contentAnalysis.semantic.aggregated_top.length > 0 && (
                        <p style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
                          Aggregated: {contentAnalysis.semantic.aggregated_top.slice(0, 8).map((a) => `${a.label} (${a.count})`).join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                  {(videoAnalysis || pixelInsights) && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Modification palette</strong>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                        Adjust pixels in the result video before the JEPA overlay. Use JEPA/pixel analysis to suggest corrections or apply presets.
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem 0.75rem', marginBottom: '0.5rem' }}>
                        {pixelInsights && (
                          <button type="button" style={{ fontSize: '0.75rem' }} onClick={() => {
                            const b = pixelInsights.brightness
                            const c = pixelInsights.contrast
                            setModBrightness(b < 0.4 ? 1.2 : b > 0.8 ? 0.9 : 1)
                            setModContrast(c < 0.12 ? 1.2 : c > 0.3 ? 0.95 : 1)
                            setModSaturation(1)
                          }}>Apply suggested (from analysis)</button>
                        )}
                        <span style={{ fontSize: '0.75rem', alignSelf: 'center' }}>Presets:</span>
                        <button type="button" style={{ fontSize: '0.75rem' }} onClick={() => { setModBrightness(1.2); setModContrast(1); setModSaturation(1); setModTintR(0); setModTintG(0); setModTintB(0); }}>Brighten</button>
                        <button type="button" style={{ fontSize: '0.75rem' }} onClick={() => { setModBrightness(1); setModContrast(1.25); setModSaturation(1); setModTintR(0); setModTintG(0); setModTintB(0); }}>Pop contrast</button>
                        <button type="button" style={{ fontSize: '0.75rem' }} onClick={() => { setModBrightness(1); setModContrast(0.85); setModSaturation(0.9); setModTintR(0); setModTintG(0); setModTintB(0); }}>Softer</button>
                        <button type="button" style={{ fontSize: '0.75rem' }} onClick={() => { setModBrightness(1); setModContrast(1); setModSaturation(1.35); setModTintR(0); setModTintG(0); setModTintB(0); }}>Vivid</button>
                        <button type="button" style={{ fontSize: '0.75rem' }} onClick={() => { setModBrightness(1); setModContrast(1); setModSaturation(1); setModTintR(0); setModTintG(0); setModTintB(0); }}>Reset</button>
                      </div>
                      {pixelInsights && pixelInsights.dominant_colors.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.8rem' }}>Tint from palette:</label>
                          <select
                            value={tintPaletteChoice}
                            onChange={(e) => {
                              const v = e.target.value
                              setTintPaletteChoice(v)
                              if (v === '') { setModTintR(0); setModTintG(0); setModTintB(0); return }
                              if (v === 'warm') { setModTintR(12); setModTintG(6); setModTintB(-8); return }
                              if (v === 'cool') { setModTintR(-8); setModTintG(4); setModTintB(14); return }
                              const i = parseInt(v, 10)
                              if (!isNaN(i) && pixelInsights.dominant_colors[i]) {
                                const [r, g, b] = pixelInsights.dominant_colors[i]
                                const scale = 0.2
                                setModTintR(Math.round(Math.max(-50, Math.min(50, (r - 128) * scale))))
                                setModTintG(Math.round(Math.max(-50, Math.min(50, (g - 128) * scale))))
                                setModTintB(Math.round(Math.max(-50, Math.min(50, (b - 128) * scale))))
                              }
                            }}
                            style={{ fontSize: '0.8rem', padding: '2px 6px' }}
                          >
                            <option value="">None</option>
                            <option value="warm">Warm</option>
                            <option value="cool">Cool</option>
                            {pixelInsights.dominant_colors.map((_, i) => (
                              <option key={i} value={i}>Dominant {i + 1}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem 1rem', marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem' }}>
                          Brightness {(modBrightness * 100).toFixed(0)}%
                          <input type="range" min={30} max={150} value={modBrightness * 100} onChange={(e) => setModBrightness(Number(e.target.value) / 100)} style={{ display: 'block', width: '100%' }} />
                        </label>
                        <label style={{ fontSize: '0.8rem' }}>
                          Contrast {(modContrast * 100).toFixed(0)}%
                          <input type="range" min={30} max={150} value={modContrast * 100} onChange={(e) => setModContrast(Number(e.target.value) / 100)} style={{ display: 'block', width: '100%' }} />
                        </label>
                        <label style={{ fontSize: '0.8rem' }}>
                          Saturation {(modSaturation * 100).toFixed(0)}%
                          <input type="range" min={0} max={250} value={modSaturation * 100} onChange={(e) => setModSaturation(Number(e.target.value) / 100)} style={{ display: 'block', width: '100%' }} />
                        </label>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem' }}>Tint (RGB):</span>
                        <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          R <input type="range" min={-50} max={50} value={modTintR} onChange={(e) => setModTintR(Number(e.target.value))} style={{ width: 60 }} />
                          <span style={{ minWidth: 28 }}>{modTintR}</span>
                        </label>
                        <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          G <input type="range" min={-50} max={50} value={modTintG} onChange={(e) => setModTintG(Number(e.target.value))} style={{ width: 60 }} />
                          <span style={{ minWidth: 28 }}>{modTintG}</span>
                        </label>
                        <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          B <input type="range" min={-50} max={50} value={modTintB} onChange={(e) => setModTintB(Number(e.target.value))} style={{ width: 60 }} />
                          <span style={{ minWidth: 28 }}>{modTintB}</span>
                        </label>
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>Save/Load:</span>
                        <button type="button" style={{ fontSize: '0.75rem' }} onClick={() => {
                          const name = prompt('Preset name')
                          if (!name?.trim()) return
                          const mod = { modBrightness, modContrast, modSaturation, modTintR, modTintG, modTintB }
                          const next = [...savedPresets.filter((p) => p.name !== name.trim()), { name: name.trim(), mod }]
                          setSavedPresets(next)
                          localStorage.setItem('jepa_palette_presets', JSON.stringify(next))
                        }}>Save current</button>
                        <select style={{ fontSize: '0.75rem', padding: '2px 4px' }} value="" onChange={(e) => {
                          const name = e.target.value
                          if (!name) return
                          const p = savedPresets.find((x) => x.name === name)
                          if (p) { setModBrightness(p.mod.modBrightness); setModContrast(p.mod.modContrast); setModSaturation(p.mod.modSaturation); setModTintR(p.mod.modTintR); setModTintG(p.mod.modTintG); setModTintB(p.mod.modTintB); }
                          e.target.value = ''
                        }}>
                          <option value="">Load preset…</option>
                          {savedPresets.map((p) => (
                            <option key={p.name} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', fontSize: '0.85rem' }}>
                        <input type="checkbox" checked={includeDescriptorCard} onChange={(e) => setIncludeDescriptorCard(e.target.checked)} />
                        Include descriptor card at start of video (4 s)
                      </label>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      style={{ fontSize: '0.8rem' }}
                      onClick={() => {
                        let text = ''
                        if (videoAnalysis) {
                          text += `JEPA analysis\n\nText: ${videoAnalysis.summary}\n\nNumerical: latent_norm=${videoAnalysis.latent_norm.toFixed(4)}${videoAnalysis.predicted_next_norm != null ? `, predicted_next_norm=${videoAnalysis.predicted_next_norm.toFixed(4)}` : ''}\nFirst 8 dims: [${videoAnalysis.latent_preview.map((x) => x.toFixed(3)).join(', ')}]`
                        }
                        if (pixelInsights) {
                          text += (text ? '\n\n' : '') + `Pixel analysis (frame)\n${pixelInsights.insight_summary}\nBrightness: ${pixelInsights.brightness.toFixed(3)}  Contrast: ${pixelInsights.contrast.toFixed(3)}  Edge density: ${pixelInsights.edge_density.toFixed(3)}\nDominant colors RGB: ${pixelInsights.dominant_colors.map((c) => `(${c[0]},${c[1]},${c[2]})`).join(', ')}`
                        }
                        if (text) navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard'))
                      }}
                    >
                      Copy results (JEPA + pixel)
                    </button>
                    <p style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: 4 }}>
                      Run &quot;Analyze content&quot; first to include temporal timeline and semantic labels in the video.
                    </p>
                    <button
                      type="button"
                      style={{ fontSize: '0.8rem' }}
                      disabled={overlayDownloadLoading || !previewVideoId}
                      onClick={async () => {
                        if (!previewVideoId) return
                        setOverlayDownloadLoading(true)
                        setOverlayDownloadError(null)
                        try {
                          const res = await fetch(`${API_BASE}/youtube/video_with_overlay`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              video_id: previewVideoId,
                              title: ytVideos.find((v) => v.id === previewVideoId)?.title ?? '',
                              channel: ytVideos.find((v) => v.id === previewVideoId)?.channelTitle ?? '',
                              summary: videoAnalysis?.summary ?? '',
                              latent_norm: videoAnalysis?.latent_norm ?? 0,
                              predicted_next_norm: videoAnalysis?.predicted_next_norm ?? null,
                              latent_preview: videoAnalysis?.latent_preview ?? [],
                              predicted_next_preview: videoAnalysis?.predicted_next_preview ?? null,
                              pixel_insight_summary: pixelInsights?.insight_summary ?? '',
                              brightness: pixelInsights?.brightness ?? 0.5,
                              contrast: pixelInsights?.contrast ?? 0.2,
                              edge_density: pixelInsights?.edge_density ?? 0.1,
                              dominant_colors: pixelInsights?.dominant_colors ?? [],
                              max_duration_sec: 30,
                              include_descriptor_card: includeDescriptorCard,
                              mod_brightness: modBrightness,
                              mod_contrast: modContrast,
                              mod_saturation: modSaturation,
                              mod_tint_r: modTintR,
                              mod_tint_g: modTintG,
                              mod_tint_b: modTintB,
                              temporal_frame_errors: contentAnalysis?.temporal?.frame_errors ?? [],
                              temporal_high_error_indices: contentAnalysis?.temporal?.high_error_frame_indices ?? [],
                              semantic_keyframe_labels: contentAnalysis?.semantic?.keyframe_labels ?? [],
                              semantic_aggregated_top: contentAnalysis?.semantic?.aggregated_top ?? [],
                              temporal_summary: contentAnalysis?.temporal?.summary ?? '',
                              semantic_summary: contentAnalysis?.semantic?.summary ?? '',
                            }),
                          })
                          if (!res.ok) {
                            const t = await res.json().catch(() => ({}))
                            const d = (t as { detail?: string }).detail
                            throw new Error(typeof d === 'string' ? d : res.statusText)
                          }
                          const blob = await res.blob()
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `jepa_overlay_${previewVideoId}.mp4`
                          a.click()
                          URL.revokeObjectURL(url)
                        } catch (e) {
                          setOverlayDownloadError(e instanceof Error ? e.message : String(e))
                        } finally {
                          setOverlayDownloadLoading(false)
                        }
                      }}
                    >
                      {overlayDownloadLoading ? 'Downloading…' : 'Download video with JEPA overlay'}
                    </button>
                  </div>
                  {overlayDownloadError && <p className="error" style={{ marginTop: 4 }}>{overlayDownloadError}</p>}
                  {(videoAnalysis || pixelInsights) && (
                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                      <strong>Video descriptor (for recreation)</strong>
                      <p style={{ margin: '0.35rem 0', fontSize: '0.85rem', color: '#9ca3af' }}>
                        Text and structured data that describe the video from JEPA + pixel analysis; use as a prompt or seed to recreate or search.
                      </p>
                      <button
                        type="button"
                        style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}
                        disabled={descriptorLoading || !previewVideoId || !videoAnalysis}
                        onClick={async () => {
                          const video = ytVideos.find((v) => v.id === previewVideoId)
                          if (!previewVideoId || !videoAnalysis || !video) return
                          setDescriptorLoading(true)
                          setDescriptorError(null)
                          try {
                            const res = await fetch(`${API_BASE}/youtube/descriptor`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                video_id: previewVideoId,
                                title: video.title,
                                channel: video.channelTitle ?? '',
                                summary: videoAnalysis.summary,
                                latent_norm: videoAnalysis.latent_norm,
                                latent_dim: config?.latent_dim ?? 512,
                                predicted_next_norm: videoAnalysis.predicted_next_norm ?? null,
                                latent_preview: videoAnalysis.latent_preview,
                                predicted_next_preview: videoAnalysis.predicted_next_preview ?? null,
                                pixel_insight_summary: pixelInsights?.insight_summary ?? '',
                                brightness: pixelInsights?.brightness ?? 0.5,
                                contrast: pixelInsights?.contrast ?? 0.2,
                                edge_density: pixelInsights?.edge_density ?? 0.1,
                                dominant_colors: pixelInsights?.dominant_colors ?? [],
                                frame_size: pixelInsights?.frame_size ?? null,
                              }),
                            })
                            if (!res.ok) {
                              const t = await res.json().catch(() => ({}))
                              throw new Error((t as { detail?: string }).detail ?? res.statusText)
                            }
                            const data = await res.json()
                            setVideoDescriptor({ descriptor_text: data.descriptor_text, descriptor_json: data.descriptor_json })
                          } catch (e) {
                            setDescriptorError(e instanceof Error ? e.message : String(e))
                          } finally {
                            setDescriptorLoading(false)
                          }
                        }}
                      >
                        {descriptorLoading ? 'Generating…' : 'Get video descriptor'}
                      </button>
                      {descriptorError && <p className="error" style={{ marginTop: 4 }}>{descriptorError}</p>}
                      {videoDescriptor && (
                        <>
                          <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 4, fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 120, overflow: 'auto', marginTop: '0.5rem' }}>{videoDescriptor.descriptor_text}</pre>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              style={{ fontSize: '0.8rem' }}
                              onClick={() => { navigator.clipboard.writeText(videoDescriptor.descriptor_text).then(() => alert('Descriptor text copied')) }}
                            >
                              Copy descriptor text
                            </button>
                            <button
                              type="button"
                              style={{ fontSize: '0.8rem' }}
                              onClick={() => {
                                const blob = new Blob([JSON.stringify(videoDescriptor.descriptor_json, null, 2)], { type: 'application/json' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `jepa_descriptor_${previewVideoId}.json`
                                a.click()
                                URL.revokeObjectURL(url)
                              }}
                            >
                              Download descriptor (JSON)
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {outputLines.length === 0 && !previewVideoId && (
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>Run training, plan, or encode YouTube videos to see output here. Click a video and use &quot;Play&quot; for the original YouTube video, then &quot;Analyze with JEPA&quot; to see the model&apos;s analysis (latent + predictor) displayed below.</p>
        )}
      </section>

      </div>
    </>
  )
}
