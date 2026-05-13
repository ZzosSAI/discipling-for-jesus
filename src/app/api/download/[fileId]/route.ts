import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { readFile } from "fs/promises"
import path from "path"

export async function GET(
  _request: Request,
  context: RouteContext<"/api/download/[fileId]">
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json(
      { error: "Login required to download" },
      { status: 401 }
    )
  }

  const { fileId } = await context.params

  const file = await prisma.resourceFile.findUnique({
    where: { id: fileId },
    include: { resource: true },
  })

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  await prisma.download.create({
    data: {
      userId: session.user.id!,
      resourceId: file.resourceId,
      fileId: file.id,
    },
  })

  const filePath = path.join(process.cwd(), "public", file.fileUrl.replace(/^\//, ""))

  try {
    const buffer = await readFile(filePath)

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${file.fileName}"`,
        "Content-Length": String(buffer.byteLength),
      },
    })
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 })
  }
}
