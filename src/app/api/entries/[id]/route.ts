import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { countWords, deriveTitle } from "@/lib/types";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const entry = await prisma.journalEntry.findUnique({
    where: { id: params.id },
  });
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(entry);
}

export async function PATCH(req: Request, { params }: Params) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.content === "string") {
    data.content = body.content;
    data.wordCount = countWords(body.content);
    data.title = body.title?.trim() || deriveTitle(body.content);
  }
  if (typeof body.mood === "string") data.mood = body.mood;
  if (typeof body.prompt === "string" || body.prompt === null)
    data.prompt = body.prompt;

  const entry = await prisma.journalEntry
    .update({ where: { id: params.id }, data })
    .catch(() => null);

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(entry);
}

export async function DELETE(_req: Request, { params }: Params) {
  const deleted = await prisma.journalEntry
    .delete({ where: { id: params.id } })
    .catch(() => null);

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
