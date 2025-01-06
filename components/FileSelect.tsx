"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { File } from "@/lib/db"

interface FileSelectProps {
  files: File[]
  value?: string
  onSelect: (fileId: string) => void
  disabled?: boolean
}

export function FileSelect({ files, value, onSelect, disabled }: FileSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selectedFile = files.find((file) => file.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedFile
            ? `${selectedFile.name} (${selectedFile.rowCount} rows)`
            : "Select a file..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search files..." />
          <CommandList>
            <CommandEmpty>No files found.</CommandEmpty>
            <CommandGroup>
              {files.map((file) => (
                <CommandItem
                  key={file.id}
                  value={file.id}
                  onSelect={(currentValue) => {
                    onSelect(currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === file.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {file.name} ({file.rowCount} rows)
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 