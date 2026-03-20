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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const process = await prisma.process.findUnique({
      where: { id },
      include: processIncludes,
    });
    if (!process) {
      return jsonResponse({ error: "Process not found" }, 404);
    }
    return jsonResponse(process);
  } catch (error) {
    console.error("Failed to fetch process:", error);
    return jsonResponse({ error: "Failed to fetch process" }, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const process = await prisma.$transaction(async (tx) => {
      // Delete all existing relations
      await tx.processDataCategory.deleteMany({ where: { processId: id } });
      await tx.processLegalBasis.deleteMany({ where: { processId: id } });
      await tx.processAffectedGroup.deleteMany({ where: { processId: id } });
      await tx.processTechnicalMeasure.deleteMany({ where: { processId: id } });
      await tx.recipient.deleteMany({ where: { processId: id } });
      await tx.dataProcessor.deleteMany({ where: { processId: id } });

      // Update process with new data and recreate relations
      return tx.process.update({
        where: { id },
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
          dsfaRequired: body.dsfaRequired,
          status: body.status,
          lastReviewDate: body.lastReviewDate ? new Date(body.lastReviewDate) : null,
          nextReviewDate: body.nextReviewDate ? new Date(body.nextReviewDate) : null,
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
    });

    return jsonResponse(process);
  } catch (error) {
    console.error("Failed to update process:", error);
    return jsonResponse({ error: "Failed to update process" }, 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.process.delete({ where: { id } });
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to delete process:", error);
    return jsonResponse({ error: "Failed to delete process" }, 500);
  }
}
