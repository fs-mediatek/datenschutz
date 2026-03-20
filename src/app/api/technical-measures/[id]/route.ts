import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const measure = await prisma.technicalMeasure.findUnique({ where: { id } });
    if (!measure) {
      return jsonResponse({ error: "Technical measure not found" }, 404);
    }
    return jsonResponse(measure);
  } catch (error) {
    console.error("Failed to fetch technical measure:", error);
    return jsonResponse({ error: "Failed to fetch technical measure" }, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const measure = await prisma.technicalMeasure.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
      },
    });
    return jsonResponse(measure);
  } catch (error) {
    console.error("Failed to update technical measure:", error);
    return jsonResponse({ error: "Failed to update technical measure" }, 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.technicalMeasure.delete({ where: { id } });
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to delete technical measure:", error);
    return jsonResponse({ error: "Failed to delete technical measure" }, 500);
  }
}
