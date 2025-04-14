export function BinocularsIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 10c0 3.87 1 7 1 7H6s1-3.13 1-7V6c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v4z" />
      <path d="M6 10a3 3 0 0 1-3 3v1a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-1a3 3 0 0 1-3-3" />
      <path d="M10 15a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
      <path d="M18 15a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
    </svg>
  )
}
