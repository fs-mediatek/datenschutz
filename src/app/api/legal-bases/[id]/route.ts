import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const legalBasis = await prisma.legalBasis.findUnique({ where: { id } });
    if (!legalBasis) {
      return jsonResponse({ error: "Legal basis not found" }, 404);
    }
    return jsonResponse(legalBasis);
  } catch (error) {
    console.error("Failed to fetch legal basis:", error);
    return jsonResponse({ error: "Failed to fetch legal basis" }, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const legalBasis = await prisma.legalBasis.update({
      where: { id },
      data: {
        article: body.article,
        description: body.description,
      },
    });
    return jsonResponse(legalBasis);
  } catch (error) {
    console.error("Failed to update legal basis:", error);
    return jsonResponse({ error: "Failed to update legal basis" }, 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.legalBasis.delete({ where: { id } });
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to delete legal basis:", error);
    return jsonResponse({ error: "Failed to delete legal basis" }, 500);
  }
}
