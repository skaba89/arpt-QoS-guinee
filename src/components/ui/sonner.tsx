"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "#1E293B",
          "--normal-text": "#F1F5F9",
          "--normal-border": "rgba(255,255,255,0.1)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
