import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
)

const STORAGE_KEY = 'api_key'

interface ScoreBucket {
  bucket: string
  count: number
}

interface ScoresResponse {
  lab: string
  buckets: ScoreBucket[]
}

interface TimelineEntry {
  date: string
  submissions: number
}

interface TimelineResponse {
  lab: string
  timeline: TimelineEntry[]
}

interface PassRateEntry {
  task: string
  pass_rate: number
  total_submissions: number
  passed_submissions: number
}

interface PassRatesResponse {
  lab: string
  pass_rates: PassRateEntry[]
}

interface LabOption {
  value: string
  label: string
}

const LAB_OPTIONS: LabOption[] = [
  { value: 'lab-01', label: 'Lab 01' },
  { value: 'lab-02', label: 'Lab 02' },
  { value: 'lab-03', label: 'Lab 03' },
  { value: 'lab-04', label: 'Lab 04' },
  { value: 'lab-05', label: 'Lab 05' },
  { value: 'lab-06', label: 'Lab 06' },
  { value: 'lab-07', label: 'Lab 07' },
  { value: 'lab-08', label: 'Lab 08' },
]

type FetchStatus =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; message: string }

function Dashboard() {
  const [selectedLab, setSelectedLab] = useState<string>('lab-05')
  const [scoresState, setScoresState] = useState<FetchStatus & { data?: ScoresResponse }>({ status: 'idle' })
  const [timelineState, setTimelineState] = useState<FetchStatus & { data?: TimelineResponse }>({ status: 'idle' })
  const [passRatesState, setPassRatesState] = useState<FetchStatus & { data?: PassRatesResponse }>({ status: 'idle' })

  const token = localStorage.getItem(STORAGE_KEY) ?? ''

  useEffect(() => {
    if (!token) return

    const fetchScores = fetch(`/analytics/scores?lab=${selectedLab}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: ScoresResponse) => setScoresState({ status: 'success', data }))
      .catch((err: Error) => setScoresState({ status: 'error', message: err.message }))

    const fetchTimeline = fetch(`/analytics/timeline?lab=${selectedLab}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: TimelineResponse) => setTimelineState({ status: 'success', data }))
      .catch((err: Error) => setTimelineState({ status: 'error', message: err.message }))

    const fetchPassRates = fetch(`/analytics/pass-rates?lab=${selectedLab}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: PassRatesResponse) => setPassRatesState({ status: 'success', data }))
      .catch((err: Error) => setPassRatesState({ status: 'error', message: err.message }))

    setScoresState({ status: 'loading' })
    setTimelineState({ status: 'loading' })
    setPassRatesState({ status: 'loading' })

    Promise.all([fetchScores, fetchTimeline, fetchPassRates])
  }, [token, selectedLab])

  const scoresChartData = scoresState.status === 'success' && scoresState.data
    ? {
        labels: scoresState.data.buckets.map((b) => b.bucket),
        datasets: [
          {
            label: 'Submissions per Score Bucket',
            data: scoresState.data.buckets.map((b) => b.count),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      }
    : { labels: [], datasets: [] }

  const timelineChartData = timelineState.status === 'success' && timelineState.data
    ? {
        labels: timelineState.data.timeline.map((t) => t.date),
        datasets: [
          {
            label: 'Submissions per Day',
            data: timelineState.data.timeline.map((t) => t.submissions),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
          },
        ],
      }
    : { labels: [], datasets: [] }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <div className="lab-selector">
          <label htmlFor="lab-select">Select Lab: </label>
          <select
            id="lab-select"
            value={selectedLab}
            onChange={(e) => setSelectedLab(e.target.value)}
          >
            {LAB_OPTIONS.map((lab) => (
              <option key={lab.value} value={lab.value}>
                {lab.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="charts-container">
        <section className="chart-section">
          <h2>Score Buckets</h2>
          {scoresState.status === 'loading' && <p>Loading...</p>}
          {scoresState.status === 'error' && <p>Error: {scoresState.message}</p>}
          {scoresState.status === 'success' && (
            <div className="chart-wrapper">
              <Bar data={scoresChartData} options={chartOptions} />
            </div>
          )}
        </section>

        <section className="chart-section">
          <h2>Submissions Timeline</h2>
          {timelineState.status === 'loading' && <p>Loading...</p>}
          {timelineState.status === 'error' && <p>Error: {timelineState.message}</p>}
          {timelineState.status === 'success' && (
            <div className="chart-wrapper">
              <Line data={timelineChartData} options={chartOptions} />
            </div>
          )}
        </section>
      </div>

      <section className="pass-rates-section">
        <h2>Pass Rates per Task</h2>
        {passRatesState.status === 'loading' && <p>Loading...</p>}
        {passRatesState.status === 'error' && <p>Error: {passRatesState.message}</p>}
        {passRatesState.status === 'success' && passRatesState.data && (
          <table className="pass-rates-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Pass Rate</th>
                <th>Total Submissions</th>
                <th>Passed Submissions</th>
              </tr>
            </thead>
            <tbody>
              {passRatesState.data.pass_rates.map((entry) => (
                <tr key={entry.task}>
                  <td>{entry.task}</td>
                  <td>{(entry.pass_rate * 100).toFixed(1)}%</td>
                  <td>{entry.total_submissions}</td>
                  <td>{entry.passed_submissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default Dashboard
