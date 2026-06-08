type Size = 'sm' | 'md' | 'lg' | 'xl'

const cfg: Record<Size, { main: string; sub: string; mt: string }> = {
  sm: { main: 'text-xl',  sub: 'text-[8px]  tracking-[2.5px]', mt: 'mt-0.5' },
  md: { main: 'text-2xl', sub: 'text-[10px] tracking-[3px]',   mt: 'mt-0.5' },
  lg: { main: 'text-3xl', sub: 'text-[11px] tracking-[3.5px]', mt: 'mt-1'   },
  xl: { main: 'text-4xl', sub: 'text-xs     tracking-[4px]',   mt: 'mt-1'   },
}

export function NexflowLogo({ size = 'md' }: { size?: Size }) {
  const { main, sub, mt } = cfg[size]
  return (
    <div className="flex flex-col leading-none select-none">
      <span className={`${main} font-bold tracking-tight leading-none`}>
        <span className="text-white">Nex</span>
        <span className="text-[#22c55e]">flow</span>
      </span>
      <span className={`text-[#9CA3AF] ${sub} uppercase font-medium ${mt}`}>
        DIGITAL SOLUTIONS
      </span>
    </div>
  )
}
