import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"
import "dotenv/config"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  const password = await hash("admin123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@disciplingforjesus.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@disciplingforjesus.com",
      password,
      role: "ADMIN",
    },
  })
  console.log("Admin user created:", admin.email)

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@example.com",
      password: await hash("demo123", 12),
      role: "USER",
    },
  })
  console.log("Demo user created:", demoUser.email)

  const categories = [
    { name: "Discipleship Basics", slug: "discipleship-basics", order: 1 },
    { name: "Bible Study Guides", slug: "bible-study-guides", order: 2 },
    { name: "Prayer & Devotion", slug: "prayer-devotion", order: 3 },
    { name: "Evangelism Training", slug: "evangelism-training", order: 4 },
    { name: "Church Planting", slug: "church-planting", order: 5 },
    { name: "Leadership Development", slug: "leadership-development", order: 6 },
    { name: "Youth Ministry", slug: "youth-ministry", order: 7 },
    { name: "Worship Resources", slug: "worship-resources", order: 8 },
    { name: "Family & Marriage", slug: "family-marriage", order: 9 },
    { name: "Apologetics", slug: "apologetics", order: 10 },
    { name: "Spiritual Warfare", slug: "spiritual-warfare", order: 11 },
    { name: "Missions", slug: "missions", order: 12 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }
  console.log("Categories created:", categories.length)

  const allCategories = await prisma.category.findMany()

  const resources = [
    {
      title: "Foundations of Discipleship",
      description:
        "A comprehensive guide to understanding what it means to be a disciple of Jesus Christ. Covers the basics of following Jesus, spiritual disciplines, and the call to make disciples.",
      categorySlug: "discipleship-basics",
      featured: true,
    },
    {
      title: "The Great Commission Study",
      description:
        "An in-depth study of Matthew 28:19-20 exploring the command, promise, and practice of making disciples among all nations. Includes practical applications for today's church.",
      categorySlug: "discipleship-basics",
      featured: true,
    },
    {
      title: "How to Study the Bible",
      description:
        "A practical guide to personal Bible study. Learn observation, interpretation, and application methods to dig deeper into God's Word.",
      categorySlug: "bible-study-guides",
      featured: true,
    },
    {
      title: "Inductive Bible Study Method",
      description:
        "Master the inductive method of Bible study: observation, interpretation, and application. Includes worksheets and practice passages.",
      categorySlug: "bible-study-guides",
      featured: false,
    },
    {
      title: "Developing a Prayer Life",
      description:
        "Practical teaching on cultivating a consistent and powerful prayer life. Covers different types of prayer, overcoming obstacles, and prayer journaling.",
      categorySlug: "prayer-devotion",
      featured: true,
    },
    {
      title: "Sharing Your Faith Naturally",
      description:
        "Learn how to share the Gospel in everyday conversations without being awkward or pushy. Includes conversation starters and common objections with biblical responses.",
      categorySlug: "evangelism-training",
      featured: true,
    },
    {
      title: "Starting a House Church",
      description:
        "A step-by-step guide to planting simple churches that multiply. Covers gathering people, leading discussions, worship, and developing new leaders.",
      categorySlug: "church-planting",
      featured: false,
    },
    {
      title: "Servant Leadership",
      description:
        "Biblical principles for Christian leadership based on Jesus' model of servant leadership. Practical for pastors, ministry leaders, and small group facilitators.",
      categorySlug: "leadership-development",
      featured: true,
    },
  ]

  for (const resource of resources) {
    const category = allCategories.find((c) => c.slug === resource.categorySlug)
    if (!category) continue

    await prisma.resource.upsert({
      where: { id: `${resource.categorySlug}-${resource.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` },
      update: {},
      create: {
        id: `${resource.categorySlug}-${resource.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        title: resource.title,
        description: resource.description,
        categoryId: category.id,
        featured: resource.featured,
        uploadedById: admin.id,
      },
    })
  }
  console.log("Resources created:", resources.length)

  // Create dummy resource files (no actual PDFs, just records)
  const createdResources = await prisma.resource.findMany()

  for (const resource of createdResources) {
    const langs = ["en", "bm", "hi"]
    for (const lang of langs) {
      const existing = await prisma.resourceFile.findFirst({
        where: { resourceId: resource.id, language: lang },
      })
      if (!existing) {
        await prisma.resourceFile.create({
          data: {
            resourceId: resource.id,
            language: lang,
            title: `${resource.title} (${lang.toUpperCase()})`,
            fileName: `${resource.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${lang}.pdf`,
            fileUrl: "/uploads/sample.pdf",
            fileSize: 102400,
          },
        })
      }
    }
  }
  console.log("Resource files created for all resources")

  console.log("Seeding complete!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
