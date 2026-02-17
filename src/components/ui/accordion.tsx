import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionContextValue {
  openItems: Set<string>
  toggle: (value: string) => void
  type: "single" | "multiple"
}

const AccordionContext = React.createContext<AccordionContextValue>({
  openItems: new Set(),
  toggle: () => {},
  type: "single",
})

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple"
  defaultValue?: string | string[]
}

function Accordion({ type = "single", defaultValue, className, children, ...props }: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(() => {
    if (!defaultValue) return new Set()
    return new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue])
  })

  const toggle = React.useCallback((value: string) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        if (type === "single") next.clear()
        next.add(value)
      }
      return next
    })
  }, [type])

  return (
    <AccordionContext.Provider value={{ openItems, toggle, type }}>
      <div className={cn("", className)} {...props}>{children}</div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const AccordionItemContext = React.createContext("")

function AccordionItem({ value, className, ...props }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={value}>
      <div className={cn("border-b border-border/30", className)} {...props} />
    </AccordionItemContext.Provider>
  )
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const { openItems, toggle } = React.useContext(AccordionContext)
    const value = React.useContext(AccordionItemContext)
    const isOpen = openItems.has(value)

    return (
      <h3 className="flex">
        <button
          ref={ref}
          className={cn(
            "flex flex-1 items-center justify-between py-4 text-sm font-semibold transition-all hover:text-primary cursor-pointer [&[data-state=open]>svg]:rotate-180",
            className
          )}
          data-state={isOpen ? "open" : "closed"}
          onClick={() => toggle(value)}
          {...props}
        >
          {children}
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </button>
      </h3>
    )
  }
)
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { openItems } = React.useContext(AccordionContext)
    const value = React.useContext(AccordionItemContext)
    const isOpen = openItems.has(value)

    if (!isOpen) return null

    return (
      <div ref={ref} className={cn("overflow-hidden text-sm", className)} {...props}>
        <div className="pb-4 pt-0">{children}</div>
      </div>
    )
  }
)
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
