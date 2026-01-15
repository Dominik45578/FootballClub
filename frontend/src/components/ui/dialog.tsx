import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = React.forwardRef<any, React.ComponentProps<typeof DialogPrimitive.Root>>(function Dialog(props, ref) {
  const RootComp: any = DialogPrimitive.Root
  return <RootComp {...props} ref={ref as any} data-slot="dialog" />
})

const DialogTrigger = React.forwardRef<any, React.ComponentProps<typeof DialogPrimitive.Trigger>>(function DialogTrigger(props, ref) {
  return <DialogPrimitive.Trigger {...props} ref={ref as any} data-slot="dialog-trigger" />
})

const DialogPortal = React.forwardRef<any, React.ComponentProps<typeof DialogPrimitive.Portal>>(function DialogPortal(props, ref) {
  const PortalComp: any = DialogPrimitive.Portal
  return <PortalComp {...props} ref={ref as any} data-slot="dialog-portal" />
})

const DialogClose = React.forwardRef<any, React.ComponentProps<typeof DialogPrimitive.Close>>(function DialogClose(props, ref) {
  return <DialogPrimitive.Close {...props} ref={ref as any} data-slot="dialog-close" />
})

const DialogOverlay = React.forwardRef<any, React.ComponentProps<typeof DialogPrimitive.Overlay>>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref as any}
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black",
        className
      )}
      {...props}
    />
  )
})

const DialogContent = React.forwardRef<any, React.ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }>(
  function DialogContent({ className, children, showCloseButton = true, ...props }, ref) {
    return (
      <DialogPortal data-slot="dialog-portal">
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref as any}
          data-slot="dialog-content"
          className={cn(
            "bg-white dark:bg-slate-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-lg",
            className
          )}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    )
  }
)

const DialogHeader = React.forwardRef<any, React.ComponentProps<'div'>>(function DialogHeader({ className, ...props }, ref) {
  return (
    <div
      ref={ref as any}
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
})

const DialogFooter = React.forwardRef<any, React.ComponentProps<'div'>>(function DialogFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref as any}
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
})

const DialogTitle = React.forwardRef<any, React.ComponentProps<typeof DialogPrimitive.Title>>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref as any}
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
})

const DialogDescription = React.forwardRef<any, React.ComponentProps<typeof DialogPrimitive.Description>>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref as any}
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
})

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
