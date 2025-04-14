import Image from "next/image"

interface ScoutLogoImageProps {
  width?: number
  height?: number
  className?: string
}

export function ScoutLogoImage({ width = 50, height = 50, className = "mr-2" }: ScoutLogoImageProps) {
  return <Image src="/scout-logo.png" alt="Scout Logo" width={width} height={height} className={className} priority />
}
