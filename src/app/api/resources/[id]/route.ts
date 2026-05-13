import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/resources/[id]">
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  const resource = await prisma.resource.findUnique({ where: { id } })
  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 })
  }

  await prisma.resource.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/resources/[id]">
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const body = await request.json()

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        categoryId: body.categoryId,
        featured: body.featured,
      },
    })

    return NextResponse.json(resource)
  } catch {
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    )
  }
}
