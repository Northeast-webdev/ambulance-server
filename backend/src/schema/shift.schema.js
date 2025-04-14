const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    shift_start: {
      type: Date,
      required: true,
    },
    shift_end: {
      type: Date,
      required: true,
    },
    crew: {
      driver: {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        start_time: Date,
        end_time: Date,
      },
      doctor: {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        start_time: Date,
        end_time: Date,
      },
      nurse: {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        start_time: Date,
        end_time: Date,
      },
    },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying of shifts by date and vehicle
shiftSchema.index({ date: 1, vehicle: 1 });

module.exports = mongoose.model("Shift", shiftSchema);
