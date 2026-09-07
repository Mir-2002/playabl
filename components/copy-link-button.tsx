"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  url: string
  label?: string
}

export function CopyLinkButton({ url, label = "Copy invite link" }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {copied ? "Copied!" : label}
    </Button>
  )
}
