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
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden bg-black/95 border-none relative">
        <DialogTitle className="sr-only">{alt || "Image Preview"}</DialogTitle>
        
        {/* Prominent, high-visibility close button */}
        <div className="absolute right-4 top-4 z-50">
          <DialogClose className="rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors border border-white/20">
            <X className="h-5 w-5" />
          </DialogClose>
        </div>

        <div className="w-full h-full flex items-center justify-center p-6">
          {isPdf ? (
            <iframe
              src={src}
              title={alt || "Image Preview"}
              className="w-full h-full border-none bg-transparent"
              sandbox="allow-same-origin"
            />
          ) : (
            <img
              src={src}
              alt={alt || "Image Preview"}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
