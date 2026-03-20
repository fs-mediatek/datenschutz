-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "street" TEXT,
    "zip" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Deutschland',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoPath" TEXT,
    "dsbName" TEXT,
    "dsbEmail" TEXT,
    "dsbPhone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DataCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LegalBasis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "article" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AffectedGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TechnicalMeasure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DataMap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MapNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataMapId" TEXT NOT NULL,
    "processId" TEXT,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "positionX" REAL NOT NULL DEFAULT 0,
    "positionY" REAL NOT NULL DEFAULT 0,
    "color" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MapNode_dataMapId_fkey" FOREIGN KEY ("dataMapId") REFERENCES "DataMap" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MapNode_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MapEdge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataMapId" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "label" TEXT,
    "dataType" TEXT,
    "transferType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MapEdge_dataMapId_fkey" FOREIGN KEY ("dataMapId") REFERENCES "DataMap" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MapEdge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "MapNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MapEdge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "MapNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Process" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purpose" TEXT,
    "responsibleId" TEXT,
    "processorId" TEXT,
    "deletionConcept" TEXT,
    "thirdCountry" TEXT,
    "thirdCountryGuarantee" TEXT,
    "riskAssessment" TEXT,
    "dsfaRequired" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "lastReviewDate" DATETIME,
    "nextReviewDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Process_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Process_processorId_fkey" FOREIGN KEY ("processorId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessDataCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processId" TEXT NOT NULL,
    "dataCategoryId" TEXT NOT NULL,
    "deletionPeriod" TEXT,
    CONSTRAINT "ProcessDataCategory_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcessDataCategory_dataCategoryId_fkey" FOREIGN KEY ("dataCategoryId") REFERENCES "DataCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessLegalBasis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processId" TEXT NOT NULL,
    "legalBasisId" TEXT NOT NULL,
    CONSTRAINT "ProcessLegalBasis_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcessLegalBasis_legalBasisId_fkey" FOREIGN KEY ("legalBasisId") REFERENCES "LegalBasis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessAffectedGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processId" TEXT NOT NULL,
    "affectedGroupId" TEXT NOT NULL,
    CONSTRAINT "ProcessAffectedGroup_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcessAffectedGroup_affectedGroupId_fkey" FOREIGN KEY ("affectedGroupId") REFERENCES "AffectedGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessTechnicalMeasure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processId" TEXT NOT NULL,
    "technicalMeasureId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'vorhanden',
    CONSTRAINT "ProcessTechnicalMeasure_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcessTechnicalMeasure_technicalMeasureId_fkey" FOREIGN KEY ("technicalMeasureId") REFERENCES "TechnicalMeasure" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processId" TEXT NOT NULL,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "purpose" TEXT,
    CONSTRAINT "Recipient_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recipient_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataProcessor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processId" TEXT NOT NULL,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "avvDate" TEXT,
    "description" TEXT,
    CONSTRAINT "DataProcessor_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DataProcessor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessDataCategory_processId_dataCategoryId_key" ON "ProcessDataCategory"("processId", "dataCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessLegalBasis_processId_legalBasisId_key" ON "ProcessLegalBasis"("processId", "legalBasisId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessAffectedGroup_processId_affectedGroupId_key" ON "ProcessAffectedGroup"("processId", "affectedGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessTechnicalMeasure_processId_technicalMeasureId_key" ON "ProcessTechnicalMeasure"("processId", "technicalMeasureId");
