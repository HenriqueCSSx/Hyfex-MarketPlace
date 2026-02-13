import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

type Point = { x: number; y: number };
type Area = { width: number; height: number; x: number; y: number };
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getCroppedImg } from "@/lib/cropImage";
import { Slider } from "@/components/ui/slider";

interface ImageCropperProps {
    image: string;
    onCropComplete: (croppedImage: Blob) => void;
    onCancel: () => void;
    aspect?: number;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
    image,
    onCropComplete,
    onCancel,
    aspect = 1,
}) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropChange = (crop: Point) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteInternal = useCallback(
        (_croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const handleCrop = async () => {
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            if (croppedImage) {
                onCropComplete(croppedImage);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={!!image} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="max-w-[500px] bg-zinc-950 border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-white font-display uppercase tracking-widest text-sm">Redimensionar Imagem</DialogTitle>
                </DialogHeader>

                <div className="relative h-[400px] w-full bg-zinc-900 rounded-xl overflow-hidden">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Zoom</span>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(vals) => setZoom(vals[0])}
                            className="py-4"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onCancel} className="border-white/10 text-white">
                        Cancelar
                    </Button>
                    <Button onClick={handleCrop} className="bg-primary hover:bg-primary/90 text-white font-bold">
                        Aplicar Corte
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
