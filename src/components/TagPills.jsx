import React from 'react'

export function TagPills({ tags, selectedTags, onToggle }) {
  if (!tags || tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
      {tags.map((tag) => {
        const isActive = selectedTags.includes(tag)
        return (
          <button
            key={tag}
            onClick={() => onToggle(tag)}
            aria-pressed={isActive}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff90e8]/60 ${
              isActive
                ? 'bg-[#1a1a1a] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tag}
          </button>
        )
      })}
      {selectedTags.length > 0 && (
        <button
          onClick={() => selectedTags.forEach((t) => onToggle(t))}
          className="rounded-full px-3 py-1 text-sm font-medium text-gray-400 hover:text-[#1a1a1a] underline"
          aria-label="Clear all tag filters"
        >
          Clear
        </button>
      )}
    </div>
  )
}
