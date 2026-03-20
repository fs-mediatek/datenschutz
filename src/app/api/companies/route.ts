import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
    });
    return jsonResponse(companies);
  } catch (error) {
    console.error("Failed to fetch companies:", error);
    return jsonResponse({ error: "Failed to fetch companies" }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const company = await prisma.company.create({
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
    return jsonResponse(company, 201);
  } catch (error) {
    console.error("Failed to create company:", error);
    return jsonResponse({ error: "Failed to create company" }, 500);
  }
}
