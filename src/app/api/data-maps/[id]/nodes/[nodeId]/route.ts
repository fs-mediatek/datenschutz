import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  try {
    const { id, nodeId } = await params;
    const body = await request.json();
    const node = await prisma.mapNode.update({
      where: { id: nodeId, dataMapId: id },
      data: {
        label: body.label,
        type: body.type,
        positionX: body.positionX,
        positionY: body.positionY,
        color: body.color,
        processId: body.processId,
        metadata: body.metadata,
      },
    });
    return jsonResponse(node);
  } catch (error) {
    console.error("Failed to update node:", error);
    return jsonResponse({ error: "Failed to update node" }, 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    await prisma.mapNode.delete({ where: { id: nodeId } });
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to delete node:", error);
    return jsonResponse({ error: "Failed to delete node" }, 500);
  }
}
