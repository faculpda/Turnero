import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentSession, hasTenantAccess } from "@/lib/auth/session";

const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Necesitas iniciar sesion." }, { status: 401 });
    }

    const formData = await request.formData();
    const tenantSlug = String(formData.get("tenantSlug") ?? "");
    const assetType = String(formData.get("assetType") ?? "");
    const file = formData.get("file");

    if (!tenantSlug || (assetType !== "logo" && assetType !== "hero") || !(file instanceof File)) {
      return NextResponse.json({ error: "Datos de carga invalidos." }, { status: 400 });
    }

    if (!(await hasTenantAccess(tenantSlug))) {
      return NextResponse.json(
        { error: "No tienes permisos para subir archivos a este tenant." },
        { status: 403 },
      );
    }

    const extension = path.extname(file.name).toLowerCase();

    if (!allowedExtensions.has(extension)) {
      return NextResponse.json(
        { error: "Formato no permitido. Usa PNG, JPG, WEBP o SVG." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${assetType}-${randomUUID()}${extension}`;
    const relativeDir = path.join("uploads", "tenants", tenantSlug);
    const absoluteDir = path.join(process.cwd(), "public", relativeDir);

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(path.join(absoluteDir, fileName), buffer);

    return NextResponse.json({
      ok: true,
      url: `/${relativeDir.replace(/\\/g, "/")}/${fileName}`,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo subir el archivo en este momento." },
      { status: 500 },
    );
  }
}
