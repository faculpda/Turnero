-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MERCADO_PAGO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "paymentAmountCents" INTEGER,
ADD COLUMN     "paymentApprovedAt" TIMESTAMP(3),
ADD COLUMN     "paymentExpiresAt" TIMESTAMP(3),
ADD COLUMN     "paymentExternalReference" TEXT,
ADD COLUMN     "paymentPreferenceId" TEXT,
ADD COLUMN     "paymentProvider" "PaymentProvider",
ADD COLUMN     "paymentProviderPaymentId" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "mercadoPagoAccessToken" TEXT,
ADD COLUMN     "mercadoPagoEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mercadoPagoPublicKey" TEXT,
ADD COLUMN     "mercadoPagoWebhookSecret" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_paymentExternalReference_key" ON "Appointment"("paymentExternalReference");
