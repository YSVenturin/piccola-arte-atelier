export async function prepareProductPhoto(file: File): Promise<File> {
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Escolha fotos no formato JPG ou PNG.");
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Escolha fotos de até 15 MB cada.");
  }

  let bitmap: ImageBitmap;

  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      "Não foi possível ler essa foto. Escolha outro arquivo.",
    );
  }

  try {
    const ratio = Math.min(
      1,
      1600 / Math.max(bitmap.width, bitmap.height),
    );

    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "Não foi possível preparar a foto neste navegador.",
      );
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Não foi possível preparar a foto."));
          }
        },
        "image/jpeg",
        0.85,
      );
    });

    if (blob.size > 5 * 1024 * 1024) {
      throw new Error(
        "A foto continua muito grande. Escolha uma versão menor.",
      );
    }

    return new File(
      [blob],
      `${file.name.replace(/\.[^.]+$/, "")}.jpg`,
      { type: "image/jpeg" },
    );
  } finally {
    bitmap.close();
  }
}