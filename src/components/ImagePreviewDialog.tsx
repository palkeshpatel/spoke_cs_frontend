import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ImagePreviewDialogProps {
  src: string;
  alt?: string;
  children: React.ReactNode;
}

export function ImagePreviewDialog({ src, alt, children }: ImagePreviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isPdf = src.toLowerCase().split(/[?#]/)[0].endsWith(".pdf");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer hover:opacity-90 transition-opacity w-full h-full">
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md w-[90vw] p-4 bg-background rounded-lg border shadow-lg overflow-hidden flex flex-col items-center justify-center">
        <DialogTitle className="sr-only">{alt || "Image Preview"}</DialogTitle>
        
        {/* Prominent, clean close button */}
        <div className="absolute right-3 top-3 z-50">
          <DialogClose className="rounded-full bg-muted/80 p-1.5 text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </DialogClose>
        </div>

        <div className="w-full flex items-center justify-center pt-6">
          {isPdf ? (
            <iframe
              src={src}
              title={alt || "Image Preview"}
              className="w-full aspect-[3/4] border-none bg-transparent"
              sandbox="allow-same-origin"
            />
          ) : (
            <img
              src={src}
              alt={alt || "Image Preview"}
              className="max-w-full max-h-[70vh] object-contain rounded-md"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
