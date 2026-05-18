import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false }
);

const templateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  bgImage: { type: String, required: true },
  isPremium: { type: Boolean, default: false },
  coverCoords: {
    type: [pointSchema],
    required: true,
    validate: {
      validator: (coords) => Array.isArray(coords) && coords.length === 4,
      message: 'coverCoords должны содержать ровно 4 точки координат',
    },
  },
  spineCoords: {
    type: [pointSchema],
    required: true,
    validate: {
      validator: (coords) => Array.isArray(coords) && coords.length === 4,
      message: 'spineCoords должны содержать ровно 4 точки координат',
    },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Template', templateSchema);
