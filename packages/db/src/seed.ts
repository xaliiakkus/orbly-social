import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "./lib/mongoose.js";
import { User } from "./models/User.js";
import { Orbit } from "./models/Orbit.js";

const ORBITS = [
  { slug: "tech", name: "Tech", description: "Yazılım, donanım ve startup dünyası" },
  { slug: "design", name: "Design", description: "UI/UX, grafik ve ürün tasarımı" },
  { slug: "gaming", name: "Gaming", description: "Oyun, e-spor ve oyun geliştirme" },
  { slug: "music", name: "Music", description: "Müzik, prodüksiyon ve konserler" },
  { slug: "fitness", name: "Fitness", description: "Spor, sağlık ve wellness" },
  { slug: "crypto", name: "Crypto", description: "Blockchain, DeFi ve Web3" },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI required");
    process.exit(1);
  }

  await connectDB(uri);

  for (const o of ORBITS) {
    const existing = await Orbit.findOne({ slug: o.slug });
    if (!existing) {
      await Orbit.create({ ...o, stats: { memberCount: 0, postCount: 0 } });
    }
  }

  const passwordHash = await bcrypt.hash("password123", 12);
  const existingUser = await User.findOne({ email: "demo@orbly.social" });
  if (!existingUser) {
    await User.create({
      username: "demo",
      displayName: "Demo User",
      email: "demo@orbly.social",
      passwordHash,
      onboarded: true,
      bio: "Orbly demo hesabı",
    });
  }

  console.log("Seed complete:", ORBITS.length, "orbits + demo user");
  await disconnectDB();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
