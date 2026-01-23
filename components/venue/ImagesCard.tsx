"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "../ui/card";
import { VenueIcon } from "./venueIcons";
import { UploadedImage } from "./venueTypes";

export default function ImagesCard(props: {
  images: UploadedImage[];
  thumbnailIndex: number;
  setThumbnailIndex: (i: number) => void;
  uploading: boolean;
  uploadMsg: string | null;
  onPickFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (i: number) => void;
  thumbnailUrl: string;
}) {
  const {
    images,
    thumbnailIndex,
    setThumbnailIndex,
    uploading,
    uploadMsg,
    onPickFiles,
    removeImage,
    thumbnailUrl,
  } = props;

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl border border-gray-200 bg-gray-50 p-2 text-gray-800">
            {VenueIcon.Photo}
          </div>

          <div>
            <CardTitle>Images</CardTitle>
            <CardDescription>
              Upload multiple images and select a thumbnail.
            </CardDescription>
          </div>
        </div>

        <CardAction>
          <label
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm shadow-sm cursor-pointer",
              uploading ? "opacity-60" : "hover:bg-gray-50"
            )}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onPickFiles}
              disabled={uploading}
            />
            <span className="mr-2">{VenueIcon.Plus}</span>
            {uploading ? "Uploading…" : "Upload"}
          </label>
        </CardAction>
      </CardHeader>

      <CardContent>
        {uploadMsg && (
          <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {uploadMsg}
          </div>
        )}

        {images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-600">
            No images uploaded yet.
            <div className="mt-2 text-xs text-gray-500">
              Add at least one image to create the venue.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {images.map((img, i) => {
              const isThumb = thumbnailIndex === i;

              return (
                <div
                  key={img.publicId}
                  className={cn(
                    "overflow-hidden rounded-xl border bg-white shadow-sm",
                    isThumb
                      ? "border-gray-900 ring-2 ring-gray-900"
                      : "border-gray-200"
                  )}
                >
                  <img
                    src={img.url}
                    alt="uploaded"
                    className="h-28 w-full object-cover"
                  />

                  <div className="p-2 space-y-2">
                    <label className="text-xs flex items-center gap-2 text-gray-700">
                      <input
                        type="radio"
                        name="thumbnail"
                        checked={isThumb}
                        onChange={() => setThumbnailIndex(i)}
                      />
                      Thumbnail
                    </label>

                    <button
                      type="button"
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs hover:bg-gray-50"
                      onClick={() => removeImage(i)}
                      disabled={uploading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {images.length > 0 && (
          <p className="mt-3 text-xs text-gray-500">
            Thumbnail URL: <span className="font-mono">{thumbnailUrl}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
