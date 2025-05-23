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
      type: String,
      required: true,
    },
    shift_end: {
      type: String,
      required: true,
    },
    crew: {
      driver: {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        start_time: String,
        end_time: String,
        status: {
          type: String,
          enum: ["assigned", "in_progress", "completed", "absent", "cancelled"],
          default: "assigned",
        },
      },
      doctor: {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        start_time: String,
        end_time: String,
        status: {
          type: String,
          enum: ["assigned", "in_progress", "completed", "absent", "cancelled"],
          default: "assigned",
        },
      },
      nurse: {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        start_time: String,
        end_time: String,
        status: {
          type: String,
          enum: ["assigned", "in_progress", "completed", "absent", "cancelled"],
          default: "assigned",
        },
      },
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "in_progress",
        "partially_completed",
        "completed",
        "cancelled",
      ],
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

const Shift = mongoose.model("Shift", shiftSchema);

module.exports = { Shift, shiftSchema };
