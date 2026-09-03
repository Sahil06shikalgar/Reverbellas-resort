import dotenv from "dotenv";
import Property from "../models/Property.js";
import connectDB from "../config/db.js";

const STARTER = [
  {
    propertyCode: "FULL-VILLA",
    name: "Full Villa",
    type: "villa",
    maxAdults: 8,
    maxChildren: 4,
    maxGuests: 12,
    standardWeekdayRate: 45000,
    standardWeekendRate: 55000,
    description:
      "The entire Riverbells villa to yourselves — four bedrooms, a private pool, and a sprawling lawn overlooking the lake.",
    amenities: ["4 Bedrooms", "Private Pool", "Lake View", "Wardrobe", "AC"],
    images: ["FULL-VILLA"],
    bookableFromWebsite: true,
    active: true,
  },
  {
    propertyCode: "ROOM-101",
    name: "Room 101",
    type: "room",
    maxAdults: 2,
    maxChildren: 2,
    maxGuests: 4,
    standardWeekdayRate: 6000,
    standardWeekendRate: 8000,
    description:
      "A bright garden-facing room with a king bed, ensuite bath, and a private balcony for slow morning coffees.",
    amenities: ["King Bed", "AC", "Balcony", "Hot Water"],
    images: ["ROOM-101"],
    bookableFromWebsite: true,
    active: true,
  },
  {
    propertyCode: "ROOM-102",
    name: "Room 102",
    type: "room",
    maxAdults: 2,
    maxChildren: 2,
    maxGuests: 4,
    standardWeekdayRate: 6000,
    standardWeekendRate: 8000,
    description:
      "A twin-toward-the-lake room with lake-facing windows, ensuite bath, and easy access to the pool deck.",
    amenities: ["Lake View", "AC", "King Bed", "Ensuite Bath"],
    images: ["ROOM-102"],
    bookableFromWebsite: true,
    active: true,
  },
  {
    propertyCode: "MARRIAGE-LAWN",
    name: "Marriage Lawn",
    type: "lawn",
    maxAdults: 100,
    maxChildren: 50,
    maxGuests: 150,
    standardWeekdayRate: 0,
    standardWeekendRate: 0,
    description: "Expansive lawn for weddings and events, booked on enquiry.",
    amenities: ["Event Lawn", "Seating", "Lighting", "Parking"],
    images: ["MARRIAGE-LAWN"],
    bookableFromWebsite: false,
    active: true,
  },
  {
    propertyCode: "LAKESIDE-TENT",
    name: "Lakeside Tent",
    type: "tent",
    maxAdults: 2,
    maxChildren: 2,
    maxGuests: 4,
    standardWeekdayRate: 4500,
    standardWeekendRate: 6000,
    description:
      "Glamping right by the water — a king bed, ensuite bath, and a wooden deck that reaches out over the lake.",
    amenities: ["Lake View", "King Bed", "Ensuite", "Deck"],
    images: ["LAKESIDE-TENT"],
    bookableFromWebsite: true,
    active: true,
  },
];

export const seedIfEmpty = async () => {
  const existing = await Property.countDocuments();

  if (existing > 0) {
    return { seeded: false, reason: "Properties already exist" };
  }

  const fullVilla = await Property.create({
    ...STARTER[0],
    childProperties: []
  });

  const room101 = await Property.create({
    ...STARTER[1],
    parentProperty: fullVilla._id
  });

  const room102 = await Property.create({
    ...STARTER[2],
    parentProperty: fullVilla._id
  });

  fullVilla.childProperties = [room101._id, room102._id];
  await fullVilla.save();

  await Property.create({
    ...STARTER[3]
  });

  await Property.create({
    ...STARTER[4]
  });

  console.log("Riverbells starter properties created.");
  return { seeded: true, reason: "Starter properties created" };
};

const runDirect = process.argv[2] === "seed";

if (runDirect) {
  const start = async () => {
    try {
      dotenv.config();
      await connectDB();
      const res = await seedIfEmpty();
      console.log(res);
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  };
  start();
}
