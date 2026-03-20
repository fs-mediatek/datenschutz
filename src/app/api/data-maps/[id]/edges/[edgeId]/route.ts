import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; edgeId: string }> }
) {
  try {
    const { id, edgeId } = await params;
    const body = await request.json();
    const edge = await prisma.mapEdge.update({
      where: { id: edgeId, dataMapId: id },
      data: {
        fromNodeId: body.fromNodeId,
        toNodeId: body.toNodeId,
        label: body.label,
        dataType: body.dataType,
        transferType: body.transferType,
      },
    });
    return jsonResponse(edge);
  } catch (error) {
    console.error("Failed to update edge:", error);
    return jsonResponse({ error: "Failed to update edge" }, 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; edgeId: string }> }
) {
  try {
    const { edgeId } = await params;
    await prisma.mapEdge.delete({ where: { id: edgeId } });
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to delete edge:", error);
    return jsonResponse({ error: "Failed to delete edge" }, 500);
  }
}
