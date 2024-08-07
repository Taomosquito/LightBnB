const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  user: "labber",
  password: "labber",
  host: "localhost",
  database: "lightbnb",
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool.query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((result) => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool.query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((result) => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  const verifyUserNotExist = `SELECT * FROM users WHERE email LIKE $1`
  const insertQueryString = `INSERT INTO users(name, email, password) VALUES ($1,$2,$3) RETURNING id;`
  console.log(`sign-up password: ${user.password}`);
  return pool.query(verifyUserNotExist, [user.email])
    .then((result) => {
      if (!result.rows.length) {
        return pool.query(insertQueryString,
          [user.name, user.email, user.password])
      }
      throw new Error('user exists in database already')
    })
    .then((result) => {
      console.log(result);
      return result;
    })
    .catch((err) => {
      console.log(err.message);
    });

};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 20) {
  /*return getAllProperties(null, 2);*/
  console.log(guest_id, limit)
  return pool
    .query(`
    SELECT 
      reservations.*,
      properties.*
    FROM property_reviews
    JOIN properties ON properties.id = property_reviews.property_id
    JOIN reservations ON reservations.id = property_reviews.reservation_id
    WHERE reservations.guest_id = $1
    LIMIT $2;
    `, [guest_id, limit])
    .then((result) => {
      console.log(result.rows.length);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
// Refactored Already.
const getAllProperties = function(options, limit = 10) {
  return pool
    .query(`SELECT * FROM properties LIMIT $1;`, [limit])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });

};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
