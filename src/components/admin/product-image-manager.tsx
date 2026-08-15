"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  deleteProductGalleryImageAction,
  uploadProductGalleryImageAction,
} from "@/app/admin/(protected)/products/actions";
import type { AdminProductImage } from "@/lib/admin/products/types";

const acceptedTypes = "image/jpeg,image/png,image/webp,image/avif";

export function ProductImageManager({
  initialImages,
  productId,
  productName,
}: {
  initialImages: AdminProductImage[];
  productId: string;
  productName: string;
}) {
  const [images, setImages] = useState(initialImages);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingImageId, setPendingImageId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function revokePreview() {
    if (!previewUrlRef.current) return;
    URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
  }

  function clearSelection() {
    revokePreview();
    setSelectedFile(null);
    setPreviewUrl(null);
    setAltText("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function selectImage(file: File | null) {
    revokePreview();
    setMessage(null);
    setSelectedFile(file);
    if (file) {
      const nextPreviewUrl = URL.createObjectURL(file);
      previewUrlRef.current = nextPreviewUrl;
      setPreviewUrl(nextPreviewUrl);
      setAltText(`${productName} additional product view`);
    } else {
      setPreviewUrl(null);
      setAltText("");
    }
  }

  function uploadImage() {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("altText", altText);
    formData.set("image", selectedFile);

    startTransition(async () => {
      const result = await uploadProductGalleryImageAction(formData);
      setMessage(result.message);
      if (!result.ok) return;
      setImages(result.images);
      clearSelection();
    });
  }

  function removeImage(image: AdminProductImage) {
    if (
      image.isPrimary ||
      !window.confirm("Remove this image from this product gallery?")
    ) {
      return;
    }

    setPendingImageId(image.id);
    setMessage(null);
    startTransition(async () => {
      const result = await deleteProductGalleryImageAction({
        productId,
        imageId: image.id,
      });
      setMessage(result.message);
      if (result.ok) setImages(result.images);
      setPendingImageId(null);
    });
  }

  const galleryCount = images.filter((image) => !image.isPrimary).length;
  const canAdd = images.length < 20;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          {galleryCount === 0
            ? "No gallery images. The main product image will be used on its own."
            : `${galleryCount} gallery image${galleryCount === 1 ? "" : "s"} assigned to this product.`}
        </p>
        <button
          className="min-h-11 rounded-[var(--radius-round)] bg-[var(--color-action)] px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canAdd || isPending}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          Add Image
        </button>
        <input
          accept={acceptedTypes}
          className="sr-only"
          onChange={(event) => selectImage(event.target.files?.[0] ?? null)}
          ref={inputRef}
          type="file"
        />
      </div>

      {previewUrl && selectedFile ? (
        <div className="mb-5 grid gap-4 rounded-[var(--radius-md)] border border-dashed border-[var(--color-action)] bg-[var(--color-ice)] p-4 sm:grid-cols-[10rem_1fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-sm)] bg-white">
            <Image
              alt="Selected gallery image preview"
              className="object-contain p-1"
              fill
              sizes="10rem"
              src={previewUrl}
              unoptimized
            />
          </div>
          <div className="grid content-center gap-3">
            <div className="grid gap-2">
              <label className="font-bold" htmlFor="gallery-image-alt">
                Image description
              </label>
              <input
                className="min-h-11 rounded-[var(--radius-sm)] border bg-white px-4"
                id="gallery-image-alt"
                maxLength={300}
                onChange={(event) => setAltText(event.target.value)}
                value={altText}
              />
              <p className="text-xs text-[var(--color-muted)]">
                Used by screen readers when the image cannot be seen.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="min-h-11 rounded-[var(--radius-round)] bg-[var(--color-action)] px-5 font-bold text-white disabled:opacity-50"
                disabled={isPending || !altText.trim()}
                onClick={uploadImage}
                type="button"
              >
                {isPending ? "Uploading…" : "Upload image"}
              </button>
              <button
                className="min-h-11 rounded-[var(--radius-round)] border bg-white px-5 font-bold"
                disabled={isPending}
                onClick={clearSelection}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {images.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <figure
              className="overflow-hidden rounded-[var(--radius-md)] border bg-[var(--color-ice)]"
              key={image.id}
            >
              <div className="relative aspect-[4/5] bg-[radial-gradient(circle_at_50%_25%,white_0_38%,var(--color-ice)_78%)]">
                <Image
                  alt={image.alt}
                  className="object-contain p-1"
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                  src={image.src}
                  unoptimized={image.src.startsWith("/api/product-images/")}
                />
              </div>
              <figcaption className="grid gap-3 p-4 text-sm">
                <span>
                  <strong>
                    {image.isPrimary ? "Primary image" : "Gallery image"}
                  </strong>
                  <span className="mt-1 block text-[var(--color-muted)]">
                    {image.isPublished
                      ? "Approved for storefront use"
                      : "Not published"}
                  </span>
                </span>
                {!image.isPrimary ? (
                  <button
                    className="min-h-10 justify-self-start rounded-[var(--radius-round)] border border-[var(--color-error)] px-4 font-bold text-[var(--color-error)] disabled:opacity-50"
                    disabled={isPending}
                    onClick={() => removeImage(image)}
                    type="button"
                  >
                    {pendingImageId === image.id ? "Removing…" : "Remove"}
                  </button>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-ice)] p-5">
          <p className="font-bold">No assigned image is available.</p>
        </div>
      )}

      {message ? (
        <p aria-live="polite" className="mt-4 text-sm font-semibold" role="status">
          {message}
        </p>
      ) : null}
      <p className="mt-4 text-xs leading-5 text-[var(--color-muted)]">
        JPEG, PNG, WebP, or AVIF · 8 MB maximum · up to 20 images including
        the primary image.
      </p>
    </div>
  );
}
