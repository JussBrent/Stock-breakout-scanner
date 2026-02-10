import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Save, Loader2, Trash2, Upload, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { FilterOptions } from './FilterControls'

interface FilterPreset {
  id: string
  name: string
  description: string | null
  filters: FilterOptions
  created_at: string
  updated_at: string
}

interface PresetManagerProps {
  currentFilters: FilterOptions
  onLoadPreset: (filters: FilterOptions) => void
  onClose?: () => void
}

export function PresetManager({ currentFilters, onLoadPreset, onClose }: PresetManagerProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presetDescription, setPresetDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadPresets()
  }, [])

  const loadPresets = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        return
      }

      const response = await fetch('http://localhost:8000/api/presets', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to load presets')
      }

      const data = await response.json()
      setPresets(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load presets')
      console.error('Error loading presets:', err)
    } finally {
      setLoading(false)
    }
  }

  const savePreset = async () => {
    if (!presetName.trim()) {
      setError('Please enter a preset name')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        return
      }

      // Serialize filters (convert Sets to arrays)
      const serializedFilters = serializeFilters(currentFilters)

      const response = await fetch('http://localhost:8000/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: presetName.trim(),
          description: presetDescription.trim() || null,
          filters: serializedFilters
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to save preset')
      }

      setSuccess('Preset saved successfully!')
      setPresetName('')
      setPresetDescription('')
      await loadPresets()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preset')
      console.error('Error saving preset:', err)
    } finally {
      setSaving(false)
    }
  }

  const deletePreset = async (presetId: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) {
      return
    }

    try {
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        return
      }

      const response = await fetch(`http://localhost:8000/api/presets/${presetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete preset')
      }

      setSuccess('Preset deleted successfully!')
      await loadPresets()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete preset')
      console.error('Error deleting preset:', err)
    }
  }

  const loadPreset = (preset: FilterPreset) => {
    // Deserialize filters (convert arrays back to Sets)
    const deserializedFilters = deserializeFilters(preset.filters)
    onLoadPreset(deserializedFilters)
    setSuccess(`Loaded preset: ${preset.name}`)
    setTimeout(() => setSuccess(null), 3000)
  }

  const serializeFilters = (filters: FilterOptions): any => {
    return {
      ...filters,
      setupTypes: Array.from(filters.setupTypes),
      markets: Array.from(filters.markets),
      watchlists: Array.from(filters.watchlists),
      indices: Array.from(filters.indices),
      sectors: Array.from(filters.sectors),
      analystRating: Array.from(filters.analystRating)
    }
  }

  const deserializeFilters = (filters: any): FilterOptions => {
    return {
      ...filters,
      setupTypes: new Set(filters.setupTypes || []),
      markets: new Set(filters.markets || []),
      watchlists: new Set(filters.watchlists || []),
      indices: new Set(filters.indices || []),
      sectors: new Set(filters.sectors || []),
      analystRating: new Set(filters.analystRating || [])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Filter Presets</h3>
          <p className="text-sm text-gray-400">Save and load your custom filter configurations</p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Save Current Filters */}
      <div className="p-4 bg-white/[0.02] border border-white/10 rounded-lg space-y-3">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Current Configuration
        </h4>
        <div className="space-y-2">
          <Input
            placeholder="Preset name (e.g., 'Tight Consolidation')"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="bg-black/20 border-white/10"
          />
          <Input
            placeholder="Description (optional)"
            value={presetDescription}
            onChange={(e) => setPresetDescription(e.target.value)}
            className="bg-black/20 border-white/10"
          />
          <Button
            onClick={savePreset}
            disabled={saving || !presetName.trim()}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preset
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Saved Presets */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Saved Presets
        </h4>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          </div>
        ) : presets.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No saved presets yet. Save your first configuration above.
          </div>
        ) : (
          <div className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="p-3 bg-white/[0.02] border border-white/10 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-white truncate">{preset.name}</h5>
                      <Badge variant="secondary" className="text-xs">
                        {new Date(preset.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                    {preset.description && (
                      <p className="text-sm text-gray-400 line-clamp-2">{preset.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => loadPreset(preset)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePreset(preset.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
