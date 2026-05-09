import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

const BAR_COUNT = 48

export default function VoiceSearch({ onResults, onClose }) {
  const [phase, setPhase] = useState('listening') // 'listening' | 'processing' | 'error'
  const [transcript, setTranscript] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const canvasRef = useRef(null)
  const recognitionRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const transcriptRef = useRef('')  // avoid stale closure in onend
  const phaseRef = useRef('listening')

  function setPhaseSync(p) {
    phaseRef.current = p
    setPhase(p)
  }

  // ── Audio visualisation ──────────────────────────────────────────────────

  function drawLoop() {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')
    const data = new Uint8Array(analyser.frequencyBinCount)

    function draw() {
      if (phaseRef.current !== 'listening') return
      rafRef.current = requestAnimationFrame(draw)

      analyser.getByteFrequencyData(data)
      canvas.width = canvas.offsetWidth
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const step = Math.floor(data.length / BAR_COUNT)
      const barW = Math.max(2, Math.floor(W / BAR_COUNT) - 2)
      const spacing = (W - BAR_COUNT * barW) / (BAR_COUNT - 1)

      for (let i = 0; i < BAR_COUNT; i++) {
        const v = data[i * step] / 255
        const h = Math.max(4, v * H * 0.9)
        const x = i * (barW + spacing)
        const y = H - h

        ctx.fillStyle = `rgba(255,255,255,${0.35 + v * 0.65})`
        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barW, h, 2)
        } else {
          ctx.rect(x, y, barW, h)
        }
        ctx.fill()
      }
    }

    draw()
  }

  async function startAudio() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 128
      analyserRef.current = analyser
      audioCtx.createMediaStreamSource(stream).connect(analyser)
      drawLoop()
    } catch {
      // Visualization fails silently — recognition still works
    }
  }

  function stopAudio() {
    cancelAnimationFrame(rafRef.current)
    audioCtxRef.current?.close()
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }

  // ── AI search ────────────────────────────────────────────────────────────

  const search = useCallback(async (query) => {
    setPhaseSync('processing')
    stopAudio()

    try {
      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: { query },
      })
      if (error || !data?.results) throw error ?? new Error('No results')
      onResults(data.results, query)
      onClose()
    } catch (err) {
      console.error('AI search error:', err)
      setErrorMsg('La recherche a échoué. Veuillez réessayer.')
      setPhaseSync('error')
    }
  }, [onResults, onClose])

  // ── Speech recognition ───────────────────────────────────────────────────

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      setPhaseSync('error')
      setErrorMsg('La reconnaissance vocale n\'est pas disponible dans ce navigateur (essayez Chrome ou Safari).')
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'fr-FR'
    recognition.continuous = false
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onresult = (e) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join('')
      setTranscript(t)
      transcriptRef.current = t

      // Trigger search as soon as speech recognition marks the result as final
      if (e.results[e.results.length - 1].isFinal && phaseRef.current === 'listening') {
        setPhaseSync('processing')
        stopAudio()
        search(t.trim())
      }
    }

    recognition.onend = () => {
      // Fallback : if isFinal never fired but we have something
      if (phaseRef.current !== 'listening') return
      if (transcriptRef.current.trim()) {
        search(transcriptRef.current.trim())
      } else {
        setErrorMsg('Aucune parole détectée. Fermez et réessayez.')
        setPhaseSync('error')
      }
    }

    recognition.onerror = (e) => {
      if (phaseRef.current !== 'listening') return
      const messages = {
        'not-allowed': 'Accès au microphone refusé. Vérifiez les permissions du navigateur.',
        'no-speech': 'Aucune parole détectée. Fermez et réessayez.',
      }
      setErrorMsg(messages[e.error] ?? 'Erreur de reconnaissance vocale.')
      setPhaseSync('error')
    }

    recognition.start()
    startAudio()

    return () => {
      recognition.abort()
      stopAudio()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    recognitionRef.current?.abort()
    stopAudio()
    onClose()
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Recherche vocale intelligente sur le catalogue disponible"
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
    >
      {/* Close */}
      <button
        onClick={handleClose}
        aria-label="Fermer la recherche vocale"
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 min-h-touch border border-white/40 rounded-full text-white text-sm hover:bg-white/10 focus-visible:outline-none focus-visible:ring focus-visible:ring-white"
      >
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Fermer
      </button>

      {/* Mic + sparkles icon */}
      <div
        className={[
          'mb-8 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300',
          phase === 'listening' ? 'bg-white/10 ring-4 ring-white/20 animate-pulse' : '',
          phase === 'processing' ? 'bg-white/10' : '',
          phase === 'error' ? 'bg-red-900/40' : '',
        ].join(' ')}
      >
        <svg
          aria-hidden="true"
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
        >
          {/* Microphone body */}
          <rect x="17" y="6" width="14" height="22" rx="7" fill="white"/>
          {/* Microphone stand */}
          <path d="M10 24c0 7.732 6.268 14 14 14s14-6.268 14-14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="24" y1="38" x2="24" y2="44" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="16" y1="44" x2="32" y2="44" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Sparkles */}
          <path d="M40 8l1.2 3.6L44.8 13l-3.6 1.2L40 17.8l-1.2-3.6L35.2 13l3.6-1.2Z" fill="white" opacity="0.9"/>
          <path d="M7 10l.8 2.4L10.2 14l-2.4.8L7 17.2l-.8-2.4L3.8 14l2.4-.8Z" fill="white" opacity="0.7"/>
          <circle cx="42" cy="28" r="1.5" fill="white" opacity="0.6"/>
          <circle cx="5" cy="26" r="1" fill="white" opacity="0.5"/>
        </svg>
      </div>

      {/* Status text */}
      <p
        aria-live="polite"
        aria-atomic="true"
        className="text-white text-xl font-medium mb-4 text-center px-6"
      >
        {phase === 'listening' && 'Parlez maintenant…'}
        {phase === 'processing' && 'Analyse en cours…'}
        {phase === 'error' && errorMsg}
      </p>

      {/* Live transcript */}
      {transcript && (
        <p
          aria-live="polite"
          className="text-gray-300 text-lg text-center max-w-lg px-6 italic"
        >
          « {transcript} »
        </p>
      )}

      {/* Processing spinner */}
      {phase === 'processing' && (
        <div aria-hidden="true" className="mt-6 flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}

      {/* Waveform */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 h-20 px-4"
      >
        {phase === 'listening' ? (
          <canvas ref={canvasRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-end justify-center gap-px opacity-20">
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-sm flex-1"
                style={{ height: `${8 + Math.sin(i * 0.4) * 6}px` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
