"use client"

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface StaffSelectProps {
  options: string[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function StaffSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select staff member...",
  className,
}: StaffSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [popoverWidth, setPopoverWidth] = React.useState<number | undefined>(undefined)

  React.useEffect(() => {
    if (triggerRef.current && open) {
      setPopoverWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options
    const searchLower = search.toLowerCase()
    return options.filter((option) =>
      option.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  const selectedOption = value ? options.find((opt) => opt === value) : null

  const handleSelect = (option: string) => {
    onValueChange(option)
    setSearch("")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        setSearch("")
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal border-gray-300 hover:bg-gray-50 focus:border-blue-500 focus:ring-blue-500",
            className
          )}
          onClick={() => setOpen(!open)}
        >
          <span className="truncate">
            {selectedOption || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 z-50"
        align="start"
        style={{ width: popoverWidth ? `${popoverWidth}px` : undefined }}
      >
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search staff members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="max-h-[300px] overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                No staff member found.
              </div>
            ) : (
              <div className="p-1">
                {filteredOptions.map((option) => {
                  const isSelected = value === option
                  return (
                    <div
                      key={option}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-gray-100 transition-colors",
                        isSelected && "bg-blue-50 hover:bg-blue-100"
                      )}
                      onClick={() => handleSelect(option)}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelect(option)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          isSelected ? "opacity-100 text-blue-600" : "opacity-0"
                        )}
                      />
                      <span className={cn(isSelected && "font-medium")}>
                        {option}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

