import * as React from "react"
import { cn } from "../../lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ value, onValueChange, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    
    const handleTriggerClick = () => {
      setIsOpen(!isOpen)
    }
    
    const handleItemClick = (itemValue: string) => {
      onValueChange?.(itemValue)
      setIsOpen(false)
    }
    
    return (
      <div
        ref={ref}
        className="relative"
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            if (child.type === SelectTrigger) {
              return React.cloneElement(child, {
                onClick: handleTriggerClick,
                isOpen,
                value
              } as any)
            }
            if (child.type === SelectContent && isOpen) {
              return React.cloneElement(child, {
                onItemClick: handleItemClick
              } as any)
            }
          }
          return child
        })}
      </div>
    )
  }
)
Select.displayName = "Select"

const SelectTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { isOpen?: boolean; onClick?: () => void; value?: string }>(
  ({ className, children, isOpen, onClick, value, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm cursor-pointer hover:bg-gray-50",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === SelectValue) {
            return React.cloneElement(child, {
              value
            } as any)
          }
        }
        return child
      })}
      <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform", isOpen && "rotate-180")} />
    </div>
  )
)
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string; value?: string }>(
  ({ className, placeholder, value, children, ...props }, ref) => {
    // Find the display text based on the value
    const displayText = children || placeholder
    
    return (
      <span
        ref={ref}
        className={cn("text-sm text-gray-900", className)}
        {...props}
      >
        {displayText}
      </span>
    )
  }
)
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { onItemClick?: (value: string) => void }>(
  ({ className, children, onItemClick, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "absolute top-full z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto",
        className
      )}
      style={{ 
        zIndex: 9999,
        backgroundColor: 'white',
        border: '1px solid #d1d5db',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onItemClick
          } as any)
        }
        return child
      })}
    </div>
  )
)
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string; onItemClick?: (value: string) => void }>(
  ({ className, value, children, onItemClick, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer",
        className
      )}
      onClick={() => onItemClick?.(value)}
      {...props}
    >
      {children}
    </div>
  )
)
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } 