import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/categories/[id]">
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  await prisma.category.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
