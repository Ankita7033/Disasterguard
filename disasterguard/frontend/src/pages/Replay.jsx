import ReplayTimeline from '../components/ReplayTimeline'

export default function Replay() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Historical Replay</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Scrub through past disaster events — play, pause, step forward and back
          </p>
        </div>
        <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-1 rounded-lg font-medium">
          WOW FACTOR
        </span>
      </div>
      <ReplayTimeline />
    </div>
  )
}