export async function uploadImageToImgBB(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file.');
  }

  const image = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.readAsDataURL(file);
  });

  let response: Response;
  try {
    response = await fetch('/api/upload/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, name: file.name }),
    });
  } catch {
    throw new Error('Image API is unavailable. Start both services with "npm run dev".');
  }
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.ok !== true || !result.url) {
    throw new Error(result.error || `Image upload failed (HTTP ${response.status}).`);
  }

  return result.url as string;
}
