import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface ImagePreviewDialogProps {
  src: string;
  alt?: string;
  children: React.ReactNode;
}

export function ImagePreviewDialog({ src, alt, children }: ImagePreviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer hover:opacity-90 transition-opacity w-full h-full">
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden bg-black/95 border-none flex flex-col items-center justify-center">
        <iframe
          src={src}
          title={alt || "Image Preview"}
          className="w-full h-full border-none bg-transparent"
          sandbox="allow-same-origin"
        />
      </DialogContent>
    </Dialog>
  );
}
