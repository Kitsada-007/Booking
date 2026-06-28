import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../common/middleware/auth";
import { validate } from "../../common/middleware/validate";
import {
  listPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
} from "./packages.service";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(200),
  roomTypeId: z.string().min(1),
  roomQuantity: z.number().int().positive(),
  price: z.number().positive(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  details: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  roomTypeId: z.string().min(1).optional(),
  roomQuantity: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  details: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ─── Public: list ───
router.get("/", async (req, res) => {
  try {
    const result = await listPackages({
      page: Number(req.query.page) || undefined,
      pageSize: Number(req.query.pageSize) || undefined,
      activeOnly: req.query.activeOnly === "true",
    });
    res.json(result);
  } catch {
    res
      .status(500)
      .json({ error: "Failed to list packages", code: "INTERNAL_ERROR" });
  }
});

// ─── Public: get ───
router.get("/:id", async (req, res) => {
  try {
    const pkg = await getPackage(req.params.id as string);
    res.json(pkg);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Not found";
    if (msg === "Package not found") {
      res.status(404).json({ error: msg, code: "NOT_FOUND" });
      return;
    }
    res
      .status(500)
      .json({ error: "Failed to get package", code: "INTERNAL_ERROR" });
  }
});

// ─── Staff: create ───
router.post(
  "/",
  requireAuth,
  requireRole("admin", "room_staff"),
  validate(createSchema),
  async (req, res) => {
    try {
      const pkg = await createPackage(req.body);
      res.status(201).json(pkg);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Create failed";
      if (msg === "Room type not found") {
        res.status(404).json({ error: msg, code: "NOT_FOUND" });
        return;
      }
      res
        .status(500)
        .json({ error: "Failed to create package", code: "INTERNAL_ERROR" });
    }
  },
);

// ─── Staff: update ───
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin", "room_staff"),
  validate(updateSchema),
  async (req, res) => {
    try {
      const pkg = await updatePackage(req.params.id as string, req.body);
      res.json(pkg);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Update failed";
      if (msg === "Package not found" || msg === "Room type not found") {
        res.status(404).json({ error: msg, code: "NOT_FOUND" });
        return;
      }
      res
        .status(500)
        .json({ error: "Failed to update package", code: "INTERNAL_ERROR" });
    }
  },
);

// ─── Staff: delete ───
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "room_staff"),
  async (req, res) => {
    try {
      await deletePackage(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Delete failed";
      if (msg === "Package not found") {
        res.status(404).json({ error: msg, code: "NOT_FOUND" });
        return;
      }
      if (msg === "Cannot delete package with existing bookings") {
        res.status(409).json({ error: msg, code: "CONFLICT" });
        return;
      }
      res
        .status(500)
        .json({ error: "Failed to delete package", code: "INTERNAL_ERROR" });
    }
  },
);

export default router;
