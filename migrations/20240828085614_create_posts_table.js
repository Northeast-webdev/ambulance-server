exports.up = function (knex) {
  return knex.schema.createTable("runs", function (table) {
    table.increments("id").primary();
    table.integer("car_id").nullable().defaultTo(null);
    table.string("title").notNullable();
    table.json("meta").notNullable();
    table.string("status").defaultTo("draft");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("runs");
};
