const request = require('supertest');

// 🔴 ВАЖЛИВО: перевір шлях!
// якщо у тебе server.js або index.js — зміни тут
const app = require('../app'); 

describe('EVENTS MANAGER - FULL TEST SUITE', () => {

  // ==============================
  // 📌 EVENTS
  // ==============================
  describe('Events API', () => {

    test('GET /events - should return all events', async () => {
      const res = await request(app).get('/events');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /events/:id - should return single event', async () => {
      const res = await request(app).get('/events/1');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
    });

    test('GET /events/:id - invalid ID', async () => {
      const res = await request(app).get('/events/999999');

      // може бути 404 або 200 з null
      expect([200, 404]).toContain(res.statusCode);
    });

  });

  // ==============================
  // 📌 HOTELS NEAR EVENT (логіка через event location)
  // ==============================
  describe('Hotels near event logic', () => {

    test('Event should contain location data', async () => {
      const res = await request(app).get('/events/1');

      expect(res.statusCode).toBe(200);

      // перевіряємо координати (для карти/готелів)
      expect(
        res.body.hasOwnProperty('location') ||
        res.body.hasOwnProperty('latitude')
      ).toBe(true);
    });

  });

  // ==============================
  // 📌 MAP (координати)
  // ==============================
  describe('Map data validation', () => {

    test('Events should contain coordinates for map', async () => {
      const res = await request(app).get('/events');

      expect(res.statusCode).toBe(200);

      if (res.body.length > 0) {
        const event = res.body[0];

        expect(
          event.hasOwnProperty('latitude') ||
          event.hasOwnProperty('location')
        ).toBe(true);
      }
    });

  });

  // ==============================
  // 📌 BOOKING (external links)
  // ==============================
  describe('Booking functionality', () => {

    test('Event may contain booking link', async () => {
      const res = await request(app).get('/events/1');

      expect(res.statusCode).toBe(200);

      // перевірка чи є поле з лінком
      const hasBooking =
        res.body.hasOwnProperty('bookingUrl') ||
        res.body.hasOwnProperty('link') ||
        res.body.hasOwnProperty('url');

      expect(hasBooking).toBe(true);
    });

  });

  // ==============================
  // 📌 EDGE CASES
  // ==============================
  describe('Edge cases', () => {

    test('Invalid route should return 404', async () => {
      const res = await request(app).get('/invalid-route');

      expect(res.statusCode).toBe(404);
    });

    test('Server should respond with JSON', async () => {
      const res = await request(app).get('/events');

      expect(res.headers['content-type']).toMatch(/json/);
    });

  });

});