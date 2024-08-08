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
const getAllReservations = function(guest_id, limit = 10) {
  console.log(guest_id, limit)
  return pool
    .query(`
    SELECT 
      reservations.*,
      properties.*,
      AVG(rating) AS average_rating
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
const getAllProperties = function(options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city.toLowerCase()}%`);
    queryString += `WHERE LOWER(city) LIKE $${queryParams.length} `;
  }

  // 5
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `${queryString.includes('WHERE') ? 'AND' : 'WHERE'} owner_id = $${queryParams.length} `;
  }

  // 6
  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100); // Convert dollar expectation to cents
    queryString += `${queryString.includes('WHERE') ? 'AND' : 'WHERE'} cost_per_night >= $${queryParams.length} `;
  }

  // 7
  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100); // Convert dollar expectation to cents
    queryString += `${queryString.includes('WHERE') ? 'AND' : 'WHERE'} cost_per_night <= $${queryParams.length} `;
  }

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `${queryString.includes('WHERE') ? 'AND' : 'WHERE'} rating >= $${queryParams.length} `;
  }

  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows)
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const queryText = `
    INSERT INTO properties (
      title, description, number_of_bedrooms, number_of_bathrooms, parking_spaces, 
      cost_per_night, thumbnail_photo_url, cover_photo_url, street, country, 
      city, province, post_code, owner_id
    ) 
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    ) RETURNING *;
  `;

  const values = [
    property.title, property.description, property.number_of_bedrooms,
    property.number_of_bathrooms, property.parking_spaces, property.cost_per_night,
    property.thumbnail_photo_url, property.cover_photo_url, property.street,
    property.country, property.city, property.province, property.post_code,
    property.owner_id
  ];

  return pool.query(queryText, values)
    .then(result => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch(error => {
      console.error('Error executing query', error.stack);
    });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
