import React from 'react'

// Renders a pill for each available tag; active pills are visually distinct
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
            className={
              `rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`
            }
          >
            {tag}
          </button>
        )
      })}
      {selectedTags.length > 0 && (
        <button
          onClick={() => selectedTags.forEach((t) => onToggle(t))}
          className="rounded-full px-3 py-1 text-sm font-medium text-red-500 hover:text-red-700 underline"
          aria-label="Clear all tag filters"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
