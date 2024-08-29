exports.up = function (knex) {
  return knex.schema.createTable("cars", function (table) {
    table.increments("id").primary();
    table.integer("user_id").nullable().defaultTo(null);
    table.json("meta").notNullable();
    table.string("status").defaultTo("draft");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("cars");
};
