import Template from '../models/Template.js';
import { saveTemplateFile, deleteTemplateFile } from '../utils/fileStorage.js';

const isValidPoint = (point) =>
  point &&
  typeof point === 'object' &&
  Number.isFinite(Number(point.x)) &&
  Number.isFinite(Number(point.y));

const validateQuad = (coords, fieldName) => {
  if (!Array.isArray(coords) || coords.length !== 4) {
    return `${fieldName} must be an array of exactly 4 {x, y} points`;
  }
  for (let i = 0; i < coords.length; i += 1) {
    if (!isValidPoint(coords[i])) {
      return `${fieldName}[${i}] must include numeric x and y values`;
    }
  }
  return null;
};

const parseCoordsField = (value, fieldName) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`${fieldName} JSON formati noto'g'ri`);
    }
  }
  return value;
};

const toPublicTemplate = (doc) => {
  const item = doc.toObject ? doc.toObject() : doc;
  return {
    ...item,
    bgImageUrl: item.bgImage,
  };
};

export const getTemplates = async (_req, res) => {
  try {
    const templates = await Template.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      success: true,
      data: templates.map((t) => ({ ...t, bgImageUrl: t.bgImage })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message,
    });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id).lean();
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    return res.status(200).json({
      success: true,
      data: { ...template, bgImageUrl: template.bgImage },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
      error: error.message,
    });
  }
};

export const createTemplate = async (req, res) => {
  let savedPath = null;

  try {
    const { title, isPremium } = req.body;
    const coverCoords = parseCoordsField(req.body.coverCoords, 'coverCoords');
    const spineCoords = parseCoordsField(req.body.spineCoords, 'spineCoords');

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'title is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'templateImage fayli talab qilinadi' });
    }

    const coverError = validateQuad(coverCoords, 'coverCoords');
    if (coverError) {
      return res.status(400).json({ success: false, message: coverError });
    }

    const spineError = validateQuad(spineCoords, 'spineCoords');
    if (spineError) {
      return res.status(400).json({ success: false, message: spineError });
    }

    savedPath = await saveTemplateFile(req.file.buffer, req.file.originalname, req.file.mimetype);

    const template = await Template.create({
      title: title.trim(),
      bgImage: savedPath,
      isPremium: isPremium === true || isPremium === 'true',
      coverCoords: coverCoords.map((p) => ({ x: Number(p.x), y: Number(p.y) })),
      spineCoords: spineCoords.map((p) => ({ x: Number(p.x), y: Number(p.y) })),
    });

    return res.status(201).json({ success: true, data: toPublicTemplate(template) });
  } catch (error) {
    if (savedPath) {
      await deleteTemplateFile(savedPath);
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message,
    });
  }
};

export const updateTemplate = async (req, res) => {
  let savedPath = null;
  let oldBgImage = null;

  try {
    const { id } = req.params;
    const existing = await Template.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const { title, isPremium } = req.body;
    const coverCoords = parseCoordsField(req.body.coverCoords, 'coverCoords');
    const spineCoords = parseCoordsField(req.body.spineCoords, 'spineCoords');

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'title is required' });
    }

    const coverError = validateQuad(coverCoords, 'coverCoords');
    if (coverError) {
      return res.status(400).json({ success: false, message: coverError });
    }

    const spineError = validateQuad(spineCoords, 'spineCoords');
    if (spineError) {
      return res.status(400).json({ success: false, message: spineError });
    }

    const updates = {
      title: title.trim(),
      isPremium: isPremium === true || isPremium === 'true',
      coverCoords: coverCoords.map((p) => ({ x: Number(p.x), y: Number(p.y) })),
      spineCoords: spineCoords.map((p) => ({ x: Number(p.x), y: Number(p.y) })),
    };

    if (req.file) {
      savedPath = await saveTemplateFile(req.file.buffer, req.file.originalname, req.file.mimetype);
      oldBgImage = existing.bgImage;
      updates.bgImage = savedPath;
    }

    const template = await Template.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (oldBgImage) {
      await deleteTemplateFile(oldBgImage);
    }

    return res.status(200).json({ success: true, data: toPublicTemplate(template) });
  } catch (error) {
    if (savedPath) {
      await deleteTemplateFile(savedPath);
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message,
    });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Template.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(400).json({ success: false, message: 'Template not found' });
    }

    await deleteTemplateFile(deleted.bgImage);

    return res.status(200).json({ success: true, message: 'Template deleted', data: deleted });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error.message,
    });
  }
};
