exports.up = async function (knex) {
  return knex.schema.createTable("users", function (table) {
    table.increments("id").primary();
    table.string("first_name").notNullable();
    table.string("last_name").notNullable();
    table.string("email").unique().notNullable();
    table.string("dob").notNullable();
    table.string("username").unique().notNullable();
    table.string("password").notNullable();
    table.string("role").defaultTo("driver");
    table.string("driver_status").defaultTo("free");
    table.string("phone").notNullable();
    table.integer("car_id").nullable().defaultTo(null);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  return knex.schema.dropTable("users");
};
