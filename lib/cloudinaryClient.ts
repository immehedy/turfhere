export type CloudinaryUploadResult = {
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
    format: string;
  };
  
  export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
    // get signature from our server
    const signRes = await fetch("/api/uploads/cloudinary-sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  
    if (!signRes.ok) throw new Error("Failed to get upload signature");
    const { cloudName, apiKey, timestamp, folder, signature } = await signRes.json();
  
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("folder", folder);
    form.append("signature", signature);
  
    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: form,
    });
  
    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      throw new Error(`Cloudinary upload failed: ${text}`);
    }
  
    return uploadRes.json();
  }
  