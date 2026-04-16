import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/user.schema";

interface DuplicateRecord {
  id: mongoose.Types.ObjectId;
  createdAt: Date;
  username: string;
  tenantId?: mongoose.Types.ObjectId;
  tenantName?: string;
}

interface DuplicateGroup {
  _id: string; // email
  records: DuplicateRecord[];
  count: number;
}

const isDryRun = process.argv.includes("--dry-run");

const connectToDatabase = async (): Promise<void> => {
  const mongoUri =
    process.env.MONGODB_URI ||
    `mongodb://${process.env.MONGODB_HOST || "localhost:27017"}/${
      process.env.DB_NAME || "user-api"
    }`;

  console.log("🔄 Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");
};

const findDuplicateEmails = async (): Promise<DuplicateGroup[]> => {
  const duplicates = (await User.aggregate([
    {
      $match: {
        email: { $exists: true, $nin: [null, ""] },
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: "$email",
        records: {
          $push: {
            id: "$_id",
            createdAt: "$createdAt",
            username: "$username",
            tenantId: "$tenantId",
            tenantName: "$tenantName",
          },
        },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
  ])) as DuplicateGroup[];

  return duplicates;
};

const removeDuplicateEmails = async (): Promise<void> => {
  await connectToDatabase();

  try {
    const duplicates = await findDuplicateEmails();

    if (!duplicates.length) {
      console.log("🎉 No duplicate emails found.");
      return;
    }

    if (isDryRun) {
      console.log("🧪 Dry run enabled - no records will be deleted.");
    }

    let totalRemoved = 0;

    for (const group of duplicates) {
      const sortedRecords = group.records.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const [recordToKeep, ...duplicatesToRemove] = sortedRecords;

      if (!recordToKeep || duplicatesToRemove.length === 0) {
        continue;
      }

      const idsToRemove = duplicatesToRemove.map((record) => record.id);

      console.log(
        `\n📧 Email: ${group._id}\n   Keeping: ${recordToKeep.id.toString()} (${recordToKeep.username})\n   Removing: ${idsToRemove
          .map((id) => id.toString())
          .join(", ")}`
      );

      if (!isDryRun) {
        const result = await User.deleteMany({ _id: { $in: idsToRemove } });
        totalRemoved += result.deletedCount || 0;
      } else {
        totalRemoved += idsToRemove.length;
      }
    }

    console.log(
      `\n✅ Duplicate cleanup complete. Total records removed: ${totalRemoved}`
    );
  } catch (error) {
    console.error("❌ Error removing duplicate users:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  }
};

removeDuplicateEmails();


