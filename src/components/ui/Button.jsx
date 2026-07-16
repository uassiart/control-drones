import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-[#003087] text-white hover:bg-[#002a75] focus:ring-[#003087]',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        success: 'bg-[#00a650] text-white hover:bg-[#009447] focus:ring-[#00a650]',
        danger: 'bg-[#e3000f] text-white hover:bg-[#cc000e] focus:ring-[#e3000f]',
        warning: 'bg-[#f9b81b] text-white hover:bg-[#e5a70f] focus:ring-[#f9b81b]',
        outline: 'border-2 border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white',
        ghost: 'hover:bg-gray-100 text-gray-700',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export default function Button({ variant, size, className, children, ...props }) {
  return (
    <button className={buttonVariants({ variant, size, className })} {...props}>
      {children}
    </button>
  )
}