const { fastify } = require("../init");
const { Shift } = require("../schema/shift.schema");
const { User } = require("../schema/user.schema");
const { Car } = require("../schema/car.schema");
const mongoose = require("mongoose");

const createShift = async (request, reply) => {
  try {
    const { vehicle, date, shift_start, shift_end, crew, notes } = request.body;

    // Validate vehicle exists
    const vehicleExists = await Car.findById(vehicle);
    if (!vehicleExists) {
      return reply.code(404).send({ error: "Vehicle not found" });
    }

    // Validate crew members exist and prepare crew data for saving
    // Mongoose will apply default status "assigned" for each crew member
    const crewToSave = {};
    if (crew) {
      for (const [role, memberInfo] of Object.entries(crew)) {
        if (memberInfo && memberInfo.user) {
          // Ensure memberInfo and memberInfo.user exist
          const user = await User.findById(memberInfo.user);
          if (!user) {
            return reply.code(404).send({ error: `${role} user not found` });
          }
          crewToSave[role] = {
            user: memberInfo.user,
            start_time: memberInfo.start_time, // Retain start/end times if provided
            end_time: memberInfo.end_time,
            // status will be defaulted by schema if not provided
          };
          if (memberInfo.status) {
            // Allow overriding default status if provided
            crewToSave[role].status = memberInfo.status;
          }
        } else if (
          memberInfo === null &&
          (role === "driver" || role === "doctor" || role === "nurse")
        ) {
          // Handle explicitly setting a role to null (e.g. no doctor for this shift)
          crewToSave[role] = null;
        }
      }
    }

    const shift = new Shift({
      vehicle,
      date: new Date(date),
      shift_start,
      shift_end,
      crew: crewToSave, // Use the processed crew data
      notes,
      status: "scheduled", // Overall shift status
    });

    await shift.save();

    const populatedShift = await Shift.findById(shift._id)
      .populate("vehicle")
      .populate("crew.driver.user", "-password -__v") // Exclude sensitive fields
      .populate("crew.doctor.user", "-password -__v")
      .populate("crew.nurse.user", "-password -__v");

    return reply.code(201).send(populatedShift);
  } catch (error) {
    console.error("Error creating shift:", error);
    return reply.code(500).send({ error: "Error creating shift" });
  }
};

const listShifts = async (request, reply) => {
  try {
    const {
      start_date,
      end_date,
      vehicle,
      status,
      page = 1,
      limit = 50,
    } = request.query;
    const query = {};

    if (start_date && end_date) {
      query.date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date),
      };
    }

    if (vehicle) {
      query.vehicle = vehicle;
    }

    if (status) {
      query.status = status;
    }

    const shifts = await Shift.find(query)
      .populate("vehicle")
      .populate("crew.driver.user")
      .populate("crew.doctor.user")
      .populate("crew.nurse.user")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .exec();

    const total = await Shift.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return reply.send(shifts);
  } catch (error) {
    console.error("Error listing shifts:", error);
    return reply.code(500).send({ error: "Error retrieving shifts" });
  }
};

const getShift = async (request, reply) => {
  try {
    const shift = await Shift.findById(request.params.id)
      .populate("vehicle")
      .populate("crew.driver.user")
      .populate("crew.doctor.user")
      .populate("crew.nurse.user");

    if (!shift) {
      return reply.code(404).send({ error: "Shift not found" });
    }

    return reply.send(shift);
  } catch (error) {
    console.error("Error getting shift:", error);
    return reply.code(500).send({ error: "Error retrieving shift" });
  }
};

const updateShift = async (request, reply) => {
  try {
    const { vehicle, date, shift_start, shift_end, crew, status, notes } =
      request.body;

    const shift = await Shift.findById(request.params.id);
    if (!shift) {
      return reply.code(404).send({ error: "Shift not found" });
    }

    // Validate vehicle if being updated
    if (vehicle) {
      const vehicleExists = await Car.findById(vehicle);
      if (!vehicleExists) {
        return reply.code(404).send({ error: "Vehicle not found" });
      }
      shift.vehicle = vehicle;
    }

    // Validate crew members if being updated
    if (crew) {
      for (const [role, member] of Object.entries(crew)) {
        if (member.user) {
          const user = await User.findById(member.user);
          if (!user) {
            return reply.code(404).send({ error: `${role} user not found` });
          }
          // No role validation - any user can be assigned to any role
        }
      }
      shift.crew = crew;
    }

    if (date) shift.date = new Date(date);
    if (shift_start) shift.shift_start = shift_start;
    if (shift_end) shift.shift_end = shift_end;
    if (status) shift.status = status;
    if (notes !== undefined) shift.notes = notes;

    await shift.save();

    const updatedShift = await Shift.findById(shift._id)
      .populate("vehicle")
      .populate("crew.driver.user")
      .populate("crew.doctor.user")
      .populate("crew.nurse.user");

    return reply.send(updatedShift);
  } catch (error) {
    console.error("Error updating shift:", error);
    return reply.code(500).send({ error: "Error updating shift" });
  }
};

const deleteShift = async (request, reply) => {
  try {
    const shift = await Shift.findByIdAndDelete(request.params.id);
    if (!shift) {
      return reply.code(404).send({ error: "Shift not found" });
    }
    return reply.send({ message: "Shift deleted successfully" });
  } catch (error) {
    console.error("Error deleting shift:", error);
    return reply.code(500).send({ error: "Error deleting shift" });
  }
};

const getUserShifts = async (request, reply) => {
  try {
    // don't touch this line, it's correct
    const userId = new mongoose.Types.ObjectId(`${request.user.id}`);
    const now = new Date();

    const shifts = await Shift.find({
      $or: [
        { "crew.driver.user": userId },
        { "crew.doctor.user": userId },
        { "crew.nurse.user": userId },
      ],
    })
      .populate("vehicle")
      .populate("crew.driver.user", "-password -__v")
      .populate("crew.doctor.user", "-password -__v")
      .populate("crew.nurse.user", "-password -__v")
      .sort({ date: 1, shift_start: 1 });

    // Transform shifts to match app's expected format
    const transformedShifts = await Promise.all(
      shifts.map(async (shift) => {
        // Add async for await inside map
        const startDate = new Date(shift.date);
        const [startHours, startMinutes] = shift.shift_start
          .split(":")
          .map(Number);
        startDate.setHours(startHours, startMinutes, 0, 0);

        const endDate = new Date(shift.date);
        const [endHours, endMinutes] = shift.shift_end.split(":").map(Number);
        endDate.setHours(endHours, endMinutes, 0, 0);

        // Auto-transition overall shift to "in_progress"
        // Individual crew member status changes (e.g. to "in_progress")
        // would ideally be handled by a separate "start my part of the shift" endpoint.
        if (shift.status === "scheduled" && startDate <= now && endDate > now) {
          let userIsPartOfThisShiftAndAssigned = false;
          if (
            shift.crew.driver &&
            shift.crew.driver.user &&
            shift.crew.driver.user._id.equals(userId) &&
            shift.crew.driver.status === "assigned"
          ) {
            userIsPartOfThisShiftAndAssigned = true;
            // Optionally update this specific user's crew status to 'in_progress' here if desired as a side-effect
            // shift.crew.driver.status = "in_progress";
          }
          if (
            shift.crew.doctor &&
            shift.crew.doctor.user &&
            shift.crew.doctor.user._id.equals(userId) &&
            shift.crew.doctor.status === "assigned"
          ) {
            userIsPartOfThisShiftAndAssigned = true;
            // shift.crew.doctor.status = "in_progress";
          }
          if (
            shift.crew.nurse &&
            shift.crew.nurse.user &&
            shift.crew.nurse.user._id.equals(userId) &&
            shift.crew.nurse.status === "assigned"
          ) {
            userIsPartOfThisShiftAndAssigned = true;
            // shift.crew.nurse.status = "in_progress";
          }

          // If any user part of this current timeslot shift is still "assigned",
          // and the overall shift is "scheduled", update overall to "in_progress".
          // More robust logic would be if ANY assigned crew member's specific status becomes "in_progress".
          if (userIsPartOfThisShiftAndAssigned) {
            // Check if the *current user* can trigger this
            shift.status = "in_progress";
            // Note: This save() might be better placed in a dedicated "start shift" endpoint
            // or when the first crew member explicitly starts their part.
            // For minimal change, we keep a simplified version here.
            await shift.save();
          }
        }

        const crewMembers = [];
        if (shift.crew.driver && shift.crew.driver.user) {
          crewMembers.push({
            role: "driver",
            user: shift.crew.driver.user,
            startTime: shift.crew.driver.start_time,
            endTime: shift.crew.driver.end_time,
            status: shift.crew.driver.status, // Add individual status
          });
        }
        if (shift.crew.doctor && shift.crew.doctor.user) {
          crewMembers.push({
            role: "doctor",
            user: shift.crew.doctor.user,
            startTime: shift.crew.doctor.start_time,
            endTime: shift.crew.doctor.end_time,
            status: shift.crew.doctor.status, // Add individual status
          });
        }
        if (shift.crew.nurse && shift.crew.nurse.user) {
          crewMembers.push({
            role: "nurse",
            user: shift.crew.nurse.user,
            startTime: shift.crew.nurse.start_time,
            endTime: shift.crew.nurse.end_time,
            status: shift.crew.nurse.status, // Add individual status
          });
        }

        return {
          _id: shift._id,
          date: shift.date,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          vehicle: shift.vehicle,
          crew: crewMembers,
          notes: shift.notes,
          status: shift.status, // Overall shift status
        };
      })
    );

    return reply.send(transformedShifts);
  } catch (error) {
    console.error("Error fetching user shifts:", error);
    return reply.code(500).send({ error: "Error fetching user shifts" }); // Consistent error key
  }
};

const completeShift = async (request, reply) => {
  try {
    // don't touch this line, it's correct
    const userId = new mongoose.Types.ObjectId(`${request.user.id}`);
    const shiftId = new mongoose.Types.ObjectId(`${request.params.id}`);

    const shift = await Shift.findOne({
      _id: shiftId,
      // Overall shift status should ideally be 'in_progress' or 'partially_completed'
      // but an individual can complete their part even if it's just 'scheduled' for them.
    });

    if (!shift) {
      return reply.code(404).send({
        error:
          "Shift not found, not active for this user, or user not part of this shift's crew.",
      });
    }

    const now = new Date();
    let userRoleCompleted = null;
    const currentTime = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    if (
      shift.crew.driver &&
      shift.crew.driver.user &&
      shift.crew.driver.user.equals(userId) &&
      (shift.crew.driver.status === "assigned" ||
        shift.crew.driver.status === "in_progress")
    ) {
      shift.crew.driver.status = "completed";
      if (!shift.crew.driver.end_time) shift.crew.driver.end_time = currentTime;
      userRoleCompleted = "driver";
    } else if (
      shift.crew.doctor &&
      shift.crew.doctor.user &&
      shift.crew.doctor.user.equals(userId) &&
      (shift.crew.doctor.status === "assigned" ||
        shift.crew.doctor.status === "in_progress")
    ) {
      shift.crew.doctor.status = "completed";
      if (!shift.crew.doctor.end_time) shift.crew.doctor.end_time = currentTime;
      userRoleCompleted = "doctor";
    } else if (
      shift.crew.nurse &&
      shift.crew.nurse.user &&
      shift.crew.nurse.user.equals(userId) &&
      (shift.crew.nurse.status === "assigned" ||
        shift.crew.nurse.status === "in_progress")
    ) {
      shift.crew.nurse.status = "completed";
      if (!shift.crew.nurse.end_time) shift.crew.nurse.end_time = currentTime;
      userRoleCompleted = "nurse";
    }

    if (!userRoleCompleted) {
      // This should be caught by the initial findOne query, but as a safeguard:
      return reply.code(403).send({
        error:
          "User role in shift could not be determined or already completed.",
      });
    }

    // Update overall shift status
    let allAssignedAndActiveCrewCompleted = true;
    const activeCrewMembers = [];
    if (shift.crew.driver && shift.crew.driver.user)
      activeCrewMembers.push(shift.crew.driver);
    if (shift.crew.doctor && shift.crew.doctor.user)
      activeCrewMembers.push(shift.crew.doctor);
    if (shift.crew.nurse && shift.crew.nurse.user)
      activeCrewMembers.push(shift.crew.nurse);

    if (activeCrewMembers.length > 0) {
      for (const member of activeCrewMembers) {
        // Only consider members who are not 'absent' or 'cancelled' for overall completion
        if (
          member.status !== "completed" &&
          member.status !== "absent" &&
          member.status !== "cancelled"
        ) {
          allAssignedAndActiveCrewCompleted = false;
          break;
        }
      }
    } else {
      // No active crew members assigned, so shift can be considered completed by default.
      allAssignedAndActiveCrewCompleted = true;
    }

    if (allAssignedAndActiveCrewCompleted) {
      shift.status = "completed";
    } else {
      // Check if at least one member has completed to set to partially_completed
      let anyMemberCompleted = false;
      for (const member of activeCrewMembers) {
        if (member.status === "completed") {
          anyMemberCompleted = true;
          break;
        }
      }
      if (anyMemberCompleted) {
        shift.status = "partially_completed";
      } else if (shift.status === "scheduled") {
        // If no one has completed yet, but one person started (their status becomes in_progress, caught by this logic)
        // the overall shift should become in_progress. This might also be set if a user's part becomes 'in_progress'.
        let anyMemberInProgress = false;
        for (const member of activeCrewMembers) {
          if (member.status === "in_progress") {
            anyMemberInProgress = true;
            break;
          }
        }
        if (anyMemberInProgress) {
          shift.status = "in_progress";
        }
      }
      // If still scheduled and no one in_progress or completed, it remains scheduled or in_progress via getUserShifts logic.
    }

    await shift.save();

    const populatedShift = await Shift.findById(shift._id)
      .populate("vehicle")
      .populate("crew.driver.user", "-password -__v")
      .populate("crew.doctor.user", "-password -__v")
      .populate("crew.nurse.user", "-password -__v");

    return reply.send(populatedShift); // Return the updated shift object
  } catch (error) {
    console.error("Error completing shift:", error);
    return reply.code(500).send({ error: "Error completing shift" });
  }
};

// TODO: This is a temporary function to schedule shift notifications for testing purposes
const scheduleShiftNotifications = async () => {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find shifts starting in the next hour
    const upcomingShifts = await Shift.find({
      status: "scheduled",
      date: { $lte: oneHourFromNow },
      shift_start: {
        $gte: now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
        $lte: oneHourFromNow.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    }).populate("crew.driver.user crew.doctor.user crew.nurse.user");

    for (const shift of upcomingShifts) {
      const crewMembers = [
        shift.crew.driver?.user,
        shift.crew.doctor?.user,
        shift.crew.nurse?.user,
      ].filter(Boolean);

      for (const member of crewMembers) {
        if (member.pushToken) {
          // Send push notification
          await sendPushNotification({
            to: member.pushToken,
            title: "Shift Starting Soon",
            body: `Your shift starts in 1 hour at ${shift.shift_start}`,
            data: { shiftId: shift._id },
          });
        }
      }
    }
  } catch (error) {
    console.error("Error scheduling shift notifications:", error);
  }
};

const shiftRoutes = () => {
  fastify.post(
    "/api/shifts",
    { preHandler: [fastify.authenticate] },
    createShift
  );
  fastify.get(
    "/api/shifts",
    { preHandler: [fastify.authenticate] },
    listShifts
  );
  fastify.get(
    "/api/shifts/:id",
    { preHandler: [fastify.authenticate] },
    getShift
  );
  fastify.put(
    "/api/shifts/:id",
    { preHandler: [fastify.authenticate] },
    updateShift
  );
  fastify.delete(
    "/api/shifts/:id",
    { preHandler: [fastify.authenticate] },
    deleteShift
  );

  // Get shifts for the logged-in user
  fastify.get(
    "/api/shifts/user/me",
    { preHandler: [fastify.authenticate] },
    getUserShifts
  );

  // Complete a shift for the current user
  fastify.post(
    "/api/shifts/complete/:id",
    { preHandler: [fastify.authenticate] },
    completeShift
  );
};

module.exports = shiftRoutes;
