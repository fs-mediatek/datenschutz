import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const group = await prisma.affectedGroup.findUnique({ where: { id } });
    if (!group) {
      return jsonResponse({ error: "Affected group not found" }, 404);
    }
    return jsonResponse(group);
  } catch (error) {
    console.error("Failed to fetch affected group:", error);
    return jsonResponse({ error: "Failed to fetch affected group" }, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const group = await prisma.affectedGroup.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
      },
    });
    return jsonResponse(group);
  } catch (error) {
    console.error("Failed to update affected group:", error);
    return jsonResponse({ error: "Failed to update affected group" }, 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.affectedGroup.delete({ where: { id } });
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to delete affected group:", error);
    return jsonResponse({ error: "Failed to delete affected group" }, 500);
  }
}
