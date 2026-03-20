import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const edges = await prisma.mapEdge.findMany({
      where: { dataMapId: id },
    });
    return jsonResponse(edges);
  } catch (error) {
    console.error("Failed to fetch edges:", error);
    return jsonResponse({ error: "Failed to fetch edges" }, 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const edge = await prisma.mapEdge.create({
      data: {
        dataMapId: id,
        fromNodeId: body.fromNodeId,
        toNodeId: body.toNodeId,
        label: body.label,
        dataType: body.dataType,
        transferType: body.transferType,
      },
    });
    return jsonResponse(edge, 201);
  } catch (error) {
    console.error("Failed to create edge:", error);
    return jsonResponse({ error: "Failed to create edge" }, 500);
  }
}
