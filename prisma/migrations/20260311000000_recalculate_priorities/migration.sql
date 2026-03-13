-- Recalculate priorities for FenceType
WITH ordered_fence_types AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY priority, "createdAt") as new_priority
  FROM "FenceType"
)
UPDATE "FenceType" ft
SET priority = oft.new_priority
FROM ordered_fence_types oft
WHERE ft.id = oft.id;

-- Recalculate priorities for PostType
WITH ordered_post_types AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY priority, "createdAt") as new_priority
  FROM "PostType"
)
UPDATE "PostType" pt
SET priority = opt.new_priority
FROM ordered_post_types opt
WHERE pt.id = opt.id;

-- Recalculate priorities for LagType
WITH ordered_lag_types AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY priority, "createdAt") as new_priority
  FROM "LagType"
)
UPDATE "LagType" lt
SET priority = olt.new_priority
FROM ordered_lag_types olt
WHERE lt.id = olt.id;

-- Recalculate priorities for ProfnastilType
WITH ordered_profnastil_types AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY priority, "createdAt") as new_priority
  FROM "ProfnastilType"
)
UPDATE "ProfnastilType" pt
SET priority = opt.new_priority
FROM ordered_profnastil_types opt
WHERE pt.id = opt.id;

-- Recalculate priorities for PicketType
WITH ordered_picket_types AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY priority, "createdAt") as new_priority
  FROM "PicketType"
)
UPDATE "PicketType" pt
SET priority = opt.new_priority
FROM ordered_picket_types opt
WHERE pt.id = opt.id;

-- Recalculate priorities for GateType
WITH ordered_gate_types AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY priority, "createdAt") as new_priority
  FROM "GateType"
)
UPDATE "GateType" gt
SET priority = ogt.new_priority
FROM ordered_gate_types ogt
WHERE gt.id = ogt.id;

-- Recalculate priorities for WicketType
WITH ordered_wicket_types AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY priority, "createdAt") as new_priority
  FROM "WicketType"
)
UPDATE "WicketType" wt
SET priority = owt.new_priority
FROM ordered_wicket_types owt
WHERE wt.id = owt.id;
