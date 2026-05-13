import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const resourceId = formData.get("resourceId") as string
    const language = formData.get("language") as string
    const fileTitle = formData.get("fileTitle") as string
    const fileDescription = (formData.get("fileDescription") as string) || ""
    const file = formData.get("file") as File

    if (!resourceId || !language || !file || !fileTitle) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      )
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })

    const uniqueName = `${Date.now()}-${file.name}`
    const filePath = path.join(uploadDir, uniqueName)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const resourceFile = await prisma.resourceFile.create({
      data: {
        resourceId,
        language,
        title: fileTitle,
        description: fileDescription || null,
        fileName: file.name,
        fileUrl: `/uploads/${uniqueName}`,
        fileSize: bytes.byteLength,
      },
    })

    return NextResponse.json(resourceFile, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}
