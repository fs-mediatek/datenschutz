import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dataMap = await prisma.dataMap.findUnique({
      where: { id },
      include: {
        nodes: { include: { process: true } },
        edges: true,
      },
    });
    if (!dataMap) {
      return jsonResponse({ error: "Data map not found" }, 404);
    }
    return jsonResponse(dataMap);
  } catch (error) {
    console.error("Failed to fetch data map:", error);
    return jsonResponse({ error: "Failed to fetch data map" }, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const dataMap = await prisma.dataMap.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        companyId: body.companyId,
      },
    });
    return jsonResponse(dataMap);
  } catch (error) {
    console.error("Failed to update data map:", error);
    return jsonResponse({ error: "Failed to update data map" }, 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.dataMap.delete({ where: { id } });
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to delete data map:", error);
    return jsonResponse({ error: "Failed to delete data map" }, 500);
  }
}
