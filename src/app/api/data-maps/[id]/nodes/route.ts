import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const nodes = await prisma.mapNode.findMany({
      where: { dataMapId: id },
      include: { process: true },
    });
    return jsonResponse(nodes);
  } catch (error) {
    console.error("Failed to fetch nodes:", error);
    return jsonResponse({ error: "Failed to fetch nodes" }, 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const node = await prisma.mapNode.create({
      data: {
        dataMapId: id,
        label: body.label,
        type: body.type,
        positionX: body.positionX ?? 0,
        positionY: body.positionY ?? 0,
        color: body.color,
        processId: body.processId,
        metadata: body.metadata,
      },
    });
    return jsonResponse(node, 201);
  } catch (error) {
    console.error("Failed to create node:", error);
    return jsonResponse({ error: "Failed to create node" }, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Bulk update positions
    const updates = body as Array<{ id: string; positionX: number; positionY: number }>;
    await prisma.$transaction(
      updates.map((node) =>
        prisma.mapNode.update({
          where: { id: node.id, dataMapId: id },
          data: {
            positionX: node.positionX,
            positionY: node.positionY,
          },
        })
      )
    );

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to bulk update nodes:", error);
    return jsonResponse({ error: "Failed to bulk update nodes" }, 500);
  }
}
