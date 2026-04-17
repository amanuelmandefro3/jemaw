const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export async function uploadImage(file: File, folder: string = "payment-proofs"): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    throw new Error("Failed to upload image. Please try again.");
  }

  const data = await res.json();
  return data.secure_url as string;
}

export const uploadPaymentProof = (file: File) => uploadImage(file, "payment-proofs");
export const uploadReceipt = (file: File) => uploadImage(file, "receipts");
export const uploadAvatar = (file: File) => uploadImage(file, "avatars");
