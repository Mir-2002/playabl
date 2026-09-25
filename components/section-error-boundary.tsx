"use client"

import { Component, type ReactNode } from "react"

interface Props {
  /** Short label for what failed, e.g. "activity" or "leaderboard". */
  label: string
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Isolates one page section so a failed server read (thrown by the section's
 * RSC) degrades to an inline card instead of taking down the whole page via
 * the root error boundary. Suspense catches *pending*, not *errors* — this
 * fills that gap for the home page's heatmap / leaderboard sections.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error("[section]", this.props.label, error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white border-2 border-foreground/10 rounded-2xl p-6 text-center">
          <p className="text-sm font-medium text-foreground">
            Couldn&apos;t load the {this.props.label}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Something went wrong here. The rest of the page is fine — try refreshing.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
