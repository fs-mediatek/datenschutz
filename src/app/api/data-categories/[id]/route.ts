import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await prisma.dataCategory.findUnique({ where: { id } });
    if (!category) {
      return jsonResponse({ error: "Data category not found" }, 404);
    }
    return jsonResponse(category);
  } catch (error) {
    console.error("Failed to fetch data category:", error);
    return jsonResponse({ error: "Failed to fetch data category" }, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const category = await prisma.dataCategory.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        isSensitive: body.isSensitive,
      },
    });
    return jsonResponse(category);
  } catch (error) {
    console.error("Failed to update data category:", error);
    return jsonResponse({ error: "Failed to update data category" }, 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.dataCategory.delete({ where: { id } });
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to delete data category:", error);
    return jsonResponse({ error: "Failed to delete data category" }, 500);
  }
}
