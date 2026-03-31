--
-- PostgreSQL database dump
--

\restrict zt3SLFygcpnfQdy1vRpcdkh9ARWG6mGBetgKdrqTPkR9Zd9qifCGYgHLBrPvJ4i

-- Dumped from database version 14.22 (Ubuntu 14.22-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.22 (Ubuntu 14.22-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS "audit_logs_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."WorkRelation" DROP CONSTRAINT IF EXISTS "WorkRelation_workId_fkey";
ALTER TABLE IF EXISTS ONLY public."UserNotificationSettings" DROP CONSTRAINT IF EXISTS "UserNotificationSettings_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."ReferenceChangeLog" DROP CONSTRAINT IF EXISTS "ReferenceChangeLog_changedBy_fkey";
ALTER TABLE IF EXISTS ONLY public."PriceHistory" DROP CONSTRAINT IF EXISTS "PriceHistory_changedBy_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_estimateId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_assignedTo_fkey";
ALTER TABLE IF EXISTS ONLY public."MountingHardwareRelation" DROP CONSTRAINT IF EXISTS "MountingHardwareRelation_mountingHardwareId_fkey";
ALTER TABLE IF EXISTS ONLY public."FenceMaterial" DROP CONSTRAINT IF EXISTS "FenceMaterial_fenceTypeId_fkey";
ALTER TABLE IF EXISTS ONLY public."FenceEstimate" DROP CONSTRAINT IF EXISTS "FenceEstimate_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."FenceEstimate" DROP CONSTRAINT IF EXISTS "FenceEstimate_fenceTypeId_fkey";
DROP INDEX IF EXISTS public."audit_logs_userId_idx";
DROP INDEX IF EXISTS public."audit_logs_entityType_entityId_idx";
DROP INDEX IF EXISTS public."audit_logs_createdAt_idx";
DROP INDEX IF EXISTS public.audit_logs_action_idx;
DROP INDEX IF EXISTS public."Work_useInCalculator_idx";
DROP INDEX IF EXISTS public."Work_sortOrder_idx";
DROP INDEX IF EXISTS public."Work_category_idx";
DROP INDEX IF EXISTS public."Work_active_idx";
DROP INDEX IF EXISTS public."WorkRelation_workId_fenceType_referenceType_referenceId_key";
DROP INDEX IF EXISTS public."WorkRelation_referenceType_idx";
DROP INDEX IF EXISTS public."WorkRelation_referenceId_idx";
DROP INDEX IF EXISTS public."WorkRelation_fenceType_idx";
DROP INDEX IF EXISTS public."WicketType_validFrom_idx";
DROP INDEX IF EXISTS public."WicketType_sectionWidth_sectionHeight_metalThickness_wicket_idx";
DROP INDEX IF EXISTS public."WicketType_priority_idx";
DROP INDEX IF EXISTS public."WicketType_expirationDate_idx";
DROP INDEX IF EXISTS public."WicketType_active_idx";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."UserNotificationSettings_userId_key";
DROP INDEX IF EXISTS public."Setting_key_key";
DROP INDEX IF EXISTS public."ReferenceChangeLog_entityType_entityId_idx";
DROP INDEX IF EXISTS public."ReferenceChangeLog_changedAt_idx";
DROP INDEX IF EXISTS public."ProfnastilType_validUntil_idx";
DROP INDEX IF EXISTS public."ProfnastilType_priority_idx";
DROP INDEX IF EXISTS public."ProfnastilType_name_metalThickness_coating_color_key";
DROP INDEX IF EXISTS public."ProfnastilType_name_idx";
DROP INDEX IF EXISTS public."ProfnastilType_coating_idx";
DROP INDEX IF EXISTS public."ProfnastilType_active_idx";
DROP INDEX IF EXISTS public."PostType_validFrom_idx";
DROP INDEX IF EXISTS public."PostType_sectionWidth_sectionHeight_wallThickness_idx";
DROP INDEX IF EXISTS public."PostType_priority_idx";
DROP INDEX IF EXISTS public."PostType_length_idx";
DROP INDEX IF EXISTS public."PostType_expirationDate_idx";
DROP INDEX IF EXISTS public."PostType_active_idx";
DROP INDEX IF EXISTS public."PicketType_validUntil_idx";
DROP INDEX IF EXISTS public."PicketType_priority_idx";
DROP INDEX IF EXISTS public."PicketType_name_metalThickness_coating_color_key";
DROP INDEX IF EXISTS public."PicketType_name_idx";
DROP INDEX IF EXISTS public."PicketType_coating_idx";
DROP INDEX IF EXISTS public."PicketType_active_idx";
DROP INDEX IF EXISTS public."PageContent_slug_key";
DROP INDEX IF EXISTS public."Order_status_idx";
DROP INDEX IF EXISTS public."Order_measurementDate_idx";
DROP INDEX IF EXISTS public."Order_estimateId_key";
DROP INDEX IF EXISTS public."Order_estimateId_idx";
DROP INDEX IF EXISTS public."Order_completionDate_idx";
DROP INDEX IF EXISTS public."Order_cancellationReason_idx";
DROP INDEX IF EXISTS public."MountingHardware_validUntil_idx";
DROP INDEX IF EXISTS public."MountingHardware_useInCalculator_idx";
DROP INDEX IF EXISTS public."MountingHardware_sortOrder_idx";
DROP INDEX IF EXISTS public."MountingHardware_active_idx";
DROP INDEX IF EXISTS public."MountingHardwareRelation_referenceType_idx";
DROP INDEX IF EXISTS public."MountingHardwareRelation_referenceId_idx";
DROP INDEX IF EXISTS public."MountingHardwareRelation_mountingHardwareId_referenceType_r_key";
DROP INDEX IF EXISTS public."LagType_width_height_metalThickness_length_idx";
DROP INDEX IF EXISTS public."LagType_validFrom_idx";
DROP INDEX IF EXISTS public."LagType_priority_idx";
DROP INDEX IF EXISTS public."LagType_length_idx";
DROP INDEX IF EXISTS public."LagType_expirationDate_idx";
DROP INDEX IF EXISTS public."LagType_active_idx";
DROP INDEX IF EXISTS public."GateType_validFrom_idx";
DROP INDEX IF EXISTS public."GateType_type_idx";
DROP INDEX IF EXISTS public."GateType_sectionWidth_sectionHeight_metalThickness_gateLeng_idx";
DROP INDEX IF EXISTS public."GateType_priority_idx";
DROP INDEX IF EXISTS public."GateType_expirationDate_idx";
DROP INDEX IF EXISTS public."GateType_active_idx";
DROP INDEX IF EXISTS public."FenceType_priority_idx";
DROP INDEX IF EXISTS public."FenceType_active_idx";
DROP INDEX IF EXISTS public."FenceMaterial_fenceTypeId_idx";
DROP INDEX IF EXISTS public."FenceMaterial_category_idx";
DROP INDEX IF EXISTS public."FenceMaterial_active_idx";
DROP INDEX IF EXISTS public."FenceEstimate_userId_idx";
DROP INDEX IF EXISTS public."FenceEstimate_sessionId_idx";
DROP INDEX IF EXISTS public."FenceEstimate_fenceTypeId_idx";
DROP INDEX IF EXISTS public."FenceEstimate_createdAt_idx";
DROP INDEX IF EXISTS public."FenceEstimate_city_idx";
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."Work" DROP CONSTRAINT IF EXISTS "Work_pkey";
ALTER TABLE IF EXISTS ONLY public."WorkRelation" DROP CONSTRAINT IF EXISTS "WorkRelation_pkey";
ALTER TABLE IF EXISTS ONLY public."WorkPrice" DROP CONSTRAINT IF EXISTS "WorkPrice_pkey";
ALTER TABLE IF EXISTS ONLY public."WicketType" DROP CONSTRAINT IF EXISTS "WicketType_pkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."UserNotificationSettings" DROP CONSTRAINT IF EXISTS "UserNotificationSettings_pkey";
ALTER TABLE IF EXISTS ONLY public."SoilType" DROP CONSTRAINT IF EXISTS "SoilType_pkey";
ALTER TABLE IF EXISTS ONLY public."Setting" DROP CONSTRAINT IF EXISTS "Setting_pkey";
ALTER TABLE IF EXISTS ONLY public."Review" DROP CONSTRAINT IF EXISTS "Review_pkey";
ALTER TABLE IF EXISTS ONLY public."ReferenceChangeLog" DROP CONSTRAINT IF EXISTS "ReferenceChangeLog_pkey";
ALTER TABLE IF EXISTS ONLY public."RateLimitConfig" DROP CONSTRAINT IF EXISTS "RateLimitConfig_pkey";
ALTER TABLE IF EXISTS ONLY public."ProfnastilType" DROP CONSTRAINT IF EXISTS "ProfnastilType_pkey";
ALTER TABLE IF EXISTS ONLY public."PriceHistory" DROP CONSTRAINT IF EXISTS "PriceHistory_pkey";
ALTER TABLE IF EXISTS ONLY public."PostType" DROP CONSTRAINT IF EXISTS "PostType_pkey";
ALTER TABLE IF EXISTS ONLY public."PortfolioItem" DROP CONSTRAINT IF EXISTS "PortfolioItem_pkey";
ALTER TABLE IF EXISTS ONLY public."PicketType" DROP CONSTRAINT IF EXISTS "PicketType_pkey";
ALTER TABLE IF EXISTS ONLY public."Panel3D" DROP CONSTRAINT IF EXISTS "Panel3D_pkey";
ALTER TABLE IF EXISTS ONLY public."PageContent" DROP CONSTRAINT IF EXISTS "PageContent_pkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_pkey";
ALTER TABLE IF EXISTS ONLY public."MountingHardware" DROP CONSTRAINT IF EXISTS "MountingHardware_pkey";
ALTER TABLE IF EXISTS ONLY public."MountingHardwareRelation" DROP CONSTRAINT IF EXISTS "MountingHardwareRelation_pkey";
ALTER TABLE IF EXISTS ONLY public."LagType" DROP CONSTRAINT IF EXISTS "LagType_pkey";
ALTER TABLE IF EXISTS ONLY public."GateType" DROP CONSTRAINT IF EXISTS "GateType_pkey";
ALTER TABLE IF EXISTS ONLY public."FenceType" DROP CONSTRAINT IF EXISTS "FenceType_pkey";
ALTER TABLE IF EXISTS ONLY public."FenceMaterial" DROP CONSTRAINT IF EXISTS "FenceMaterial_pkey";
ALTER TABLE IF EXISTS ONLY public."FenceEstimate" DROP CONSTRAINT IF EXISTS "FenceEstimate_pkey";
ALTER TABLE IF EXISTS ONLY public."ContactInfo" DROP CONSTRAINT IF EXISTS "ContactInfo_pkey";
ALTER TABLE IF EXISTS ONLY public."CanopyType" DROP CONSTRAINT IF EXISTS "CanopyType_pkey";
ALTER TABLE IF EXISTS ONLY public."CanopyMaterial" DROP CONSTRAINT IF EXISTS "CanopyMaterial_pkey";
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."WorkRelation";
DROP TABLE IF EXISTS public."WorkPrice";
DROP TABLE IF EXISTS public."Work";
DROP TABLE IF EXISTS public."WicketType";
DROP TABLE IF EXISTS public."UserNotificationSettings";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."SoilType";
DROP TABLE IF EXISTS public."Setting";
DROP TABLE IF EXISTS public."Review";
DROP TABLE IF EXISTS public."ReferenceChangeLog";
DROP TABLE IF EXISTS public."RateLimitConfig";
DROP TABLE IF EXISTS public."ProfnastilType";
DROP TABLE IF EXISTS public."PriceHistory";
DROP TABLE IF EXISTS public."PostType";
DROP TABLE IF EXISTS public."PortfolioItem";
DROP TABLE IF EXISTS public."PicketType";
DROP TABLE IF EXISTS public."Panel3D";
DROP TABLE IF EXISTS public."PageContent";
DROP TABLE IF EXISTS public."Order";
DROP TABLE IF EXISTS public."MountingHardwareRelation";
DROP TABLE IF EXISTS public."MountingHardware";
DROP TABLE IF EXISTS public."LagType";
DROP TABLE IF EXISTS public."GateType";
DROP TABLE IF EXISTS public."FenceType";
DROP TABLE IF EXISTS public."FenceMaterial";
DROP TABLE IF EXISTS public."FenceEstimate";
DROP TABLE IF EXISTS public."ContactInfo";
DROP TABLE IF EXISTS public."CanopyType";
DROP TABLE IF EXISTS public."CanopyMaterial";
DROP TYPE IF EXISTS public."Role";
DROP TYPE IF EXISTS public."OrderStatus";
DROP TYPE IF EXISTS public."FenceMaterialCategory";
DROP TYPE IF EXISTS public."CanopyMaterialCategory";
--
-- Name: CanopyMaterialCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CanopyMaterialCategory" AS ENUM (
    'POLYCARBONATE',
    'PROFNASTIL',
    'METAL_TILE',
    'PROFILE',
    'FASTENERS',
    'WATER_SYSTEM'
);


ALTER TYPE public."CanopyMaterialCategory" OWNER TO postgres;

--
-- Name: FenceMaterialCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FenceMaterialCategory" AS ENUM (
    'PROFNASTIL',
    'SHAKHETNIK',
    'MESH',
    'PANELS_3D',
    'POSTS',
    'LAGS',
    'GATES',
    'WICKETS',
    'FASTENERS'
);


ALTER TYPE public."FenceMaterialCategory" OWNER TO postgres;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'NEW',
    'ESTIMATE_APPROVAL',
    'MEASUREMENT',
    'PRODUCTION',
    'INSTALLATION',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'MANAGER',
    'CONTENT_MANAGER'
);


ALTER TYPE public."Role" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: CanopyMaterial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CanopyMaterial" (
    id text NOT NULL,
    name text NOT NULL,
    category public."CanopyMaterialCategory" NOT NULL,
    unit text NOT NULL,
    "basePrice" double precision NOT NULL,
    thickness double precision,
    color text,
    image text,
    active boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CanopyMaterial" OWNER TO postgres;

--
-- Name: CanopyType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CanopyType" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    image text,
    "areaCoef" double precision DEFAULT 1.0 NOT NULL,
    "materialCoef" double precision DEFAULT 1.0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CanopyType" OWNER TO postgres;

--
-- Name: ContactInfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ContactInfo" (
    id text NOT NULL,
    address text DEFAULT ''::text NOT NULL,
    phone text DEFAULT ''::text NOT NULL,
    email text DEFAULT ''::text NOT NULL,
    "workHoursMonFri" text DEFAULT ''::text NOT NULL,
    "workHoursSat" text DEFAULT ''::text NOT NULL,
    "workHoursSun" text DEFAULT ''::text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ContactInfo" OWNER TO postgres;

--
-- Name: FenceEstimate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FenceEstimate" (
    id text NOT NULL,
    "fenceTypeId" text NOT NULL,
    length double precision NOT NULL,
    height double precision NOT NULL,
    "lagRows" integer NOT NULL,
    "postsTotal" double precision NOT NULL,
    "lagsTotal" double precision NOT NULL,
    "profnastilTotal" double precision NOT NULL,
    "installationTotal" double precision NOT NULL,
    "materialsTotal" double precision NOT NULL,
    "grandTotal" double precision NOT NULL,
    items jsonb NOT NULL,
    "userId" text,
    "sessionId" text,
    "userAgent" text,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "mountingHardwareTotal" double precision DEFAULT 0 NOT NULL,
    coating text DEFAULT 'POLYMER_SINGLE'::text NOT NULL,
    "gateInstallationTotal" double precision DEFAULT 0 NOT NULL,
    "gateLength" integer,
    "gateNomenclatureId" text,
    "gateNomenclatureName" text,
    "gateTotal" double precision DEFAULT 0 NOT NULL,
    "gateType" text,
    "hasGate" boolean DEFAULT false NOT NULL,
    "hasWicket" boolean DEFAULT false NOT NULL,
    "wicketInstallationTotal" double precision DEFAULT 0 NOT NULL,
    "wicketNomenclatureId" text,
    "wicketNomenclatureName" text,
    "wicketTotal" double precision DEFAULT 0 NOT NULL,
    "wicketWidth" integer,
    city text,
    "panel3dId" text,
    "panel3dInstallationTotal" double precision DEFAULT 0 NOT NULL,
    "panel3dNomenclatureName" text,
    "panel3dTotal" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public."FenceEstimate" OWNER TO postgres;

--
-- Name: FenceMaterial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FenceMaterial" (
    id text NOT NULL,
    name text NOT NULL,
    category public."FenceMaterialCategory" NOT NULL,
    unit text NOT NULL,
    "basePrice" double precision NOT NULL,
    description text,
    image text,
    thickness double precision,
    width double precision,
    height double precision,
    coating text,
    "availableHeights" jsonb,
    "availableThicknesses" double precision[],
    "thicknessPrices" jsonb,
    active boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "fenceTypeId" text
);


ALTER TABLE public."FenceMaterial" OWNER TO postgres;

--
-- Name: FenceType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FenceType" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    image text,
    "difficultyCoef" double precision DEFAULT 1.0 NOT NULL,
    "postSpacing" integer DEFAULT 2500 NOT NULL,
    "defaultLagRows" integer DEFAULT 2 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    priority integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."FenceType" OWNER TO postgres;

--
-- Name: GateType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GateType" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    "metalThickness" double precision NOT NULL,
    "sectionWidth" double precision NOT NULL,
    "sectionHeight" double precision NOT NULL,
    "gateHeight" double precision NOT NULL,
    "gateLength" double precision NOT NULL,
    "retailPrice" double precision NOT NULL,
    "purchasePrice" double precision,
    image text,
    active boolean DEFAULT true NOT NULL,
    "validFrom" timestamp(3) without time zone,
    "expirationDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    priority integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."GateType" OWNER TO postgres;

--
-- Name: LagType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LagType" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    width double precision NOT NULL,
    height double precision NOT NULL,
    "metalThickness" double precision NOT NULL,
    "retailPricePerUnit" double precision NOT NULL,
    "purchasePricePerUnit" double precision,
    image text,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expirationDate" timestamp(3) without time zone,
    "validFrom" timestamp(3) without time zone,
    priority integer DEFAULT 0 NOT NULL,
    length integer NOT NULL
);


ALTER TABLE public."LagType" OWNER TO postgres;

--
-- Name: MountingHardware; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MountingHardware" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "purchasePrice" double precision,
    "retailPrice" double precision NOT NULL,
    "validUntil" timestamp(3) without time zone,
    active boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "calculationMethod" text,
    "calculationValue" double precision,
    "useInCalculator" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."MountingHardware" OWNER TO postgres;

--
-- Name: MountingHardwareRelation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MountingHardwareRelation" (
    id text NOT NULL,
    "mountingHardwareId" text NOT NULL,
    "referenceType" text NOT NULL,
    "referenceId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MountingHardwareRelation" OWNER TO postgres;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "clientName" text NOT NULL,
    phone text NOT NULL,
    email text,
    "serviceType" text NOT NULL,
    parameters jsonb NOT NULL,
    "calculatedCost" double precision NOT NULL,
    status public."OrderStatus" DEFAULT 'NEW'::public."OrderStatus" NOT NULL,
    "managerComment" text,
    "assignedTo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "statusHistory" jsonb,
    "estimateId" text,
    "cancellationReason" text,
    "completionDate" timestamp(3) without time zone,
    "measurementAddress" text,
    "measurementDate" timestamp(3) without time zone
);


ALTER TABLE public."Order" OWNER TO postgres;

--
-- Name: PageContent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PageContent" (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    content jsonb NOT NULL,
    "seoTitle" text,
    "seoDescription" text,
    "seoKeywords" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PageContent" OWNER TO postgres;

--
-- Name: Panel3D; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Panel3D" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "panelHeight" double precision NOT NULL,
    "panelWidth" double precision NOT NULL,
    "panelArea" double precision,
    "rodDiameter" double precision NOT NULL,
    "cellWidth" double precision NOT NULL,
    "cellHeight" double precision NOT NULL,
    "purchasePricePerUnit" double precision,
    "retailPricePerUnit" double precision NOT NULL,
    image text,
    active boolean DEFAULT true NOT NULL,
    "validFrom" timestamp(3) without time zone,
    "validUntil" timestamp(3) without time zone,
    priority integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Panel3D" OWNER TO postgres;

--
-- Name: PicketType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PicketType" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "metalThickness" double precision NOT NULL,
    width integer NOT NULL,
    length integer NOT NULL,
    coating text NOT NULL,
    color text,
    "purchasePricePerMeter" double precision,
    "retailPricePerMeter" double precision NOT NULL,
    "validFrom" timestamp(3) without time zone,
    "validUntil" timestamp(3) without time zone,
    active boolean DEFAULT true NOT NULL,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    priority integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."PicketType" OWNER TO postgres;

--
-- Name: PortfolioItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PortfolioItem" (
    id text NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    type text,
    description text,
    images jsonb NOT NULL,
    cost double precision,
    "showCost" boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PortfolioItem" OWNER TO postgres;

--
-- Name: PostType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PostType" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "sectionWidth" double precision NOT NULL,
    "sectionHeight" double precision NOT NULL,
    "wallThickness" double precision NOT NULL,
    "pricePerMeter" double precision NOT NULL,
    image text,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expirationDate" timestamp(3) without time zone,
    "validFrom" timestamp(3) without time zone,
    length double precision NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "retailPricePerUnit" double precision NOT NULL,
    "purchasePricePerUnit" double precision
);


ALTER TABLE public."PostType" OWNER TO postgres;

--
-- Name: PriceHistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PriceHistory" (
    id text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "fieldName" text NOT NULL,
    "oldValue" text NOT NULL,
    "newValue" text NOT NULL,
    "changedBy" text NOT NULL,
    "changedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PriceHistory" OWNER TO postgres;

--
-- Name: ProfnastilType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProfnastilType" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "metalThickness" double precision NOT NULL,
    "fullWidth" integer NOT NULL,
    "usefulWidth" integer NOT NULL,
    length integer NOT NULL,
    coating text NOT NULL,
    color text,
    "purchasePricePerUnit" double precision,
    "retailPricePerUnit" double precision NOT NULL,
    "validFrom" timestamp(3) without time zone,
    "validUntil" timestamp(3) without time zone,
    active boolean DEFAULT true NOT NULL,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "purchasePricePerLinearMeter" double precision
);


ALTER TABLE public."ProfnastilType" OWNER TO postgres;

--
-- Name: RateLimitConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RateLimitConfig" (
    id text DEFAULT 'auth'::text NOT NULL,
    "maxAttempts" integer DEFAULT 5 NOT NULL,
    "windowMs" integer DEFAULT 900000 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RateLimitConfig" OWNER TO postgres;

--
-- Name: ReferenceChangeLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ReferenceChangeLog" (
    id text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "fieldName" text NOT NULL,
    "oldValue" jsonb,
    "newValue" jsonb,
    "changedBy" text NOT NULL,
    "changedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ReferenceChangeLog" OWNER TO postgres;

--
-- Name: Review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Review" (
    id text NOT NULL,
    name text NOT NULL,
    text text NOT NULL,
    rating integer NOT NULL,
    image text,
    active boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Review" OWNER TO postgres;

--
-- Name: Setting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Setting" (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Setting" OWNER TO postgres;

--
-- Name: SoilType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SoilType" (
    id text NOT NULL,
    name text NOT NULL,
    "surchargeCoef" double precision NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SoilType" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    password text NOT NULL,
    role public."Role" DEFAULT 'MANAGER'::public."Role" NOT NULL,
    phone text,
    active boolean DEFAULT true NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserNotificationSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserNotificationSettings" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "emailNotifications" boolean DEFAULT true NOT NULL,
    "telegramNotifications" boolean DEFAULT false NOT NULL,
    "telegramChatId" text,
    "notifyNewOrder" boolean DEFAULT true NOT NULL,
    "notifyStatusChange" boolean DEFAULT true NOT NULL,
    "notifyAssignment" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserNotificationSettings" OWNER TO postgres;

--
-- Name: WicketType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WicketType" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "metalThickness" double precision NOT NULL,
    "sectionWidth" double precision NOT NULL,
    "sectionHeight" double precision NOT NULL,
    "wicketHeight" double precision NOT NULL,
    "wicketLength" double precision NOT NULL,
    "retailPrice" double precision NOT NULL,
    "purchasePrice" double precision,
    image text,
    active boolean DEFAULT true NOT NULL,
    "validFrom" timestamp(3) without time zone,
    "expirationDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    priority integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."WicketType" OWNER TO postgres;

--
-- Name: Work; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Work" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    unit text NOT NULL,
    price double precision NOT NULL,
    "useInCalculator" boolean DEFAULT false NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Work" OWNER TO postgres;

--
-- Name: WorkPrice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WorkPrice" (
    id text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    "pricePerUnit" double precision NOT NULL,
    unit text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkPrice" OWNER TO postgres;

--
-- Name: WorkRelation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WorkRelation" (
    id text NOT NULL,
    "workId" text NOT NULL,
    "fenceType" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "referenceId" text,
    "referenceType" text
);


ALTER TABLE public."WorkRelation" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    "entityType" text,
    "entityId" text,
    "oldValues" jsonb,
    "newValues" jsonb,
    details jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Data for Name: CanopyMaterial; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CanopyMaterial" (id, name, category, unit, "basePrice", thickness, color, image, active, "sortOrder", "createdAt", "updatedAt") FROM stdin;
cmmi7hmeb00074honcit0v9gk	Поликарбонат сотовый 8мм	POLYCARBONATE	м²	800	8	\N	\N	t	1	2026-03-08 20:29:52.164	2026-03-08 20:29:52.164
cmmi7hmeb00084honqsziz128	Поликарбонат сотовый 10мм	POLYCARBONATE	м²	950	10	\N	\N	t	2	2026-03-08 20:29:52.164	2026-03-08 20:29:52.164
cmmi7hmeb00094hon2z9p0ebs	Профиль 60x60	PROFILE	м.п.	450	\N	\N	\N	t	3	2026-03-08 20:29:52.164	2026-03-08 20:29:52.164
cmmi7hmeb000a4hont4qj29pp	Профиль 40x20	PROFILE	м.п.	280	\N	\N	\N	t	4	2026-03-08 20:29:52.164	2026-03-08 20:29:52.164
\.


--
-- Data for Name: CanopyType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CanopyType" (id, name, description, image, "areaCoef", "materialCoef", active, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ContactInfo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ContactInfo" (id, address, phone, email, "workHoursMonFri", "workHoursSat", "workHoursSun", "updatedAt", "createdAt") FROM stdin;
cmmpbnuxu0000n42q35vp8sp8	Московская область, р-н. Раменский	+74993901595	zabori-naves@yandex.ru	9:00 - 20:00	9:00 - 20:00	10:00 - 20:00	2026-03-25 17:32:55.092	2026-03-13 20:01:04.866
\.


--
-- Data for Name: FenceEstimate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FenceEstimate" (id, "fenceTypeId", length, height, "lagRows", "postsTotal", "lagsTotal", "profnastilTotal", "installationTotal", "materialsTotal", "grandTotal", items, "userId", "sessionId", "userAgent", "ipAddress", "createdAt", "mountingHardwareTotal", coating, "gateInstallationTotal", "gateLength", "gateNomenclatureId", "gateNomenclatureName", "gateTotal", "gateType", "hasGate", "hasWicket", "wicketInstallationTotal", "wicketNomenclatureId", "wicketNomenclatureName", "wicketTotal", "wicketWidth", city, "panel3dId", "panel3dInstallationTotal", "panel3dNomenclatureName", "panel3dTotal") FROM stdin;
cmn29bjsy005oxwznjrmwyifd	cmmkiyxl8000013wt4bqymhn8	245	2	2	106000	86320	299000	324500	546350	870850	[{"unit": "шт", "category": "posts", "quantity": 100, "totalPrice": 106000, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 166, "totalPrice": 86320, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 230, "totalPrice": 299000, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) 4м."}, {"unit": "шт", "category": "wickets", "quantity": 1, "totalPrice": 4200, "pricePerUnit": 4200, "nomenclatureId": "cmmkxk7ka0000zs6bbdoa5fi2", "nomenclatureName": "Калитка в покраске (Комплект) 2м"}, {"unit": "м.п.", "category": "installation", "quantity": 250, "totalPrice": 300000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 3000, "pricePerUnit": 3000, "nomenclatureId": "cmmqi3tx80000tf9kn1uka5dz", "nomenclatureName": "Монтаж калитки"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1500, "pricePerUnit": 1500, "nomenclatureId": "cmmqi66b30004tf9k0fycszns", "nomenclatureName": "Монтаж врезного замка"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 166, "totalPrice": 830, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	6cf43f16-faf7-489e-a8b4-9639d67dea00	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	79.174.33.179	2026-03-22 21:16:31.618	830	POLYMER_SINGLE	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) 4м.	50000	SLIDING	t	t	4500	cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) 2м	4200	1000	Moscow, Moscow	\N	0	\N	0
cmn2henp6005qxwznjj1j2ck7	cmmkiyxl8000013wt4bqymhn8	35	2	2	16960	13520	50700	72500	135510	208010	[{"unit": "шт", "category": "posts", "quantity": 16, "totalPrice": 16960, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 26, "totalPrice": 13520, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 39, "totalPrice": 50700, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) 4м."}, {"unit": "шт", "category": "wickets", "quantity": 1, "totalPrice": 4200, "pricePerUnit": 4200, "nomenclatureId": "cmmkxk7ka0000zs6bbdoa5fi2", "nomenclatureName": "Калитка в покраске (Комплект) 2м"}, {"unit": "м.п.", "category": "installation", "quantity": 40, "totalPrice": 48000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 3000, "pricePerUnit": 3000, "nomenclatureId": "cmmqi3tx80000tf9kn1uka5dz", "nomenclatureName": "Монтаж калитки"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1500, "pricePerUnit": 1500, "nomenclatureId": "cmmqi66b30004tf9k0fycszns", "nomenclatureName": "Монтаж врезного замка"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 26, "totalPrice": 130, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	c9998fbf-a98f-4bb6-9740-a7fb30477d9c	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	185.34.241.31	2026-03-23 01:02:53.562	130	POLYMER_SINGLE	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) 4м.	50000	SLIDING	t	t	4500	cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) 2м	4200	1000	Ramenskoye, Moscow Oblast	\N	0	\N	0
cmn2vg9am00dqxwzn9zz52o0b	cmmkiyxl8000013wt4bqymhn8	35	2	2	16960	13520	54600	72500	140930	213430	[{"unit": "шт", "category": "posts", "quantity": 16, "totalPrice": 16960, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 26, "totalPrice": 13520, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (двустороннее)", "category": "profnastil", "quantity": 39, "totalPrice": 54600, "pricePerUnit": 1400, "nomenclatureId": "cmmkg8een0002yh663iksgtjf", "nomenclatureName": "С 8-1150  лист двусторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "шт", "category": "wickets", "quantity": 1, "totalPrice": 4200, "pricePerUnit": 4200, "nomenclatureId": "cmmkxk7ka0000zs6bbdoa5fi2", "nomenclatureName": "Калитка в покраске (Комплект) L-2м. h-1м."}, {"unit": "м.п.", "category": "installation", "quantity": 40, "totalPrice": 48000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 3000, "pricePerUnit": 3000, "nomenclatureId": "cmmqi3tx80000tf9kn1uka5dz", "nomenclatureName": "Монтаж калитки"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1500, "pricePerUnit": 1500, "nomenclatureId": "cmmqi66b30004tf9k0fycszns", "nomenclatureName": "Монтаж врезного замка"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 4, "totalPrice": 1200, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 16, "totalPrice": 320, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 26, "totalPrice": 130, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	cb6b323d-f635-40fb-b1b7-07622e95a540	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	185.34.241.31	2026-03-23 07:36:02.83	1650	POLYMER_DOUBLE	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	t	4500	cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) L-2м. h-1м.	4200	1000	Ramenskoye, Moscow Oblast	\N	0	\N	0
cmn2vufqv00dsxwznzowubff5	cmmkiyxl8000013wt4bqymhn8	50	1.8	2	22000	18720	67200	60000	110340	170340	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 22000, "pricePerUnit": 1000, "nomenclatureId": "cmn282gcm000zxwznuish3n0a", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 2,8м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (двустороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 67200, "pricePerUnit": 1400, "nomenclatureId": "cmmkg8een0002yh663iksgtjf", "nomenclatureName": "С 8-1150  лист двусторонний 0,4 мм 2м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 22, "totalPrice": 440, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 36, "totalPrice": 180, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	cb6b323d-f635-40fb-b1b7-07622e95a540	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	185.34.241.31	2026-03-23 07:47:04.375	2420	POLYMER_DOUBLE	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Ramenskoye, Moscow Oblast	\N	0	\N	0
cmn2wqamn00duxwznz1b5wgwe	cmmkiyxl8000013wt4bqymhn8	116	1.8	2	49000	41600	140400	139200	236280	375480	[{"unit": "шт", "category": "posts", "quantity": 49, "totalPrice": 49000, "pricePerUnit": 1000, "nomenclatureId": "cmn282gcm000zxwznuish3n0a", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 2,8м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 80, "totalPrice": 41600, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 108, "totalPrice": 140400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "м.п.", "category": "installation", "quantity": 116, "totalPrice": 139200, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 13, "totalPrice": 3900, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 49, "totalPrice": 980, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 80, "totalPrice": 400, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	cb6b323d-f635-40fb-b1b7-07622e95a540	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	185.34.241.31	2026-03-23 08:11:50.736	5280	POLYMER_SINGLE	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Ramenskoye, Moscow Oblast	\N	0	\N	0
estimate-1774384972594-clmkvneor	cmmkk7wg5000j13wtie0o6rcw	50	2	2	24200	18720	0	60000	84920	144920	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 24200, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 20, "panelWidth": 2500, "totalPrice": 42000, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}]	\N	0bbf56fb-3975-43b3-be3a-e14522a636ae	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-24 20:42:52.597	0	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	42000
cmn2ysyma00dwxwzn902l7054	cmmkiyxl8000013wt4bqymhn8	35	1.8	2	16000	13520	50700	52500	99770	152270	[{"unit": "шт", "category": "posts", "quantity": 16, "totalPrice": 16000, "pricePerUnit": 1000, "nomenclatureId": "cmn282gcm000zxwznuish3n0a", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 2,8м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 26, "totalPrice": 13520, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 39, "totalPrice": 50700, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 13700, "pricePerUnit": 13700, "nomenclatureId": "cmn2smaue007mxwznsghp78yp", "nomenclatureName": "Ворота распашные (комплект) L-4м. - h-1,8м"}, {"unit": "шт", "category": "wickets", "quantity": 1, "totalPrice": 4200, "pricePerUnit": 4200, "nomenclatureId": "cmmkxk7ka0000zs6bbdoa5fi2", "nomenclatureName": "Калитка в покраске (Комплект) L-2м. h-1м."}, {"unit": "м.п.", "category": "installation", "quantity": 40, "totalPrice": 48000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 3000, "pricePerUnit": 3000, "nomenclatureId": "cmmqi3tx80000tf9kn1uka5dz", "nomenclatureName": "Монтаж калитки"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1500, "pricePerUnit": 1500, "nomenclatureId": "cmmqi66b30004tf9k0fycszns", "nomenclatureName": "Монтаж врезного замка"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 4, "totalPrice": 1200, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 16, "totalPrice": 320, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 26, "totalPrice": 130, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	8ec3e381-59be-49d2-b4b8-4fcb4362264c	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	185.34.241.31	2026-03-23 09:09:54.37	1650	POLYMER_SINGLE	0	4000	cmn2smaue007mxwznsghp78yp	Ворота распашные (комплект) L-4м. - h-1,8м	13700	SWING	t	t	4500	cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) L-2м. h-1м.	4200	1000	Ramenskoye, Moscow Oblast	\N	0	\N	0
cmn2yv9e300dyxwznz9yicgqf	cmmkiyxl8000013wt4bqymhn8	35	2	2	16960	13520	50700	52500	100730	153230	[{"unit": "шт", "category": "posts", "quantity": 16, "totalPrice": 16960, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 26, "totalPrice": 13520, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 39, "totalPrice": 50700, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 13700, "pricePerUnit": 13700, "nomenclatureId": "cmn2smaue007mxwznsghp78yp", "nomenclatureName": "Ворота распашные (комплект) L-4м. - h-1,8м"}, {"unit": "шт", "category": "wickets", "quantity": 1, "totalPrice": 4200, "pricePerUnit": 4200, "nomenclatureId": "cmmkxk7ka0000zs6bbdoa5fi2", "nomenclatureName": "Калитка в покраске (Комплект) L-2м. h-1м."}, {"unit": "м.п.", "category": "installation", "quantity": 40, "totalPrice": 48000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 3000, "pricePerUnit": 3000, "nomenclatureId": "cmmqi3tx80000tf9kn1uka5dz", "nomenclatureName": "Монтаж калитки"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1500, "pricePerUnit": 1500, "nomenclatureId": "cmmqi66b30004tf9k0fycszns", "nomenclatureName": "Монтаж врезного замка"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 4, "totalPrice": 1200, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 16, "totalPrice": 320, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 26, "totalPrice": 130, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	8ec3e381-59be-49d2-b4b8-4fcb4362264c	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	185.34.241.31	2026-03-23 09:11:41.644	1650	POLYMER_SINGLE	0	4000	cmn2smaue007mxwznsghp78yp	Ворота распашные (комплект) L-4м. - h-1,8м	13700	SWING	t	t	4500	cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) L-2м. h-1м.	4200	1000	Ramenskoye, Moscow Oblast	\N	0	\N	0
cmn338nwo00e0xwznzvagm0i9	cmmkiyxl8000013wt4bqymhn8	16	2	2	9540	7280	27300	44000	95270	139270	[{"unit": "шт", "category": "posts", "quantity": 9, "totalPrice": 9540, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 14, "totalPrice": 7280, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 21, "totalPrice": 27300, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "м.п.", "category": "installation", "quantity": 20, "totalPrice": 24000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 3, "totalPrice": 900, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 9, "totalPrice": 180, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 14, "totalPrice": 70, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	655df406-6f68-4b1e-8f1d-f35027895a5e	Mozilla/5.0 (Linux; arm_64; Android 13; 2201116SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.65 YaSearchBrowser/25.67.1 BroPP/1.0 YaSearchApp/25.67.1 webOmni SA/3 Mobile Safari/537.36	31.173.82.17	2026-03-23 11:14:05.448	1150	POLYMER_SINGLE	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	f	0	\N	\N	0	\N	Moscow, Moscow	\N	0	\N	0
estimate-1774367239270-pmg43suo7	cmmkiyxl8000013wt4bqymhn8	50	2	2	24200	18720	62400	60000	107740	167740	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 24200, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 62400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 22, "totalPrice": 440, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 36, "totalPrice": 180, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	2c713e8a-570b-4149-8ec0-429af7f6aec6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-24 15:47:19.271	2420	POLYMER_SINGLE	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774367244703-lx3amujvx	cmmkiyxl8000013wt4bqymhn8	46	2	2	23100	17680	62400	60000	119270	179270	[{"unit": "шт", "category": "posts", "quantity": 21, "totalPrice": 23100, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 34, "totalPrice": 17680, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 62400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 13700, "pricePerUnit": 13700, "nomenclatureId": "cmn2smaue007mxwznsghp78yp", "nomenclatureName": "Ворота распашные (комплект) L-4м. - h-1,8м"}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 21, "totalPrice": 420, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 34, "totalPrice": 170, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	2c713e8a-570b-4149-8ec0-429af7f6aec6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-24 15:47:24.705	2390	POLYMER_SINGLE	0	4000	cmn2smaue007mxwznsghp78yp	Ворота распашные (комплект) L-4м. - h-1,8м	13700	SWING	t	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774367249087-3xwb1ymq1	cmmkiyxl8000013wt4bqymhn8	45	2	2	22000	16640	62400	64500	121000	185500	[{"unit": "шт", "category": "posts", "quantity": 20, "totalPrice": 22000, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 32, "totalPrice": 16640, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 62400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 13700, "pricePerUnit": 13700, "nomenclatureId": "cmn2smaue007mxwznsghp78yp", "nomenclatureName": "Ворота распашные (комплект) L-4м. - h-1,8м"}, {"unit": "шт", "category": "wickets", "quantity": 1, "totalPrice": 4200, "pricePerUnit": 4200, "nomenclatureId": "cmmkxk7ka0000zs6bbdoa5fi2", "nomenclatureName": "Калитка в покраске (Комплект) L-2м. h-1м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 3000, "pricePerUnit": 3000, "nomenclatureId": "cmmqi3tx80000tf9kn1uka5dz", "nomenclatureName": "Монтаж калитки"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1500, "pricePerUnit": 1500, "nomenclatureId": "cmmqi66b30004tf9k0fycszns", "nomenclatureName": "Монтаж врезного замка"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 5, "totalPrice": 1500, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 20, "totalPrice": 400, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 32, "totalPrice": 160, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	2c713e8a-570b-4149-8ec0-429af7f6aec6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-24 15:47:29.089	2060	POLYMER_SINGLE	0	4000	cmn2smaue007mxwznsghp78yp	Ворота распашные (комплект) L-4м. - h-1,8м	13700	SWING	t	t	4500	cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) L-2м. h-1м.	4200	1000	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774367259780-u8hebvskx	cmmkiyxl8000013wt4bqymhn8	95	2	2	44000	34320	120900	124500	221250	345750	[{"unit": "шт", "category": "posts", "quantity": 40, "totalPrice": 44000, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 66, "totalPrice": 34320, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 93, "totalPrice": 120900, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 13700, "pricePerUnit": 13700, "nomenclatureId": "cmn2smaue007mxwznsghp78yp", "nomenclatureName": "Ворота распашные (комплект) L-4м. - h-1,8м"}, {"unit": "шт", "category": "wickets", "quantity": 1, "totalPrice": 4200, "pricePerUnit": 4200, "nomenclatureId": "cmmkxk7ka0000zs6bbdoa5fi2", "nomenclatureName": "Калитка в покраске (Комплект) L-2м. h-1м."}, {"unit": "м.п.", "category": "installation", "quantity": 100, "totalPrice": 120000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 3000, "pricePerUnit": 3000, "nomenclatureId": "cmmqi3tx80000tf9kn1uka5dz", "nomenclatureName": "Монтаж калитки"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1500, "pricePerUnit": 1500, "nomenclatureId": "cmmqi66b30004tf9k0fycszns", "nomenclatureName": "Монтаж врезного замка"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 10, "totalPrice": 3000, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 40, "totalPrice": 800, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 66, "totalPrice": 330, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	2c713e8a-570b-4149-8ec0-429af7f6aec6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-24 15:47:39.781	4130	POLYMER_SINGLE	0	4000	cmn2smaue007mxwznsghp78yp	Ворота распашные (комплект) L-4м. - h-1,8м	13700	SWING	t	t	4500	cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) L-2м. h-1м.	4200	1000	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774384896115-0zyfnf99f	cmmkiyxl8000013wt4bqymhn8	50	2	2	23320	18720	62400	60000	108780	168780	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 23320, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 62400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 22, "totalPrice": 440, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 36, "totalPrice": 180, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	0bbf56fb-3975-43b3-be3a-e14522a636ae	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-24 20:41:36.116	4340	POLYMER_SINGLE	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774384916594-srsyz7ydz	cmmkiyxl8000013wt4bqymhn8	46	2	2	22260	17680	62400	80000	156650	236650	[{"unit": "шт", "category": "posts", "quantity": 21, "totalPrice": 22260, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 34, "totalPrice": 17680, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 62400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 21, "totalPrice": 420, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 34, "totalPrice": 170, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	0bbf56fb-3975-43b3-be3a-e14522a636ae	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-24 20:41:56.596	4310	POLYMER_SINGLE	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774384925335-exofgsgyd	cmmkiyxl8000013wt4bqymhn8	46	2.5	2	25200	17680	75600	80000	172790	252790	[{"unit": "шт", "category": "posts", "quantity": 21, "totalPrice": 25200, "pricePerUnit": 1200, "nomenclatureId": "cmn284txx0015xwznvdusxmqc", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,5м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 34, "totalPrice": 17680, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 75600, "pricePerUnit": 1575, "nomenclatureId": "cmn2t9pmn00cbxwzntr63c16o", "nomenclatureName": "С 8-1150 лист односторонний 0,4 мм 2,5м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 21, "totalPrice": 420, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 34, "totalPrice": 170, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	0bbf56fb-3975-43b3-be3a-e14522a636ae	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-24 20:42:05.337	4310	POLYMER_SINGLE	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774384995192-bgil9icep	cmmkk7wg5000j13wtie0o6rcw	46	2	2	23100	17680	0	80000	130680	210680	[{"unit": "шт", "category": "posts", "quantity": 21, "totalPrice": 23100, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 34, "totalPrice": 17680, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 19, "panelWidth": 2500, "totalPrice": 39900, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}]	\N	0bbf56fb-3975-43b3-be3a-e14522a636ae	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-24 20:43:15.193	0	GALVANIZED	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	39900
estimate-1774385000896-vtmuznse9	cmmkk7wg5000j13wtie0o6rcw	45	2	2	22000	16640	0	84500	130640	215140	[{"unit": "шт", "category": "posts", "quantity": 20, "totalPrice": 22000, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 32, "totalPrice": 16640, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 18, "panelWidth": 2500, "totalPrice": 37800, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "шт", "category": "wickets", "quantity": 1, "totalPrice": 4200, "pricePerUnit": 4200, "nomenclatureId": "cmmkxk7ka0000zs6bbdoa5fi2", "nomenclatureName": "Калитка в покраске (Комплект) L-2м. h-1м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 3000, "pricePerUnit": 3000, "nomenclatureId": "cmmqi3tx80000tf9kn1uka5dz", "nomenclatureName": "Монтаж калитки"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1500, "pricePerUnit": 1500, "nomenclatureId": "cmmqi66b30004tf9k0fycszns", "nomenclatureName": "Монтаж врезного замка"}]	\N	0bbf56fb-3975-43b3-be3a-e14522a636ae	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-24 20:43:20.899	0	GALVANIZED	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	t	4500	cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) L-2м. h-1м.	4200	1000	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	37800
estimate-1774412839341-64lbwfnpa	cmmkiyxl8000013wt4bqymhn8	50	2	2	23320	18720	62400	60000	108780	168780	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 23320, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 62400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 22, "totalPrice": 440, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 36, "totalPrice": 180, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	ea7a9978-fb0e-4428-86af-83eb498d99a8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 04:27:19.342	4340	POLYMER_SINGLE	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774412910729-sat5f8339	cmmkk7wg5000j13wtie0o6rcw	50	2	2	24200	18720	0	60000	84920	144920	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 24200, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 20, "panelWidth": 2500, "totalPrice": 42000, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}]	\N	ea7a9978-fb0e-4428-86af-83eb498d99a8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 04:28:30.73	0	POLYMER_SINGLE	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	42000
estimate-1774385016929-rh9tjaiz1	cmmkk7wg5000j13wtie0o6rcw	45	1.7	2	21200	16640	0	84500	129840	214340	[{"unit": "шт", "category": "posts", "quantity": 20, "totalPrice": 21200, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 32, "totalPrice": 16640, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 18, "panelWidth": 2500, "totalPrice": 37800, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "шт", "category": "wickets", "quantity": 1, "totalPrice": 4200, "pricePerUnit": 4200, "nomenclatureId": "cmmkxk7ka0000zs6bbdoa5fi2", "nomenclatureName": "Калитка в покраске (Комплект) L-2м. h-1м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 3000, "pricePerUnit": 3000, "nomenclatureId": "cmmqi3tx80000tf9kn1uka5dz", "nomenclatureName": "Монтаж калитки"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1500, "pricePerUnit": 1500, "nomenclatureId": "cmmqi66b30004tf9k0fycszns", "nomenclatureName": "Монтаж врезного замка"}]	\N	0bbf56fb-3975-43b3-be3a-e14522a636ae	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-24 20:43:36.93	0	GALVANIZED	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	t	4500	cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) L-2м. h-1м.	4200	1000	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	37800
estimate-1774385031593-czwiufwv5	cmmkk7wg5000j13wtie0o6rcw	45	1.6	2	20000	16640	0	84500	128640	213140	[{"unit": "шт", "category": "posts", "quantity": 20, "totalPrice": 20000, "pricePerUnit": 1000, "nomenclatureId": "cmn282gcm000zxwznuish3n0a", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 2,8м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 32, "totalPrice": 16640, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 18, "panelWidth": 2500, "totalPrice": 37800, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "шт", "category": "wickets", "quantity": 1, "totalPrice": 4200, "pricePerUnit": 4200, "nomenclatureId": "cmmkxk7ka0000zs6bbdoa5fi2", "nomenclatureName": "Калитка в покраске (Комплект) L-2м. h-1м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 3000, "pricePerUnit": 3000, "nomenclatureId": "cmmqi3tx80000tf9kn1uka5dz", "nomenclatureName": "Монтаж калитки"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1500, "pricePerUnit": 1500, "nomenclatureId": "cmmqi66b30004tf9k0fycszns", "nomenclatureName": "Монтаж врезного замка"}]	\N	0bbf56fb-3975-43b3-be3a-e14522a636ae	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-24 20:43:51.595	0	GALVANIZED	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	t	4500	cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) L-2м. h-1м.	4200	1000	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	37800
estimate-1774385043038-g85b8zpmc	cmmkk7wg5000j13wtie0o6rcw	45	1.5	2	20000	16640	0	84500	128640	213140	[{"unit": "шт", "category": "posts", "quantity": 20, "totalPrice": 20000, "pricePerUnit": 1000, "nomenclatureId": "cmn282gcm000zxwznuish3n0a", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 2,8м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 32, "totalPrice": 16640, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 18, "panelWidth": 2500, "totalPrice": 37800, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "шт", "category": "wickets", "quantity": 1, "totalPrice": 4200, "pricePerUnit": 4200, "nomenclatureId": "cmmkxk7ka0000zs6bbdoa5fi2", "nomenclatureName": "Калитка в покраске (Комплект) L-2м. h-1м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 3000, "pricePerUnit": 3000, "nomenclatureId": "cmmqi3tx80000tf9kn1uka5dz", "nomenclatureName": "Монтаж калитки"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1500, "pricePerUnit": 1500, "nomenclatureId": "cmmqi66b30004tf9k0fycszns", "nomenclatureName": "Монтаж врезного замка"}]	\N	0bbf56fb-3975-43b3-be3a-e14522a636ae	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-24 20:44:03.04	0	GALVANIZED	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	t	4500	cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) L-2м. h-1м.	4200	1000	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	37800
estimate-1774385051431-43bx73oiu	cmmkk7wg5000j13wtie0o6rcw	45	2	2	22000	16640	0	84500	130640	215140	[{"unit": "шт", "category": "posts", "quantity": 20, "totalPrice": 22000, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 32, "totalPrice": 16640, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 18, "panelWidth": 2500, "totalPrice": 37800, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "шт", "category": "wickets", "quantity": 1, "totalPrice": 4200, "pricePerUnit": 4200, "nomenclatureId": "cmmkxk7ka0000zs6bbdoa5fi2", "nomenclatureName": "Калитка в покраске (Комплект) L-2м. h-1м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 3000, "pricePerUnit": 3000, "nomenclatureId": "cmmqi3tx80000tf9kn1uka5dz", "nomenclatureName": "Монтаж калитки"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1500, "pricePerUnit": 1500, "nomenclatureId": "cmmqi66b30004tf9k0fycszns", "nomenclatureName": "Монтаж врезного замка"}]	\N	0bbf56fb-3975-43b3-be3a-e14522a636ae	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-24 20:44:11.433	0	GALVANIZED	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	t	4500	cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) L-2м. h-1м.	4200	1000	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	37800
estimate-1774412924035-uqw57xvkg	cmmkk7wg5000j13wtie0o6rcw	50	1.7	2	23320	18720	0	60000	84040	144040	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 23320, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 20, "panelWidth": 2500, "totalPrice": 42000, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}]	\N	ea7a9978-fb0e-4428-86af-83eb498d99a8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 04:28:44.036	0	POLYMER_SINGLE	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	42000
estimate-1774412930164-ojvciym3r	cmmkk7wg5000j13wtie0o6rcw	50	1.7	2	23320	18720	0	60000	84040	144040	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 23320, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 20, "panelWidth": 2500, "totalPrice": 42000, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}]	\N	ea7a9978-fb0e-4428-86af-83eb498d99a8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 04:28:50.165	0	POLYMER_SINGLE	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	42000
estimate-1774426142090-toe3phb69	cmmkk7wg5000j13wtie0o6rcw	50	2	2	24200	18720	0	60000	84920	144920	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 24200, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 20, "panelWidth": 2500, "totalPrice": 42000, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}]	\N	7a558be2-e2b4-4599-8459-a7bffa25ab2b	Mozilla/5.0 (Linux; Android 16; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.7680.119 Mobile Safari/537.36	213.182.200.40	2026-03-25 08:09:02.091	0	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	42000
estimate-1774426188771-ktrlujh9n	cmmkiyxl8000013wt4bqymhn8	50	2	2	23320	18720	62400	60000	108780	168780	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 23320, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 62400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 22, "totalPrice": 440, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 36, "totalPrice": 180, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	7a558be2-e2b4-4599-8459-a7bffa25ab2b	Mozilla/5.0 (Linux; Android 16; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.7680.119 Mobile Safari/537.36	213.182.200.40	2026-03-25 08:09:48.773	4340	POLYMER_SINGLE	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774437446846-zirc58fhy	cmmkiyxl8000013wt4bqymhn8	50	2	2	23320	18720	62400	60000	108780	168780	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 23320, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 62400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": null, "nomenclatureName": "Монтаж забора"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 22, "totalPrice": 440, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 36, "totalPrice": 180, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	df149d9c-543c-4750-a3a7-0f851d7cd30a	Mozilla/5.0 (Linux; Android 16; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.7680.119 Mobile Safari/537.36	213.182.200.40	2026-03-25 11:17:26.847	4340	POLYMER_SINGLE	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774449411427-r0j4qwzdk	cmmkiyxl8000013wt4bqymhn8	50	2	2	23320	18720	62400	0	108780	108780	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 23320, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 62400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 22, "totalPrice": 440, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 36, "totalPrice": 180, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	3b00576d-c964-4341-88ca-b32a876f537b	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 14:36:51.429	4340	POLYMER_SINGLE	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774456324312-ec1jdlyyj	cmmkiyxl8000013wt4bqymhn8	50	2	2	23320	18720	62400	60000	108780	168780	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 23320, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 62400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 22, "totalPrice": 440, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 36, "totalPrice": 180, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	22b65b61-d72b-481e-93f0-4c7ee6a53b7f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 16:32:04.313	4340	POLYMER_SINGLE	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774456364551-tzdo1q78j	cmmkk7wg5000j13wtie0o6rcw	50	2	2	24200	18720	0	55000	84920	139920	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 24200, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 20, "panelWidth": 2500, "totalPrice": 42000, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 55000, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}]	\N	22b65b61-d72b-481e-93f0-4c7ee6a53b7f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 16:32:44.552	0	POLYMER_SINGLE	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	42000
estimate-1774460955448-sh4pbplzj	cmmkk7wg5000j13wtie0o6rcw	50	2	2	24200	18720	0	55000	92120	147120	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 24200, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 20, "panelWidth": 2500, "totalPrice": 42000, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 55000, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 120, "totalPrice": 7200, "pricePerUnit": 60, "nomenclatureId": "cmn6c74se00007l4rpxh3oxq4", "nomenclatureName": "Крепление 3D-панели", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 17:49:15.45	7200	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	42000
estimate-1774460966721-mwfg7v2wu	cmmkk7wg5000j13wtie0o6rcw	100	2	2	46200	36400	0	110000	181000	291000	[{"unit": "шт", "category": "posts", "quantity": 42, "totalPrice": 46200, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 70, "totalPrice": 36400, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 40, "panelWidth": 2500, "totalPrice": 84000, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 100, "totalPrice": 110000, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 240, "totalPrice": 14400, "pricePerUnit": 60, "nomenclatureId": "cmn6c74se00007l4rpxh3oxq4", "nomenclatureName": "Крепление 3D-панели", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 17:49:26.722	14400	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	84000
estimate-1774460981262-068st60uf	cmmkk7wg5000j13wtie0o6rcw	100	1.7	2	44520	36400	0	110000	179320	289320	[{"unit": "шт", "category": "posts", "quantity": 42, "totalPrice": 44520, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 70, "totalPrice": 36400, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 40, "panelWidth": 2500, "totalPrice": 84000, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 100, "totalPrice": 110000, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 240, "totalPrice": 14400, "pricePerUnit": 60, "nomenclatureId": "cmn6c74se00007l4rpxh3oxq4", "nomenclatureName": "Крепление 3D-панели", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 17:49:41.263	14400	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	84000
estimate-1774460987007-bnrq6f42j	cmmkk7wg5000j13wtie0o6rcw	100	1.5	2	42000	36400	0	110000	176800	286800	[{"unit": "шт", "category": "posts", "quantity": 42, "totalPrice": 42000, "pricePerUnit": 1000, "nomenclatureId": "cmn282gcm000zxwznuish3n0a", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 2,8м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 70, "totalPrice": 36400, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 40, "panelWidth": 2500, "totalPrice": 84000, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 100, "totalPrice": 110000, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 240, "totalPrice": 14400, "pricePerUnit": 60, "nomenclatureId": "cmn6c74se00007l4rpxh3oxq4", "nomenclatureName": "Крепление 3D-панели", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 17:49:47.008	14400	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	84000
estimate-1774460992439-ofxx197bz	cmmkk7wg5000j13wtie0o6rcw	100	1.8	2	44520	36400	0	110000	179320	289320	[{"unit": "шт", "category": "posts", "quantity": 42, "totalPrice": 44520, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 70, "totalPrice": 36400, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 40, "panelWidth": 2500, "totalPrice": 84000, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 100, "totalPrice": 110000, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 240, "totalPrice": 14400, "pricePerUnit": 60, "nomenclatureId": "cmn6c74se00007l4rpxh3oxq4", "nomenclatureName": "Крепление 3D-панели", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 17:49:52.44	14400	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	84000
estimate-1774461218321-9w4h3nzko	cmmkk7wg5000j13wtie0o6rcw	50	2	2	24200	18720	0	55000	92120	147120	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 24200, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 20, "panelWidth": 2500, "totalPrice": 42000, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 55000, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 120, "totalPrice": 7200, "pricePerUnit": 60, "nomenclatureId": "cmn6c74se00007l4rpxh3oxq4", "nomenclatureName": "Крепление 3D-панели", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 17:53:38.323	7200	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	42000
estimate-1774461226602-ik821k4sn	cmmkk7wg5000j13wtie0o6rcw	46	2	2	23100	17680	0	56100	101220	157320	[{"unit": "шт", "category": "posts", "quantity": 21, "totalPrice": 23100, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 34, "totalPrice": 17680, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 19, "panelWidth": 2500, "totalPrice": 39900, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 13700, "pricePerUnit": 13700, "nomenclatureId": "cmn2smaue007mxwznsghp78yp", "nomenclatureName": "Ворота распашные (комплект) L-4м. - h-1,8м"}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 55000, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1100, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 114, "totalPrice": 6840, "pricePerUnit": 60, "nomenclatureId": "cmn6c74se00007l4rpxh3oxq4", "nomenclatureName": "Крепление 3D-панели", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 17:53:46.604	6840	GALVANIZED	1100	4000	cmn2smaue007mxwznsghp78yp	Ворота распашные (комплект) L-4м. - h-1,8м	13700	SWING	t	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	39900
estimate-1774461249506-83i4p27n4	cmmkk7wg5000j13wtie0o6rcw	46	2	2	23100	17680	0	75000	137520	212520	[{"unit": "шт", "category": "posts", "quantity": 21, "totalPrice": 23100, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 34, "totalPrice": 17680, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 19, "panelWidth": 2500, "totalPrice": 39900, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 55000, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 114, "totalPrice": 6840, "pricePerUnit": 60, "nomenclatureId": "cmn6c74se00007l4rpxh3oxq4", "nomenclatureName": "Крепление 3D-панели", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 17:54:09.507	6840	GALVANIZED	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	39900
estimate-1774461259240-rl618mzno	cmmkk7wg5000j13wtie0o6rcw	46	2	2	23100	17680	0	56100	101220	157320	[{"unit": "шт", "category": "posts", "quantity": 21, "totalPrice": 23100, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 34, "totalPrice": 17680, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 19, "panelWidth": 2500, "totalPrice": 39900, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 13700, "pricePerUnit": 13700, "nomenclatureId": "cmn2smaue007mxwznsghp78yp", "nomenclatureName": "Ворота распашные (комплект) L-4м. - h-1,8м"}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 55000, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1100, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 114, "totalPrice": 6840, "pricePerUnit": 60, "nomenclatureId": "cmn6c74se00007l4rpxh3oxq4", "nomenclatureName": "Крепление 3D-панели", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 17:54:19.241	6840	GALVANIZED	1100	4000	cmn2smaue007mxwznsghp78yp	Ворота распашные (комплект) L-4м. - h-1,8м	13700	SWING	t	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	39900
estimate-1774463590093-f6jz3ltwp	cmmkiyxl8000013wt4bqymhn8	50	2.5	2	26400	18720	69600	60000	117140	177140	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 26400, "pricePerUnit": 1200, "nomenclatureId": "cmn284txx0015xwznvdusxmqc", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,5м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Оцинковка", "category": "profnastil", "quantity": 48, "totalPrice": 69600, "pricePerUnit": 1450, "nomenclatureId": "cmn6drgys00227l4rcshby078", "nomenclatureName": "С 8-1150 лист оцинкованный 0,4 мм 2.5м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 22, "totalPrice": 440, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 36, "totalPrice": 180, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 18:33:10.094	2420	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774463602584-gxbnd1nch	cmmkiyxl8000013wt4bqymhn8	100	2.5	2	50400	36400	134850	120000	226140	346140	[{"unit": "шт", "category": "posts", "quantity": 42, "totalPrice": 50400, "pricePerUnit": 1200, "nomenclatureId": "cmn284txx0015xwznvdusxmqc", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,5м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 70, "totalPrice": 36400, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Оцинковка", "category": "profnastil", "quantity": 93, "totalPrice": 134850, "pricePerUnit": 1450, "nomenclatureId": "cmn6drgys00227l4rcshby078", "nomenclatureName": "С 8-1150 лист оцинкованный 0,4 мм 2.5м."}, {"unit": "м.п.", "category": "installation", "quantity": 100, "totalPrice": 120000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 11, "totalPrice": 3300, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 42, "totalPrice": 840, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 70, "totalPrice": 350, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 18:33:22.585	4490	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774461397713-br7hcmtsu	cmmkk7wg5000j13wtie0o6rcw	50	2	2	24200	18720	0	55000	92120	147120	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 24200, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 20, "panelWidth": 2500, "totalPrice": 42000, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 55000, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 120, "totalPrice": 7200, "pricePerUnit": 60, "nomenclatureId": "cmn6c74se00007l4rpxh3oxq4", "nomenclatureName": "Крепление 3D-панели", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 17:56:37.714	7200	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	42000
estimate-1774461782281-tuauzn2va	cmmkiyxl8000013wt4bqymhn8	46	2	2	22260	17680	62400	80000	120350	200350	[{"unit": "шт", "category": "posts", "quantity": 21, "totalPrice": 22260, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 34, "totalPrice": 17680, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 62400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 13700, "pricePerUnit": 13700, "nomenclatureId": "cmn2smaue007mxwznsghp78yp", "nomenclatureName": "Ворота распашные (комплект) L-4м. - h-1,8м"}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmn6cpe4s00137l4rcetdhr18", "nomenclatureName": "Монтаж распашных ворот"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 21, "totalPrice": 420, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 34, "totalPrice": 170, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 18:03:02.283	4310	POLYMER_SINGLE	20000	4000	cmn2smaue007mxwznsghp78yp	Ворота распашные (комплект) L-4м. - h-1,8м	13700	SWING	t	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774461814213-abm75wqgk	cmmkiyxl8000013wt4bqymhn8	46	2.2	2	23100	17680	69600	80000	128390	208390	[{"unit": "шт", "category": "posts", "quantity": 21, "totalPrice": 23100, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 34, "totalPrice": 17680, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 69600, "pricePerUnit": 1450, "nomenclatureId": "cmn28j5nk002vxwzn6949khz7", "nomenclatureName": "С 8-1150 лист односторонний 0,4 мм 2,2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 13700, "pricePerUnit": 13700, "nomenclatureId": "cmn2smaue007mxwznsghp78yp", "nomenclatureName": "Ворота распашные (комплект) L-4м. - h-1,8м"}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmn6cpe4s00137l4rcetdhr18", "nomenclatureName": "Монтаж распашных ворот"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 21, "totalPrice": 420, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 34, "totalPrice": 170, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 18:03:34.214	4310	POLYMER_SINGLE	20000	4000	cmn2smaue007mxwznsghp78yp	Ворота распашные (комплект) L-4м. - h-1,8м	13700	SWING	t	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774461822152-4jb8v6flu	cmmkiyxl8000013wt4bqymhn8	46	2.5	2	25200	17680	75600	80000	136490	216490	[{"unit": "шт", "category": "posts", "quantity": 21, "totalPrice": 25200, "pricePerUnit": 1200, "nomenclatureId": "cmn284txx0015xwznvdusxmqc", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,5м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 34, "totalPrice": 17680, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 75600, "pricePerUnit": 1575, "nomenclatureId": "cmn2t9pmn00cbxwzntr63c16o", "nomenclatureName": "С 8-1150 лист односторонний 0,4 мм 2,5м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 13700, "pricePerUnit": 13700, "nomenclatureId": "cmn2smaue007mxwznsghp78yp", "nomenclatureName": "Ворота распашные (комплект) L-4м. - h-1,8м"}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmn6cpe4s00137l4rcetdhr18", "nomenclatureName": "Монтаж распашных ворот"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 21, "totalPrice": 420, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 34, "totalPrice": 170, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 18:03:42.154	4310	POLYMER_SINGLE	20000	4000	cmn2smaue007mxwznsghp78yp	Ворота распашные (комплект) L-4м. - h-1,8м	13700	SWING	t	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774461835298-kcl8n4s6h	cmmkiyxl8000013wt4bqymhn8	46	2.5	2	25200	17680	75600	80000	172790	252790	[{"unit": "шт", "category": "posts", "quantity": 21, "totalPrice": 25200, "pricePerUnit": 1200, "nomenclatureId": "cmn284txx0015xwznvdusxmqc", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,5м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 34, "totalPrice": 17680, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 75600, "pricePerUnit": 1575, "nomenclatureId": "cmn2t9pmn00cbxwzntr63c16o", "nomenclatureName": "С 8-1150 лист односторонний 0,4 мм 2,5м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 21, "totalPrice": 420, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 34, "totalPrice": 170, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 18:03:55.299	4310	POLYMER_SINGLE	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774461900583-76kv9y3ox	cmmkiyxl8000013wt4bqymhn8	46	1.9	2	22260	17680	62400	80000	156650	236650	[{"unit": "шт", "category": "posts", "quantity": 21, "totalPrice": 22260, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 34, "totalPrice": 17680, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 62400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 21, "totalPrice": 420, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 34, "totalPrice": 170, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 18:05:00.584	4310	POLYMER_SINGLE	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774461906143-6a009gdpb	cmmkiyxl8000013wt4bqymhn8	46	1.6	2	21000	17680	62400	80000	155390	235390	[{"unit": "шт", "category": "posts", "quantity": 21, "totalPrice": 21000, "pricePerUnit": 1000, "nomenclatureId": "cmn282gcm000zxwznuish3n0a", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 2,8м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 34, "totalPrice": 17680, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 62400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 21, "totalPrice": 420, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 34, "totalPrice": 170, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 18:05:06.144	4310	POLYMER_SINGLE	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774463553920-m097kdaj1	cmmkiyxl8000013wt4bqymhn8	50	2	2	23320	18720	57600	60000	102060	162060	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 23320, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Оцинковка", "category": "profnastil", "quantity": 48, "totalPrice": 57600, "pricePerUnit": 1200, "nomenclatureId": "cmn6dn1yu001h7l4r0elsg00v", "nomenclatureName": "С 8-1150 лист оцинкованный 0,4 мм 2м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 22, "totalPrice": 440, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 36, "totalPrice": 180, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 18:32:33.922	2420	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774463566890-xll6d2jva	cmmkiyxl8000013wt4bqymhn8	50	2	2	23320	18720	62400	60000	108780	168780	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 23320, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 62400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 22, "totalPrice": 440, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 36, "totalPrice": 180, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 18:32:46.891	4340	POLYMER_SINGLE	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774463578555-eo1hvh5dn	cmmkiyxl8000013wt4bqymhn8	50	2.5	2	26400	18720	75600	60000	125060	185060	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 26400, "pricePerUnit": 1200, "nomenclatureId": "cmn284txx0015xwznvdusxmqc", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,5м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 75600, "pricePerUnit": 1575, "nomenclatureId": "cmn2t9pmn00cbxwzntr63c16o", "nomenclatureName": "С 8-1150 лист односторонний 0,4 мм 2,5м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 22, "totalPrice": 440, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 36, "totalPrice": 180, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	0a6dc55e-c3ee-45ea-9b12-8f812521cb3e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	213.182.200.40	2026-03-25 18:32:58.557	4340	POLYMER_SINGLE	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Rafah, Gaza Strip, Palestinian Territory	\N	0	\N	0
estimate-1774500641881-n142oc8ac	cmmkiyxl8000013wt4bqymhn8	75	2	2	33920	27040	97500	120500	218960	339460	[{"unit": "шт", "category": "posts", "quantity": 32, "totalPrice": 33920, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 52, "totalPrice": 27040, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 75, "totalPrice": 97500, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "шт", "category": "wickets", "quantity": 1, "totalPrice": 4200, "pricePerUnit": 4200, "nomenclatureId": "cmmkxk7ka0000zs6bbdoa5fi2", "nomenclatureName": "Калитка в покраске (Комплект) L-2м. h-1м."}, {"unit": "м.п.", "category": "installation", "quantity": 80, "totalPrice": 96000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 3000, "pricePerUnit": 3000, "nomenclatureId": "cmmqi3tx80000tf9kn1uka5dz", "nomenclatureName": "Монтаж калитки"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1500, "pricePerUnit": 1500, "nomenclatureId": "cmmqi66b30004tf9k0fycszns", "nomenclatureName": "Монтаж врезного замка"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 8, "totalPrice": 2400, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 32, "totalPrice": 640, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 52, "totalPrice": 260, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 600, "totalPrice": 3000, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	888f83a2-b915-4e58-9105-ef9c3ac19872	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	185.34.241.31	2026-03-26 04:50:41.882	6300	POLYMER_SINGLE	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	t	4500	cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) L-2м. h-1м.	4200	1000	Ramenskoye, Moscow Oblast	\N	0	\N	0
estimate-1774506388430-5rq8tzhso	cmmkiyxl8000013wt4bqymhn8	75	2	2	33920	27040	97500	120500	218960	339460	[{"unit": "шт", "category": "posts", "quantity": 32, "totalPrice": 33920, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 52, "totalPrice": 27040, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 75, "totalPrice": 97500, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 50000, "pricePerUnit": 50000, "nomenclatureId": "cmmkvt4pn0001vp8ptlxwsyip", "nomenclatureName": "Ворота откатные (комплект) L-4м. h-1,95м."}, {"unit": "шт", "category": "wickets", "quantity": 1, "totalPrice": 4200, "pricePerUnit": 4200, "nomenclatureId": "cmmkxk7ka0000zs6bbdoa5fi2", "nomenclatureName": "Калитка в покраске (Комплект) L-2м. h-1м."}, {"unit": "м.п.", "category": "installation", "quantity": 80, "totalPrice": 96000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmmqh2fr20000pxfpwirkmd3k", "nomenclatureName": "Монтаж откатных ворот"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 3000, "pricePerUnit": 3000, "nomenclatureId": "cmmqi3tx80000tf9kn1uka5dz", "nomenclatureName": "Монтаж калитки"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1500, "pricePerUnit": 1500, "nomenclatureId": "cmmqi66b30004tf9k0fycszns", "nomenclatureName": "Монтаж врезного замка"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 8, "totalPrice": 2400, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 32, "totalPrice": 640, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 52, "totalPrice": 260, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 600, "totalPrice": 3000, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	d27c4bd8-3fcf-4ad8-8463-7e8aec512211	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Safari/605.1.15	89.22.52.239	2026-03-26 06:26:28.431	6300	POLYMER_SINGLE	20000	4000	cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	50000	SLIDING	t	t	4500	cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) L-2м. h-1м.	4200	1000	Troshkovo, Moscow Oblast	\N	0	\N	0
estimate-1774513085182-ihjgz1bkg	cmmkk7wg5000j13wtie0o6rcw	38.5	1.8	2	19080	14560	0	42350	73000	115350	[{"unit": "шт", "category": "posts", "quantity": 18, "totalPrice": 19080, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 28, "totalPrice": 14560, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 16, "panelWidth": 2500, "totalPrice": 33600, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 38.5, "totalPrice": 42350, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 96, "totalPrice": 5760, "pricePerUnit": 60, "nomenclatureId": "cmn6c74se00007l4rpxh3oxq4", "nomenclatureName": "Крепление 3D-панели", "calculationMethod": "BY_RATIO"}]	\N	dbec8a72-61a8-4592-803e-2a8b68805efd	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	185.34.241.31	2026-03-26 08:18:05.183	5760	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Ramenskoye, Moscow Oblast	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	33600
estimate-1774513699512-yjuaczxcs	cmmkk7wg5000j13wtie0o6rcw	38.5	1.8	2	19080	14560	0	42350	73000	115350	[{"unit": "шт", "category": "posts", "quantity": 18, "totalPrice": 19080, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 28, "totalPrice": 14560, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 16, "panelWidth": 2500, "totalPrice": 33600, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 38.5, "totalPrice": 42350, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 96, "totalPrice": 5760, "pricePerUnit": 60, "nomenclatureId": "cmn6c74se00007l4rpxh3oxq4", "nomenclatureName": "Крепление 3D-панели", "calculationMethod": "BY_RATIO"}]	\N	dbec8a72-61a8-4592-803e-2a8b68805efd	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	185.34.241.31	2026-03-26 08:28:19.513	5760	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Ramenskoye, Moscow Oblast	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	33600
estimate-1774712795345-xwxt6r7gl	cmmkiyxl8000013wt4bqymhn8	45	2	2	21200	16640	62400	84500	122120	206620	[{"unit": "шт", "category": "posts", "quantity": 20, "totalPrice": 21200, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 32, "totalPrice": 16640, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Полимерное (одностороннее)", "category": "profnastil", "quantity": 48, "totalPrice": 62400, "pricePerUnit": 1300, "nomenclatureId": "cmmkg7cuz0001yh66p0ihxyb3", "nomenclatureName": "С 8-1150  лист односторонний 0,4 мм 2м."}, {"unit": "шт", "category": "gates", "quantity": 1, "totalPrice": 13700, "pricePerUnit": 13700, "nomenclatureId": "cmn2smaue007mxwznsghp78yp", "nomenclatureName": "Ворота распашные (комплект) L-4м. - h-1,8м"}, {"unit": "шт", "category": "wickets", "quantity": 1, "totalPrice": 4200, "pricePerUnit": 4200, "nomenclatureId": "cmmkxk7ka0000zs6bbdoa5fi2", "nomenclatureName": "Калитка в покраске (Комплект) L-2м. h-1м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 20000, "pricePerUnit": 20000, "nomenclatureId": "cmn6cpe4s00137l4rcetdhr18", "nomenclatureName": "Монтаж распашных ворот"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 3000, "pricePerUnit": 3000, "nomenclatureId": "cmmqi3tx80000tf9kn1uka5dz", "nomenclatureName": "Монтаж калитки"}, {"unit": "шт", "category": "installation", "quantity": 1, "totalPrice": 1500, "pricePerUnit": 1500, "nomenclatureId": "cmmqi66b30004tf9k0fycszns", "nomenclatureName": "Монтаж врезного замка"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 5, "totalPrice": 1500, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 20, "totalPrice": 400, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 32, "totalPrice": 160, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 384, "totalPrice": 1920, "pricePerUnit": 5, "nomenclatureId": "cmn52vhhv000fq0a0e5wfkmvv", "nomenclatureName": "Саморез для профнастила", "calculationMethod": "BY_RATIO"}]	\N	504e0dac-d462-4165-b5da-c40a986b2451	Mozilla/5.0 (Linux; Android 16; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.7680.119 Mobile Safari/537.36	188.137.159.127	2026-03-28 15:46:35.347	3980	POLYMER_SINGLE	20000	4000	cmn2smaue007mxwznsghp78yp	Ворота распашные (комплект) L-4м. - h-1,8м	13700	SWING	t	t	4500	cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) L-2м. h-1м.	4200	1000	Vienna, Vienna, Austria	\N	0	\N	0
estimate-6d81b772-0c27-45f6-86b0-d34b293b76d6	cmmkk7wg5000j13wtie0o6rcw	100	2	2	46200	0	0	110000	148740	258740	[{"unit": "шт", "category": "posts", "quantity": 42, "totalPrice": 46200, "pricePerUnit": 1100, "nomenclatureId": "cmmng6ciq000t13k4qt918o3n", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "panel3d", "quantity": 40, "panelWidth": 2500, "totalPrice": 84000, "panelHeight": 2030, "pricePerUnit": 2100, "nomenclatureId": "cmn52mpit0000q0a05bodfr79", "nomenclatureName": "3D-панель, прут-3,5мм., h-2030мм."}, {"unit": "м.п.", "category": "installation", "quantity": 100, "totalPrice": 110000, "pricePerUnit": 1100, "nomenclatureId": "cmn65in550007e60txjcb4k48", "nomenclatureName": "Монтаж забора из 3D-панели"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 11, "totalPrice": 3300, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 42, "totalPrice": 840, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 240, "totalPrice": 14400, "pricePerUnit": 60, "nomenclatureId": "cmn6c74se00007l4rpxh3oxq4", "nomenclatureName": "Крепление 3D-панели", "calculationMethod": "BY_RATIO"}]	\N	2798d5fe-0e39-4a92-bcf3-43baec589295	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	89.22.52.86	2026-03-29 14:58:42.213	18540	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Troshkovo, Moscow Oblast	cmn52mpit0000q0a05bodfr79	0	3D-панель, прут-3,5мм., h-2030мм.	84000
estimate-2c6489fe-26bf-433c-b9dd-8d125c0fda00	cmmkiyxl8000013wt4bqymhn8	50	2	2	23320	18720	57600	60000	102060	162060	[{"unit": "шт", "category": "posts", "quantity": 22, "totalPrice": 23320, "pricePerUnit": 1060, "nomenclatureId": "cmn283hgl0012xwznmicmy1x3", "nomenclatureName": "Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)"}, {"unit": "шт", "category": "lags", "quantity": 36, "totalPrice": 18720, "pricePerUnit": 520, "nomenclatureId": "cmmiu2cv500007jls4pb4khsh", "nomenclatureName": "Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"}, {"unit": "шт", "coating": "Оцинковка", "category": "profnastil", "quantity": 48, "totalPrice": 57600, "pricePerUnit": 1200, "nomenclatureId": "cmn6dn1yu001h7l4r0elsg00v", "nomenclatureName": "С 8-1150 лист оцинкованный 0,4 мм 2м."}, {"unit": "м.п.", "category": "installation", "quantity": 50, "totalPrice": 60000, "pricePerUnit": 1200, "nomenclatureId": "cmn65ejk80001e60t48reno0m", "nomenclatureName": "Монтаж забора из профнастила"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 6, "totalPrice": 1800, "pricePerUnit": 300, "nomenclatureId": "cmmoouq3g0006z3ah50db6zpq", "nomenclatureName": "Мешок щебня ", "calculationMethod": "BY_INVERSE_RATIO"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 22, "totalPrice": 440, "pricePerUnit": 20, "nomenclatureId": "cmn2q7lsv0060xwzn6jn29pna", "nomenclatureName": "Заглушка пластиковая 60х60", "calculationMethod": "BY_QUANTITY"}, {"unit": "шт", "category": "mounting_hardware", "quantity": 36, "totalPrice": 180, "pricePerUnit": 5, "nomenclatureId": "cmmnljmuf0000rf983uc0oq1d", "nomenclatureName": "Заглушка пластиковая 40х20", "calculationMethod": "BY_QUANTITY"}]	\N	215a5e09-af5b-45ee-b870-518c7c7eb65c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	178.64.115.102	2026-03-30 08:08:42.513	2420	GALVANIZED	0	\N	\N	\N	0	\N	f	f	0	\N	\N	0	\N	Krasnoyarsk, Krasnoyarsk Krai	\N	0	\N	0
\.


--
-- Data for Name: FenceMaterial; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FenceMaterial" (id, name, category, unit, "basePrice", description, image, thickness, width, height, coating, "availableHeights", "availableThicknesses", "thicknessPrices", active, "sortOrder", "createdAt", "updatedAt", "fenceTypeId") FROM stdin;
cmmi7hme900024honx4vpzr3k	Профнастил С8	PROFNASTIL	м²	450	Оцинкованный профилированный лист	\N	0.5	1	2	Оцинковка	\N	\N	\N	t	1	2026-03-08 20:29:52.162	2026-03-08 20:29:52.162	\N
cmmi7hme900034hon898a3jmf	Профнастил С8 полимерный	PROFNASTIL	м²	550	Профлист с полимерным покрытием	\N	0.5	1	2	Полимерное	\N	\N	\N	t	2	2026-03-08 20:29:52.162	2026-03-08 20:29:52.162	\N
cmmi7hme900044hon2kp0fep5	Столб металлический 60x60	POSTS	м.п.	1200	Профильная труба квадратного сечения	\N	\N	\N	\N	\N	\N	\N	\N	t	3	2026-03-08 20:29:52.162	2026-03-08 20:29:52.162	\N
cmmi7hme900054honcxdgkwjh	Лага металлическая 40x20	LAGS	м.п.	300	Профиль для поперечин	\N	\N	\N	\N	\N	\N	\N	\N	t	4	2026-03-08 20:29:52.162	2026-03-08 20:29:52.162	\N
cmmi7hme900064hon475o6veh	Саморезы 5.5x25	FASTENERS	шт	5	Крепеж для профлиста	\N	\N	\N	\N	\N	\N	\N	\N	t	5	2026-03-08 20:29:52.162	2026-03-08 20:29:52.162	\N
\.


--
-- Data for Name: FenceType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FenceType" (id, name, description, image, "difficultyCoef", "postSpacing", "defaultLagRows", active, "createdAt", "updatedAt", priority) FROM stdin;
cmmkk6z9q000i13wt4y25v8sj	Сетка-рабица			1	3000	2	f	2026-03-10 12:01:02.99	2026-03-11 18:16:37.193	4
cmmkiyxl8000013wt4bqymhn8	Профнастил			1	2500	2	t	2026-03-10 11:26:47.947	2026-03-12 11:51:47.264	1
cmmkk7wg5000j13wtie0o6rcw	3D-панели			1	2500	2	t	2026-03-10 12:01:45.989	2026-03-24 20:41:05.445	5
cmmkk3wl5000113wtdqdgyxp2	Евроштакетник			1	2500	2	f	2026-03-10 11:58:39.532	2026-03-26 14:18:51.234	3
\.


--
-- Data for Name: GateType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GateType" (id, name, description, type, "metalThickness", "sectionWidth", "sectionHeight", "gateHeight", "gateLength", "retailPrice", "purchasePrice", image, active, "validFrom", "expirationDate", "createdAt", "updatedAt", priority) FROM stdin;
cmn2sre7p008dxwzns2v83do2	Ворота распашные (комплект) L-4м. - h-2,5м		Распашные	2	60	40	2500	4000	16000	7999.98	\N	t	\N	\N	2026-03-23 06:20:43.573	2026-03-23 06:20:43.573	22
cmmkvqw8o0000vp8pk57c1l9w	Ворота откатные (комплект) L-3м. h-1,75м.	Ворота откатные в покраске комплект (( столбы, каркас, балка, швеллер,сваи 89 2шт,площадки, комплект механики,заглушки )	Откатные	2	60	40	1750	3000	32000	22000	\N	t	\N	\N	2026-03-10 17:24:27.958	2026-03-23 06:27:19.74	1
cmn28ux7j003gxwzn5cbcy3o9	Ворота откатные (комплект) L-3м. h-1,95м.		Откатные	2	60	35	1950	3000	46000	23000	\N	t	\N	\N	2026-03-22 21:03:35.839	2026-03-23 06:25:09.481	6
cmn28teuz003dxwznqjoksfez	Ворота откатные (комплект) L-4м. h-1,75м.		Откатные	2	60	40	1750	4000	48000	24000	\N	t	\N	\N	2026-03-22 21:02:25.403	2026-03-23 06:25:30.309	5
cmn2s5dkb0068xwznahdyifx1	Ворота распашные (комплект) L-3,5м. - h-1,5м		Распашные	2	40	40	1500	3500	13100	6550	\N	t	\N	\N	2026-03-23 06:03:36.3	2026-03-23 06:03:36.3	13
cmn2s85tj006bxwzna72y88la	Ворота распашные (комплект) L-3,5м. - h-1,8м		Распашные	2	60	40	1800	3500	13400	6700	\N	t	\N	\N	2026-03-23 06:05:46.232	2026-03-23 06:05:46.232	14
cmn2s9h7m006exwzn97r7w2io	Ворота распашные (комплект) L-3,5м. - h-2м		Распашные	2	60	40	2000	3500	13700	6850	\N	t	\N	\N	2026-03-23 06:06:47.651	2026-03-23 06:06:47.651	15
cmn298hsd0058xwznzimsi8vh	Ворота распашные (комплект) L-3м. - h-2,5м		Распашные	2	60	20	2500	3000	15500	7750	\N	t	\N	\N	2026-03-22 21:14:09.037	2026-03-23 06:21:20.405	12
cmn2sdx5z006vxwznydrlbjes	Ворота распашные (комплект) L-4м. - h-1,5м		Распашные	2	60	40	1500	3995	13499.99	6500	\N	t	\N	\N	2026-03-23 06:10:14.952	2026-03-23 06:15:31.471	18
cmn2smaue007mxwznsghp78yp	Ворота распашные (комплект) L-4м. - h-1,8м		Распашные	2	60	40	1800	4000	13700	6700	\N	t	\N	\N	2026-03-23 06:16:45.926	2026-03-23 06:16:45.926	19
cmn2sc7z2006kxwzn4c9cvb3f	Ворота распашные (комплект) L-3,5м. - h-2,5м		Распашные	2	60	40	2500	3500	15700	7850	\N	t	\N	\N	2026-03-23 06:08:55.627	2026-03-23 06:17:01.893	17
cmn2sasof006hxwzn6nwcskh5	Ворота распашные (комплект) L-3,5м. - h-2,2м		Распашные	2	60	40	2200	3500	14700	7350	\N	t	\N	\N	2026-03-23 06:07:49.167	2026-03-23 06:17:11.836	16
cmn2snz4w0081xwzne2hjh461	Ворота распашные (комплект) L-4м. - h-2м		Распашные	2	60	40	2000	4000	14000	7000	\N	t	\N	\N	2026-03-23 06:18:04.064	2026-03-23 06:18:25.167	20
cmn2sqj9x008axwznl9df87kc	Ворота распашные (комплект) L-4м. - h-2,2м		Распашные	2	60	40	2200	4000	15000	7500	\N	t	\N	\N	2026-03-23 06:20:03.477	2026-03-23 06:20:03.477	21
cmn295sob0055xwzn6dyo7588	Ворота распашные (комплект) L-3м. - h- 2м.		Распашные	2	60	40	2000	3000	13500	6750	\N	t	\N	\N	2026-03-22 21:12:03.179	2026-03-23 06:21:56.704	11
cmn294pil0052xwznpnr5adap	Ворота распашные (комплект) L-3м. h-1,8м		Распашные	2	60	40	1800	3000	13600	6600	\N	t	\N	\N	2026-03-22 21:11:12.43	2026-03-23 06:22:46.535	10
cmn28yzuy003pxwzn2m0ouyyl	Ворота откатные (комплект) L-5м. h-1,75м.		Откатные	2	60	40	1750	5000	54000	27000	\N	t	\N	\N	2026-03-22 21:06:45.898	2026-03-23 06:23:38.452	9
cmn28xoov003mxwznszgbu1re	Ворота откатные (комплект) L-3,5м. h-1,95м.		Откатные	2	60	40	1950	3500	48000	24000	\N	t	\N	\N	2026-03-22 21:05:44.767	2026-03-23 06:24:15.323	8
cmn28waq8003jxwznhpr5ev51	Ворота откатные (комплект) L-3,5м. h-1,75м.		Откатные	2	60	40	1750	3500	46000	23000	\N	t	\N	\N	2026-03-22 21:04:40.016	2026-03-23 06:24:45.608	7
cmn28ryrp003axwznhqf7lkyq	Ворота откатные (комплект) L-5м. h-1,95м.		Откатные	2	60	40	1950	5000	60000	28000	\N	t	\N	\N	2026-03-22 21:01:17.894	2026-03-23 06:25:54.579	4
cmmkvv9it0008vp8puadb1zqx	Ворота распашные (комплект) L-3м. h-1,5м.	КАРКАС ВОРОТ ( В ПОКРАСКЕ С ПОЛНОЙ КОМПЛЕКТАЦИЕЙ:  ЗАДВИЖКА ГУСЬ,2 СТОПОРА В ЗЕМЛЮ,ПОЛОСА,ЗАГЛУШКИ 80х80,ПЕТЛИ ПРИВАРЕНЫ ) СТОЛБ 80х80 мм. 2 Шт  РАМА ПРОФ.ТРУБА 40х20 мм	Распашные	2	60	38	1500	3000	13450	6450	\N	t	\N	\N	2026-03-10 17:27:51.796	2026-03-23 06:26:34.917	3
cmmkvt4pn0001vp8ptlxwsyip	Ворота откатные (комплект) L-4м. h-1,95м.	Ворота откатные в покраске комплект (( столбы, каркас, балка, швеллер,сваи 89 2шт,площадки, комплект механики,заглушки )	Откатные	2	60	40	1950	4000	50000	25000	\N	t	\N	\N	2026-03-10 17:26:12.241	2026-03-23 06:27:00.715	2
\.


--
-- Data for Name: LagType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LagType" (id, name, description, width, height, "metalThickness", "retailPricePerUnit", "purchasePricePerUnit", image, active, "createdAt", "updatedAt", "expirationDate", "validFrom", priority, length) FROM stdin;
cmmiu2cv500007jls4pb4khsh	Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)	Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)	40	20	1.5	520	425	\N	t	2026-03-09 07:01:51.137	2026-03-22 20:35:51.23	2026-03-31 00:00:00	\N	1	3000
cmmkdskbc0000141dn39k9wjy	ЛАГА ПРОФ ТРУБА 40х20 мм. 1.5мм (В ПОКРАСКЕ)		40	20	1.5	1040	840	\N	t	2026-03-10 09:01:52.729	2026-03-22 20:36:01.559	\N	\N	2	6000
\.


--
-- Data for Name: MountingHardware; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MountingHardware" (id, name, description, "purchasePrice", "retailPrice", "validUntil", active, "sortOrder", "createdAt", "updatedAt", "calculationMethod", "calculationValue", "useInCalculator") FROM stdin;
cmmonq3zq0000z3ahc3padblp	Планка для профнастила  длина 2 метра С-8	Планка для профнастила  длина 2 метра С-8	70	80	\N	t	0	2026-03-13 08:50:59.125	2026-03-13 08:50:59.125	\N	\N	f
cmmnljmuf0000rf983uc0oq1d	Заглушка пластиковая 40х20		3	5	\N	t	0	2026-03-12 15:02:11.558	2026-03-13 10:25:40.259	BY_QUANTITY	\N	t
cmmoouq3g0006z3ah50db6zpq	Мешок щебня 	Мешок щебня	150	300	\N	t	0	2026-03-13 09:22:34.002	2026-03-23 05:07:17.389	BY_INVERSE_RATIO	4	t
cmn2q7lsv0060xwzn6jn29pna	Заглушка пластиковая 60х60		7	20	\N	t	0	2026-03-23 05:09:21.055	2026-03-23 05:09:21.055	BY_QUANTITY	\N	t
cmn52vhhv000fq0a0e5wfkmvv	Саморез для профнастила		2.5	5	\N	t	0	2026-03-24 20:39:22.962	2026-03-24 20:39:22.962	BY_RATIO	8	t
cmn6c74se00007l4rpxh3oxq4	Крепление 3D-панели		35	60	\N	t	0	2026-03-25 17:48:09.086	2026-03-25 17:56:09.185	BY_RATIO	6	t
\.


--
-- Data for Name: MountingHardwareRelation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MountingHardwareRelation" (id, "mountingHardwareId", "referenceType", "referenceId", "createdAt") FROM stdin;
cmmonq3zq0001z3ahwdgi7x2l	cmmonq3zq0000z3ahc3padblp	PROFNASTIL	cmmkg8een0002yh663iksgtjf	2026-03-13 08:50:59.125
cmmonq3zq0002z3ahpqs1obm7	cmmonq3zq0000z3ahc3padblp	PROFNASTIL	cmmkg5vsj0000yh665v5bnysy	2026-03-13 08:50:59.125
cmmonq3zq0003z3ah9rggr4sw	cmmonq3zq0000z3ahc3padblp	PROFNASTIL	cmmkg7cuz0001yh66p0ihxyb3	2026-03-13 08:50:59.125
cmmor3vkw0000b8wec86ip67d	cmmnljmuf0000rf983uc0oq1d	LAG	cmmiu2cv500007jls4pb4khsh	2026-03-13 10:25:40.257
cmmor3vkw0001b8wejwq3qf7e	cmmnljmuf0000rf983uc0oq1d	LAG	cmmkdskbc0000141dn39k9wjy	2026-03-13 10:25:40.257
cmn2q4ydl005rxwznrqqh3wzo	cmmoouq3g0006z3ah50db6zpq	POST	cmmng6ciq000t13k4qt918o3n	2026-03-23 05:07:17.386
cmn2q4ydl005sxwznn34p2nay	cmmoouq3g0006z3ah50db6zpq	POST	cmn283hgl0012xwznmicmy1x3	2026-03-23 05:07:17.386
cmn2q4ydl005txwzn1zgn0idy	cmmoouq3g0006z3ah50db6zpq	POST	cmn281n63000wxwzneu47ajfb	2026-03-23 05:07:17.386
cmn2q4ydl005uxwzn2iekdzr9	cmmoouq3g0006z3ah50db6zpq	POST	cmn282gcm000zxwznuish3n0a	2026-03-23 05:07:17.386
cmn2q4ydl005vxwznsmqvwujs	cmmoouq3g0006z3ah50db6zpq	POST	cmn284txx0015xwznvdusxmqc	2026-03-23 05:07:17.386
cmn2q7lsv0061xwzns4cn1lp0	cmn2q7lsv0060xwzn6jn29pna	POST	cmn281n63000wxwzneu47ajfb	2026-03-23 05:09:21.055
cmn2q7lsv0062xwznux3liixk	cmn2q7lsv0060xwzn6jn29pna	POST	cmn282gcm000zxwznuish3n0a	2026-03-23 05:09:21.055
cmn2q7lsv0063xwznuye5hi86	cmn2q7lsv0060xwzn6jn29pna	POST	cmmng6ciq000t13k4qt918o3n	2026-03-23 05:09:21.055
cmn2q7lsv0064xwznmbk01djl	cmn2q7lsv0060xwzn6jn29pna	POST	cmn284txx0015xwznvdusxmqc	2026-03-23 05:09:21.055
cmn2q7lsv0065xwzn4bvnj1rv	cmn2q7lsv0060xwzn6jn29pna	POST	cmn283hgl0012xwznmicmy1x3	2026-03-23 05:09:21.055
cmn52vhhv000gq0a0bv23q3fj	cmn52vhhv000fq0a0e5wfkmvv	PROFNASTIL	cmn28lggm0034xwznjtqc72mr	2026-03-24 20:39:22.962
cmn52vhhv000hq0a03xpumfz0	cmn52vhhv000fq0a0e5wfkmvv	PROFNASTIL	cmmkg8een0002yh663iksgtjf	2026-03-24 20:39:22.962
cmn52vhhv000iq0a0j3u6j4ec	cmn52vhhv000fq0a0e5wfkmvv	PROFNASTIL	cmmkg7cuz0001yh66p0ihxyb3	2026-03-24 20:39:22.962
cmn52vhhv000jq0a0m101ru15	cmn52vhhv000fq0a0e5wfkmvv	PROFNASTIL	cmn28n9s70037xwzn6gx1jnqz	2026-03-24 20:39:22.962
cmn52vhhv000kq0a0dvy4hs2u	cmn52vhhv000fq0a0e5wfkmvv	PROFNASTIL	cmn2tdwnl00cuxwzn3eby1h0p	2026-03-24 20:39:22.962
cmn52vhhv000lq0a06dv2am3e	cmn52vhhv000fq0a0e5wfkmvv	PROFNASTIL	cmn28g3hr002mxwzng5utvrbw	2026-03-24 20:39:22.962
cmn52vhhv000mq0a0duoi2sta	cmn52vhhv000fq0a0e5wfkmvv	PROFNASTIL	cmn2t6wm200c5xwznw3htjrlf	2026-03-24 20:39:22.962
cmn52vhhv000nq0a0qh9jqc03	cmn52vhhv000fq0a0e5wfkmvv	PROFNASTIL	cmn28j5nk002vxwzn6949khz7	2026-03-24 20:39:22.962
cmn52vhhv000oq0a0goulhizu	cmn52vhhv000fq0a0e5wfkmvv	PROFNASTIL	cmn2t9pmn00cbxwzntr63c16o	2026-03-24 20:39:22.962
cmn6chf8f000f7l4rkwn0xut8	cmn6c74se00007l4rpxh3oxq4	PANEL_3D	cmn52pnuq000aq0a0j5jiwoi9	2026-03-25 17:56:09.183
cmn6chf8f000g7l4rvggc7qmm	cmn6c74se00007l4rpxh3oxq4	PANEL_3D	cmn52o8k90005q0a0zrpo9aia	2026-03-25 17:56:09.183
cmn6chf8f000h7l4r0pfd349h	cmn6c74se00007l4rpxh3oxq4	PANEL_3D	cmn52mpit0000q0a05bodfr79	2026-03-25 17:56:09.183
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, "clientName", phone, email, "serviceType", parameters, "calculatedCost", status, "managerComment", "assignedTo", "createdAt", "updatedAt", "statusHistory", "estimateId", "cancellationReason", "completionDate", "measurementAddress", "measurementDate") FROM stdin;
\.


--
-- Data for Name: PageContent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PageContent" (id, slug, title, content, "seoTitle", "seoDescription", "seoKeywords", "updatedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Panel3D; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Panel3D" (id, name, description, "panelHeight", "panelWidth", "panelArea", "rodDiameter", "cellWidth", "cellHeight", "purchasePricePerUnit", "retailPricePerUnit", image, active, "validFrom", "validUntil", priority, "createdAt", "updatedAt") FROM stdin;
cmn52mpit0000q0a05bodfr79	3D-панель, прут-3,5мм., h-2030мм.		2030	2500	\N	3.5	55	200	1880	2100		t	\N	\N	1	2026-03-24 20:32:33.461	2026-03-24 20:32:33.461
cmn52o8k90005q0a0zrpo9aia	3D-панель, прут-3,5мм., h-1730мм.		1730	2500	\N	3.5	55	200	1650	1900		t	\N	\N	2	2026-03-24 20:33:44.793	2026-03-24 20:33:44.793
cmn52pnuq000aq0a0j5jiwoi9	3D-панель, прут-3,5мм., h-1530мм.		1530	2500	\N	3.5	55	200	1500	1800		t	\N	\N	3	2026-03-24 20:34:51.266	2026-03-24 20:34:51.266
\.


--
-- Data for Name: PicketType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PicketType" (id, name, description, "metalThickness", width, length, coating, color, "purchasePricePerMeter", "retailPricePerMeter", "validFrom", "validUntil", active, image, "createdAt", "updatedAt", priority) FROM stdin;
\.


--
-- Data for Name: PortfolioItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PortfolioItem" (id, title, category, type, description, images, cost, "showCost", active, "sortOrder", "createdAt", "updatedAt") FROM stdin;
05c85312-227b-400f-b6fd-3b2a245cd87d	Заборы, ворота, калитки из евроштакетника под ключ	fence	Монтаж и производство	Почему евроштакетник становится популярнее профнастила? Потому что он красивее, долговечнее и не создает тени на участке. Посмотрите на наши реализованные проекты — это доказательство того, что металлический забор может выглядеть дорого и стильно.	["/uploads/portfolio/2026/03/05c85312-227b-400f-b6fd-3b2a245cd87d.jpg"]	\N	f	t	0	2026-03-23 14:00:00	2026-03-23 12:07:27.075
07f33cc6-e104-4672-be98-ff323d2a1c57	Навес из металлоконструкций и поликарбоната	canopy	Монтаж и производство 	Надежная защита для вашего авто или зоны отдыха	["/uploads/portfolio/2026/03/07f33cc6-e104-4672-be98-ff323d2a1c57.jpg"]	\N	f	t	0	2026-03-23 14:53:00	2026-03-23 12:06:02.995
176aea63-7ca4-4dad-80dc-14fcffccf193	Заборы, ворота и калитки из профнастила под ключ	fence	Монтаж и производство 	щете идеальный баланс между ценой и качеством? Посмотрите, что мы уже сделали для наших клиентов. Профнастил — это выбор прагматичных владельцев: он не требует покраски, скрывает участок от посторонних глаз и монтируется за 1-3 дня.	["/uploads/portfolio/2026/03/176aea63-7ca4-4dad-80dc-14fcffccf193.jpg"]	\N	f	t	0	2026-03-23 14:41:00	2026-03-23 12:08:19.393
\.


--
-- Data for Name: PostType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PostType" (id, name, description, "sectionWidth", "sectionHeight", "wallThickness", "pricePerMeter", image, active, "createdAt", "updatedAt", "expirationDate", "validFrom", length, priority, "retailPricePerUnit", "purchasePricePerUnit") FROM stdin;
cmmng6ciq000t13k4qt918o3n	Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)		60	60	2	300	\N	t	2026-03-12 12:31:53.57	2026-03-22 20:40:04.649	\N	\N	3.2	1	1100	910
cmn281n63000wxwzneu47ajfb	Столбы 60х60 мм. 2 мм. 2,5м.  ГОСТ (в покраске)		60	60	2.5	300	\N	t	2026-03-22 20:40:49.803	2026-03-22 20:40:49.803	\N	\N	2.5	2	925	725
cmn282gcm000zxwznuish3n0a	Столбы 60х60 мм. 2 мм. 2,8м.  ГОСТ (в покраске)		60	60	2.5	300	\N	t	2026-03-22 20:41:27.622	2026-03-22 20:41:27.622	\N	\N	2.8	3	1000	800
cmn283hgl0012xwznmicmy1x3	Столбы 60х60 мм. 2 мм. 3м.  ГОСТ (в покраске)		60	60	2.5	300	\N	t	2026-03-22 20:42:15.717	2026-03-22 20:42:15.717	\N	\N	3	4	1060	860
cmn284txx0015xwznvdusxmqc	Столбы 60х60 мм. 2 мм. 3,5м.  ГОСТ (в покраске)		60	60	2.5	300	\N	t	2026-03-22 20:43:18.549	2026-03-22 20:43:18.549	\N	\N	3.5	5	1200	995
\.


--
-- Data for Name: PriceHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PriceHistory" (id, "entityType", "entityId", "fieldName", "oldValue", "newValue", "changedBy", "changedAt") FROM stdin;
\.


--
-- Data for Name: ProfnastilType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProfnastilType" (id, name, description, "metalThickness", "fullWidth", "usefulWidth", length, coating, color, "purchasePricePerUnit", "retailPricePerUnit", "validFrom", "validUntil", active, image, "createdAt", "updatedAt", priority, "purchasePricePerLinearMeter") FROM stdin;
cmmkg5vsj0000yh665v5bnysy	С 8-1150  лист односторонний 0,35 мм.		0.35	1150	1100	2000	Полимерное (одностороннее)	Коричневый	1000	1200	\N	\N	t	\N	2026-03-10 10:08:13.363	2026-03-22 20:47:22.083	3	500
cmmkg7cuz0001yh66p0ihxyb3	С 8-1150  лист односторонний 0,4 мм 2м.		0.4	1150	1100	2000	Полимерное (одностороннее)	Коричневый	1100	1300	\N	\N	t	\N	2026-03-10 10:09:22.139	2026-03-22 20:52:54.939	1	550
cmn28j5nk002vxwzn6949khz7	С 8-1150 лист односторонний 0,4 мм 2,2м.		0.4	1150	1100	2200	Полимерное (одностороннее)		1210	1450	\N	\N	t	\N	2026-03-22 20:54:26.912	2026-03-22 20:54:26.912	5	550
cmmkg8een0002yh663iksgtjf	С 8-1150  лист двусторонний 0,4 мм 2м.		0.4	1115	1100	2000	Полимерное (двустороннее)	Коричневый	1200	1400	\N	\N	t	\N	2026-03-10 10:10:10.799	2026-03-22 20:55:04.203	2	600
cmn28lggm0034xwznjtqc72mr	С 8-1150  лист двусторонний 0,4 мм 1,8м.		0.4	1150	1100	1800	Полимерное (двустороннее)		1080	1280	\N	\N	t	\N	2026-03-22 20:56:14.23	2026-03-22 20:56:14.23	6	600
cmn28n9s70037xwzn6gx1jnqz	С 8-1150 лист двусторонний 0,4 мм 2,2м.		0.4	1150	1100	2200	Полимерное (двустороннее)		1320	1550	\N	\N	t	\N	2026-03-22 20:57:38.887	2026-03-22 20:57:38.887	7	600
cmn2t6wm200c5xwznw3htjrlf	С 8-1150 лист односторонний 0,4 мм 1,8м.		0.6	1150	1100	1800	Полимерное (одностороннее)		990	1190	\N	\N	t	\N	2026-03-23 06:32:47.258	2026-03-23 06:32:47.258	8	550
cmn2t9pmn00cbxwzntr63c16o	С 8-1150 лист односторонний 0,4 мм 2,5м.		0.4	1150	1100	2500	Полимерное (одностороннее)		1375	1575	\N	\N	t	\N	2026-03-23 06:34:58.175	2026-03-23 06:35:46.967	9	550
cmn28g3hr002mxwzng5utvrbw	С 8-1150 лист односторонний 0,4 мм 1,8м		0.4	1150	1100	1800	Полимерное (одностороннее)		990	1190	\N	\N	t	\N	2026-03-22 20:52:04.143	2026-03-23 06:37:36.63	4	550
cmn2tdwnl00cuxwzn3eby1h0p	С 8-1150 лист двусторонний 0,4 мм 2,5м.		0.4	1150	1100	2500	Полимерное (двустороннее)		1500	1749.98	\N	\N	t	\N	2026-03-23 06:38:13.905	2026-03-23 06:38:13.905	10	600
cmn6dn1yu001h7l4r0elsg00v	С 8-1150 лист оцинкованный 0,4 мм 2м.		0.4	1150	1100	2000	Оцинковка		1000	1200	\N	\N	t	\N	2026-03-25 18:28:31.542	2026-03-25 18:28:31.542	11	500
cmn6do3vy001k7l4rl7kha9mr	С 8-1150 лист оцинкованный 0,4 мм 1.8м.		0.4	1150	1100	1800	Оцинковка		900	1100	\N	\N	t	\N	2026-03-25 18:29:20.686	2026-03-25 18:29:20.686	12	500
cmn6dpzwm001n7l4r0564d89t	С 8-1150 лист оцинкованный 0,4 мм 2.2м.		0.4	1150	1100	2200	Оцинковка		1100	1300	\N	\N	t	\N	2026-03-25 18:30:48.838	2026-03-25 18:31:06.658	13	500
cmn6drgys00227l4rcshby078	С 8-1150 лист оцинкованный 0,4 мм 2.5м.		0.4	1150	1100	2500	Оцинковка		1250	1450	\N	\N	t	\N	2026-03-25 18:31:57.604	2026-03-25 18:31:57.604	14	500
\.


--
-- Data for Name: RateLimitConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RateLimitConfig" (id, "maxAttempts", "windowMs", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ReferenceChangeLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ReferenceChangeLog" (id, "entityType", "entityId", "fieldName", "oldValue", "newValue", "changedBy", "changedAt") FROM stdin;
cmn27v8sj0001xwznkcpsrw6b	LagType	cmmiu2cv500007jls4pb4khsh	name	"ЛАГА ПРОФ ТРУБА  40х20 мм. 1.5мм  (В ПОКРАСКЕ)"	"Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"	cmmi7hme100004hon3yvy52df	2026-03-22 20:35:51.235
cmn27v8sm0003xwzn48293anq	LagType	cmmiu2cv500007jls4pb4khsh	description	"ЛАГА ПРОФ ТРУБА  40х20 мм. 1.5мм  (В ПОКРАСКЕ)"	"Лага Проф — труба 40х20 мм. 1.5мм  (в покраске)"	cmmi7hme100004hon3yvy52df	2026-03-22 20:35:51.238
cmn27v8so0005xwznw3jvfu72	LagType	cmmiu2cv500007jls4pb4khsh	createdAt	"2026-03-09T07:01:51.137Z"	"2026-03-09T07:01:51.137Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:35:51.24
cmn27v8sq0007xwzncnrn2wq3	LagType	cmmiu2cv500007jls4pb4khsh	updatedAt	"2026-03-12T15:35:00.443Z"	"2026-03-22T20:35:51.230Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:35:51.242
cmn27v8sr0009xwznejxfqz1j	LagType	cmmiu2cv500007jls4pb4khsh	expirationDate	"2026-03-31T00:00:00.000Z"	"2026-03-31T00:00:00.000Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:35:51.244
cmn27vgrd000bxwzn1cethy5c	LagType	cmmkdskbc0000141dn39k9wjy	createdAt	"2026-03-10T09:01:52.729Z"	"2026-03-10T09:01:52.729Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:36:01.561
cmn27vgrg000dxwznxp0iunhz	LagType	cmmkdskbc0000141dn39k9wjy	updatedAt	"2026-03-11T17:33:29.225Z"	"2026-03-22T20:36:01.559Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:36:01.565
cmn27zqso000fxwzn2tmbb5q3	PostType	cmmng6ciq000t13k4qt918o3n	name	"СТОЛБЫ 60х60 мм. 2 мм  ГОСТ (В ПОКРАСКЕ)"	"Столбы 60х60 мм. 2 мм  ГОСТ (в покраске)"	cmmi7hme100004hon3yvy52df	2026-03-22 20:39:21.193
cmn27zqsv000hxwznvwdmqw7k	PostType	cmmng6ciq000t13k4qt918o3n	createdAt	"2026-03-12T12:31:53.570Z"	"2026-03-12T12:31:53.570Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:39:21.199
cmn27zqsx000jxwznfjf95eae	PostType	cmmng6ciq000t13k4qt918o3n	updatedAt	"2026-03-17T18:10:36.917Z"	"2026-03-22T20:39:21.190Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:39:21.201
cmn27zqt1000lxwznhr1xy2n6	PostType	cmmng6ciq000t13k4qt918o3n	retailPricePerUnit	850	1100	cmmi7hme100004hon3yvy52df	2026-03-22 20:39:21.205
cmn27zqt2000nxwzny8cvqv8f	PostType	cmmng6ciq000t13k4qt918o3n	purchasePricePerUnit	749.97	910	cmmi7hme100004hon3yvy52df	2026-03-22 20:39:21.207
cmn280obu000rxwznpzgen0uw	PostType	cmmng6ciq000t13k4qt918o3n	name	"Столбы 60х60 мм. 2 мм  ГОСТ (в покраске)"	"Столбы 60х60 мм. 2 мм. 3,2м.  ГОСТ (в покраске)"	cmmi7hme100004hon3yvy52df	2026-03-22 20:40:04.651
cmn280obw000txwznhl82743a	PostType	cmmng6ciq000t13k4qt918o3n	createdAt	"2026-03-12T12:31:53.570Z"	"2026-03-12T12:31:53.570Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:40:04.652
cmn280oby000vxwzn9cpzhd8o	PostType	cmmng6ciq000t13k4qt918o3n	updatedAt	"2026-03-22T20:39:21.190Z"	"2026-03-22T20:40:04.649Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:40:04.655
cmn281n66000yxwzngxvmyxmn	PostType	cmn281n63000wxwzneu47ajfb	priority	\N	2	cmmi7hme100004hon3yvy52df	2026-03-22 20:40:49.806
cmn282gcr0011xwznjnu031hs	PostType	cmn282gcm000zxwznuish3n0a	priority	\N	3	cmmi7hme100004hon3yvy52df	2026-03-22 20:41:27.627
cmn283hgm0014xwznt89teprq	PostType	cmn283hgl0012xwznmicmy1x3	priority	\N	4	cmmi7hme100004hon3yvy52df	2026-03-22 20:42:15.719
cmn284txz0017xwzn7prvesxm	PostType	cmn284txx0015xwznvdusxmqc	priority	\N	5	cmmi7hme100004hon3yvy52df	2026-03-22 20:43:18.551
cmn287t8t0019xwznqqdiksre	ProfnastilType	cmmkg7cuz0001yh66p0ihxyb3	purchasePricePerLinearMeter	null	550	cmmi7hme100004hon3yvy52df	2026-03-22 20:45:37.613
cmn287t8v001dxwzn06hfzjxm	ProfnastilType	cmmkg7cuz0001yh66p0ihxyb3	purchasePricePerUnit	550	1100	cmmi7hme100004hon3yvy52df	2026-03-22 20:45:37.615
cmn287t8w001fxwzn8rdtf1za	ProfnastilType	cmmkg7cuz0001yh66p0ihxyb3	retailPricePerUnit	600	1300	cmmi7hme100004hon3yvy52df	2026-03-22 20:45:37.617
cmn287t8y001hxwznn6oqwgbr	ProfnastilType	cmmkg7cuz0001yh66p0ihxyb3	createdAt	"2026-03-10T10:09:22.139Z"	"2026-03-10T10:09:22.139Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:45:37.618
cmn287t8z001jxwznufqqzr2x	ProfnastilType	cmmkg7cuz0001yh66p0ihxyb3	updatedAt	"2026-03-12T06:38:04.204Z"	"2026-03-22T20:45:37.610Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:45:37.62
cmn288c8d001lxwzng5s0j67q	ProfnastilType	cmmkg8een0002yh663iksgtjf	purchasePricePerLinearMeter	null	600	cmmi7hme100004hon3yvy52df	2026-03-22 20:46:02.221
cmn288c8g001pxwzn4lw8br5r	ProfnastilType	cmmkg8een0002yh663iksgtjf	purchasePricePerUnit	600	1200	cmmi7hme100004hon3yvy52df	2026-03-22 20:46:02.225
cmn288c8i001rxwznl972asoe	ProfnastilType	cmmkg8een0002yh663iksgtjf	retailPricePerUnit	650	1400	cmmi7hme100004hon3yvy52df	2026-03-22 20:46:02.226
cmn288c8j001txwzny2aipejv	ProfnastilType	cmmkg8een0002yh663iksgtjf	createdAt	"2026-03-10T10:10:10.799Z"	"2026-03-10T10:10:10.799Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:46:02.227
cmn288c8k001vxwzngtxi6c35	ProfnastilType	cmmkg8een0002yh663iksgtjf	updatedAt	"2026-03-22T06:54:48.734Z"	"2026-03-22T20:46:02.219Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:46:02.229
cmn28a1ut001xxwznt7hqcnf3	ProfnastilType	cmmkg5vsj0000yh665v5bnysy	fullWidth	1200	1150	cmmi7hme100004hon3yvy52df	2026-03-22 20:47:22.086
cmn28a1uv0021xwznstn0ef7k	ProfnastilType	cmmkg5vsj0000yh665v5bnysy	usefulWidth	1150	1100	cmmi7hme100004hon3yvy52df	2026-03-22 20:47:22.087
cmn28a1uw0023xwznslwz0yei	ProfnastilType	cmmkg5vsj0000yh665v5bnysy	purchasePricePerLinearMeter	null	500	cmmi7hme100004hon3yvy52df	2026-03-22 20:47:22.088
cmn28a1ux0025xwznbbw60ms5	ProfnastilType	cmmkg5vsj0000yh665v5bnysy	purchasePricePerUnit	500	1000	cmmi7hme100004hon3yvy52df	2026-03-22 20:47:22.089
cmn28a1uy0027xwznlunr4p91	ProfnastilType	cmmkg5vsj0000yh665v5bnysy	retailPricePerUnit	550	1200	cmmi7hme100004hon3yvy52df	2026-03-22 20:47:22.09
cmn28a1uz0029xwzn4rs7xsq7	ProfnastilType	cmmkg5vsj0000yh665v5bnysy	createdAt	"2026-03-10T10:08:13.363Z"	"2026-03-10T10:08:13.363Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:47:22.091
cmn28a1v0002bxwzn44l2xpqt	ProfnastilType	cmmkg5vsj0000yh665v5bnysy	updatedAt	"2026-03-11T17:37:09.595Z"	"2026-03-22T20:47:22.083Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:47:22.093
cmn28ag0r002dxwzn6rr9ywcp	ProfnastilType	cmmkg7cuz0001yh66p0ihxyb3	fullWidth	1200	1150	cmmi7hme100004hon3yvy52df	2026-03-22 20:47:40.443
cmn28ag0s002fxwznddtmr5hp	ProfnastilType	cmmkg7cuz0001yh66p0ihxyb3	usefulWidth	1150	1100	cmmi7hme100004hon3yvy52df	2026-03-22 20:47:40.445
cmn28ag0u002hxwznuziuu85g	ProfnastilType	cmmkg7cuz0001yh66p0ihxyb3	createdAt	"2026-03-10T10:09:22.139Z"	"2026-03-10T10:09:22.139Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:47:40.446
cmn28ag0v002jxwzn2nht9vcy	ProfnastilType	cmmkg7cuz0001yh66p0ihxyb3	updatedAt	"2026-03-22T20:45:37.610Z"	"2026-03-22T20:47:40.437Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:47:40.447
cmn28bu3w002lxwznshm7qxzh	ProfnastilType	cmmpzqfqq0006qhz11mqej9ik	deleted	{"id": "cmmpzqfqq0006qhz11mqej9ik", "name": "С 8-1150 лист оцинкованный 0,35 мм", "priority": 4}	\N	cmmi7hme100004hon3yvy52df	2026-03-22 20:48:45.356
cmn28g3hu002oxwzn64g5n333	ProfnastilType	cmn28g3hr002mxwzng5utvrbw	priority	\N	4	cmmi7hme100004hon3yvy52df	2026-03-22 20:52:04.147
cmn28h6ot002qxwznj9sb0f3d	ProfnastilType	cmmkg7cuz0001yh66p0ihxyb3	name	"С 8-1150  лист односторонний 0,4 мм"	"С 8-1150  лист односторонний 0,4 мм 2м."	cmmi7hme100004hon3yvy52df	2026-03-22 20:52:54.942
cmn28h6ov002sxwzngfgw7wlt	ProfnastilType	cmmkg7cuz0001yh66p0ihxyb3	createdAt	"2026-03-10T10:09:22.139Z"	"2026-03-10T10:09:22.139Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:52:54.944
cmn28h6ox002uxwznveg3dmdw	ProfnastilType	cmmkg7cuz0001yh66p0ihxyb3	updatedAt	"2026-03-22T20:47:40.437Z"	"2026-03-22T20:52:54.939Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:52:54.945
cmn28j5nm002xxwznxsdlhlz0	ProfnastilType	cmn28j5nk002vxwzn6949khz7	priority	\N	5	cmmi7hme100004hon3yvy52df	2026-03-22 20:54:26.914
cmn28jyfh002zxwznb9idylv1	ProfnastilType	cmmkg8een0002yh663iksgtjf	name	"С 8-1150  лист двусторонний 0,4 мм"	"С 8-1150  лист двусторонний 0,4 мм 2м."	cmmi7hme100004hon3yvy52df	2026-03-22 20:55:04.206
cmn28jyfj0031xwzne8ovcfoc	ProfnastilType	cmmkg8een0002yh663iksgtjf	createdAt	"2026-03-10T10:10:10.799Z"	"2026-03-10T10:10:10.799Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:55:04.208
cmn28jyfl0033xwznrz87t1zg	ProfnastilType	cmmkg8een0002yh663iksgtjf	updatedAt	"2026-03-22T20:46:02.219Z"	"2026-03-22T20:55:04.203Z"	cmmi7hme100004hon3yvy52df	2026-03-22 20:55:04.209
cmn28lggo0036xwznpbbmzqiu	ProfnastilType	cmn28lggm0034xwznjtqc72mr	priority	\N	6	cmmi7hme100004hon3yvy52df	2026-03-22 20:56:14.232
cmn28n9sa0039xwznd5faowmf	ProfnastilType	cmn28n9s70037xwzn6gx1jnqz	priority	\N	7	cmmi7hme100004hon3yvy52df	2026-03-22 20:57:38.89
cmn28ryrw003cxwznih89gzj8	GateType	cmn28ryrp003axwznhqf7lkyq	priority	\N	4	cmmi7hme100004hon3yvy52df	2026-03-22 21:01:17.9
cmn28tev2003fxwzn6uj5gszk	GateType	cmn28teuz003dxwznqjoksfez	priority	\N	5	cmmi7hme100004hon3yvy52df	2026-03-22 21:02:25.406
cmn28ux7l003ixwzn0ywroa8y	GateType	cmn28ux7j003gxwzn5cbcy3o9	priority	\N	6	cmmi7hme100004hon3yvy52df	2026-03-22 21:03:35.841
cmn28waqa003lxwznzl4mqj43	GateType	cmn28waq8003jxwznhpr5ev51	priority	\N	7	cmmi7hme100004hon3yvy52df	2026-03-22 21:04:40.019
cmn28xoox003oxwzn81bn8swe	GateType	cmn28xoov003mxwznszgbu1re	priority	\N	8	cmmi7hme100004hon3yvy52df	2026-03-22 21:05:44.769
cmn28yzuz003rxwzn3ond2l23	GateType	cmn28yzuy003pxwzn2m0ouyyl	priority	\N	9	cmmi7hme100004hon3yvy52df	2026-03-22 21:06:45.9
cmn28zw8r003txwzn2qwvtrm2	GateType	cmmkvv9it0008vp8puadb1zqx	createdAt	"2026-03-10T17:27:51.796Z"	"2026-03-10T17:27:51.796Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:07:27.867
cmn28zw8t003vxwznm9kn2at0	GateType	cmmkvv9it0008vp8puadb1zqx	updatedAt	"2026-03-10T18:48:10.873Z"	"2026-03-22T21:07:27.864Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:07:27.869
cmn290s8m003xxwznnuiidu9x	GateType	cmn28teuz003dxwznqjoksfez	type	"Распашные"	"Откатные"	cmmi7hme100004hon3yvy52df	2026-03-22 21:08:09.334
cmn290s8n003zxwznrxho63vx	GateType	cmn28teuz003dxwznqjoksfez	createdAt	"2026-03-22T21:02:25.403Z"	"2026-03-22T21:02:25.403Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:08:09.336
cmn290s8q0041xwzn33t2s677	GateType	cmn28teuz003dxwznqjoksfez	updatedAt	"2026-03-22T21:02:25.403Z"	"2026-03-22T21:08:09.331Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:08:09.338
cmn29169e0043xwznu38ch3a7	GateType	cmn28ux7j003gxwzn5cbcy3o9	type	"Распашные"	"Откатные"	cmmi7hme100004hon3yvy52df	2026-03-22 21:08:27.507
cmn29169h0045xwznvsknnaig	GateType	cmn28ux7j003gxwzn5cbcy3o9	createdAt	"2026-03-22T21:03:35.839Z"	"2026-03-22T21:03:35.839Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:08:27.509
cmn29169j0047xwznj0x0b58h	GateType	cmn28ux7j003gxwzn5cbcy3o9	updatedAt	"2026-03-22T21:03:35.839Z"	"2026-03-22T21:08:27.504Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:08:27.511
cmn291cfz0049xwznht90ep7f	GateType	cmn28waq8003jxwznhpr5ev51	type	"Распашные"	"Откатные"	cmmi7hme100004hon3yvy52df	2026-03-22 21:08:35.519
cmn291cg2004bxwzn1anbu6a0	GateType	cmn28waq8003jxwznhpr5ev51	createdAt	"2026-03-22T21:04:40.016Z"	"2026-03-22T21:04:40.016Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:08:35.522
cmn291cg3004dxwzn0tex6zi6	GateType	cmn28waq8003jxwznhpr5ev51	updatedAt	"2026-03-22T21:04:40.016Z"	"2026-03-22T21:08:35.516Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:08:35.524
cmn291p28004fxwznsqry6i08	GateType	cmn28xoov003mxwznszgbu1re	purchasePrice	23999.98	24000	cmmi7hme100004hon3yvy52df	2026-03-22 21:08:51.872
cmn291p2d004hxwznh7zwvtvy	GateType	cmn28xoov003mxwznszgbu1re	createdAt	"2026-03-22T21:05:44.767Z"	"2026-03-22T21:05:44.767Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:08:51.877
cmn291p2h004jxwznpnachsmp	GateType	cmn28xoov003mxwznszgbu1re	updatedAt	"2026-03-22T21:05:44.767Z"	"2026-03-22T21:08:51.871Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:08:51.881
cmn291vs4004nxwzniajx7g2q	GateType	cmn28xoov003mxwznszgbu1re	type	"Распашные"	"Откатные"	cmmi7hme100004hon3yvy52df	2026-03-22 21:09:00.58
cmn291vs9004pxwznrpxrqgwd	GateType	cmn28xoov003mxwznszgbu1re	createdAt	"2026-03-22T21:05:44.767Z"	"2026-03-22T21:05:44.767Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:09:00.585
cmn291vse004rxwzn9xl9dmvt	GateType	cmn28xoov003mxwznszgbu1re	updatedAt	"2026-03-22T21:08:51.871Z"	"2026-03-22T21:09:00.578Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:09:00.591
cmn292beu004txwznmbmx57sm	GateType	cmn28yzuy003pxwzn2m0ouyyl	type	"Распашные"	"Откатные"	cmmi7hme100004hon3yvy52df	2026-03-22 21:09:20.839
cmn292bew004xxwznjldahgc2	GateType	cmn28yzuy003pxwzn2m0ouyyl	purchasePrice	26999.97	27000	cmmi7hme100004hon3yvy52df	2026-03-22 21:09:20.841
cmn292bf0004zxwznvriaeitf	GateType	cmn28yzuy003pxwzn2m0ouyyl	createdAt	"2026-03-22T21:06:45.898Z"	"2026-03-22T21:06:45.898Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:09:20.845
cmn292bf30051xwznapuomz9l	GateType	cmn28yzuy003pxwzn2m0ouyyl	updatedAt	"2026-03-22T21:06:45.898Z"	"2026-03-22T21:09:20.837Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:09:20.847
cmn294pin0054xwzn1am7gejj	GateType	cmn294pil0052xwznpnr5adap	priority	\N	10	cmmi7hme100004hon3yvy52df	2026-03-22 21:11:12.432
cmn295soc0057xwzn2zhr8cgy	GateType	cmn295sob0055xwzn6dyo7588	priority	\N	11	cmmi7hme100004hon3yvy52df	2026-03-22 21:12:03.181
cmn298hsf005axwznh07mx370	GateType	cmn298hsd0058xwznzimsi8vh	priority	\N	12	cmmi7hme100004hon3yvy52df	2026-03-22 21:14:09.039
cmn298te5005cxwznfkarhrpc	GateType	cmn295sob0055xwzn6dyo7588	name	"Ворота распашные (комплект) 3м."	"Ворота распашные (комплект) 3м. -2м."	cmmi7hme100004hon3yvy52df	2026-03-22 21:14:24.077
cmn298te6005exwzno7q4w8e3	GateType	cmn295sob0055xwzn6dyo7588	createdAt	"2026-03-22T21:12:03.179Z"	"2026-03-22T21:12:03.179Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:14:24.079
cmn298te8005gxwznxhf36k3s	GateType	cmn295sob0055xwzn6dyo7588	updatedAt	"2026-03-22T21:12:03.179Z"	"2026-03-22T21:14:24.075Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:14:24.081
cmn2992td005ixwzn0v0j7eme	GateType	cmn295sob0055xwzn6dyo7588	name	"Ворота распашные (комплект) 3м. -2м."	"Ворота распашные (комплект) 3м. - 2м."	cmmi7hme100004hon3yvy52df	2026-03-22 21:14:36.289
cmn2992tf005kxwznju9wemkq	GateType	cmn295sob0055xwzn6dyo7588	createdAt	"2026-03-22T21:12:03.179Z"	"2026-03-22T21:12:03.179Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:14:36.292
cmn2992th005mxwzntwega2nm	GateType	cmn295sob0055xwzn6dyo7588	updatedAt	"2026-03-22T21:14:24.075Z"	"2026-03-22T21:14:36.287Z"	cmmi7hme100004hon3yvy52df	2026-03-22 21:14:36.293
cmn2q4yds005xxwznuct5iw2j	MountingHardware	cmmoouq3g0006z3ah50db6zpq	createdAt	"2026-03-13T09:22:34.002Z"	"2026-03-13T09:22:34.002Z"	cmmi7hme100004hon3yvy52df	2026-03-23 05:07:17.392
cmn2q4ydu005zxwznbnf64a72	MountingHardware	cmmoouq3g0006z3ah50db6zpq	updatedAt	"2026-03-13T10:47:06.936Z"	"2026-03-23T05:07:17.389Z"	cmmi7hme100004hon3yvy52df	2026-03-23 05:07:17.394
cmn2q7lt20067xwznxwk7y14z	MountingHardware	cmn2q7lsv0060xwzn6jn29pna	created	\N	{"name": "Заглушка пластиковая 60х60"}	cmmi7hme100004hon3yvy52df	2026-03-23 05:09:21.062
cmn2s5dkp006axwznkzcf2w8m	GateType	cmn2s5dkb0068xwznahdyifx1	priority	\N	13	cmmi7hme100004hon3yvy52df	2026-03-23 06:03:36.313
cmn2s85tm006dxwzndykzvym4	GateType	cmn2s85tj006bxwzna72y88la	priority	\N	14	cmmi7hme100004hon3yvy52df	2026-03-23 06:05:46.235
cmn2s9h7s006gxwznbafalgyb	GateType	cmn2s9h7m006exwzn97r7w2io	priority	\N	15	cmmi7hme100004hon3yvy52df	2026-03-23 06:06:47.657
cmn2sasog006jxwzntq5wyftr	GateType	cmn2sasof006hxwzn6nwcskh5	priority	\N	16	cmmi7hme100004hon3yvy52df	2026-03-23 06:07:49.169
cmn2sc7z6006mxwznnu9wnu7z	GateType	cmn2sc7z2006kxwzn4c9cvb3f	priority	\N	17	cmmi7hme100004hon3yvy52df	2026-03-23 06:08:55.65
cmn2scky5006oxwznazr6a09s	GateType	cmn2sasof006hxwzn6nwcskh5	purchasePrice	7349.99	7350	cmmi7hme100004hon3yvy52df	2026-03-23 06:09:12.461
cmn2scky7006sxwzn8o03et2j	GateType	cmn2sasof006hxwzn6nwcskh5	createdAt	"2026-03-23T06:07:49.167Z"	"2026-03-23T06:07:49.167Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:09:12.463
cmn2scky8006uxwzn3ih3s5cl	GateType	cmn2sasof006hxwzn6nwcskh5	updatedAt	"2026-03-23T06:07:49.167Z"	"2026-03-23T06:09:12.459Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:09:12.465
cmn2sdx61006xxwzn9dxlrq9n	GateType	cmn2sdx5z006vxwznydrlbjes	priority	\N	18	cmmi7hme100004hon3yvy52df	2026-03-23 06:10:14.954
cmn2siuxu006zxwznhfjmxwhy	GateType	cmmkvv9it0008vp8puadb1zqx	retailPrice	10000	13450	cmmi7hme100004hon3yvy52df	2026-03-23 06:14:05.347
cmn2siuy40071xwznd4t6456k	GateType	cmmkvv9it0008vp8puadb1zqx	createdAt	"2026-03-10T17:27:51.796Z"	"2026-03-10T17:27:51.796Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:14:05.357
cmn2siuya0073xwzn5ne4489s	GateType	cmmkvv9it0008vp8puadb1zqx	updatedAt	"2026-03-22T21:07:27.864Z"	"2026-03-23T06:14:05.344Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:14:05.363
cmn2sj5eo0079xwznw8r6103c	GateType	cmn294pil0052xwznpnr5adap	retailPrice	13200	13600	cmmi7hme100004hon3yvy52df	2026-03-23 06:14:18.912
cmn2sj5eq007bxwznoflowohi	GateType	cmn294pil0052xwznpnr5adap	createdAt	"2026-03-22T21:11:12.430Z"	"2026-03-22T21:11:12.430Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:14:18.914
cmn2sj5er007dxwznxh006skz	GateType	cmn294pil0052xwznpnr5adap	updatedAt	"2026-03-22T21:11:12.430Z"	"2026-03-23T06:14:18.909Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:14:18.915
cmn2skpe9007fxwzno3gm60z0	GateType	cmn2sdx5z006vxwznydrlbjes	retailPrice	13000	13499.99	cmmi7hme100004hon3yvy52df	2026-03-23 06:15:31.474
cmn2skpec007jxwznk4cst5t5	GateType	cmn2sdx5z006vxwznydrlbjes	createdAt	"2026-03-23T06:10:14.952Z"	"2026-03-23T06:10:14.952Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:15:31.476
cmn2skpee007lxwznqnhbwmda	GateType	cmn2sdx5z006vxwznydrlbjes	updatedAt	"2026-03-23T06:10:14.952Z"	"2026-03-23T06:15:31.471Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:15:31.478
cmn2smaug007oxwzntwnm4b3i	GateType	cmn2smaue007mxwznsghp78yp	priority	\N	19	cmmi7hme100004hon3yvy52df	2026-03-23 06:16:45.929
cmn2smn5z007qxwzn5qltizhc	GateType	cmn2sc7z2006kxwzn4c9cvb3f	sectionWidth	40	60	cmmi7hme100004hon3yvy52df	2026-03-23 06:17:01.895
cmn2smn60007sxwzn8cssnw5u	GateType	cmn2sc7z2006kxwzn4c9cvb3f	createdAt	"2026-03-23T06:08:55.627Z"	"2026-03-23T06:08:55.627Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:17:01.897
cmn2smn62007uxwznr4lpswi9	GateType	cmn2sc7z2006kxwzn4c9cvb3f	updatedAt	"2026-03-23T06:08:55.627Z"	"2026-03-23T06:17:01.893Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:17:01.898
cmn2smuu6007wxwzns4e112lq	GateType	cmn2sasof006hxwzn6nwcskh5	sectionWidth	40	60	cmmi7hme100004hon3yvy52df	2026-03-23 06:17:11.838
cmn2smuu8007yxwznyomye6qf	GateType	cmn2sasof006hxwzn6nwcskh5	createdAt	"2026-03-23T06:07:49.167Z"	"2026-03-23T06:07:49.167Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:17:11.84
cmn2smuua0080xwznqn21k9ih	GateType	cmn2sasof006hxwzn6nwcskh5	updatedAt	"2026-03-23T06:09:12.459Z"	"2026-03-23T06:17:11.836Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:17:11.843
cmn2snz4y0083xwznhkh09h7o	GateType	cmn2snz4w0081xwzne2hjh461	priority	\N	20	cmmi7hme100004hon3yvy52df	2026-03-23 06:18:04.066
cmn2soff40085xwzn1z2gfakt	GateType	cmn2snz4w0081xwzne2hjh461	name	"распашные (комплект) L-4м. - h-2м"	"Ворота распашные (комплект) L-4м. - h-2м"	cmmi7hme100004hon3yvy52df	2026-03-23 06:18:25.169
cmn2soff70087xwzn2wnbvslg	GateType	cmn2snz4w0081xwzne2hjh461	createdAt	"2026-03-23T06:18:04.064Z"	"2026-03-23T06:18:04.064Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:18:25.171
cmn2soff80089xwznr9jnnav6	GateType	cmn2snz4w0081xwzne2hjh461	updatedAt	"2026-03-23T06:18:04.064Z"	"2026-03-23T06:18:25.167Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:18:25.173
cmn2sqj9z008cxwzn1pur8eg4	GateType	cmn2sqj9x008axwznl9df87kc	priority	\N	21	cmmi7hme100004hon3yvy52df	2026-03-23 06:20:03.479
cmn2sre7r008fxwzndkpou5k9	GateType	cmn2sre7p008dxwzns2v83do2	priority	\N	22	cmmi7hme100004hon3yvy52df	2026-03-23 06:20:43.576
cmn2ss6mu008hxwznlv298aph	GateType	cmn298hsd0058xwznzimsi8vh	name	"Ворота распашные (комплект) 3м. - 2,5м"	"Ворота распашные (комплект) L-3м. - h-2,5м"	cmmi7hme100004hon3yvy52df	2026-03-23 06:21:20.407
cmn2ss6mw008jxwznu1q8wt46	GateType	cmn298hsd0058xwznzimsi8vh	sectionWidth	40	60	cmmi7hme100004hon3yvy52df	2026-03-23 06:21:20.409
cmn2ss6mx008lxwznk7hhhcut	GateType	cmn298hsd0058xwznzimsi8vh	createdAt	"2026-03-22T21:14:09.037Z"	"2026-03-22T21:14:09.037Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:21:20.41
cmn2ss6mz008nxwzn0j68j2ht	GateType	cmn298hsd0058xwznzimsi8vh	updatedAt	"2026-03-22T21:14:09.037Z"	"2026-03-23T06:21:20.405Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:21:20.411
cmn2ssyn6008pxwznh6i5x7np	GateType	cmn295sob0055xwzn6dyo7588	name	"Ворота распашные (комплект) 3м. - 2м."	"Ворота распашные (комплект) L-3м. - h- 2м."	cmmi7hme100004hon3yvy52df	2026-03-23 06:21:56.706
cmn2ssyn7008rxwznr5vmf1id	GateType	cmn295sob0055xwzn6dyo7588	sectionWidth	40	60	cmmi7hme100004hon3yvy52df	2026-03-23 06:21:56.707
cmn2ssyna008txwzno723wt1v	GateType	cmn295sob0055xwzn6dyo7588	createdAt	"2026-03-22T21:12:03.179Z"	"2026-03-22T21:12:03.179Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:21:56.71
cmn2ssynb008vxwzny15s6sh2	GateType	cmn295sob0055xwzn6dyo7588	updatedAt	"2026-03-22T21:14:36.287Z"	"2026-03-23T06:21:56.704Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:21:56.711
cmn2su13d008xxwznh053a508	GateType	cmn294pil0052xwznpnr5adap	name	"Ворота распашные (комплект) 3м."	"Ворота распашные (комплект) L-3м. h-1,8м"	cmmi7hme100004hon3yvy52df	2026-03-23 06:22:46.537
cmn2su13f008zxwznjl4h8egm	GateType	cmn294pil0052xwznpnr5adap	sectionWidth	40	60	cmmi7hme100004hon3yvy52df	2026-03-23 06:22:46.539
cmn2su13g0091xwznsf2lw6iu	GateType	cmn294pil0052xwznpnr5adap	createdAt	"2026-03-22T21:11:12.430Z"	"2026-03-22T21:11:12.430Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:22:46.54
cmn2su13h0093xwznjd5sff9e	GateType	cmn294pil0052xwznpnr5adap	updatedAt	"2026-03-23T06:14:18.909Z"	"2026-03-23T06:22:46.535Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:22:46.542
cmn2sv55m0095xwznvd78x81y	GateType	cmn28yzuy003pxwzn2m0ouyyl	name	"Ворота откатные (комплект) 5м."	"Ворота откатные (комплект) L-5м. h-1,75м."	cmmi7hme100004hon3yvy52df	2026-03-23 06:23:38.459
cmn2sv55o0097xwznezd9pg33	GateType	cmn28yzuy003pxwzn2m0ouyyl	sectionWidth	40	60	cmmi7hme100004hon3yvy52df	2026-03-23 06:23:38.46
cmn2sv55p0099xwzntcbpqpyu	GateType	cmn28yzuy003pxwzn2m0ouyyl	sectionHeight	20	40	cmmi7hme100004hon3yvy52df	2026-03-23 06:23:38.462
cmn2sv55q009bxwznklk7jwc8	GateType	cmn28yzuy003pxwzn2m0ouyyl	createdAt	"2026-03-22T21:06:45.898Z"	"2026-03-22T21:06:45.898Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:23:38.463
cmn2sv55r009dxwzn29ed53vd	GateType	cmn28yzuy003pxwzn2m0ouyyl	updatedAt	"2026-03-22T21:09:20.837Z"	"2026-03-23T06:23:38.452Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:23:38.464
cmn2svxlp009fxwznivtnrg00	GateType	cmn28xoov003mxwznszgbu1re	name	"Ворота откатные (комплект) 3,5м."	"Ворота откатные (комплект) L-3,5м. h-1,95м."	cmmi7hme100004hon3yvy52df	2026-03-23 06:24:15.326
cmn2svxlr009hxwznmr983nwf	GateType	cmn28xoov003mxwznszgbu1re	sectionWidth	40	60	cmmi7hme100004hon3yvy52df	2026-03-23 06:24:15.328
cmn2svxlt009jxwznfcjuqt3y	GateType	cmn28xoov003mxwznszgbu1re	sectionHeight	20	40	cmmi7hme100004hon3yvy52df	2026-03-23 06:24:15.329
cmn2svxlu009lxwznilvos3rl	GateType	cmn28xoov003mxwznszgbu1re	createdAt	"2026-03-22T21:05:44.767Z"	"2026-03-22T21:05:44.767Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:24:15.33
cmn2svxlv009nxwzntx1oo6fu	GateType	cmn28xoov003mxwznszgbu1re	updatedAt	"2026-03-22T21:09:00.578Z"	"2026-03-23T06:24:15.323Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:24:15.332
cmn2swkyy009pxwznlmt3m08k	GateType	cmn28waq8003jxwznhpr5ev51	name	"Ворота откатные (комплект) 3,5м."	"Ворота откатные (комплект) L-3,5м. h-1,75м."	cmmi7hme100004hon3yvy52df	2026-03-23 06:24:45.61
cmn2swkyz009rxwznsaxl40zu	GateType	cmn28waq8003jxwznhpr5ev51	sectionWidth	40	60	cmmi7hme100004hon3yvy52df	2026-03-23 06:24:45.611
cmn2swkz0009txwzn12mzuagg	GateType	cmn28waq8003jxwznhpr5ev51	sectionHeight	20	40	cmmi7hme100004hon3yvy52df	2026-03-23 06:24:45.613
cmn2swkz1009vxwznnsklbmdu	GateType	cmn28waq8003jxwznhpr5ev51	createdAt	"2026-03-22T21:04:40.016Z"	"2026-03-22T21:04:40.016Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:24:45.614
cmn2swkz3009xxwznuj2cdkkg	GateType	cmn28waq8003jxwznhpr5ev51	updatedAt	"2026-03-22T21:08:35.516Z"	"2026-03-23T06:24:45.608Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:24:45.615
cmn2sx3e3009zxwznf65282yg	GateType	cmn28ux7j003gxwzn5cbcy3o9	name	"Ворота откатные (комплект) 3м."	"Ворота откатные (комплект) L-3м. h-1,95м."	cmmi7hme100004hon3yvy52df	2026-03-23 06:25:09.483
cmn2sx3e400a1xwznrlqkfedy	GateType	cmn28ux7j003gxwzn5cbcy3o9	sectionWidth	40	60	cmmi7hme100004hon3yvy52df	2026-03-23 06:25:09.485
cmn2sx3e500a3xwznpqpeg393	GateType	cmn28ux7j003gxwzn5cbcy3o9	sectionHeight	20	35	cmmi7hme100004hon3yvy52df	2026-03-23 06:25:09.486
cmn2sx3e700a5xwznabb6lfii	GateType	cmn28ux7j003gxwzn5cbcy3o9	createdAt	"2026-03-22T21:03:35.839Z"	"2026-03-22T21:03:35.839Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:25:09.487
cmn2sx3e800a7xwznw5d94jwu	GateType	cmn28ux7j003gxwzn5cbcy3o9	updatedAt	"2026-03-22T21:08:27.504Z"	"2026-03-23T06:25:09.481Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:25:09.489
cmn2sxjgm00a9xwznm0jrwok0	GateType	cmn28teuz003dxwznqjoksfez	name	"Ворота откатные (комплект) 4м."	"Ворота откатные (комплект) L-4м. h-1,75м."	cmmi7hme100004hon3yvy52df	2026-03-23 06:25:30.311
cmn2sxjgn00abxwznm1iek19z	GateType	cmn28teuz003dxwznqjoksfez	sectionWidth	40	60	cmmi7hme100004hon3yvy52df	2026-03-23 06:25:30.312
cmn2sxjgp00adxwznzl3r1vsb	GateType	cmn28teuz003dxwznqjoksfez	sectionHeight	20	40	cmmi7hme100004hon3yvy52df	2026-03-23 06:25:30.313
cmn2sxjgq00afxwznpaiscdqg	GateType	cmn28teuz003dxwznqjoksfez	createdAt	"2026-03-22T21:02:25.403Z"	"2026-03-22T21:02:25.403Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:25:30.314
cmn2sxjgr00ahxwzn7e6bvp8k	GateType	cmn28teuz003dxwznqjoksfez	updatedAt	"2026-03-22T21:08:09.331Z"	"2026-03-23T06:25:30.309Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:25:30.315
cmn2sy26t00ajxwznrog7tavb	GateType	cmn28ryrp003axwznhqf7lkyq	name	"Ворота откатные (комплект) 5м."	"Ворота откатные (комплект) L-5м. h-1,95м."	cmmi7hme100004hon3yvy52df	2026-03-23 06:25:54.581
cmn2sy26u00alxwznxjnq23jm	GateType	cmn28ryrp003axwznhqf7lkyq	sectionWidth	40	60	cmmi7hme100004hon3yvy52df	2026-03-23 06:25:54.582
cmn2sy26v00anxwznveeqqwcr	GateType	cmn28ryrp003axwznhqf7lkyq	sectionHeight	20	40	cmmi7hme100004hon3yvy52df	2026-03-23 06:25:54.583
cmn2sy26w00apxwznbtch8mcf	GateType	cmn28ryrp003axwznhqf7lkyq	createdAt	"2026-03-22T21:01:17.894Z"	"2026-03-22T21:01:17.894Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:25:54.585
cmn2sy26x00arxwzni9kluabd	GateType	cmn28ryrp003axwznhqf7lkyq	updatedAt	"2026-03-22T21:01:17.894Z"	"2026-03-23T06:25:54.579Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:25:54.586
cmn2syxba00atxwzn3b6eacv9	GateType	cmmkvv9it0008vp8puadb1zqx	name	"Ворота распашные (комплект) 3м."	"Ворота распашные (комплект) L-3м. h-1,5м."	cmmi7hme100004hon3yvy52df	2026-03-23 06:26:34.918
cmn2syxbb00avxwznru17p2rj	GateType	cmmkvv9it0008vp8puadb1zqx	sectionWidth	40	60	cmmi7hme100004hon3yvy52df	2026-03-23 06:26:34.92
cmn2syxbc00axxwzn0q7wmyfu	GateType	cmmkvv9it0008vp8puadb1zqx	sectionHeight	20	38	cmmi7hme100004hon3yvy52df	2026-03-23 06:26:34.921
cmn2syxbd00azxwznu1qqop7e	GateType	cmmkvv9it0008vp8puadb1zqx	createdAt	"2026-03-10T17:27:51.796Z"	"2026-03-10T17:27:51.796Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:26:34.922
cmn2syxbf00b1xwznnwiryv8i	GateType	cmmkvv9it0008vp8puadb1zqx	updatedAt	"2026-03-23T06:14:05.344Z"	"2026-03-23T06:26:34.917Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:26:34.923
cmn2szh7w00b3xwznqedz84v7	GateType	cmmkvt4pn0001vp8ptlxwsyip	name	"Ворота откатные (комплект) 4м."	"Ворота откатные (комплект) L-4м. h-1,95м."	cmmi7hme100004hon3yvy52df	2026-03-23 06:27:00.716
cmn2szh7x00b5xwznz2tvr4fr	GateType	cmmkvt4pn0001vp8ptlxwsyip	sectionWidth	40	60	cmmi7hme100004hon3yvy52df	2026-03-23 06:27:00.717
cmn2szh7y00b7xwznpngs96ar	GateType	cmmkvt4pn0001vp8ptlxwsyip	sectionHeight	20	40	cmmi7hme100004hon3yvy52df	2026-03-23 06:27:00.718
cmn2szh7z00b9xwzn4x1db6aa	GateType	cmmkvt4pn0001vp8ptlxwsyip	createdAt	"2026-03-10T17:26:12.241Z"	"2026-03-10T17:26:12.241Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:27:00.72
cmn2szh8000bbxwznwoop83lb	GateType	cmmkvt4pn0001vp8ptlxwsyip	updatedAt	"2026-03-14T15:21:15.264Z"	"2026-03-23T06:27:00.715Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:27:00.721
cmn2szvwg00bdxwznf33dsezw	GateType	cmmkvqw8o0000vp8pk57c1l9w	name	"Ворота откатные (комплект) 3м."	"Ворота откатные (комплект) L-3м. h-1,75м."	cmmi7hme100004hon3yvy52df	2026-03-23 06:27:19.744
cmn2szvwi00bfxwznanbqdzlf	GateType	cmmkvqw8o0000vp8pk57c1l9w	sectionWidth	40	60	cmmi7hme100004hon3yvy52df	2026-03-23 06:27:19.747
cmn2szvwj00bhxwzngxzvt55l	GateType	cmmkvqw8o0000vp8pk57c1l9w	sectionHeight	20	40	cmmi7hme100004hon3yvy52df	2026-03-23 06:27:19.748
cmn2szvwm00bjxwzn2v93bnpz	GateType	cmmkvqw8o0000vp8pk57c1l9w	createdAt	"2026-03-10T17:24:27.958Z"	"2026-03-10T17:24:27.958Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:27:19.75
cmn2szvwp00blxwznw2bt7g4m	GateType	cmmkvqw8o0000vp8pk57c1l9w	updatedAt	"2026-03-10T18:48:10.870Z"	"2026-03-23T06:27:19.740Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:27:19.753
cmn2t26ns00bwxwznhau0e4qo	Work	cmmqh2fr20000pxfpwirkmd3k	createdAt	"2026-03-14T15:20:09.278Z"	"2026-03-14T15:20:09.278Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:29:07.001
cmn2t26nx00byxwzn89s7kp27	Work	cmmqh2fr20000pxfpwirkmd3k	updatedAt	"2026-03-14T15:21:46.746Z"	"2026-03-23T06:29:06.997Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:29:07.005
cmn2t361z00c0xwzn1oe18yny	WicketType	cmmkxk7ka0000zs6bbdoa5fi2	name	"Калитка в покраске (Комплект) 2м"	"Калитка в покраске (Комплект) L-2м. h-1м."	cmmi7hme100004hon3yvy52df	2026-03-23 06:29:52.871
cmn2t362000c2xwznvtkrsgoa	WicketType	cmmkxk7ka0000zs6bbdoa5fi2	createdAt	"2026-03-10T18:15:15.264Z"	"2026-03-10T18:15:15.264Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:29:52.873
cmn2t362200c4xwznu6e090mb	WicketType	cmmkxk7ka0000zs6bbdoa5fi2	updatedAt	"2026-03-10T18:48:10.876Z"	"2026-03-23T06:29:52.869Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:29:52.874
cmn2t6wm500c7xwznvccr32oa	ProfnastilType	cmn2t6wm200c5xwznw3htjrlf	priority	\N	8	cmmi7hme100004hon3yvy52df	2026-03-23 06:32:47.261
cmn2t8l4g00caxwzn8mspmpx0	ProfnastilType	cmn2t8l4d00c8xwzn5d6msnvp	priority	\N	9	cmmi7hme100004hon3yvy52df	2026-03-23 06:34:05.681
cmn2t9pmo00cdxwzn5m4qmmv8	ProfnastilType	cmn2t9pmn00cbxwzntr63c16o	priority	\N	10	cmmi7hme100004hon3yvy52df	2026-03-23 06:34:58.177
cmn2tar9t00cfxwznjbk3k7pw	ProfnastilType	cmn2t8l4d00c8xwzn5d6msnvp	deleted	{"id": "cmn2t8l4d00c8xwzn5d6msnvp", "name": "С 8-1150 лист односторонний 0,4 мм 2,2м.", "priority": 9}	\N	cmmi7hme100004hon3yvy52df	2026-03-23 06:35:46.962
cmn2tara000cixwzngowq0lsg	ProfnastilType	cmn2t9pmn00cbxwzntr63c16o	priority	10	9	cmmi7hme100004hon3yvy52df	2026-03-23 06:35:46.968
cmn2tc4mu00clxwzn74xlq4db	ProfnastilType	cmn2tc4ms00cjxwzn10eoap9z	priority	\N	10	cmmi7hme100004hon3yvy52df	2026-03-23 06:36:50.935
cmn2tci4100cnxwznzgnfjspe	ProfnastilType	cmn2tc4ms00cjxwzn10eoap9z	deleted	{"id": "cmn2tc4ms00cjxwzn10eoap9z", "name": "С 8-1150 лист двусторонний 0,4 мм 1,8м.", "priority": 10}	\N	cmmi7hme100004hon3yvy52df	2026-03-23 06:37:08.402
cmn2td3w900cpxwzn9swkah2d	ProfnastilType	cmn28g3hr002mxwzng5utvrbw	coating	"Полимерное (двустороннее)"	"Полимерное (одностороннее)"	cmmi7hme100004hon3yvy52df	2026-03-23 06:37:36.633
cmn2td3wd00crxwzn450wkf67	ProfnastilType	cmn28g3hr002mxwzng5utvrbw	createdAt	"2026-03-22T20:52:04.143Z"	"2026-03-22T20:52:04.143Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:37:36.638
cmn2td3wh00ctxwznyux4zwf0	ProfnastilType	cmn28g3hr002mxwzng5utvrbw	updatedAt	"2026-03-22T20:52:04.143Z"	"2026-03-23T06:37:36.630Z"	cmmi7hme100004hon3yvy52df	2026-03-23 06:37:36.642
cmn2tdwnm00cwxwzn5kp1tnc8	ProfnastilType	cmn2tdwnl00cuxwzn3eby1h0p	priority	\N	10	cmmi7hme100004hon3yvy52df	2026-03-23 06:38:13.907
cmn52mpiv0002q0a0h1ebyt9v	Panel3D	cmn52mpit0000q0a05bodfr79	priority	\N	1	cmmi7hme100004hon3yvy52df	2026-03-24 20:32:33.463
cmn52o8ka0007q0a0vfsi9wc7	Panel3D	cmn52o8k90005q0a0zrpo9aia	priority	\N	2	cmmi7hme100004hon3yvy52df	2026-03-24 20:33:44.795
cmn52pnus000cq0a03mb5m0eu	Panel3D	cmn52pnuq000aq0a0j5jiwoi9	priority	\N	3	cmmi7hme100004hon3yvy52df	2026-03-24 20:34:51.268
cmn52vhi0000qq0a0owqdg9zd	MountingHardware	cmn52vhhv000fq0a0e5wfkmvv	created	\N	{"name": "Саморез для профнастила"}	cmmi7hme100004hon3yvy52df	2026-03-24 20:39:22.968
cmn52xi0q000sq0a02jgioqem	FenceType	cmmkk7wg5000j13wtie0o6rcw	active	false	true	cmmi7hme100004hon3yvy52df	2026-03-24 20:40:56.954
cmn52xi0s000uq0a0mxq3zbfm	FenceType	cmmkk7wg5000j13wtie0o6rcw	createdAt	"2026-03-10T12:01:45.989Z"	"2026-03-10T12:01:45.989Z"	cmmi7hme100004hon3yvy52df	2026-03-24 20:40:56.956
cmn52xi0t000wq0a06jx0ibkc	FenceType	cmmkk7wg5000j13wtie0o6rcw	updatedAt	"2026-03-12T17:21:49.650Z"	"2026-03-24T20:40:56.952Z"	cmmi7hme100004hon3yvy52df	2026-03-24 20:40:56.958
cmn52xokn000yq0a056ior6ys	FenceType	cmmkk7wg5000j13wtie0o6rcw	name	"3D -панели"	"3D-панели"	cmmi7hme100004hon3yvy52df	2026-03-24 20:41:05.447
cmn52xoko0010q0a0sxzqefqe	FenceType	cmmkk7wg5000j13wtie0o6rcw	createdAt	"2026-03-10T12:01:45.989Z"	"2026-03-10T12:01:45.989Z"	cmmi7hme100004hon3yvy52df	2026-03-24 20:41:05.448
cmn52xokp0012q0a0gifv6owx	FenceType	cmmkk7wg5000j13wtie0o6rcw	updatedAt	"2026-03-24T20:40:56.952Z"	"2026-03-24T20:41:05.445Z"	cmmi7hme100004hon3yvy52df	2026-03-24 20:41:05.45
cmn65ejke0004e60t21dm3hpx	Work	cmn65ejk80001e60t48reno0m	created	\N	{"name": "Монтаж забора из профнастила"}	cmmi7hme100004hon3yvy52df	2026-03-25 14:37:57.518
cmn65fe8d0006e60tcgo9oq5h	PicketType	cmmkikyz40000bx5b9xcahrzr	deleted	{"id": "cmmkikyz40000bx5b9xcahrzr", "name": "металлический штакет  М П Р  образныйс полимером односторонний 0,4", "priority": 1}	\N	cmmi7hme100004hon3yvy52df	2026-03-25 14:38:37.261
cmn65in58000ae60tamg9j888	Work	cmn65in550007e60txjcb4k48	created	\N	{"name": "Монтаж забора из 3D-панели"}	cmmi7hme100004hon3yvy52df	2026-03-25 14:41:08.78
cmn6c74sm00057l4rw9soqaxu	MountingHardware	cmn6c74se00007l4rpxh3oxq4	created	\N	{"name": "Крепление 3D-панели"}	cmmi7hme100004hon3yvy52df	2026-03-25 17:48:09.095
cmn6chf8l000j7l4r5bdkd191	MountingHardware	cmn6c74se00007l4rpxh3oxq4	purchasePrice	34.96	35	cmmi7hme100004hon3yvy52df	2026-03-25 17:56:09.189
cmn6chf8o000n7l4rwnsm6tnm	MountingHardware	cmn6c74se00007l4rpxh3oxq4	createdAt	"2026-03-25T17:48:09.086Z"	"2026-03-25T17:48:09.086Z"	cmmi7hme100004hon3yvy52df	2026-03-25 17:56:09.192
cmn6chf8q000p7l4rbvr9n9ul	MountingHardware	cmn6c74se00007l4rpxh3oxq4	updatedAt	"2026-03-25T17:48:09.086Z"	"2026-03-25T17:56:09.185Z"	cmmi7hme100004hon3yvy52df	2026-03-25 17:56:09.194
cmn6cnmn600127l4rj2m2zeq3	Work	cmn6cnmmz000r7l4rdlsmcce2	created	\N	{"name": "Монтаж распашных ворот "}	cmmi7hme100004hon3yvy52df	2026-03-25 18:00:58.722
cmn6cpe4y001a7l4rit7enmbk	Work	cmn6cpe4s00137l4rcetdhr18	created	\N	{"name": "Монтаж распашных ворот"}	cmmi7hme100004hon3yvy52df	2026-03-25 18:02:21.011
cmn6dn1yw001j7l4r6nldtob0	ProfnastilType	cmn6dn1yu001h7l4r0elsg00v	priority	\N	11	cmmi7hme100004hon3yvy52df	2026-03-25 18:28:31.544
cmn6do3w0001m7l4rgglgr7zb	ProfnastilType	cmn6do3vy001k7l4rl7kha9mr	priority	\N	12	cmmi7hme100004hon3yvy52df	2026-03-25 18:29:20.688
cmn6dpzwo001p7l4rmshgsikj	ProfnastilType	cmn6dpzwm001n7l4r0564d89t	priority	\N	13	cmmi7hme100004hon3yvy52df	2026-03-25 18:30:48.841
cmn6dq75s001r7l4r9j8ox0l7	ProfnastilType	cmn6dpzwm001n7l4r0564d89t	metalThickness	0.55	0.5	cmmi7hme100004hon3yvy52df	2026-03-25 18:30:58.241
cmn6dq75u001t7l4rc9d8oc0d	ProfnastilType	cmn6dpzwm001n7l4r0564d89t	createdAt	"2026-03-25T18:30:48.838Z"	"2026-03-25T18:30:48.838Z"	cmmi7hme100004hon3yvy52df	2026-03-25 18:30:58.242
cmn6dq75v001v7l4rpu417ocy	ProfnastilType	cmn6dpzwm001n7l4r0564d89t	updatedAt	"2026-03-25T18:30:48.838Z"	"2026-03-25T18:30:58.238Z"	cmmi7hme100004hon3yvy52df	2026-03-25 18:30:58.244
cmn6dqdno001x7l4r9xjy4ul1	ProfnastilType	cmn6dpzwm001n7l4r0564d89t	metalThickness	0.5	0.4	cmmi7hme100004hon3yvy52df	2026-03-25 18:31:06.66
cmn6dqdnq001z7l4rejuqwcvn	ProfnastilType	cmn6dpzwm001n7l4r0564d89t	createdAt	"2026-03-25T18:30:48.838Z"	"2026-03-25T18:30:48.838Z"	cmmi7hme100004hon3yvy52df	2026-03-25 18:31:06.663
cmn6dqdns00217l4r2yal8spm	ProfnastilType	cmn6dpzwm001n7l4r0564d89t	updatedAt	"2026-03-25T18:30:58.238Z"	"2026-03-25T18:31:06.658Z"	cmmi7hme100004hon3yvy52df	2026-03-25 18:31:06.664
cmn6drgyv00247l4r6uoovwbg	ProfnastilType	cmn6drgys00227l4rcshby078	priority	\N	14	cmmi7hme100004hon3yvy52df	2026-03-25 18:31:57.607
cmn7jt7yl00034mqealjk4jaz	FenceType	cmmkk3wl5000113wtdqdgyxp2	active	false	true	cmmi7hme100004hon3yvy52df	2026-03-26 14:09:03.117
cmn7jt7yn00054mqeyw10qmtd	FenceType	cmmkk3wl5000113wtdqdgyxp2	createdAt	"2026-03-10T11:58:39.532Z"	"2026-03-10T11:58:39.532Z"	cmmi7hme100004hon3yvy52df	2026-03-26 14:09:03.12
cmn7jt7yp00074mqe37ja1lvs	FenceType	cmmkk3wl5000113wtdqdgyxp2	updatedAt	"2026-03-17T18:09:31.520Z"	"2026-03-26T14:09:03.114Z"	cmmi7hme100004hon3yvy52df	2026-03-26 14:09:03.121
cmn7k5tr800094mqe2cndu6b0	FenceType	cmmkk3wl5000113wtdqdgyxp2	active	true	false	cmmi7hme100004hon3yvy52df	2026-03-26 14:18:51.237
cmn7k5tra000b4mqetgg5etg7	FenceType	cmmkk3wl5000113wtdqdgyxp2	createdAt	"2026-03-10T11:58:39.532Z"	"2026-03-10T11:58:39.532Z"	cmmi7hme100004hon3yvy52df	2026-03-26 14:18:51.239
cmn7k5trc000d4mqeji9j7j5q	FenceType	cmmkk3wl5000113wtdqdgyxp2	updatedAt	"2026-03-26T14:09:03.114Z"	"2026-03-26T14:18:51.234Z"	cmmi7hme100004hon3yvy52df	2026-03-26 14:18:51.24
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Review" (id, name, text, rating, image, active, "sortOrder", "createdAt", "updatedAt") FROM stdin;
cmmi7hmeg000m4hon0eul698p	Алексей Петров	Отличная работа! Забор установлен быстро и качественно. Рекомендую!	5	\N	t	1	2026-03-08 20:29:52.168	2026-03-08 20:29:52.168
cmmi7hmeg000n4honyum8yu4x	Мария Иванова	Заказывала навес для автомобиля. Всё сделали в срок, цена адекватная.	5	\N	t	2	2026-03-08 20:29:52.168	2026-03-08 20:29:52.168
cmmi7hmeg000o4honwmp80n1s	Дмитрий Сидоров	Профессиональный подход. Калькулятор показал точную стоимость.	4	\N	t	3	2026-03-08 20:29:52.168	2026-03-08 20:29:52.168
\.


--
-- Data for Name: Setting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Setting" (id, key, value, "updatedAt") FROM stdin;
cmmi7hmeh000p4honbap6bpr6	companyName	Заборы и Навесы	2026-03-08 20:29:52.169
cmmi7hmeh000q4hon9drf1wzr	phone	+7 (900) 123-45-67	2026-03-08 20:29:52.169
cmmi7hmeh000r4hon7gsg3roi	email	info@fences.ru	2026-03-08 20:29:52.169
cmmi7hmeh000s4honv7gvu6g8	address	г. Москва, ул. Строительная, д. 15	2026-03-08 20:29:52.169
\.


--
-- Data for Name: SoilType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SoilType" (id, name, "surchargeCoef", active, "createdAt", "updatedAt") FROM stdin;
cmmi7hmee000i4honbj76h4np	Нормальный	1	t	2026-03-08 20:29:52.167	2026-03-08 20:29:52.167
cmmi7hmee000j4honomvsdlvn	Бетон/Асфальт	1.15	t	2026-03-08 20:29:52.167	2026-03-08 20:29:52.167
cmmi7hmee000k4honfs6hmpu5	Каменистый	1.25	t	2026-03-08 20:29:52.167	2026-03-08 20:29:52.167
cmmi7hmee000l4hon4ciq7tu5	Болотистый	1.4	t	2026-03-08 20:29:52.167	2026-03-08 20:29:52.167
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, name, password, role, phone, active, "lastLoginAt", "createdAt", "updatedAt") FROM stdin;
cmmi7hme700014hon9vpy4f3o	manager@fences.ru	Менеджер	$2a$10$X5YbZT5.8qLpYQ5vJz2X.8qLpYQ5vJ	MANAGER	+79001234568	t	\N	2026-03-08 20:29:52.16	2026-03-22 18:16:07.563
1a212d68-7163-40ea-bb8e-58362e74d873	new-admin@zabor-i-naves.ru	Новый Администратор	$2a$10$wLbVqWZ.4XyXk1Z9V2xKq1T2KJQ4eLXe	ADMIN	\N	t	\N	2026-03-23 09:13:51.65	2026-03-23 09:13:51.65
07bcb5df-90fb-44e2-8630-f456904c31f9	admin2@zabor-i-naves.ru	Новый Администратор 2	$2a$10$wLbVqWZ.4XyXk1Z9V2xKq1T2KJQ4eLXe	ADMIN	\N	t	\N	2026-03-23 09:17:08.414	2026-03-23 09:17:08.414
6bb323b6-9b25-4f2d-89da-b60873d67b58	admin3@zabor-i-naves.ru	Новый Администратор 3	$2a$10$wLbVqWZ.4XyXk1Z9V2xKq1T2KJQ4eLXe	ADMIN	\N	t	\N	2026-03-23 09:17:50.944	2026-03-23 09:17:50.944
cmmi7hme100004hon3yvy52df	admin@fences.ru	Администратор	$2b$10$HEp7rgRDgTPB3IpIY/LusO4HO2XyOeeH.nVtTakJwwY.owsC4YXLK	ADMIN	+79001234567	t	\N	2026-03-08 20:29:52.153	2026-03-23 12:36:14.73
\.


--
-- Data for Name: UserNotificationSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserNotificationSettings" (id, "userId", "emailNotifications", "telegramNotifications", "telegramChatId", "notifyNewOrder", "notifyStatusChange", "notifyAssignment", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WicketType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WicketType" (id, name, description, "metalThickness", "sectionWidth", "sectionHeight", "wicketHeight", "wicketLength", "retailPrice", "purchasePrice", image, active, "validFrom", "expirationDate", "createdAt", "updatedAt", priority) FROM stdin;
cmmkxk7ka0000zs6bbdoa5fi2	Калитка в покраске (Комплект) L-2м. h-1м.	КАРКАС КАЛИТКИ ( В ПОКРАСКЕ С ПОЛНОЙ КОМПЛЕКТАЦИЕЙ: ЗАДВИЖКА,ПРОУШИНЫ,РУЧКА,ПОЛОСА,ЗАГЛУШКА 80х80,ПЕТЛИ ПРИВАРЕНЫ ) СТОЛБ 80х80 мм. 1Шт  РАМА ПРОФ.ТРУБА 40х20 мм и 60х40 под ЗАМОК	2	40	20	2000	1000	4200	3200	\N	t	\N	\N	2026-03-10 18:15:15.264	2026-03-23 06:29:52.869	1
\.


--
-- Data for Name: Work; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Work" (id, name, description, category, unit, price, "useInCalculator", "sortOrder", active, "createdAt", "updatedAt") FROM stdin;
cmmpxzgds0004guk9suz4u88g	Доставка		DELIVERY	KM	100	t	0	t	2026-03-14 06:25:57.423	2026-03-14 06:25:57.423
cmmqi3tx80000tf9kn1uka5dz	Монтаж калитки		MOUNTING	PCS	3000	t	0	t	2026-03-14 15:49:13.916	2026-03-14 15:49:13.916
cmmqi66b30004tf9k0fycszns	Монтаж врезного замка		MOUNTING	PCS	1500	t	0	t	2026-03-14 15:51:03.279	2026-03-14 15:51:03.279
cmmqh2fr20000pxfpwirkmd3k	Монтаж откатных ворот	Монтаж откатных ворот	MOUNTING	PCS	20000	t	0	t	2026-03-14 15:20:09.278	2026-03-23 06:29:06.997
cmn65ejk80001e60t48reno0m	Монтаж забора из профнастила		MOUNTING	MP	1200	t	0	t	2026-03-25 14:37:57.511	2026-03-25 14:37:57.511
cmn65in550007e60txjcb4k48	Монтаж забора из 3D-панели		MOUNTING	MP	1100	t	0	t	2026-03-25 14:41:08.777	2026-03-25 14:41:08.777
cmn6cnmmz000r7l4rdlsmcce2	Монтаж распашных ворот 		MOUNTING	PCS	16000	t	0	t	2026-03-25 18:00:58.715	2026-03-25 18:00:58.715
cmn6cpe4s00137l4rcetdhr18	Монтаж распашных ворот		MOUNTING	PCS	20000	t	0	t	2026-03-25 18:02:20.985	2026-03-25 18:02:20.985
\.


--
-- Data for Name: WorkPrice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorkPrice" (id, name, category, "pricePerUnit", unit, active, "createdAt", "updatedAt") FROM stdin;
cmmi7hmed000b4honqtg4ep3l	Монтаж забора	fence	800	м.п.	t	2026-03-08 20:29:52.165	2026-03-08 20:29:52.165
cmmi7hmed000c4hon23qhr4ls	Бетонирование столба	fence	500	шт	t	2026-03-08 20:29:52.165	2026-03-08 20:29:52.165
cmmi7hmed000d4hon08h9ez84	Установка ворот распашных	fence	5000	шт	t	2026-03-08 20:29:52.165	2026-03-08 20:29:52.165
cmmi7hmed000e4hon6062rmmj	Установка ворот откатных	fence	7000	шт	t	2026-03-08 20:29:52.165	2026-03-08 20:29:52.165
cmmi7hmed000f4hon9ryf2okh	Монтаж навеса	canopy	1500	м²	t	2026-03-08 20:29:52.165	2026-03-08 20:29:52.165
cmmi7hmed000g4hon9ox78w56	Установка стоек	canopy	1000	шт	t	2026-03-08 20:29:52.165	2026-03-08 20:29:52.165
cmmi7hmed000h4hon3v8tpl79	Монтаж навеса - усиленный	canopy	1800	м²	t	2026-03-08 20:29:52.165	2026-03-08 20:29:52.165
\.


--
-- Data for Name: WorkRelation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorkRelation" (id, "workId", "fenceType", "createdAt", "referenceId", "referenceType") FROM stdin;
cmmpxzgds0005guk99becs47y	cmmpxzgds0004guk9suz4u88g	PROFNASTIL	2026-03-14 06:25:57.423	\N	\N
cmmqi3tx80001tf9kvwwh6950	cmmqi3tx80000tf9kn1uka5dz	\N	2026-03-14 15:49:13.916	cmmkxk7ka0000zs6bbdoa5fi2	WICKET
cmmqi66b30005tf9k2lqvnh7e	cmmqi66b30004tf9k0fycszns	\N	2026-03-14 15:51:03.279	cmmkxk7ka0000zs6bbdoa5fi2	WICKET
cmn2t26nj00bmxwznu9s9cb7u	cmmqh2fr20000pxfpwirkmd3k	\N	2026-03-23 06:29:06.991	cmmkvt4pn0001vp8ptlxwsyip	GATE
cmn2t26nj00bnxwzn6ug6a30v	cmmqh2fr20000pxfpwirkmd3k	\N	2026-03-23 06:29:06.991	cmn28waq8003jxwznhpr5ev51	GATE
cmn2t26nj00boxwznzf7thx6w	cmmqh2fr20000pxfpwirkmd3k	\N	2026-03-23 06:29:06.991	cmn28xoov003mxwznszgbu1re	GATE
cmn2t26nj00bpxwznk6hb0wdq	cmmqh2fr20000pxfpwirkmd3k	\N	2026-03-23 06:29:06.991	cmmkvqw8o0000vp8pk57c1l9w	GATE
cmn2t26nj00bqxwznpto2vnii	cmmqh2fr20000pxfpwirkmd3k	\N	2026-03-23 06:29:06.991	cmn28ux7j003gxwzn5cbcy3o9	GATE
cmn2t26nj00brxwznxr4876k4	cmmqh2fr20000pxfpwirkmd3k	\N	2026-03-23 06:29:06.991	cmn28teuz003dxwznqjoksfez	GATE
cmn2t26nj00bsxwznt2smlc2l	cmmqh2fr20000pxfpwirkmd3k	\N	2026-03-23 06:29:06.991	cmmkvt4pn0001vp8ptlxwsyip	GATE
cmn2t26nj00btxwzntblypmsl	cmmqh2fr20000pxfpwirkmd3k	\N	2026-03-23 06:29:06.991	cmn28yzuy003pxwzn2m0ouyyl	GATE
cmn2t26nj00buxwznxdp7lghw	cmmqh2fr20000pxfpwirkmd3k	\N	2026-03-23 06:29:06.991	cmn28ryrp003axwznhqf7lkyq	GATE
cmn65ejk80002e60txmkwet25	cmn65ejk80001e60t48reno0m	PROFNASTIL	2026-03-25 14:37:57.511	\N	\N
cmn65in550008e60tzw7gfts0	cmn65in550007e60txjcb4k48	PANEL_3D	2026-03-25 14:41:08.777	\N	\N
cmn6cnmn0000s7l4rfns326pw	cmn6cnmmz000r7l4rdlsmcce2	\N	2026-03-25 18:00:58.715	cmn2s5dkb0068xwznahdyifx1	GATE
cmn6cnmn0000t7l4r087a8eg9	cmn6cnmmz000r7l4rdlsmcce2	\N	2026-03-25 18:00:58.715	cmn2s85tj006bxwzna72y88la	GATE
cmn6cnmn0000u7l4rtx7gxnqh	cmn6cnmmz000r7l4rdlsmcce2	\N	2026-03-25 18:00:58.715	cmn2sasof006hxwzn6nwcskh5	GATE
cmn6cnmn0000v7l4rrf77ux5i	cmn6cnmmz000r7l4rdlsmcce2	\N	2026-03-25 18:00:58.715	cmn2sc7z2006kxwzn4c9cvb3f	GATE
cmn6cnmn0000w7l4rhopqw7f5	cmn6cnmmz000r7l4rdlsmcce2	\N	2026-03-25 18:00:58.715	cmn2s9h7m006exwzn97r7w2io	GATE
cmn6cnmn0000x7l4r8ldzao6n	cmn6cnmmz000r7l4rdlsmcce2	\N	2026-03-25 18:00:58.715	cmn295sob0055xwzn6dyo7588	GATE
cmn6cnmn0000y7l4rkf9qhuk7	cmn6cnmmz000r7l4rdlsmcce2	\N	2026-03-25 18:00:58.715	cmmkvv9it0008vp8puadb1zqx	GATE
cmn6cnmn0000z7l4rk83ky67m	cmn6cnmmz000r7l4rdlsmcce2	\N	2026-03-25 18:00:58.715	cmn298hsd0058xwznzimsi8vh	GATE
cmn6cnmn000107l4rihtobq3v	cmn6cnmmz000r7l4rdlsmcce2	\N	2026-03-25 18:00:58.715	cmn294pil0052xwznpnr5adap	GATE
cmn6cpe4s00147l4rfsa73a6i	cmn6cpe4s00137l4rcetdhr18	\N	2026-03-25 18:02:20.985	cmn2sdx5z006vxwznydrlbjes	GATE
cmn6cpe4s00157l4r9gelikvu	cmn6cpe4s00137l4rcetdhr18	\N	2026-03-25 18:02:20.985	cmn2smaue007mxwznsghp78yp	GATE
cmn6cpe4s00167l4rvih3jrz1	cmn6cpe4s00137l4rcetdhr18	\N	2026-03-25 18:02:20.985	cmn2sqj9x008axwznl9df87kc	GATE
cmn6cpe4s00177l4rbcfwpoev	cmn6cpe4s00137l4rcetdhr18	\N	2026-03-25 18:02:20.985	cmn2sre7p008dxwzns2v83do2	GATE
cmn6cpe4s00187l4rvjjq9cju	cmn6cpe4s00137l4rcetdhr18	\N	2026-03-25 18:02:20.985	cmn2snz4w0081xwzne2hjh461	GATE
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
554a516c-e604-404d-8029-2f9fb4d93844	06979abfe568297a32136ff69da0f4913bd896707548e15f63c449c155cce44a	2026-03-11 11:47:33.353431+03	20260308000000_refactor_lag_type_structure	Applied successfully	\N	2026-03-11 11:46:33.326519+03	0
16bf839f-7613-40a7-b804-0872d2129922	2b4cb4b8cfc20a3d68e947dc9fd8b49f0cb0ef57711044da9c0aa0ac971cab81	2026-03-11 11:48:12.348169+03	20260309000000_unify_posts_with_lags	Applied successfully	\N	2026-03-11 11:47:40.33442+03	0
318b927b-8e32-4321-999c-c30d5be5f2bc	74474fb959bcb0aeafb24ff358a5b9b168999b90b015a39d0d4c61b18bc8b283	2026-03-11 11:48:28.096822+03	20260310000000_update_profnastil_coating_values	\N	\N	2026-03-11 11:48:28.068067+03	1
41f7e788-e2a6-4285-a622-cf2d03befd10	eed903da3fc90d74b41a84eba7073ebe59db359a716635548616349c5aa03d4f	2026-03-11 11:48:28.117026+03	20260311000000_recalculate_priorities	\N	\N	2026-03-11 11:48:28.098284+03	1
5b5e5301-a813-4bf9-9732-f0eb98bb51dc	62047952f15411a8d56bc2c540519eb777c500f236eab25a33f37c2d6e1b635d	2026-03-11 16:27:41.80147+03	20260311162736_rename_base_price_to_retail_price_lag_type		\N	2026-03-11 16:27:41.80147+03	0
87cff552-7cf3-403a-9a8f-40879880122b	56577e78caecf361f17caedffbfd8fe202cba8ee7eb5dc2547d08eaccc30da91	2026-03-11 18:45:54.040615+03	20260311130000_rename_price_fields_to_unit		\N	2026-03-11 18:45:54.040615+03	0
a134b1d6-b193-4476-80ea-b5400382f1fd	03f7e9015b4294817f25376960d0231e54f98f01829ede87c89cfd2b9ae854aa	2026-03-11 19:01:48.066451+03	20260311120000_lag_length_float_to_int_mm	\N	\N	2026-03-11 19:01:48.042866+03	1
0c358482-56b4-462c-9165-d27bd48858b8	d101df39ba4a28be72c1a4f6b4e67c0d7be7178df68b4f3eb2c44689f0e55f51	\N	20260311194500_add_retail_price_per_unit_to_post_type	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260311194500_add_retail_price_per_unit_to_post_type\n\nDatabase error code: 42701\n\nDatabase error:\nERROR: column "retailPricePerUnit" of relation "PostType" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \\"retailPricePerUnit\\" of relation \\"PostType\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7347), routine: Some("check_for_column_name_collision") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260311194500_add_retail_price_per_unit_to_post_type"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260311194500_add_retail_price_per_unit_to_post_type"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-03-12 14:38:02.159277+03	2026-03-12 14:37:53.248735+03	0
58c59908-6cbd-447b-a007-4e62d11307ed	d101df39ba4a28be72c1a4f6b4e67c0d7be7178df68b4f3eb2c44689f0e55f51	2026-03-12 14:38:02.161723+03	20260311194500_add_retail_price_per_unit_to_post_type		\N	2026-03-12 14:38:02.161723+03	0
f0ae4a08-d8fb-49f7-ac46-a44fb40f0217	fb036f85a5d2bb559acab718df043cb1955214f9675e7e325fae02242791c25f	2026-03-12 14:38:06.701469+03	20260312000000_post_spacing_float_to_int_mm	\N	\N	2026-03-12 14:38:06.681213+03	1
ee42d906-b857-4305-93c9-0a58cce3ab1f	c6a110816fac58d861b360277db9d616	\N	20260322105312_add_purchase_price_per_linear_meter	\N	2026-03-25 10:08:29.713317+03	2026-03-22 21:44:15.173551+03	1
5f71203b-b027-4ddb-b100-44680ca56d95	e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855	2026-03-25 10:07:06.323378+03	20260324233000_add_panel3d_model		\N	2026-03-25 10:07:06.323378+03	1
851156fc-e788-46bb-9f0f-6870cffc9483	09d05e3ae4cb47ac4ea8c49fb032da9b39ac4a1ce8cc5383fd2ff0722eab3e3d	2026-03-25 10:06:52.946539+03	20260323094658_make_purchase_price_nullable_in_mounting_hardware		\N	2026-03-25 10:06:52.946539+03	1
5a80a046-ebe5-4b37-8489-ba60f6716350	e71af3aef67a471898d8d118b9eacb35ccee60bfac0aad7b34b8d53a0fb35ef9	\N	20260322105312_add_purchase_price_per_linear_meter	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260322105312_add_purchase_price_per_linear_meter\n\nDatabase error code: 42701\n\nDatabase error:\nERROR: column "purchasePricePerLinearMeter" of relation "ProfnastilType" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \\"purchasePricePerLinearMeter\\" of relation \\"ProfnastilType\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7083), routine: Some("check_for_column_name_collision") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260322105312_add_purchase_price_per_linear_meter"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260322105312_add_purchase_price_per_linear_meter"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-03-25 10:08:29.711999+03	2026-03-22 21:44:02.382917+03	0
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, "userId", action, "entityType", "entityId", "oldValues", "newValues", details, "ipAddress", "userAgent", "createdAt") FROM stdin;
cmn27zqte000pxwzn8h0cg58n	cmmi7hme100004hon3yvy52df	UPDATE_PRICE	PostType	cmmng6ciq000t13k4qt918o3n	{"retailPricePerUnit": 850, "purchasePricePerUnit": 749.97}	{"retailPricePerUnit": 1100, "purchasePricePerUnit": 910}	\N	79.174.33.179	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	2026-03-22 20:39:21.194
cmn287t8t001bxwzn7o1xrjm2	cmmi7hme100004hon3yvy52df	UPDATE_PRICE	ProfnastilType	cmmkg7cuz0001yh66p0ihxyb3	{"retailPricePerUnit": 600, "purchasePricePerUnit": 550}	{"retailPricePerUnit": 1300, "purchasePricePerUnit": 1100}	\N	79.174.33.179	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	2026-03-22 20:45:37.614
cmn288c8e001nxwznqetkhadf	cmmi7hme100004hon3yvy52df	UPDATE_PRICE	ProfnastilType	cmmkg8een0002yh663iksgtjf	{"retailPricePerUnit": 650, "purchasePricePerUnit": 600}	{"retailPricePerUnit": 1400, "purchasePricePerUnit": 1200}	\N	79.174.33.179	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	2026-03-22 20:46:02.221
cmn28a1uu001zxwzntem8vv4l	cmmi7hme100004hon3yvy52df	UPDATE_PRICE	ProfnastilType	cmmkg5vsj0000yh665v5bnysy	{"retailPricePerUnit": 550, "purchasePricePerUnit": 500}	{"retailPricePerUnit": 1200, "purchasePricePerUnit": 1000}	\N	79.174.33.179	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	2026-03-22 20:47:22.086
cmn291p2u004lxwznscb1wyfm	cmmi7hme100004hon3yvy52df	UPDATE_PRICE	GateType	cmn28xoov003mxwznszgbu1re	{"purchasePrice": 23999.98}	{"purchasePrice": 24000}	\N	79.174.33.179	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	2026-03-22 21:08:51.875
cmn292bev004vxwznvejyicau	cmmi7hme100004hon3yvy52df	UPDATE_PRICE	GateType	cmn28yzuy003pxwzn2m0ouyyl	{"purchasePrice": 26999.97}	{"purchasePrice": 27000}	\N	79.174.33.179	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	2026-03-22 21:09:20.839
cmn2scky6006qxwznzwpicq05	cmmi7hme100004hon3yvy52df	UPDATE_PRICE	GateType	cmn2sasof006hxwzn6nwcskh5	{"purchasePrice": 7349.99}	{"purchasePrice": 7350}	\N	79.174.33.179	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	2026-03-23 06:09:12.462
cmn2siuyi0075xwzn1ef5w23b	cmmi7hme100004hon3yvy52df	UPDATE_PRICE	GateType	cmmkvv9it0008vp8puadb1zqx	{"retailPrice": 10000}	{"retailPrice": 13450}	\N	79.174.33.179	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	2026-03-23 06:14:05.347
cmn2sj5en0077xwznhuyq9fpr	cmmi7hme100004hon3yvy52df	UPDATE_PRICE	GateType	cmn294pil0052xwznpnr5adap	{"retailPrice": 13200}	{"retailPrice": 13600}	\N	79.174.33.179	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	2026-03-23 06:14:18.912
cmn2skpea007hxwznhckeoccw	cmmi7hme100004hon3yvy52df	UPDATE_PRICE	GateType	cmn2sdx5z006vxwznydrlbjes	{"retailPrice": 13000}	{"retailPrice": 13499.99}	\N	79.174.33.179	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	2026-03-23 06:15:31.474
cmn347k900001w3tsu2qlk4oy	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	e440822e-6f7c-41d8-902b-abaed901726f	{"id": "e440822e-6f7c-41d8-902b-abaed901726f", "cost": null, "type": null, "title": "Проект 10", "active": true, "images": ["/uploads/portfolio/2026/03/e440822e-6f7c-41d8-902b-abaed901726f.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:39:04.390Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:39:04.390Z", "description": "Описание проекта 10"}	null	\N	\N	\N	2026-03-23 11:41:13.668
cmn347opn0003w3tsg8gu2zwz	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	9bfbf02c-e4f5-4f36-b5a5-5c8e4c302f5c	{"id": "9bfbf02c-e4f5-4f36-b5a5-5c8e4c302f5c", "cost": null, "type": null, "title": "Проект 9", "active": true, "images": ["/uploads/portfolio/2026/03/9bfbf02c-e4f5-4f36-b5a5-5c8e4c302f5c.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:35:32.141Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:35:32.141Z", "description": "Описание проекта 9"}	null	\N	\N	\N	2026-03-23 11:41:19.451
cmn347r4f0005w3ts7rg4encz	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	243b678c-5bab-4208-a81e-02936f82d8a4	{"id": "243b678c-5bab-4208-a81e-02936f82d8a4", "cost": null, "type": null, "title": "Проект 1", "active": true, "images": ["/uploads/portfolio/2026/03/243b678c-5bab-4208-a81e-02936f82d8a4.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:28:44.592Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:28:44.592Z", "description": "Описание проекта 1"}	null	\N	\N	\N	2026-03-23 11:41:22.576
cmn347tpz0007w3tswk04vnk7	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	255f6250-b0fb-4c3e-b492-e6202f5736e3	{"id": "255f6250-b0fb-4c3e-b492-e6202f5736e3", "cost": null, "type": null, "title": "Проект 2", "active": true, "images": ["/uploads/portfolio/2026/03/255f6250-b0fb-4c3e-b492-e6202f5736e3.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:28:44.592Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:28:44.592Z", "description": "Описание проекта 2"}	null	\N	\N	\N	2026-03-23 11:41:25.944
cmn347vr10009w3tsied8cpur	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	5d270194-5737-46a2-a008-08fba3e6de51	{"id": "5d270194-5737-46a2-a008-08fba3e6de51", "cost": null, "type": null, "title": "Проект 3", "active": true, "images": ["/uploads/portfolio/2026/03/5d270194-5737-46a2-a008-08fba3e6de51.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:28:44.592Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:28:44.592Z", "description": "Описание проекта 3"}	null	\N	\N	\N	2026-03-23 11:41:28.573
cmn347ygk000bw3ts8j9yi0in	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	64812a78-9946-4449-98ce-a531d4e1030b	{"id": "64812a78-9946-4449-98ce-a531d4e1030b", "cost": null, "type": null, "title": "Проект 4", "active": true, "images": ["/uploads/portfolio/2026/03/64812a78-9946-4449-98ce-a531d4e1030b.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:28:44.592Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:28:44.592Z", "description": "Описание проекта 4"}	null	\N	\N	\N	2026-03-23 11:41:32.085
cmn34m7fn00017r7nzimw9fty	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	5d270194-5737-46a2-a008-08fba3e6de51	{"id": "5d270194-5737-46a2-a008-08fba3e6de51", "cost": null, "type": null, "title": "Проект 3", "active": true, "images": ["/uploads/portfolio/2026/03/5d270194-5737-46a2-a008-08fba3e6de51.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:00:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:00:00.000Z", "description": "Описание проекта 3"}	null	\N	\N	\N	2026-03-23 11:52:36.899
cmn34maq100037r7ndt902xsw	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	64812a78-9946-4449-98ce-a531d4e1030b	{"id": "64812a78-9946-4449-98ce-a531d4e1030b", "cost": null, "type": null, "title": "Проект 4", "active": true, "images": ["/uploads/portfolio/2026/03/64812a78-9946-4449-98ce-a531d4e1030b.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:00:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:00:00.000Z", "description": "Описание проекта 4"}	null	\N	\N	\N	2026-03-23 11:52:41.161
cmn34mejc00057r7np3u9xnup	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	243b678c-5bab-4208-a81e-02936f82d8a4	{"id": "243b678c-5bab-4208-a81e-02936f82d8a4", "cost": null, "type": null, "title": "Проект 1", "active": true, "images": ["/uploads/portfolio/2026/03/243b678c-5bab-4208-a81e-02936f82d8a4.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:00:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:00:00.000Z", "description": "Описание проекта 1"}	null	\N	\N	\N	2026-03-23 11:52:46.105
cmn34mkc200097r7noxvpphj7	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	9bfbf02c-e4f5-4f36-b5a5-5c8e4c302f5c	{"id": "9bfbf02c-e4f5-4f36-b5a5-5c8e4c302f5c", "cost": null, "type": null, "title": "Проект 11", "active": true, "images": ["/uploads/portfolio/2026/03/9bfbf02c-e4f5-4f36-b5a5-5c8e4c302f5c.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:00:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:00:00.000Z", "description": "Описание проекта 11"}	null	\N	\N	\N	2026-03-23 11:52:53.619
cmn34mgyo00077r7n2k95mmhv	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	255f6250-b0fb-4c3e-b492-e6202f5736e3	{"id": "255f6250-b0fb-4c3e-b492-e6202f5736e3", "cost": null, "type": null, "title": "Проект 2", "active": true, "images": ["/uploads/portfolio/2026/03/255f6250-b0fb-4c3e-b492-e6202f5736e3.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:00:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:00:00.000Z", "description": "Описание проекта 2"}	null	\N	\N	\N	2026-03-23 11:52:49.248
cmn34mmpx000b7r7n6jjnnjut	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	e440822e-6f7c-41d8-902b-abaed901726f	{"id": "e440822e-6f7c-41d8-902b-abaed901726f", "cost": null, "type": null, "title": "Проект 9", "active": true, "images": ["/uploads/portfolio/2026/03/e440822e-6f7c-41d8-902b-abaed901726f.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:00:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:00:00.000Z", "description": "Описание проекта 9"}	null	\N	\N	\N	2026-03-23 11:52:56.709
cmn350zvh000110aclpini066	cmmi7hme100004hon3yvy52df	PORTFOLIO_UPDATE	PortfolioItem	07f33cc6-e104-4672-be98-ff323d2a1c57	{"id": "07f33cc6-e104-4672-be98-ff323d2a1c57", "cost": null, "type": null, "title": "Проект 15", "active": true, "images": ["/uploads/portfolio/2026/03/07f33cc6-e104-4672-be98-ff323d2a1c57.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:53:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:53:00.000Z", "description": "Описание проекта 15"}	{"id": "07f33cc6-e104-4672-be98-ff323d2a1c57", "cost": null, "type": "Монтаж и производство ", "title": "Навес из металлоконструкций и поликарбоната", "active": true, "images": ["/uploads/portfolio/2026/03/07f33cc6-e104-4672-be98-ff323d2a1c57.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:53:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T12:04:06.938Z", "description": "Надежная защита для вашего авто или зоны отдыха"}	\N	\N	\N	2026-03-23 12:04:06.941
cmn352wwg000310ac1dfybiws	cmmi7hme100004hon3yvy52df	PORTFOLIO_UPDATE	PortfolioItem	176aea63-7ca4-4dad-80dc-14fcffccf193	{"id": "176aea63-7ca4-4dad-80dc-14fcffccf193", "cost": null, "type": null, "title": "Проект 13", "active": true, "images": ["/uploads/portfolio/2026/03/176aea63-7ca4-4dad-80dc-14fcffccf193.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:41:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:41:00.000Z", "description": "Описание проекта 13"}	{"id": "176aea63-7ca4-4dad-80dc-14fcffccf193", "cost": null, "type": "Монтаж и производство ", "title": "Заборы, ворота и калитки из профнастила", "active": true, "images": ["/uploads/portfolio/2026/03/176aea63-7ca4-4dad-80dc-14fcffccf193.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:41:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T12:05:36.397Z", "description": "щете идеальный баланс между ценой и качеством? Посмотрите, что мы уже сделали для наших клиентов. Профнастил — это выбор прагматичных владельцев: он не требует покраски, скрывает участок от посторонних глаз и монтируется за 1-3 дня."}	\N	\N	\N	2026-03-23 12:05:36.4
cmn3530jg000510ac0jbise6o	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	143dc9b8-d5ff-4c75-869d-1e78dc335db1	{"id": "143dc9b8-d5ff-4c75-869d-1e78dc335db1", "cost": null, "type": null, "title": "Проект 12", "active": true, "images": ["/uploads/portfolio/2026/03/143dc9b8-d5ff-4c75-869d-1e78dc335db1.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:34:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:34:00.000Z", "description": "Описание проекта 12"}	null	\N	\N	\N	2026-03-23 12:05:41.116
cmn35355n000710ach6a8s5xy	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	838139ff-ec83-482f-80f5-b061ebffa660	{"id": "838139ff-ec83-482f-80f5-b061ebffa660", "cost": null, "type": null, "title": "Проект 7", "active": true, "images": ["/uploads/portfolio/2026/03/838139ff-ec83-482f-80f5-b061ebffa660.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:00:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:00:00.000Z", "description": "Описание проекта 7"}	null	\N	\N	\N	2026-03-23 12:05:47.1
cmn3537lw000910acud894x1v	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	6b81c63e-3f48-4e1c-99ed-f493ccd0904f	{"id": "6b81c63e-3f48-4e1c-99ed-f493ccd0904f", "cost": null, "type": null, "title": "Проект 5", "active": true, "images": ["/uploads/portfolio/2026/03/6b81c63e-3f48-4e1c-99ed-f493ccd0904f.jpg"], "category": "canopy", "showCost": false, "createdAt": "2026-03-23T14:00:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:00:00.000Z", "description": "Описание проекта 5"}	null	\N	\N	\N	2026-03-23 12:05:50.276
cmn353bch000b10accrdg1xox	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	cb7e81ca-daed-458f-894a-b65d47f7b5c3	{"id": "cb7e81ca-daed-458f-894a-b65d47f7b5c3", "cost": null, "type": null, "title": "Проект 8", "active": true, "images": ["/uploads/portfolio/2026/03/cb7e81ca-daed-458f-894a-b65d47f7b5c3.jpg"], "category": "canopy", "showCost": false, "createdAt": "2026-03-23T14:00:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:00:00.000Z", "description": "Описание проекта 8"}	null	\N	\N	\N	2026-03-23 12:05:55.121
cmn353dgk000d10acm3o9wynk	cmmi7hme100004hon3yvy52df	PORTFOLIO_DELETE	PortfolioItem	7d2fff41-1888-4eeb-a710-9807efac618a	{"id": "7d2fff41-1888-4eeb-a710-9807efac618a", "cost": null, "type": null, "title": "Проект 6", "active": true, "images": ["/uploads/portfolio/2026/03/7d2fff41-1888-4eeb-a710-9807efac618a.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:00:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:00:00.000Z", "description": "Описание проекта 6"}	null	\N	\N	\N	2026-03-23 12:05:57.86
cmn353hf8000f10acpsnsbz67	cmmi7hme100004hon3yvy52df	PORTFOLIO_UPDATE	PortfolioItem	07f33cc6-e104-4672-be98-ff323d2a1c57	{"id": "07f33cc6-e104-4672-be98-ff323d2a1c57", "cost": null, "type": "Монтаж и производство ", "title": "Навес из металлоконструкций и поликарбоната", "active": true, "images": ["/uploads/portfolio/2026/03/07f33cc6-e104-4672-be98-ff323d2a1c57.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:53:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T12:04:06.938Z", "description": "Надежная защита для вашего авто или зоны отдыха"}	{"id": "07f33cc6-e104-4672-be98-ff323d2a1c57", "cost": null, "type": "Монтаж и производство ", "title": "Навес из металлоконструкций и поликарбоната", "active": true, "images": ["/uploads/portfolio/2026/03/07f33cc6-e104-4672-be98-ff323d2a1c57.jpg"], "category": "canopy", "showCost": false, "createdAt": "2026-03-23T14:53:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T12:06:02.995Z", "description": "Надежная защита для вашего авто или зоны отдыха"}	\N	\N	\N	2026-03-23 12:06:02.996
cmn355aat000h10acr30n1m1b	cmmi7hme100004hon3yvy52df	PORTFOLIO_UPDATE	PortfolioItem	05c85312-227b-400f-b6fd-3b2a245cd87d	{"id": "05c85312-227b-400f-b6fd-3b2a245cd87d", "cost": null, "type": null, "title": "Проект 10", "active": true, "images": ["/uploads/portfolio/2026/03/05c85312-227b-400f-b6fd-3b2a245cd87d.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:00:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T14:00:00.000Z", "description": "Описание проекта 10"}	{"id": "05c85312-227b-400f-b6fd-3b2a245cd87d", "cost": null, "type": "Монтаж и производство", "title": "Заборы, ворота, калитки из евроштакетника под ключ", "active": true, "images": ["/uploads/portfolio/2026/03/05c85312-227b-400f-b6fd-3b2a245cd87d.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:00:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T12:07:27.075Z", "description": "Почему евроштакетник становится популярнее профнастила? Потому что он красивее, долговечнее и не создает тени на участке. Посмотрите на наши реализованные проекты — это доказательство того, что металлический забор может выглядеть дорого и стильно."}	\N	\N	\N	2026-03-23 12:07:27.077
cmn356eo5000j10acudr8e27r	cmmi7hme100004hon3yvy52df	PORTFOLIO_UPDATE	PortfolioItem	176aea63-7ca4-4dad-80dc-14fcffccf193	{"id": "176aea63-7ca4-4dad-80dc-14fcffccf193", "cost": null, "type": "Монтаж и производство ", "title": "Заборы, ворота и калитки из профнастила", "active": true, "images": ["/uploads/portfolio/2026/03/176aea63-7ca4-4dad-80dc-14fcffccf193.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:41:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T12:05:36.397Z", "description": "щете идеальный баланс между ценой и качеством? Посмотрите, что мы уже сделали для наших клиентов. Профнастил — это выбор прагматичных владельцев: он не требует покраски, скрывает участок от посторонних глаз и монтируется за 1-3 дня."}	{"id": "176aea63-7ca4-4dad-80dc-14fcffccf193", "cost": null, "type": "Монтаж и производство ", "title": "Заборы, ворота и калитки из профнастила под ключ", "active": true, "images": ["/uploads/portfolio/2026/03/176aea63-7ca4-4dad-80dc-14fcffccf193.jpg"], "category": "fence", "showCost": false, "createdAt": "2026-03-23T14:41:00.000Z", "sortOrder": 0, "updatedAt": "2026-03-23T12:08:19.393Z", "description": "щете идеальный баланс между ценой и качеством? Посмотрите, что мы уже сделали для наших клиентов. Профнастил — это выбор прагматичных владельцев: он не требует покраски, скрывает участок от посторонних глаз и монтируется за 1-3 дня."}	\N	\N	\N	2026-03-23 12:08:19.398
cmn52mpiz0004q0a0b2sw1gk7	cmmi7hme100004hon3yvy52df	CREATE_PANEL3D	Panel3D	cmn52mpit0000q0a05bodfr79	\N	\N	{"name": "3D-панель, прут-3,5мм., h-2030мм."}	213.182.200.40	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	2026-03-24 20:32:33.468
cmn52o8ke0009q0a04vm4cffh	cmmi7hme100004hon3yvy52df	CREATE_PANEL3D	Panel3D	cmn52o8k90005q0a0zrpo9aia	\N	\N	{"name": "3D-панель, прут-3,5мм., h-1730мм."}	213.182.200.40	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	2026-03-24 20:33:44.799
cmn52pnuw000eq0a0y2j2o60q	cmmi7hme100004hon3yvy52df	CREATE_PANEL3D	Panel3D	cmn52pnuq000aq0a0j5jiwoi9	\N	\N	{"name": "3D-панель, прут-3,5мм., h-1530мм."}	213.182.200.40	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	2026-03-24 20:34:51.272
cmn6chf8m000l7l4r223v5gq2	cmmi7hme100004hon3yvy52df	UPDATE_PRICE	MountingHardware	cmn6c74se00007l4rpxh3oxq4	{"purchasePrice": 34.96}	{"purchasePrice": 35}	\N	213.182.200.40	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36	2026-03-25 17:56:09.19
\.


--
-- Name: CanopyMaterial CanopyMaterial_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CanopyMaterial"
    ADD CONSTRAINT "CanopyMaterial_pkey" PRIMARY KEY (id);


--
-- Name: CanopyType CanopyType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CanopyType"
    ADD CONSTRAINT "CanopyType_pkey" PRIMARY KEY (id);


--
-- Name: ContactInfo ContactInfo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ContactInfo"
    ADD CONSTRAINT "ContactInfo_pkey" PRIMARY KEY (id);


--
-- Name: FenceEstimate FenceEstimate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FenceEstimate"
    ADD CONSTRAINT "FenceEstimate_pkey" PRIMARY KEY (id);


--
-- Name: FenceMaterial FenceMaterial_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FenceMaterial"
    ADD CONSTRAINT "FenceMaterial_pkey" PRIMARY KEY (id);


--
-- Name: FenceType FenceType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FenceType"
    ADD CONSTRAINT "FenceType_pkey" PRIMARY KEY (id);


--
-- Name: GateType GateType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GateType"
    ADD CONSTRAINT "GateType_pkey" PRIMARY KEY (id);


--
-- Name: LagType LagType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LagType"
    ADD CONSTRAINT "LagType_pkey" PRIMARY KEY (id);


--
-- Name: MountingHardwareRelation MountingHardwareRelation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MountingHardwareRelation"
    ADD CONSTRAINT "MountingHardwareRelation_pkey" PRIMARY KEY (id);


--
-- Name: MountingHardware MountingHardware_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MountingHardware"
    ADD CONSTRAINT "MountingHardware_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: PageContent PageContent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PageContent"
    ADD CONSTRAINT "PageContent_pkey" PRIMARY KEY (id);


--
-- Name: Panel3D Panel3D_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Panel3D"
    ADD CONSTRAINT "Panel3D_pkey" PRIMARY KEY (id);


--
-- Name: PicketType PicketType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PicketType"
    ADD CONSTRAINT "PicketType_pkey" PRIMARY KEY (id);


--
-- Name: PortfolioItem PortfolioItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PortfolioItem"
    ADD CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY (id);


--
-- Name: PostType PostType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PostType"
    ADD CONSTRAINT "PostType_pkey" PRIMARY KEY (id);


--
-- Name: PriceHistory PriceHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PriceHistory"
    ADD CONSTRAINT "PriceHistory_pkey" PRIMARY KEY (id);


--
-- Name: ProfnastilType ProfnastilType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfnastilType"
    ADD CONSTRAINT "ProfnastilType_pkey" PRIMARY KEY (id);


--
-- Name: RateLimitConfig RateLimitConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RateLimitConfig"
    ADD CONSTRAINT "RateLimitConfig_pkey" PRIMARY KEY (id);


--
-- Name: ReferenceChangeLog ReferenceChangeLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReferenceChangeLog"
    ADD CONSTRAINT "ReferenceChangeLog_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: Setting Setting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Setting"
    ADD CONSTRAINT "Setting_pkey" PRIMARY KEY (id);


--
-- Name: SoilType SoilType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SoilType"
    ADD CONSTRAINT "SoilType_pkey" PRIMARY KEY (id);


--
-- Name: UserNotificationSettings UserNotificationSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserNotificationSettings"
    ADD CONSTRAINT "UserNotificationSettings_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WicketType WicketType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WicketType"
    ADD CONSTRAINT "WicketType_pkey" PRIMARY KEY (id);


--
-- Name: WorkPrice WorkPrice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkPrice"
    ADD CONSTRAINT "WorkPrice_pkey" PRIMARY KEY (id);


--
-- Name: WorkRelation WorkRelation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkRelation"
    ADD CONSTRAINT "WorkRelation_pkey" PRIMARY KEY (id);


--
-- Name: Work Work_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Work"
    ADD CONSTRAINT "Work_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: FenceEstimate_city_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FenceEstimate_city_idx" ON public."FenceEstimate" USING btree (city);


--
-- Name: FenceEstimate_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FenceEstimate_createdAt_idx" ON public."FenceEstimate" USING btree ("createdAt");


--
-- Name: FenceEstimate_fenceTypeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FenceEstimate_fenceTypeId_idx" ON public."FenceEstimate" USING btree ("fenceTypeId");


--
-- Name: FenceEstimate_sessionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FenceEstimate_sessionId_idx" ON public."FenceEstimate" USING btree ("sessionId");


--
-- Name: FenceEstimate_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FenceEstimate_userId_idx" ON public."FenceEstimate" USING btree ("userId");


--
-- Name: FenceMaterial_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FenceMaterial_active_idx" ON public."FenceMaterial" USING btree (active);


--
-- Name: FenceMaterial_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FenceMaterial_category_idx" ON public."FenceMaterial" USING btree (category);


--
-- Name: FenceMaterial_fenceTypeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FenceMaterial_fenceTypeId_idx" ON public."FenceMaterial" USING btree ("fenceTypeId");


--
-- Name: FenceType_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FenceType_active_idx" ON public."FenceType" USING btree (active);


--
-- Name: FenceType_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FenceType_priority_idx" ON public."FenceType" USING btree (priority);


--
-- Name: GateType_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GateType_active_idx" ON public."GateType" USING btree (active);


--
-- Name: GateType_expirationDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GateType_expirationDate_idx" ON public."GateType" USING btree ("expirationDate");


--
-- Name: GateType_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GateType_priority_idx" ON public."GateType" USING btree (priority);


--
-- Name: GateType_sectionWidth_sectionHeight_metalThickness_gateLeng_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GateType_sectionWidth_sectionHeight_metalThickness_gateLeng_idx" ON public."GateType" USING btree ("sectionWidth", "sectionHeight", "metalThickness", "gateLength");


--
-- Name: GateType_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GateType_type_idx" ON public."GateType" USING btree (type);


--
-- Name: GateType_validFrom_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GateType_validFrom_idx" ON public."GateType" USING btree ("validFrom");


--
-- Name: LagType_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LagType_active_idx" ON public."LagType" USING btree (active);


--
-- Name: LagType_expirationDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LagType_expirationDate_idx" ON public."LagType" USING btree ("expirationDate");


--
-- Name: LagType_length_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LagType_length_idx" ON public."LagType" USING btree (length);


--
-- Name: LagType_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LagType_priority_idx" ON public."LagType" USING btree (priority);


--
-- Name: LagType_validFrom_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LagType_validFrom_idx" ON public."LagType" USING btree ("validFrom");


--
-- Name: LagType_width_height_metalThickness_length_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LagType_width_height_metalThickness_length_idx" ON public."LagType" USING btree (width, height, "metalThickness", length);


--
-- Name: MountingHardwareRelation_mountingHardwareId_referenceType_r_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MountingHardwareRelation_mountingHardwareId_referenceType_r_key" ON public."MountingHardwareRelation" USING btree ("mountingHardwareId", "referenceType", "referenceId");


--
-- Name: MountingHardwareRelation_referenceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MountingHardwareRelation_referenceId_idx" ON public."MountingHardwareRelation" USING btree ("referenceId");


--
-- Name: MountingHardwareRelation_referenceType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MountingHardwareRelation_referenceType_idx" ON public."MountingHardwareRelation" USING btree ("referenceType");


--
-- Name: MountingHardware_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MountingHardware_active_idx" ON public."MountingHardware" USING btree (active);


--
-- Name: MountingHardware_sortOrder_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MountingHardware_sortOrder_idx" ON public."MountingHardware" USING btree ("sortOrder");


--
-- Name: MountingHardware_useInCalculator_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MountingHardware_useInCalculator_idx" ON public."MountingHardware" USING btree ("useInCalculator");


--
-- Name: MountingHardware_validUntil_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MountingHardware_validUntil_idx" ON public."MountingHardware" USING btree ("validUntil");


--
-- Name: Order_cancellationReason_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_cancellationReason_idx" ON public."Order" USING btree ("cancellationReason");


--
-- Name: Order_completionDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_completionDate_idx" ON public."Order" USING btree ("completionDate");


--
-- Name: Order_estimateId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_estimateId_idx" ON public."Order" USING btree ("estimateId");


--
-- Name: Order_estimateId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Order_estimateId_key" ON public."Order" USING btree ("estimateId");


--
-- Name: Order_measurementDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_measurementDate_idx" ON public."Order" USING btree ("measurementDate");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_status_idx" ON public."Order" USING btree (status);


--
-- Name: PageContent_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PageContent_slug_key" ON public."PageContent" USING btree (slug);


--
-- Name: PicketType_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PicketType_active_idx" ON public."PicketType" USING btree (active);


--
-- Name: PicketType_coating_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PicketType_coating_idx" ON public."PicketType" USING btree (coating);


--
-- Name: PicketType_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PicketType_name_idx" ON public."PicketType" USING btree (name);


--
-- Name: PicketType_name_metalThickness_coating_color_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PicketType_name_metalThickness_coating_color_key" ON public."PicketType" USING btree (name, "metalThickness", coating, color);


--
-- Name: PicketType_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PicketType_priority_idx" ON public."PicketType" USING btree (priority);


--
-- Name: PicketType_validUntil_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PicketType_validUntil_idx" ON public."PicketType" USING btree ("validUntil");


--
-- Name: PostType_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PostType_active_idx" ON public."PostType" USING btree (active);


--
-- Name: PostType_expirationDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PostType_expirationDate_idx" ON public."PostType" USING btree ("expirationDate");


--
-- Name: PostType_length_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PostType_length_idx" ON public."PostType" USING btree (length);


--
-- Name: PostType_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PostType_priority_idx" ON public."PostType" USING btree (priority);


--
-- Name: PostType_sectionWidth_sectionHeight_wallThickness_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PostType_sectionWidth_sectionHeight_wallThickness_idx" ON public."PostType" USING btree ("sectionWidth", "sectionHeight", "wallThickness");


--
-- Name: PostType_validFrom_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PostType_validFrom_idx" ON public."PostType" USING btree ("validFrom");


--
-- Name: ProfnastilType_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfnastilType_active_idx" ON public."ProfnastilType" USING btree (active);


--
-- Name: ProfnastilType_coating_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfnastilType_coating_idx" ON public."ProfnastilType" USING btree (coating);


--
-- Name: ProfnastilType_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfnastilType_name_idx" ON public."ProfnastilType" USING btree (name);


--
-- Name: ProfnastilType_name_metalThickness_coating_color_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProfnastilType_name_metalThickness_coating_color_key" ON public."ProfnastilType" USING btree (name, "metalThickness", coating, color);


--
-- Name: ProfnastilType_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfnastilType_priority_idx" ON public."ProfnastilType" USING btree (priority);


--
-- Name: ProfnastilType_validUntil_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfnastilType_validUntil_idx" ON public."ProfnastilType" USING btree ("validUntil");


--
-- Name: ReferenceChangeLog_changedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ReferenceChangeLog_changedAt_idx" ON public."ReferenceChangeLog" USING btree ("changedAt");


--
-- Name: ReferenceChangeLog_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ReferenceChangeLog_entityType_entityId_idx" ON public."ReferenceChangeLog" USING btree ("entityType", "entityId");


--
-- Name: Setting_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Setting_key_key" ON public."Setting" USING btree (key);


--
-- Name: UserNotificationSettings_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserNotificationSettings_userId_key" ON public."UserNotificationSettings" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: WicketType_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WicketType_active_idx" ON public."WicketType" USING btree (active);


--
-- Name: WicketType_expirationDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WicketType_expirationDate_idx" ON public."WicketType" USING btree ("expirationDate");


--
-- Name: WicketType_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WicketType_priority_idx" ON public."WicketType" USING btree (priority);


--
-- Name: WicketType_sectionWidth_sectionHeight_metalThickness_wicket_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WicketType_sectionWidth_sectionHeight_metalThickness_wicket_idx" ON public."WicketType" USING btree ("sectionWidth", "sectionHeight", "metalThickness", "wicketLength");


--
-- Name: WicketType_validFrom_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WicketType_validFrom_idx" ON public."WicketType" USING btree ("validFrom");


--
-- Name: WorkRelation_fenceType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WorkRelation_fenceType_idx" ON public."WorkRelation" USING btree ("fenceType");


--
-- Name: WorkRelation_referenceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WorkRelation_referenceId_idx" ON public."WorkRelation" USING btree ("referenceId");


--
-- Name: WorkRelation_referenceType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WorkRelation_referenceType_idx" ON public."WorkRelation" USING btree ("referenceType");


--
-- Name: WorkRelation_workId_fenceType_referenceType_referenceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "WorkRelation_workId_fenceType_referenceType_referenceId_key" ON public."WorkRelation" USING btree ("workId", "fenceType", "referenceType", "referenceId");


--
-- Name: Work_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Work_active_idx" ON public."Work" USING btree (active);


--
-- Name: Work_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Work_category_idx" ON public."Work" USING btree (category);


--
-- Name: Work_sortOrder_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Work_sortOrder_idx" ON public."Work" USING btree ("sortOrder");


--
-- Name: Work_useInCalculator_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Work_useInCalculator_idx" ON public."Work" USING btree ("useInCalculator");


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_createdAt_idx" ON public.audit_logs USING btree ("createdAt");


--
-- Name: audit_logs_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_entityType_entityId_idx" ON public.audit_logs USING btree ("entityType", "entityId");


--
-- Name: audit_logs_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_userId_idx" ON public.audit_logs USING btree ("userId");


--
-- Name: FenceEstimate FenceEstimate_fenceTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FenceEstimate"
    ADD CONSTRAINT "FenceEstimate_fenceTypeId_fkey" FOREIGN KEY ("fenceTypeId") REFERENCES public."FenceType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FenceEstimate FenceEstimate_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FenceEstimate"
    ADD CONSTRAINT "FenceEstimate_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FenceMaterial FenceMaterial_fenceTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FenceMaterial"
    ADD CONSTRAINT "FenceMaterial_fenceTypeId_fkey" FOREIGN KEY ("fenceTypeId") REFERENCES public."FenceType"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MountingHardwareRelation MountingHardwareRelation_mountingHardwareId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MountingHardwareRelation"
    ADD CONSTRAINT "MountingHardwareRelation_mountingHardwareId_fkey" FOREIGN KEY ("mountingHardwareId") REFERENCES public."MountingHardware"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_assignedTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_estimateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES public."FenceEstimate"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PriceHistory PriceHistory_changedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PriceHistory"
    ADD CONSTRAINT "PriceHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ReferenceChangeLog ReferenceChangeLog_changedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReferenceChangeLog"
    ADD CONSTRAINT "ReferenceChangeLog_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserNotificationSettings UserNotificationSettings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserNotificationSettings"
    ADD CONSTRAINT "UserNotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkRelation WorkRelation_workId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkRelation"
    ADD CONSTRAINT "WorkRelation_workId_fkey" FOREIGN KEY ("workId") REFERENCES public."Work"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict zt3SLFygcpnfQdy1vRpcdkh9ARWG6mGBetgKdrqTPkR9Zd9qifCGYgHLBrPvJ4i

