import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function GET() {
  try {
    const legalBases = await prisma.legalBasis.findMany();
    return jsonResponse(legalBases);
  } catch (error) {
    console.error("Failed to fetch legal bases:", error);
    return jsonResponse({ error: "Failed to fetch legal bases" }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const legalBasis = await prisma.legalBasis.create({
      data: {
        article: body.article,
        description: body.description,
      },
    });
    return jsonResponse(legalBasis, 201);
  } catch (error) {
    console.error("Failed to create legal basis:", error);
    return jsonResponse({ error: "Failed to create legal basis" }, 500);
  }
}
