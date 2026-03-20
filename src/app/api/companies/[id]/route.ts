import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return jsonResponse({ error: "Company not found" }, 404);
    }
    return jsonResponse(company);
  } catch (error) {
    console.error("Failed to fetch company:", error);
    return jsonResponse({ error: "Failed to fetch company" }, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const company = await prisma.company.update({
      where: { id },
      data: {
        name: body.name,
        street: body.street,
        zip: body.zip,
        city: body.city,
        country: body.country,
        phone: body.phone,
        email: body.email,
        website: body.website,
        logoPath: body.logoPath,
        dsbName: body.dsbName,
        dsbEmail: body.dsbEmail,
        dsbPhone: body.dsbPhone,
      },
    });
    return jsonResponse(company);
  } catch (error) {
    console.error("Failed to update company:", error);
    return jsonResponse({ error: "Failed to update company" }, 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.company.delete({ where: { id } });
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to delete company:", error);
    return jsonResponse({ error: "Failed to delete company" }, 500);
  }
}
