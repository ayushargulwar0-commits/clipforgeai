import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'
import {
  FolderOpen,
  Plus,
  Search,
  MoreVertical,
  Film,
  Scissors,
  Trash2,
  Calendar,
  FolderPlus,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Project {
  id: string
  name: string
  description?: string
  video_count: number
  clip_count: number
  status: 'active' | 'archived'
  created_at: string
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Tech Founders Podcast S2',
    description: 'Weekly video interview series with tech builders',
    video_count: 4,
    clip_count: 28,
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'proj-2',
    name: 'React 19 Full Masterclass',
    description: 'Course recording and educational walkthroughs',
    video_count: 2,
    clip_count: 14,
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'proj-3',
    name: 'SaaS Product Keynote 2026',
    description: 'Quarterly company release announcement',
    video_count: 1,
    clip_count: 6,
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
]

export default function Projects() {
  const { success, error } = useToast()
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    const matchesFilter = filter === 'all' || p.status === filter
    return matchesSearch && matchesFilter
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) {
      error('Error', 'Project name is required')
      return
    }

    const newProj: Project = {
      id: 'proj-' + Date.now(),
      name: newProjectName.trim(),
      description: newProjectDesc.trim(),
      video_count: 0,
      clip_count: 0,
      status: 'active',
      created_at: new Date().toISOString(),
    }

    setProjects([newProj, ...projects])
    success('Project Created', `Project "${newProjectName}" has been created.`)
    setNewProjectName('')
    setNewProjectDesc('')
    setModalOpen(false)
  }

  const handleDelete = (id: string, name: string) => {
    setProjects(projects.filter((p) => p.id !== id))
    success('Project Deleted', `"${name}" removed.`)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Projects</h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize long recordings, transcripts, and social clips by show or topic.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 text-xs font-semibold">
          <Plus size={16} /> New Project
        </Button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-surface-card p-1 rounded-lg border border-surface-border">
          {(['all', 'active', 'archived'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={32} />}
          title="No projects found"
          description="Create your first video project to organize footage and clips."
          action={
            <Button onClick={() => setModalOpen(true)} size="sm">
              <Plus size={14} className="mr-1" /> Create Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((proj) => (
            <Card key={proj.id} hover className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center">
                    <FolderOpen size={20} />
                  </div>
                  <Badge variant={proj.status === 'active' ? 'success' : 'muted'}>
                    {proj.status}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-white mb-1.5 line-clamp-1">{proj.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] mb-4">
                  {proj.description || 'No description provided.'}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-300 pt-3 border-t border-surface-border">
                  <span className="flex items-center gap-1.5">
                    <Film size={14} className="text-brand-400" /> {proj.video_count} videos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Scissors size={14} className="text-accent-400" /> {proj.clip_count} clips
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs text-slate-500">
                <span>{formatRelativeTime(proj.created_at)}</span>
                <button
                  onClick={() => handleDelete(proj.id, proj.name)}
                  className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                  title="Delete Project"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Project"
        description="Projects group your source videos, transcripts, and generated short clips."
      >
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <Input
            label="Project Name"
            placeholder="e.g. Marketing Keynotes 2026"
            required
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
          <Input
            label="Description (Optional)"
            placeholder="Brief notes about this series or show"
            value={newProjectDesc}
            onChange={(e) => setNewProjectDesc(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
