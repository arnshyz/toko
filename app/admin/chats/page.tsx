import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function resolveSenderLabel(sender: string, userMap: Map<string, { name: string; email: string }>, buyerLabel: string) {
  if (sender.startsWith("seller:")) {
    const id = sender.split(":")[1] ?? "";
    const info = userMap.get(id);
    return info ? `Seller • ${info.name}` : "Seller";
  }
  if (sender.startsWith("admin:")) {
    const id = sender.split(":")[1] ?? "";
    const info = userMap.get(id);
    return info ? `Admin • ${info.name}` : "Admin";
  }
  return `Buyer • ${buyerLabel}`;
}

export default async function AdminChatsPage() {
  const session = await getSession();
  const user = session.user;
  if (!user || !user.isAdmin) return <div>Admin only.</div>;

  const threads = await prisma.chatThread.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (threads.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Admin: Monitor Chat</h1>
        <div className="bg-white border rounded p-6 text-sm text-gray-500">Belum ada percakapan.</div>
      </div>
    );
  }

  const orderIds = threads.map((thread) => thread.orderId);
  const sellerAndAdminIds = Array.from(
    new Set(
      threads
        .flatMap((thread) =>
          thread.messages
            .map((message) => message.sender)
            .filter((sender) => sender.startsWith("seller:") || sender.startsWith("admin:"))
            .map((sender) => sender.split(":")[1] ?? ""),
        )
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const [orders, relatedUsers] = await Promise.all([
    prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, orderCode: true, buyerName: true, buyerPhone: true },
    }),
    prisma.user.findMany({
      where: {
        id: { in: sellerAndAdminIds },
      },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const orderMap = new Map(orders.map((order) => [order.id, order]));
  const userMap = new Map(relatedUsers.map((item) => [item.id, { name: item.name, email: item.email }]));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin: Monitor Chat</h1>
      {threads.map((thread) => {
        const order = orderMap.get(thread.orderId);
        const buyerLabel = [order?.buyerName?.trim(), order?.buyerPhone?.trim()].filter(Boolean).join(" • ") || "-";

        return (
          <div key={thread.id} className="rounded border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-sm text-gray-600">
              <div>
                <div className="font-semibold text-gray-900">Order #{order?.orderCode ?? thread.orderId}</div>
                <div className="text-xs text-gray-500">{buyerLabel}</div>
              </div>
              {order?.orderCode ? (
                <a className="link text-xs" href={`/order/${order.orderCode}`} target="_blank" rel="noreferrer">
                  Lihat detail pesanan
                </a>
              ) : null}
            </div>
            <div className="mt-3 space-y-2">
              {thread.messages.length === 0 ? (
                <div className="text-xs text-gray-500">Belum ada pesan.</div>
              ) : (
                thread.messages.map((message) => (
                  <div key={message.id} className="rounded border bg-gray-50 p-3 text-xs">
                    <div className="mb-1 font-semibold text-gray-700">
                      {resolveSenderLabel(message.sender, userMap, buyerLabel)}
                      <span className="ml-2 font-normal text-gray-400">
                        {new Date(message.createdAt).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="text-gray-800">{message.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
