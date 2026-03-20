import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function GET() {
  try {
    const groups = await prisma.affectedGroup.findMany();
    return jsonResponse(groups);
  } catch (error) {
    console.error("Failed to fetch affected groups:", error);
    return jsonResponse({ error: "Failed to fetch affected groups" }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const group = await prisma.affectedGroup.create({
      data: {
        name: body.name,
        description: body.description,
      },
    });
    return jsonResponse(group, 201);
  } catch (error) {
    console.error("Failed to create affected group:", error);
    return jsonResponse({ error: "Failed to create affected group" }, 500);
  }
}
