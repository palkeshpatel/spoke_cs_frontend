import { useCallback, useMemo, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

async function createCroppedBlob(imageSrc: string, cropPixels: Area, outputType: "image/jpeg" | "image/png") {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(cropPixels.width));
  canvas.height = Math.max(1, Math.floor(cropPixels.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) {
        reject(new Error("Unable to crop image"));
        return;
      }
      resolve(b);
    }, outputType, 0.92);
  });

  return blob;
}

export function CustomerImageCropDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  title: string;
  aspect?: number;
  onConfirm: (blob: Blob) => Promise<void> | void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const imageUrl = useMemo(() => {
    if (!props.file) return null;
    return URL.createObjectURL(props.file);
  }, [props.file]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixelsValue: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsValue);
  }, []);

  const outputType = useMemo(() => {
    const type = props.file?.type ?? "image/jpeg";
    return type === "image/png" ? "image/png" : "image/jpeg";
  }, [props.file?.type]);

  const confirm = async () => {
    if (!imageUrl || !croppedAreaPixels) return;
    try {
      setIsSaving(true);
      const blob = await createCroppedBlob(imageUrl, croppedAreaPixels, outputType);
      await props.onConfirm(blob);
      props.onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>

        <div className="relative h-[360px] w-full bg-muted rounded-md overflow-hidden">
          {imageUrl ? (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={props.aspect ?? 3 / 4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Zoom</div>
          <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={(v) => setZoom(v[0] ?? 1)} />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={confirm} disabled={isSaving || !croppedAreaPixels}>
            {isSaving ? "Saving..." : "Crop & Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

