import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { countWords, deriveTitle } from "@/lib/types";

export async function GET() {
  const entries = await prisma.journalEntry.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.content !== "string" || !body.content.trim()) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  const content: string = body.content;
  const entry = await prisma.journalEntry.create({
    data: {
      content,
      title: body.title?.trim() || deriveTitle(content),
      mood: typeof body.mood === "string" ? body.mood : "smile",
      prompt: typeof body.prompt === "string" ? body.prompt : null,
      wordCount: countWords(content),
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
