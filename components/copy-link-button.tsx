"use client"

import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface Props {
  url: string
  label?: string
}

export function CopyLinkButton({ url, label = "Copy invite link" }: Props) {
  const toast = useToast()

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied!")
    })
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleCopy}>
      <Copy aria-hidden />
      {label}
    </Button>
  )
}
