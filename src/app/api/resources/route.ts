import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

export async function GET() {
  const resources = await prisma.resource.findMany({
    include: {
      category: true,
      files: {
        select: {
          id: true,
          language: true,
          title: true,
          fileName: true,
          fileSize: true,
        },
      },
      _count: { select: { downloads: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(resources)
}

const createResourceSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string().min(1),
  featured: z.boolean().optional(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = createResourceSchema.parse(body)

    const resource = await prisma.resource.create({
      data: {
        ...data,
        uploadedById: session.user.id!,
      },
    })

    return NextResponse.json(resource, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
