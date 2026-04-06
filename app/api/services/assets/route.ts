import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { canManageTenant, getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Necesitas iniciar sesion." }, { status: 401 });
    }

    const formData = await request.formData();
    const tenantSlug = String(formData.get("tenantSlug") ?? "");
    const serviceId = String(formData.get("serviceId") ?? "");
    const file = formData.get("file");

    if (!tenantSlug || !serviceId || !(file instanceof File)) {
      return NextResponse.json({ error: "Datos de carga invalidos." }, { status: 400 });
    }

    if (!(await canManageTenant(tenantSlug))) {
      return NextResponse.json(
        { error: "No tienes permisos para subir imagenes a este tenant." },
        { status: 403 },
      );
    }

    const service = await prisma.service.findUnique({
      where: {
        id: serviceId,
      },
      include: {
        tenant: true,
      },
    });

    if (!service || service.tenant.slug !== tenantSlug) {
      return NextResponse.json({ error: "Servicio no encontrado." }, { status: 404 });
    }

    const extension = path.extname(file.name).toLowerCase();

    if (!allowedExtensions.has(extension)) {
      return NextResponse.json(
        { error: "Formato no permitido. Usa PNG, JPG, WEBP o SVG." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `service-${randomUUID()}${extension}`;
    const relativeDir = path.join("uploads", "tenants", tenantSlug, "services", serviceId);
    const absoluteDir = path.join(process.cwd(), "public", relativeDir);

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(path.join(absoluteDir, fileName), buffer);

    return NextResponse.json({
      ok: true,
      url: `/${relativeDir.replace(/\\/g, "/")}/${fileName}`,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo subir la imagen en este momento." },
      { status: 500 },
    );
  }
}
