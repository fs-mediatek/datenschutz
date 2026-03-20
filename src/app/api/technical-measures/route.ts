import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function GET() {
  try {
    const measures = await prisma.technicalMeasure.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return jsonResponse(measures);
  } catch (error) {
    console.error("Failed to fetch technical measures:", error);
    return jsonResponse({ error: "Failed to fetch technical measures" }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const measure = await prisma.technicalMeasure.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
      },
    });
    return jsonResponse(measure, 201);
  } catch (error) {
    console.error("Failed to create technical measure:", error);
    return jsonResponse({ error: "Failed to create technical measure" }, 500);
  }
}
