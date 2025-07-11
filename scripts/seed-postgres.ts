import { db } from '../lib/database'; // Assuming you have a db connection setup
import { sampleData } from '../lib/sample-data';

async function seedPostgres() {
  console.log('Seeding PostgreSQL database...');

  try {
    // Assuming you have tables corresponding to your sampleData structure
    // You'll need to adjust these queries based on your actual table names and schema

    // Clear existing data (optional, but good for a fresh seed)
    await db.query('TRUNCATE TABLE auctions RESTART IDENTITY CASCADE;');
    await db.query('TRUNCATE TABLE lots RESTART IDENTITY CASCADE;');
    await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
    await db.query('TRUNCATE TABLE bids RESTART IDENTITY CASCADE;');
    // Add more tables as needed

    // Insert sample data
    for (const auction of sampleData.auctions) {
      await db.query(
        'INSERT INTO auctions (id, title, description, startDate, endDate) VALUES ($1, $2, $3, $4, $5)',
        [auction.id, auction.title, auction.description, auction.startDate, auction.endDate]
      );
    }

    for (const lot of sampleData.lots) {
      await db.query(
        'INSERT INTO lots (id, auctionId, title, description, startingBid, currentBid) VALUES ($1, $2, $3, $4, $5, $6)',
        [lot.id, lot.auctionId, lot.title, lot.description, lot.startingBid, lot.currentBid]
      );
    }

    for (const user of sampleData.users) {
      await db.query(
        'INSERT INTO users (id, name, email) VALUES ($1, $2, $3)',
        [user.id, user.name, user.email]
      );
    }

    for (const bid of sampleData.bids) {
      await db.query(
        'INSERT INTO bids (id, lotId, userId, amount) VALUES ($1, $2, $3, $4)',
        [bid.id, bid.lotId, bid.userId, bid.amount]
      );
    }

    console.log('PostgreSQL database seeded successfully.');

  } catch (error) {
    console.error('Error seeding PostgreSQL database:', error);
  } finally {
    // Close database connection if necessary
    // await db.end();
  }
}

seedPostgres();