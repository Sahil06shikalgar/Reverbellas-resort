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
    standardWeekdayRate: 0,
    standardWeekendRate: 0,
    active: true
  },
  {
    propertyCode: "ROOM-101",
    name: "Room 101",
    type: "room",
    maxAdults: 2,
    maxChildren: 2,
    maxGuests: 4,
    standardWeekdayRate: 0,
    standardWeekendRate: 0,
    active: true
  },
  {
    propertyCode: "ROOM-102",
    name: "Room 102",
    type: "room",
    maxAdults: 2,
    maxChildren: 2,
    maxGuests: 4,
    standardWeekdayRate: 0,
    standardWeekendRate: 0,
    active: true
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
    active: true
  },
  {
    propertyCode: "LAKESIDE-TENT",
    name: "Lakeside Tent",
    type: "tent",
    maxAdults: 2,
    maxChildren: 2,
    maxGuests: 4,
    standardWeekdayRate: 0,
    standardWeekendRate: 0,
    active: true
  }
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
