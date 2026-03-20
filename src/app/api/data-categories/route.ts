import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function GET() {
  try {
    const categories = await prisma.dataCategory.findMany({
      orderBy: { name: "asc" },
    });
    return jsonResponse(categories);
  } catch (error) {
    console.error("Failed to fetch data categories:", error);
    return jsonResponse({ error: "Failed to fetch data categories" }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const category = await prisma.dataCategory.create({
      data: {
        name: body.name,
        description: body.description,
        isSensitive: body.isSensitive ?? false,
      },
    });
    return jsonResponse(category, 201);
  } catch (error) {
    console.error("Failed to create data category:", error);
    return jsonResponse({ error: "Failed to create data category" }, 500);
  }
}
