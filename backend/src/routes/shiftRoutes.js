module.exports = (fastify) => {
  // Get shifts for the current user
  fastify.get(
    "/api/shifts/user",
    { preHandler: [fastify.authenticate] },
    shiftController.getUserShifts
  );

  // Complete a shift for the current user
  fastify.post(
    "/api/shifts/complete/:id",
    { preHandler: [fastify.authenticate] },
    shiftController.completeShift
  );
};
