import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function GET() {
  try {
    const dataMaps = await prisma.dataMap.findMany({
      include: {
        _count: {
          select: {
            nodes: true,
            edges: true,
          },
        },
      },
    });
    return jsonResponse(dataMaps);
  } catch (error) {
    console.error("Failed to fetch data maps:", error);
    return jsonResponse({ error: "Failed to fetch data maps" }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dataMap = await prisma.dataMap.create({
      data: {
        name: body.name,
        description: body.description,
        companyId: body.companyId,
      },
    });
    return jsonResponse(dataMap, 201);
  } catch (error) {
    console.error("Failed to create data map:", error);
    return jsonResponse({ error: "Failed to create data map" }, 500);
  }
}
