import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Category } from '../lib/types'

interface Props {
  selected: string
  onSelect: (id: string) => void
}

export function CategoryPicker({ selected, onSelect }: Props) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    api.getCategories().then(setCategories)
  }, [])

  return (
    <div className="grid grid-cols-4 gap-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
            selected === cat.id
              ? 'border-[var(--primary)] bg-indigo-50'
              : 'border-transparent bg-[var(--muted)]'
          }`}
        >
          <span className="text-xl">{cat.icon}</span>
          <span className="text-[10px] font-medium text-center leading-tight truncate w-full">
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  )
}
