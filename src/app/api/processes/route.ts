import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/response";

const processIncludes = {
  responsible: true,
  processor: true,
  dataCategories: { include: { dataCategory: true } },
  legalBases: { include: { legalBasis: true } },
  affectedGroups: { include: { affectedGroup: true } },
  technicalMeasures: { include: { technicalMeasure: true } },
  recipients: true,
  processors: true,
};

export async function GET() {
  try {
    const processes = await prisma.process.findMany({
      include: processIncludes,
    });
    return jsonResponse(processes);
  } catch (error) {
    console.error("Failed to fetch processes:", error);
    return jsonResponse({ error: "Failed to fetch processes" }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const process = await prisma.process.create({
      data: {
        number: body.number,
        name: body.name,
        description: body.description,
        purpose: body.purpose,
        responsibleId: body.responsibleId,
        processorId: body.processorId,
        deletionConcept: body.deletionConcept,
        thirdCountry: body.thirdCountry,
        thirdCountryGuarantee: body.thirdCountryGuarantee,
        riskAssessment: body.riskAssessment,
        dsfaRequired: body.dsfaRequired ?? false,
        status: body.status ?? "draft",
        lastReviewDate: body.lastReviewDate ? new Date(body.lastReviewDate) : undefined,
        nextReviewDate: body.nextReviewDate ? new Date(body.nextReviewDate) : undefined,
        dataCategories: body.dataCategories?.length
          ? {
              create: body.dataCategories.map((dc: { dataCategoryId: string; deletionPeriod?: string }) => ({
                dataCategoryId: dc.dataCategoryId,
                deletionPeriod: dc.deletionPeriod,
              })),
            }
          : undefined,
        legalBases: body.legalBases?.length
          ? {
              create: body.legalBases.map((lb: { legalBasisId: string }) => ({
                legalBasisId: lb.legalBasisId,
              })),
            }
          : undefined,
        affectedGroups: body.affectedGroups?.length
          ? {
              create: body.affectedGroups.map((ag: { affectedGroupId: string }) => ({
                affectedGroupId: ag.affectedGroupId,
              })),
            }
          : undefined,
        technicalMeasures: body.technicalMeasures?.length
          ? {
              create: body.technicalMeasures.map((tm: { technicalMeasureId: string; status?: string }) => ({
                technicalMeasureId: tm.technicalMeasureId,
                status: tm.status ?? "vorhanden",
              })),
            }
          : undefined,
        recipients: body.recipients?.length
          ? {
              create: body.recipients.map((r: { name: string; companyId?: string; category?: string; purpose?: string }) => ({
                name: r.name,
                companyId: r.companyId,
                category: r.category,
                purpose: r.purpose,
              })),
            }
          : undefined,
        processors: body.processors?.length
          ? {
              create: body.processors.map((p: { name: string; companyId?: string; avvDate?: string; description?: string }) => ({
                name: p.name,
                companyId: p.companyId,
                avvDate: p.avvDate,
                description: p.description,
              })),
            }
          : undefined,
      },
      include: processIncludes,
    });
    return jsonResponse(process, 201);
  } catch (error) {
    console.error("Failed to create process:", error);
    return jsonResponse({ error: "Failed to create process" }, 500);
  }
}
