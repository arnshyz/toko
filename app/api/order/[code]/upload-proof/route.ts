import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.redirect(new URL(`/order/${params.code}`, req.url));
  const buf = Buffer.from(await file.arrayBuffer());
  await prisma.order.update({
    where: { orderCode: params.code },
    data: {
      proofImage: buf,
      proofMimeType: file.type,
      logs: { create: { actor: 'buyer:unknown', action: 'upload_proof', note: file.name } }
    }
  });
  return NextResponse.redirect(new URL(`/order/${params.code}`, req.url));
}
